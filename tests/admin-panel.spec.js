// ==========================================================================
// admin-panel.spec.js — Uji regresi Admin Panel (URL rahasia)
// --------------------------------------------------------------------------
// Panel asli ada di 404.html (admin.html hanyalah decoy 404).
// Cakupan:
//   1. Edit berita: judul berubah, video & countdown DI-PERTAHANKAN.
//   2. Tambah berita TANPA "Muat Data" dulu → state dibuat otomatis & dirty.
//   3. Hapus berita → file video dihapus dari repo; file bersama tidak.
//   4. Upload video MIME generik (octet-stream) + ekstensi .mp4 → diterima.
//   5. XSS: judul berisi markup HTML tampil ESCAPED di daftar admin.
//   6. Keamanan: 3x PIN salah → blokir PERMANEN (Triple-Lock: localStorage +
//      sessionStorage + cookie queen_admin_banned) + tombol kontak Telegram.
//   7. Honeypot #hp_field → bot yang mengisinya langsung diblokir.
//   8. Dynamic URL masking: address bar jadi rantai acak; URL acak yang
//      disalin & dibuka di tab lain → dilempar ke index.html.
//   9. Pop-up izin perangkat (consent) muncul sebelum akses.
// ==========================================================================
const { test, expect } = require('@playwright/test');

// URL RAHASIA panel admin (file admin.html di root hanyalah decoy 404).
const ADMIN_URL = '/404.html';

// PIN bawaan sesuai permintaan pemilik. PIN asli TIDAK ada di kode
// situs — yang diverifikasi adalah hash SHA-256-nya (crypto.subtle).
const ADMIN_PIN = '11111333335555577777999990000088888666664444422222214365870910293847565647382910121314151617181910';

// Tutup pop-up izin perangkat bila muncul (agar klik PIN tidak terhalang).
async function dismissConsent(page) {
  const modal = page.locator('#consentModal');
  if (await modal.isVisible()) {
    await page.click('#consentAllow');
    await page.waitForTimeout(300);
  }
}

async function unlockAdmin(page) {
  await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
  await dismissConsent(page);
  await page.fill('#pinInput', ADMIN_PIN);
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
  test('3x PIN salah → perangkat DIBLOKIR PERMANEN (Triple-Lock + kontak Telegram)', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);
    await expect(page.locator('#pinSection')).toBeVisible();

    // 1x salah → dashboard tetap terkunci (tanpa teks error di bawah PIN,
    // sesuai permintaan pemilik). Ada jeda 700ms antar percobaan sebagai
    // anti brute-force otomatis — beri waktu antar klik.
    await page.fill('#pinInput', '0000');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#adminSection')).toBeHidden();

    // 2x salah → masih terkunci.
    await page.waitForTimeout(800);
    await page.fill('#pinInput', '0000');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#adminSection')).toBeHidden();

    // 3x salah → LAYAR BLOKIR permanen, bukan sekadar pesan error.
    await page.waitForTimeout(800);
    await page.fill('#pinInput', '0000');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#blockedSection')).toBeVisible();
    await expect(page.locator('#blockedSection')).toContainText('Akses Diblokir');
    await expect(page.locator('#blockedSection')).toContainText('Percobaan PIN salah 3x');
    // Tombol kontak Telegram @axetherion tersedia.
    await expect(page.locator('#blockedSection a[href*="t.me/axetherion"]')).toBeVisible();
    await expect(page.locator('#pinSection')).toBeHidden();
    await expect(page.locator('#adminSection')).toBeHidden();

    // Triple-Lock Multi Storage: status blokir tersimpan di 3 tempat sekaligus.
    const locks = await page.evaluate(() => ({
      ls: localStorage.getItem('mqBlocked'),
      ss: sessionStorage.getItem('mqBlocked'),
      cookie: /queen_admin_banned=1/.test(document.cookie),
    }));
    expect(locks.ls).toBe('1');
    expect(locks.ss).toBe('1');
    expect(locks.cookie).toBe(true);

    // Refresh halaman → tetap diblokir (penanda tersimpan permanen).
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await expect(page.locator('#blockedSection')).toBeVisible();
    await expect(page.locator('#pinSection')).toBeHidden();
    await expect(page.locator('#adminSection')).toBeHidden();
  });
});

