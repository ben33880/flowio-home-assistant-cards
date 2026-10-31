import { LitElement, css, html, nothing } from 'lit';
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
  systemEntityId,
  type CalculatedValue,
  type DeviceMetric,
  type Operation
} from './firmware-model';

class FlowioFirmwarePanel extends LitElement {
  static properties = {
    hass: { attribute: false },
    prefix: { type: String },
    information: { attribute: false },
    calculatedValues: { attribute: false },
    deviceMetrics: { attribute: false },
    deviceSlot: { type: Number },
    operations: { attribute: false },
    busy: { state: true },
    error: { state: true },
    overrideDuration: { state: true }
  };

  declare hass?: Hass;
  prefix = '';
  information: readonly string[] = [];
  calculatedValues: readonly CalculatedValue[] = [];
  deviceMetrics: readonly DeviceMetric[] = [];
  deviceSlot = 0;
  operations: readonly Operation[] = [];
  private busy = '';
  private error = '';
  private overrideDuration?: number;

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
    if (!hass || !this.actionAvailable(entityId) || this.busy) return;
    this.busy = entityId;
    this.error = '';
    try {
      await hass.callService(domain, service, { ...data, entity_id: entityId });
    } catch (error) {
      console.error('[flowio] Action firmware impossible', error);
      this.error = `Action refusée ou échouée pour ${entityId}. Vérifier les droits et la disponibilité du contrôleur.`;
    } finally {
      this.busy = '';
    }
  }

  private async press(operation: Operation) {
    const definition = OPERATION_DEFINITIONS[operation];
    const entityId = operationEntityId(this.prefix, operation);
    if (!this.actionAvailable(entityId)) return;
    if (!window.confirm(`${definition.confirm} Flow.io conserve la responsabilité des sécurités.`)) return;
    await this.invoke('button', 'press', entityId);
  }

  private async setTarget(event: Event) {
    const entityId = overrideEntityIds(this.prefix).target;
    const target = (event.currentTarget as HTMLSelectElement).value;
    if (!canSelectOverride(this.hass, this.prefix, target)) return;
    await this.invoke('select', 'select_option', entityId, { option: target });
  }

  private async setDuration(event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (!Number.isInteger(value) || value < 1 || value > 1440) {
      this.error = 'La durée du forçage doit être comprise entre 1 et 1 440 minutes.';
      return;
    }
    this.overrideDuration = value;
    this.error = '';
  }

  private async override(action: 'on' | 'off' | 'release') {
    const ids = overrideEntityIds(this.prefix);
    const target = this.hass?.states[ids.target]?.state;
    const status = this.hass?.states[ids.state];
    const entityId = ids[action];
    if (!target || !canSelectOverride(this.hass, this.prefix, target) || !this.actionAvailable(entityId)) return;
    if (action !== 'release' && status?.attributes.override_available !== true) return;
    if (action === 'release' && status?.attributes.control_mode === 'guided') return;
    const actionLabel = action === 'on' ? 'Forcer en marche' : action === 'off' ? 'Forcer à l’arrêt' : 'Terminer le forçage';
    const duration = this.overrideDuration ?? Number(this.hass?.states[ids.duration]?.state);
    if (action !== 'release' && (!Number.isInteger(duration) || duration < 1 || duration > 1440)) {
      this.error = 'Définir une durée valide entre 1 et 1 440 minutes.';
      return;
    }
    if (!window.confirm(`${actionLabel} ${target}${action === 'release' ? '' : ` pendant ${duration} min`} ? Flow.io conserve la responsabilité des protections.`)) return;
    if (action !== 'release' && Number(this.hass?.states[ids.duration]?.state) !== duration) {
      await this.invoke('number', 'set_value', ids.duration, { value: duration });
      if (this.error) return;
    }
    await this.invoke('button', 'press', entityId);
  }

  private operationsView() {
    const actions = this.operations.filter(operation => operation !== 'timed_override');
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
      <section class="panel operations-panel" data-panel="operations">
        <h3><ha-icon icon="mdi:gesture-tap-button" aria-hidden="true"></ha-icon>Actions Flow.io</h3>
        ${actions.length ? html`<div class="action-grid">${actions.map(operation => {
          const definition = OPERATION_DEFINITIONS[operation];
          const entityId = operationEntityId(this.prefix, operation);
          const state = h?.states[entityId];
          return html`<button type="button" class="action-button" data-operation=${operation}
            ?disabled=${!this.actionAvailable(entityId) || !!this.busy}
            @click=${() => this.press(operation)}>${definition.label}
            <small>${!state ? 'Entité absente' : !available(state) ? 'Indisponible' : 'Confirmer avant exécution'}</small></button>`;
        })}</div>` : nothing}
        ${showOverride ? html`
          <div class="override" data-panel="timed-override">
            <h4>Forçage temporaire d’un équipement</h4>
            <label>Équipement
              <select .value=${target?.state ?? ''} ?disabled=${!available(target) || !!this.busy}
                @change=${(event: Event) => this.setTarget(event)}>
                ${!options.length ? html`<option value="">Aucune cible disponible</option>` : nothing}
                ${options.map(option => html`<option value=${option}>${option}</option>`)}
              </select>
            </label>
            <label>Durée (minutes)
              <input type="number" min="1" max="1440" step="1"
                .value=${Number.isInteger(currentDuration) ? String(currentDuration) : ''}
                ?disabled=${!available(duration) || !!this.busy}
                @change=${(event: Event) => this.setDuration(event)}>
            </label>
            <p class="override-state" data-state=${status?.state ?? 'missing'}>
              ${!status ? 'État du forçage absent' : !available(status) ? 'État du forçage indisponible' : forced
                ? `Forçage actif · ${String(status.attributes.control_mode ?? status.state)}`
                : 'Pilotage guidé'}
              ${Number(status?.attributes.override_remaining_s) > 0
                ? html` · ${Math.ceil(Number(status?.attributes.override_remaining_s) / 60)} min restantes`
                : nothing}
            </p>
            <div class="action-grid override-actions">
              ${(['on', 'off', 'release'] as const).map(action => {
                const entityId = ids[action];
                const entity = h?.states[entityId];
                const enabled = this.actionAvailable(entityId) && !!target && options.includes(target.state) &&
                  (action === 'release' ? forced : status?.attributes.override_available === true);
                return html`<button type="button" class="action-button" data-override=${action}
                  ?disabled=${!enabled || !!this.busy} @click=${() => this.override(action)}>
                  ${action === 'on' ? 'Forcer ON' : action === 'off' ? 'Forcer OFF' : 'Terminer'}
                  <small>${!entity ? 'Entité absente' : !this.actionAvailable(entityId) ? 'Indisponible' : ''}</small>
                </button>`;
              })}
            </div>
            <button type="button" class="more" ?disabled=${!duration}
              @click=${() => this.more(ids.duration)}>Régler la durée dans Home Assistant</button>
            <p class="note">La sélection est commune à Home Assistant. Un acquittement confirme la demande, pas la marche réelle. Utiliser uniquement sur un contrôleur Flow.io compatible.</p>
          </div>` : nothing}
      </section>`;
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

  private infoView(group: 'network' | 'system') {
    if (!this.information.includes(group)) return nothing;
    const entries = group === 'network'
      ? [['wifi_ip', 'Adresse IP'], ['wifi_mac', 'Adresse MAC'], ['wifi_rssi', 'Signal Wi-Fi']] as const
      : [['sys_upt_mn', 'Temps de fonctionnement'], ['sys_hp_free', 'Mémoire libre'], ['sys_hp_min_free', 'Mémoire minimale libre'], ['sys_hp_frag', 'Fragmentation mémoire']] as const;
    return html`<section class="panel" data-panel=${group}>
      <h3><ha-icon icon=${group === 'network' ? 'mdi:lan' : 'mdi:chip'} aria-hidden="true"></ha-icon>${group === 'network' ? 'Réseau Wi-Fi' : 'État système'}</h3>
      <div class="value-grid">${entries.map(([suffix, label]) => this.valueTile(systemEntityId(this.prefix, suffix), label))}</div>
    </section>`;
  }

  render() {
    const hasPanel = this.operations.length || this.calculatedValues.length || this.deviceMetrics.length ||
      this.information.includes('network') || this.information.includes('system');
    if (!hasPanel) return nothing;
    return html`<div class="firmware-panels">
      ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : nothing}
      ${this.operationsView()}${this.valuesView()}${this.infoView('network')}${this.infoView('system')}
    </div>`;
  }

  static styles = css`
    :host{display:block;min-width:0}.firmware-panels{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:14px;margin-top:14px}
    .panel{min-width:0;padding:14px 16px;border:1px solid var(--divider-color);border-radius:18px;background:var(--fio-surface)}
    h3{display:flex;align-items:center;gap:8px;margin:0 0 12px;font-size:.95rem;font-weight:650}h3 ha-icon{color:var(--fio-water)}
    h4{margin:0 0 10px;font-size:.84rem}.action-grid,.value-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,145px),1fr));gap:8px}
    .action-button,.value-tile,.more{font:inherit;color:var(--primary-text-color);background:var(--secondary-background-color);border:1px solid var(--divider-color);border-radius:12px;padding:10px;text-align:left}
    .action-button{display:flex;flex-direction:column;gap:4px;cursor:pointer;font-size:.78rem;font-weight:600}.action-button small{font-size:.64rem;font-weight:400;color:var(--secondary-text-color)}
    button:disabled,select:disabled,input:disabled{opacity:.55;cursor:not-allowed}.value-tile{display:flex;flex-direction:column;gap:4px;cursor:pointer;min-width:0}
    .value-tile span{font-size:.68rem;color:var(--secondary-text-color)}.value-tile strong{font-size:.85rem;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
    .value-tile small{font-size:.7rem;font-weight:400;color:var(--secondary-text-color)}.override{display:grid;gap:9px;margin-top:14px;padding-top:12px;border-top:1px solid var(--divider-color)}
    label{display:grid;gap:5px;font-size:.7rem;color:var(--secondary-text-color)}select,input{box-sizing:border-box;width:100%;min-height:38px;padding:7px 9px;border:1px solid var(--divider-color);border-radius:9px;background:var(--primary-background-color);color:var(--primary-text-color);font:inherit}
    .override-state{margin:0;font-size:.75rem;font-weight:600}.override-actions{grid-template-columns:repeat(3,minmax(0,1fr))}
    .more{justify-self:start;cursor:pointer;font-size:.7rem}.note{margin:7px 0 0;font-size:.64rem;line-height:1.45;color:var(--secondary-text-color)}.error{grid-column:1/-1;color:var(--error-color);margin:0}
  `;
}

if (!customElements.get('flowio-firmware-panel')) customElements.define('flowio-firmware-panel', FlowioFirmwarePanel);
