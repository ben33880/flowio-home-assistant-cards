import { expect, test } from '@playwright/test';

for (const width of [390, 1100]) test(`Maintenance : MQTT confirmé et nettoyage à ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1100 });
  await page.goto('/demo/');
  await page.evaluate(() => {
    const w = window as any, d = w.demo;
    w.maintenanceListeners = new Map();
    d.hass.connection = { subscribeMessage: async (callback: any, command: any) => {
      w.maintenanceListeners.set(command.topic, callback);
      const payload = command.topic.endsWith('/status') ? '{"online":true}' : '{"enabled":true}';
      callback({ topic: command.topic, payload });
      return () => { w.maintenanceListeners.delete(command.topic); };
    } };
    d.config.display.operations = ['timed_override'];
    d.apply();
  });
  const button = page.locator('flowio-timing [data-open-maintenance]');
  await expect(button).toContainText('Maintenance');
  await button.click();
  const dialog = page.locator('flowio-firmware-panel ha-dialog.maintenance-dialog');
  await expect(dialog).toHaveJSProperty('open', true);
  await expect(dialog).toHaveJSProperty('heading', 'Maintenance');
  await expect(dialog.locator('[data-maintenance=alarms] h3')).toHaveText('Alarmes');
  await expect(dialog.locator('[data-maintenance=override] h3')).toHaveText('Forçage');
  const alarm = dialog.locator('flowio-maintenance-alarms');
  const control = alarm.locator('[data-alarm-enabled]');
  await expect(control).toHaveJSProperty('disabled', true);
  await alarm.locator('ha-form').evaluate(element => element.dispatchEvent(new CustomEvent('value-changed', { detail: { value: { root: 'pool/controller' } }, bubbles: true, composed: true })));
  await alarm.locator('[data-read-alarms]').click();
  await expect(control).toHaveJSProperty('disabled', false);
  await expect(control).toHaveJSProperty('checked', true);
  page.once('dialog', confirmation => confirmation.dismiss());
  await control.click();
  expect(await page.evaluate(() => (window as any).demo.calls.length)).toBe(0);
  await expect(control).toHaveJSProperty('checked', true);
  page.once('dialog', confirmation => confirmation.accept());
  await control.click();
  await expect.poll(() => page.evaluate(() => (window as any).demo.calls.at(-1))).toEqual({ domain: 'mqtt', service: 'publish', data: { topic: 'pool/controller/cfg/set', payload: '{"alarms":{"enabled":false}}', qos: 1, retain: false } });
  await expect(control).toHaveJSProperty('checked', true);
  await expect(control).toHaveJSProperty('disabled', true);
  await page.evaluate(() => { const w = window as any; w.maintenanceListeners.get('pool/controller/cfg/alarms')({ topic: 'pool/controller/cfg/alarms', payload: '{"enabled":false}' }); });
  await expect(control).toHaveJSProperty('checked', false);
  await expect(alarm).toContainText('Penser à la réactiver');
  await dialog.locator('[data-close-maintenance]').click();
  await expect(dialog).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => (window as any).maintenanceListeners.size)).toBe(0);
});
