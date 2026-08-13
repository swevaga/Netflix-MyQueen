// Konfigurasi Playwright untuk uji otomatis konsistensi suara.
// Jalankan: npx playwright test
//
// Browser: download chromium resmi Playwright gagal di jaringan ini
// (CDN playwright.azureedge.net & mirror npmmirror sama-sama unreachable),
// jadi dipakai Brave (Chromium) yang sudah terpasang di sistem via
// executablePath. Jika suatu saat `npx playwright install chromium`
// berhasil, hapus blok launchOptions agar memakai chromium bawaan.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8000',
    headless: true,
    // Download browser resmi Playwright gagal (network ke CDN).
    // Pakai Brave (Chromium) yang sudah terpasang di sistem.
    launchOptions: {
      executablePath: '/opt/brave.com/brave/brave',
      args: ['--no-sandbox'],
    },
  },
  webServer: {
    // Server statis custom dengan dukungan HTTP Range (python http.server
    // tidak mendukung Range → seek audio/video di browser gagal, padahal
    // Vercel mendukungnya). Lihat tests/static-server.js.
    command: 'node tests/static-server.js',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
