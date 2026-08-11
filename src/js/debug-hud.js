/* ==========================================================================
   debug-hud.js — Container HUD debug bersama untuk semua mode (?debug)
   --------------------------------------------------------------------------
   Mode yang terdaftar: music player, hero slider, scroll-reveal.
   - Aktif via ?debug / ?debug=auto di URL, atau toggle runtime (klik tombol
     musik pojok 3x cepat di music-player.js → DebugHud.setEnabled).
   - Semua HUD berada dalam SATU container fixed di pojok kiri-bawah sehingga
     otomatis tersusun rapi tanpa tumpang tindih (flex column).
   - pointer-events:none → tidak pernah memblokir klik.
   - Tanpa ?debug dan tanpa toggle: container tidak dirender (0 biaya).
   ========================================================================== */
(function () {
    var enabled = /[?&]debug\b/.test(location.search); // ?debug atau ?debug=auto
    var container = null;
    var huds = {};

    function ensureContainer() {
        if (container) return container;
        container = document.createElement('div');
        container.id = 'debugHudContainer';
        container.setAttribute('aria-hidden', 'true');
        container.title = 'HUD debug: klik ikon musik 3x untuk sembunyikan/tampilkan';
        container.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:20000;pointer-events:none;' +
            'display:flex;flex-direction:column;align-items:flex-start;gap:6px;' +
            'max-width:min(340px, calc(100vw - 20px));';
        document.body.appendChild(container);
        return container;
    }

    window.DebugHud = {
        isEnabled: function () { return enabled; },

        // Daftarkan HUD untuk satu mode. Elemen dibuat sekali dan disimpan;
        // hanya dimasukkan ke container saat enabled (langsung atau setelah toggle).
        register: function (id, label) {
            var hud = document.createElement('div');
            hud.id = id;
            hud.setAttribute('aria-hidden', 'true');
            hud.style.cssText = 'background:rgba(0,0,0,0.88);border:1px solid #e50914;border-radius:6px;' +
                'color:#7CFC00;font:11px/1.55 monospace;padding:6px 10px;white-space:pre;max-width:100%;';
            hud.textContent = label + ': memuat…';
            huds[id] = hud;
            if (enabled) ensureContainer().appendChild(hud);
            return hud;
        },

        // Perbarui teks HUD. No-op bila HUD belum terdaftar / sedang nonaktif.
        update: function (id, text) {
            var hud = huds[id];
            if (hud) hud.textContent = text;
        },

        // Toggle semua HUD debug (dipanggil dari gesture toggle runtime).
        setEnabled: function (on) {
            enabled = on;
            var c = ensureContainer();
            if (on) {
                for (var k in huds) {
                    if (huds[k].parentNode !== c) c.appendChild(huds[k]);
                }
            } else {
                for (var k in huds) {
                    if (huds[k].parentNode) huds[k].parentNode.removeChild(huds[k]);
                }
                if (c.parentNode) c.parentNode.removeChild(c);
                container = null;
            }
        }
    };
})();
