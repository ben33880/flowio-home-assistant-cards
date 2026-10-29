import{test,expect}from'@playwright/test';
for(const width of [390,1400])test(`titres hors cadres et switches alignés à ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1800});
  await page.goto('/demo/');
  const card=page.locator('flowio-pool-card');
  await expect(card.locator('h2')).toBeVisible();
  await page.evaluate(()=>{const d=(window as any).demo;d.config.display.equipment=['filtration','ph_pump','disinfection_pump','heater','lighting','robot','filling','electrolyzer'];if(window.innerWidth>1200)document.querySelector('main')!.style.maxWidth='none';d.apply();});
  const equipment=card.locator('.equipment-grid'),modes=card.locator('flowio-modes .modes-content');
  await expect(card.locator('.operations-pane')).toHaveCSS('border-top-width','0px');
  await expect(card.locator('.dashboard-top')).toHaveCSS('gap',width===390?'18px':'32px');
  const columns:number[][]=[];
  for(const [frame,heading,rows]of [
    [equipment,card.locator('.equipment-pane .section-heading'),equipment.locator('.control')],
    [modes,card.locator('flowio-modes .heading'),modes.locator('.mode-list>.mode-row')]
  ]as const){
    await expect(frame).toHaveCSS('border-top-width','1px');
    await expect(frame).toHaveCSS('border-radius','12px');
    const f=(await frame.boundingBox())!,h=(await heading.boundingBox())!;
    expect(h.y+h.height).toBeLessThanOrEqual(f.y);
    const groups:Array<{left:number;switches:number[]}>=[];
    expect(await rows.count()).toBeGreaterThan(2);
    for(const row of await rows.all()){
      const r=(await row.boundingBox())!,s=(await row.locator('ha-switch').boundingBox())!;
      if(width===390){
        expect(Math.abs(r.x-f.x-9)).toBeLessThanOrEqual(1);
        expect(Math.abs(r.width-f.width+18)).toBeLessThanOrEqual(1);
      }else expect(r.width).toBeLessThanOrEqual(220.1);
      expect(s.x+s.width).toBeLessThanOrEqual(r.x+r.width+1);
      let group=groups.find(g=>Math.abs(g.left-r.x)<=1);
      if(!group){group={left:r.x,switches:[]};groups.push(group);}
      group.switches.push(s.x);
    }
    expect(groups.length).toBe(width===390?1:2);
    for(const group of groups)expect(Math.max(...group.switches)-Math.min(...group.switches)).toBeLessThanOrEqual(1);
    columns.push(groups.sort((a,b)=>a.left-b.left).map(g=>g.switches[0]));
  }
  for(let i=0;i<columns[0].length;i++)expect(Math.abs(columns[0][i]-columns[1][i])).toBeLessThanOrEqual(1);
  expect(await card.locator('.body').evaluate(el=>el.scrollWidth>el.clientWidth)).toBe(false);
});
