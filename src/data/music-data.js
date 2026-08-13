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
    { title: "Sesi Potret - Enau ft. Ari Lesmana", src: "src/audio/sesi-potret.mp3" },
    { title: "Karena Kamu - Geisha", src: "src/audio/karena-kamu.mp3" },
    { title: "Dia Masa Lalumu, Aku Masa Depanmu - Vionita Sihombing", src: "src/audio/dia-masa-lalumu-aku-masa-depanmu.mp3" },
    { title: "Surat Cinta Untuk Starla - Virgoun", src: "src/audio/surat-cinta-untuk-starla.mp3"},
    { title: "Selamat Tinggal - Virgoun Ft. Audy", src: "src/audio/selamat-tinggal.mp3"},
    { title: "Akhir Tak Bahagia - Misellia Ikhwan", src: "src/audio/akhir-tak-bahagia.mp3"},
    { title: "Masa Ini, Nanti, Masa Indah Lainnya - Raja Giannuca", src: "src/audio/masa-ini-nanti-masa-indah-lainnya.mp3"},
    { title: "Perayaan Mati Rasa - Umay Shahab Ft. Natania Karin", src: "src/audio/perayaan-mati-rasa.mp3"},
    { title: "Untuk Mencintaimu - Seventeen", src: "src/audio/untuk-mencintaimu.mp3"},
    { title: "Bernaung - Feby Putri", src: "src/audio/bernaung.mp3"},
    { title: "Everything U Are - Hindia", src: "src/audio/everything-u-are.mp3" },
    { title: "Tanpa Pesan X Jaga Selalu Hatimu X Yang Telah Merelakanmu", src: "src/audio/tanpa-pesan-jaga-selalu-hatimu-yang-telah-merelakanmu.mp3"},
    { title: "Surat Cinta Untuk Starla x Bahagia Lagi - Virgoun", src: "src/audio/surat-cinta-untuk-starla-bahagia-lagi.mp3"},
    { title: "Selamat Tinggal x Duka x Seluruh Nafas Ini x Serana", src: "src/audio/selamat-tinggal-duka-seluruh-nafas-ini-serana.mp3"},
    { title: "Jangan Paksa Rindu x Yang Telah Merelakanmu x Jaga Selalu Hatimu", src: "src/audio/jangan-paksa-rindu-yang-telah-merelakanmu-jaga-selalu-hatimu.mp3"},
    { title: "A Thousand Years x Bahagia Lagi x Surat Cinta Untuk Starla", src: "src/audio/a-thousand-years-bahagia-lagi-surat-cinta-untuk-starla.mp3"},
];
