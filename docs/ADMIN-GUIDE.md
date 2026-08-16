# Admin Panel Guide (URL Rahasia)

> Panduan mengelola konten website **tanpa edit kode sama sekali** — cukup
> browser. Dibuat mengikuti blueprint "Custom Admin Panel (Netflix-MyQueen)".

## URL Rahasia (Hidden URL)

- Panel admin ASLI berada di file dengan nama acak yang **tidak bisa
  ditebak**, misalnya: `404.html` (bisa diganti kapan saja).
- File `admin.html` di root hanyalah **DECOY (umpan)** — siapa pun/bot yang
  menebak `https://SITUS-ANDA/admin.html` hanya melihat **404 Not Found**.
- **Dynamic URL Masking**: begitu panel dibuka, JavaScript langsung mengganti
  teks di address bar menjadi rantai acak 24 karakter (via
  `history.replaceState()`, tanpa memuat ulang). Jika URL acak hasil salinan
  dibuka di HP/tab lain, halaman otomatis "hangus" dan dilempar kembali ke
  `index.html`.

## Arsitektur & Alur Kerja

```
[ Browser Kamu ] ──( 1. Buka URL RAHASIA + Input PIN )──> [ UI Admin Form ]
                                                              │
                                                   ( 2. Submit Data + Token )
                                                              │
                                                              ▼
[ Web Live (Vercel) ] <──( 4. Auto Re-deploy )── [ GitHub API / Repository ]
```

| Komponen | Peran & Fungsi | Media Penyimpanan |
|---|---|---|
| Halaman Admin | Form input data konten (`404.html`) | Browser lokal |
| Keamanan Klien | PIN (hash SHA-256) + honeypot + blokir 3 lapis | localStorage, sessionStorage, cookie |
| Autentikasi | GitHub Personal Access Token (PAT) | localStorage browser |
| Database | File di `src/data/*.js` | Repository GitHub |
| Hosting & Deploy | Auto re-deploy setelah update | Vercel (Auto Trigger) |

### Matriks Keamanan (Berlapis)

1. **LAPIS 1 — URL rahasia + masking**: file admin tidak bisa ditebak;
   address bar dikaburkan dengan rantai acak.
2. **LAPIS 2 — PIN Gatekeeper (klien)**: PIN asli **tidak pernah ada di
   kode** — hanya hash SHA-256 yang tersimpan (diverifikasi via
   `crypto.subtle`).
3. **LAPIS 3 — Honeypot trap**: input tersembunyi `#hp_field` — bot/script
   yang mengisinya langsung kena blokir permanen.
4. **LAPIS 4 — Brute-force lock**: setelah **3x PIN salah**, perangkat
   diblokir **permanen** di 3 tempat sekaligus (Triple-Lock Multi Storage:
   localStorage + sessionStorage + cookie `queen_admin_banned` yang kadaluarsa
   ±999.999.999 tahun).
5. **LAPIS 5 — GitHub API Authorization**: hanya akun dengan PAT yang bisa
   mengubah file di repo. **Token tidak pernah ada di dalam kode.**

## Quick Start

1. **Buat PAT (Personal Access Token)** di GitHub → *Settings → Developer
   settings → Personal access tokens → Tokens (classic)*. Scope yang dibutuhkan:
   `repo` (full control of private/public repositories). Simpan token (`ghp_xxx`)
   di tempat aman (password manager).
2. Buka panel admin di URL rahasia — contoh: `https://SITUS-ANDA/404.html`
   (bukan `admin.html` — itu decoy 404).
3. Pop-up **izin akses perangkat** muncul — pilih **Setuju** agar panel dapat
   memeriksa IP publik & fingerprint perangkat untuk proteksi blokir.
4. Masukkan **PIN** (bawaan sesuai permintaan pemilik — tersimpan sebagai
   hash SHA-256 `bc3ebf64…47b1`; ganti lewat tab *Pengaturan*). Setelah
   **3x PIN salah**, perangkat diblokir permanen (layar blokir + kontak
   Telegram @axetherion).
5. Isi **Owner / Repository / Branch / Token** di kartu *Koneksi GitHub*, klik
   **Tes Koneksi**.
6. Klik **Muat Data dari GitHub** → semua konten situs terambil dari repo.
7. Edit konten di tab **Berita / Foto Series / Video Movies / Musik / Teks / Blokir / Pengaturan**.
   Foto/video/audio **di-upload langsung dari panel ini** lewat
   drag & drop / pilih file — path otomatis terisi, tidak perlu mengetik
   path manual. **Musik juga di-upload** (drag & drop ke `src/audio/`),
   tidak ada lagi input path/URL manual. Semua file yang di-upload
   **dinamai ulang otomatis** sesuai isi folder (lihat di bawah).
8. Klik **Simpan Perubahan ke GitHub** → commit dibuat otomatis → Vercel
   auto re-deploy (±1 menit) → konten baru langsung tampil.

