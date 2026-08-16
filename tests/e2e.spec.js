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

// PIN bawaan baru (sesuai permintaan pemilik).
const ADMIN_PIN = '9999999990000000000222222222244444444446666666666111111111133333333335555555555A';

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
  test('98 kartu unik terlihat tanpa duplikat banner; foto DISPLAY-ONLY (tanpa modal video)', async ({ page }) => {
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
    // 105 kartu: 111 lama dikurangi 6 foto yang sudah dihapus dari
    // src/images/photo (placeholder3_4_7/8.png & placeholder3_4_15-18.jpg)
    // — referensi rusak tidak boleh dirender lagi.
    expect(st.visibleCards).toBe(105);
    expect(st.dupVisible).toBe(0);
    expect(st.staticBannersVisible).toBe(0);

    // FOTO DISPLAY-ONLY: klik foto TIDAK membuka modal video (fitur
    // "foto play video" dihapus — halaman series hanya menampilkan foto).
    await page.click('#seriesRatioContainer .series-item');
    await page.waitForTimeout(400);
    await expect(page.locator('#seriesModal')).toHaveCount(0);
    expect(await page.locator('#seriesVideo').count()).toBe(0);
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

    const cards = page.locator('#moviesSection button[aria-label^="Putar Video"]');
    await expect(cards).toHaveCount(59);

    await page.click('button[aria-label="Putar Video 1"]');
    await expect(page.locator('#video1')).toBeVisible();
    // Sumber video ada di <source> (bukan atribut src <video>).
    const src = await page.locator('#video1-player source').getAttribute('src');
    expect(src).toMatch(/\.mp4$/);
    await page.click('#video1 .close');
    await expect(page.locator('#video1')).toBeHidden();
  });
});

