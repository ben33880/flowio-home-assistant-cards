import{test,expect}from'@playwright/test';
for(const width of [390,1100])test(`entête native hors cadre à ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1600});await page.goto('/demo/');const card=page.locator('flowio-pool-card'),header=card.locator('.hero'),frame=card.locator('ha-card.fio-card'),native=header.locator('hui-heading-card');
 await expect(native.locator('h2')).toBeVisible();await expect(frame.locator('.hero')).toHaveCount(0);await expect(header).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await expect(header).toHaveCSS('background-image','none');await expect(header).toHaveCSS('border-bottom-width','0px');
 const title=(await native.locator('h2').boundingBox())!,badges=(await native.locator('.badges').boundingBox())!,h=(await header.boundingBox())!,f=(await frame.boundingBox())!;
 expect(h.y+h.height).toBeLessThanOrEqual(f.y+1);expect(badges.x).toBeGreaterThanOrEqual(title.x+title.width-1);expect(badges.x+badges.width).toBeLessThanOrEqual(h.x+h.width+1);
 expect(await header.evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);expect(await card.evaluate(el=>el.scrollWidth>el.clientWidth+1)).toBe(false);
 await page.evaluate(()=>{const d=(window as any).demo;d.config.title='Bassin extérieur';d.apply();});await expect(native.locator('h2')).toHaveText('Bassin extérieur');
});
