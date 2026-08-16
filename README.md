# Netflix-MyQueen ❤️

> Sebuah website bergaya Netflix yang dibuat dengan tangan — khusus untuk satu orang yang spesial.
> **PRIVATE & PERSONAL USE ONLY.** Bukan afiliasi resmi Netflix.

![Status](https://img.shields.io/badge/Status-Private%20%2F%20Personal-red)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Font Awesome](https://img.shields.io/badge/Font%20Awesome-528DD7?logo=fontawesome&logoColor=white)
![License](https://img.shields.io/badge/License-All%20Rights%20Reserved-red)
![Made with Love](https://img.shields.io/badge/Made%20with%20%E2%9D%A4-red)

---

## 📋 Daftar Isi

- [Deskripsi](#-deskripsi)
- [Dokumentasi Lengkap](#-dokumentasi-lengkap)
- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Arsitektur](#-arsitektur)
- [Struktur Proyek](#-struktur-proyek)
- [Quick Start](#-quick-start)
- [Deployment](#-deployment)
- [Lisensi & Hak Cipta](#-lisensi--hak-cipta)
- [Dedikasi](#-dedikasi)
- [Kredit](#-kredit)

---

## 📖 Deskripsi

**Netflix-MyQueen** adalah website bergaya Netflix yang dirancang sebagai hadiah personal.
Berisi koleksi foto dan video yang disusun ulang secara acak dengan efek transisi halus,
antarmuka mengikuti estetika dark-mode Netflix (hitam pekat + aksen `#e50914`).

> ⚠️ Repositori ini **bersifat pribadi**. Akses hanya untuk penerima yang dituju.
> Jika Anda menemukannya di tempat lain, mohon tutup halaman ini. 😌

---

## 📚 Dokumentasi Lengkap

Panduan lengkap untuk mengelola dan mengembangkan situs ini:

| Panduan | Isi |
|---------|-----|
| [docs/ADMIN-GUIDE.md](./docs/ADMIN-GUIDE.md) | Admin Panel (URL rahasia — `admin.html` hanyalah decoy 404): kelola berita, foto (upload drag & drop + rasio), video + thumbnail, musik via GitHub API — media di-upload langsung dari panel, PIN SHA-256 + blokir 3 lapis |
| [docs/DEPLOYMENT-GUIDE.md](./docs/DEPLOYMENT-GUIDE.md) | Deployment (Vercel & GitHub Actions), proteksi repo private |
| [docs/NEWS-GUIDE.md](./docs/NEWS-GUIDE.md) | Update News & Popular: upload video + atur tanggal tanpa edit HTML |
| [docs/MUSIC-GUIDE.md](./docs/MUSIC-GUIDE.md) | Music Player Dynamic Island: menambah/mengganti lagu, urutan & autoplay |
| [docs/SOUND-GUIDE.md](./docs/SOUND-GUIDE.md) | Konsistensi suara: suppression musik vs video, skenario & aturan suara baru |
| [docs/DEBUG-GUIDE.md](./docs/DEBUG-GUIDE.md) | Mode debug `?debug` (HUD music player) untuk verifikasi manual |
| [docs/OVERLAY-GUIDE.md](./docs/OVERLAY-GUIDE.md) | Overlay ended-video (Replay/Tutup + countdown) di movies, series, play, news |

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 🎬 Multi-halaman | Home, Series, Movies, News & Popular, My List, Player |
| 🖼️ Gallery crossfade | 12 kartu rasio 2:3, rotasi otomatis tiap 5 detik dengan efek *blur-fade* |
| 🔀 Shuffle cerdas | Fisher–Yates shuffle tanpa pengulangan urutan |
| 📱 Responsif penuh | Mobile-first (Tailwind breakpoint `md:`) |
| ▶️ Modal player | Video diputar di modal via `play.html` (iframe) |
| 🔔 Notifikasi & dropdown | Interaksi navbar ala Netflix |

---

## 🛠 Tech Stack

- **HTML5** — struktur & semantik
- **Tailwind CSS v3 (CDN)** — styling utility-first
- **CSS3 custom** — dropdown, modal, animasi crossfade, scroll-reveal
- **Vanilla JavaScript (ES6+)** — interaksi, shuffle, rotasi gallery
- **Font Awesome 5** — ikon
- **Aset media** — foto & video MP4 lokal (`src/images`, `src/videos`)

> **Tanpa build step, tanpa framework, tanpa dependensi runtime** — murni static site yang bisa dibuka langsung dari browser.

---

## 🏗️ Arsitektur

Arsitektur **Multi-Page Application (MPA) statis**:

- Setiap halaman adalah file HTML mandiri (`index.html`, `series.html`, ...).
- Styling bersama di `src/css/common.css`, styling per-halaman di file CSS lain.
- JavaScript vanilla inline per halaman; tanpa bundler, tanpa server-side.
- Media (gambar/video) dilayani langsung sebagai file statis.

```
Browser ──▶ index.html / series.html / movies.html ...
              ├── Tailwind CSS (CDN)
              ├── Font Awesome (CDN)
              ├── src/css/*.css
              ├── src/images/**  (foto)
              └── src/videos/**  (video MP4)
```

---

## 📁 Struktur Proyek

```
netflix-myqueen/
├── index.html              # Halaman utama (Hero + gallery "Angel Face")
├── series.html             # Katalog series
├── movies.html             # Katalog movies
├── newsandpopular.html     # News & Popular
├── mylist.html             # My List
├── play.html               # Pemutar video
├── src/
│   ├── css/
│   │   ├── common.css      # Gaya bersama (dropdown, notification, animasi)
│   │   ├── index.css       # Gaya halaman utama (modal, crossfade grid)
│   │   └── style.css
│   ├── images/             # Aset gambar per halaman (homepage, seriespage, ...)
│   └── videos/             # Video per halaman (moviespage, playpage, ...)
├── vercel.json             # Konfigurasi deployment (lihat §Deployment)
└── .github/workflows/      # CI/CD (opsional)
```

---

## 🚀 Quick Start

Repositori bersifat pribadi — hanya orang yang diberi akses yang bisa menyalinnya.

```bash
# Opsi 1 — clone (bagi yang punya akses)
git clone https://github.com/<username>/netflix-myqueen.git
cd netflix-myqueen

# Opsi 2 — jalankan server lokal (disarankan agar video/gambar path-nya benar)
python3 -m http.server 8080
# lalu buka http://localhost:8080
```

Atau cukup buka `index.html` langsung di browser. **Tidak ada instalasi dependensi.**

---

## 🚀 Deployment

### Opsi A — Vercel (Rekomendasi)

1. Import repository (bisa repo **private**) di [vercel.com](https://vercel.com) → *Add New Project*.
2. Framework Preset: **Other**.
3. **Build Command**: *(kosongkan)* | **Output Directory**: *(kosongkan — root)*.
4. Deploy → setiap `git push` ke `main` otomatis ter-deploy.
5. Aktifkan **Deployment Protection** (Vercel Authentication) agar situs hanya bisa dibuka penerima yang dituju.

### Opsi B — GitHub Pages (⚠️ Hanya jika repo publik / akun Pro)

File `.github/workflows/deploy.yml` bekerja dengan GitHub Actions.
Catatan: **GitHub Pages gratis hanya untuk repo publik** — pada repo private butuh GitHub Pro.
Jika ini adalah website pribadi, gunakan Vercel + proteksi akses.

---

## 🔒 Lisensi & Hak Cipta

**Copyright © 2026 Vaetherion. All Rights Reserved.**

Proyek ini menggunakan lisensi **proprietary** — bukan open-source.
Dilarang menyalin, memodifikasi, mendistribusikan ulang, mem-fork, atau menggunakan
kode ini untuk tujuan apa pun tanpa izin tertulis dari pemilik hak cipta.
Lihat file [`LICENSE`](./LICENSE) untuk ketentuan lengkap.

---

## 💌 Dedikasi

> Untuk **Nurul** — proyek ini dibuat khusus untuk kamu.
> Setiap baris kode, setiap foto, dan setiap transisi dibuat dengan satu tujuan:
> membuatmu tersenyum. ❤️

---

## 🙏 Kredit

- **Pembuat**: Vaetherion
- **Inspirasi UI**: Netflix (digunakan untuk tujuan personal, non-komersial; logo & merek milik Netflix Inc.)
- **Ikon**: Font Awesome
- **Styling utility**: Tailwind CSS

---

*Dibuat dengan ❤️, kopi, dan banyak baris kode.*
