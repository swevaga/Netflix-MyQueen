# Panduan Update News & Popular (Tanpa Edit HTML)

Halaman **News & Popular** (`newsandpopular.html`) sudah **data-driven** — kontennya
di-render otomatis dari satu file data. Untuk update, **tidak perlu menyentuh HTML
sama sekali**: cukup upload video + tulis teks + atur tanggal.

---

## 1. File yang perlu diubah

```
src/data/news-data.js
```

Isi file ini berisi daftar `NEWS_ITEMS` — setiap item = satu postingan.

---

## 2. Cara menambah postingan baru

### Langkah 1 — (Opsional) Upload video
Video **tidak wajib**. Kalau ingin menampilkan video, letakkan file (`.mp4`) di:

```
src/videos/newsandpopularpage/
```

Contoh: `src/videos/newsandpopularpage/kisah_liburan.mp4`

Hanya ingin menambah **kata-kata / cerita** saja? Lewati langkah ini — cukup
isi `date`, `title`, dan `paragraphs` tanpa field `video`.

### Langkah 2 — Tulis item baru di `news-data.js`
Tambahkan satu object di dalam array `NEWS_ITEMS` (boleh di atas item lama):

```js
window.NEWS_ITEMS = [
    {
        date: "2026-08-15",                                        // 1. Tanggal tayang
        title: "Kisah Liburanku",                                  // 2. Judul
        video: "src/videos/newsandpopularpage/kisah_liburan.mp4",  // 3. File video (OPSIONAL — hapus baris ini utk teks saja)
        v: 1,                                                      // 3b. Versi cache (lihat §3b)
        countdown: 8,                                              // 3c. (Opsional) durasi countdown auto-replay
        paragraphs: [                                              // 4. Isi cerita
            "Paragraf pertama...",
            "Paragraf kedua...",
            "Dan seterusnya..."
        ]
    }
];
```

### Langkah 3c — (Opsional) `countdown`: durasi "Memutar episode berikutnya"
Setiap video berita kini punya **countdown ala Netflix** saat video selesai
(ring + angka + "Putar sekarang" + ×, lalu auto-replay). Durasi default
**5 detik** (demo berita pendek). Untuk mengatur per item, tambahkan field
`countdown` (angka detik):

```js
{
    date: "2026-08-15",
    title: "Kisah Liburanku",
    video: "src/videos/newsandpopularpage/kisah_liburan.mp4",
    countdown: 8   // countdown mulai dari 8 detik (default: 5)
}
```

Prioritas: `countdown` di item → `data-countdown` di `<body>` → default 5.

### Langkah 3 — Simpan
Simpan file. Buka/muat ulang `newsandpopular.html` — postingan langsung tampil.

### Langkah 3b — Naikkan `v` jika mengganti video dengan nama file yang sama
Jika kamu **mengganti isi file video** (mis. `news_video.mp4`) tapi namanya tetap,
browser pengunjung masih menyimpan video lama di cache dan akan terus
memutarnya. Solusinya: **naikkan angka `v`** di item tersebut.

```js
video: "src/videos/newsandpopularpage/news_video.mp4",
v: 3,   // sebelumnya 2 → naikkan setiap kali ganti file dengan nama sama
```

> Video baru dengan **nama file baru** tidak perlu mengubah `v` (URL-nya beda,
> tidak kena cache lama).

---

## 3. Aturan tanggal (batas tayang manual)

| Kondisi `date` | Hasil |
|---|---|
| Tanggal **sudah lewat** atau **hari ini** | ✅ Postingan **tampil** |
| Tanggal **masa depan** | 🕓 Postingan **disembunyikan** sampai tanggalnya tiba |

- Format wajib: `YYYY-MM-DD` (contoh: `2026-08-08`).
- Perbandingan memakai **tanggal lokal perangkat pengunjung** (bukan UTC),
  jadi postingan "hari ini" langsung muncul.
- Urutan tampil otomatis: **terbaru di atas** (diurutkan dari tanggal terbesar).

> 💡 **Ide**: siapkan beberapa postingan dengan tanggal di masa depan sekaligus.
> Saat tanggalnya tiba, postingan muncul otomatis — tanpa upload/ubah apa pun.

---

## 4. Aturan teks

- **Judul**: wajib (string biasa).
- **Paragraf**: array string — setiap elemen menjadi satu paragraf.
- **Ganti baris** di tengah paragraf: tulis `\n` di dalam string.
- **Simbol `<`**: otomatis di-escape oleh halaman (aman, tidak merusak HTML).
- **Tanpa video?** Hapus baris `video:` (atau kosongkan) — halaman tetap
  menampilkan judul + teks saja.

---

## 5. Pemeriksaan cepat setelah update

> **Bug yang pernah terjadi:** video `news_video.mp4` sebelumnya korup (decode
error di detik ke-7 — video berhenti di tengah). File sudah di-re-encode bersih.
Jika video berhenti di tengah lagi, kemungkinan besar file video yang di-upload
korup — periksa dengan memutar di pemutar video lain, atau re-encode dengan
HandBrake/ffmpeg sebelum upload.

1. Buka `newsandpopular.html` — pastikan postingan baru muncul.
2. Cek di konsol browser (F12 → Console): pastikan tidak ada error
   `404` (video tidak ditemukan = path salah).
3. Uji tanggal masa depan (opsional): ubah `date` ke bulan depan, simpan,
   muat ulang — postingan harus **hilang** sampai tanggalnya tiba.

---

## 6. Tips performa

- Gunakan video berformat **MP4 (H.264 + AAC)** — kompatibel semua browser.
- Semakin kecil ukuran video, semakin cepat halaman dimuat.
  Bisa dikompres dulu (mis. dengan HandBrake, preset Fast 720p).
- Semua video di halaman ini memakai `preload="metadata"` — hanya metadata
  yang dimuat saat halaman dibuka, jadi halaman tetap ringan.
