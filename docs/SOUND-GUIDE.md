# Panduan Konsistensi Suara (Musik Island vs Video)

Semua halaman punya **pemutar musik Dynamic Island** (`src/js/music-player.js`)
yang bisa berbunyi bersamaan dengan video (Play/movies/series/news). Agar tidak
ada **suara double/tumpuk**, ada satu mekanisme bersama: **suppression counter**.

Panduan ini menjelaskan cara kerjanya, skenario yang didukung, dan aturan
menambah suara baru tanpa memecah konsistensi.

---

## 1. Konsep inti: suppression counter

`music-player.js` menyimpan satu variabel internal:

```js
var suppressCount = 0;   // berapa banyak suara video yang sedang aktif
var wasPlayingBeforeSuppress = false;  // musik sempat jalan sebelum di-pause?
```

Setiap kali **suara video mulai**, halaman memanggil:

```js
window.MusicPlayer.pauseForVideo();   // suppressCount++ (maksimal aman berlapis)
```

Setiap kali **suara video berhenti** (modal ditutup / video selesai / di-mute):

```js
window.MusicPlayer.resumeFromVideo(); // suppressCount--
```

Yang terjadi saat `pauseForVideo()` (hanya saat counter 0 → 1):
- musik di-pause (kalau memang sedang berputar),
- **Dynamic Island disembunyikan** (class `music-island-suppressed`),
- **tombol pojok disembunyikan** (class `music-float-suppressed`),
- panel expanded ditutup.

Yang terjadi saat `resumeFromVideo()` **kembali ke 0**:
- island + tombol pojok tampil lagi,
- musik **dilanjutkan dari posisi terakhir** — tetapi hanya jika memang
  sedang berputar sebelum di-suppress (`wasPlayingBeforeSuppress`).

### Kenapa counter, bukan boolean?

Karena video bisa **bertumpuk**: mis. modal movies masih terbuka lalu video
kedua dibuka. Dengan boolean `true/false`, menutup satu video akan salah
"menyalakan" musik padahal video lain masih berbunyi. Dengan counter:

```
buka video1  → 1   (musik pause, island hilang)
buka video2  → 2   (tetap hilang — benar)
tutup video2 → 1   (TIDAK resume prematur — benar)
tutup video1 → 0   (musik kembali tepat sekali)
```

---

## 2. API publik

```js
window.MusicPlayer = {
    pauseForVideo: pauseForVideo,     // panggil saat suara video MULAI
    resumeFromVideo: resumeFromVideo, // panggil saat suara video BERHENTI
    isSuppressed: function () { return suppressCount > 0; }
};
```

Catatan penting:
- `resumeFromVideo()` **aman dipanggil berlebihan** — saat counter sudah 0,
  fungsi langsung `return`. Jadi tidak perlu takut memanggilnya dua kali
  (mis. dari tombol tutup DAN dari event `ended`).
- `pauseForVideo()` saat counter > 0 hanya menaikkan angka — tidak mengubah
  `wasPlayingBeforeSuppress` (nilai itu diambil dari video pertama).

---

## 3. Skenario video vs musik (yang didukung)

| Skenario | Yang terjadi |
|---|---|
| Musik jalan → klik thumbnail movies | Island + tombol pojok hilang, musik pause |
| Tutup modal movies (× / Esc / Tutup) | Island kembali, musik lanjut dari posisi terakhir |
| Video movies **selesai alami** | Overlay Replay/Tutup muncul **dan** musik kembali otomatis |
| Klik **Replay** di overlay | Video diputar ulang, musik di-suppress lagi |
| Video selesai → klik Replay → selesai lagi | Counter 1 → 0 → 1 → 0 — selalu kembali sekali |
| Musik jalan → video **news** di-unmute (Suara) | Island hilang, musik pause |
| Video news di-mute lagi | Island kembali, musik lanjut |
| Musik jalan → klik Play di index (modal iframe) | `openDialog` → pause; `closeDialog` → resume |
| Video di iframe play.html selesai | `postMessage('netflix-video-ended')` → induk resume |
| Buka video news yang muted (tanpa suara) | Musik TIDAK terganggu — suppression hanya untuk suara video |
| Dua video terbuka bersamaan (nesting) | Counter menumpuk — musik resume hanya saat SEMUA tertutup |

---

## 4. Peta hook per halaman

Semua pemanggilan `pauseForVideo`/`resumeFromVideo` ada di HTML masing-masing
halaman (bukan di `music-player.js` — file itu hanya menyediakan API).

