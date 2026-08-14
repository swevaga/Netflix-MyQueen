const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.evaluate(async () => { for (let y = 0; y <= document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1500);
  const imgs = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => ({
    src: i.src.replace('http://127.0.0.1:8000', ''),
    complete: i.complete,
    nw: i.naturalWidth,
    loading: i.loading,
    cls: (i.className || '').toString().slice(0, 30),
  })));
  const broken = imgs.filter(i => i.complete && i.nw === 0);
  console.log('TOTAL imgs:', imgs.length);
  console.log('BROKEN:', JSON.stringify(broken, null, 2));
  console.log('ALL (truncated):');
  console.log(JSON.stringify(imgs.slice(0, 60), null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
