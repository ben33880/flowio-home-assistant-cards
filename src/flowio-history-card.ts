import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { normalizeHistoryConfig, nativeHistoryConfigs, type HistoryConfig } from './history-model';
import type { Hass } from './model';

type NativeCard = HTMLElement & { hass?: Hass };
type Helpers = { createCardElement(config: ReturnType<typeof nativeHistoryConfigs>[number]): NativeCard };
type Frontend = Window & { loadCardHelpers?: () => Promise<Helpers>; customCards?: Array<Record<string, unknown>> };

class FlowioHistoryCard extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true }, cards: { state: true }, loading: { state: true }, error: { state: true } };
  declare hass?: Hass;
  declare private config?: HistoryConfig;
  private cards: NativeCard[] = [];
  private loading = false;
  private error = '';
  private generation = 0;
  static getConfigElement() { return document.createElement('flowio-history-card-editor'); }
  static getStubConfig() { return normalizeHistoryConfig({}); }
  getCardSize() { return 2 + 3 * (this.config?.entities.length ?? 0); }
  setConfig(input: unknown) {
    this.config = normalizeHistoryConfig(input);
    this.cards = []; this.error = '';
    if (this.isConnected) void this.build();
  }
  connectedCallback() { super.connectedCallback(); if (this.config) void this.build(); }
  disconnectedCallback() { ++this.generation; super.disconnectedCallback(); }
  protected updated(changed: PropertyValues) {
    if (changed.has('hass')) for (const card of this.cards) card.hass = this.hass;
  }
  private async build() {
    const token = ++this.generation;
    const config = this.config;
    this.error = '';
    if (!config?.entities.length) { this.cards = []; this.loading = false; return; }
    this.loading = true;
    try {
      const load = (window as Frontend).loadCardHelpers;
      if (!load) throw new Error('Native card helpers unavailable');
      const helpers = await load();
      if (token !== this.generation || !this.isConnected) return;
      this.cards = nativeHistoryConfigs(config).map(spec => {
        const card = helpers.createCardElement(spec);
        card.hass = this.hass;
        return card;
      });
    } catch {
      if (token === this.generation && this.isConnected) {
        this.cards = []; this.error = 'Impossible de charger les graphiques natifs. Ouvrir la carte dans Home Assistant puis réessayer.';
      }
    } finally { if (token === this.generation && this.isConnected) this.loading = false; }
  }
  render() {
    const config = this.config;
    if (!config) return nothing;
    return html`<ha-card><div class=header><h2>${config.title}</h2><p>${config.hours_to_show} h · une échelle indépendante par mesure</p></div>
      ${!config.entities.length ? html`<p class=message>Choisir les mesures dans l’éditeur de la carte.</p>` : nothing}
      ${this.loading ? html`<p class=message role=status>Chargement des graphiques…</p>` : nothing}
      ${this.error ? html`<div class=message><p role=alert>${this.error}</p><button @click=${() => this.build()}>Réessayer</button></div>` : nothing}
      <div class=graphs>${this.cards.map(card => html`<div class=graph>${card}</div>`)}</div>
      <p class=footer>Historique Home Assistant : disponibilité selon les données conservées par le Recorder. Aucun enregistrement supplémentaire par Flow.io Cards.</p>
    </ha-card>`;
  }
  static styles = css`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,inherit)}
    .header{padding:20px 20px 0}h2{margin:0;font-size:1.2rem}.header p,.footer{color:var(--secondary-text-color);font-size:.8rem;line-height:1.5}
    .graphs{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px;padding:0 12px}.graph{min-width:0}.graph>*{display:block}
    .message{padding:0 20px}.footer{margin:0;padding:16px 20px}button{font:inherit;color:var(--primary-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:12px;min-height:44px;padding:8px 16px;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
  `;
}
class FlowioHistoryEditor extends LitElement {
  static properties = { hass: { attribute: false }, config: { state: true } };
  declare hass?: Hass;
  declare private config?: HistoryConfig;
  setConfig(input: unknown) { this.config = normalizeHistoryConfig(input); }
  private changed(event: CustomEvent) {
    event.stopPropagation();
    this.config = normalizeHistoryConfig(event.detail.value);
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this.config }, bubbles: true, composed: true }));
  }
  render() {
    if (!this.config || !this.hass) return nothing;
    const schema = [
      { name: 'title', selector: { text: {} } },
      { name: 'hours_to_show', selector: { number: { min: 1, max: 168, step: 1, mode: 'box', unit_of_measurement: 'h' } } },
      { name: 'entities', selector: { entity: { domain: ['sensor', 'number'], multiple: true } } }
    ];
    const labels: Record<string, string> = { title: 'Titre', hours_to_show: 'Durée affichée', entities: 'Mesures (six maximum)' };
    return html`<p>Un graphique par mesure pour garder les unités et échelles distinctes. Les entités doivent être enregistrées par Home Assistant.</p><ha-form .hass=${this.hass} .data=${this.config} .schema=${schema} .computeLabel=${(field: { name: string }) => labels[field.name] ?? field.name} @value-changed=${this.changed}></ha-form>`;
  }
  static styles = css`:host{display:block}p{color:var(--secondary-text-color);line-height:1.5}`;
}
if (!customElements.get('flowio-history-card')) customElements.define('flowio-history-card', FlowioHistoryCard);
if (!customElements.get('flowio-history-card-editor')) customElements.define('flowio-history-card-editor', FlowioHistoryEditor);
const frontend = window as Frontend;
frontend.customCards ??= [];
if (!frontend.customCards.some(card => card.type === 'flowio-history-card')) frontend.customCards.push({ type: 'flowio-history-card', name: 'Flow.io Historiques', description: 'Graphiques natifs Home Assistant, une échelle par mesure.', preview: true });
