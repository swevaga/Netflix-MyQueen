// ==========================================================================
// e2e.spec.js — Uji End-to-End menyeluruh (semua halaman).
// Jalankan: npx playwright test
//
// Cakupan:
//   1. Semua 6 halaman: judul benar, section utama TERLIHAT (opacity 1 —
//      menangkap regresi "black screen" seperti kasus scroll-reveal),
//      tidak ada error konsol / gambar rusak / request gagal.
//   2. Series: 98 kartu unik tanpa duplikat banner, modal video terbuka.
//   3. Index: hero + galeri 12 kartu.
//   4. Movies: 59 kartu + modal terbuka.
//   5. News: 3 item berita.
//   6. My List: konten terlihat.
//   7. Play: video siap diputar.
//   8. Musik: kontinuitas antar halaman (lagu lanjut dari posisi sama).
//   9. Navigasi navbar antar halaman.
// ==========================================================================
const { test, expect } = require('@playwright/test');

const PAGES = [
  { path: '/index.html', title: 'Netflix', sectionId: null },
  { path: '/movies.html', title: 'Netflix - Movies', sectionId: 'moviesSection' },
  { path: '/series.html', title: 'Netflix - Series', sectionId: 'seriesSection' },
  { path: '/newsandpopular.html', title: 'Netflix - News & Popular', sectionId: 'newsSection' },
  { path: '/mylist.html', title: 'Netflix - My List', sectionId: 'main-content' },
  { path: '/play.html', title: 'Netflix - Play', sectionId: 'main-content' },
];

// Error yang dianggap wajar di server lokal (endpoint _vercel hanya ada di Vercel).
function isExpectedConsole(msg) {
  return /_vercel|Failed to load resource/.test(msg) || /Vercel Web Analytics|Vercel Speed Insights/.test(msg);
}

async function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !isExpectedConsole(m.text())) errors.push('console: ' + m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('/_vercel/')) {
      errors.push('HTTP ' + r.status() + ': ' + r.url().replace('http://127.0.0.1:8000', ''));
    }
  });
  return errors;
}

async function scrollAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
}

test.describe('Semua halaman: dasar', () => {
  for (const pg of PAGES) {
    test(`${pg.path}: judul, section terlihat, tanpa error/gambar rusak`, async ({ page }) => {
      const errors = await collectErrors(page);
      await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await scrollAll(page);
      await page.waitForTimeout(1500);

      await expect(page).toHaveTitle(pg.title);

      if (pg.sectionId) {
        const section = page.locator('#' + pg.sectionId);
        await expect(section).toBeVisible();
        // Pemeriksaan anti-black-screen: opacity harus 1 (bukan 0).
        const opacity = await section.evaluate((el) => getComputedStyle(el).opacity);
        expect(opacity).toBe('1');
      }

      // Tidak boleh ada gambar rusak di halaman.
      const broken = await page.evaluate(() =>
        [...document.querySelectorAll('img')].filter(
          (i) => i.src && i.complete && i.naturalWidth === 0,
        ).length,
      );
      expect(broken).toBe(0);

      expect(errors).toEqual([]);
    });
  }
});

