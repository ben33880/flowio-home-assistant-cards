import{test,expect}from'@playwright/test';
import{preview}from'./preview';

for(const dark of[false,true])test(`style historique ${dark?'sombre':'clair'}`,async({page})=>{
 await preview(page);
 if(dark)await page.locator('#theme').click();
 const card=page.locator('flowio-history-card'),frame=card.locator('ha-card.fio-card'),graph=card.locator('.graph').first(),activePeriod=card.locator('.period-button[aria-pressed=true]');
 await expect(card.locator('.apexcharts-canvas').first()).toBeVisible();
 await expect(card.locator('ha-button.period-button')).toHaveCount(5);await expect(card.locator('ha-button.refresh')).toHaveCount(1);await expect(card.locator('flowio-history-chart ha-button.zoom')).toHaveCount(12);expect(await card.evaluate(el=>el.querySelectorAll('button').length)).toBe(0);
 const frameStyle=await frame.evaluate(el=>{const style=getComputedStyle(el);return{border:style.borderTopWidth,borderRadius:style.borderTopLeftRadius,shadow:style.boxShadow};});
 expect(frameStyle).toEqual({border:'1px',borderRadius:'16px',shadow:expect.not.stringMatching(/^none$/)});
 const graphStyle=await graph.evaluate(el=>{const style=getComputedStyle(el);return{borderRadius:style.borderTopLeftRadius,shadow:style.boxShadow};});
 expect(graphStyle.borderRadius).toBe('16px');expect(graphStyle.shadow).not.toBe('none');
 const periodState=await activePeriod.evaluate(el=>({appearance:el.getAttribute('appearance'),pressed:el.getAttribute('aria-pressed'),innerPressed:el.shadowRoot?.querySelector('button')?.getAttribute('aria-pressed')}));
 expect(periodState).toEqual({appearance:'accent',pressed:'true',innerPressed:'true'});
});