| Halaman | MULAI suara video | BERHENTI suara video |
|---|---|---|
| `movies.html` | `openModal()` | `closeModal()` + event `ended` video |
| `series.html` | `openSeriesVideo()` | `closeSeriesModal()` + event `ended` |
| `newsandpopular.html` | tombol "Suara" (unmute) | tombol "Suara" (mute) + event `ended` |
| `play.html` | `setSound(true)` (tombol Suara) | `setSound(false)` + `postMessage` ke induk saat `ended` |
| `index.html` | `openDialog()` (modal Play) | `closeDialog()` + listener pesan `netflix-video-ended` |

Alur khusus index ↔ play (iframe):

```
index: openDialog → pauseForVideo() (musik induk pause)
index: iframe load → postMessage('netflix-unmute')  → play.html: setSound(true)
play.html: video ended → postMessage('netflix-video-ended') → index: resumeFromVideo()
```

---

## 5. Menambah suara video BARU tanpa menimbulkan tumpuk

Aturan emas — ikuti semua, bukan sebagian:

### 5.1 Selalu lewat API, jangan main `audio.play()` langsung
Kode halaman **tidak boleh** memanggil `play()` pada elemen audio pemutar musik
secara langsung. Gunakan hanya `window.MusicPlayer.pauseForVideo()` /
`resumeFromVideo()`.

### 5.2 Setiap MULAI harus punya pasangan BERHENTI
Untuk setiap tempat suara video mulai, pastikan ada tepat satu tempat berhenti:

- **Modal**: `open...` → pause, `close...` → resume.
- **Video yang bisa selesai alami**: pasang listener `ended` → resume
  (jangan hanya mengandalkan tombol tutup — user bisa menonton sampai habis).
- **Toggle suara**: `unmute` → pause, `mute` → resume.

### 5.3 Pasang listener `ended` HANYA SEKALI per elemen video
Gunakan penanda agar tidak menumpuk listener (contoh pola yang dipakai):

```js
if (!video.dataset.musicHooked) {
    video.dataset.musicHooked = "1";
    video.addEventListener('ended', function () {
        if (window.MusicPlayer) window.MusicPlayer.resumeFromVideo();
    });
}
```

Tanpa penanda ini, membuka modal berulang kali akan memasang banyak listener
`ended` → setiap `ended` memanggil resume berkali-kali. (Aman karena
`resumeFromVideo` idempoten, tapi tetap tidak rapi dan membingungkan.)

### 5.4 Jangan pakai boolean "sedang ada video" — pakai counter
Kalau halaman baru memakai flag sendiri (`isVideoPlaying = true/false`),
dua video yang tumpuk akan salah resume. Serahkan penghitungan ke
`suppressCount` internal pemutar.

### 5.5 Jangan menghabiskan kesempatan autoplay saat di-suppress
Pemutar menyimpan autoplay "interaksi pertama user" dengan aman: interaksi
yang terjadi saat musik sedang di-suppress video **tidak** menghabiskan
kesempatan tersebut (listener dilepas hanya saat musik benar-benar mulai).
Jangan mengganti perilaku ini dengan `{ once: true }` naif.

### 5.6 Verifikasi dengan `?debug`
Buka halaman dengan `?debug` di URL → muncul HUD kecil di pojok kiri-bawah
yang menampilkan `suppressCount`, status `audio`, dan visibilitas island/float.

Uji skenario minimal untuk halaman baru:

```
musik ON        → suppressCount: 0 | island: visible
buka video      → suppressCount: 1 | island: HIDDEN
tutup video     → suppressCount: 0 | island: visible | musik kembali
buka 2 video    → suppressCount: 2 → tutup satu → 1 (island tetap HIDDEN)
```

---

## 6. Checklist singkat (copy-paste untuk halaman baru)

```js
// Saat suara video MULAI (di fungsi open modal / unmute):
if (window.MusicPlayer) window.MusicPlayer.pauseForVideo();

// Saat suara video BERHENTI (di fungsi close modal / mute):
if (window.MusicPlayer) window.MusicPlayer.resumeFromVideo();

// Video selesai alami (sekali pasang per elemen video):
if (!video.dataset.musicHooked) {
    video.dataset.musicHooked = "1";
    video.addEventListener('ended', function () {
        if (window.MusicPlayer) window.MusicPlayer.resumeFromVideo();
    });
}
```

Jika halaman memutar video di **iframe** (seperti play.html di index.html),
ganti langkah terakhir dengan `postMessage('netflix-video-ended')` ke induk,
dan induk memanggil `resumeFromVideo()` pada pesan tersebut.

---

## 7. Referensi file

```
src/js/music-player.js      ← API pauseForVideo/resumeFromVideo/isSuppressed
src/css/common.css          ← class .music-island-suppressed / .music-float-suppressed
docs/MUSIC-GUIDE.md         ← cara menambah lagu ke playlist
docs/DEBUG-GUIDE.md (jika ada) ← mode ?debug lain
```
