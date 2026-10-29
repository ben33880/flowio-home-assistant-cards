import { LitElement, html, css, nothing } from 'lit';
import { available, FEATURES, ROLES, normalizeConfig, resolveTreatment, TREATMENT_LABELS, type Hass, type PoolConfig, type Role } from './model';

class FlowioPoolCard extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, busy: { state: true }, error: { state: true } };
  declare hass?: Hass;
  declare private config?: PoolConfig;
  private busy = '';
  private error = '';
  static getConfigElement() { return document.createElement('flowio-pool-card-editor'); }
  static getStubConfig() { return normalizeConfig({}); }
  setConfig(input: unknown) { this.config = normalizeConfig(input); }
  getCardSize() { return 7; }
  private state(role: Role) { const id = this.config?.entities[role]; return id ? this.hass?.states[id] : undefined; }
  private more(role: Role) {
    const entityId = this.config?.entities[role];
    if (entityId) this.dispatchEvent(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
  }
  private measure(role: Role, label: string) {
    if (!this.config?.entities[role]) return nothing;
    const state = this.state(role);
    const unit = state?.attributes.unit_of_measurement;
    return html`<button class=measure @click=${() => this.more(role)}><span class=muted>${label}</span><strong>${available(state) ? state.state : 'Indisponible'} ${available(state) && typeof unit === 'string' ? html`<small>${unit}</small>` : nothing}</strong></button>`;
  }
  private control(role: Role, label: string, locked = false) {
    const id = this.config?.entities[role];
    const state = this.state(role);
    const enabled = !!id && available(state) && ['on', 'off'].includes(state.state);
    const on = state?.state === 'on';
    return html`<div class=control><button class=details ?disabled=${!id} @click=${() => this.more(role)}><span>${label}</span><span class=muted>${!id ? 'À configurer' : !enabled ? 'Indisponible' : on ? 'Activé' : 'Arrêté'}</span></button><button class=${on ? 'action on' : 'action'} ?disabled=${!enabled || !!this.busy || locked} aria-label=${`${on ? 'Arrêter' : 'Démarrer'} ${label}`} @click=${() => this.toggle(role)}>${this.busy === role ? '…' : on ? 'Arrêter' : 'Démarrer'}</button></div>`;
  }
  private async toggle(role: Role) {
    const config = this.config, hass = this.hass;
    if (!config || !hass || this.busy) return;
    const id = config.entities[role], state = this.state(role);
    if (!id || !available(state) || !['on', 'off'].includes(state.state)) return;
    const treatment = resolveTreatment(config, hass);
    if (['disinfection_pump', 'electrolyzer'].includes(role) && (treatment.mismatch || !treatment.selected)) return;
    if (role === 'ph_pump' || role === 'disinfection_pump' || role === 'filling') {
      if (!window.confirm(`Commander ${state.attributes.friendly_name ?? id} ? Cette commande peut modifier le mode automatique de Flow.io.`)) return;
    }
    this.busy = role; this.error = '';
    try { await hass.callService(id.split('.')[0], state.state === 'on' ? 'turn_off' : 'turn_on', { entity_id: id }); }
    catch { this.error = 'Commande refusée ou échouée. Vérifier les droits, la disponibilité et les sécurités Flow.io.'; }
    finally { this.busy = ''; }
  }
  render() {
    const c = this.config, hass = this.hass;
    if (!c || !hass) return html`<ha-card><div class=body>En attente de Home Assistant…</div></ha-card>`;
    const treatment = resolveTreatment(c, hass);
    const alarm = this.state('alarm_active');
    const alarmKnown = available(alarm) && ['on', 'off'].includes(alarm.state);
    const alarms = alarmKnown ? (alarm.state === 'on' ? 'Alarme active' : 'Aucune alarme signalée') : 'État des alarmes non disponible';
    return html`<ha-card><div class=body>
      <header><div><div class=eyebrow>FLOW.IO</div><h2>${c.title ?? 'Piscine'}</h2></div><ha-icon icon=mdi:pool></ha-icon></header>
      <button class=${alarm?.state === 'on' ? 'status alert' : 'status'} ?disabled=${!c.entities.alarm_active} @click=${() => this.more('alarm_active')}>${alarms}${available(this.state('alarm_count')) ? html` · ${this.state('alarm_count')!.state}` : nothing}</button>
      ${treatment.mismatch ? html`<p class=warning role=alert>Le traitement affiché ne correspond pas à celui annoncé par Flow.io. Commandes de désinfection désactivées.</p>` : nothing}
      ${this.error ? html`<p class=warning role=alert>${this.error}</p>` : nothing}
      <h3>Mesures</h3><div class=grid>${this.measure('water_temperature', 'Eau')}${this.measure('air_temperature', 'Air')}${this.measure('ph', 'pH')}${treatment.selected !== 'oxygen' && treatment.selected !== 'none' ? this.measure('orp', 'ORP') : nothing}${this.measure('pressure', 'Pression')}</div>
      ${!['water_temperature', 'air_temperature', 'ph', 'orp', 'pressure'].some(key => c.entities[key as Role]) ? html`<p class=muted>Associer les capteurs dans l’éditeur de la carte.</p>` : nothing}
      ${c.features.filtration ? html`<h3>Filtration</h3>${this.control('filtration', 'Pompe de filtration')}` : nothing}
      ${c.features.ph_control ? html`<h3>Correction pH</h3><div class=grid>${this.measure('ph_setpoint', 'Consigne pH')}${c.show_tanks ? this.measure('ph_tank', 'Cuve pH · estimation') : nothing}</div>${this.control('ph_pump', 'Pompe pH')}` : nothing}
      <h3>Désinfection</h3><p class=muted>${treatment.selected ? TREATMENT_LABELS[treatment.selected] : 'Traitement inconnu : associer le sélecteur Flow.io ou choisir un mode manuel.'}</p>
      ${treatment.selected === 'chlorine' ? html`<div class=grid>${this.measure('orp_setpoint', 'Consigne ORP')}</div>${this.control('disinfection_pump', 'Pompe chlore / brome', treatment.mismatch)}` : nothing}
      ${treatment.selected === 'electrolysis' ? html`<div class=grid>${this.measure('orp_setpoint', 'Consigne ORP')}</div>${this.control('electrolyzer', 'Électrolyseur', treatment.mismatch)}` : nothing}
      ${treatment.selected === 'oxygen' ? html`<p class=muted>Dosage O₂ piloté par Flow.io. Planification détaillée prévue dans une version suivante.</p>${this.control('disinfection_pump', 'Pompe oxygène actif', treatment.mismatch)}` : nothing}
      ${c.show_tanks && ['chlorine', 'oxygen'].includes(treatment.selected ?? '') ? html`<div class=grid>${this.measure('disinfection_tank', 'Cuve traitement · estimation')}</div>` : nothing}
      ${c.features.heating || c.features.robot || c.features.lighting || c.features.filling ? html`<h3>Équipements</h3>` : nothing}
      ${c.features.heating ? this.control('heater', 'Chauffage') : nothing}${c.features.robot ? this.control('robot', 'Robot') : nothing}${c.features.lighting ? this.control('lighting', 'Éclairage') : nothing}${c.features.filling ? this.control('filling', 'Remplissage') : nothing}
      <footer>Les sécurités restent gérées par Flow.io. Un état de sortie n’est pas une confirmation physique.</footer>
    </div></ha-card>`;
  }
  static styles = css`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,inherit)}
    .body{padding:24px}header{display:flex;align-items:center;justify-content:space-between;gap:16px}h2{font-size:1.6rem;margin:4px 0 18px;line-height:1.2}h3{font-size:1rem;margin:24px 0 12px}ha-icon{color:var(--primary-color);--mdc-icon-size:36px}.eyebrow{font-size:.7rem;letter-spacing:.16em;color:var(--secondary-text-color)}
    button{font:inherit;color:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}button:disabled{cursor:default;opacity:.6}.muted,footer{color:var(--secondary-text-color);font-size:.85rem}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,135px),1fr));gap:12px}
    .measure{min-height:88px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;background:var(--secondary-background-color,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);padding:16px;overflow-wrap:anywhere}strong{font-size:1.4rem;font-weight:600}small{font-size:.8rem;font-weight:400}
    .status{display:block;text-align:left;background:transparent;border:1px solid var(--divider-color);border-radius:12px;padding:12px;width:100%;font-size:.85rem}.status:disabled{opacity:1}.alert,.warning{color:var(--error-color)}.warning{border-inline-start:3px solid var(--error-color);padding:8px 12px;font-size:.85rem}
    .control{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider-color)}.details{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;text-align:left;border:0;background:none;padding:6px 0;overflow-wrap:anywhere}.action{border:1px solid var(--divider-color);border-radius:20px;background:transparent;padding:9px 14px;min-height:44px}.on{color:var(--primary-color);border-color:var(--primary-color)}footer{margin-top:20px;line-height:1.5;font-size:.75rem}
    @media(max-width:400px){.body{padding:16px}.action{padding:9px 10px}}
  `;
}

