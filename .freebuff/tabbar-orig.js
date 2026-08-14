const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/home/swevaga/.cache/ms-playwright/chromium-1148/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('file:///tmp/admin-original.html');
  await page.waitForTimeout(400);
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type=submit]');
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const tb = document.querySelector('.tab-bar');
    const r = tb.getBoundingClientRect();
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      tabBarClientWidth: tb.clientWidth,
      tabBarScrollWidth: tb.scrollWidth,
    };
  });
  console.log('ORIGINAL:', JSON.stringify(m));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
