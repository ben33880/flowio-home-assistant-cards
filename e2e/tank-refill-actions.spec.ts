import { expect, test } from '@playwright/test';

for (const width of [390, 1100]) {
  test(`actions de remplissage près de leur jauge à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/demo/');
    await page.evaluate(() => {
      const demo = (window as any).demo;
      Object.assign(demo.hass.states, {
        'button.fio_pd_refill_ph': { state: 'unknown', attributes: {} },
        'button.fio_pd_refill_chl': { state: 'unknown', attributes: {} }
      });
      demo.config.display.tanks = ['ph_tank_percent', 'disinfection_tank_percent'];
      demo.config.display.operations = ['refill_ph', 'refill_disinfection'];
      demo.apply();
    });

    const card = page.locator('flowio-pool-card');
    const panel = card.locator('flowio-firmware-panel');
    const cases = [
      { tank: 'ph', operation: 'refill_ph', entity: 'sensor.fio_data_115', label: 'Remplir la cuve pH', icon: 'mdi:flask-plus-outline' },
      { tank: 'disinfection', operation: 'refill_disinfection', entity: 'sensor.fio_data_117', label: 'Remplir la cuve désinfectant', icon: 'mdi:water-plus-outline' }
    ] as const;

    for (const item of cases) {
      const tile = card.locator(`[data-tank-action=${item.tank}]`);
      const gauge = tile.locator('flowio-gauge');
      const action = tile.locator(`[data-operation=${item.operation}]`);
      await expect(gauge).toBeVisible();
      await expect(action).toBeVisible();
      await expect(action).toHaveAttribute('title', item.label);
      await expect(action).toHaveText('');
      await expect(action.locator('ha-icon')).toHaveJSProperty('icon', item.icon);
      const gaugeBox = (await gauge.boundingBox())!;
      const actionBox = (await action.boundingBox())!;
      expect(actionBox.x).toBeGreaterThanOrEqual(gaugeBox.x + gaugeBox.width - 1);
      expect(actionBox.y + actionBox.height).toBeGreaterThan(gaugeBox.y);
      expect(actionBox.y).toBeLessThan(gaugeBox.y + gaugeBox.height);
    }

    await expect(panel.locator('[data-operation^=refill_]')).toHaveCount(0);
    expect(await card.locator('.body').evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);

    page.on('dialog', dialog => { void dialog.accept(); });
    await card.locator('[data-operation=refill_ph]').click();
    await expect.poll(() => page.evaluate(() => (window as any).demo.calls)).toEqual([
      { domain: 'button', service: 'press', data: { entity_id: 'button.fio_pd_refill_ph' } }
    ]);
  });
}
