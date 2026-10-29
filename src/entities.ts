export const DEFINITIONS = {
  water_temperature:['sensor','io_wat_tmp','Eau'], air_temperature:['sensor','io_air_tmp','Air'], ph:['sensor','io_ph','pH'], orp:['sensor','io_orp','ORP'], pressure:['sensor','io_psi','Pression'],
  ph_setpoint:['number','pl_ph_setpoint','Consigne pH'], orp_setpoint:['number','pl_dis_setpoint','Consigne désinfection (ORP)'],
  filtration:['switch','io_flt_pmp','Filtration'], ph_pump:['switch','io_ph_pmp','Pompe pH'], disinfection_pump:['switch','io_chl_pmp','Pompe désinfectant'], electrolyzer:['switch','io_chl_gen','Électrolyseur'], heater:['switch','io_wat_htr','Chauffage'], robot:['switch','io_robot','Robot'], lighting:['switch','io_lights','Éclairage'], filling:['switch','io_fill_pmp','Remplissage'],
  treatment_type:['select','pl_modes_dis','Traitement annoncé'], alarm_active:['binary_sensor','alm_any_active','Alarme globale'], alarm_count:['sensor','alm_active_count','Nombre d’alarmes']
} as const;
export type Role=keyof typeof DEFINITIONS|'ph_tank'|'ph_tank_percent'|'disinfection_tank'|'disinfection_tank_percent';
export const MEASUREMENTS=['water_temperature','air_temperature','ph','orp','pressure'] as const;
export type Measurement=typeof MEASUREMENTS[number];
export interface TankSlots { ph:number;disinfection:number; }
export function normalizePrefix(value:unknown='fio'):string {
  if(typeof value!=='string')throw new Error('Préfixe texte attendu');
  const prefix=value.trim().toLowerCase().replace(/_+$/,'');
  if(prefix&&!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(prefix))throw new Error('Préfixe invalide : lettres, chiffres et underscores');
  return prefix;
}
export function entityId(prefix:string,role:Role,slots:TankSlots={ph:1,disinfection:2}):string {
  const stem=prefix?prefix+'_':'';
  if(role==='ph_tank'||role==='ph_tank_percent')return `sensor.${stem}data_${112+2*slots.ph+(role==='ph_tank_percent'?1:0)}`;
  if(role==='disinfection_tank'||role==='disinfection_tank_percent')return `sensor.${stem}data_${112+2*slots.disinfection+(role==='disinfection_tank_percent'?1:0)}`;
  const [domain,suffix]=DEFINITIONS[role];return `${domain}.${stem}${suffix}`;
}
export function roleLabel(role:Role):string {return role==='ph_tank'?'Cuve pH · volume estimé':role==='ph_tank_percent'?'Cuve pH · remplissage estimé':role==='disinfection_tank'?'Cuve désinfectant · volume estimé':role==='disinfection_tank_percent'?'Cuve désinfectant · remplissage estimé':DEFINITIONS[role][2];}
export function configObject(input:unknown):Record<string,unknown> {
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Configuration objet attendue');
  if('entities' in input)throw new Error('Le bloc entities est supprimé. Utiliser entity_prefix et les noms métier ; recréer la configuration.');
  return input as Record<string,unknown>;
}
export function normalizeMeasurements(value:unknown,defaults:readonly Measurement[]):Measurement[] {
  if(value===undefined)return [...defaults];if(value===null)return [];
  if(!Array.isArray(value)||value.some(item=>!MEASUREMENTS.includes(item)))throw new Error('Choisir les mesures métier proposées');
  return [...new Set(value)] as Measurement[];
}
