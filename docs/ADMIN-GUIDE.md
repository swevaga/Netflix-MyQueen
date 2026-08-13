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
   Media diisi sebagai **path/URL** (file harus sudah ada di repo atau di
   hosting eksternal) — preview foto/video/audio muncul otomatis saat path
   diketik. Tidak ada upload media dari panel ini.
7. Klik **Simpan Perubahan ke GitHub** → commit dibuat otomatis → Vercel
   auto re-deploy (±1 menit) → konten baru langsung tampil.

## Yang Bisa Dikelola

| Tab | File Data | Efek di Website |
|---|---|---|
| **Berita** | `src/data/news-data.js` | Pesan bertanggal di `newsandpopular.html` (tambah/hapus/edit, urutan) |
| **Foto Series** | `src/data/series-data.js` | Grid foto `series.html` (dikelompokkan otomatis per rasio) |
| **Video Movies** | `src/data/movies-data.js` | Video + thumbnail di `movies.html` |
| **Musik** | `src/data/music-data.js` | Playlist Dynamic Island (semua halaman) |
| **Media Path/URL** | `src/images/photo`, `src/videos/*`, `src/audio` | Field foto/video/audio hanya menerima path/URL — file TIDAK di-upload dari panel |

> ℹ️ **Teks situs** (kata-kata di index/news/mylist/play + More Info) tidak lagi
> dikelola dari admin — diatur langsung di kode (`src/data/site-text-data.js`).

### Catatan per Tab

- **Berita**: tanggal menerima format `DD-MM-YYYY` (contoh `13-08-2026`)
  atau `YYYY-MM-DD` — disimpan otomatis sebagai `YYYY-MM-DD`. Item dengan
  tanggal mendatang disembunyikan sampai tanggalnya tiba. Isi pesan cukup
  ditulis satu paragraf per baris. **Video (Opsional)**: isi path/URL video
  yang sudah ada — kosongkan untuk pesan teks saja.
  Contoh: tanggal `13-08-2026`, judul *"Teruslah Bersinar Untukku"*.
- **Foto Series**: isi **path/URL foto + pilih rasio** — `ratio` menentukan
  kelompok tampilan (9:16, 16:9, 3:4, 4:3, 1:1). `label` opsional (otomatis
  diambil dari nama file jika kosong). Foto yang sudah dihapus dari repo
  **tidak boleh** dipakai lagi (gambar rusak).
- **Video Movies**: isi **path/URL video + thumbnail (foto)** — `id` diisi
  otomatis & dipertahankan saat edit.
- **Musik**: isi **path/URL file music** + tulis **judul lagu** (contoh
  *"Selamat Tinggal - Virgoun Ft. Audy"*).

### Media (Path/URL, tanpa Upload)

- Field foto/video/audio hanya menerima **teks path/URL** — tidak ada tombol
  upload/drag & drop dari panel ini.
- File harus sudah ada di repository (mis. `src/images/photo/…`,
  `src/videos/moviespage/…`, `src/audio/…`) atau di hosting eksternal
  (URL lengkap `https://…`).
- Preview (foto tampil, video/audio punya kontrol putar) muncul otomatis
  saat path diketik — path yang salah/rusak tidak menampilkan preview.
- Untuk menambah file media baru ke repo, gunakan git biasa (commit + push),
  lalu isi path-nya di panel ini.

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
