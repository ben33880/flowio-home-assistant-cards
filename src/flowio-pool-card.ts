import { LitElement,html,css,nothing } from 'lit';
import { roleLabel,type Role } from './entities';
import { normalizeConfig,idFor,available,entityStatus,expectedRoles,canCommand,tankPercent,DISPLAY_OPTIONS,GROUP_LABELS,type DisplayGroup,type Hass,type PoolConfig } from './model';
class FlowioPoolCard extends LitElement {
  static properties={hass:{attribute:false},config:{state:true},busy:{state:true},error:{state:true}};
  declare hass?:Hass;declare private config?:PoolConfig;private busy='';private error='';
  static getConfigElement(){return document.createElement('flowio-pool-card-editor');}
  static getStubConfig(){return normalizeConfig({});}
  setConfig(input:unknown){this.config=normalizeConfig(input);this.error='';}
  getCardSize(){return 7;}
  private state(role:Role){return this.config?this.hass?.states[idFor(this.config,role)]:undefined;}
  private more(role:Role){if(this.config&&this.state(role))this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:idFor(this.config,role)},bubbles:true,composed:true}));}
  private measure(role:Role,label=roleLabel(role)){
    const state=this.state(role),unit=state?.attributes.unit_of_measurement,fallback=role.endsWith('_percent')?'%':role==='ph_tank'||role==='disinfection_tank'?'L':'';
    return html`<button class=measure data-role=${role} ?disabled=${!state} @click=${()=>this.more(role)}><span class=muted>${label}</span><strong>${available(state)?state.state:!state?'Entité absente':'Indisponible'} ${available(state)?html`<small>${typeof unit==='string'&&unit?unit:fallback}</small>`:nothing}</strong></button>`;
  }
  private control(role:Role){
    const state=this.state(role),on=state?.state==='on',label=roleLabel(role),enabled=!!this.config&&!!this.hass&&canCommand(this.config,this.hass,role);
    return html`<div class=control data-equipment=${role}><button class=details ?disabled=${!state} @click=${()=>this.more(role)}><span>${label}</span><span class=muted>${!state?'Entité absente':!available(state)?'Indisponible':on?'En marche':state.state==='off'?'Arrêté':'État non commandable'}</span></button><button class=${on?'action on':'action'} ?disabled=${!enabled||!!this.busy} aria-label=${`${on?'Arrêter':'Démarrer'} ${label}`} @click=${()=>this.command(role)}>${this.busy===role?'…':on?'Arrêter':'Démarrer'}</button></div>`;
  }
  private async command(role:Role){
    const config=this.config,hass=this.hass;if(!config||!hass||this.busy||!canCommand(config,hass,role))return;
    const id=idFor(config,role),on=hass.states[id].state==='on';
    if(!on&&['ph_pump','disinfection_pump','filling','filtration'].includes(role)&&!window.confirm(`Démarrer ${roleLabel(role)} ? Cette commande peut modifier les modes automatiques. Flow.io reste responsable des sécurités.`))return;
    if(this.config!==config||this.hass!==hass||!canCommand(config,hass,role))return;
    this.busy=role;this.error='';
    try{await hass.callService('switch',on?'turn_off':'turn_on',{entity_id:id});}
    catch{this.error='Commande refusée ou échouée. Vérifier les droits, la disponibilité et les sécurités Flow.io.';}finally{this.busy='';}
  }
  private tank(kind:'ph'|'disinfection'){
    const config=this.config;if(!config)return nothing;
    const volume:Role=kind==='ph'?'ph_tank':'disinfection_tank',percent:Role=kind==='ph'?'ph_tank_percent':'disinfection_tank_percent';
    const chosen=config.display.tanks.filter(role=>role===volume||role===percent);if(!chosen.length)return nothing;
    const showPercent=(chosen as readonly Role[]).includes(percent),level=showPercent?tankPercent(this.state(percent)):undefined;
    return html`<section class=tank data-tank=${kind}><h4>${kind==='ph'?'Cuve pH':'Cuve désinfectant'}</h4><div class=grid>${chosen.map(role=>this.measure(role,role===volume?'Volume restant estimé':'Remplissage estimé'))}</div>${showPercent?level!==undefined?html`<meter min=0 max=100 value=${level} aria-label=${`Cuve ${kind==='ph'?'pH':'désinfectant'} · remplissage estimé`}></meter>`:html`<p class=muted>Jauge indisponible : vérifier le capteur de pourcentage.</p>`:nothing}</section>`;
  }
  private information(role:'treatment_type'|'alarm_active'|'alarm_count'){
    const state=this.state(role);
    if(role==='alarm_active'){const known=available(state)&&['on','off'].includes(state.state);return html`<button class=${state?.state==='on'?'status alert':'status'} ?disabled=${!state} @click=${()=>this.more(role)}>${!known?'État des alarmes non disponible':state.state==='on'?'Alarme active':'Aucune alarme signalée'}</button>`;}
    return html`<button class=info ?disabled=${!state} @click=${()=>this.more(role)}>${roleLabel(role)} : ${available(state)?state.state:!state?'Entité absente':'Indisponible'}</button>`;
  }
  render(){
    const config=this.config;if(!config||!this.hass)return html`<ha-card><div class=body>En attente de Home Assistant…</div></ha-card>`;
    const d=config.display,roles=expectedRoles(config),missing=roles.filter(role=>!this.state(role)).length;
    return html`<ha-card><div class=body><header><div><div class=eyebrow>FLOW.IO · ${config.entity_prefix||'sans préfixe'}</div><h2>${config.title}</h2></div><ha-icon icon=mdi:pool></ha-icon></header>
      <div class=information>${d.information.map(role=>role==='diagnostics'?nothing:this.information(role))}</div>
      ${this.error?html`<p class=warning role=alert>${this.error}</p>`:nothing}
      ${d.measurements.length?html`<div class=grid data-group=measurements>${d.measurements.map(role=>this.measure(role))}</div>`:nothing}
      ${d.setpoints.length?html`<h3>Consignes</h3><div class=grid data-group=setpoints>${d.setpoints.map(role=>this.measure(role))}</div>`:nothing}
      ${d.equipment.length?html`<h3>Équipements</h3>${d.equipment.map(role=>this.control(role))}`:nothing}
      ${d.tanks.length?html`<h3>Cuves de traitement</h3><div class=tank-list>${this.tank('ph')}${this.tank('disinfection')}</div>`:nothing}
      ${d.information.includes('diagnostics')?html`<details><summary>Configuration · ${missing?`${missing} entité(s) absente(s)`:'entités sélectionnées présentes'}</summary>${roles.map(role=>html`<div class=diagnostic><span>${roleLabel(role)} · ${entityStatus(this.state(role))} · ${this.state(role)?.state??'—'}</span><code>${idFor(config,role)}</code></div>`)}<p class=muted>Affichage choisi par l’utilisateur, sans détection du traitement. Les sécurités restent dans le firmware. Les volumes et pourcentages sont des estimations publiées par Flow.io.</p></details>`:nothing}
    </div></ha-card>`;
  }
  static styles=css`
    :host{display:block;color:var(--primary-text-color);font-family:var(--ha-font-family-body,inherit)}.body{padding:24px}header{display:flex;align-items:center;justify-content:space-between;gap:16px}h2{font-size:1.6rem;margin:4px 0 18px}h3{font-size:1rem;margin:24px 0 12px}header ha-icon{color:var(--primary-color);--mdc-icon-size:36px}.eyebrow{font-size:.7rem;letter-spacing:.12em;color:var(--secondary-text-color)}
    button{font:inherit;color:inherit;cursor:pointer}button:focus-visible,summary:focus-visible{outline:2px solid var(--primary-color);outline-offset:3px}button:disabled{cursor:default}.muted{color:var(--secondary-text-color);font-size:.85rem;line-height:1.5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,135px),1fr));gap:12px}.information{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.information:empty{display:none}
    .measure{min-height:88px;display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;background:var(--secondary-background-color,var(--card-background-color));border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);padding:16px;overflow-wrap:anywhere}strong{font-size:1.3rem;font-weight:600}small{font-size:.8rem;font-weight:400}.status,.info{text-align:left;background:transparent;border:1px solid var(--divider-color);border-radius:12px;padding:12px;font-size:.85rem;overflow-wrap:anywhere}.status{width:100%}.alert,.warning{color:var(--error-color)}.warning{border-inline-start:3px solid var(--error-color);padding:8px 12px;font-size:.85rem;overflow-wrap:anywhere}
    .control{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider-color)}.details{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;text-align:left;border:0;background:none;padding:6px 0;overflow-wrap:anywhere}.action{border:1px solid var(--divider-color);border-radius:20px;background:transparent;padding:9px 14px;min-height:44px}.action:disabled{opacity:.5}.on{color:var(--primary-color);border-color:var(--primary-color)}details{margin-top:22px;font-size:.8rem}summary{cursor:pointer;padding:8px 0;color:var(--secondary-text-color)}.diagnostic{display:flex;flex-direction:column;gap:4px;padding:8px 0;border-bottom:1px solid var(--divider-color)}code{overflow-wrap:anywhere;color:var(--secondary-text-color)}
    .tank-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px}.tank{min-width:0;border:1px solid var(--divider-color);border-radius:var(--ha-card-border-radius,12px);padding:16px}.tank h4{margin:0 0 14px;font-size:.95rem}.tank meter{display:block;width:100%;height:18px;margin-top:12px;accent-color:var(--primary-color)}@media(max-width:400px){.body{padding:16px}.action{padding:9px 10px}}
  `;
}
class FlowioPoolCardEditor extends LitElement {
  static properties={hass:{attribute:false},config:{state:true},error:{state:true}};declare hass?:Hass;declare private config?:PoolConfig;private error='';
  setConfig(input:unknown){this.config=normalizeConfig(input);}
  private changed(event:CustomEvent){event.stopPropagation();try{this.config=normalizeConfig(event.detail.value);this.error='';this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));}catch(e){this.error=e instanceof Error?e.message:'Configuration invalide';}}
  render(){if(!this.config||!this.hass)return nothing;
    const groups=Object.keys(DISPLAY_OPTIONS) as DisplayGroup[];
    const schema=[{name:'title',selector:{text:{}}},{name:'entity_prefix',selector:{text:{}}},{name:'display',type:'expandable',schema:groups.map(name=>({name,selector:{select:{multiple:true,mode:'list',options:DISPLAY_OPTIONS[name].map(value=>({value,label:value==='diagnostics'?'Diagnostic des entités':roleLabel(value)}))}}}))},...(this.config.display.tanks.length?[{name:'tank_slots',type:'expandable',schema:['ph','disinfection'].map(name=>({name,selector:{number:{min:0,max:15,step:1,mode:'box'}}}))}]:[])];
    const labels:Record<string,string>={title:'Titre',entity_prefix:'Préfixe firmware (fio par défaut)',display:'Éléments à afficher',tank_slots:'Slots des cuves',ph:'Slot pH',disinfection:'Slot désinfectant',...GROUP_LABELS};
    return html`<p>Cocher chaque élément à afficher. Aucun bloc ne dépend du traitement annoncé. Une entité sélectionnée mais absente reste signalée. Les commandes peuvent modifier les automatismes et restent validées par Flow.io.</p>${this.error?html`<p role=alert>${this.error}</p>`:nothing}<ha-form .hass=${this.hass} .data=${this.config} .schema=${schema} .computeLabel=${(field:{name:string})=>labels[field.name]??field.name} @value-changed=${this.changed}></ha-form>`;
  }
  static styles=css`:host{display:block}p{color:var(--secondary-text-color);line-height:1.5}[role=alert]{color:var(--error-color)}`;
}
if(!customElements.get('flowio-pool-card'))customElements.define('flowio-pool-card',FlowioPoolCard);
if(!customElements.get('flowio-pool-card-editor'))customElements.define('flowio-pool-card-editor',FlowioPoolCardEditor);
const registry=window as Window&{customCards?:Array<Record<string,unknown>>};registry.customCards??=[];if(!registry.customCards.some(card=>card.type==='flowio-pool-card'))registry.customCards.push({type:'flowio-pool-card',name:'Flow.io Piscine',description:'Préfixe firmware et sélection explicite de chaque élément.',preview:true});
