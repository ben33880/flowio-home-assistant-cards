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
      { tank: 'ph', operation: 'refill_ph', entity: 'sensor.fio_data_115', label: 'Remplir la cuve pH', icon: 'mdi:flask-plus-outline', volume: '12.6 L restants' },
      { tank: 'disinfection', operation: 'refill_disinfection', entity: 'sensor.fio_data_117', label: 'Remplir la cuve désinfectant', icon: 'mdi:water-plus-outline', volume: '8.3 L restants' }
    ] as const;

    for (const item of cases) {
      const tile = card.locator(`[data-tank-action=${item.tank}]`);
      const gauge = tile.locator('flowio-gauge');
      const footer = tile.locator('.tank-action-footer');
      const volume = footer.locator('.tank-volume');
      const action = tile.locator(`[data-operation=${item.operation}]`);
      await expect(gauge).toBeVisible();
      await expect(action).toBeVisible();
      await expect(action).toHaveAttribute('title', item.label);
      await expect(action).toHaveText('');
      await expect(action.locator('ha-icon')).toHaveJSProperty('icon', item.icon);
      await expect(action).toHaveCSS('width', '44px');
      await expect(action).toHaveCSS('height', '44px');
      await expect(action).toHaveCSS('animation-name', 'none');
      await expect(action).toHaveCSS('transition-property', 'none');
      await expect(action.locator('ha-icon')).toHaveCSS('--mdc-icon-size', '20px');
      await expect(volume).toHaveText(item.volume);
      const gaugeBox = (await gauge.boundingBox())!;
      const actionBox = (await action.boundingBox())!;
      const footerBox = (await footer.boundingBox())!;
      const volumeBox = (await volume.boundingBox())!;
      expect(actionBox.width).toBeGreaterThanOrEqual(44);
      expect(actionBox.height).toBeGreaterThanOrEqual(44);
      expect(actionBox.x).toBeGreaterThanOrEqual(volumeBox.x + volumeBox.width - 1);
      expect(actionBox.y + actionBox.height / 2, item.operation).toBeCloseTo(volumeBox.y + volumeBox.height / 2, 0);
      expect(footerBox.y).toBeGreaterThanOrEqual(gaugeBox.y + gaugeBox.height);
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
