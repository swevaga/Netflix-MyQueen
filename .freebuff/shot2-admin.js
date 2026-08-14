const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave', args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route(/(fonts\.|cdnjs|cdn\.jsdelivr)/, (r) => r.abort());
  await page.goto('http://127.0.0.1:8000/admin.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);

  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.freebuff/shot-series.png' });

  await page.click('#seriesForm .btn-gray');
  await page.click('[data-tab="tabMovies"]');
  await page.click('#tabMovies .btn-red');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.freebuff/shot-movies.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.click('#moviesForm .btn-gray');
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.freebuff/shot-series-mobile.png' });

  console.log('ok');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
