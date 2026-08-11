# Panduan Mode Debug (`?debug`)

Mode debug adalah fitur **opsional** untuk memverifikasi perilaku situs secara
manual — khususnya **konsistensi suara** antara musik Dynamic Island dan video.
Cukup tambahkan `?debug` di URL halaman; tidak ada efek apa pun pada pengunjung
biasa (tanpa `?debug`, tidak ada yang berubah).

---

## 1. Cara mengaktifkan

Ada **dua cara** — keduanya setara dan bisa saling menggantikan:

### 1a. Tanpa reload: klik tombol musik 3x cepat

Klik tombol musik di pojok kanan-bawah **3 kali berturut-turut** (dalam
±600 ms) → **semua HUD debug** (musik + hero slider + scroll-reveal) muncul
atau tersembunyi sekaligus. Berlaku di halaman mana pun, kapan pun,
**tanpa reload dan tanpa query string**.

- Klik ke-1 & ke-2 tetap berfungsi normal (play/pause); klik ke-3 dikonsumsi
  untuk toggle HUD → **3 klik netto tidak mengubah musik**.
- Klik tunggal (tidak cepat) tetap play/pause seperti biasa.

### 1b. Auto-enable saat load: query string

Tambahkan `?debug` atau `?debug=auto` di akhir URL:

```
http://localhost:8000/index.html?debug
http://localhost:8000/movies.html?debug=auto
http://localhost:8000/series.html?debug
http://localhost:8000/newsandpopular.html?debug
http://localhost:8000/mylist.html?debug
http://localhost:8000/play.html?debug=auto
```

Deteksi di kode:

```js
var hudEnabled = /[?&]debug\b/.test(location.search); // ?debug ATAU ?debug=auto
```

Jadi `?debug`, `?debug=1`, dan `?x=1&debug` semuanya aktif; `?debugger` tidak.
Setelah aktif, HUD tetap bisa dimatikan dengan klik 3x (dan dihidupkan lagi).

---

## 2. Mode yang tersedia

Semua HUD berada dalam **satu container** (`#debugHudContainer`, pojok
kiri-bawah, tersusun otomatis vertikal) yang dikelola `src/js/debug-hud.js`.

| Mode | File | Isi HUD | Halaman |
|---|---|---|---|
| **Pemutar musik** | `src/js/music-player.js` | `suppressCount`, status audio, visibilitas island/float | Semua 6 |
| **Hero slider** | `src/js/hero-slider.js` | Slide aktif (`n/total`), judul slide, mode (custom/default), reduced-motion | index, news, mylist |
| **Scroll-reveal** | `src/js/scroll-reveal.js` | Nama halaman, dukungan `IntersectionObserver`, jumlah elemen diamati, `ter-reveal` (x/y), elemen terakhir ter-reveal | index, series, movies, news |

Muncul saat: `?debug`/`?debug=auto` di URL, **atau** klik tombol musik pojok
3x cepat (toggle semua HUD).

Saat ini hanya satu mode yang diimplementasikan. Struktur penambahannya
dijelaskan di §6 agar mode baru mudah ditambahkan.

---

## 3. HUD Pemutar Musik (pojok kiri-bawah)

Panel kecil **monospace hijau** dengan **border merah Netflix**, posisi
`fixed` di pojok kiri-bawah. `pointer-events: none` → tidak pernah
memblokir klik. Di-refresh otomatis setiap **300 ms**.

Contoh tampilan:

```
suppressCount : 1
playing       : false
started       : true
off           : false
audio         : paused
  time        : 6s/18s
track         : My Queen — Tema Utama (Demo)
island        : HIDDEN
float         : HIDDEN
```

---

## 4. Cara membaca setiap baris

| Baris | Nilai | Arti |
|---|---|---|
| `suppressCount` | `0` / `1` / `2` / … | Jumlah suara video yang sedang aktif. **0 = musik bebas**; `≥1` = ada video berbunyi, musik di-pause & indikator disembunyikan. Nilai `≥2` = video bertumpuk (nesting) — normal, bukan bug. |
| `playing` | `true` / `false` | Flag status pemutar: musik sedang "dianggap berputar". Berbeda dari `audio` — bisa `true` walau audio di-pause sementara (mis. sedang di-suppress). |
| `started` | `true` / `false` | Autoplay sudah pernah dipicu (interaksi pertama user). `false` = musik belum pernah dimulai otomatis. |
| `off` | `true` / `false` | State **"Musik Mati"** (tombol ⏻ di panel expanded). `true` = musik sengaja dimatikan; klik pill akan menghidupkan kembali. |
| `audio` | `null` / `paused` / `PLAYING` | Status elemen audio sungguhan. `null` = audio belum pernah dibuat (belum ada interaksi). `PLAYING` = sedang bersuara. |
| `time` | `6s/18s` / `-` | Posisi putar / durasi lagu. `-` = audio belum ada atau durasi belum diketahui. |
| `track` | judul lagu | Lagu yang sedang aktif di playlist. |
| `island` | `visible` / `HIDDEN` | Dynamic Island (pill atas) terlihat atau disembunyikan karena suara video. |
| `float` | `visible` / `HIDDEN` | Tombol pojok kanan-bawah terlihat atau disembunyikan karena suara video. |

