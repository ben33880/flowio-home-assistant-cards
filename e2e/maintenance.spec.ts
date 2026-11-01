import { expect, test, type Page } from '@playwright/test';

async function setup(page: Page, topic?: string) {
  await page.goto('/demo/');
  await page.evaluate(topic => {
    const w = window as any, d = w.demo;
    w.maintenanceListeners = new Map();
    d.hass.connection = { subscribeMessage: async (callback: any, command: any) => {
      w.maintenanceListeners.set(command.topic, callback);
      const payload = command.topic.endsWith('/status') ? '{"online":true}' : '{"enabled":true}';
      callback({ topic: command.topic, payload });
      return () => { w.maintenanceListeners.delete(command.topic); };
    } };
    d.config.display.operations = ['timed_override'];
    if (topic) d.config.mqtt_topic = topic;
    else delete d.config.mqtt_topic;
    Object.assign(d.hass.states, {
      'select.fio_pdm_ovr_target': { state: 'pd0', attributes: { options: ['pd0'] } },
      'number.fio_pdm_ovr_min': { state: '15', attributes: {} },
      'sensor.fio_pdm_ovr_state': { state: 'guided', attributes: { control_mode: 'guided', override_available: true } },
      'button.fio_pdm_ovr_on': { state: 'unknown', attributes: {} },
      'button.fio_pdm_ovr_off': { state: 'unknown', attributes: {} },
      'button.fio_pdm_ovr_release': { state: 'unknown', attributes: {} }
    });
    d.apply();
  }, topic);
  await page.locator('flowio-timing [data-open-maintenance]').click();
  const dialog = page.locator('flowio-firmware-panel ha-dialog.maintenance-dialog');
  await expect(dialog).toHaveJSProperty('open', true);
  return dialog;
}

for (const width of [390, 1100]) test(`Maintenance : topic configuré, MQTT confirmé et nettoyage à ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1100 });
  const dialog = await setup(page, 'pool/controller');
  await expect(dialog).toHaveJSProperty('heading', 'Maintenance');
  await expect(dialog.locator('[data-maintenance=alarms] h3')).toHaveText('Alarmes');
  await expect(dialog.locator('[data-maintenance=override] h3')).toHaveText('Forçage');
  const alarm = dialog.locator('flowio-maintenance-alarms');
  const control = alarm.locator('[data-alarm-enabled]');
  await expect(alarm.locator('ha-form')).toHaveCount(0);
  await expect(alarm.locator('[data-mqtt-topic]')).toHaveText('pool/controller');
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
  await expect(dialog.locator('[data-override=on]')).toHaveJSProperty('disabled', true);
  await page.evaluate(() => { const w = window as any; w.maintenanceListeners.get('pool/controller/cfg/alarms')({ topic: 'pool/controller/cfg/alarms', payload: '{"enabled":false}' }); });
  await expect(control).toHaveJSProperty('checked', false);
  await expect(alarm).toContainText('Penser à la réactiver');
  await dialog.locator('[data-close-maintenance]').click();
  await expect(dialog).toHaveJSProperty('open', false);
  await expect.poll(() => page.evaluate(() => (window as any).maintenanceListeners.size)).toBe(0);
});

test('sans mqtt_topic les alarmes restent bloquées mais le forçage reste disponible', async ({ page }) => {
  const dialog = await setup(page);
  const alarm = dialog.locator('flowio-maintenance-alarms');
  await expect(alarm).toContainText('Configurer mqtt_topic');
  await expect(alarm.locator('[data-alarm-enabled]')).toHaveJSProperty('disabled', true);
  await expect(dialog.locator('[data-override=on]')).toHaveJSProperty('disabled', false);
  expect(await page.evaluate(() => (window as any).maintenanceListeners.size)).toBe(0);
});

test('changer ou retirer mqtt_topic ferme les anciennes souscriptions sans accepter leurs messages', async ({ page }) => {
  const dialog = await setup(page, 'pool/controller');
  const alarm = dialog.locator('flowio-maintenance-alarms');
  await expect(alarm.locator('[data-alarm-enabled]')).toHaveJSProperty('disabled', false);
  await page.evaluate(() => {
    const w = window as any, d = w.demo;
    w.oldMaintenanceListener = w.maintenanceListeners.get('pool/controller/cfg/alarms');
    d.config.mqtt_topic = 'other/controller'; d.apply();
  });
  await expect(alarm.locator('[data-mqtt-topic]')).toHaveText('other/controller');
  await expect.poll(() => page.evaluate(() => [...(window as any).maintenanceListeners.keys()].sort())).toEqual(['other/controller/cfg/alarms', 'other/controller/status']);
  await page.evaluate(() => (window as any).oldMaintenanceListener({ topic: 'pool/controller/cfg/alarms', payload: '{"enabled":false}' }));
  await expect(alarm.locator('[data-alarm-enabled]')).toHaveJSProperty('checked', true);
  await page.evaluate(() => { const d = (window as any).demo; delete d.config.mqtt_topic; d.apply(); });
  await expect(alarm).toContainText('Configurer mqtt_topic');
  await expect(alarm.locator('[data-alarm-enabled]')).toHaveJSProperty('disabled', true);
  await expect.poll(() => page.evaluate(() => (window as any).maintenanceListeners.size)).toBe(0);
});

test('éditeur : mqtt_topic est enregistré dans config-changed', async ({ page }) => {
  await setup(page, 'pool/controller');
  const result = await page.evaluate(async () => {
    const d = (window as any).demo, editor = document.createElement('flowio-pool-card-editor') as any;
    editor.setConfig(d.config); editor.hass = d.card.hass; document.body.append(editor);
    await editor.updateComplete;
    const form = editor.shadowRoot.querySelector('ha-form');
    const hasField = form.schema.some((field: any) => field.name === 'mqtt_topic');
    let emitted: any;
    editor.addEventListener('config-changed', (event: any) => { emitted = event.detail.config; });
    form.dispatchEvent(new CustomEvent('value-changed', { detail: { value: { ...d.config, mqtt_topic: 'other/controller' } }, bubbles: true, composed: true }));
    editor.remove();
    return { hasField, topic: emitted?.mqtt_topic, prefix: emitted?.entity_prefix };
  });
  expect(result).toEqual({ hasField: true, topic: 'other/controller', prefix: 'fio' });
});