## Yang Bisa Dikelola

| Tab | File Data | Efek di Website |
|---|---|---|
| **Berita** | `src/data/news-data.js` | Pesan bertanggal di `newsandpopular.html` (tambah/hapus/edit, urutan) |
| **Foto Series** | `src/data/series-data.js` | Grid foto `series.html` (dikelompokkan otomatis per rasio) |
| **Video Movies** | `src/data/movies-data.js` | Video + thumbnail di `movies.html` (tanpa judul di layar) |
| **Musik** | `src/data/music-data.js` | Playlist Dynamic Island (semua halaman) — file lagu DI-UPLOAD ke `src/audio/` |
| **Teks** | `src/data/site-text-data.js` | Semua kata-kata: navbar, hero index, More Info, play.html, news & mylist — tampilan list/grid per halaman |
| **Blokir** | `src/data/blocked-devices.json` | Daftar IP / IMEI / MAC / Fingerprint yang diblokir + unduh daftar |
| **Pengaturan** | `src/data/site-settings-data.js`, `src/data/play-video-data.js` | Jarak paragraf berita + video halaman Play |
| **Media (Upload)** | `src/images/photo`, `src/videos/moviespage`, `src/videos/newsandpopularpage`, `src/audio`, `src/videos/playpage` | Foto/video/audio di-upload drag & drop (path otomatis + rename otomatis) |

### Catatan per Tab

- **Berita**: tanggal menerima format `DD-MM-YYYY` (contoh `13-08-2026`)
  atau `YYYY-MM-DD` — disimpan otomatis sebagai `YYYY-MM-DD`. Item dengan
  tanggal mendatang disembunyikan sampai tanggalnya tiba. Isi pesan cukup
  ditulis satu paragraf per baris. **Video (Opsional)**: upload drag & drop
  ke `src/videos/newsandpopularpage/` — kosongkan untuk pesan teks saja.
- **Foto Series**: upload **foto (drag & drop)** ke `src/images/photo/`
  (folder ini satu-satunya yang dipakai) + pilih **rasio** — `ratio`
  menentukan kelompok tampilan (9:16, 16:9, 3:4, 4:3, 1:1). `label` opsional
  (otomatis diambil dari nama file jika kosong). Foto yang sudah dihapus
  dari repo **tidak boleh** dipakai lagi (gambar rusak).
- **Video Movies**: upload **video** ke `src/videos/moviespage/` +
  **thumbnail (foto)** ke `src/images/photo/` — `id` diisi otomatis &
  dipertahankan saat edit. Judul tidak lagi ditampilkan di situs (hanya
  video yang muncul saat diputar), sesuai permintaan pemilik.
- **Musik**: **upload file lagu (drag & drop)** ke `src/audio/` + tulis
  **judul lagu** (contoh *"Selamat Tinggal - Virgoun Ft. Audy"*). Path
  otomatis terisi — tidak ada lagi input path/URL manual.
- **Teks**: edit semua kata-kata situs dengan tampilan **list/grid per
  halaman** (Navbar, `index.html`, `play.html`, `newsandpopular.html`,
  `mylist.html`) — termasuk teks yang muncul bergantian saat foto hero
  berganti. Disimpan ke `src/data/site-text-data.js`.
- **Blokir**: kelola daftar perangkat yang diblokir (IP / IMEI / MAC /
  Fingerprint) — tambah, ganti, hapus; deteksi perangkat ini sendiri;
  unduh daftar sebagai file JSON + TXT.
- **Pengaturan**: jarak antar paragraf pesan berita (px) + video halaman
  Play (upload drag & drop ke `src/videos/playpage/`).

### Media (Upload Drag & Drop + Rename Otomatis)

- Foto/video/audio **di-upload langsung dari panel ini** — seret &
  letakkan file ke area upload, atau klik area untuk memilih file. Path
  otomatis terisi di data; **tidak ada input path manual** untuk media apa
  pun (termasuk musik).
- **Rename otomatis**: setiap file yang di-upload langsung dinamai ulang
  mengikuti isi folder tujuannya (nomor berikutnya dicek via GitHub API):
  - **Foto Series** (rasio 9:16 / 16:9 / 1:1 / 3:4 / 4:3) →
    `placeholder9_16_N.png`, `placeholder16_9_N.png`, `placeholder1_1_N.png`,
    `placeholder3_4_N.png`, `placeholder4_3_N.png`
  - **Video Movies** → `videoN.mp4` · **Thumbnail** → `thumb_N.ext`
  - **Musik** → `musikN.ext` · **Video Play** → `video.mp4` (nama tetap,
    menggantikan file lama)
- Folder tujuan sudah ditentukan (tertulis di setiap area upload):
  - **Foto Series & thumbnail** → `src/images/photo/`
  - **Video Movies** → `src/videos/moviespage/`
  - **Video Berita** → `src/videos/newsandpopularpage/`
  - **Musik** → `src/audio/` · **Video Play** → `src/videos/playpage/`
