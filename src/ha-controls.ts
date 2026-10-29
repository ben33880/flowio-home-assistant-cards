type CardHelpers={createCardElement?:(config:Record<string,unknown>)=>HTMLElement};
const loads=new Map<string,Promise<void>>();
export function ensureHaElements(names:readonly string[]):Promise<void>{
 const missing=()=>names.filter(name=>!customElements.get(name));if(!missing().length)return Promise.resolve();
 const key=[...names].sort().join(',');const existing=loads.get(key);if(existing)return existing;
 const promise=(async()=>{
  const load=(window as Window&{loadCardHelpers?:()=>Promise<CardHelpers>}).loadCardHelpers;
  if(!load)throw new Error('Contrôles Home Assistant non chargés');const helpers=await load();
  if(missing().length&&helpers.createCardElement){
   const card=helpers.createCardElement({type:'entities',entities:[]});
   const constructor=card.constructor as typeof HTMLElement&{getConfigElement?:()=>Promise<HTMLElement>};
   if(constructor.getConfigElement)await constructor.getConfigElement();
  }
  const unavailable=missing();if(unavailable.length){console.error('[flowio] Composants HA indisponibles :',unavailable);throw new Error(`Composants HA indisponibles : ${unavailable.join(', ')}`);}
 })().catch(error=>{loads.delete(key);throw error;});loads.set(key,promise);return promise;
}
