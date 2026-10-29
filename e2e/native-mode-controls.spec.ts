import{test,expect}from'@playwright/test';
test('Modes : dialogue, boutons, formulaire et retours natifs ; commande confirmée par HA',async({page})=>{
 await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toBeVisible();const modes=page.locator('flowio-modes');
 await expect(modes.locator('ha-button.strategy')).toHaveCount(1);await expect(modes.locator('ha-dialog')).toHaveCount(1);await modes.getByRole('button',{name:'Stratégie de traitement',exact:true}).click();
 await expect(modes.locator('ha-dialog')).toHaveJSProperty('open',true);await expect(modes.locator('.select-row ha-form').first()).toBeVisible();
 const select=modes.getByRole('combobox',{name:'Type de désinfection',exact:true});await expect(select).toHaveValue('Chlore/Brome');
 page.once('dialog',dialog=>dialog.accept());await select.selectOption('Electrolyse');await expect.poll(()=>page.evaluate(()=>(window as any).demo.calls)).toEqual([{domain:'select',service:'select_option',data:{entity_id:'select.fio_pl_modes_dis',option:'Electrolyse'}}]);
 await expect(select).toBeDisabled();await expect(select).toHaveValue('Chlore/Brome');await expect(modes.locator('ha-alert.feedback')).toContainText('en attente');
 await page.evaluate(()=>{const d=(window as any).demo;d.hass.states['select.fio_pl_modes_dis'].state='Electrolyse';d.apply();});await expect(select).toBeEnabled();await expect(select).toHaveValue('Electrolyse');await expect(modes.locator('ha-alert.feedback')).toContainText('État confirmé');
 await page.keyboard.press('Escape');await expect(modes.locator('ha-dialog')).toHaveJSProperty('open',false);
});
test('Modes : valeur hors options refusée sans appel de service',async({page})=>{
 await page.goto('/demo/');await expect(page.locator('flowio-pool-card h2')).toBeVisible();const modes=page.locator('flowio-modes');await modes.getByRole('button',{name:'Stratégie de traitement',exact:true}).click();
 await modes.locator('[data-mode=treatment_type] ha-form').evaluate(el=>el.dispatchEvent(new CustomEvent('value-changed',{detail:{value:{value:'Valeur non autorisée'}},bubbles:true,composed:true})));
 expect(await page.evaluate(()=>(window as any).demo.calls.length)).toBe(0);
});
