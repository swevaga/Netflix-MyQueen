/* ==========================================================================
   site-text-data.js — Semua "kata-kata" situs
   --------------------------------------------------------------------------
   DIKELOLA LANGSUNG DI KODE ini (bukan dari admin.html). Teks yang diatur di
   sini (tanpa edit HTML):
     - Notifikasi & teks pencarian di navbar (semua halaman)
     - Hero (judul + deskripsi) halaman utama index.html
     - Modal "More Info" di index.html
     - Judul modal Play di index.html
     - Halaman play.html (judul + paragraf)
     - Hero (judul + deskripsi) newsandpopular.html & mylist.html

   Aturan: halaman memakai nilai dari file ini; bila field kosong, halaman
   memakai teks bawaan (fallback) yang ada di HTML-nya.
   ========================================================================== */

window.SITE_TEXT = {

    /* ===== Navbar: teks pencarian + notifikasi (semua halaman) ===== */
    searchNotification: "Gada Siapa Siapa Kecuali Aku ~R",

    notifications: [
        "Semakin Hari Semakin Cantik Sih Kamu",
        "Aku Cemburu Kamu Post Foto Nanti Ada Yang Suka Kamu",
        "I Love You Hehe >3"
    ],

    /* ===== Halaman Utama (index.html) ===== */
    index: {
        heroTitle: "Bagaimana Caranya Memilikimu Secara Sempurna? Aku Sudah Capek Menjadi Pengagummu.",
        heroDesc: "Beginilah Cara Rouf, Seseorang Yang Mungkin Tak Pernah Kamu Sadari, Mengungkapkan Kekagumannya Dari kejauhan, Aku Telah Melihat Cahayamu Bersinar, Berharap Suatu Hari Nanti Kamu Akan Menyadarinya. Tapi untuk saat ini, Beginilah Cara Rouf Mengungkapkan Perasaan Yang Sebenarnya. I Love You >3",
        moreInfoTitle: "Tentang Dia",
        moreInfoParagraphs: [
            "Dia adalah sosok yang penuh keajaiban, seorang wanita yang mampu mengubah hari-hariku menjadi berwarna hanya dengan satu senyum. Setiap detail tentangnya adalah keindahan yang tak tergantikan.",
            "Kecantikannya bukan hanya dari luar, tetapi juga dari dalam hatinya yang lembut dan penuh kasih. Dia memiliki aura yang membuat setiap orang di sekitarnya merasa nyaman dan istimewa.",
            "Matanya memancarkan cahaya kebijaksanaan, senyumnya menenangkan jiwa, dan kehadirannya selalu menjadi alasan untukku bersyukur setiap hari. Dia adalah definisi sempurna dari sebuah keindahan yang sesungguhan.",
            "I Love You More Than Words Can Say ❤️"
        ],
        playTitle: "I Love You >3"
    },

    /* ===== Halaman Play (play.html) ===== */
    play: {
        title: "I Love You >3",
        paragraphs: [
            "Hai, kamu...",
            "Mungkin kamu tidak mengenalku, atau mungkin juga tak pernah menyadari kehadiranku. Tapi dari kejauhan, aku telah mengagumi caramu berjalan dalam hidup, energimu yang tak pernah padam, dan bagaimana sinarmu menerangi banyak orang.",
            "Aku tidak ingin lagi hanya menjadi seseorang yang mengagumi dari jauh. Hari ini, di momen spesial ini, aku ingin mengatakan sesuatu yang sudah lama ada di hati—Aku suka kamu. Lebih dari sekadar kekaguman, lebih dari sekadar kata-kata. Aku ingin jadi bagian dari perjalananmu. Mau nggak, kamu jadi milikku?",
            "Dan satu hal lagi… aku tak ingin orang lain tahu tentang hubungan kita. Bukan karena alasan buruk, bukan karena aku ragu, tapi karena aku ingin ini hanya tentang kita—tanpa gangguan, tanpa tekanan, hanya aku dan kamu.",
            "✨ Dengan seluruh keberanian yang akhirnya terkumpul,",
            "Rouf."
        ]
    },

    /* ===== Hero News & Popular (newsandpopular.html) ===== */
    news: {
        heroTitle: "News & Popular",
        heroDesc: "Kisah Rouf untuk Nurul — dari mengagumi dari jauh, hingga berani mengungkapkan perasaan yang selama ini dipendam."
    },

    /* ===== Hero My List (mylist.html) ===== */
    mylist: {
        heroTitle: "My List",
        heroDesc: "Kumpulan orang-orang spesial yang selalu mengisi hari-hariku dengan tawa dan kehangatan."
    }
};
