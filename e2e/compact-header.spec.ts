import{test,expect}from'@playwright/test';
for(const width of [390,1100])test(`entête native et tuiles sans pied à ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1200});await page.goto('/demo/');
  const pool=page.locator('flowio-pool-card');await expect(pool.locator('h2')).toBeVisible();
  await page.evaluate(()=>{const d=(window as any).demo,h=document.createElement('flowio-history-card')as any;d.card.setConfig(d.card.constructor.getStubConfig());h.setConfig({measurements:[]});h.hass=d.card.hass;document.querySelector('main')!.append(h);});
  await expect(pool.locator('hui-heading-card')).toHaveCount(1);await expect(pool.locator('.hero h2')).toHaveText('Supervision & pilotage');await expect(pool.locator('.hero-subtitle')).toHaveCount(0);expect(await pool.locator('hui-heading-card').evaluate(el=>({icon:(el as HTMLElement&{_config?:{icon?:string}})._config?.icon,iconSize:getComputedStyle(el).getPropertyValue('--mdc-icon-size').trim(),iconColor:getComputedStyle(el).getPropertyValue('--state-icon-color').trim()}))).toEqual({icon:'mdi:pool-thermometer',iconSize:'30px',iconColor:'#0074b8'});
  const history=page.locator('flowio-history-card'),historyTitle=history.locator('.hero h2'),historyIcon=history.locator('.hero-icon'),poolTitle=pool.locator('hui-heading-card h2'),sectionTitle=pool.locator('.measurement-section[data-section=quality]>.section-heading h3');
  await expect(historyTitle).toBeVisible();await expect(history.locator('.eyebrow')).toBeHidden();await expect(history.locator('.hero-subtitle')).toHaveCount(0);await expect(historyIcon).toHaveAttribute('icon','mdi:chart-line');
  await expect.poll(async()=>{const title=await poolTitle.boundingBox(),sectionText=await sectionTitle.evaluate(el=>{const text=Array.from(el.childNodes).find(node=>node.nodeType===Node.TEXT_NODE);if(!text)return undefined;const range=document.createRange();range.selectNodeContents(text);return range.getBoundingClientRect().x;});return title&&sectionText!==undefined?Math.abs(title.x-sectionText):Infinity;}).toBeLessThanOrEqual(1);
  await expect.poll(async()=>{const title=await historyTitle.boundingBox(),icon=await historyIcon.boundingBox();return title&&icon?Math.abs(title.y+title.height/2-icon.y-icon.height/2):Infinity;}).toBeLessThanOrEqual(1);
  for(const[card,limit]of [[pool,128],[history,84]]as const)await expect.poll(async()=>{const box=await card.locator('.hero').boundingBox();return box?.height??Infinity;}).toBeLessThanOrEqual(limit);
  const footers=pool.locator('.metric-foot');expect(await footers.count()).toBeGreaterThan(0);for(const footer of await footers.all())await expect(footer).toBeHidden();
  await pool.locator('[data-role=water_temperature]').click();await expect(page.locator('#events')).toContainText('sensor.fio_io_wat_tmp');
  await page.evaluate(()=>{const d=(window as any).demo;d.config.title='Bassin extérieur';d.apply();});await expect(pool.locator('.hero h2')).toHaveText('Bassin extérieur');
});