test.describe('Series', () => {
  test('98 kartu unik terlihat tanpa duplikat banner + modal video terbuka', async ({ page }) => {
    await page.goto('/series.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await scrollAll(page);
    await page.waitForTimeout(1500);

    const st = await page.evaluate(() => {
      const section = document.getElementById('seriesSection');
      const container = document.getElementById('seriesRatioContainer');
      const visibleImgs = [...section.querySelectorAll('.series-item img')].filter(
        (i) => i.offsetParent !== null,
      );
      const seen = {};
      let dup = 0;
      visibleImgs.forEach((i) => {
        const s = i.getAttribute('src');
        seen[s] = (seen[s] || 0) + 1;
        if (seen[s] === 2) dup++;
      });
      return {
        opacity: getComputedStyle(section).opacity,
        groups: container.children.length,
        visibleCards: visibleImgs.length,
        dupVisible: dup,
        staticBannersVisible: [...section.querySelectorAll('.series-static-banner')].filter(
          (d) => d.offsetParent !== null,
        ).length,
      };
    });
    expect(st.opacity).toBe('1');
    expect(st.groups).toBeGreaterThan(0);
    expect(st.visibleCards).toBe(98);
    expect(st.dupVisible).toBe(0);
    expect(st.staticBannersVisible).toBe(0);

    // Klik kartu pertama → modal terbuka dengan sumber video.
    await page.click('#seriesRatioContainer .series-item');
    await expect(page.locator('#seriesModal')).toBeVisible();
    const videoSrc = await page.locator('#seriesVideo').getAttribute('src');
    expect(videoSrc).toMatch(/\.mp4$/);
    await page.click('#seriesModal .close');
    await expect(page.locator('#seriesModal')).toBeHidden();
  });
});

test.describe('Index', () => {
  test('hero + galeri 12 kartu berfungsi', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await expect(page.locator('#heroImg')).toBeVisible();
    const heroLoaded = await page.locator('#heroImg').evaluate((i) => i.complete && i.naturalWidth > 0);
    expect(heroLoaded).toBe(true);

    const grid = page.locator('#imageGrid');
    await expect(grid.locator('.image-container')).toHaveCount(12);
    const loaded = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('#imageGrid .active')];
      return imgs.filter((i) => i.complete && i.naturalWidth > 0).length;
    });
    expect(loaded).toBeGreaterThanOrEqual(11);
  });
});

test.describe('Movies', () => {
  test('59 kartu + modal video terbuka', async ({ page }) => {
    await page.goto('/movies.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const cards = page.locator('img[src*="moviespage"]');
    await expect(cards).toHaveCount(59);

    await page.click('button[aria-label="Putar video 1"]');
    await expect(page.locator('#video1')).toBeVisible();
    // Sumber video ada di <source> (bukan atribut src <video>).
    const src = await page.locator('#video1-player source').getAttribute('src');
    expect(src).toMatch(/\.mp4$/);
    await page.click('#video1 .close');
    await expect(page.locator('#video1')).toBeHidden();
  });
});

test.describe('News & My List', () => {
  test('news: 3 item berita ter-render', async ({ page }) => {
    await page.goto('/newsandpopular.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const items = page.locator('#newsList > *');
    await expect(items).toHaveCount(3);
  });

  test('mylist: konten + hero slider terlihat', async ({ page }) => {
    await page.goto('/mylist.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await expect(page.locator('#main-content')).toBeVisible();
    const imgs = await page.evaluate(
      () => [...document.querySelectorAll('#main-content img')].filter((i) => i.offsetParent !== null).length,
    );
    expect(imgs).toBeGreaterThan(0);
  });
});

test.describe('Play', () => {
  test('video siap diputar', async ({ page }) => {
    await page.goto('/play.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const ready = await page.locator('#heroVideo').evaluate((v) => v.readyState >= 2);
    expect(ready).toBe(true);
  });
});

test.describe('Musik', () => {
  test('kontinuitas antar halaman: lagu lanjut dari posisi sama', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.click('#musicIslandBtn');
    await page.waitForTimeout(2000);
    const before = await page.evaluate(() => window.MusicPlayer.getState());
    expect(before.playing).toBe(true);
    const timeBefore = before.audioTime;

    // Navigasi nyata ke halaman lain (tab sama) → state harus terpulihkan.
    await page.goto('/series.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const after = await page.evaluate(() => window.MusicPlayer.getState());
    expect(after.trackTitle).toBe(before.trackTitle);
    expect(after.audioTime).toBeGreaterThanOrEqual(timeBefore - 0.1);

    // Kalau autoplay diblokir → satu klik tombol musik melanjutkan dari posisi tersimpan.
    if (!after.playing) {
      await page.click('#musicFloatingBtn');
      await page.waitForTimeout(1500);
      const resumed = await page.evaluate(() => window.MusicPlayer.getState());
      expect(resumed.playing).toBe(true);
      expect(resumed.audioTime).toBeGreaterThan(timeBefore);
    }
  });
});

test.describe('Navigasi', () => {
  test('menu navbar pindah ke halaman yang benar', async ({ page }) => {
    await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
    const links = [
      ['Series', '/series'],
      ['Movies', '/movies'],
      ['News & Popular', '/newsandpopular'],
      ['My List', '/mylist'],
    ];
    for (const [label, path] of links) {
      await page.click(`nav a:has-text("${label}")`);
      await page.waitForURL((u) => u.pathname === path || u.pathname === path + '.html');
    }
  });
});
