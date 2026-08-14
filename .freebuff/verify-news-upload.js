const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + path.resolve('admin.html'));
  await page.waitForTimeout(400);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);

  // News tab default: add form shows upload zone for video
  await page.click('#tabNews .btn-red');
  await page.waitForTimeout(300);
  const zone = page.locator('#newsForm .upload-zone');
  console.log('News upload zones:', await zone.count());
  console.log('News zone kind:', await zone.getAttribute('data-kind'));
  console.log('News zone folder:', await zone.getAttribute('data-folder'));
  console.log('News leftover text video inputs:', await page.locator('#newsForm input[type=text]:not(.uz-manual-input)').count());

  // Manual toggle still works for news video
  await page.click('#newsForm .uz-manual-toggle');
  await page.waitForTimeout(200);
  await page.fill('#newsForm .uz-manual-input', 'src/videos/newsandpopularpage/manual.mp4');
  await page.waitForTimeout(200);
  console.log('News hidden value:', await page.locator('#newsForm input[type=hidden]').inputValue());

  // Cancel, then verify countdown field still there
  await page.click('#newsForm .btn-gray');

  console.log('--- ERRORS ---');
  console.log(errors.length ? errors.join('\n') : 'none');
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
