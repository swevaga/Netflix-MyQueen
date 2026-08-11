/* ==========================================================================
   news-data.js — Konten News & Popular (data-driven, TANPA edit HTML)
   --------------------------------------------------------------------------
   CARA UPDATE (cukup lakukan ini, tanpa menyentuh newsandpopular.html):

     1. Tambah/ubah satu object di daftar NEWS_ITEMS di bawah.

        {                               // item LENGKAP (dengan video):
            date: "2026-08-11",         //   tanggal PUBLISH manual (batas tampil)
            title: "Judul Postingan",
            video: "src/videos/newsandpopularpage/NAMA_VIDEO.mp4",
            countdown: 5,               //   (OPSIONAL) durasi countdown auto-replay; default 5
            paragraphs: [ "paragraf 1", "paragraf 2", ... ]
        }

        {                               // item TEKS SAJA (TANPA video):
            date: "2026-08-10",         //   hapus baris "video" → cukup kata-kata
            title: "Judul Postingan",
            paragraphs: [ "paragraf 1", "paragraf 2", ... ]
        }

     2. Simpan. Halaman otomatis menampilkan item yang tanggalnya SUDAH LEWAT
        (date <= hari ini). Item ber-tanggal masa depan disembunyikan sampai
        tanggalnya tiba. Item terbaru tampil paling atas.

   Video OPSIONAL: kalau hanya ingin menambah kata-kata/cerita, cukup isi
   date + title + paragraphs tanpa field "video" — tidak perlu upload video.
   ========================================================================== */

window.NEWS_ITEMS = [
    {
        date: "2026-08-11",
        title: "Kisahku, Untukmu",
        video: "src/videos/newsandpopularpage/news_video.mp4",
        paragraphs: [
            "Hari pertama masuk MA, aku melihatnya—Nurul. Gadis yang tidak terlalu mencolok, tapi entah kenapa, ada sesuatu dalam dirinya yang membuatku terus memperhatikannya. Aku tidak tahu kenapa, tapi sejak hari itu, aku mulai mengamatinya dari jauh, tanpa pernah benar-benar berani mendekat.",
            "Tahun pertama berlalu dengan cepat. Aku hanya bisa melihatnya tertawa bersama teman-temannya, mengerjakan tugas dengan serius, atau sesekali termenung di bangku sekolah. Aku ingin menyapanya, tapi entah kenapa, keberanian itu tidak pernah muncul.",
            "Tahun kedua, aku mulai lebih mengenalnya, meskipun masih dari kejauhan. Aku tahu, aku semakin jatuh hati. Tapi tetap saja, aku hanya diam.",
            "Tahun ketiga datang, dan aku sadar waktu kami di sekolah ini hampir habis. Aku mulai bertanya pada diri sendiri: Sampai kapan aku hanya akan menjadi penonton? Aku takut, jika aku tidak melakukan sesuatu sekarang, maka selamanya aku hanya akan menyesal.",
            "Hari itu, di masa liburan sekolah, aku akhirnya membuat sebuah website dan mengirimkan link tersebut menggunakan second account.",
            "\"Hai, Nurul.\"",
            "Mungkin kamu tidak pernah menyadari kehadiranku, tapi aku selalu melihatmu. Aku mengagumimu sejak lama, menikmati setiap senyuman dan caramu menjalani hari. Aku tidak meminta jawaban atau balasan, aku hanya ingin kamu tahu bahwa ada seseorang yang selama ini diam-diam menyayangimu.\"",
            "Aku melihatnya dia membuka website itu. Aku tidak tahu apakah ia tahu itu dariku, tapi saat itu aku tersenyum. Setidaknya, sebelum masa sekolah ini berakhir, aku telah mengungkapkan perasaanku.",
            "Dan bagiku, itu sudah cukup."
        ]
    },
    {
        date: "2026-08-10",
        title: "Terima Kasih Sudah Hadir",
        paragraphs: [
            "Hari-hari terasa lebih ringan sejak kamu ada. Terima kasih sudah menjadi alasan senyum yang tidak pernah kupahami sebelumnya.",
            "Aku tidak tahu bagaimana caranya berterima kasih, jadi kutulis di sini. Semoga suatu hari kamu membacanya dan tahu betapa berartinya kamu.",
            "I Love You More Than Words Can Say ❤️"
        ]
    },
    {
        date: "2026-08-09",
        title: "Catatan Kecil",
        paragraphs: [
            "Contoh update TANPA video: cukup tulis kata-kata, simpan file ini, dan halaman langsung berubah.",
            "Tidak perlu pusing mengunggah video kalau hanya ingin menambah cerita."
        ]
    }
];
