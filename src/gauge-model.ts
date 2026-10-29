import { MEASUREMENTS,type Measurement } from './entities';
export type VisualType='tile'|'arc'|'needle';export interface Scale{type:VisualType;min:number;max:number;}export type Visuals=Record<Measurement,Scale>;
const DEFAULTS:Visuals={water_temperature:{type:'tile',min:0,max:40},air_temperature:{type:'tile',min:-10,max:50},ph:{type:'arc',min:6,max:8.4},orp:{type:'arc',min:400,max:1000},pressure:{type:'needle',min:0,max:19}};
const LEGACY_MAX:Partial<Record<Measurement,number>>={ph:14,orp:1000,pressure:3};
export function normalizeVisuals(input:unknown):Visuals{
if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw new Error('visuals doit être un objet');
const raw=(input??{}) as Record<string,unknown>,result={} as Visuals;
for(const key of Object.keys(raw))if(!(MEASUREMENTS as readonly string[]).includes(key))throw new Error('Mesure visuelle inconnue');
for(const role of MEASUREMENTS){
const value=raw[role];if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)))throw new Error('Échelle invalide');
const v=(value??{}) as Record<string,unknown>,d=DEFAULTS[role],type=v.type??d.type,min=v.min??d.min,max=v.max??d.max;
if(typeof type!=='string'||!['tile','arc','needle'].includes(type)||typeof min!=='number'||typeof max!=='number'||![min,max,max-min].every(Number.isFinite)||max<=min)throw new Error('Échelle finie attendue avec max supérieur à min');
const scale:Scale={type:type as VisualType,min,max};
if(scale.min===0&&LEGACY_MAX[role]!==undefined&&scale.max===LEGACY_MAX[role]){scale.min=d.min;scale.max=d.max;}
result[role]=scale;
}return result;
}
export function numericValue(value:unknown):number|undefined{if(typeof value!=='number'&&typeof value!=='string')return undefined;if(typeof value==='string'&&!value.trim())return undefined;const n=Number(value);return Number.isFinite(n)?n:undefined;}
export function gaugeGeometry(value:number|undefined,min:number,max:number,setpoint?:number,ring=false){if(value===undefined||![value,min,max,max-min].every(Number.isFinite)||max<=min)return undefined;const raw=(value-min)/(max-min),ratio=Math.min(1,Math.max(0,raw)),sweep=ring?360:270,start=ring?-90:135,circumference=2*Math.PI*46,arc=circumference*sweep/360;const point=(fraction:number,radius:number)=>{const a=(start+sweep*fraction)*Math.PI/180;return{x:60+radius*Math.cos(a),y:60+radius*Math.sin(a)};};return{ratio,arc,circumference,progress:arc*ratio,start,outOfRange:raw<0||raw>1,needleStart:point(ratio,35),needleEnd:point(ratio,52),target:setpoint!==undefined&&Number.isFinite(setpoint)&&setpoint>=min&&setpoint<=max?point((setpoint-min)/(max-min),46):undefined};}
