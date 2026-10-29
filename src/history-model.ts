import { configObject,normalizePrefix,normalizeMeasurements,entityId,type Measurement } from './entities';
export interface HistoryConfig { type:'custom:flowio-history-card';title:string;entity_prefix:string;hours_to_show:number;measurements:Measurement[]; }
export function normalizeHistoryConfig(input:unknown):HistoryConfig {
  const raw=configObject(input),hours=raw.hours_to_show??24,title=raw.title??'Historique de la piscine';
  if(typeof title!=='string')throw new Error('Titre invalide');
  if(typeof hours!=='number'||!Number.isInteger(hours)||hours<1||hours>168)throw new Error('Durée entière attendue entre 1 et 168 heures');
  return {type:'custom:flowio-history-card',title,entity_prefix:normalizePrefix(raw.entity_prefix),hours_to_show:hours,measurements:normalizeMeasurements(raw.measurements,['water_temperature','ph','orp'])};
}
export function nativeHistoryConfigs(c:HistoryConfig){return c.measurements.map(role=>({type:'history-graph',entities:[entityId(c.entity_prefix,role)],hours_to_show:c.hours_to_show}));}
