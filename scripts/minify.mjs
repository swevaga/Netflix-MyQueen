/* ==========================================================================
   scripts/minify.mjs — Kompres semua file situs untuk memperkecil ukuran
   --------------------------------------------------------------------------
   Yang dilakukan:
     1. CSS  (src/css/*.css)          → cssnano (via postcss)
     2. JS   (src/js/*.js)            → terser (kompres + mangle aman)
     3. HTML (*.html)                 → hapus komentar HTML, rapikan spasi,
                                        DAN minify <style> + <script> inline
     4. Bump versi cache-buster (?v=N) pada referensi css/js/data di HTML
        supaya browser tidak memakai cache lama setelah kompresi.

   Jalankan: node scripts/minify.mjs
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { minify as terserMinify } from 'terser';

const ROOT = process.cwd();
let totalBefore = 0;
let totalAfter = 0;

function report(file, before, after) {
  totalBefore += before;
  totalAfter += after;
  const saved = before - after;
  const pct = before > 0 ? ((saved / before) * 100).toFixed(1) : '0';
  console.log(
    `  ${file.padEnd(42)} ${(before / 1024).toFixed(1)}KB → ${(after / 1024).toFixed(1)}KB  (-${pct}%)`,
  );
}

/* String.replace yang mendukung callback async (replace bawaan tidak). */
async function replaceAsync(str, re, fn) {
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(str))) {
    out.push(str.slice(last, m.index));
    out.push(await fn(m));
    last = m.index + m[0].length;
  }
  out.push(str.slice(last));
  return out.join('');
}

/* ---------- 1. CSS ---------- */
async function minifyCss(file) {
  const src = readFileSync(file, 'utf8');
  const result = await postcss([cssnano({ preset: 'default' })]).process(src, {
    from: file,
    to: file,
  });
  writeFileSync(file, result.css);
  report(file, Buffer.byteLength(src), Buffer.byteLength(result.css));
}

/* ---------- 2. JS eksternal ---------- */
async function minifyJs(file) {
  const src = readFileSync(file, 'utf8');
  const out = await terserMinify(src, {
    compress: { passes: 1, drop_console: false },
    mangle: true, // top-level names TIDAK di-mangle (dipakai inline onclick)
    format: { comments: false },
  });
  writeFileSync(file, out.code);
  report(file, Buffer.byteLength(src), Buffer.byteLength(out.code));
}

/* ---------- 3. HTML: komentar + spasi + inline style/script ---------- */
async function minifyHtml(file) {
  let html = readFileSync(file, 'utf8');
  const before = Buffer.byteLength(html);

  // Minify setiap blok <style> inline.
  html = await replaceAsync(html, /<style[^>]*>([\s\S]*?)<\/style>/gi, async (m) => {
    try {
      const r = await postcss([cssnano({ preset: 'default' })]).process(m[1], { from: file });
      return `<style>${r.css}</style>`;
    } catch (e) {
      return m[0];
    }
  });

  // Minify setiap blok <script> inline (tanpa src). Fungsi global tetap
  // dipertahankan (dipanggil inline onclick). Module tetap module.
  html = await replaceAsync(html, /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi, async (m) => {
    const tag = m[0];
    const js = m[1];
    const isModule = /\btype\s*=\s*["']module["']/i.test(tag);
    try {
      const r = await terserMinify(js, {
        compress: { passes: 1, drop_console: false },
        mangle: true,
        module: isModule,
        format: { comments: false },
      });
      return `<script${isModule ? ' type="module"' : ''}>${r.code}</script>`;
    } catch (e) {
      console.warn(`  ⚠ Gagal minify inline script di ${file}: ${e.message} — dibiarkan apa adanya.`);
      return m[0];
    }
  });

  // Hapus komentar HTML (pertahankan komentar kondisional <!--[if ...]-->).
  html = html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  // Rapikan spasi: buang spasi awal & akhir baris, baris kosong beruntun.
  html = html
    .split('\n')
    .map((line) => line.replace(/^\s+/, '').replace(/\s+$/, ''))
    .filter((line, i, arr) => line !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  // Bump cache-buster ?v=N pada referensi css/js/data.
  html = html.replace(/(\?v=)(\d+)/g, (_m, p, n) => p + (parseInt(n, 10) + 1));

  writeFileSync(file, html);
  report(file, before, Buffer.byteLength(html));
}

/* ---------- Jalankan ---------- */
const cssDir = join(ROOT, 'src/css');
const jsDir = join(ROOT, 'src/js');

console.log('Minifying CSS…');
for (const f of readdirSync(cssDir)) {
  if (extname(f) === '.css') await minifyCss(join(cssDir, f));
}

console.log('Minifying JS (src/js)…');
for (const f of readdirSync(jsDir)) {
  if (extname(f) === '.js') await minifyJs(join(jsDir, f));
}

console.log('Minifying HTML…');
for (const f of readdirSync(ROOT)) {
  if (extname(f) === '.html' && statSync(join(ROOT, f)).isFile()) await minifyHtml(join(ROOT, f));
}

console.log('----------------------------------------');
console.log(`Total: ${(totalBefore / 1024).toFixed(1)}KB → ${(totalAfter / 1024).toFixed(1)}KB  (-${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%)`);
console.log('Selesai. Jalankan tes lagi untuk memastikan tidak ada yang rusak.');
