import { expect, test } from '@playwright/test';

test('diagnostics système et Wi-Fi dans une fenêtre depuis l’en-tête', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/demo/');

  const header = page.locator('flowio-header-status');
  await expect(header.getByRole('button', { name: 'Ouvrir l’état système et le réseau Wi-Fi' })).toHaveCount(0);

  await page.evaluate(() => {
    const demo = (window as any).demo;
    Object.assign(demo.hass.states, {
      'sensor.fio_wifi_ip': { state: '192.0.2.10', attributes: { icon: 'mdi:ip-network' } },
      'sensor.fio_wifi_rssi': { state: '-61', attributes: { unit_of_measurement: 'dBm', icon: 'mdi:wifi-strength-2' } },
      'sensor.fio_sys_upt_mn': { state: '120', attributes: { unit_of_measurement: 'min', icon: 'mdi:timer-outline' } },
      'sensor.fio_sys_hp_free': { state: '64000', attributes: { unit_of_measurement: 'bytes' } },
      'sensor.fio_data_200': { state: '230', attributes: { unit_of_measurement: 'V', icon: 'mdi:flash' } },
      'sensor.fio_data_201': { state: '12.5', attributes: { unit_of_measurement: 'A', icon: 'mdi:current-ac' } }
    });
    demo.config.display.information = [...demo.config.display.information, 'network', 'system'];
    demo.apply();
  });

  const trigger = header.getByRole('button', { name: 'Ouvrir l’état système et le réseau Wi-Fi' });
  const dialog = header.locator('ha-dialog.information-dialog');
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();
  await expect(header.locator('ha-button.information-trigger')).toHaveAttribute('title', 'Système et réseau Wi-Fi');
  const iconPlate = header.locator('.information-icon-plate');
  await expect(iconPlate.locator('ha-icon')).toHaveAttribute('icon', 'mdi:information-outline');
  await expect(iconPlate).toHaveCSS('width', '38px');
  await expect(iconPlate).toHaveCSS('height', '38px');
  await expect(iconPlate).toHaveCSS('border-radius', '13px');
  const lightBackground = await iconPlate.evaluate(element => getComputedStyle(element).backgroundColor);
  await page.locator('#theme').click();
  await expect.poll(() => iconPlate.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
  await page.locator('#theme').click();
  await expect(trigger).toHaveText('');
  const heading = header.locator('hui-heading-card');
  const headingBox = (await heading.locator('h2').boundingBox())!;
  const triggerBox = (await trigger.boundingBox())!;
  expect(triggerBox.x).toBeGreaterThanOrEqual(headingBox.x + headingBox.width - 1);
  expect(triggerBox.x).toBeLessThan(headingBox.x + headingBox.width + 10);
  expect(triggerBox.x + triggerBox.width).toBeLessThan((await heading.boundingBox())!.x + (await heading.boundingBox())!.width - 20);
  await expect(dialog).toHaveJSProperty('open', false);
  await expect(page.locator('flowio-firmware-panel [data-panel=network]')).toHaveCount(0);
  await trigger.click();
  await expect(dialog).toHaveJSProperty('open', true);
  await expect(dialog.locator('[data-group=network]')).toContainText('192.0.2.10');
  await expect(dialog.locator('[data-entity="sensor.fio_wifi_ip"] ha-icon')).toHaveJSProperty('icon', 'mdi:ip-network');
  await expect(dialog.locator('[data-entity="sensor.fio_wifi_rssi"] ha-icon')).toHaveJSProperty('icon', 'mdi:wifi-strength-2');
  await expect(dialog.locator('[data-group=network]')).toContainText('Adresse MAC');
  await expect(dialog.locator('[data-group=network]')).toContainText('Entité absente');
  await expect(dialog.locator('[data-group=system]')).toContainText('120');
  await expect(dialog.locator('[data-group=system]')).toContainText('64000');
  await expect(dialog.locator('[data-entity="sensor.fio_data_200"]')).toContainText('Tension');
  await expect(dialog.locator('[data-entity="sensor.fio_data_200"]')).toContainText('230 V');
  await expect(dialog.locator('[data-entity="sensor.fio_data_200"] ha-icon')).toHaveJSProperty('icon', 'mdi:flash');
  await expect(dialog.locator('[data-entity="sensor.fio_data_201"]')).toContainText('Courant');
  await expect(dialog.locator('[data-entity="sensor.fio_data_201"]')).toContainText('12.5 A');
  await expect(dialog.locator('[data-entity="sensor.fio_data_201"] ha-icon')).toHaveJSProperty('icon', 'mdi:current-ac');
  await dialog.locator('[data-entity="sensor.fio_wifi_ip"]').click();
  await expect(page.locator('#events')).toContainText('sensor.fio_wifi_ip');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveJSProperty('open', false);
  expect(await page.locator('flowio-pool-card .hero').evaluate(element => element.scrollWidth > element.clientWidth + 1)).toBe(false);
});
