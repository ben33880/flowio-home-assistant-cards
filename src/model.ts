import { configObject,normalizePrefix,entityId,MEASUREMENTS,type Role,type TankSlots } from './entities';
export type { Role } from './entities';
export interface EntityState {state:string;attributes:Record<string,unknown>;}
export interface Hass {states:Record<string,EntityState>;callService(domain:string,service:string,data:Record<string,unknown>):Promise<unknown>;}
export const DISPLAY_OPTIONS={
  measurements:MEASUREMENTS,
  setpoints:['ph_setpoint','orp_setpoint'],
  equipment:['filtration','ph_pump','disinfection_pump','electrolyzer','heater','robot','lighting','filling'],
  tanks:['ph_tank','ph_tank_percent','disinfection_tank','disinfection_tank_percent'],
  information:['treatment_type','alarm_active','alarm_count','diagnostics']
} as const;
export type DisplayGroup=keyof typeof DISPLAY_OPTIONS;
export type DisplayConfig={[K in DisplayGroup]:Array<(typeof DISPLAY_OPTIONS)[K][number]>};
export interface PoolConfig {type:string;title:string;entity_prefix:string;display:DisplayConfig;tank_slots:TankSlots;}
export const GROUP_LABELS:Record<DisplayGroup,string>={measurements:'Mesures',setpoints:'Consignes',equipment:'Équipements',tanks:'Cuves · litres et pourcentages',information:'Informations et diagnostic'};
function selection<T extends string>(value:unknown,choices:readonly T[],defaults:readonly T[]):T[] {
  if(value===undefined)return [...defaults];if(value===null)return [];
  if(!Array.isArray(value)||value.some(item=>typeof item!=='string'||!(choices as readonly string[]).includes(item)))throw new Error('Élément d’affichage inconnu ou groupe invalide');
  return [...new Set(value)] as T[];
}
export function normalizeConfig(input:unknown):PoolConfig {
  const raw=configObject(input);
  for(const key of ['features','show_tanks','treatment','measurements'])if(key in raw)throw new Error(`Le champ ${key} est supprimé de la synthèse. Utiliser display ; recréer la configuration.`);
  const title=raw.title??'Piscine';if(typeof title!=='string')throw new Error('Titre invalide');
  const d=raw.display===undefined?{}:configObject(raw.display);
  for(const key of Object.keys(d))if(!Object.prototype.hasOwnProperty.call(DISPLAY_OPTIONS,key))throw new Error(`Groupe display inconnu : ${key}`);
  const display:DisplayConfig={
    measurements:selection(d.measurements,DISPLAY_OPTIONS.measurements,['water_temperature','ph','orp','pressure']),
    setpoints:selection(d.setpoints,DISPLAY_OPTIONS.setpoints,[]),
    equipment:selection(d.equipment,DISPLAY_OPTIONS.equipment,['filtration']),
    tanks:selection(d.tanks,DISPLAY_OPTIONS.tanks,[]),
    information:selection(d.information,DISPLAY_OPTIONS.information,['treatment_type','alarm_active','diagnostics'])
  };
  const supplied=raw.tank_slots===undefined?{}:configObject(raw.tank_slots),tank_slots={} as TankSlots;
  for(const key of ['ph','disinfection'] as const){const value=supplied[key]??(key==='ph'?1:2);if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>15)throw new Error('Slot de cuve attendu entre 0 et 15');tank_slots[key]=value;}
  return {type:'custom:flowio-pool-card',title,entity_prefix:normalizePrefix(raw.entity_prefix),display,tank_slots};
}
export function idFor(config:PoolConfig,role:Role){return entityId(config.entity_prefix,role,config.tank_slots);}
export function available(state?:EntityState):state is EntityState {return !!state&&!['unknown','unavailable',''].includes(state.state);}
export function entityStatus(state?:EntityState){return !state?'Absente':available(state)?'Présente':'Indisponible';}
export function tankPercent(state?:EntityState):number|undefined {if(!available(state)||!state.state.trim())return undefined;const value=Number(state.state);return Number.isFinite(value)&&value>=0&&value<=100?value:undefined;}
export function expectedRoles(config:PoolConfig):Role[] {
  type InfoEntity=Exclude<DisplayConfig['information'][number],'diagnostics'>;
  const information=config.display.information.filter((role):role is InfoEntity=>role!=='diagnostics');
  return [...new Set<Role>([...config.display.measurements,...config.display.setpoints,...config.display.equipment,...config.display.tanks,...information])];
}
export function canCommand(config:PoolConfig,hass:Hass,role:Role):boolean {
  if(!(config.display.equipment as readonly Role[]).includes(role))return false;
  const state=hass.states[idFor(config,role)];return available(state)&&['on','off'].includes(state.state);
}
