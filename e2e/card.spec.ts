import{test,expect}from'@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toHaveText('Piscine · Jardin');});
test('nouvelle carte configurée en pleine largeur dans une vue Sections',async({page})=>{const options=await page.locator('flowio-pool-card').evaluate(card=>(card.constructor as typeof HTMLElement&{getStubConfig:()=>{grid_options?:{columns?:unknown}}}).getStubConfig().grid_options);expect(options).toEqual({columns:'full'});});
test('deux cuves avec volumes intégrés, consigne et pompe visibles',async({page})=>{const tanks=page.locator('flowio-pool-card [data-group=tanks]');await expect(tanks.locator('flowio-gauge')).toHaveCount(2);for(const role of ['ph_tank','disinfection_tank'])await expect(tanks.locator(`[data-role=${role}]`)).toHaveCount(0);await expect(tanks.locator('[data-tank-action=ph] .tank-volume')).toHaveText('12.6 L restants');await expect(tanks.locator('[data-tank-action=disinfection] .tank-volume')).toHaveText('8.3 L restants');await expect(page.locator('[data-role=orp] flowio-gauge .target-label')).toContainText('Consigne 700');await expect(page.getByRole('switch',{name:'Démarrer Pompe désinfectant'})).toBeEnabled();});
test('aucun masquage par traitement',async({page})=>{await page.locator('#treatment').selectOption('oxygen');await expect(page.locator('[data-role=orp]')).toBeVisible();await page.locator('#treatment').selectOption('none');await expect(page.locator('[data-role=orp] .target-label')).toContainText('Consigne 700');expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);});
test('le mode firmware ne modifie pas le libellé ORP de la qualité de l’eau',async({page})=>{for(const value of ['Désactivé','Electrolyse','Chlore/Brome','Oxygène actif']){await page.evaluate(value=>{const d=(window as any).demo;d.hass.states['select.fio_pl_modes_dis'].state=value;d.apply();},value);await expect(page.locator('[data-role=orp] .metric-label')).toHaveText('ORP');}expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);});
test('la commande Pompe désinfectant pilote l’électrolyseur en fonction du mode firmware',async({page})=>{await page.evaluate(()=>{const d=(window as any).demo;d.hass.states['select.fio_pl_modes_dis'].state='Electrolyse';d.config.display.equipment=['disinfection_pump'];d.hass.states['switch.fio_io_chl_gen']={state:'off',attributes:{}};d.apply();});const card=page.locator('flowio-pool-card');await expect(card.locator('[data-equipment=electrolyzer]')).toHaveCount(0);await expect(card.locator('[data-equipment=disinfection_pump]')).toHaveAttribute('data-on','false');await expect(card.getByRole('switch',{name:'Démarrer Électrolyseur'})).toBeEnabled();page.once('dialog',dialog=>dialog.accept());await card.getByRole('switch',{name:'Démarrer Électrolyseur'}).click();await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls.at(-1))).toEqual({domain:'switch',service:'turn_on',data:{entity_id:'switch.fio_io_chl_gen'}});});
test('un mode de traitement indisponible bloque les commandes de désinfection',async({page})=>{await page.evaluate(()=>{const d=(window as any).demo;d.hass.states['select.fio_pl_modes_dis'].state='unavailable';d.config.display.operations=['refill_disinfection','reset_disinfection'];d.apply();});const card=page.locator('flowio-pool-card');await expect(card.getByRole('switch',{name:'Démarrer Pompe désinfectant'})).toBeDisabled();await expect(card.locator('[data-operation=refill_disinfection]')).toHaveCount(0);await expect(card.locator('[data-operation=reset_disinfection]')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);});
test('bouton Système visible et activable au toucher avant le chargement natif sur mobile',async({browser})=>{const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage();try{await page.addInitScript(()=>{Object.defineProperty(window,'loadCardHelpers',{configurable:true,get:()=>undefined,set:load=>{Object.defineProperty(window,'loadCardHelpers',{configurable:true,value:async()=>{await new Promise(resolve=>setTimeout(resolve,800));return load();}});}});});await page.goto('http://127.0.0.1:4173/demo/');await expect(page.locator('flowio-pool-card h2')).toBeVisible();await page.evaluate(()=>{const d=(window as any).demo;d.config.display.information=['system'];d.apply();});const status=page.locator('flowio-header-status'),button=status.getByRole('button',{name:'Système'}),dialog=status.locator('ha-dialog.information-dialog');await expect(button).toBeVisible();await expect(button).toBeEnabled();const box=(await button.boundingBox())!;expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);await button.tap();await expect(dialog).toHaveJSProperty('open',true);}finally{await context.close();}});
test('sélections indépendantes',async({page})=>{await page.evaluate(()=>{const d=(window as any).demo;d.config.display={measurements:['ph'],setpoints:[],equipment:[],tanks:['ph_tank_percent'],information:[],timing:[]};d.apply();});await expect(page.locator('[data-role=orp]')).toHaveCount(0);await expect(page.locator('[data-role=ph_tank]')).toHaveCount(0);await expect(page.locator('[data-role=ph_tank_percent]')).toBeVisible();});
test('diagnostic masqué si toutes les entités sélectionnées sont présentes et conservé en cas d’absence',async({page})=>{const card=page.locator('flowio-pool-card'),diagnostic=card.locator('details');await page.evaluate(()=>{const d=(window as any).demo;d.config.display={measurements:[],injections:[],setpoints:[],equipment:[],modes:[],tanks:['disinfection_tank_percent'],information:['diagnostics'],timing:[],calculated_values:[],device_metrics:[],operations:[],treatment:'chlorine_bromine'};d.apply();});await expect(diagnostic).toHaveCount(0);await page.evaluate(()=>{const d=(window as any).demo;delete d.hass.states['sensor.fio_data_117'];d.apply();});await expect(diagnostic).toHaveCount(1);await expect(diagnostic.locator('summary')).toContainText('Configuration · 1 entité(s) absente(s)');});
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
test('éditeur : le mode est déterminé par le firmware, pas par une option redondante',async({page})=>{const result=await page.evaluate(async()=>{const d=(window as any).demo,e=document.createElement('flowio-pool-card-editor')as any;e.setConfig(d.config);e.hass=d.card.hass;document.body.append(e);await e.updateComplete;const form=e.shadowRoot.querySelector('ha-form'),display=form.schema.find((field:any)=>field.name==='display'),modeOptions=display.schema.find((field:any)=>field.name==='modes').selector.select.options,informationOptions=display.schema.find((field:any)=>field.name==='information').selector.select.options;let c:any;e.addEventListener('config-changed',(event:any)=>c=event.detail.config);form.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...d.config,display:{...d.config.display,equipment:[],treatment:'oxygen'}}},bubbles:true,composed:true}));e.remove();return{equipment:c.display.equipment,hasTreatment:'treatment'in c.display,hasTreatmentSelector:display.schema.some((field:any)=>field.name==='treatment'),modeLabel:modeOptions.find((option:any)=>option.value==='disinfection_type').label,informationLabel:informationOptions.find((option:any)=>option.value==='treatment_type').label};});expect(result).toEqual({equipment:[],hasTreatment:false,hasTreatmentSelector:false,modeLabel:'Commande · type de désinfection',informationLabel:'Badge · traitement annoncé'});});
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
 });d.config.display={...d.config.display,equipment:[],tanks:['ph_tank_percent','disinfection_tank_percent'],information:['network','system'],timing:[],operations:['refill_ph','timed_override'],calculated_values:['v00'],device_metrics:['water_in']};d.apply();});
 await expect(page.locator('[data-entity="sensor.fio_io_value_v00"]')).toContainText('12.4');
 await expect(page.locator('[data-entity="sensor.fio_data_195"]')).toContainText('28.1');
 const information=page.locator('flowio-header-status'),informationDialog=information.locator('ha-dialog.information-dialog');
 await information.getByRole('button',{name:'Système'}).click();
 await expect(informationDialog.locator('[data-group=network]')).toContainText('192.0.2.10');
 await informationDialog.locator('ha-button.close').click();
 page.on('dialog',dialog=>{void dialog.accept();});
 await page.locator('[data-operation=refill_ph]').click();
 const overrideButton=page.locator('[data-open-override]'),overrideDialog=page.locator('flowio-firmware-panel ha-dialog[data-panel=timed-override]');
 await expect(page.locator('flowio-firmware-panel .panel[data-panel=operations]')).toHaveCount(0);
 await expect(page.getByText('Actions Flow.io',{exact:true})).toHaveCount(0);
 await expect(page.locator('flowio-timing [data-timing=filtration_schedule] [data-open-override]')).toHaveCount(1);
 await expect(page.locator('flowio-timing [data-timing=filtration_schedule] .override-action-row')).toHaveCSS('justify-content','flex-start');
 await expect(page.locator('flowio-firmware-panel [data-open-override]')).toHaveCount(0);
 await expect(overrideButton).toBeVisible();await overrideButton.click();await expect(overrideDialog).toHaveJSProperty('open',true);
 await expect(overrideDialog.locator('ha-form')).toBeVisible();
 await overrideDialog.locator('ha-form select').selectOption('pd0');
 await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls.length)).toBe(2);
 await page.getByRole('spinbutton',{name:'Durée (minutes)'}).fill('30');
 await page.locator('[data-override=on]').click();
 await expect(overrideDialog.locator('[data-confirm-override]')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls.length)).toBe(2);
 await overrideDialog.locator('[data-cancel-override]').click();
 await expect(overrideDialog.locator('[data-confirm-override]')).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls.length)).toBe(2);
 await page.locator('[data-override=on]').click();
 await overrideDialog.locator('[data-confirm-override]').click();
 await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls)).toEqual([
  {domain:'button',service:'press',data:{entity_id:'button.fio_pd_refill_ph'}},
  {domain:'select',service:'select_option',data:{option:'pd0',entity_id:'select.fio_pdm_ovr_target'}},
  {domain:'number',service:'set_value',data:{value:30,entity_id:'number.fio_pdm_ovr_min'}},
  {domain:'button',service:'press',data:{entity_id:'button.fio_pdm_ovr_on'}}
 ]);
 await expect(overrideDialog).toHaveJSProperty('open',false);
});