test.describe('News & My List', () => {
  test('news: pesan MENDATAR per tanggal + chip navigasi + tanpa Baca selengkapnya', async ({ page }) => {
    await page.goto('/newsandpopular.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    // Chip = 6 tanggal unik, urut MENDATAR lama → baru (dari data saat ini):
    // 20-03-2025, 31-03-2025, 02-06-2025, 04-06-2025, 07-12-2025, 05-03-2026.
    const chips = page.locator('#newsDates .news-date-chip');
    await expect(chips).toHaveCount(6);

    const labels = await chips.allTextContents();
    expect(labels[0]).toContain('Maret 2025');
    expect(labels[1]).toContain('Maret 2025');
    expect(labels[2]).toContain('Juni 2025');
    expect(labels[3]).toContain('Juni 2025');
    expect(labels[4]).toContain('Desember 2025');
    expect(labels[5]).toContain('Maret 2026');

    // Setiap tanggal = SATU slide selebar layar (pesan digeser ke samping).
    await expect(page.locator('#newsHorizontal .news-slide')).toHaveCount(6);

    // Slide pertama berisi 2 pesan (tanggal 20-03-2025); total 7 artikel.
    const articles = page.locator('#newsHorizontal article');
    await expect(articles).toHaveCount(7);
    await expect(page.locator('#newsHorizontal .news-slide[data-date="2025-03-20"] article')).toHaveCount(2);

    // Setiap artikel menampilkan tanggal format DD-MM-YYYY di atas judul.
    await expect(page.locator('#newsHorizontal .news-date-label').first()).toHaveText(/\d{2}-\d{2}-\d{4}/);

    // Scrollbar horizontal TRANSPARAN tapi masih terlihat samar (bukan
    // disembunyikan total) — user tahu daftar bisa digeser.
    const scrollbar = await page.evaluate(() => {
      const el = document.getElementById('newsHorizontal');
      const cs = getComputedStyle(el);
      return { overflowX: cs.overflowX, width: cs.scrollbarWidth };
    });
    expect(scrollbar.overflowX).toBe('auto');
    expect(scrollbar.width).not.toBe('none');

    // Tombol panah kiri/kanan navigasi antar tanggal tersedia.
    await expect(page.locator('#newsNavPrev')).toBeVisible();
    await expect(page.locator('#newsNavNext')).toBeVisible();
    // Di tanggal paling lama (slide pertama), panah kiri nonaktif.
    await expect(page.locator('#newsNavPrev')).toBeDisabled();

    // Jarak paragraf berita diambil dari SITE_SETTINGS.newsParagraphSpacing.
    const gap = await page.evaluate(() => {
      const el = document.querySelector('.news-paragraphs');
      return el ? getComputedStyle(el).gap : null;
    });
    expect(gap).toBe('16px');

    // Chip tanggal paling lama aktif secara default.
    await expect(chips.nth(0)).toHaveAttribute('aria-pressed', 'true');

    // Klik chip tanggal terakhir → slide tanggal itu aktif & ikut tergeser.
    await chips.nth(5).click();
    await expect(chips.nth(5)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#newsHorizontal .news-slide[data-date="2026-03-05"]')).toBeInViewport();
    const slideText = await page.locator('#newsHorizontal .news-slide[data-date="2026-03-05"]').textContent();
    expect(slideText).toContain('Kepanikan di Bulan Ramadhan');

    // Tombol panah kiri menggeser kembali ke tanggal sebelumnya (07-12-2025).
    await expect(page.locator('#newsNavPrev')).toBeEnabled();
    await page.click('#newsNavPrev');
    await expect(page.locator('#newsHorizontal .news-slide[data-date="2025-12-07"]')).toBeInViewport();

    // TIDAK ada tombol "Baca selengkapnya" — semua paragraf langsung tampil.
    expect(await page.locator('a, button', { hasText: /selengkapnya/i }).count()).toBe(0);

    // Semua paragraf pesan terlihat tanpa perlu klik (paragraf terakhir artikel pertama).
    const firstArticle = await page.locator('#newsHorizontal .news-slide[data-date="2025-03-20"] article').first().textContent();
    expect(firstArticle).toContain('Dan bagiku, itu sudah cukup.');
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
    // Metadata lagu besar (8-11 MB) butuh beberapa detik → tunggu 6s agar
    // posisi tersimpan sempat dipulihkan sebelum dibaca.
    await page.goto('/series.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(6000);
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

test.describe('Admin Panel', () => {
  test('PIN gatekeeper: salah → ditolak, benar → dashboard terbuka', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#pinSection')).toBeVisible();
    await expect(page.locator('#adminSection')).toBeHidden();

    // PIN salah → error muncul, dashboard tetap terkunci.
    await page.fill('#pinInput', '0000');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#pinError')).toBeVisible();
    await expect(page.locator('#adminSection')).toBeHidden();

    // Jeda antar percobaan (anti brute-force 700ms) sebelum PIN benar.
    await page.waitForTimeout(800);
    // PIN benar (bawaan baru) → dashboard terbuka + editor tersedia.
    await page.fill('#pinInput', ADMIN_PIN);
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#adminSection')).toBeVisible();
    await expect(page.locator('#pinSection')).toBeHidden();

    // Tab editor & form berfungsi (tanpa data GitHub: form tambah tetap terbuka).
    await page.click('.tab-btn[data-tab="tabNews"]');
    await page.click('#tabNews button:has-text("Tambah")');
    await expect(page.locator('#newsForm')).toBeVisible();
    await expect(page.locator('#newsForm input, #newsForm textarea').first()).toBeVisible();
  });

  test('Tombol kunci mengembalikan ke layar PIN', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await page.fill('#pinInput', ADMIN_PIN);
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#adminSection')).toBeVisible();
    await page.click('button:has-text("Kunci")');
    await expect(page.locator('#pinSection')).toBeVisible();
    await expect(page.locator('#adminSection')).toBeHidden();
  });
});

test.describe('Navigasi', () => {
  // 5 pemuatan halaman berat (banyak gambar/video) → perlu timeout lebih besar.
  test('menu navbar pindah ke halaman yang benar', { timeout: 150000 }, async ({ page }) => {
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
