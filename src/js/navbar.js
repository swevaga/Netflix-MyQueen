/* ==========================================================================
   navbar.js — Shared navbar behavior (Netflix clone)
   Dipakai oleh index.html, series.html, movies.html, newsandpopular.html, mylist.html
   - Semua menu (search, notification, profile, mobile) bersifat EXCLUSIVE:
     membuka satu otomatis menutup yang lain (agar tidak menimpa).
   - State tampil memakai class "show" (bukan style.display) supaya animasi
     CSS masuk (transition opacity/transform) bekerja.
   - aria-expanded disinkronkan agar screen reader akurat.
   ========================================================================== */

/* Sinkronkan posisi Dynamic Island: saat salah satu menu navbar terbuka,
   island TURUN ke bawah sedikit (CSS body.navbar-menu-open) agar tidak
   menutupi panel Profile/Notification/Search/menu mobile. */
function updateIslandShift() {
    var anyOpen = document.querySelectorAll('.dropdown-content.show, .notification.show, #mobileMenu.show').length > 0;
    document.body.classList.toggle('navbar-menu-open', anyOpen);
}

/* Tutup SEMUA menu: dropdown (profile), notification, search, mobile menu. */
function closeAllMenus() {
    var menus = document.querySelectorAll('.dropdown-content.show, .notification.show, #mobileMenu.show');
    for (var i = 0; i < menus.length; i++) {
        menus[i].classList.remove('show');
    }
    // Sinkronkan aria-expanded khusus tombol dropdown profile (jangan sentuh
    // tombol lain yang punya aria-expanded, mis. tombol music player).
    var buttons = document.querySelectorAll('.dropdown button[aria-haspopup="true"]');
    for (var j = 0; j < buttons.length; j++) {
        buttons[j].setAttribute('aria-expanded', 'false');
    }
    updateIslandShift();
}

/* Helper: tutup semua, lalu toggle menu target. Mengembalikan state baru (true = terbuka). */
function toggleExclusiveMenu(menuId) {
    var menu = document.getElementById(menuId);
    if (!menu) return false;
    var willOpen = !menu.classList.contains('show');
    if (willOpen) {
        closeAllMenus();
        menu.classList.add('show');
    } else {
        menu.classList.remove('show');
    }
    updateIslandShift();
    return willOpen;
}

/* ---- Tombol-tombol navbar ---- */

function toggleDropdown() {
    var isOpen = toggleExclusiveMenu('dropdownMenu');
    var button = document.querySelector('.dropdown button[aria-haspopup="true"]');
    if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function toggleNotification() {
    toggleExclusiveMenu('notificationMenu');
}

function toggleSearchNotification() {
    toggleExclusiveMenu('searchNotification');
}

function toggleMobileMenu() {
    toggleExclusiveMenu('mobileMenu');
}

/* ---- Klik di luar menutup semua menu ----
   Klik pada tombol toggle (class "nav-toggle") TIDAK menutup (handler
   toggle-nya yang membuka). Klik di dalam panel menu pada LINK (mis.
   "Accounts") menutup menu. Semua klik lain (thumbnail, tombol Play,
   area kosong) juga menutup semua menu agar tidak ada panel yang
   menimpa konten/modal. */
document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var inMenu = target.closest('.dropdown-content, .notification');
    var onToggle = target.closest('button.nav-toggle');
    var onMenuLink = inMenu && target.closest('a[href]');
    if (onMenuLink || (!inMenu && !onToggle)) {
        closeAllMenus();
    }
});

/* ---- Teks navbar dari src/data/site-text-data.js (dikelola admin.html) ----
   Memperbarui isi panel pencarian & notifikasi di semua halaman dari
   window.SITE_TEXT bila tersedia (fallback: teks bawaan di HTML). */
function applySiteText() {
    if (!window.SITE_TEXT) return;
    var search = document.getElementById('searchNotification');
    if (search) {
        var p = search.querySelector('p');
        if (p && window.SITE_TEXT.searchNotification) {
            p.textContent = window.SITE_TEXT.searchNotification;
        }
    }
    var menu = document.getElementById('notificationMenu');
    if (menu && Array.isArray(window.SITE_TEXT.notifications)) {
        var html = window.SITE_TEXT.notifications.map(function (t) {
            return '<p>' + String(t).replace(/</g, '&lt;') + '</p>';
        }).join('');
        if (html) menu.innerHTML = html;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySiteText);
} else {
    applySiteText();
}
