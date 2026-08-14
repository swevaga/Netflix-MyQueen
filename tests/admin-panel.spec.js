// ==========================================================================
// admin-panel.spec.js — Uji regresi Admin Panel (admin.html)
// --------------------------------------------------------------------------
// Cakupan:
//   1. Edit berita: judul berubah, video & countdown DI-PERTAHANKAN.
//   2. Tambah berita TANPA "Muat Data" dulu → state dibuat otomatis (tidak
//      hilang diam-diam) & ditandai dirty.
//   3. Hapus berita → file video dihapus dari repo (ghDeleteFile dipanggil);
//      file yang dipakai item lain TIDAK dihapus.
//   4. Upload video dengan MIME kosong/generik (application/octet-stream)
//      tapi ekstensi .mp4 → DITERIMA (fallback validasi ekstensi).
//   5. XSS: judul berisi markup HTML ditampilkan ESCAPED di daftar admin.
//   6. Proteksi brute-force PIN: 5x salah → terkunci 60 detik.
// ==========================================================================
const { test, expect } = require('@playwright/test');

async function unlockAdmin(page) {
  await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
  await page.fill('#pinInput', '1602');
  await page.click('#pinForm button[type="submit"]');
  await expect(page.locator('#adminSection')).toBeVisible();
}

async function seedState(page) {
  await page.evaluate(() => {
    window.state.news = {
      data: [
        {
          date: '2025-03-20',
          title: 'Kisahku, Untukmu',
          video: 'src/videos/newsandpopularpage/news_video.mp4',
          paragraphs: ['Paragraf satu.', 'Paragraf dua.'],
          countdown: 5,
        },
        { date: '2025-06-02', title: 'Buket Bunga', paragraphs: ['A', 'B'], video: '' },
      ],
      sha: 'sha-news', dirty: false,
    };
    window.state.series = { data: [], sha: 's', dirty: false };
    window.state.movies = { data: [], sha: 'm', dirty: false };
    window.state.music = { data: [], sha: 'mu', dirty: false };
    window.renderAll();
  });
}

