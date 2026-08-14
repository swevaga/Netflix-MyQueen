const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file://' + path.resolve('admin.html'));
  await page.waitForTimeout(400);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  const offenders = await page.evaluate(() => {
    const w = window.innerWidth;
    const out = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > w + 1 && r.width > 0) {
        out.push(el.tagName + '.' + (el.className && el.className.toString ? String(el.className).split(' ').slice(0,2).join('.') : '') + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width));
      }
    });
    return out.slice(0, 15);
  });
  console.log('OFFENDERS:', JSON.stringify(offenders, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
