import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.goto('/demo/'); await expect(page.locator('flowio-pool-card h2')).toHaveText('Piscine · Jardin'); });
test('chlore : pas de commande électrolyse ou O2', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Démarrer Pompe chlore / brome', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Démarrer Électrolyseur', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Démarrer Pompe oxygène actif', exact: true })).toHaveCount(0);
});
test('O2 : masque ORP et commande chlore', async ({ page }) => {
  await page.locator('#treatment').selectOption('oxygen');
  await expect(page.getByRole('button', { name: 'Démarrer Pompe oxygène actif', exact: true })).toBeVisible();
  await expect(page.locator('flowio-pool-card .measure').filter({ hasText: 'ORP' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Démarrer Pompe chlore / brome', exact: true })).toHaveCount(0);
});
test('un clic de consultation ne commande pas', async ({ page }) => {
  await page.locator('flowio-pool-card .measure').filter({ hasText: 'Eau' }).click();
  await expect(page.locator('#events')).toContainText('sensor.demo_water');
  expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);
});
test('commande explicite via HA simulé', async ({ page }) => {
  await page.getByRole('button', { name: 'Démarrer Éclairage', exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).demo.calls)).toEqual([{domain:'switch',service:'turn_on',data:{entity_id:'switch.demo_lights'}}]);
});
test('annuler la confirmation ne commande pas le dosage', async ({ page }) => {
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('button', { name: 'Démarrer Pompe chlore / brome', exact: true }).click();
  expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);
});
test('incohérence : désinfection verrouillée', async ({ page }) => {
  await page.evaluate(() => { const d=(window as any).demo; d.hass.states['select.demo_treatment'].state='Electrolyse'; d.apply(); });
  await expect(page.getByRole('alert')).toContainText('ne correspond pas');
  await expect(page.getByRole('button', { name: 'Démarrer Pompe chlore / brome', exact: true })).toBeDisabled();
});
test('hors ligne : pas de fausse absence d’alarme et commandes désactivées', async ({ page }) => {
  await page.locator('#offline').click();
  await expect(page.locator('flowio-pool-card .status')).toContainText('non disponible');
  await expect(page.getByRole('button', { name: 'Démarrer Éclairage', exact: true })).toBeDisabled();
});
test('alarme visible même si équipements masqués', async ({ page }) => {
  await page.evaluate(() => { const d=(window as any).demo; d.config.features={filtration:false,ph_control:false,heating:false,robot:false,lighting:false,filling:false}; d.hass.states['binary_sensor.demo_alarm'].state='on'; d.apply(); });
  await expect(page.locator('flowio-pool-card .status')).toContainText('Alarme active');
  await expect(page.getByRole('button', { name: 'Démarrer Éclairage', exact: true })).toHaveCount(0);
});
test('événement de configuration de l’éditeur', async ({ page }) => {
  const result=await page.evaluate(async () => {
    const d=(window as any).demo; const editor=document.createElement('flowio-pool-card-editor') as any;
    editor.setConfig(d.config);editor.hass=d.card.hass;document.body.append(editor);await editor.updateComplete;
    let received:any;editor.addEventListener('config-changed',(event:any)=>{received=event.detail.config;});
    editor.shadowRoot.querySelector('ha-form').dispatchEvent(new CustomEvent('value-changed',{detail:{value:{...d.config,treatment:'oxygen',entities:{...d.config.entities,filtration:null}}},bubbles:true,composed:true}));
    editor.remove();return {treatment:received?.treatment,cleared:received?.entities.filtration===undefined};
  });
  expect(result).toEqual({treatment:'oxygen',cleared:true});
});
for (const width of [390,1440]) for (const dark of [false,true]) {
  test(`capture ${width}px ${dark?'sombre':'clair'}`, async ({ page }, info) => {
    await page.setViewportSize({width,height:1000});
    if(dark) await page.locator('#theme').click();
    const colors=await page.locator('flowio-pool-card h2').evaluate(el=>getComputedStyle(el).color);
    expect(colors).toBe(dark?'rgb(230, 234, 240)':'rgb(32, 33, 36)');
    const overflow=await page.locator('flowio-pool-card .body').evaluate(el=>el.scrollWidth>el.clientWidth);
    expect(overflow).toBe(false);
    await info.attach('apercu',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
}