> **Cara cepat menilai:** selama suara video aktif, `suppressCount ≥ 1` dan
> `island`/`float` = `HIDDEN`. Saat semua video selesai, `suppressCount = 0`
> dan keduanya `visible` kembali.

---

## 5. Workflow verifikasi yang didukung

### 5.1 Skenario dasar (satu video)
```
1. Buka movies.html?debug
2. Klik tombol musik pojok (kanan-bawah)   → playing: true, audio: PLAYING
3. Klik thumbnail video                    → suppressCount: 1, island: HIDDEN, float: HIDDEN
4. Tutup modal (Esc / × / Tutup)           → suppressCount: 0, island: visible, musik lanjut
```

### 5.2 Skenario bertumpuk (nesting — dua video)
```
1. Buka video1            → suppressCount: 1
2. Buka video2 (tanpa tutup video1) → suppressCount: 2
3. Tutup video2           → suppressCount: 1   (island TETAP HIDDEN — benar)
4. Tutup video1           → suppressCount: 0   (musik kembali TEPAT SEKALI)
```

### 5.3 Video selesai alami
```
1. Putar video series sampai habis (atau set currentTime = durasi)
2. Overlay Replay/Tutup muncul  → suppressCount: 0, island: visible (musik kembali)
3. Klik Replay                  → suppressCount: 1, island: HIDDEN (suara video aktif lagi)
```

### 5.4 News: toggle suara
```
1. Buka newsandpopular.html?debug
2. Nyalakan musik → klik tombol "Suara" (unmute)
3. suppressCount: 1, island: HIDDEN
4. Klik "Suara" lagi (mute) → suppressCount: 0, island: visible, musik lanjut
```

**Tanda "suara tumpuk" (bug):** `playing: true` padahal `audio: paused`
dalam waktu lama **tanpa** `suppressCount ≥ 1`, atau dua elemen audio yang
berbunyi bersamaan (seharusnya selalu satu).

---

## 6. Menambah mode debug baru (untuk pengembang)

Semua HUD memakai container bersama `src/js/debug-hud.js` — cukup daftarkan
mode lalu perbarui teksnya. Contoh pola dari `hero-slider.js`:

```js
// 1) Daftarkan HUD (sekali, setelah DOM siap):
if (window.DebugHud) {
    window.DebugHud.register('debugModeHud', 'nama-mode');
}

// 2) Perbarui isinya (dari event / interval / callback):
function updateModeHud() {
    if (!window.DebugHud) return;
    window.DebugHud.update('debugModeHud',
        'state1 : ' + value1 + '\n' +
        'state2 : ' + value2);
}
```

API `window.DebugHud` (di `src/js/debug-hud.js`):

| Metode | Fungsi |
|---|---|
| `isEnabled()` | Apakah mode debug aktif (`?debug`/`?debug=auto` atau hasil toggle) |
| `register(id, label)` | Daftarkan blok HUD untuk satu mode; elemen dibuat sekali, dimasukkan ke container saat aktif |
| `update(id, text)` | Set teks HUD (no-op jika nonaktif) |
| `setEnabled(on)` | Toggle SEMUA HUD + container (dipanggil dari klik 3x tombol musik) |

Aturan:
- `debug-hud.js` **wajib dimuat sebelum** file mode yang memakainya (sudah
dilakukan di semua halaman — include pertama di `<head>`).
- **`pointer-events: none`** di container — HUD tidak pernah memblokir klik.
- **`z-index` 20000** agar selalu di atas elemen lain.
- Tanpa `?debug` dan tanpa toggle, container tidak dirender (0 biaya runtime).
- Untuk mode yang perlu refresh berkala, ikuti pola `music-player.js`:
  interval 300 ms hanya berjalan saat `DebugHud.isEnabled()` (dijaga
  `syncHudTimer()`), bukan selalu.
- `aria-hidden="true"` di container karena HUD hanya untuk pengembang.

---

## 7. Referensi

```
src/js/music-player.js   ← implementasi HUD (?debug) + API MusicPlayer
docs/SOUND-GUIDE.md      ← cara kerja suppression suara & skenario video vs musik
docs/MUSIC-GUIDE.md      ← cara menambah lagu ke playlist
```

Detail arsitektur suppression (`suppressCount`, `pauseForVideo`/
`resumeFromVideo`) ada di `docs/SOUND-GUIDE.md`.
