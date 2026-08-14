const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('/_vercel/')) bad.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1500);
  const broken = await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => i.src && i.complete && i.naturalWidth === 0).map(i => i.src));
  console.log('BROKEN IMGS:', JSON.stringify(broken, null, 2));
  console.log('BAD RESPONSES:', JSON.stringify(bad, null, 2));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
