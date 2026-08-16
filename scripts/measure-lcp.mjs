/* ==========================================================================
   scripts/measure-lcp.mjs — Ukur dampak preload hero (index/news/mylist)
   --------------------------------------------------------------------------
   Membandingkan waktu siap gambar hero DENGAN preload (kondisi sekarang)
   vs TANPA preload (kondisi asli, disimulasikan lewat route). Jaringan
   dibatasi 1.5 Mbps / 150 ms (CDP), musik diblokir agar bandwidth hanya
   untuk gambar, 3 iterasi tiap kondisi, konteks baru tiap run (cache
   bersih).

   Metrik (API LCP besar tidak tersedia di Brave build ini):
     • heroReady  — performance.now() saat <img> hero complete+decoded
                    (elemen terbesar di viewport ≈ kandidat LCP)
     • responseEnd— responseEnd dari resource-timing gambar hero (ms sejak
                    navigationStart, termasuk durasi download)

   Jalankan (server statis harus hidup di 127.0.0.1:8000):
     node scripts/measure-lcp.mjs
   ========================================================================== */
import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:8000';
const PAGES = [
  ['/index.html', 'index'],
  ['/newsandpopular.html', 'news'],
  ['/mylist.html', 'mylist'],
];
const RUNS = 3;
const THROTTLE = { latency: 150, downloadThroughput: 187500, uploadThroughput: 75000 };
const EXECUTABLE = '/opt/brave.com/brave/brave';

// Kondisi SEBELUM: sajikan HTML tanpa semua <link rel="preload"> (hero +
// galeri) dan hero-slider.js tanpa fetchpriority — setara perilaku asli.
async function stripPreloads(ctx) {
  await ctx.route(/\.html(\?.*)?$/, async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    const stripped = body.replace(/<link rel="preload" as="image"[^>]*>\n?/g, '');
    const headers = { ...resp.headers() };
    delete headers['content-length'];
    await route.fulfill({ response: resp, status: resp.status(), headers, body: stripped });
  });
  await ctx.route('**/src/js/hero-slider.js*', async (route) => {
    const resp = await route.fetch();
    const body = (await resp.text()).replace(/fetchpriority="high"\s*/g, '');
    const headers = { ...resp.headers() };
    delete headers['content-length'];
    await route.fulfill({ response: resp, status: resp.status(), headers, body });
  });
}

async function measure(browser, path, before) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    // Musik (8-11 MB) diblokir — bandwidth hanya untuk gambar hero.
    await ctx.route('**/src/audio/**', (r) => r.abort());
    if (before) await stripPreloads(ctx);

    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...THROTTLE });

    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const heroReady = await page.waitForFunction(() => {
      const img = document.querySelector('#heroImg, #heroSliderImg');
      return img && img.complete && img.naturalWidth > 0 ? performance.now() : false;
    }, { timeout: 120000 });
    await page.waitForTimeout(200);
    const resourceEnd = await page.evaluate(() => {
      const img = document.querySelector('#heroImg, #heroSliderImg');
      const name = img ? img.getAttribute('src').split('/').pop() : '';
      const hit = performance
        .getEntriesByType('resource')
        .find((r) => r.name.split('/').pop() === name);
      return hit ? Math.round(hit.responseEnd) : -1;
    });
    return { heroReady: Math.round(heroReady), resourceEnd };
  } finally {
    await ctx.close().catch(() => {});
  }
}

const browser = await chromium.launch({
  executablePath: EXECUTABLE,
  args: ['--no-sandbox'],
});

console.log(`Kondisi: 1.5 Mbps / 150 ms, ${RUNS}x tiap kondisi, cache bersih tiap run.`);
for (const [path, name] of PAGES) {
  const before = [];
  const after = [];
  for (let i = 0; i < RUNS; i++) {
    before.push(await measure(browser, path, true));
    after.push(await measure(browser, path, false));
    process.stdout.write(`  ${name}: run ${i + 1}/${RUNS} selesai\n`);
  }
  const avg = (arr, k) => Math.round(arr.reduce((s, v) => s + v[k], 0) / arr.length);
  const bReady = avg(before, 'heroReady');
  const aReady = avg(after, 'heroReady');
  const bRes = avg(before, 'resourceEnd');
  const aRes = avg(after, 'resourceEnd');
  const pct = ((bReady - aReady) / bReady) * 100;
  console.log(`\n[${name}] hero-ready (ms)   SEBELUM: ${before.map((v) => v.heroReady).join('/')}  (avg ${bReady})`);
  console.log(`[${name}] hero-ready (ms)   SESUDAH: ${after.map((v) => v.heroReady).join('/')}  (avg ${aReady})`);
  console.log(`[${name}] responseEnd (ms)  SEBELUM: ${before.map((v) => v.resourceEnd).join('/')}  (avg ${bRes})`);
  console.log(`[${name}] responseEnd (ms)  SESUDAH: ${after.map((v) => v.resourceEnd).join('/')}  (avg ${aRes})`);
  console.log(`[${name}] Perbaikan hero-ready: ${pct.toFixed(1)}% lebih cepat`);
}

await browser.close();
console.log('\nSelesai.');
