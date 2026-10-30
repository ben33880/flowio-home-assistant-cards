import{test,expect}from'@playwright/test';
for(const width of [390,1100])test(`qualité et équipements en haut, horaires ensuite à ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1800});await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toBeVisible();
 for(const items of [['filtration_schedule','filtration_runtime','ph_runtime','disinfection_runtime'],['filtration_schedule'],['ph_runtime'],[]]){
  await page.evaluate(items=>{const d=(window as any).demo;d.config.display.timing=items;d.apply();},items);
  const timings=page.locator('flowio-pool-card flowio-timing');await expect(timings).toHaveCount(items.length?1:0);await expect(page.getByRole('heading',{name:'Horaires & durées',exact:true})).toHaveCount(items.length?1:0);
  await expect(page.getByRole('heading',{name:'Mesures',exact:true})).toHaveCount(0);await expect(page.locator('flowio-pool-card .dashboard-top .section-heading').first()).toHaveText('Qualité de l’eau');
  await expect(page.locator('flowio-pool-card .measurement-section h3')).toHaveText(['Qualité de l’eau','Pression','Températures']);
  if(items.length){await expect(timings.locator('[data-timing]')).toHaveCount(items.length);for(const item of items)await expect(timings.locator(`[data-timing=${item}]`)).toHaveCount(1);const heading=await timings.locator('.section-heading').boundingBox(),t=await timings.boundingBox(),top=await page.locator('flowio-pool-card .dashboard-top').boundingBox();expect(heading).not.toBeNull();expect(t).not.toBeNull();expect(top).not.toBeNull();expect(heading!.y-(top!.y+top!.height)).toBeCloseTo(12,0);expect(top!.y+top!.height).toBeLessThanOrEqual(t!.y);}
 }
});
test('horaires toujours affichables sans mesures sélectionnées',async({page})=>{await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toBeVisible();await page.evaluate(()=>{const d=(window as any).demo;d.config.display.measurements=[];d.config.display.timing=['filtration_schedule'];d.apply();});await expect(page.locator('[data-group=measurements]')).toHaveCount(0);await expect(page.getByRole('heading',{name:'Mesures',exact:true})).toHaveCount(0);await expect(page.locator('flowio-pool-card flowio-timing')).toHaveCount(1);await expect(page.getByRole('heading',{name:'Horaires & durées',exact:true})).toBeVisible();});
