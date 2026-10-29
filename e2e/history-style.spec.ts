import{test,expect}from'@playwright/test';
import{preview}from'./preview';

for(const dark of[false,true])test(`style historique ${dark?'sombre':'clair'}`,async({page})=>{
 await preview(page);
 if(dark)await page.locator('#theme').click();
 const card=page.locator('flowio-history-card'),header=card.locator('header.hero'),headerTitle=header.locator('h2'),headerIcon=header.locator('.hero-icon'),frame=card.locator('ha-card.fio-card'),graph=card.locator('.graph').first(),activePeriod=card.locator('.period-button[aria-pressed=true]');
 await expect(headerTitle).toHaveText('Évolution de la piscine');await expect(header.locator('.hero-subtitle')).toHaveCount(0);await expect(headerIcon).toHaveAttribute('icon','mdi:chart-line');
 const headerIconBox=(await headerIcon.boundingBox())!,graphIconBox=(await card.locator('.graph-heading .icon-plate').first().boundingBox())!,headerTitleBox=(await headerTitle.boundingBox())!,graphTitleBox=(await card.locator('.graph-title').first().boundingBox())!;
 expect(Math.abs(headerIconBox.x-graphIconBox.x)).toBeLessThanOrEqual(1);expect(Math.abs(headerTitleBox.x-graphTitleBox.x)).toBeLessThanOrEqual(1);expect(Math.abs(headerIconBox.y+headerIconBox.height/2-headerTitleBox.y-headerTitleBox.height/2)).toBeLessThanOrEqual(1);
 await expect(card.locator('.apexcharts-canvas').first()).toBeVisible();
 await expect(card.locator('ha-button.period-button')).toHaveCount(5);await expect(card.locator('ha-button.refresh')).toHaveCount(1);await expect(card.locator('flowio-history-chart ha-button.zoom')).toHaveCount(12);expect(await card.evaluate(el=>el.querySelectorAll('button').length)).toBe(0);
 expect(await header.evaluate(el=>el.nextElementSibling?.matches('ha-card.fio-card'))).toBe(true);
 const frameStyle=await frame.evaluate(el=>{const style=getComputedStyle(el);return{border:style.borderTopWidth,borderRadius:style.borderTopLeftRadius,shadow:style.boxShadow};});
 expect(frameStyle).toEqual({border:'0px',borderRadius:'0px',shadow:'none'});
 const graphStyle=await graph.evaluate(el=>{const style=getComputedStyle(el);return{borderRadius:style.borderTopLeftRadius,shadow:style.boxShadow};});
 expect(graphStyle.borderRadius).toBe('13px');expect(graphStyle.shadow).not.toBe('none');
 const periodState=await activePeriod.evaluate(el=>({appearance:el.getAttribute('appearance'),pressed:el.getAttribute('aria-pressed'),innerPressed:el.shadowRoot?.querySelector('button')?.getAttribute('aria-pressed')}));
 expect(periodState).toEqual({appearance:'accent',pressed:'true',innerPressed:'true'});
});
