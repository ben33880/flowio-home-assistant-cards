import { test, expect } from '@playwright/test';

test('modes liés aux équipements affichés, choix conservés et aucun appel de service', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page.locator('flowio-modes')).toBeVisible();
  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display.modes = ['filtration_auto', 'winter', 'ph_auto', 'disinfection_auto', 'heater_auto', 'disinfection_type', 'swg_control', 'ph_dose_plus', 'o2_temp_comp'];
    demo.config.display.equipment = ['filtration', 'ph_pump', 'disinfection_pump'];
    demo.config.display.treatment = 'chlorine_bromine';
    demo.apply();
  });

  const modes = page.locator('flowio-modes');
  await expect(modes.locator('[data-mode=ph_auto]')).toHaveCount(1);
  await expect(modes.locator('[data-mode=heater_auto]')).toHaveCount(0);
  await expect(modes.locator('[data-mode=swg_control]')).toHaveCount(0);
  await modes.getByRole('button', { name: 'Stratégie de traitement', exact: true }).click();
  await expect(modes.locator('[data-mode=disinfection_type]')).toBeVisible();
  await expect(modes.locator('[data-mode=ph_dose_plus]')).toBeVisible();
  await expect(modes.locator('[data-mode=o2_temp_comp]')).toBeVisible();
  await page.keyboard.press('Escape');
  const saved = await page.evaluate(() => (window as any).demo.config.display.modes);

  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display.equipment = ['disinfection_pump'];
    demo.config.display.treatment = 'electrolyzer';
    demo.apply();
  });
  await expect(modes.locator('.mode-list .mode-row')).toHaveCount(1);
  await modes.getByRole('button', { name: 'Stratégie de traitement', exact: true }).click();
  await expect(modes.locator('[data-mode=swg_control]')).toBeVisible();
  await expect(modes.locator('[data-mode=ph_dose_plus]')).toHaveCount(0);
  await expect(modes.locator('[data-mode=o2_temp_comp]')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display.equipment = [];
    demo.apply();
  });
  await expect(modes).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).demo.config.display.modes)).toEqual(saved);

  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display.equipment = ['disinfection_pump', 'heater', 'ph_pump'];
    demo.hass.states['select.fio_pl_swg_ctrl'].state = 'unavailable';
    demo.apply();
  });
  await expect(modes.locator('[data-mode=heater_auto]')).toBeVisible();
  await expect(modes.locator('[data-mode=ph_auto]')).toBeVisible();
  await modes.getByRole('button', { name: 'Stratégie de traitement', exact: true }).click();
  await expect(modes.getByRole('combobox', { name: 'Pilotage électrolyseur', exact: true })).toBeDisabled();
  await expect(modes.locator('[data-mode=swg_control]')).toBeVisible();
  expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);
});
