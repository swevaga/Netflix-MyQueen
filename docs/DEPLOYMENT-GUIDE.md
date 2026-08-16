# Netflix-MyQueen — Panduan Dokumentasi, Deployment & Keamanan Repository

> Dokumen pelengkap untuk `README.md`. Berisi analisis proyek, rekomendasi penamaan repository,
> panduan deployment (Vercel & GitHub Actions), serta strategi proteksi repository private.
>
> **Status**: Berlaku untuk struktur repo saat dokumen ini dibuat.

---

## 📋 Daftar Isi

- [1. Ringkasan Audit Codebase](#1-ringkasan-audit-codebase)
- [2. Rekomendasi Nama Repository](#2-rekomendasi-nama-repository)
- [3. Analisis UI/UX Website](#3-analisis-uiux-website)
- [4. Lisensi & Hak Cipta](#4-lisensi--hak-cipta)
- [5. Panduan Deployment](#5-panduan-deployment)
- [6. Proteksi Repository Private & Link Download](#6-proteksi-repository-private--link-download)
- [7. Checklist Eksekusi](#7-checklist-eksekusi)

---

## 1. Ringkasan Audit Codebase

Fakta terverifikasi langsung dari kode (bukan asumsi):

| Aspek | Temuan |
|-------|--------|
| Jenis proyek | **Static site murni (MPA)**: HTML5 + Tailwind CSS via CDN + Font Awesome + vanilla JS. Tanpa `package.json`, build step, atau framework. |
| Halaman | `index.html`, `series.html`, `movies.html`, `newsandpopular.html`, `mylist.html`, `play.html` |
| Aset | ±130 gambar + **27 file MP4** — total repo ±**116 MB**; file terbesar 18,9 MB (`newsandpopularpage/news_video.mp4`) |
| `Picture/preview.png` | ⚠️ Tidak ada di workspace — analisis UI (§3) berbasis kode aktual. |
| `.github/workflows/deploy.yml` | Valid (GitHub Pages via peaceiris), **tapi bertentangan dengan strategi private** (lihat §5.4). |
| `.github/workflows/jekyll-docker.yml` | ❌ Template sisaan Jekyll — **sudah dihapus** (tidak cocok dengan proyek statis ini). |
| Lisensi saat ini | `LICENSE` (All Rights Reserved) + `NOTICE` — sudah dibuat. |

---

## 2. Rekomendasi Nama Repository

| # | Nama | Alasan |
|---|------|--------|
| ⭐ 1 | **`netflix-myqueen`** *(rekomendasi)* | Identik dengan identitas proyek; mudah diingat; subdomain Vercel bersih (`netflix-myqueen.vercel.app`); jelas di dashboard. |
| 2 | `my-queen` | Lebih singkat, netral; aman trademark jika visibilitas berubah suatu saat. |
| 3 | `for-nurul` | Paling personal & sentimental — jelas untuk siapa repo dibuat (cocok karena repo private). |

> ⚠️ **Catatan trademark:** Nama & logo "Netflix" adalah merek dagang Netflix Inc. Untuk proyek
> pribadi/gift **tidak masalah**, tapi **jangan publikasikan repo ini** — selain privasi foto/video,
> ada risiko pelanggaran trademark.

---

## 3. Analisis UI/UX Website

*Berbasis kode aktual (`index.html`, `src/css/common.css`, `src/css/index.css`).*

### 3.1 Layout & Struktur
- **Navbar fixed** dengan gradien `black/90 → transparent` (efek scrim): logo kiri, menu (Home, Series, Movies, News & Popular, My List), kanan ikon search/bell/avatar + dropdown.
- **Mobile**: hamburger menu (`md:hidden`) membuka dropdown di bawah navbar.
- **Hero full-screen**: gambar latar + overlay gradien kiri-ke-kanan untuk kontras teks; CTA `▶ Play` (putih) & `ⓘ More Info` (abu); *bottom fade* untuk transisi halus.
- **Gallery "Angel Face"**: 12 kartu rasio 2:3, rotasi otomatis tiap 5 detik.

### 3.2 Skema Warna
- Hitam pekat `#000` + panel `#181818`, hover `#2f2f2f` — faithful dark theme Netflix.
- Aksen merah **`#e50914`** (hex khas Netflix) pada judul modal.
- Hierarki teks: putih (utama), `#ccc/#aaa` (sekunder).

### 3.3 Tipografi — bug yang ditemukan
`common.css` & `index.css` mendeklarasikan `font-family: 'Roboto'`, **tapi font tidak pernah dimuat**
(tidak ada `<link>` Google Fonts). Browser fallback ke sans-serif sistem. **Fix 1 baris** di setiap `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

### 3.4 Interaktivitas & Mikro-interaksi
- **Crossfade gallery**: transisi `opacity + blur(10px) → 0` saat gambar berganti.
- **Shuffle tanpa pengulangan**: Fisher–Yates + pool `remainingImages`.
- **Scroll-reveal** (`scroll-animate`) via `getBoundingClientRect`.
- **Modal**: Play (iframe `play.html`) & Info (kartu `#181818`), responsif.
- **Hero responsif** via elemen `<picture>` (background berbeda untuk mobile) — praktik benar.

### 3.5 Responsivitas
Tailwind `md:` dipakai konsisten (grid 2→6 kolom, navbar, modal, hero). Mobile-first secara keseluruhan solid.

### 3.6 Saran perbaikan (prioritas)
1. **Aksesibilitas**: modal tanpa `role="dialog"`/focus trap; ikon tanpa `aria-label`; `alt` deskriptif. (WCAG — nilai tambah untuk portofolio.)
2. **Performa**: set `src` iframe saat modal di-open saja; `loading="lazy"` pada gambar di bawah fold; `preload="none"` + `poster` untuk video (27 MP4 = beban besar).
3. Hindari `overflow-x-hidden` di body sebagai pereda horizontal-scroll (masking, bukan fix).
4. Pin versi Tailwind CDN (`cdn.tailwindcss.com/3.4.x`) — versi tanpa pin bersifat dev.

---

## 4. Lisensi & Hak Cipta

Karena tujuan adalah **membatasi redistribusi**, lisensi permisif (MIT/Apache) tidak tepat.
Yang dipakai: **proprietary — All Rights Reserved**.

| File | Isi |
|------|-----|
| `LICENSE` | 7 pasal: grant terbatas (penerima khusus), larangan copy/modifikasi/distribusi/fork/komersial, kepemilikan, disklaimer. |
| `NOTICE` | Peringatan hak cipta bilingual (ID/EN) di root repo. |

Alternatif jika suatu saat ingin "boleh dibagikan tapi tidak dikomersialkan": **CC BY-NC-ND 4.0**.

> ⚠️ **Batasan jujur:** Lisensi adalah *deterrent hukum*, bukan pengaman teknis. File yang sudah
> sampai ke tangan penerima bisa saja dibagikan — itu masalah kepercayaan, bukan teknologi.

---

## 5. Panduan Deployment

### 5.1 Evaluasi kompatibilitas (kritis)

| Opsi | Kompatibel dengan repo private? | Catatan |
|------|--------------------------------|---------|
| **Vercel** (native git integration) | ✅ Ya, gratis | Auto-deploy tiap push; ada Deployment Protection. **Rekomendasi.** |
| GitHub Actions → Vercel | ✅ Ya | Butuh `VERCEL_TOKEN` + org/project ID; opsional. |
| GitHub Pages | ❌ Tidak (gratis) | Halaman gratis hanya untuk repo **publik**; private butuh Pro. Kontradiksi dengan tujuan Anda. |

### 5.2 `vercel.json` (sudah ada di root)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/src/videos/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400, stale-while-revalidate=604800" }
      ]
    }
  ]
}
```

### 5.3 Langkah deploy di Vercel (tanpa GitHub Actions)

1. Push repo ke GitHub (private).
2. [vercel.com](https://vercel.com) → **Add New Project** → **Import** repo.
3. Framework Preset: **Other** · Build Command: *(kosong)* · Output Directory: *(kosong — root)*.
4. **Deploy**. Selesai — tiap `git push` ke `main` otomatis mendeploy.
5. Aktifkan **Deployment Protection** (§6).

### 5.3b Environment Variables WAJIB untuk `/api/post.js`

Backend `api/post.js` (Vercel Serverless) membaca variabel lingkungan berikut:

| Variabel | Wajib? | Fungsi |
|----------|--------|--------|
| `GITHUB_TOKEN` | ✅ | PAT GitHub scope `repo` — untuk baca/tulis `src/data/banned_ips.json` & CRUD konten via GitHub REST API. Tanpa ini semua aksi API ditolak (HTTP 503). |
| `GH_OWNER` / `GH_REPO` | ⬜ | Target repo default API (bisa juga dikirim dari panel admin). |
| `GH_BRANCH` | ⬜ | Branch target, default `main`. |
| `ADMIN_PIN` | ⬜ | PIN admin — kosong = PIN bawaan pemilik (hash SHA-256). |

**Setup otomatis (disarankan):**

```bash
node scripts/setup-vercel-env.mjs              # interaktif, tampilkan perintah
node scripts/setup-vercel-env.mjs --apply      # langsung jalankan vercel env add
```

Skrip memvalidasi token & repo via GitHub API, menampilkan nilai yang di-mask
(token tidak pernah dicetak utuh), dan membuat template aman `.env.example`.
Cara manual: Vercel → Project → Settings → **Environment Variables** →
tambahkan `GITHUB_TOKEN`, `GH_OWNER`, `GH_REPO`, `GH_BRANCH`, `ADMIN_PIN`.
Setelah diisi, **redeploy** agar serverless function memuat nilai baru.

### 5.4 Opsional: Deploy Vercel via GitHub Actions

Ganti isi `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel environment information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build project artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

**Secret yang dibutuhkan** (Settings → Secrets and variables → Actions):
`VERCEL_TOKEN` (dari vercel.com/account/tokens), `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`
(hasil `vercel link` di lokal, tersimpan di `.vercel/project.json`).

### 5.5 Opsional: CI validasi HTML (cocok untuk static site)

> Konfigurasi aturan dilonggarkan agar selaras dengan gaya kode proyek (self-closing void
element, inline style, dll): lihat `.htmlvalidate.json` di root.

```yaml
name: HTML Validation

on:
  push:
    branches: [main]
  pull_request:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Validate all HTML pages
        run: npx --yes html-validate@10 "*.html"
```

> ⚠️ **Wajib pin versi `html-validate@10`** (bukan `latest`) — versi 11 membutuhkan Node ≥ 22.22
> sedangkan `setup-node` versi 20 hanya menyediakan Node 20.x; `@10` kompatibel dengan Node 20.
> Workflow ini menandai isu aksesibilitas/struktur sebagai *warning* (tidak menggagalkan build),
> sesuai `.htmlvalidate.json`.

### 5.6 GitHub Pages (bukan rekomendasi)

`.github/workflows/deploy.yml` saat ini (peaceiris) bekerja — tetapi hanya efektif bila repo
**publik** atau akun **GitHub Pro**. Untuk website pribadi, gunakan Vercel + proteksi akses.

---

## 6. Proteksi Repository Private & Link Download

### 6.1 Kebenaran teknis

- **GitHub tidak punya tombol "nonaktifkan Fork/Download" untuk repo publik** — siapa pun bisa
  clone, download ZIP, atau meng-copy isi. Satu-satunya cara: **repo private**.
- File yang sudah ter-deploy (foto/video di situs) selalu bisa diunduh oleh siapa pun yang bisa
  membuka URL situs — jadi proteksi situs sama pentingnya dengan proteksi repo.

### 6.2 Arsitektur proteksi berlapis

```
┌─────────────────────────────────────────────────────────┐
│  LAPIS 1: Private Repository (GitHub)                    │
│  → Fork/clone/download publik: MUSTAHIL                 │
├─────────────────────────────────────────────────────────┤
│  LAPIS 2: Deployment Vercel dari repo private            │
│  → Situs live, source code tidak pernah terekspos       │
├─────────────────────────────────────────────────────────┤
│  LAPIS 3: Deployment Protection (Vercel)                 │
│  → Vercel Authentication: hanya akun yang diundang       │
│    yang bisa membuka situs (GRATIS di Hobby)             │
│    *Password protection = fitur Pro (berbayar)           │
├─────────────────────────────────────────────────────────┤
│  LAPIS 4: LICENSE "All Rights Reserved" + NOTICE         │
│  → Deterrent hukum jika terjadi kebocoran                │
├─────────────────────────────────────────────────────────┤
│  LAPIS 5: Link Download terpisah (Google Drive)          │
│  → Beri foto/video/zip ke penerima tanpa akses kode      │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Langkah-langkah

**1. Ubah repo ke Private**
```
GitHub → Repo Settings → Danger Zone → Change repository visibility → Private
```
> Repo ±116 MB masih jauh di bawah batas keras GitHub (100 MB/file), git biasa tetap jalan.
> Jika membengkak, gunakan **Git LFS** untuk video atau host video di luar repo.

**2. Undang orang yang tepat + 2FA**
```
Settings → Collaborators → Add people → (email penerima)
```
Aktifkan **2FA** di akun GitHub (Settings → Password and security).

**3. Hubungkan Vercel + aktifkan proteksi akses**
```
Vercel → Project → Settings → Deployment Protection → Vercel Authentication → ON
Vercel → Project → Settings → Members → undang email penerima
```

**4. Link download terpisah (Google Drive)**
Unggah foto/video (atau zip lengkap) → set **"Anyone with the link"** atau restrict ke email
penerima → tempel di README (hanya terlihat oleh kolaborator repo private):

```markdown
## 📦 Download Aset

Foto & video versi lengkap (untuk penerima yang dituju saja):

- 📁 **Google Drive**: https://drive.google.com/... (restricted)
```

**5. Keamanan lanjutan**
- Jangan pernah commit token/secret.
- Tinjau **Collaborators** berkala; cabut akses yang tidak lagi dibutuhkan.
- Pencegahan (Lapis 1–3) jauh lebih efektif daripada remediasi hukum (Lapis 4).

---

## 7. Checklist Eksekusi

| Aksi | File/Area | Status |
|------|-----------|--------|
| README versi pro | `README.md` | ✅ Selesai |
| Lisensi proprietary | `LICENSE` + `NOTICE` | ✅ Selesai |
| Konfigurasi Vercel | `vercel.json` | ✅ Selesai |
| Hapus workflow Jekyll | `.github/workflows/jekyll-docker.yml` | ✅ Selesai |
| Workflow deploy (Vercel via Actions) | `.github/workflows/deploy.yml` | ✅ Selesai (opsi §5.4) |
| Environment Variables `/api/post.js` | Vercel → Project → Settings → Environment Variables | ⬜ Jalankan `node scripts/setup-vercel-env.mjs --apply` |
| Ubah visibilitas repo | GitHub Settings → Danger Zone | ⬜ Manual di dashboard |
| Deployment Protection | Vercel → Project Settings | ⬜ Setelah deploy |
| Link download aset | Google Drive → README | ⬜ Opsional |

---

## 8. Cara Deploy Dengan Hasil Yang Sesuai (panduan praktis)

Urutan paling aman agar versi live SELALU sama dengan versi lokal:

### 8.1 Uji dulu di lokal (wajib sebelum push)

```bash
npm install            # sekali saja (dependensi test/validasi)
npx playwright test    # 19 test end-to-end (semua halaman + musik + modal)
npx html-validate *.html
```

Jika semua hijau, baru lanjut deploy.

### 8.2 Deploy (Vercel terhubung ke GitHub — auto-deploy)

```bash
git add -A
git commit -m "deskripsi perubahan"
git push origin main
```

Vercel otomatis mendeploy dalam ±1–2 menit. Cek statusnya di
[vercel.com/dashboard](https://vercel.com/dashboard) → *Deployments*:
deployment terakhir harus berstatus **Ready** + badge **Production**
(bukan *Preview*). Jika *Error* → klik ⋯ → **Redeploy**.

### 8.3 Hasil yang HARUS sesuai setelah deploy (checklist)

Buka `https://nurulflix.vercel.app` (URL produksi, bukan link preview):

| Cek | Hasil yang benar |
|-----|------------------|
| Halaman index | Hero billboard berputar + galeri 12 kartu berganti tiap 5 dtk |
| Halaman series | **BUKAN blank/black screen** — 98 kartu terlihat, dikelompokkan per rasio (Lanskap 16:9, Persegi, Potret), TANPA banner ganda |
| Halaman movies | 59 kartu film; klik kartu → modal video terbuka |
| Halaman news | 3 item berita; video bisa tanpa suara (opsional) |
| Halaman mylist & play | Konten tampil; play video berjalan |
| Musik | Putar musik → pindah halaman → lanjut dari posisi yang sama |
| Gambar/video | Tidak ada ikon gambar rusak di semua halaman |

Jika ada yang belum sesuai → **hard refresh** (`Ctrl+Shift+R` / hapus cache
situs di HP) — browser kadang menyimpan versi lama. Kalau masih beda, cek
lagi langkah 8.2 (deployment harus Ready + Production).

### 8.4 Aturan cache-buster (`?v=N`)

Saat mengubah file **CSS/JS/data**, naikkan versi `?v=`-nya di semua halaman
yang mereferensikannya (contoh: `common.css?v=10` → `?v=11`). Tanpa ini,
browser pengunjung yang pernah datang bisa menampilkan versi lama. HTML
sendiri tidak perlu (selalu fresh via `must-revalidate`).

### 8.5 Analytics & Speed Insights

- **Speed Insights** sudah aktif (script `/_vercel/speed-insights/script.js` → 200).
- **Web Analytics** perlu di-enable manual: Vercel → *Analytics* → pilih proyek → **Enable** → redeploy. Sebelum di-enable, `/_vercel/insights/script.js` mengembalikan 404 (tidak merusak tampilan).
- Keduanya dipasang via paket resmi (`@vercel/analytics` + `@vercel/speed-insights`) yang di-panggil dari `src/js/vercel-init.mjs`.

*Dokumen disusun untuk Vaetherion — 2026.*
