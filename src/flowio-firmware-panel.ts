import { LitElement, css, html, nothing, type PropertyValues } from 'lit';
import { available, type Hass } from './model';
import {
  DEVICE_METRIC_DEFINITIONS,
  OPERATION_DEFINITIONS,
  calculatedValueId,
  canSelectOverride,
  deviceMetricId,
  operationEntityId,
  overrideEntityIds,
  overrideOptions,
  type CalculatedValue,
  type DeviceMetric,
  type Operation
} from './firmware-model';
import { ensureHaElements } from './ha-controls';

class FlowioFirmwarePanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    prefix: { type: String },
    calculatedValues: { attribute: false },
    deviceMetrics: { attribute: false },
    deviceSlot: { type: Number },
    operations: { attribute: false },
    inlineOperations: { attribute: false },
    busy: { state: true },
    error: { state: true },
    overrideDuration: { state: true },
    overrideTarget: { state: true },
    overrideOpened: { state: true },
    overrideConfirmation: { state: true },
    ready: { state: true }
  };

  declare hass?: Hass;
  prefix = '';
  calculatedValues: readonly CalculatedValue[] = [];
  deviceMetrics: readonly DeviceMetric[] = [];
  deviceSlot = 0;
  operations: readonly Operation[] = [];
  inlineOperations: readonly Operation[] = [];
  private busy = '';
  private error = '';
  private overrideDuration?: number;
  private overrideTarget = '';
  private overrideOpened = false;
  private overrideConfirmation?: 'on' | 'off' | 'release';
  private ready = false;
  private uiGeneration = 0;

  connectedCallback() {
    super.connectedCallback();
    const token = ++this.uiGeneration;
    void ensureHaElements(['ha-dialog', 'ha-button', 'ha-form', 'ha-alert'])
      .then(() => {
        if (this.isConnected && token === this.uiGeneration) this.ready = true;
      })
      .catch(error => {
        console.error('[flowio] Contrôles natifs indisponibles pour le panneau firmware', error);
        if (this.isConnected && token === this.uiGeneration) {
          this.error = 'Composants natifs Home Assistant indisponibles. Recharger le tableau de bord.';
        }
      });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.uiGeneration++;
    this.ready = false;
    this.overrideOpened = false;
  }

  protected willUpdate(changed: PropertyValues) {
    if (changed.has('prefix')) {
      this.overrideOpened = false;
      this.overrideTarget = '';
      this.overrideDuration = undefined;
      this.overrideConfirmation = undefined;
      this.error = '';
    }
  }

  private isActionPanelOperation(operation: Operation) {
    return !operation.startsWith('reset_')
      && !['timed_override', 'refill_ph', 'refill_disinfection'].includes(operation)
      && !this.inlineOperations.includes(operation);
  }

  private actionAvailable(entityId: string) {
    const state = this.hass?.states[entityId];
    return !!state && !['unavailable', ''].includes(state.state);
  }

  private more(entityId: string) {
    if (this.hass?.states[entityId]) {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true
      }));
    }
  }

  private async invoke(domain: string, service: string, entityId: string, data: Record<string, unknown> = {}) {
    const hass = this.hass;
    if (!hass || !this.actionAvailable(entityId) || this.busy) return false;
    this.busy = entityId;
    this.error = '';
    try {
      await hass.callService(domain, service, { ...data, entity_id: entityId });
      return true;
    } catch (error) {
      console.error('[flowio] Action firmware impossible', error);
      this.error = `Action refusée ou échouée pour ${entityId}. Vérifier les droits et la disponibilité du contrôleur.`;
      return false;
    } finally {
      this.busy = '';
    }
  }

  async runOperation(operation: Operation) {
    if (!this.operations.includes(operation) || this.busy) return;
    const definition = OPERATION_DEFINITIONS[operation];
    const entityId = operationEntityId(this.prefix, operation);
    if (!this.actionAvailable(entityId)) return;
    if (!window.confirm(`${definition.confirm} Flow.io conserve la responsabilité des sécurités.`)) return;
    await this.invoke('button', 'press', entityId);
  }

  private openOverride() {
    if (!this.ready) return;
    const ids = overrideEntityIds(this.prefix);
    const selected = this.hass?.states[ids.target]?.state ?? '';
    const duration = Number(this.hass?.states[ids.duration]?.state);
    this.overrideTarget = canSelectOverride(this.hass, this.prefix, selected) ? selected : overrideOptions(this.hass, this.prefix)[0] ?? '';
    this.overrideDuration = Number.isInteger(duration) && duration >= 1 && duration <= 1440 ? duration : undefined;
    this.overrideConfirmation = undefined;
    this.error = '';
    this.overrideOpened = true;
  }

  private closeOverride() {
    this.overrideOpened = false;
    this.overrideConfirmation = undefined;
  }

  private requestOverride(action: 'on' | 'off' | 'release') {
    this.error = '';
    this.overrideConfirmation = action;
  }

  private async confirmOverride() {
    const action = this.overrideConfirmation;
    if (!action) return;
    this.overrideConfirmation = undefined;
    await this.executeOverride(action);
  }

  private cancelOverride() {
    this.overrideConfirmation = undefined;
  }

  private async updateOverrideForm(event: CustomEvent<{ value?: Record<string, unknown> }>) {
    event.stopPropagation();
    const values = event.detail?.value;
    if (!values) return;
    const form = event.currentTarget as HTMLElement & { data: Record<string, unknown> };
    form.data = values;
    const value = Number(values.duration);
    if (Number.isInteger(value) && value >= 1 && value <= 1440) {
      if (value !== this.overrideDuration) this.overrideConfirmation = undefined;
      this.overrideDuration = value;
      this.error = '';
    } else {
      this.error = 'La durée du forçage doit être comprise entre 1 et 1 440 minutes.';
    }
    const target = values.target;
    if (typeof target === 'string' && target !== this.overrideTarget && canSelectOverride(this.hass, this.prefix, target)) {
      const previous = this.overrideTarget;
      this.overrideTarget = target;
      this.overrideConfirmation = undefined;
      const changed = await this.invoke('select', 'select_option', overrideEntityIds(this.prefix).target, { option: target });
      if (!changed) this.overrideTarget = previous;
    }
  }

  private async executeOverride(action: 'on' | 'off' | 'release') {
    const ids = overrideEntityIds(this.prefix);
    const target = this.overrideTarget || this.hass?.states[ids.target]?.state;
    const status = this.hass?.states[ids.state];
    const entityId = ids[action];
    if (!target || !canSelectOverride(this.hass, this.prefix, target) || !this.actionAvailable(entityId)) return;
    if (action !== 'release' && status?.attributes.override_available !== true) return;
    if (action === 'release' && status?.attributes.control_mode === 'guided') return;
    const duration = this.overrideDuration ?? Number(this.hass?.states[ids.duration]?.state);
    if (action !== 'release' && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
      this.error = 'Définir une durée valide entre 1 et 1 440 minutes.';
      return;
    }
    this.error = '';
    if (action !== 'release' && Number(this.hass?.states[ids.duration]?.state) !== duration) {
      if (!await this.invoke('number', 'set_value', ids.duration, { value: duration })) return;
    }
    if (await this.invoke('button', 'press', entityId)) this.closeOverride();
  }

  private operationsView() {
    const actions = this.operations.filter(operation => this.isActionPanelOperation(operation));
    const showOverride = this.operations.includes('timed_override');
    if (!actions.length && !showOverride) return nothing;
    const h = this.hass;
    const ids = overrideEntityIds(this.prefix);
    const target = h?.states[ids.target];
    const duration = h?.states[ids.duration];
    const status = h?.states[ids.state];
    const options = overrideOptions(h, this.prefix);
    const currentDuration = this.overrideDuration ?? Number(duration?.state);
    const forced = status?.attributes.control_mode !== 'guided' && !!status;
    return html`
      <div class="operations-panel" data-panel="operations">
        ${actions.length ? html`<div class="action-grid">${actions.map(operation => {
          const definition = OPERATION_DEFINITIONS[operation];
          const entityId = operationEntityId(this.prefix, operation);
          const state = h?.states[entityId];
          return html`<button type="button" class="action-button" data-operation=${operation}
            ?disabled=${!this.actionAvailable(entityId) || !!this.busy}
            @click=${() => this.runOperation(operation)}>${definition.label}
            <small>${!state ? 'Entité absente' : !available(state) ? 'Indisponible' : 'Confirmer avant exécution'}</small></button>`;
        })}</div>` : nothing}
        ${showOverride ? html`
          <ha-button class="override-trigger" data-open-override appearance="outlined"
            aria-haspopup="dialog" aria-expanded=${this.overrideOpened ? 'true' : 'false'}
            .disabled=${!this.ready} .accessibleLabel=${'Ouvrir le forçage temporaire'}
            @click=${() => this.openOverride()}>
            <ha-icon slot="start" icon="mdi:timer-cog-outline" aria-hidden="true"></ha-icon>
            Forçage temporaire
            <span class="override-trigger-state">${forced ? 'Actif' : 'Pilotage guidé'}</span>
          </ha-button>
          <ha-dialog class="override-dialog" data-panel="timed-override"
            .open=${this.overrideOpened && this.ready}
            .headerTitle=${'Forçage temporaire'}
            .heading=${'Forçage temporaire'}
            @closed=${(event: Event) => { if (event.target === event.currentTarget) this.closeOverride(); }}>
            <div class="override-content">
              <p class="override-intro">Choisir un équipement et la durée du forçage. Flow.io conserve la responsabilité des sécurités.</p>
              <ha-form class="override-form" .hass=${h}
                .data=${{ target: this.overrideTarget || target?.state || '', duration: currentDuration }}
                .disabled=${!this.ready || !available(target) || !available(duration) || !options.length || !!this.busy}
                .schema=${[
                  { name: 'target', selector: { select: { mode: 'dropdown', options } } },
                  { name: 'duration', selector: { number: { min: 1, max: 1440, step: 1, mode: 'box' } } }
                ]}
                .computeLabel=${(field: { name: string }) => field.name === 'target' ? 'Équipement' : 'Durée (minutes)'}
                @value-changed=${(event: CustomEvent<{ value?: Record<string, unknown> }>) => this.updateOverrideForm(event)}>
              </ha-form>
            <p class="override-state" data-state=${status?.state ?? 'missing'}>
              ${!status ? 'État du forçage absent' : !available(status) ? 'État du forçage indisponible' : forced
                ? `Forçage actif · ${String(status.attributes.control_mode ?? status.state)}`
                : 'Pilotage guidé'}
              ${Number(status?.attributes.override_remaining_s) > 0
                ? html` · ${Math.ceil(Number(status?.attributes.override_remaining_s) / 60)} min restantes`
                : nothing}
            </p>
              <div class="override-actions">
              ${(['on', 'off', 'release'] as const).map(action => {
                const entityId = ids[action];
                const entity = h?.states[entityId];
                const enabled = this.actionAvailable(entityId) && !!this.overrideTarget && options.includes(this.overrideTarget) &&
                  (action === 'release' ? forced : status?.attributes.override_available === true);
                const label = action === 'on' ? 'Forcer en marche' : action === 'off' ? 'Forcer à l’arrêt' : 'Terminer le forçage';
                return html`<ha-button class="override-action" data-override=${action}
                  appearance=${action === 'on' ? 'accent' : action === 'off' ? 'outlined' : 'plain'}
                  .disabled=${!this.ready || !enabled || !!this.busy}
                  .accessibleLabel=${label} @click=${() => this.requestOverride(action)}>
                  ${label}
                  ${!entity || !this.actionAvailable(entityId) ? html`<small>${!entity ? 'Entité absente' : 'Indisponible'}</small>` : nothing}
                </ha-button>`;
              })}
            </div>
            ${this.overrideConfirmation ? html`
              <ha-alert class="override-confirm-prompt" alert-type="warning">
                Confirmer « ${this.overrideConfirmation === 'on' ? 'Forcer en marche' : this.overrideConfirmation === 'off' ? 'Forcer à l’arrêt' : 'Terminer le forçage'} »
                pour ${this.overrideTarget}${this.overrideConfirmation === 'release' ? '' : ` pendant ${currentDuration} min`} ?
                Flow.io conserve la responsabilité des sécurités.
              </ha-alert>
              <div class="override-confirmation">
                <ha-button class="override-action" data-cancel-override appearance="plain"
                  .accessibleLabel=${'Annuler le forçage'} @click=${() => this.cancelOverride()}>Annuler</ha-button>
                <ha-button class="override-action" data-confirm-override appearance="accent"
                  .disabled=${!!this.busy} .accessibleLabel=${'Confirmer le forçage'}
                  @click=${() => this.confirmOverride()}>Confirmer</ha-button>
              </div>` : nothing}
              ${this.error ? html`<ha-alert class="override-error" alert-type="error">${this.error}</ha-alert>` : nothing}
              <p class="note">La sélection est commune à Home Assistant. L’acceptation d’une commande ne confirme pas la marche réelle. Utiliser uniquement avec un contrôleur Flow.io compatible.</p>
            </div>
          </ha-dialog>` : nothing}
      </div>`;
  }

  private valuesView() {
    if (!this.calculatedValues.length && !this.deviceMetrics.length) return nothing;
    return html`<section class="panel" data-panel="values">
      <h3><ha-icon icon="mdi:chart-box-outline" aria-hidden="true"></ha-icon>Valeurs et télémétrie</h3>
      <div class="value-grid">
        ${this.calculatedValues.map(value => {
          const entityId = calculatedValueId(this.prefix, value);
          return this.valueTile(entityId, `Valeur calculée ${value.toUpperCase()}`);
        })}
        ${this.deviceMetrics.map(metric => {
          const entityId = deviceMetricId(this.prefix, this.deviceSlot, metric);
          return this.valueTile(entityId, DEVICE_METRIC_DEFINITIONS[metric].label);
        })}
      </div>
      ${this.deviceMetrics.length ? html`<p class="note">Télémétrie du slot équipement ${this.deviceSlot}. Vérifier l’affectation du slot dans le firmware.</p>` : nothing}
    </section>`;
  }

  private valueTile(entityId: string, label: string) {
    const state = this.hass?.states[entityId];
    const unit = typeof state?.attributes.unit_of_measurement === 'string' ? state.attributes.unit_of_measurement : '';
    const name = typeof state?.attributes.friendly_name === 'string' ? state.attributes.friendly_name : label;
    return html`<button type="button" class="value-tile" data-entity=${entityId}
      data-available=${available(state) ? 'true' : 'false'} ?disabled=${!state}
      @click=${() => this.more(entityId)}>
      <span>${name}</span><strong>${available(state) ? state.state : !state ? 'Entité absente' : 'Indisponible'}${available(state) && unit ? html`<small> ${unit}</small>` : nothing}</strong>
    </button>`;
  }

  render() {
    const hasPanel = this.operations.some(operation =>
      operation === 'timed_override' || this.isActionPanelOperation(operation)
    ) || this.calculatedValues.length || this.deviceMetrics.length;
    if (!hasPanel) return nothing;
    return html`<div class="firmware-panels">
      ${this.error && !this.overrideOpened ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
      ${this.operationsView()}${this.valuesView()}
    </div>`;
  }

  static styles = css`
    :host{display:block;min-width:0}.firmware-panels{display:flex;flex-wrap:wrap;align-items:flex-start;gap:14px;margin-top:14px}
    .panel{min-width:0;padding:14px 16px;border:1px solid var(--divider-color);border-radius:18px;background:var(--fio-surface)}
    .operations-panel{display:grid;flex:0 1 auto;align-content:start;gap:8px;min-width:0;padding:0;border:0;background:transparent}
    .panel[data-panel=values]{flex:1 1 320px}
    h3{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:.95rem;font-weight:650}h3 ha-icon{color:var(--fio-water)}
    h4{margin:0 0 10px;font-size:.84rem}.action-grid,.value-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px}
    .action-button,.value-tile{font:inherit;color:var(--primary-text-color);background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:12px;padding:10px;text-align:left}
    .action-button{display:flex;flex-direction:column;gap:4px;cursor:pointer;font-size:.78rem;font-weight:600}.action-button small{font-size:.64rem;font-weight:400;color:var(--secondary-text-color)}
    button:disabled{opacity:.55;cursor:not-allowed}.value-tile{display:flex;flex-direction:column;gap:4px;cursor:pointer;min-width:0}
    .value-tile span{font-size:.68rem;color:var(--secondary-text-color)}.value-tile strong{font-size:.85rem;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
    .value-tile small{font-size:.7rem;font-weight:400;color:var(--secondary-text-color)}
    .override-trigger{--ha-button-height:42px;display:flex;width:max-content;max-width:100%;justify-content:flex-start;margin:0;color:var(--primary-text-color)}
    .override-trigger::part(base){box-sizing:border-box;display:flex;justify-content:flex-start;gap:9px;max-width:100%;padding-inline:12px;border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);color:inherit;font:inherit;font-size:.78rem;font-weight:600}
    .override-trigger ha-icon{--mdc-icon-size:19px;color:var(--fio-water,var(--primary-color))}
    .override-trigger-state{margin-inline-start:auto;font-size:.68rem;font-weight:500;color:var(--secondary-text-color)}
    .override-content{display:grid;gap:14px;min-width:min(360px,calc(100vw - 64px));max-width:520px;padding-block:4px}
    .override-intro,.override-state{margin:0;font-size:.76rem;line-height:1.45}
    .override-state{padding:10px 12px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color);font-weight:600}
    .override-form{display:block;width:100%;min-width:0}
    .override-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}
    .override-action{--ha-button-height:40px}
    .override-action::part(base){min-width:112px;border-radius:11px}
    .override-action[appearance=accent]::part(base){font-weight:650}
    .override-action small{display:block;font-size:.62rem;font-weight:400;color:var(--secondary-text-color)}
    .override-error{font-size:.76rem}
    .override-confirm-prompt{font-size:.76rem;line-height:1.45}
    .override-confirmation{display:flex;justify-content:flex-end;gap:8px}
    .note{margin:0;font-size:.68rem;line-height:1.5;color:var(--secondary-text-color)}.error{grid-column:1/-1;color:var(--error-color);margin:0}
  `;
}

if (!customElements.get('flowio-firmware-panel')) customElements.define('flowio-firmware-panel', FlowioFirmwarePanel);
