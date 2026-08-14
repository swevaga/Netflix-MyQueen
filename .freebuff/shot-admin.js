const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const url = 'file://' + path.resolve('admin.html');
  await page.goto(url);
  await page.waitForTimeout(400);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);

  // Series add form (upload zone)
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.freebuff/shot-series.png' });

  // Movies add form
  await page.click('#seriesForm .btn-gray');
  await page.click('[data-tab="tabMovies"]');
  await page.click('#tabMovies .btn-red');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.freebuff/shot-movies.png' });

  // Simulate a drag-over state on the series zone
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  const zone = page.locator('#seriesForm .upload-zone');
  await zone.hover();
  await zone.evaluate((el) => el.classList.add('drag'));
  await page.screenshot({ path: '.freebuff/shot-series-drag.png' });

  console.log('screenshots saved');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
