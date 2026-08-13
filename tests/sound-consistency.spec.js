// Uji otomatis konsistensi suara — skenario gabungan.
// Jalankan: npx playwright test
// (konfigurasi browser di playwright.config.js — saat ini memakai Brave)
//
// Skenario yang diminta: buka musik island → putar video movies → tanpa
// menutup modal buka sumber suara kedua (setara "video news yang di-unmute")
// → tutup semua → musik kembali TEPAT SEKALI, tidak ada suara tumpuk.
//
// Catatan arsitektur: tiap halaman punya instance music-player sendiri
// (state per halaman), jadi skenario lintas halaman (movies → news) tidak
// berbagi state. Leg "news unmute" diuji sebagai halaman terpisah, dan
// di leg movies, sumber suara kedua disimulasikan dengan membuka modal
// video2 TANPA menutup video1 (nesting) — setara dengan membuka video
// news yang di-unmute di tengah pemutaran movies.
//
// API yang diuji: window.MusicPlayer.getState() →
//   { suppressCount, playing, started, isOff, hasAudio, audioPaused, ... }
// suppressCount: 0 = musik bebas, >=1 = ada video berbunyi, >=2 = nesting.
const { test, expect } = require('@playwright/test');

// --- Helper ---------------------------------------------------------------

async function getState(page) {
  return page.evaluate(() => window.MusicPlayer.getState());
}

async function suppressed(page) {
  return page.evaluate(() => ({
    island: document
      .getElementById('musicIsland')
      .classList.contains('music-island-suppressed'),
    float: document
      .getElementById('musicFloatingBtn')
      .classList.contains('music-float-suppressed'),
  }));
}

async function expectSuppressCount(page, n) {
  await expect
    .poll(() => page.evaluate(() => window.MusicPlayer.getState().suppressCount))
    .toBe(n);
}

async function startMusic(page, path) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Klik pill sekali sudah memulai musik: handler pill membuka panel,
  // lalu handleInteraction (document click) memanggil togglePlay(true).
  // (Klik kedua pada #musicToggle justru PAUSE — hindari.)
  await page.click('#musicIslandBtn');
  await expect
    .poll(() => page.evaluate(() => window.MusicPlayer.getState().playing))
    .toBe(true);
  const s = await getState(page);
  expect(s.suppressCount).toBe(0);
}

// --- Leg 1: movies (nesting dua video, tanpa tutup modal) ------------------

test('movies: musik → video1 → video2 (tanpa tutup video1) → tutup semua → musik kembali sekali', async ({
  page,
}) => {
  await startMusic(page, '/movies.html');

  // Buka video1 (klik thumbnail asli) → musik di-suppress.
  await page.click('button[aria-label="Putar video 1"]');
  await expectSuppressCount(page, 1);
  expect(await suppressed(page)).toEqual({ island: true, float: true });

  // Tanpa menutup video1, buka video2 → counter naik 1→2 (nesting aman).
  // (Modal video1 menutupi viewport, jadi dipanggil lewat fungsi global —
  //   logika suppression yang diuji, bukan visual modal.)
  await page.evaluate(() => openModal('video2'));
  await expectSuppressCount(page, 2);
  expect(await suppressed(page)).toEqual({ island: true, float: true });

  // Tutup video2 saja → video1 masih terbuka, musik TIDAK boleh resume.
  await page.evaluate(() => closeModal('video2'));
  await expectSuppressCount(page, 1);
  expect(await suppressed(page)).toEqual({ island: true, float: true });

  // Tutup video1 (klik tombol close asli) → musik kembali TEPAT SEKALI.
  await page.locator('#video1 .close').click();
  await expectSuppressCount(page, 0);
  const s = await getState(page);
  expect(s.playing).toBe(true);
  expect(await suppressed(page)).toEqual({ island: false, float: false });

  // Idempotensi: resume ganda tidak boleh menaikkan/merusak state.
  await page.evaluate(() => window.MusicPlayer.resumeFromVideo());
  await expectSuppressCount(page, 0);
});

// --- Leg 2: newsandpopular (unmute → mute) ---------------------------------

test('news: musik → unmute video → mute → musik kembali sekali', async ({
  page,
}) => {
  await startMusic(page, '/newsandpopular.html');

  const soundBtn = page.locator('.news-sound').first();
  await expect(soundBtn).toBeVisible();

  // Unmute ("Suara" → "Suara Aktif") → musik di-suppress.
  await soundBtn.click();
  await expectSuppressCount(page, 1);
  expect(await suppressed(page)).toEqual({ island: true, float: true });

  // Mute kembali → musik resume tepat sekali.
  await soundBtn.click();
  await expectSuppressCount(page, 0);
  const s = await getState(page);
  expect(s.playing).toBe(true);
  expect(await suppressed(page)).toEqual({ island: false, float: false });
});

// --- Leg 3: index (modal Play iframe) --------------------------------------

test('index: musik → modal Play (iframe) → tutup → musik kembali sekali', async ({
  page,
}) => {
  await startMusic(page, '/index.html');

  // Klik tombol Play di hero → modal iframe terbuka, musik di-suppress.
  await page.click('button[onclick="openModal()"]');
  await expectSuppressCount(page, 1);
  expect(await suppressed(page)).toEqual({ island: true, float: true });

  // Tutup modal → musik kembali tepat sekali.
  await page.evaluate(() => closeModal());
  await expectSuppressCount(page, 0);
  const s = await getState(page);
  expect(s.playing).toBe(true);
  expect(await suppressed(page)).toEqual({ island: false, float: false });
});

// --- Leg 4: index (modal More Info TANPA video) -----------------------------

test('index: musik → modal More Info (tanpa video) → musik TETAP lanjut', async ({
  page,
}) => {
  await startMusic(page, '/index.html');

  // More Info tidak menampilkan video apa pun → musik tidak boleh di-suppress.
  await page.click('button[onclick="openInfoModal()"]');
  await expect(page.locator('#infoModal')).toBeVisible();
  await expectSuppressCount(page, 0);
  const s = await getState(page);
  expect(s.playing).toBe(true);
  expect(await suppressed(page)).toEqual({ island: false, float: false });

  // Tutup modal → musik tetap berjalan (tidak ada perubahan state).
  await page.evaluate(() => closeInfoModal());
  await expectSuppressCount(page, 0);
  const s2 = await getState(page);
  expect(s2.playing).toBe(true);
});
