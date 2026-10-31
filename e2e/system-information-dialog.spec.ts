import { expect, test } from '@playwright/test';

test('diagnostics système et Wi-Fi dans une fenêtre depuis l’en-tête', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/demo/');

  const header = page.locator('flowio-header-status');
  await expect(header.getByRole('button', { name: 'Ouvrir l’état système et le réseau Wi-Fi' })).toHaveCount(0);

  await page.evaluate(() => {
    const demo = (window as any).demo;
    Object.assign(demo.hass.states, {
      'sensor.fio_wifi_ip': { state: '192.0.2.10', attributes: {} },
      'sensor.fio_wifi_rssi': { state: '-61', attributes: { unit_of_measurement: 'dBm' } },
      'sensor.fio_sys_upt_mn': { state: '120', attributes: { unit_of_measurement: 'min' } },
      'sensor.fio_sys_hp_free': { state: '64000', attributes: { unit_of_measurement: 'bytes' } }
    });
    demo.config.display.information = [...demo.config.display.information, 'network', 'system'];
    demo.apply();
  });

  const trigger = header.getByRole('button', { name: 'Ouvrir l’état système et le réseau Wi-Fi' });
  const dialog = header.locator('ha-dialog.information-dialog');
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();
  await expect(dialog).toHaveJSProperty('open', false);
  await expect(page.locator('flowio-firmware-panel [data-panel=network]')).toHaveCount(0);
  await trigger.click();
  await expect(dialog).toHaveJSProperty('open', true);
  await expect(dialog.locator('[data-group=network]')).toContainText('192.0.2.10');
  await expect(dialog.locator('[data-group=network]')).toContainText('Adresse MAC');
  await expect(dialog.locator('[data-group=network]')).toContainText('Entité absente');
  await expect(dialog.locator('[data-group=system]')).toContainText('120');
  await expect(dialog.locator('[data-group=system]')).toContainText('64000');
  await dialog.locator('[data-entity="sensor.fio_wifi_ip"]').click();
  await expect(page.locator('#events')).toContainText('sensor.fio_wifi_ip');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveJSProperty('open', false);
  expect(await page.locator('flowio-pool-card .hero').evaluate(element => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});