- **Pilih dari GitHub**: tombol di tiap tab membuka pustaka media repo
  dan hanya menampilkan file dari folder yang sesuai (foto →
  `src/images/photo/`, video movies → `src/videos/moviespage/`, dst.) —
  pilih file yang sudah ada tanpa upload ulang.
- Batas ukuran: foto ±20 MB, video ±70 MB, audio ±30 MB (batas GitHub
  Contents API).
- Setelah upload, path tampil di area upload + preview muncul otomatis.
  Tombol **Ganti** mengganti file, tombol **Hapus** mengosongkan field
  (referensi di data saja — file di repo tidak ikut dihapus saat itu).
- **Menghapus item** (tombol sampah di daftar) sekarang juga menghapus file
  media-nya dari repo lewat GitHub API — selama file itu tidak dipakai item
  lain dan token sudah terisi. Konfirmasi menunjukkan file mana yang akan
  dihapus. File URL eksternal (hosting lain) tidak pernah dihapus.
  Tanpa token, item tetap dihapus dari data tapi file di repo tidak ikut
  terhapus (log memberi tahu).

## Estimasi Waktu

- Pengisian form: ~10–20 detik
- Push API ke GitHub: ~1–2 detik
- Build Vercel: ~30–45 detik
- **Total: konten baru terbit dalam ±1 menit** 🚀

## Akses Cepat dari Situs

Menu **Profile → Settings** di navbar semua halaman membuka panel admin
(langsung ke layar PIN) — link sudah menunjuk ke URL rahasia.

## Keamanan

- **PIN tersimpan sebagai hash SHA-256** — PIN asli TIDAK ada di kode mana
  pun (yang ada hanya `bc3ebf64775aa30923869e8507f37a7317f985db52c808e6a62045bca27447b1`).
  Verifikasi memakai `crypto.subtle.digest` — hash mustahil di-reverse
  menjadi PIN asli.
- **3x salah PIN → blokir PERMANEN (Triple-Lock Multi Storage)**: setelah
  3x salah, penanda blokir disimpan serentak di **localStorage**,
  **sessionStorage**, dan **cookie `queen_admin_banned`** (kadaluarsa
  ±999.999.999 tahun). Membersihkan satu tempat saja tidak cukup.
  Layar blokir menampilkan tombol kontak **Telegram @axetherion**.
- **Cara buka blokir (jika pemilik tidak sengaja terblokir)**: buka
  browser → F12 (Inspect) → tab Console → ketik:
  ```
  localStorage.clear(); document.cookie = "queen_admin_banned=; max-age=0; path=/"; location.reload();
  ```
- **Honeypot trap**: input tersembunyi `#hp_field` di form PIN. Manusia
  tidak bisa melihatnya, tetapi bot/script otomatis akan mengisinya — jika
  terisi → langsung BAN PERMANEN.
- **Izin akses perangkat (consent)**: pop-up muncul sebelum panel membaca
  identitas perangkat. Tanpa izin, proteksi IP/fingerprint nonaktif.
- **Daftar blokir (tab Blokir)**: pemilik bisa menambah/mengganti/menghapus
  entri IP, IMEI, MAC Address, atau Fingerprint perangkat di
  `src/data/blocked-devices.json` (via GitHub API). Perangkat yang cocok
  otomatis diblokir saat membuka admin. Tombol **Unduh Daftar** mengunduh
  daftar sebagai file JSON + TXT.
- **Fingerprint perangkat**: browser TIDAK mengungkap IMEI/MAC asli ke situs
  web (kebijakan privasi). Panel memakai kombinasi fingerprint (canvas +
  WebGL + info browser) dan IP publik (via api.ipify.org) sebagai pengganti
  yang setara untuk identifikasi & blokir perangkat.
- **Anti-XSS**: semua data (judul/path) di-escape sebelum dirender di daftar
  admin, dan file data divalidasi sebagai literal JSON/JS murni sebelum
  diproses (kode berbahaya ditolak).
- **Anti-DDoS / lapisan edge**: situs statis dilindungi CDN (Vercel) — aktifkan
  WAF / rate-limiting / Deployment Protection di dashboard Vercel untuk
  memblokir serangan DDoS skala besar. Header keamanan (HSTS, nosniff,
  X-Frame-Options, Permissions-Policy, COOP) sudah diatur di `vercel.json`.
- PAT hanya disimpan di `localStorage` browser kamu. **Jangan pernah menaruh
  token di dalam file repository.** Gunakan tombol *Bersihkan Token &
  Konfigurasi* (tab Pengaturan) saat selesai di perangkat bersama.
- Jika repo bersifat publik, siapa pun bisa *melihat* kode — lapisan keamanan
  sebenarnya adalah token (tulis) + PIN (tampilan form admin) + URL rahasia.
