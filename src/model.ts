import { configObject, normalizePrefix, normalizeMeasurements, entityId, type Measurement, type Role, type TankSlots } from './entities';
export type { Role } from './entities';
export type Treatment='chlorine'|'electrolysis'|'oxygen'|'none';
export type Feature='filtration'|'ph_control'|'heating'|'robot'|'lighting'|'filling';
export interface EntityState { state:string; attributes:Record<string,unknown>; }
export interface Hass { states:Record<string,EntityState>; callService(domain:string,service:string,data:Record<string,unknown>):Promise<unknown>; }
export interface PoolConfig { type:string; title:string; entity_prefix:string; treatment:Treatment|'auto'; measurements:Measurement[]; features:Record<Feature,boolean>; show_tanks:boolean; tank_slots:TankSlots; }
export const FEATURES:ReadonlyArray<readonly [Feature,string]>=[['filtration','Filtration'],['ph_control','Correction pH'],['heating','Chauffage'],['robot','Robot'],['lighting','Éclairage'],['filling','Remplissage']];
export const TREATMENT_LABELS:Record<Treatment,string>={chlorine:'Chlore / Brome liquide',electrolysis:'Électrolyse',oxygen:'Oxygène actif',none:'Aucune désinfection automatique'};
export function normalizeConfig(input:unknown):PoolConfig {
  const raw=configObject(input), treatment=raw.treatment ?? 'auto', title=raw.title ?? 'Piscine';
  if(typeof treatment!=='string' || !['auto','chlorine','electrolysis','oxygen','none'].includes(treatment)) throw new Error('Traitement inconnu');
  if(typeof title!=='string') throw new Error('Titre invalide');
  if(raw.show_tanks!==undefined && typeof raw.show_tanks!=='boolean') throw new Error('show_tanks doit être booléen');
  const supplied=raw.features===undefined ? {} : configObject(raw.features);
  const features={} as Record<Feature,boolean>;
  for(const [key] of FEATURES) { const v=supplied[key]===undefined ? key==='filtration' : supplied[key]; if(typeof v!=='boolean') throw new Error(`Option ${key} invalide`); features[key]=v; }
  const suppliedSlots=raw.tank_slots===undefined ? {} : configObject(raw.tank_slots);
  const tank_slots={} as TankSlots;
  for(const key of ['ph','disinfection'] as const) { const n=suppliedSlots[key] ?? (key==='ph'?1:2); if(typeof n!=='number' || !Number.isInteger(n) || n<0 || n>15) throw new Error('Slot de cuve attendu entre 0 et 15'); tank_slots[key]=n; }
  return {type:'custom:flowio-pool-card',title,entity_prefix:normalizePrefix(raw.entity_prefix),treatment:treatment as PoolConfig['treatment'],measurements:normalizeMeasurements(raw.measurements,['water_temperature','ph','orp','pressure']),features,show_tanks:raw.show_tanks===true,tank_slots};
}
export function idFor(config:PoolConfig,role:Role) { return entityId(config.entity_prefix,role,config.tank_slots); }
export function available(state?:EntityState):state is EntityState { return !!state && !['unknown','unavailable',''].includes(state.state); }
export function entityStatus(state?:EntityState) { return !state ? 'Absente' : available(state) ? 'Présente' : 'Indisponible'; }
export function parseTreatment(state?:string):Treatment|undefined {
  const key=state?.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const values:Record<string,Treatment>={'chlore/brome':'chlorine',chlorine:'chlorine',electrolyse:'electrolysis',electrolysis:'electrolysis','oxygene actif':'oxygen',oxygen:'oxygen',desactive:'none',none:'none'};
  return key!==undefined && Object.prototype.hasOwnProperty.call(values,key) ? values[key] : undefined;
}
export function resolveTreatment(config:PoolConfig,hass:Hass) { const actual=parseTreatment(hass.states[idFor(config,'treatment_type')]?.state); return {selected:config.treatment==='auto'?actual:config.treatment,actual,mismatch:config.treatment!=='auto' && actual!==undefined && actual!==config.treatment}; }
export function visibleMeasurements(config:PoolConfig,hass:Hass) { const t=resolveTreatment(config,hass).selected; return config.measurements.filter(role=>role!=='orp' || (t!=='oxygen' && t!=='none')); }
export function controlRoles(config:PoolConfig,hass:Hass):Role[] {
  const roles:Role[]=[];
  if(config.features.filtration) roles.push('filtration');
  if(config.features.ph_control) roles.push('ph_pump');
  const t=resolveTreatment(config,hass).selected;
  if(t==='chlorine'||t==='oxygen') roles.push('disinfection_pump');
  if(t==='electrolysis') roles.push('electrolyzer');
  if(config.features.heating) roles.push('heater'); if(config.features.robot) roles.push('robot'); if(config.features.lighting) roles.push('lighting'); if(config.features.filling) roles.push('filling');
  return roles;
}
export function expectedRoles(config:PoolConfig,hass:Hass):Role[] {
  const roles:Role[]=['alarm_active','alarm_count','treatment_type',...visibleMeasurements(config,hass),...controlRoles(config,hass)];
  const t=resolveTreatment(config,hass).selected;
  if(config.features.ph_control) roles.push('ph_setpoint');
  if(t==='chlorine'||t==='electrolysis') roles.push('orp_setpoint');
  if(config.show_tanks && config.features.ph_control) roles.push('ph_tank');
  if(config.show_tanks && (t==='chlorine'||t==='oxygen')) roles.push('disinfection_tank');
  return [...new Set(roles)];
}
export function canCommand(config:PoolConfig,hass:Hass,role:Role):boolean {
  if(!controlRoles(config,hass).includes(role)) return false;
  const state=hass.states[idFor(config,role)];
  if(!available(state) || !['on','off'].includes(state.state)) return false;
  if(state.state==='on') return true;
  const t=resolveTreatment(config,hass);
  return !['disinfection_pump','electrolyzer'].includes(role) || (!!t.selected && t.selected!=='none' && !t.mismatch);
}
