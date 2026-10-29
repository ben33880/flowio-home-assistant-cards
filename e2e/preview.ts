import { expect, type Page } from '@playwright/test';

export async function preview(page: Page, freezeClock = false) {
  if (freezeClock) await page.clock.install({ time: new Date('2026-10-29T12:00:00.000Z') });
  await page.goto('/demo/');
  await expect(page.locator('flowio-pool-card h2')).toHaveText('Piscine · Jardin');
  await page.evaluate(() => {
    const w = window as any, d = w.demo;
    d.config.display.measurements = [...new Set([...d.config.display.measurements, 'air_temperature'])];
    d.config.display.timing = ['filtration_schedule', 'filtration_runtime', 'ph_runtime', 'disinfection_runtime'];
    for (const [id, state, unit] of [
      ['sensor.fio_pl_flt_start', '8', 'h'],
      ['sensor.fio_pl_flt_stop', '20', 'h'],
      ['sensor.fio_data_144', '15480', 's'],
      ['sensor.fio_data_145', '750', 's'],
      ['sensor.fio_data_146', '1110', 's']
    ]) d.hass.states[id] = { state, attributes: { unit_of_measurement: unit } };
    d.apply();
    const pool = document.querySelector('flowio-pool-card')!, main = document.querySelector('main')!;
    main.style.maxWidth = '1400px';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,500px),1fr));gap:24px;align-items:start';
    pool.before(grid);
    grid.append(pool);
    const history = document.createElement('flowio-history-card') as any;
    history.setConfig({ entity_prefix: 'fio', title: 'Évolution de la piscine', measurements: ['water_temperature', 'ph', 'orp', 'pressure'] });
    history.hass = {
      ...d.card.hass,
      callApi: async (_method: string, path: string) => {
        const id = new URLSearchParams(path.split('?')[1]).get('filter_entity_id')!, now = Date.now();
        const base = id.endsWith('io_ph') ? 7.2 : id.endsWith('io_orp') ? 700 : id.endsWith('io_psi') ? 10 : 27;
        const amplitude = id.endsWith('io_orp') ? 25 : id.endsWith('io_ph') ? .15 : 1;
        return [Array.from({ length: 48 }, (_, i) => ({
          entity_id: id,
          state: String(base + Math.sin(i / 5) * amplitude),
          last_changed: new Date(now - (48 - i) * 1800000).toISOString()
        }))];
      }
    };
    grid.append(history);
  });
  await expect(page.locator('flowio-history-chart [data-chart=apexcharts] .apexcharts-svg')).toHaveCount(4);
}
