import { LitElement,html,css,nothing } from 'lit';
import { MEASUREMENTS,roleLabel,type Role } from './entities';
import { normalizeConfig,idFor,available,entityStatus,resolveTreatment,visibleMeasurements,controlRoles,expectedRoles,canCommand,FEATURES,TREATMENT_LABELS,type Hass,type PoolConfig } from './model';
class FlowioPoolCard extends LitElement {
  static properties={hass:{attribute:false},config:{state:true},busy:{state:true},error:{state:true}};
  declare hass?:Hass; declare private config?:PoolConfig; private busy=''; private error='';
  static getConfigElement(){return document.createElement('flowio-pool-card-editor');}
  static getStubConfig(){return normalizeConfig({});}
  setConfig(input:unknown){this.config=normalizeConfig(input);this.error='';}
  getCardSize(){return 7;}
  private state(role:Role){return this.config ? this.hass?.states[idFor(this.config,role)] : undefined;}
  private more(role:Role){if(this.config && this.state(role)) this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:idFor(this.config,role)},bubbles:true,composed:true}));}
  private measure(role:Role){const s=this.state(role),unit=s?.attributes.unit_of_measurement;return html`<button class=measure ?disabled=${!s} @click=${()=>this.more(role)}><span class=muted>${roleLabel(role)}</span><strong>${available(s)?s.state:!s?'Entité absente':'Indisponible'} ${available(s)&&typeof unit==='string'?html`<small>${unit}</small>`:nothing}</strong></button>`;}
  private label(role:Role){return role==='disinfection_pump' && this.config && this.hass ? resolveTreatment(this.config,this.hass).selected==='oxygen'?'Pompe oxygène actif':'Pompe chlore / brome' : roleLabel(role);}
  private control(role:Role){const s=this.state(role),on=s?.state==='on',label=this.label(role),enabled=!!this.config&&!!this.hass&&canCommand(this.config,this.hass,role);return html`<div class=control><button class=details ?disabled=${!s} @click=${()=>this.more(role)}><span>${label}</span><span class=muted>${!s?'Entité absente':!available(s)?'Indisponible':on?'En marche':s.state==='off'?'Arrêté':'État non commandable'}</span></button><button class=${on?'action on':'action'} ?disabled=${!enabled||!!this.busy} aria-label=${`${on?'Arrêter':'Démarrer'} ${label}`} @click=${()=>this.command(role)}>${this.busy===role?'…':on?'Arrêter':'Démarrer'}</button></div>`;}
  private async command(role:Role){
    const c=this.config,hass=this.hass;if(!c||!hass||this.busy||!canCommand(c,hass,role))return;
    const id=idFor(c,role),on=hass.states[id].state==='on';
    if(!on && ['ph_pump','disinfection_pump','filling','filtration'].includes(role) && !window.confirm(`Démarrer ${this.label(role)} ? Cette commande peut modifier le mode automatique Flow.io.`))return;
    if(this.config!==c||this.hass!==hass||!canCommand(c,hass,role))return;
    this.busy=role;this.error='';
    try{await hass.callService('switch',on?'turn_off':'turn_on',{entity_id:id});}catch{this.error='Commande refusée ou échouée. Vérifier les droits et les sécurités Flow.io.';}finally{this.busy='';}
  }
  render(){
    const c=this.config,hass=this.hass;if(!c||!hass)return html`<ha-card><div class=body>En attente de Home Assistant…</div></ha-card>`;
    const t=resolveTreatment(c,hass),alarm=this.state('alarm_active'),known=available(alarm)&&['on','off'].includes(alarm.state);
    const roles=expectedRoles(c,hass),missing=roles.filter(role=>!this.state(role)).length;
    return html`<ha-card><div class=body><header><div><div class=eyebrow>FLOW.IO · ${c.entity_prefix||'sans préfixe'}</div><h2>${c.title}</h2></div><ha-icon icon=mdi:pool></ha-icon></header>
      <button class=${alarm?.state==='on'?'status alert':'status'} ?disabled=${!alarm} @click=${()=>this.more('alarm_active')}>${!known?'État des alarmes non disponible':alarm.state==='on'?'Alarme active':'Aucune alarme signalée'}</button>
      <p class=treatment>${t.selected?TREATMENT_LABELS[t.selected]:'Traitement inconnu · vérifier le préfixe ou choisir le traitement affiché'}</p>
      ${t.mismatch?html`<p class=warning role=alert>Le traitement affiché ne correspond pas à Flow.io. Démarrage de désinfection bloqué ; arrêt toujours possible si l’état est connu.</p>`:nothing}
      ${this.error?html`<p class=warning role=alert>${this.error}</p>`:nothing}
      <div class=grid>${visibleMeasurements(c,hass).map(role=>this.measure(role))}</div>
      ${c.features.ph_control||t.selected==='chlorine'||t.selected==='electrolysis'?html`<h3>Consignes</h3><div class=grid>${c.features.ph_control?this.measure('ph_setpoint'):nothing}${t.selected==='chlorine'||t.selected==='electrolysis'?this.measure('orp_setpoint'):nothing}</div>`:nothing}
      ${controlRoles(c,hass).length?html`<h3>Équipements</h3>${controlRoles(c,hass).map(role=>this.control(role))}`:nothing}
      ${c.show_tanks?html`<div class=grid tanks>${c.features.ph_control?this.measure('ph_tank'):nothing}${t.selected==='chlorine'||t.selected==='oxygen'?this.measure('disinfection_tank'):nothing}</div>`:nothing}
      <details><summary>Configuration · ${missing?`${missing} entité(s) absente(s)`:'entités attendues présentes'}</summary>${roles.map(role=>html`<div class=diagnostic><span>${roleLabel(role)} · ${entityStatus(this.state(role))}</span><code>${idFor(c,role)}</code></div>`)}<p class=muted>Les cuves dépendent des slots configurés et de leur diffusion HA. Aucun remplacement par une entité ressemblante. Les sécurités restent dans Flow.io ; une sortie active ne confirme pas la marche physique.</p></details>
    </div></ha-card>`;
  }
  static styles=css`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,inherit)}.body{padding:24px}header{display:flex;align-items:center;justify-content:space-between;gap:16px}h2{font-size:1.6rem;margin:4px 0 18px}h3{font-size:1rem;margin:24px 0 12px}header ha-icon{color:var(--primary-color);--mdc-icon-size:36px}.eyebrow{font-size:.7rem;letter-spacing:.12em;color:var(--secondary-text-color)}
    button{font:inherit;color:inherit;cursor:pointer}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}button:disabled{cursor:default}.muted,.treatment{color:var(--secondary-text-color);font-size:.85rem;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,135px),1fr));gap:12px}.tanks{margin-top:20px}
    .measure{min-height:88px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;background:var(--secondary-background-color,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);padding:16px;overflow-wrap:anywhere}strong{font-size:1.3rem;font-weight:600}small{font-size:.8rem;font-weight:400}.status{display:block;text-align:left;background:transparent;border:1px solid var(--divider-color);border-radius:12px;padding:12px;width:100%;font-size:.85rem}.alert,.warning{color:var(--error-color)}.warning{border-inline-start:3px solid var(--error-color);padding:8px 12px;font-size:.85rem}
    .control{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider-color)}.details{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;text-align:left;border:0;background:none;padding:6px 0;overflow-wrap:anywhere}.action{border:1px solid var(--divider-color);border-radius:20px;background:transparent;padding:9px 14px;min-height:44px}.action:disabled{opacity:.5}.on{color:var(--primary-color);border-color:var(--primary-color)}details{margin-top:22px;font-size:.8rem}summary{cursor:pointer;padding:8px 0;color:var(--secondary-text-color)}.diagnostic{display:flex;flex-direction:column;gap:4px;padding:8px 0;border-bottom:1px solid var(--divider-color)}code{overflow-wrap:anywhere;color:var(--secondary-text-color)}@media(max-width:400px){.body{padding:16px}.action{padding:9px 10px}}
  `;
}
class FlowioPoolCardEditor extends LitElement {
  static properties={hass:{attribute:false},config:{state:true},error:{state:true}};declare hass?:Hass;declare private config?:PoolConfig;private error='';
  setConfig(input:unknown){this.config=normalizeConfig(input);}
  private changed(event:CustomEvent){event.stopPropagation();try{this.config=normalizeConfig(event.detail.value);this.error='';this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));}catch(e){this.error=e instanceof Error?e.message:'Configuration invalide';}}
  render(){if(!this.config||!this.hass)return nothing;
    const schema=[{name:'title',selector:{text:{}}},{name:'entity_prefix',selector:{text:{}}},{name:'treatment',selector:{select:{options:[{value:'auto',label:'Suivre Flow.io'},...Object.entries(TREATMENT_LABELS).map(([value,label])=>({value,label}))]}}},{name:'measurements',selector:{select:{multiple:true,options:MEASUREMENTS.map(value=>({value,label:roleLabel(value)}))}}},{name:'features',type:'expandable',schema:FEATURES.map(([name])=>({name,selector:{boolean:{}}}))},{name:'show_tanks',selector:{boolean:{}}},...(this.config.show_tanks?[{name:'tank_slots',type:'expandable',schema:['ph','disinfection'].map(name=>({name,selector:{number:{min:0,max:15,step:1,mode:'box'}}}))}]:[])];
    const labels:Record<string,string>={title:'Titre',entity_prefix:'Préfixe firmware (fio par défaut, vide pour aucun)',treatment:'Traitement affiché',measurements:'Mesures visibles',features:'Équipements installés',show_tanks:'Afficher les cuves estimées',tank_slots:'Slots des cuves · vérifier les affectations Flow.io',ph:'Slot pH',disinfection:'Slot désinfection',...Object.fromEntries(FEATURES)};
    return html`<p>Les identifiants sont construits depuis le préfixe et les suffixes firmware. Aucun sélecteur d’entité ni ancienne configuration.</p>${this.error?html`<p role=alert>${this.error}</p>`:nothing}<ha-form .hass=${this.hass} .data=${this.config} .schema=${schema} .computeLabel=${(f:{name:string})=>labels[f.name]??f.name} @value-changed=${this.changed}></ha-form>`;
  }
  static styles=css`:host{display:block}p{color:var(--secondary-text-color);line-height:1.5}[role=alert]{color:var(--error-color)}`;
}
if(!customElements.get('flowio-pool-card'))customElements.define('flowio-pool-card',FlowioPoolCard);
if(!customElements.get('flowio-pool-card-editor'))customElements.define('flowio-pool-card-editor',FlowioPoolCardEditor);
const registry=window as Window & {customCards?:Array<Record<string,unknown>>};registry.customCards??=[];
if(!registry.customCards.some(c=>c.type==='flowio-pool-card'))registry.customCards.push({type:'flowio-pool-card',name:'Flow.io Piscine',description:'Piscine par préfixe firmware, traitement et équipements.',preview:true});
