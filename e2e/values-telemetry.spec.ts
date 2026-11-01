import { expect, test } from '@playwright/test';

test('valeurs et télémétrie regroupées, alignées et masquables', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1400 });
  await page.goto('/demo/');
  await page.locator('main').evaluate(element => { (element as HTMLElement).style.maxWidth = 'none'; });

  const card = page.locator('flowio-pool-card');
  const firmwarePanel = card.locator('flowio-firmware-panel.values-telemetry-panel');
  const valuesPanel = firmwarePanel.locator('[data-panel=values]');
  const dashboardLayout = card.locator('.dashboard-layout');
  const quality = card.locator('.measurement-groups');
  await expect(valuesPanel).toBeVisible();
  const panelBox = (await firmwarePanel.boundingBox())!;
  const layoutBox = (await dashboardLayout.boundingBox())!;
  const qualityBox = (await quality.boundingBox())!;
  expect(Math.abs(panelBox.x - layoutBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(panelBox.x - qualityBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(panelBox.width - layoutBox.width)).toBeLessThanOrEqual(1);
  const valuesBox = (await valuesPanel.boundingBox())!;
  expect(Math.abs(valuesBox.x - panelBox.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(valuesBox.width - panelBox.width)).toBeLessThanOrEqual(1);

  await page.evaluate(() => {
    const demo = (window as any).demo;
    demo.config.display.values_telemetry = false;
    demo.apply();
  });
  await expect(firmwarePanel).toHaveCount(0);

  const editor = await page.evaluate(async () => {
    const demo = (window as any).demo;
    const element = document.createElement('flowio-pool-card-editor') as any;
    element.setConfig(demo.config);
    element.hass = demo.card.hass;
    document.body.append(element);
    await element.updateComplete;
    const form = element.shadowRoot.querySelector('ha-form');
    const display = form.schema.find((field: any) => field.name === 'display');
    return display.schema.slice(0, 3).map((field: any) => field.name);
  });
  expect(editor).toEqual(['values_telemetry', 'calculated_values', 'device_metrics']);
});
