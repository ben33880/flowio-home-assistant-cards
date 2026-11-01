import { test, expect } from '@playwright/test';

for (const prefix of ['fio', 'piscine']) {
  test(`sélecteurs synchronisés après annulation et états externes ${prefix}`, async ({ page }) => {
    await page.goto('/demo/');
    await expect(page.locator('flowio-pool-card h2')).toBeVisible();
    await page.locator('#prefix').selectOption(prefix);
    await page.evaluate(prefix => {
      const demo = (window as any).demo;
      demo.hass.states[`select.${prefix}_pl_modes_dis`].state = 'Electrolyse';
      demo.apply();
    }, prefix);

    const modes = page.locator('flowio-modes');
    await modes.getByRole('button', { name: 'Stratégie de traitement', exact: true }).click();
    const treatment = modes.getByRole('combobox', { name: 'Type de désinfection', exact: true });
    const swg = modes.getByRole('combobox', { name: 'Pilotage électrolyseur', exact: true });
    await expect(treatment).toHaveValue('Electrolyse');
    await expect(swg).toHaveValue('Continu sur filtration');
    page.once('dialog', dialog => dialog.dismiss());
    await treatment.selectOption('Chlore/Brome');
    await expect(treatment).toHaveValue('Electrolyse');
    expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);

    for (const value of ['Oxygène actif', 'Electrolyse', 'Désactivé', 'Chlore/Brome']) {
      await page.evaluate(({ prefix, value }) => {
        const demo = (window as any).demo;
        demo.hass.states[`select.${prefix}_pl_modes_dis`].state = value;
        demo.apply();
      }, { prefix, value });
      await expect(treatment).toHaveValue(value);
    }

    await page.evaluate(prefix => {
      const demo = (window as any).demo;
      demo.hass.states[`select.${prefix}_pl_modes_dis`].state = 'Electrolyse';
      demo.apply();
    }, prefix);
    for (const value of ['Suivi consigne ORP', 'Continu sur filtration']) {
      await page.evaluate(({ prefix, value }) => {
        const demo = (window as any).demo;
        demo.hass.states[`select.${prefix}_pl_swg_ctrl`].state = value;
        demo.apply();
      }, { prefix, value });
      await expect(swg).toHaveValue(value);
    }

    await page.evaluate(prefix => {
      const demo = (window as any).demo;
      demo.hass.states[`select.${prefix}_pl_modes_dis`].state = 'unavailable';
      demo.apply();
    }, prefix);
    await expect(treatment).toBeDisabled();
    await expect(treatment).toHaveValue('Indisponible');
    await expect(swg).toHaveCount(0);
    await page.evaluate(prefix => {
      const demo = (window as any).demo;
      demo.hass.states[`select.${prefix}_pl_modes_dis`].state = 'Chlore/Brome';
      demo.apply();
    }, prefix);
    await expect(treatment).toBeEnabled();
    await expect(treatment).toHaveValue('Chlore/Brome');
    expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);
  });
}
