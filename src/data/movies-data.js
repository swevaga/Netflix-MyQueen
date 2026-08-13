/* ==========================================================================
   movies-data.js — Daftar video Halaman Movies (data-driven, TANPA edit HTML)
   --------------------------------------------------------------------------
   CARA UPDATE (cukup lakukan ini, tanpa menyentuh movies.html):

     1. Taruh file video MP4 di  src/videos/moviespage/
        dan (opsional) thumbnail di  src/images/photo/
     2. Tambah/ubah satu object di daftar MOVIES_ITEMS di bawah ini:

        {
            id: 60,                          // (OPSIONAL) nomor urut, otomatis
            title: "Judul Video",            // (OPSIONAL) judul, tampil di modal
            video: "src/videos/moviespage/video60.mp4",
            thumbnail: "src/images/photo/placeholder9_16_91.png",
            countdown: 5                     // (OPSIONAL) durasi countdown; default 5
        }

     3. Simpan — grid & modal movies.html otomatis memakai video baru.

   Admin panel (admin.html) mengubah file ini melalui GitHub API tanpa
   perlu edit kode sama sekali. Jangan ubah nama variabel window.MOVIES_ITEMS.
   ========================================================================== */

window.MOVIES_ITEMS = [
    { id: 1, title: "Video 1", video: "src/videos/moviespage/video1.mp4", thumbnail: "src/images/photo/placeholder9_16_7.png", countdown: 5 },
    { id: 2, title: "Video 2", video: "src/videos/moviespage/video2.mp4", thumbnail: "src/images/photo/placeholder9_16_5.png", countdown: 5 },
    { id: 3, title: "Video 3", video: "src/videos/moviespage/video3.mp4", thumbnail: "src/images/photo/placeholder9_16_4.png", countdown: 5 },
    { id: 4, title: "Video 4", video: "src/videos/moviespage/video4.mp4", thumbnail: "src/images/photo/placeholder9_16_3.png", countdown: 5 },
    { id: 5, title: "Video 5", video: "src/videos/moviespage/video5.mp4", thumbnail: "src/images/photo/placeholder3_4_1.png", countdown: 5 },
    { id: 6, title: "Video 6", video: "src/videos/moviespage/video6.mp4", thumbnail: "src/images/photo/placeholder9_16_33.png", countdown: 5 },
    { id: 7, title: "Video 7", video: "src/videos/moviespage/video7.mp4", thumbnail: "src/images/photo/placeholder9_16_55.png", countdown: 5 },
    { id: 8, title: "Video 8", video: "src/videos/moviespage/video8.mp4", thumbnail: "src/images/photo/placeholder9_16_8.png", countdown: 5 },
    { id: 9, title: "Video 9", video: "src/videos/moviespage/video9.mp4", thumbnail: "src/images/photo/placeholder3_4_2.png", countdown: 5 },
    { id: 10, title: "Video 10", video: "src/videos/moviespage/video10.mp4", thumbnail: "src/images/photo/placeholder9_16_27.png", countdown: 5 },
    { id: 11, title: "Video 11", video: "src/videos/moviespage/video11.mp4", thumbnail: "src/images/photo/placeholder9_16_6.png", countdown: 5 },
    { id: 12, title: "Video 12", video: "src/videos/moviespage/video12.mp4", thumbnail: "src/images/photo/placeholder9_16_12.png", countdown: 5 },
    { id: 13, title: "Video 13", video: "src/videos/moviespage/video13.mp4", thumbnail: "src/images/photo/placeholder9_16_11.png", countdown: 5 },
    { id: 14, title: "Video 14", video: "src/videos/moviespage/video14.mp4", thumbnail: "src/images/photo/placeholder9_16_19.png", countdown: 5 },
    { id: 15, title: "Video 15", video: "src/videos/moviespage/video15.mp4", thumbnail: "src/images/photo/placeholder9_16_13.png", countdown: 5 },
    { id: 16, title: "Video 16", video: "src/videos/moviespage/video16.mp4", thumbnail: "src/images/photo/placeholder9_16_14.png", countdown: 5 },
    { id: 17, title: "Video 17", video: "src/videos/moviespage/video17.mp4", thumbnail: "src/images/photo/placeholder9_16_22.png", countdown: 5 },
    { id: 18, title: "Video 18", video: "src/videos/moviespage/video18.mp4", thumbnail: "src/images/photo/placeholder9_16_9.png", countdown: 5 },
    { id: 19, title: "Video 19", video: "src/videos/moviespage/video19.mp4", thumbnail: "src/images/photo/placeholder9_16_15.png", countdown: 5 },
    { id: 20, title: "Video 20", video: "src/videos/moviespage/video20.mp4", thumbnail: "src/images/photo/placeholder9_16_18.png", countdown: 5 },
    { id: 21, title: "Video 21", video: "src/videos/moviespage/video21.mp4", thumbnail: "src/images/photo/placeholder9_16_17.png", countdown: 5 },
    { id: 22, title: "Video 22", video: "src/videos/moviespage/video22.mp4", thumbnail: "src/images/photo/placeholder9_16_23.png", countdown: 5 },
    { id: 23, title: "Video 23", video: "src/videos/moviespage/video23.mp4", thumbnail: "src/images/photo/placeholder9_16_20.png", countdown: 5 },
    { id: 24, title: "Video 24", video: "src/videos/moviespage/video24.mp4", thumbnail: "src/images/photo/placeholder9_16_16.png", countdown: 5 },
    { id: 25, title: "Video 25", video: "src/videos/moviespage/video25.mp4", thumbnail: "src/images/photo/placeholder9_16_28.png", countdown: 5 },
    { id: 26, title: "Video 26", video: "src/videos/moviespage/video26.mp4", thumbnail: "src/images/photo/placeholder9_16_58.jpg", countdown: 5 },
    { id: 27, title: "Video 27", video: "src/videos/moviespage/video27.mp4", thumbnail: "src/images/photo/placeholder9_16_59.jpg", countdown: 5 },
    { id: 28, title: "Video 28", video: "src/videos/moviespage/video28.mp4", thumbnail: "src/images/photo/placeholder9_16_60.jpg", countdown: 5 },
    { id: 29, title: "Video 29", video: "src/videos/moviespage/video29.mp4", thumbnail: "src/images/photo/placeholder9_16_61.jpg", countdown: 5 },
    { id: 30, title: "Video 30", video: "src/videos/moviespage/video30.mp4", thumbnail: "src/images/photo/placeholder9_16_62.jpg", countdown: 5 },
    { id: 31, title: "Video 31", video: "src/videos/moviespage/video31.mp4", thumbnail: "src/images/photo/placeholder9_16_63.jpg", countdown: 5 },
    { id: 32, title: "Video 32", video: "src/videos/moviespage/video32.mp4", thumbnail: "src/images/photo/placeholder9_16_64.jpg", countdown: 5 },
    { id: 33, title: "Video 33", video: "src/videos/moviespage/video33.mp4", thumbnail: "src/images/photo/placeholder9_16_65.jpg", countdown: 5 },
    { id: 34, title: "Video 34", video: "src/videos/moviespage/video34.mp4", thumbnail: "src/images/photo/placeholder9_16_66.jpg", countdown: 5 },
    { id: 35, title: "Video 35", video: "src/videos/moviespage/video35.mp4", thumbnail: "src/images/photo/placeholder9_16_67.jpg", countdown: 5 },
    { id: 36, title: "Video 36", video: "src/videos/moviespage/video36.mp4", thumbnail: "src/images/photo/placeholder9_16_68.jpg", countdown: 5 },
    { id: 37, title: "Video 37", video: "src/videos/moviespage/video37.mp4", thumbnail: "src/images/photo/placeholder9_16_69.jpg", countdown: 5 },
    { id: 38, title: "Video 38", video: "src/videos/moviespage/video38.mp4", thumbnail: "src/images/photo/placeholder9_16_70.jpg", countdown: 5 },
    { id: 39, title: "Video 39", video: "src/videos/moviespage/video39.mp4", thumbnail: "src/images/photo/placeholder9_16_71.jpg", countdown: 5 },
    { id: 40, title: "Video 40", video: "src/videos/moviespage/video40.mp4", thumbnail: "src/images/photo/placeholder9_16_72.jpg", countdown: 5 },
    { id: 41, title: "Video 41", video: "src/videos/moviespage/video41.mp4", thumbnail: "src/images/photo/placeholder9_16_73.jpg", countdown: 5 },
    { id: 42, title: "Video 42", video: "src/videos/moviespage/video42.mp4", thumbnail: "src/images/photo/placeholder9_16_74.jpg", countdown: 5 },
    { id: 43, title: "Video 43", video: "src/videos/moviespage/video43.mp4", thumbnail: "src/images/photo/placeholder9_16_75.jpg", countdown: 5 },
    { id: 44, title: "Video 44", video: "src/videos/moviespage/video44.mp4", thumbnail: "src/images/photo/placeholder9_16_76.jpg", countdown: 5 },
    { id: 45, title: "Video 45", video: "src/videos/moviespage/video45.mp4", thumbnail: "src/images/photo/placeholder9_16_77.jpg", countdown: 5 },
    { id: 46, title: "Video 46", video: "src/videos/moviespage/video46.mp4", thumbnail: "src/images/photo/placeholder9_16_61.jpg", countdown: 5 },
    { id: 47, title: "Video 47", video: "src/videos/moviespage/video47.mp4", thumbnail: "src/images/photo/placeholder9_16_78.jpg", countdown: 5 },
    { id: 48, title: "Video 48", video: "src/videos/moviespage/video48.mp4", thumbnail: "src/images/photo/placeholder9_16_79.jpg", countdown: 5 },
    { id: 49, title: "Video 49", video: "src/videos/moviespage/video49.mp4", thumbnail: "src/images/photo/placeholder9_16_80.jpg", countdown: 5 },
    { id: 50, title: "Video 50", video: "src/videos/moviespage/video50.mp4", thumbnail: "src/images/photo/placeholder9_16_81.jpg", countdown: 5 },
    { id: 51, title: "Video 51", video: "src/videos/moviespage/video51.mp4", thumbnail: "src/images/photo/placeholder9_16_82.jpg", countdown: 5 },
    { id: 52, title: "Video 52", video: "src/videos/moviespage/video52.mp4", thumbnail: "src/images/photo/placeholder9_16_83.jpg", countdown: 5 },
    { id: 53, title: "Video 53", video: "src/videos/moviespage/video53.mp4", thumbnail: "src/images/photo/placeholder9_16_84.jpg", countdown: 5 },
    { id: 54, title: "Video 54", video: "src/videos/moviespage/video54.mp4", thumbnail: "src/images/photo/placeholder9_16_85.jpg", countdown: 5 },
    { id: 55, title: "Video 55", video: "src/videos/moviespage/video55.mp4", thumbnail: "src/images/photo/placeholder9_16_86.jpg", countdown: 5 },
    { id: 56, title: "Video 56", video: "src/videos/moviespage/video56.mp4", thumbnail: "src/images/photo/placeholder9_16_87.jpg", countdown: 5 },
    { id: 57, title: "Video 57", video: "src/videos/moviespage/video57.mp4", thumbnail: "src/images/photo/placeholder9_16_88.jpg", countdown: 5 },
    { id: 58, title: "Video 58", video: "src/videos/moviespage/video58.mp4", thumbnail: "src/images/photo/placeholder9_16_89.jpg", countdown: 5 },
    { id: 59, title: "Video 59", video: "src/videos/moviespage/video59.mp4", thumbnail: "src/images/photo/placeholder9_16_90.jpg", countdown: 5 }
];