class FlowioPoolCardEditor extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true } };
  declare hass?: Hass;
  declare private config?: PoolConfig;
  setConfig(input: unknown) { this.config = normalizeConfig(input); }
  private changed(event: CustomEvent) {
    event.stopPropagation();
    const config = normalizeConfig(event.detail.value);
    this.config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }
  private label(field: { name: string }) { return ({ title: 'Titre', treatment: 'Traitement affiché (ne modifie pas le contrôleur)', features: 'Équipements installés', entities: 'Association des entités', show_tanks: 'Afficher les cuves estimées', ...Object.fromEntries(FEATURES), ...Object.fromEntries(ROLES.map(([key, label]) => [key, label])) } as Record<string, string>)[field.name] ?? field.name; }
  render() {
    if (!this.config || !this.hass) return nothing;
    const schema = [
      { name: 'title', selector: { text: {} } },
      { name: 'treatment', selector: { select: { mode: 'dropdown', options: [{ value: 'auto', label: 'Automatique · suivre Flow.io' }, { value: 'chlorine', label: 'Chlore / Brome liquide' }, { value: 'electrolysis', label: 'Électrolyse' }, { value: 'oxygen', label: 'Oxygène actif' }, { value: 'none', label: 'Aucun traitement' }] } } },
      { name: 'features', type: 'expandable', schema: FEATURES.map(([name]) => ({ name, selector: { boolean: {} } })) },
      { name: 'show_tanks', selector: { boolean: {} } },
      { name: 'entities', type: 'expandable', schema: ROLES.map(([name, , domain]) => ({ name, selector: { entity: { domain } } })) }
    ];
    return html`<p>Choisir les éléments installés puis leurs entités. Les identifiants ne sont pas devinés. Le traitement manuel ne change pas la configuration Flow.io.</p><ha-form .hass=${this.hass} .data=${this.config} .schema=${schema} .computeLabel=${(field: { name: string }) => this.label(field)} @value-changed=${this.changed}></ha-form>`;
  }
  static styles = css`:host{display:block}p{color:var(--secondary-text-color);line-height:1.5}`;
}
if (!customElements.get('flowio-pool-card')) customElements.define('flowio-pool-card', FlowioPoolCard);
if (!customElements.get('flowio-pool-card-editor')) customElements.define('flowio-pool-card-editor', FlowioPoolCardEditor);
const registry = window as Window & { customCards?: Array<Record<string, unknown>> };
registry.customCards ??= [];
if (!registry.customCards.some(card => card.type === 'flowio-pool-card')) registry.customCards.push({ type: 'flowio-pool-card', name: 'Flow.io Piscine', description: 'Piscine configurable : traitement, mesures et équipements.', preview: true });
