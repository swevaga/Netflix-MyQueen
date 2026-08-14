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

  const probes = [
    ['baseline', ''],
    ['hide toastBox', 'document.getElementById("toastBox").style.display="none"'],
    ['hide h1.brand-title', 'document.querySelector(".brand-title").style.display="none"'],
    ['hide github hint p', 'document.querySelector(".admin-hint.mt-3").style.display="none"'],
    ['force wrap on tab-bar', 'document.querySelector(".tab-bar").style.flexWrap="wrap"'],
    ['force wrap+!important', 'document.querySelector(".tab-bar").setAttribute("style","flex-wrap:wrap!important")'],
  ];
  for (const [name, js] of probes) {
    if (js) await page.evaluate(js);
    await page.waitForTimeout(80);
    const m = await page.evaluate(() => {
      const tb = document.querySelector('.tab-bar');
      return {
        docScrollWidth: document.documentElement.scrollWidth,
        tabWrap: getComputedStyle(tb).flexWrap,
        tabScrollW: tb.scrollWidth, tabClientW: tb.clientWidth,
      };
    });
    console.log(name, '->', JSON.stringify(m));
    if (js) await page.evaluate(() => { document.querySelectorAll('[style]').forEach(el => el.removeAttribute('style')); });
  }
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
