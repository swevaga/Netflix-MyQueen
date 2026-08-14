# Admin Panel Guide (admin.html)

> Panduan mengelola konten website **tanpa edit kode sama sekali** — cukup
> browser. Dibuat mengikuti blueprint "Custom Admin Panel (Netflix-MyQueen)".

## Arsitektur & Alur Kerja

```
[ Browser Kamu ] ──( 1. Buka admin.html + Input PIN )──> [ UI Admin Form ]
                                                              │
                                                   ( 2. Submit Data + Token )
                                                              │
                                                              ▼
[ Web Live (Vercel) ] <──( 4. Auto Re-deploy )── [ GitHub API / Repository ]
```

| Komponen | Peran & Fungsi | Media Penyimpanan |
|---|---|---|
| Halaman Admin | Form input data konten (`admin.html`) | Browser lokal |
| Keamanan Klien | Kunci PIN sebelum form terbuka | JavaScript sederhana |
| Autentikasi | GitHub Personal Access Token (PAT) | localStorage browser |
| Database | File di `src/data/*.js` | Repository GitHub |
| Hosting & Deploy | Auto re-deploy setelah update | Vercel (Auto Trigger) |

### Matriks Keamanan (2 Lapis)

1. **LAPIS 1 — PIN Gatekeeper (klien)**: mencegah pengunjung umum membuka form admin.
2. **LAPIS 2 — GitHub API Authorization**: hanya akun dengan PAT yang bisa
   mengubah file di repo. **Token tidak pernah ada di dalam kode.**

## Quick Start

1. **Buat PAT (Personal Access Token)** di GitHub → *Settings → Developer
   settings → Personal access tokens → Tokens (classic)*. Scope yang dibutuhkan:
   `repo` (full control of private/public repositories). Simpan token (`ghp_xxx`)
   di tempat aman (password manager).
2. Buka `admin.html` di browser (bisa dari `https://SITUS-ANDA/admin.html` atau
   lokal).
3. Masukkan **PIN** (bawaan: `1602` — ganti lewat tab *Pengaturan*).
4. Isi **Owner / Repository / Branch / Token** di kartu *Koneksi GitHub*, klik
   **Tes Koneksi**.
5. Klik **Muat Data dari GitHub** → semua konten situs terambil dari repo.
6. Edit konten di tab **Berita / Foto Series / Video Movies / Musik**.
   Foto/video/thumbnail **di-upload langsung dari panel ini** lewat
   drag & drop / pilih file — path otomatis terisi, tidak perlu mengetik
   path manual. Musik tetap diisi path/URL (file sudah ada di repo/hosting).
7. Klik **Simpan Perubahan ke GitHub** → commit dibuat otomatis → Vercel
   auto re-deploy (±1 menit) → konten baru langsung tampil.

## Yang Bisa Dikelola

| Tab | File Data | Efek di Website |
|---|---|---|
| **Berita** | `src/data/news-data.js` | Pesan bertanggal di `newsandpopular.html` (tambah/hapus/edit, urutan) |
| **Foto Series** | `src/data/series-data.js` | Grid foto `series.html` (dikelompokkan otomatis per rasio) |
| **Video Movies** | `src/data/movies-data.js` | Video + thumbnail di `movies.html` |
| **Musik** | `src/data/music-data.js` | Playlist Dynamic Island (semua halaman) |
| **Media (Upload)** | `src/images/photo`, `src/videos/moviespage`, `src/videos/newsandpopularpage` | Foto/video/thumbnail di-upload drag & drop dari panel (path otomatis). Musik tetap path/URL |

> ℹ️ **Teks situs** (kata-kata di index/news/mylist/play + More Info) tidak lagi
> dikelola dari admin — diatur langsung di kode (`src/data/site-text-data.js`).

### Catatan per Tab

- **Berita**: tanggal menerima format `DD-MM-YYYY` (contoh `13-08-2026`)
  atau `YYYY-MM-DD` — disimpan otomatis sebagai `YYYY-MM-DD`. Item dengan
  tanggal mendatang disembunyikan sampai tanggalnya tiba. Isi pesan cukup
  ditulis satu paragraf per baris. **Video (Opsional)**: upload drag & drop
  ke `src/videos/newsandpopularpage/` — kosongkan untuk pesan teks saja.
  Contoh: tanggal `13-08-2026`, judul *"Teruslah Bersinar Untukku"*.
- **Foto Series**: upload **foto (drag & drop)** ke `src/images/photo/`
  (folder ini satu-satunya yang dipakai) + pilih **rasio** — `ratio`
  menentukan kelompok tampilan (9:16, 16:9, 3:4, 4:3, 1:1). `label` opsional
  (otomatis diambil dari nama file jika kosong). Foto yang sudah dihapus
  dari repo **tidak boleh** dipakai lagi (gambar rusak).
- **Video Movies**: upload **video** ke `src/videos/moviespage/` +
  **thumbnail (foto)** ke `src/images/photo/` — `id` diisi otomatis &
  dipertahankan saat edit.
- **Musik**: isi **path/URL file music** + tulis **judul lagu** (contoh
  *"Selamat Tinggal - Virgoun Ft. Audy"*).

### Media (Upload Drag & Drop)

- Foto/video/thumbnail **di-upload langsung dari panel ini** — seret &
  letakkan file ke area upload, atau klik area untuk memilih file. Path
  otomatis terisi di data; **tidak ada input path manual** untuk media ini.
- Folder tujuan sudah ditentukan (tertulis di setiap area upload):
  - **Foto Series & thumbnail** → `src/images/photo/`
  - **Video Movies** → `src/videos/moviespage/`
  - **Video Berita** → `src/videos/newsandpopularpage/`
- Batas ukuran: foto ±20 MB, video ±70 MB (batas GitHub Contents API).
- Setelah upload, path tampil di area upload + preview muncul otomatis.
  Tombol **Ganti** mengganti file, tombol **Hapus** mengosongkan field
  (referensi di data saja — file di repo tidak dihapus).
- **Musik** tetap diisi **path/URL manual** (tidak ada upload) — file harus
  sudah ada di `src/audio/…` atau hosting eksternal.

## Estimasi Waktu

- Pengisian form: ~10–20 detik
- Push API ke GitHub: ~1–2 detik
- Build Vercel: ~30–45 detik
- **Total: konten baru terbit dalam ±1 menit** 🚀

## Akses Cepat dari Situs

Menu **Profile → Settings** di navbar semua halaman membuka `admin.html`
(langsung ke layar PIN).

## Keamanan

- PIN default ada di konstanta `ADMIN_PIN` di bagian atas `<script>` `admin.html`
  — ganti angkanya, atau pakai tab *Pengaturan* untuk PIN khusus per perangkat.
- PAT hanya disimpan di `localStorage` browser kamu. **Jangan pernah menaruh
  token di dalam file repository.**
- Jika repo bersifat publik, siapa pun bisa *melihat* kode — lapisan keamanan
  sebenarnya adalah token (tulis) + PIN (tampilan form admin).
