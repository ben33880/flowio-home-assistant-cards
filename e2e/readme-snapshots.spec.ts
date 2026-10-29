import { expect, test, type Page } from '@playwright/test';
import { preview } from './preview';

test.use({ viewport: { width: 1200, height: 1000 }, reducedMotion: 'reduce', timezoneId: 'UTC' });

async function prepareCards(page: Page) {
  await preview(page, true);
  await page.evaluate(() => {
    document.querySelector('main')!.style.maxWidth = '1100px';
    const grid = document.querySelector('flowio-pool-card')!.parentElement!;
    grid.style.cssText = 'display:block;align-items:start';
  });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.mouse.move(0, 0);
}

test('README pool-card snapshot @readme-snapshot', async ({ page }) => {
  await prepareCards(page);
  await expect(page.locator('flowio-pool-card')).toHaveScreenshot('flowio-pool-card.png', { animations: 'disabled', caret: 'hide' });
});

test('README history-card snapshot @readme-snapshot', async ({ page }) => {
  await prepareCards(page);
  await expect(page.locator('flowio-history-card')).toHaveScreenshot('flowio-history-card.png', { animations: 'disabled', caret: 'hide' });
});

test('README pool-card dark snapshot @readme-snapshot', async ({ page }) => {
  await prepareCards(page);
  await page.locator('#theme').click();
  await expect(page.locator('flowio-pool-card')).toHaveScreenshot('flowio-pool-card-dark.png', { animations: 'disabled', caret: 'hide' });
});

test('README history-card dark snapshot @readme-snapshot', async ({ page }) => {
  await prepareCards(page);
  await page.locator('#theme').click();
  await expect(page.locator('flowio-history-card')).toHaveScreenshot('flowio-history-card-dark.png', { animations: 'disabled', caret: 'hide' });
});
