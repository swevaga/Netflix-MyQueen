/* ==========================================================================
   scroll-reveal.js — Reveal-on-scroll untuk semua elemen .scroll-animate
   Menggantikan fungsi handleScrollAnimation() yang terduplikasi di 4 halaman.
   - Pakai IntersectionObserver (lebih ringan daripada listener scroll).
   - Fallback browser lama: semua konten langsung terlihat.
   - Menghormati prefers-reduced-motion (CSS common.css menonaktifkan transisi).
   ========================================================================== */
(function () {
    function init() {
        var els = document.querySelectorAll('.scroll-animate');
        var ioSupport = 'IntersectionObserver' in window;
        var page = (location.pathname.split('/').pop() || 'index.html') + location.search;
        var lastRevealed = '-';

        // HUD debug (?debug): status IntersectionObserver + reveal.
        function updateRevealHud() {
            if (!window.DebugHud) return;
            var done = 0;
            els.forEach(function (el) { if (el.classList.contains('visible')) done++; });
            window.DebugHud.update('debugScrollHud',
                'scroll-reveal   : ' + page + '\n' +
                'IntersectionObs : ' + ioSupport + '\n' +
                'elemen diamati  : ' + els.length + '\n' +
                'ter-reveal      : ' + done + '/' + els.length + '\n' +
                'terakhir        : ' + lastRevealed);
        }
        if (window.DebugHud) {
            window.DebugHud.register('debugScrollHud', 'scroll-reveal');
            updateRevealHud();
        }

        if (!els.length) return;
        if (ioSupport) {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        io.unobserve(entry.target);
                        lastRevealed = entry.target.id || entry.target.className || '-';
                        updateRevealHud();
                    }
                });
            }, { threshold: 0.1 });
            els.forEach(function (el) { io.observe(el); });
        } else {
            els.forEach(function (el) { el.classList.add('visible'); });
            lastRevealed = 'fallback (semua)';
            updateRevealHud();
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
