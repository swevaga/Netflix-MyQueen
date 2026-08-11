# Panduan Music Player (Dynamic Island)

Semua halaman punya **pemutar musik gaya Dynamic Island iOS** — pill hitam di
atas-tengah layar dengan ikon musik merah, judul lagu, dan waktu putar.
Klik pill → panel terbuka dengan tombol ⏮ ▶ ⏭ dan ⏻ (matikan musik).

Player ini **data-driven**: untuk menambah/mengganti lagu, cukup edit satu file
data — tidak perlu menyentuh HTML (kecuali satu langkah cache-buster, lihat §5).

---

## 1. File yang diubah

```
src/data/music-data.js   ← daftar lagu (satu-satunya file yang diedit)
src/audio/               ← folder tempat taruh file lagu
```

Player-nya sendiri (`src/js/music-player.js`) dan tampilannya
(`src/css/common.css`) **tidak perlu diubah**.

---

## 2. Cara menambah lagu baru

### Langkah 1 — Taruh file lagu
Salin file audio (`.mp3`, `.ogg`, `.m4a`) ke folder:

```
src/audio/
```

Contoh: `src/audio/lagu-romantis.mp3`

### Langkah 2 — Daftarkan di `music-data.js`
Tambahkan satu object di dalam array `window.MUSIC_PLAYLIST`:

```js
window.MUSIC_PLAYLIST = [
    { title: "Lagu Romantis", src: "src/audio/lagu-romantis.mp3" },
    // ...lagu lain
];
```

| Kolom | Wajib | Penjelasan |
|---|---|---|
| `title` | ✅ | Judul yang tampil di pill & panel |
| `src` | ✅ | Path file audio (relatif ke root situs) |

### Langkah 3 — Simpan & muat ulang halaman
Selesai! Pill langsung memakai lagu baru di **semua halaman**.

---

## 3. Track saat ini

`music-data.js` berisi 3 lagu **asli** yang diambil dari folder `Update/Music`
(judul sesuai file aslinya):

- "Aku Yang Jatuh Cinta - Dudy Oris" → `src/audio/aku-yang-jatuh-cinta.mp3`
- "Jangan Paksa Rindu X Yang Telah Merelakanmu" → `src/audio/jangan-paksa-rindu.mp3`
- "Sesi Potret - Enau" → `src/audio/sesi-potret.mp3`

Untuk menambah/mengganti lagu, ikuti §2. **Jangan lupa** langkah cache-buster
di §5 setelah mengedit `music-data.js`.

---

## 4. Urutan & perilaku putar

- **Urutan lagu** = urutan object di dalam array `MUSIC_PLAYLIST`.
  Pindah-pindah baris = pindah urutan.
- **Lagu selesai** → otomatis lanjut ke lagu berikutnya (loop daftar).
- **Autoplay**: musik mulai diputar otomatis setelah **interaksi pertama**
  pengunjung (klik/sentuh/kunci di mana pun) — ini syarat browser modern
  (autoplay bersuara tanpa interaksi diblokir).
- **Matikan musik** (tombol ⏻): musik berhenti, pill berubah jadi "Musik Mati".
  Klik pill sekali lagi untuk menyalakan dan membuka panel.
- **Tombol ⏮ / ⏭**: pindah lagu sebelumnya / berikutnya.

---

## 5. Penting: Cache-buster setelah mengedit `music-data.js`

Semua halaman memuat player lewat `<script src="src/data/music-data.js?v=3">`.
Karena situs ini statis (tanpa build), browser bisa menyimpan file lama.
**Setelah menambah/mengubah lagu, naikkan versinya di keenam file HTML:**

```html
<!-- sebelum -->
<script src="src/data/music-data.js?v=3"></script>
<!-- sesudah (bump angka apa pun) -->
<script src="src/data/music-data.js?v=4"></script>
```

Cara cepat dengan terminal (dari root project):

```bash
for f in *.html; do sed -i 's/music-data\.js?v=[0-9]*/music-data.js?v=4/' "$f"; done
```

> Tanpa langkah ini, pengunjung yang pernah membuka situs masih melihat daftar
> lagu lama.

---

## 6. Format audio yang didukung

| Format | Browser |
|---|---|
| MP3 | Semua browser modern |
| OGG / Vorbis | Chrome, Firefox, Edge |
| M4A / AAC | Chrome, Safari, Edge, Firefox (≥71) |
| MP4 (audio video) | Chrome, Safari, Edge, Firefox (≥71) — dipakai track demo |

Rekomendasi: **MP3** untuk kompatibilitas maksimal. Ukuran kecil (2–5 MB) agar
halaman tetap ringan.
