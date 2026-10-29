import type { Role } from './entities';
export type QualityTone='good'|'medium'|'bad'|'outside';
export interface QualityBand {from:number;to:number;tone:QualityTone;label:string;}
export interface GaugeQuality {tone:QualityTone;label:string;rangeLabel:string;bands:QualityBand[];}
function toneAt(role:Role,value:number):QualityTone|undefined {
  if(role==='ph'){if(value>=7&&value<=7.4)return 'good';if((value>=6.8&&value<7)||(value>7.4&&value<=7.6))return 'medium';return 'bad';}
  if(role==='orp')return value>=650&&value<=750?'good':'outside';
  if(role==='pressure')return value>=3&&value<=16?'good':'outside';
  return undefined;
}
function labelFor(tone:QualityTone,role:Role):string {
  if(role==='orp')return tone==='good'?'Dans la plage cible':'Hors plage cible';
  if(role==='pressure')return tone==='good'?'Pression OK':'Hors plage OK';
  return tone==='good'?'Bon':tone==='medium'?'Moyen':'Mauvais';
}
export function qualityFor(role:Role,value:number|undefined,min:number,max:number):GaugeQuality|undefined {
  if(!['ph','orp','pressure'].includes(role)||value===undefined||!Number.isFinite(value)||!Number.isFinite(min)||!Number.isFinite(max)||max<=min)return undefined;
  const tone=toneAt(role,value)!;
  const boundaries=role==='ph'?[min,6.8,7,7.4,7.6,max]:role==='orp'?[min,650,750,max]:[min,3,16,max];
  const points=[...new Set(boundaries.filter(point=>Number.isFinite(point)&&point>=min&&point<=max))].sort((a,b)=>a-b),bands:QualityBand[]=[];
  for(let i=0;i<points.length-1;i++){const from=points[i],to=points[i+1];if(to<=from)continue;const bandTone=toneAt(role,(from+to)/2);if(!bandTone)continue;const label=labelFor(bandTone,role),previous=bands[bands.length-1];if(previous&&previous.tone===bandTone&&previous.to===from)previous.to=to;else bands.push({from,to,tone:bandTone,label});}
  const rangeLabel=role==='ph'?'Bon : 7,0–7,4 · moyen : 6,8–7,0 et 7,4–7,6':role==='orp'?'Plage cible : 650–750 mV':'Plage OK : 3–16 psi';
  return {tone,label:labelFor(tone,role),rangeLabel,bands};
}
export function bandPath(from:number,to:number,min:number,max:number,radius=46){
  if(![from,to,min,max,radius].every(Number.isFinite)||to<=from||max<=min)return '';
  const a0=Math.min(1,Math.max(0,(from-min)/(max-min))),a1=Math.min(1,Math.max(0,(to-min)/(max-min)));if(a1<=a0)return '';
  const start=135+270*a0,end=135+270*a1,point=(degrees:number)=>{const r=degrees*Math.PI/180;return{x:60+radius*Math.cos(r),y:60+radius*Math.sin(r)};},p0=point(start),p1=point(end);
  return `M ${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${radius} ${radius} 0 ${end-start>180?1:0} 1 ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`;
}
