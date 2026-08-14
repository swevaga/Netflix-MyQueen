const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('file://' + path.resolve('admin.html'));
  await page.waitForTimeout(400);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);
  await page.click('[data-tab="tabSeries"]');
  await page.click('#tabSeries .btn-red');
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const zone = document.querySelector('#seriesForm .upload-zone');
    const r = zone.getBoundingClientRect();
    const cs = getComputedStyle(zone);
    const doc = document.documentElement;
    return {
      zoneWidth: Math.round(r.width), zoneHeight: Math.round(r.height),
      border: cs.borderTopWidth + ' ' + cs.borderTopStyle,
      borderRadius: cs.borderTopLeftRadius,
      bg: cs.backgroundColor,
      noHorizontalOverflow: doc.scrollWidth <= window.innerWidth + 1,
      zoneInViewport: r.right <= window.innerWidth && r.left >= 0,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  // Mobile check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const mob = await page.evaluate(() => {
    const zone = document.querySelector('#seriesForm .upload-zone');
    const r = zone.getBoundingClientRect();
    const doc = document.documentElement;
    return {
      zoneWidth: Math.round(r.width),
      noHorizontalOverflow: doc.scrollWidth <= window.innerWidth + 1,
      zoneInViewport: r.right <= window.innerWidth && r.left >= 0,
    };
  });
  console.log('MOBILE:', JSON.stringify(mob));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
