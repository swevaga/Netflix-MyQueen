/* ==========================================================================
   hero-slider.js — Billboard rotasi ala Netflix
   --------------------------------------------------------------------------
   Cara pakai (mode default — news & mylist):
     <div id="heroSlider"></div>
     <script>
         window.HERO_SLIDES = [
             { img: "path/a.png", imgMobile: "path/a.png", title: "...", desc: "..." },
             ...
         ];
     </script>
     <script src="src/js/hero-slider.js"></script>

   Mode kustom (index.html — markup sudah ada di HTML, punya tombol Play /
   More Info + grid crossfade; slider hanya menggerakkan elemennya):
     <script>
         window.HERO_SLIDES = [ ... ];
         window.HERO_OPTIONS = { customContent: true };
     </script>
   Elemen yang digerakkan: #heroImg, #heroTitle, #heroDesc.
   ========================================================================== */

(function () {
    // SLIDES dibaca LAZY di dalam init(): script ini dimuat di <head> SEBELUM
    // skrip inline window.HERO_SLIDES di halaman, jadi window.HERO_SLIDES belum
    // ada saat file ini dieksekusi pertama kali.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
    var SLIDES = window.HERO_SLIDES || [];
    if (!SLIDES.length) return;

    var opts = window.HERO_OPTIONS || {};
    var custom = opts.customContent === true;

    if (!custom) {
        // Mode default: bangun markup sendiri di dalam #heroSlider.
        var root = document.getElementById('heroSlider');
        if (!root) return;
        root.innerHTML =
            '<div id="heroSliderImgWrap" class="absolute inset-0 overflow-hidden">' +
                '<img id="heroSliderImg" alt="" class="w-full h-full object-cover object-center transition-opacity duration-700">' +
            '</div>' +
            '<div class="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none"></div>' +
            '<div class="absolute inset-0 flex flex-col justify-center items-start px-4 md:px-12 pb-16">' +
                '<div class="max-w-xl">' +
                    '<span class="inline-block bg-red-600 text-white text-xs font-bold uppercase tracking-widest px-2 py-1 rounded mb-3">My Queen</span>' +
                    '<h2 id="heroSliderTitle" class="text-2xl md:text-4xl font-bold mb-3"></h2>' +
                    '<p id="heroSliderDesc" class="text-sm md:text-base text-gray-200 mb-0 max-w-lg"></p>' +
                '</div>' +
            '</div>';
    }

    // Mode kustom: elemen id-nya beda (#heroImg/#heroTitle/#heroDesc).
    var img = document.getElementById(custom ? 'heroImg' : 'heroSliderImg');
    var title = document.getElementById(custom ? 'heroTitle' : 'heroSliderTitle');
    var desc = document.getElementById(custom ? 'heroDesc' : 'heroSliderDesc');
    if (!img || !title || !desc) return;

    var index = 0;

    function currentTarget(i) {
        var s = SLIDES[i % SLIDES.length];
        return window.innerWidth <= 768 && s.imgMobile ? s.imgMobile : s.img;
    }

    function show(i, instant) {
        var s = SLIDES[i % SLIDES.length];
        var target = currentTarget(i);
        var abs = new URL(target, window.location.href).href;
        if (img.src !== abs) {
            if (instant) {
                img.src = target;
                img.style.opacity = '1';
            } else {
                img.style.opacity = '0';
                setTimeout(function () {
                    img.src = target;
                    img.onload = function () { img.style.opacity = '1'; };
                    img.onerror = function () { img.style.opacity = '1'; };
                }, 700);
            }
        }
        title.textContent = s.title || '';
        desc.textContent = s.desc || '';
        updateHeroHud();
    }

    // HUD debug (?debug): slide aktif + mode slider.
    function updateHeroHud() {
        if (!window.DebugHud) return;
        var s = SLIDES[index % SLIDES.length];
        window.DebugHud.update('debugHeroHud',
            'hero-slider    : ' + (custom ? 'custom (index)' : 'default (news/mylist)') + '\n' +
            'slide aktif     : ' + ((index % SLIDES.length) + 1) + '/' + SLIDES.length + '\n' +
            'judul           : ' + (s && s.title ? s.title : '-') + '\n' +
            'reduced-motion  : ' + reduced);
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (window.DebugHud) {
        window.DebugHud.register('debugHeroHud', 'hero');
        updateHeroHud();
    }

    show(0, true);
    if (!reduced) {
        setInterval(function () {
            index = (index + 1) % SLIDES.length;
            show(index, false);
        }, 7000);
        window.addEventListener('resize', function () { show(index, true); });
    }
    } // end init
})();
