import { expect, test } from '@playwright/test';

for (const width of [390, 1100]) {
  test(`réinitialisations sous les durées correspondantes à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1400 });
    await page.goto('/demo/');
    await page.evaluate(() => {
      const demo = (window as any).demo;
      const duration = (state: string) => ({ state, attributes: { unit_of_measurement: 's' } });
      Object.assign(demo.hass.states, {
        'sensor.fio_pl_flt_start': { state: '8', attributes: {} },
        'sensor.fio_pl_flt_stop': { state: '20', attributes: {} },
        'sensor.fio_data_144': duration('7200'),
        'sensor.fio_data_145': duration('3600'),
        'sensor.fio_data_146': duration('1800'),
        'button.fio_pd_reset_upt_flt': { state: 'unknown', attributes: {} },
        'button.fio_pd_reset_upt_ph': { state: 'unknown', attributes: {} },
        'button.fio_pd_reset_upt_chl': { state: 'unknown', attributes: {} }
      });
      demo.config.display.timing = ['filtration_schedule'];
      demo.config.display.operations = ['reset_filtration', 'reset_ph', 'reset_disinfection'];
      demo.apply();
    });

    const card = page.locator('flowio-pool-card');
    const timing = card.locator('flowio-timing');
    await expect(timing.getByRole('heading', { name: 'Horaires & durées' })).toBeVisible();
    await expect(timing.locator('.schedule')).toBeVisible();

    const cases = [
      { item: 'filtration_runtime', operation: 'reset_filtration', entity: 'button.fio_pd_reset_upt_flt', label: 'Réinitialiser la durée filtration' },
      { item: 'ph_runtime', operation: 'reset_ph', entity: 'button.fio_pd_reset_upt_ph', label: 'Réinitialiser la durée pompe pH' },
      { item: 'disinfection_runtime', operation: 'reset_disinfection', entity: 'button.fio_pd_reset_upt_chl', label: 'Réinitialiser la durée désinfection' }
    ] as const;

    for (const item of cases) {
      const row = timing.locator(`[data-runtime-item=${item.item}]`);
      const action = row.locator(`[data-operation=${item.operation}]`);
      await expect(row.locator('.runtime-stat')).toBeVisible();
      await expect(action).toBeVisible();
      await expect(action).toHaveAttribute('title', item.label);
      await expect(action).toHaveText('');
      const runtimeBox = (await row.locator('.runtime-stat').boundingBox())!;
      const labelBox = (await row.locator('.runtime-label').boundingBox())!;
      const actionBox = (await action.boundingBox())!;
      const rowBox = (await row.boundingBox())!;
      expect(actionBox.y).toBeGreaterThanOrEqual(runtimeBox.y + runtimeBox.height - 1);
      expect(Math.abs(actionBox.y + actionBox.height / 2 - labelBox.y - labelBox.height / 2)).toBeLessThanOrEqual(1);
      expect(actionBox.x).toBeGreaterThanOrEqual(labelBox.x + labelBox.width - 1);
      expect(Math.abs(actionBox.x + actionBox.width - rowBox.x - rowBox.width)).toBeLessThanOrEqual(1);
    }

    await expect(card.locator('flowio-firmware-panel [data-panel=operations]')).toHaveCount(0);
    expect(await card.locator('.body').evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);

    page.on('dialog', dialog => { void dialog.accept(); });
    for (const item of cases) await timing.locator(`[data-operation=${item.operation}]`).click();
    await expect.poll(() => page.evaluate(() => (window as any).demo.calls)).toEqual(cases.map(item => ({
      domain: 'button',
      service: 'press',
      data: { entity_id: item.entity }
    })));
  });
}

test('les actions de remise à zéro affichent leurs durées même sans sélection des horaires', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.hass.states['button.fio_pd_reset_upt_ph'] = { state: 'unknown', attributes: {} };
    demo.config.display.timing = [];
    demo.config.display.operations = ['reset_ph'];
    demo.apply();
  });

  const timing = page.locator('flowio-pool-card flowio-timing');
  await expect(timing.getByRole('heading', { name: 'Horaires & durées' })).toBeVisible();
  await expect(timing.locator('[data-runtime-item=ph_runtime] .runtime-reset')).toBeVisible();
  await expect(timing.locator('[data-runtime-item=filtration_runtime]')).toHaveCount(0);
});

test('les actions de réinitialisation ne sont pas affichées dans le panneau Actions Flow.io', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display = {
      ...demo.config.display,
      timing: [],
      calculated_values: [],
      device_metrics: [],
      operations: [
        'reset_filtration',
        'reset_ph',
        'reset_disinfection',
        'reset_filling',
        'reset_electrolyzer',
        'reset_all'
      ]
    };
    demo.apply();
  });

  await expect(page.locator('flowio-pool-card flowio-firmware-panel [data-panel=operations]')).toHaveCount(0);
});

test('en mode électrolyse, la remise à zéro désinfection cible le compteur électrolyseur et le remplissage est masqué', async ({ page }) => {
  await page.goto('/demo/');
  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.hass.states['sensor.fio_data_146'] = { state: '1800', attributes: { unit_of_measurement: 's' } };
    demo.hass.states['button.fio_pd_reset_upt_chl_gen'] = { state: 'unknown', attributes: {} };
    demo.hass.states['button.fio_pd_reset_upt_chl'] = { state: 'unknown', attributes: {} };
    demo.hass.states['button.fio_pd_refill_chl'] = { state: 'unknown', attributes: {} };
    demo.hass.states['select.fio_pl_modes_dis'].state = 'Electrolyse';
    demo.config.display = {
      ...demo.config.display,
      tanks: ['disinfection_tank_percent'],
      timing: [],
      operations: ['refill_disinfection', 'reset_disinfection']
    };
    demo.apply();
  });

  const card = page.locator('flowio-pool-card');
  await expect(card.locator('[data-tank-action=disinfection] [data-operation=refill_disinfection]')).toHaveCount(0);
  const reset = card.locator('[data-runtime-item=disinfection_runtime] [data-operation=reset_disinfection]');
  await expect(reset).toBeVisible();
  await expect(reset).toHaveAttribute('data-firmware-operation', 'reset_electrolyzer');
  await expect(card.locator('flowio-firmware-panel [data-operation=reset_electrolyzer]')).toHaveCount(0);

  page.on('dialog', dialog => { void dialog.accept(); });
  await reset.click();
  await expect.poll(() => page.evaluate(() => (window as any).demo.calls)).toEqual([
    { domain: 'button', service: 'press', data: { entity_id: 'button.fio_pd_reset_upt_chl_gen' } }
  ]);
});
