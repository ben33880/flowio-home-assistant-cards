import { test, expect } from '@playwright/test';

for (const { width, columns } of [
  { width: 600, columns: 1 },
  { width: 1000, columns: 3 },
]) {
  test(`Mesures regroupées sur ${columns} colonne(s) à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto('/demo/');
    await expect(page.locator('flowio-pool-card h2')).toBeVisible();
    await page.evaluate(() => {
      const d = (window as any).demo;
      d.config.display.measurements = [
        'air_temperature', 'water_temperature', 'ph', 'orp', 'pressure',
      ];
      d.apply();
    });

    const grid = page.locator('[data-group=measurements]');
    await expect(grid.locator('.measure')).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'Mesures', exact: true })).toHaveCount(1);
    await expect(grid.locator('.measurement-group')).toHaveCount(3);
    await expect(grid.locator('h4')).toHaveText([
      'Qualité de l’eau', 'Températures', 'Pression',
    ]);
    await expect.poll(() => grid.evaluate(el =>
      getComputedStyle(el).gridTemplateColumns.split(' ').length,
    )).toBe(columns);

    const roles = await grid.locator('.measure').evaluateAll(els =>
      els.map(el => el.getAttribute('data-role')),
    );
    expect(roles).toEqual([
      'ph', 'orp', 'water_temperature', 'air_temperature', 'pressure',
    ]);
    await expect(grid).toHaveCSS('align-items', 'start');
    await expect(page.locator('[data-group=tanks] flowio-gauge')).toHaveCount(2);
  });
}
