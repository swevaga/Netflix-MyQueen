# Panduan Overlay Ended-Video (Replay / Tutup + Countdown)

Semua halaman yang memutar video punya **overlay ala Netflix** yang muncul saat
video selesai: tombol **Replay** (putar ulang) + **Tutup**, dan di modal
movies/series ditambah **countdown "Memutar episode berikutnya"** yang
auto-replay.

Panduan ini merangkum implementasi di semua halaman dan cara menambahkan ke
halaman baru.

---

## 1. Peta implementasi per halaman

| Halaman | Video | Overlay dibuat lewat | Fungsi utama | Countdown |
|---|---|---|---|---|
| `movies.html` | 25 modal (`video1-player` … `video25-player`) | JS injection per modal di `openModal()` | `showEndedOverlay(videoId)`, `replayVideo(videoId)`, `closeModal(videoId)` | ✅ 5 dtk (`data-countdown="5"`) |
| `series.html` | 1 modal (`#seriesVideo`) | JS injection sekali di `openSeriesVideo()` | `showSeriesEnded()`, `replaySeriesVideo()`, `closeSeriesModal()` | ✅ 10 dtk (default) |
| `play.html` | Hero video (`#heroVideo`) | Markup statis di HTML + wiring `addEventListener` | `replayHero()`, `closeHero()` (dalam IIFE) | ❌ |
| `newsandpopular.html` | Dinamis per item berita (`.news-video`) | Template `renderNews()` (data-driven) | `replayNewsVideo(btn)`, `closeNewsVideo(btn)` | ✅ 5 dtk default, per item via field `countdown` di `news-data.js` |

`mylist.html` **tidak punya video** → tidak ada overlay (jangan tambahkan).

---

## 2. Komponen bersama (CSS di `src/css/common.css`)

Semua overlay memakai class yang sama — **tidak perlu CSS baru** untuk halaman
baru:

| Class | Fungsi |
|---|---|
| `.video-ended-overlay` | Lapisan absolut `inset:0` di atas video; `display:none` → `.show` = `flex` (tombol tengah) |
| `.ended-btn` | Tombol bulat 52px (46px mobile), ikon Font Awesome |
| `.ended-replay` | Lingkaran putih, ikon `fa-redo`; hover → merah |
| `.ended-close` | Lingkaran abu transparan, ikon `fa-times`; hover → lebih gelap |
| `.series-countdown*` | Kartu countdown pojok kanan-bawah: ring SVG merah + angka + tombol "Putar sekarang" & "×" |
| `.video-wrap` | Wrapper `position:relative` untuk overlay (movies/series) |

Aturan umum:
- Container video **harus `position:relative`** agar overlay `inset:0` menutupi
  video saja (bukan header/teks).
- `prefers-reduced-motion: reduce` mematikan transisi ring & hover scale.

---

## 3. Alur perilaku (identik di semua halaman)

```
video selesai (event 'ended')
   ├─► musik island + tombol pojok KEMBALI (resumeFromVideo)
   ├─► overlay Replay/Tutup tampil
   └─► (movies/series/news) countdown mulai: 10 → 0
           ├─► 0 → auto-replay (video diputar ulang, musik di-suppress lagi)
           ├─► "Putar sekarang" → replay langsung
           └─► "×" (Batal) → overlay Replay/Tutup tetap, countdown berhenti
```

- **Replay** → `video.currentTime = 0; video.play()` + (jika suara aktif)
  `pauseForVideo()` — musik di-suppress selama video berbunyi.
- **Tutup**:
  - movies/series → tutup modal (`closeModal` / `closeSeriesModal`)
  - play.html (iframe) → `postMessage('netflix-close')` ke induk (modal
    index.html ditutup); jika dibuka langsung → pindah ke `index.html`
  - news → reset video ke poster (pause + `currentTime 0`)
- **News khusus**: unmute video saat overlay sedang tampil (tombol
  "Suara" → "Suara Aktif") otomatis **menutup overlay** + video restart
  bersuara + musik di-suppress — jadi pengguna tak perlu klik Replay dulu.
- Detail suppression suara ada di `docs/SOUND-GUIDE.md`.

---

## 4. Countdown "Memutar episode berikutnya" (movies, series & news)

### Durasi konfigurabel via `data-countdown` (prioritas)

```
<video data-countdown="5">  → per video (menang)      — mis. demo pendek
<body data-countdown="5">   → default per halaman
(tanpa keduanya)            → 10 detik (default)
```