test.describe('Admin Panel — edit & hapus Berita', () => {
  test('edit berita: judul berubah, video & countdown dipertahankan', async ({ page }) => {
    await unlockAdmin(page);
    await seedState(page);

    await page.evaluate(() => window.editors.news.edit(0));
    await expect(page.locator('#newsForm')).toBeVisible();
    await expect(page.locator('#fld_news_video')).toHaveValue('src/videos/newsandpopularpage/news_video.mp4');

    await page.fill('#fld_news_title', 'Judul Diubah Dari Test');
    await page.click('#newsForm button[type="submit"]');
    await page.waitForTimeout(200);

    const item = await page.evaluate(() => window.state.news.data[0]);
    expect(item.title).toBe('Judul Diubah Dari Test');
    expect(item.video).toBe('src/videos/newsandpopularpage/news_video.mp4');
    expect(item.countdown).toBe(5);
    expect(await page.evaluate(() => window.state.news.dirty)).toBe(true);
  });

  test('tambah berita tanpa Muat Data → state dibuat otomatis & dirty', async ({ page }) => {
    await unlockAdmin(page);
    // TANPA seedState — state.news belum ada.

    await page.click('#tabNews button:has-text("Tambah")');
    await expect(page.locator('#newsForm')).toBeVisible();
    await page.fill('#fld_news_date', '14-08-2026');
    await page.fill('#fld_news_title', 'Berita Tanpa Load');
    await page.fill('#fld_news_paragraphs', 'Paragraf A\nParagraf B');
    await page.click('#newsForm button[type="submit"]');
    await page.waitForTimeout(200);

    const st = await page.evaluate(() => {
      const s = window.state.news;
      return { exists: !!s, dirty: s && s.dirty, count: s && s.data.length, item: s && s.data[0] };
    });
    expect(st.exists).toBe(true);
    expect(st.dirty).toBe(true);
    expect(st.count).toBe(1);
    expect(st.item.date).toBe('2026-08-14');
    expect(st.item.title).toBe('Berita Tanpa Load');
  });

  test('hapus berita → file video dihapus dari repo; file bersama tidak dihapus', async ({ page }) => {
    await unlockAdmin(page);
    await seedState(page);
    // Token diisi → penghapusan file dari repo AKTIF (dihapus lewat mock).
    await page.fill('#ghToken', 'ghp_test_token');
    // Tambah item kedua yang memakai video yang SAMA → video tidak boleh dihapus.
    await page.evaluate(() => {
      window.state.news.data.push({
        date: '2025-06-03', title: 'Item Berbagi Video',
        video: 'src/videos/newsandpopularpage/news_video.mp4', paragraphs: ['X'],
      });
      window.state.news.data.push({
        date: '2025-06-04', title: 'Item Video Unik',
        video: 'src/videos/newsandpopularpage/unique_video.mp4', paragraphs: ['Y'],
      });
      window.renderAll();
      // Mock penghapusan file: catat path, resolve sukses.
      window.__deletedFiles = [];
      window.ghDeleteFile = async function (path) {
        window.__deletedFiles.push(path);
        return { ok: true };
      };
    });

    // Hapus item index 1 (Buket Bunga — tanpa video): tidak ada file terhapus.
    page.once('dialog', (d) => d.accept());
    await page.evaluate(() => window.editors.news.remove(1));
    await page.waitForTimeout(300);
    let deleted = await page.evaluate(() => window.__deletedFiles.slice());
    expect(deleted).toEqual([]);

    // Hapus item index 1 (Item Berbagi Video — video dipakai item 0 juga) →
    // video TIDAK boleh dihapus karena masih direferensikan.
    page.once('dialog', (d) => d.accept());
    await page.evaluate(() => window.editors.news.remove(1));
    await page.waitForTimeout(400);
    deleted = await page.evaluate(() => window.__deletedFiles.slice());
    expect(deleted).toEqual([]);

    // Hapus item dengan video UNIK → video dihapus dari repo.
    page.once('dialog', (d) => d.accept());
    await page.evaluate(() => window.editors.news.remove(1));
    await page.waitForTimeout(400);
    deleted = await page.evaluate(() => window.__deletedFiles.slice());
    expect(deleted).toEqual(['src/videos/newsandpopularpage/unique_video.mp4']);

    const remaining = await page.evaluate(() => window.state.news.data.map((i) => i.title));
    expect(remaining).toEqual(['Kisahku, Untukmu']);
  });

  test('upload video dengan MIME generik (octet-stream) diterima via ekstensi', async ({ page }) => {
    await unlockAdmin(page);
    await seedState(page);

    await page.evaluate(() => {
      window.uploadMediaToGitHub = async function (file, folder) {
        return folder + 'uploaded_video.mp4';
      };
    });

    await page.evaluate(() => window.editors.news.edit(0));
    await expect(page.locator('#newsForm')).toBeVisible();
    await page.click('#newsForm .uz-replace');
    await page.waitForTimeout(150);

    // MIME sengaja dibuat generik (banyak browser/OS mengirim octet-stream
    // untuk .mp4) — ekstensi .mp4 harus tetap diterima.
    await page.setInputFiles('#newsForm input[type="file"]', {
      name: 'video_baru.mp4',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('fake mp4'),
    });
    await page.waitForTimeout(800);

    const status = await page.locator('#newsForm .uz-status').textContent();
    expect(status).toContain('Ter-upload');
    await expect(page.locator('#fld_news_video')).toHaveValue('src/videos/newsandpopularpage/uploaded_video.mp4');
  });

  test('XSS: judul berisi markup HTML tampil escaped di daftar admin', async ({ page }) => {
    await unlockAdmin(page);
    await seedState(page);
    await page.evaluate(() => {
      window.state.news.data[0].title = '<img src=x onerror="window.__xss=1">Judul';
      window.renderAll();
    });
    await page.waitForTimeout(200);
    const xss = await page.evaluate(() => window.__xss || 0);
    expect(xss).toBe(0);
    const html = await page.locator('#newsList').innerHTML();
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img src=x');
  });
});

test.describe('Admin Panel — PIN brute-force protection', () => {
  test('5x PIN salah → terkunci (pesan lockout, dashboard tetap tersembunyi)', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 5; i++) {
      await page.fill('#pinInput', '0000');
      await page.click('#pinForm button[type="submit"]');
    }
    await expect(page.locator('#pinError')).toBeVisible();
    await expect(page.locator('#pinError')).toContainText('Terkunci 60 detik');
    await expect(page.locator('#adminSection')).toBeHidden();

    // Percobaan ke-6 (masih dalam masa lock) → tetap ditolak.
    await page.fill('#pinInput', '1602');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#adminSection')).toBeHidden();
    await expect(page.locator('#pinError')).toContainText('Coba lagi dalam');
  });
});