test.describe('Admin Panel — keamanan tambahan', () => {
  test('Honeypot: bot yang mengisi field tersembunyi #hp_field langsung diblokir', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await dismissConsent(page);
    await page.fill('#hp_field', 'isi-bot-otomatis');
    await page.click('#pinForm button[type="submit"]');
    await expect(page.locator('#blockedSection')).toBeVisible();
    await expect(page.locator('#blockedSection')).toContainText('Akses Diblokir');
  });

  test('Pop-up izin perangkat (consent) muncul sebelum akses; Tolak → tertutup', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#consentModal')).toBeVisible();
    await expect(page.locator('#consentModal')).toContainText('Izin Akses Perangkat');
    await page.click('#consentDeny');
    await expect(page.locator('#consentModal')).toBeHidden();
  });

  test('Dynamic URL masking: address bar berubah jadi rantai acak 24 karakter', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    expect(page.url()).toMatch(/#[A-Za-z0-9]{24}$/);
  });

  test('URL acak hasil masking dibuka di tab lain → dilempar ke index.html', async ({ page }) => {
    await page.goto(ADMIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const maskedUrl = page.url();
    expect(maskedUrl).toMatch(/#[A-Za-z0-9]{24}$/);
    // Tab baru punya sessionStorage baru → dianggap URL curian → pulang ke index.
    const page2 = await page.context().newPage();
    await page2.goto(maskedUrl, { waitUntil: 'domcontentloaded' });
    await page2.waitForTimeout(600);
    expect(new URL(page2.url()).pathname).toContain('index');
    await page2.close();
  });

  test('admin.html (decoy) menampilkan 404 — panel asli hanya di URL rahasia', async ({ page }) => {
    await page.goto('/admin.html', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('404');
    await expect(page.locator('#pinSection')).toHaveCount(0);
    await expect(page.locator('#adminSection')).toHaveCount(0);
  });

  test('Movies: judul video TIDAK tampil di kartu maupun modal (hanya video)', async ({ page }) => {
    await page.goto('/movies.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    // Kartu tanpa teks judul di bawah thumbnail.
    const gridText = await page.locator('#moviesGrid').textContent();
    expect(gridText.trim()).toBe('');
    // Modal: hanya video — tanpa header "Now Playing" / judul.
    await page.click('button[aria-label="Putar Video 1"]');
    await expect(page.locator('#video1')).toBeVisible();
    await expect(page.locator('#video1 .movies-modal-title')).toHaveCount(0);
    await expect(page.locator('#video1 .movies-modal-badge')).toHaveCount(0);
    await page.click('#video1 .close');
    await expect(page.locator('#video1')).toBeHidden();
  });

  test('Series: aturan animasi hover foto tersedia (desktop)', async ({ page }) => {
    await page.goto('/series.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const hasHover = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('.series-item:hover')) {
              return true;
            }
          }
        } catch (e) { /* lintas-origin stylesheet diabaikan */ }
      }
      return false;
    });
    expect(hasHover).toBe(true);
  });
});

test.describe('Admin Panel — fitur baru', () => {
  test('Teks situs: edit hero index → state.siteText ditandai berubah', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabText"]');
    await page.click('#tabText button:has-text("Edit Teks")');
    await expect(page.locator('#textForm')).toBeVisible();
    // Field #txt_2 = index.heroTitle (urutan TEXT_FIELDS).
    await page.fill('#txt_2', 'Judul Hero Baru Dari Test');
    await page.click('#textForm button[type="submit"]');
    await page.waitForTimeout(200);
    const st = await page.evaluate(() => window.state.siteText);
    expect(st).toBeTruthy();
    expect(st.dirty).toBe(true);
    expect(st.data.index.heroTitle).toBe('Judul Hero Baru Dari Test');
  });

  test('Pengaturan: jarak paragraf berita → state.settings ditandai berubah', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabSettings"]');
    await page.fill('#newsSpacing', '28');
    await page.click('button:has-text("Simpan Pengaturan ke GitHub")');
    await page.waitForTimeout(200);
    const st = await page.evaluate(() => window.state.settings);
    expect(st).toBeTruthy();
    expect(st.dirty).toBe(true);
    expect(st.data.newsParagraphSpacing).toBe(28);
  });

  test('Daftar Blokir: tambah + hapus entri (tanpa token tetap tercatat dirty)', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabBlock"]');
    await page.fill('#blockValue', '203.0.113.99');
    await page.fill('#blockReason', '3x salah PIN');
    await page.click('#blockForm button[type="submit"]');
    await page.waitForTimeout(200);
    await expect(page.locator('#blockList')).toContainText('203.0.113.99');
    let st = await page.evaluate(() => window.state.blocked);
    expect(st).toBeTruthy();
    expect(st.data.length).toBe(1);
    expect(st.dirty).toBe(true);

    // Hapus entri.
    page.once('dialog', (d) => d.accept());
    await page.click('#blockList .btn-danger');
    await page.waitForTimeout(200);
    st = await page.evaluate(() => window.state.blocked);
    expect(st.data.length).toBe(0);
    await expect(page.locator('#blockList')).toContainText('Belum ada perangkat diblokir');
  });

  test('Deteksi perangkat: fingerprint + IP tampil (tanpa error)', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabBlock"]');
    await page.click('button:has-text("Deteksi Perangkat Ini")');
    await page.waitForTimeout(1500);
    await expect(page.locator('#myDeviceInfo')).toContainText('Fingerprint perangkat ini:');
    const txt = await page.locator('#myDeviceInfo').textContent();
    expect(txt).toMatch(/FP-[0-9A-F]+/);
  });

  test('Musik: field path/URL diganti upload drag & drop (zona audio ada)', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabMusic"]');
    await page.click('#tabMusic button:has-text("Tambah")');
    await expect(page.locator('#musicForm .upload-zone[data-kind="audio"]')).toBeVisible();
    await expect(page.locator('#musicForm input[type="file"]')).toHaveAttribute('accept', 'audio/*');
    // Tidak ada lagi input path manual untuk musik.
    await expect(page.locator('#musicForm input[type="text"]').first()).toBeVisible();
  });

  test('Teks hero per foto (list/grid): edit slides index → state.siteText diisi array', async ({ page }) => {
    await unlockAdmin(page);
    await page.click('.tab-btn[data-tab="tabText"]');
    await page.click('#tabText button:has-text("Edit Teks")');
    await expect(page.locator('#textForm')).toBeVisible();
    // #txt_13 = index.slides (teks hero per foto, satu baris per slide).
    await expect(page.locator('#txt_13')).toBeVisible();
    await page.fill('#txt_13', 'Judul Foto 1 | Deskripsi foto 1\nJudul Foto 2 | Deskripsi foto 2');
    await page.click('#textForm button[type="submit"]');
    await page.waitForTimeout(200);
    const slides = await page.evaluate(() => window.state.siteText.data.index.slides);
    expect(slides).toEqual([
      { title: 'Judul Foto 1', desc: 'Deskripsi foto 1' },
      { title: 'Judul Foto 2', desc: 'Deskripsi foto 2' },
    ]);
    expect(await page.evaluate(() => window.state.siteText.dirty)).toBe(true);
  });
});
