/* ==========================================================================
   music-data.js — Daftar lagu untuk Dynamic Island music player
   --------------------------------------------------------------------------
   CARA MENAMBAHKAN MUSIK:
     1. Taruh file lagu (mp3/ogg/m4a) di folder  src/audio/
     2. Tambah satu object di bawah ini:
        { title: "Judul Lagu", src: "src/audio/NAMA_FILE.mp3" }
     3. Simpan — player otomatis memakai lagu baru di semua halaman.
        (Tidak perlu edit HTML sama sekali.)

   Catatan: lagu di bawah ini diambil dari Update/Music (judul sesuai file
   aslinya). Selama array kosong, player tidak tampil.
   ========================================================================== */

window.MUSIC_PLAYLIST = [
    { title: "Aku Yang Jatuh Cinta - Dudy Oris", src: "src/audio/aku-yang-jatuh-cinta.mp3" },
    { title: "Jangan Paksa Rindu X Yang Telah Merelakanmu", src: "src/audio/jangan-paksa-rindu.mp3" },
    { title: "Sesi Potret - Enau", src: "src/audio/sesi-potret.mp3" },
];