Nilai divalidasi `parseInt > 0`; nilai invalid/0 → fallback ke tingkat
berikutnya.

### Fungsi (nama `movies*` di movies.html, `series*` di series.html)

| Fungsi | Tugas |
|---|---|
| `start*Countdown` | Baca total (`*CountdownTotalFor`), tampilkan kartu, mulai interval 1 detik |
| `update*Countdown` | Update angka + progress ring (stroke-dashoffset) |
| `stop*Countdown` | Hentikan interval + sembunyikan kartu |
| `*PlayNow` | Stop countdown + replay |
| `*CancelCountdown` | Stop countdown (overlay Replay/Tutup tetap) |

Catatan movies: timer & sisa detik disimpan **per `videoId`** (map objek) —
25 modal independen, tidak saling ganggu.

Catatan news: video bersifat dinamis (per item berita, tanpa `videoId`),
state disimpan **per elemen video** (properti `_cdTimer`/`_cdLeft`/`_cdTotal`);
fungsi bernama `news*`. Durasi diatur per item lewat field `countdown` di
`news-data.js` (default 5), dan kartu diberi class `.news-countdown`
(offset `bottom:56px` di common.css) agar tidak menutupi tombol "Suara".

---

## 5. Menambahkan overlay ke halaman baru (checklist)

### 5.1 Syarat
Halaman punya `<video>` (atau template yang merender video) di dalam container
`position:relative`.

### 5.2 Langkah

**a. Markup overlay** (tempel di dalam container video):

```html
<div class="video-ended-overlay">
    <button type="button" class="ended-btn ended-replay" aria-label="Putar ulang"
            title="Putar ulang" onclick="replayVideoContoh(this)">
        <i class="fas fa-redo" aria-hidden="true"></i>
    </button>
    <button type="button" class="ended-btn ended-close" aria-label="Tutup"
            title="Tutup" onclick="closeVideoContoh(this)">
        <i class="fas fa-times" aria-hidden="true"></i>
    </button>
</div>
```

Jika modal dibuat/di-inject via JS (pola movies/series), bangun markup ini
sekali per modal dengan `onclick` membawa `videoId`.

**b. Event `ended`** — tampilkan overlay + pulihkan musik:

```js
video.addEventListener('ended', function () {
    var wrap = video.closest('.relative');              // container video
    var overlay = wrap.querySelector('.video-ended-overlay');
    if (overlay) overlay.classList.add('show');
    if (window.MusicPlayer) window.MusicPlayer.resumeFromVideo();
});
```

**c. Fungsi Replay** — restart + suppress musik jika suara aktif:

```js
function replayVideoContoh(btn) {
    var wrap = btn.closest('.relative');
    var overlay = wrap.querySelector('.video-ended-overlay');
    if (overlay) overlay.classList.remove('show');
    var video = wrap.querySelector('video');
    video.currentTime = 0;
    var p = video.play();
    if (p && p.catch) p.catch(function(){});
    if (!video.muted && window.MusicPlayer) window.MusicPlayer.pauseForVideo();
}
```

**d. Fungsi Tutup** — sesuaikan konteks (tutup modal / reset ke poster /
`postMessage` ke induk).

**e. (Opsional) Countdown** — salin pola dari `series.html`: markup
`.series-countdown` di dalam overlay + fungsi `start*/update*/stop*` +
`*PlayNow`/`*CancelCountdown`, lalu atur durasi via `data-countdown`.

**f. Pasang event `ended` HANYA SEKALI** per elemen video (penanda
`dataset.musicHooked` atau karena elemen memang dibuat sekali).

### 5.3 Verifikasi
```
video selesai → overlay tampil + musik kembali
Replay        → video restart, musik di-suppress (jika bersuara)
Tutup         → modal tertutup / poster / pesan ke induk
Countdown (jika ada) → 10 → 0 auto-replay; Batal & Putar sekarang berfungsi
html-validate → 0 error; konsol bersih
```

---

## 6. Referensi

```
src/css/common.css              ← style overlay + countdown (shared)
docs/SOUND-GUIDE.md             ← suppression suara (pauseForVideo/resumeFromVideo)
docs/MUSIC-GUIDE.md             ← music player Dynamic Island
docs/DEBUG-GUIDE.md             ← mode ?debug (HUD) untuk verifikasi
```
