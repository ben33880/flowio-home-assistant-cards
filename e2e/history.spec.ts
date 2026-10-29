import { test, expect } from '@playwright/test';
test.beforeEach(async ({page})=>{
  await page.addInitScript(()=>{
    const w=window as any;w.nativeHistorySpecs=[];
    w.loadCardHelpers=async()=>({createCardElement:(config:any)=>{
      w.nativeHistorySpecs.push(config);const el=document.createElement('article') as any;
      el.className='native-history-mock';el.textContent=config.entities[0];
      Object.defineProperty(el,'hass',{set(value){el.dataset.current=value?.states?.[config.entities[0]]?.state ?? '';}});
      return el;
    }});
  });
  await page.goto('/demo/');
  await expect(page.locator('flowio-pool-card h2')).toHaveText('Piscine · Jardin');
});
async function mount(page:import('@playwright/test').Page, config:Record<string,unknown>){
  await page.evaluate(config=>{const w=window as any;const card=document.createElement('flowio-history-card') as any;card.setConfig(config);card.hass=w.demo.card.hass;document.body.append(card);w.historyCard=card;},config);
}
test('transmet les entités et la durée aux graphiques natifs',async({page})=>{
  await mount(page,{hours_to_show:48,entities:['sensor.demo_ph','sensor.demo_orp']});
  await expect(page.locator('flowio-history-card .native-history-mock')).toHaveCount(2);
  expect(await page.evaluate(()=>(window as any).nativeHistorySpecs)).toEqual([{type:'history-graph',entities:['sensor.demo_ph'],hours_to_show:48},{type:'history-graph',entities:['sensor.demo_orp'],hours_to_show:48}]);
  expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);
});
test('met à jour hass sans reconstruire les graphiques',async({page})=>{
  await mount(page,{entities:['sensor.demo_ph']});
  const graph=page.locator('flowio-history-card .native-history-mock');await expect(graph).toHaveCount(1);
  await page.evaluate(()=>{const w=window as any;w.historyCard.hass={...w.demo.card.hass,states:{'sensor.demo_ph':{state:'7.3',attributes:{}}}};});
  await expect(graph).toHaveAttribute('data-current','7.3');
  expect(await page.evaluate(()=>(window as any).nativeHistorySpecs.length)).toBe(1);
});
test('une configuration vide guide sans inventer de graphique',async({page})=>{
  await mount(page,{});await expect(page.locator('flowio-history-card')).toContainText('Choisir les mesures');
  expect(await page.evaluate(()=>(window as any).nativeHistorySpecs.length)).toBe(0);
});
test('signale les helpers absents et permet de réessayer',async({page})=>{
  await page.evaluate(()=>{const w=window as any;w.savedHelpers=w.loadCardHelpers;delete w.loadCardHelpers;});
  await mount(page,{entities:['sensor.demo_ph']});
  await expect(page.locator('flowio-history-card [role=alert]')).toContainText('Impossible');
  await page.evaluate(()=>{const w=window as any;w.loadCardHelpers=w.savedHelpers;});
  await page.getByRole('button',{name:'Réessayer',exact:true}).click();
  await expect(page.locator('flowio-history-card .native-history-mock')).toHaveCount(1);
});
test('ignore une construction asynchrone devenue obsolète',async({page})=>{
  await page.evaluate(()=>{const w=window as any;w.loadCardHelpers=()=>new Promise(resolve=>{w.finishHelpers=resolve;});});
  await mount(page,{entities:['sensor.demo_ph']});
  await expect.poll(()=>page.evaluate(()=>typeof (window as any).finishHelpers)).toBe('function');
  await page.evaluate(()=>{const w=window as any;w.historyCard.setConfig({entities:[]});w.finishHelpers({createCardElement:()=>{throw new Error('Obsolete build must not execute');}});});
  await expect(page.locator('flowio-history-card')).toContainText('Choisir les mesures');
  await expect(page.locator('flowio-history-card [role=alert]')).toHaveCount(0);
});
