// Uji otomatis countdown "Memutar episode berikutnya" di video news
// (konsisten dengan movies/series). Jalankan: npx playwright test
const { test, expect } = require('@playwright/test');

async function getVideoState(page) {
  return page.evaluate(() => {
    const v = document.querySelector('.news-video');
    const wrap = v ? v.closest('.relative') : null;
    return {
      hasVideo: !!v,
      playing: v ? !v.paused : false,
      muted: v ? v.muted : null,
      cdShown: wrap ? !wrap.querySelector('.series-countdown').hidden : null,
      cdNum: wrap ? wrap.querySelector('.series-countdown-num').textContent : null,
      overlayShown: wrap
        ? wrap
            .querySelector('.video-ended-overlay')
            .classList.contains('show')
        : null,
      suppressed: window.MusicPlayer ? window.MusicPlayer.isSuppressed() : null,
    };
  });
}

async function fireEnded(page) {
  await page.evaluate(() => {
    const v = document.querySelector('.news-video');
    v.pause();
    v.currentTime = 0;
    v.dispatchEvent(new Event('ended'));
  });
}

test('news: countdown muncul saat video selesai (default 5)', async ({
  page,
}) => {
  await page.goto('/newsandpopular.html');
  await expect(page.locator('.news-video')).toBeVisible();

  await fireEnded(page);
  let s = await getVideoState(page);
  expect(s.cdShown).toBe(true);
  expect(s.cdNum).toBe('5'); // default (item tanpa field countdown)
  expect(s.overlayShown).toBe(true);

  // Batal (×) → countdown berhenti, overlay Replay/Tutup tetap, video pause.
  await page.click('.series-countdown-cancel');
  s = await getVideoState(page);
  expect(s.cdShown).toBe(false);
  expect(s.overlayShown).toBe(true);
  expect(s.playing).toBe(false);
});

test('news: Putar sekarang & interplay unmute (overlay + countdown tertutup)', async ({
  page,
}) => {
  await page.goto('/newsandpopular.html');
  await expect(page.locator('.news-video')).toBeVisible();

  // Putar sekarang → video restart, overlay + countdown hilang.
  await fireEnded(page);
  await page.click('.series-countdown-play');
  let s = await getVideoState(page);
  expect(s.cdShown).toBe(false);
  expect(s.overlayShown).toBe(false);
  expect(s.playing).toBe(true);

  // Interplay: ended → countdown tampil → unmute (Suara) → overlay & countdown
  // tertutup, video main bersuara, musik di-suppress.
  await fireEnded(page);
  s = await getVideoState(page);
  expect(s.cdShown).toBe(true);
  await page.click('.news-sound');
  s = await getVideoState(page);
  expect(s.overlayShown).toBe(false);
  expect(s.cdShown).toBe(false);
  expect(s.playing).toBe(true);
  expect(s.muted).toBe(false);
  expect(s.suppressed).toBe(true);
});
