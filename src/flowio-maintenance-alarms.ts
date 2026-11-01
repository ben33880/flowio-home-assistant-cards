import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { ensureHaElements } from './ha-controls';
import { AlarmMaintenanceClient, type MaintenanceHass, type AlarmMaintenanceState, type MqttConnection } from './maintenance-mqtt';

class FlowioMaintenanceAlarms extends LitElement {
  static properties = { hass: { attribute: false }, active: { type: Boolean }, prefix: { type: String }, mqttTopic: { type: String }, disabled: { type: Boolean }, status: { state: true }, ready: { state: true }, uiError: { state: true } };
  declare hass?: MaintenanceHass;
  active = false;
  prefix = '';
  mqttTopic = '';
  disabled = false;
  private ready = false;
  private uiError = '';
  private uiGeneration = 0;
  private lastConnection?: MqttConnection;
  private client = new AlarmMaintenanceClient(() => this.hass, state => {
    this.status = state;
    this.dispatchEvent(new CustomEvent('maintenance-busy', { detail: { busy: state.loading || state.pending !== undefined }, bubbles: true, composed: true }));
  });
  private status: Readonly<AlarmMaintenanceState> = this.client.snapshot();

  connectedCallback() {
    super.connectedCallback();
    const token = ++this.uiGeneration;
    void ensureHaElements(['ha-button', 'ha-switch', 'ha-alert']).then(() => {
      if (this.isConnected && token === this.uiGeneration) this.ready = true;
    }).catch(() => {
      if (this.isConnected && token === this.uiGeneration) this.uiError = 'Contrôles Home Assistant indisponibles. Recharger le tableau de bord.';
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.uiGeneration++;
    this.ready = false;
    this.client.disconnect();
  }

  protected updated(changed: PropertyValues) {
    const connection = this.hass?.connection;
    const connectionChanged = connection !== this.lastConnection;
    this.lastConnection = connection;
    if (changed.has('active') || changed.has('mqttTopic') || changed.has('prefix') || changed.has('ready') || connectionChanged) {
      this.client.disconnect();
      if (this.isConnected && this.active && this.ready && this.mqttTopic.trim()) void this.client.connect(this.mqttTopic);
    }
  }

  private commandable() {
    return this.isConnected && this.active && this.ready && !this.disabled &&
      !!this.mqttTopic.trim() && this.status.root === this.mqttTopic && this.client.canCommand();
  }

  private read() {
    if (!this.isConnected || !this.active || !this.ready || this.disabled || this.status.pending !== undefined || !this.mqttTopic.trim()) return;
    void this.client.connect(this.mqttTopic);
  }

  private toggle(event: Event) {
    event.stopPropagation();
    const control = event.currentTarget as HTMLElement & { checked: boolean };
    const wanted = control.checked;
    control.checked = this.status.enabled === true;
    if (!this.commandable() || wanted === this.status.enabled) return;
    const root = this.status.root, prefix = this.prefix, connection = this.hass?.connection;
    const question = wanted
      ? `Réactiver l’évaluation globale des alarmes sur ${root} ?`
      : `Suspendre l’évaluation globale des alarmes sur ${root} ? Cette configuration n’acquitte pas les alarmes existantes et ne garantit pas la levée des interlocks. Réactiver les alarmes après maintenance.`;
    if (!window.confirm(question)) return;
    if (!this.commandable() || this.prefix !== prefix || this.status.root !== root || this.hass?.connection !== connection) return;
    void this.client.setEnabled(wanted);
  }

  render() {
    const state = this.status, pending = state.pending !== undefined, configured = !!this.mqttTopic.trim();
    const label = state.enabled === undefined ? 'État inconnu' : state.enabled ? 'Évaluation activée' : 'Évaluation désactivée';
    return html`
      <p class=note>Commande globale du moteur d’alarmes. La désactivation suspend son évaluation ; elle n’acquitte pas les alarmes mémorisées.</p>
      ${configured ? html`<p class=note>Topic configuré : <code data-mqtt-topic>${this.mqttTopic}</code></p>`
        : html`<ha-alert alert-type=warning>Configurer mqtt_topic dans les paramètres de la carte pour piloter les alarmes. Le forçage reste disponible.</ha-alert>`}
      <p class=note>Le topic vient de la configuration de la carte. La lecture MQTT exige un compte administrateur Home Assistant.</p>
      <ha-button data-read-alarms appearance=outlined .accessibleLabel=${'Relire l’état MQTT'}
        .disabled=${!this.active || !this.ready || this.disabled || pending || state.loading || !configured}
        @click=${this.read}>Relire l’état MQTT</ha-button>
      <div class=alarm-control>
        <div><span>Évaluation des alarmes</span><small role=status>${label}${state.online === false ? ' · contrôleur hors ligne' : state.online === undefined ? ' · disponibilité inconnue' : ''}${pending ? ' · confirmation en attente' : ''}</small></div>
        <ha-switch data-alarm-enabled .checked=${state.enabled === true} .accessibleLabel=${'Évaluation des alarmes'} aria-label="Évaluation des alarmes"
          .disabled=${!this.commandable()} @change=${this.toggle}></ha-switch>
      </div>
      ${state.enabled === false ? html`<ha-alert alert-type=warning>L’évaluation des alarmes est désactivée. Penser à la réactiver après maintenance.</ha-alert>` : nothing}
      ${state.message ? html`<p class=note role=status>${state.message}</p>` : nothing}
      ${state.error || this.uiError ? html`<ha-alert alert-type=error>${state.error || this.uiError}</ha-alert>` : nothing}`;
  }

  static styles = css`:host{display:grid;gap:12px;min-width:0}.note{margin:0;font-size:.72rem;line-height:1.5;color:var(--secondary-text-color)}code{overflow-wrap:anywhere}.alarm-control{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px;border:1px solid var(--divider-color);border-radius:11px;background:var(--secondary-background-color)}.alarm-control>div{display:grid;gap:4px;min-width:0}.alarm-control span{font-size:.82rem;font-weight:600}.alarm-control small{font-size:.68rem;color:var(--secondary-text-color)}ha-switch{flex-shrink:0}ha-button{justify-self:start}ha-alert{font-size:.74rem}`;
}

if (!customElements.get('flowio-maintenance-alarms')) customElements.define('flowio-maintenance-alarms', FlowioMaintenanceAlarms);
