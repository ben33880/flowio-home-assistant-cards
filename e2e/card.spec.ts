import{test,expect}from'@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toHaveText('Piscine · Jardin');});
test('deux cuves avec volumes intégrés, consigne et pompe visibles',async({page})=>{const tanks=page.locator('flowio-pool-card [data-group=tanks]');await expect(tanks.locator('flowio-gauge')).toHaveCount(2);for(const role of ['ph_tank','disinfection_tank'])await expect(tanks.locator(`[data-role=${role}]`)).toHaveCount(0);await expect(tanks.locator('[data-role=ph_tank_percent] .caption')).toHaveText('12.6 L restants');await expect(tanks.locator('[data-role=disinfection_tank_percent] .caption')).toHaveText('8.3 L restants');await expect(page.locator('[data-role=orp] flowio-gauge .target-label')).toContainText('Consigne 700');await expect(page.getByRole('switch',{name:'Démarrer Pompe désinfectant'})).toBeEnabled();});
test('aucun masquage par traitement',async({page})=>{await page.locator('#treatment').selectOption('oxygen');await expect(page.locator('[data-role=orp]')).toBeVisible();await page.locator('#treatment').selectOption('none');await expect(page.locator('[data-role=orp] .target-label')).toContainText('Consigne 700');expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);});
test('sélections indépendantes',async({page})=>{await page.evaluate(()=>{const d=(window as any).demo;d.config.display={measurements:['ph'],setpoints:[],equipment:[],tanks:['ph_tank_percent'],information:[],timing:[]};d.apply();});await expect(page.locator('[data-role=orp]')).toHaveCount(0);await expect(page.locator('[data-role=ph_tank]')).toHaveCount(0);await expect(page.locator('[data-role=ph_tank_percent]')).toBeVisible();});
test('diagnostic masqué si toutes les entités sont présentes et conservé en cas d’absence',async({page})=>{const card=page.locator('flowio-pool-card'),diagnostic=card.locator('details');await page.evaluate(()=>{const d=(window as any).demo;d.config.display={...d.config.display,information:['diagnostics']};d.apply();});await expect(diagnostic).toHaveCount(0);await page.evaluate(()=>{const d=(window as any).demo;delete d.hass.states['sensor.fio_data_117'];d.apply();});await expect(diagnostic).toHaveCount(1);await expect(diagnostic.locator('summary')).toContainText('Configuration · 1 entité(s) absente(s)');});
test('consultation et commande utilisent le bon préfixe',async({page})=>{await page.locator('#prefix').selectOption('piscine');await page.locator('[data-role=water_temperature]').click();await expect(page.locator('#events')).toContainText('sensor.piscine_io_wat_tmp');await page.getByRole('switch',{name:'Démarrer Éclairage'}).click();await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls)).toEqual([{domain:'switch',service:'turn_on',data:{entity_id:'switch.piscine_io_lights'}}]);});
test('annulation de confirmation et indisponibilité',async({page})=>{
 page.once('dialog',d=>d.dismiss());await page.getByRole('switch',{name:'Démarrer Pompe désinfectant'}).click();expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);
 await page.locator('#offline').click();await expect(page.getByRole('switch',{name:'Démarrer Pompe désinfectant'})).toBeDisabled();
 const status=page.locator('flowio-pool-card .hero flowio-header-status'),alarms=status.locator('hui-heading-card ha-heading-badge[data-entity="sensor.fio_alm_active_count"]'),dialog=status.locator('ha-dialog.alarm-dialog');
 await expect(alarms).toBeVisible();await expect(alarms.locator('.state')).toHaveText('Alertes · -');await expect(alarms).toHaveAttribute('data-color','none');
 await expect(alarms.locator('button')).toHaveAttribute('aria-label','Alertes : -');await alarms.locator('button').click();await expect(dialog).toHaveJSProperty('open',true);await expect(dialog.locator('ha-button.reset')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);
});
test('anneau : une absence ne devient pas zéro',async({page})=>{const tile=page.locator('[data-role=disinfection_tank_percent]');await page.evaluate(()=>{const d=(window as any).demo;delete d.hass.states['sensor.fio_data_117'];d.apply();});await expect(tile).toContainText('Entité absente');await expect(tile.locator('flowio-gauge')).toHaveCount(0);await page.evaluate(()=>{const d=(window as any).demo;d.hass.states['sensor.fio_data_117']={state:'0',attributes:{unit_of_measurement:'%'}};d.apply();});await expect(tile.locator('flowio-gauge')).toHaveJSProperty('value',0);await expect(tile.locator('.dial')).toHaveAttribute('data-quality','bad');});
test('éditeur : sérialise display sans identifiants manuels',async({page})=>{const result=await page.evaluate(async()=>{const d=(window as any).demo,e=document.createElement('flowio-pool-card-editor')as any;e.setConfig(d.config);e.hass=d.card.hass;document.body.append(e);await e.updateComplete;let c:any;e.addEventListener('config-changed',(event:any)=>c=event.detail.config);e.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...d.config,display:{...d.config.display,equipment:[]}}},bubbles:true,composed:true}));e.remove();return{equipment:c.display.equipment,manual:false};});expect(result).toEqual({equipment:[],manual:false});});
test('actions firmware, forçage temporaire et télémétrie calculée',async({page})=>{
 await page.evaluate(()=>{const d=(window as any).demo;Object.assign(d.hass.states,{
  'button.fio_pd_refill_ph':{state:'unknown',attributes:{}},
  'select.fio_pdm_ovr_target':{state:'pd1',attributes:{options:['pd0','pd1']}},
  'number.fio_pdm_ovr_min':{state:'15',attributes:{unit_of_measurement:'min'}},
  'sensor.fio_pdm_ovr_state':{state:'guided',attributes:{control_mode:'guided',override_available:true,override_remaining_s:0}},
  'sensor.fio_pdm_ovr_active':{state:'0',attributes:{}},
  'button.fio_pdm_ovr_on':{state:'unknown',attributes:{}},
  'button.fio_pdm_ovr_off':{state:'unknown',attributes:{}},
  'button.fio_pdm_ovr_release':{state:'unknown',attributes:{}},
  'sensor.fio_io_value_v00':{state:'12.4',attributes:{friendly_name:'Débit calculé',unit_of_measurement:'m³/h'}},
  'sensor.fio_data_195':{state:'28.1',attributes:{unit_of_measurement:'°C'}},
  'sensor.fio_wifi_ip':{state:'192.0.2.10',attributes:{}},
  'sensor.fio_sys_upt_mn':{state:'120',attributes:{unit_of_measurement:'min'}}
 });d.config.display={...d.config.display,equipment:[],information:['network','system'],operations:['refill_ph','timed_override'],calculated_values:['v00'],device_metrics:['water_in']};d.apply();});
 await expect(page.locator('[data-entity="sensor.fio_io_value_v00"]')).toContainText('12.4');
 await expect(page.locator('[data-entity="sensor.fio_data_195"]')).toContainText('28.1');
 await expect(page.locator('[data-panel=network]')).toContainText('192.0.2.10');
 page.on('dialog',dialog=>{void dialog.accept();});
 await page.locator('[data-operation=refill_ph]').click();
 await page.locator('[data-panel=timed-override] input').fill('30');
 await page.locator('[data-override=on]').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls)).toEqual([
  {domain:'button',service:'press',data:{entity_id:'button.fio_pd_refill_ph'}},
  {domain:'number',service:'set_value',data:{value:30,entity_id:'number.fio_pdm_ovr_min'}},
  {domain:'button',service:'press',data:{entity_id:'button.fio_pdm_ovr_on'}}
 ]);
});
