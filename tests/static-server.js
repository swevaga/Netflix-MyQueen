// Minimal static file server WITH HTTP Range support, dipakai Playwright
// (webServer di playwright.config.js). `python3 -m http.server` tidak
// mendukung Range, sehingga seek audio/video di browser gagal (currentTime
// terkunci di 0) — padahal Vercel mendukung Range. Server ini menyamakan
// perilaku produksi (Vercel) saat uji otomatis.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Port tetap: jangan baca process.env.PORT (bisa terisi port lain oleh
// proses lain di environment — membuat server gagal start).
const PORT = 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendFile(res, file, stat, range) {
  const headers = {
    'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
  };

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m) {
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
      if (isNaN(start)) start = 0;
      if (isNaN(end) || end >= stat.size) end = stat.size - 1;
      if (start > end || start >= stat.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, Object.assign({}, headers, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': end - start + 1,
      }));
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
  }

  res.writeHead(200, Object.assign({}, headers, { 'Content-Length': stat.size }));
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      // cleanUrls: /series → /series.html
      let file = path.join(ROOT, urlPath);
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        const html = file + '.html';
        if (fs.existsSync(html) && fs.statSync(html).isFile()) {
          file = html;
        }
      }
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        sendFile(res, file, fs.statSync(file), req.headers.range);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(String(e));
    }
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`[static-server] http://127.0.0.1:${PORT} (${ROOT})`);
  });
