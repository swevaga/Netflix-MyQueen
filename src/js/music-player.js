/* ==========================================================================
   music-player.js — Dynamic Island music player (gaya iOS) untuk semua halaman
   --------------------------------------------------------------------------
   CARA MENAMBAHKAN MUSIK:
     1. Taruh file lagu (mp3/ogg/m4a) di folder  src/audio/
     2. Daftarkan di  src/data/music-data.js  (lihat contoh di sana)
   Player otomatis muncul di atas tengah layar. Fitur:
     - Toggle On/Off (klik ikon musik)
     - Menampilkan judul lagu + waktu putar berjalan
     - Klik pill → expand menampilkan judul & tombol play/pause
     - Autoplay dimulai setelah interaksi pertama user (kebijakan browser)
   DEBUG: HUD kecil di pojok kiri-bawah menampilkan suppressCount + status
   audio. Aktifkan via ?debug / ?debug=auto di URL, atau klik tombol musik
   pojok kanan-bawah 3x cepat (toggle tanpa reload halaman).
   ========================================================================== */

(function () {
    var PLAYLIST = window.MUSIC_PLAYLIST || [];
    if (!PLAYLIST.length) return; // Tidak ada lagu terdaftar → player tidak muncul.

    var audio = null;
    var trackIndex = 0;
    var playing = false;
    var started = false; // autoplay hanya setelah interaksi user
    // Suppress: saat video halaman lain (Play/movies/series/news) berbunyi,
    // island disembunyikan + musik di-pause agar tidak ada suara double.
    var suppressCount = 0;
    var wasPlayingBeforeSuppress = false;
    var isOff = false; // state "Matikan musik" (berbeda dari jeda biasa)

    /* ---- Kontinuitas antar halaman (MPA) ----
       State pemutar disimpan ke sessionStorage saat halaman ditinggalkan
       (pagehide / tab tersembunyi), lalu dipulihkan di halaman berikutnya:
       lagu yang sama lanjut dari posisi yang sama. Bila browser memblokir
       autoplay setelah navigasi, musik dilanjutkan oleh interaksi pertama
       user — tetap dari posisi tersimpan, bukan dari awal. */
    var STATE_KEY = 'musicPlayerState';
    var pendingRestoreTime = 0;

    function saveState() {
        try {
            sessionStorage.setItem(STATE_KEY, JSON.stringify({
                trackIndex: trackIndex,
                currentTime: audio && !isNaN(audio.duration) ? audio.currentTime : 0,
                playing: playing,
                started: started,
                isOff: isOff
            }));
        } catch (e) { /* sessionStorage tidak tersedia — abaikan */ }
    }

    function restoreState() {
        try {
            var raw = sessionStorage.getItem(STATE_KEY);
            if (!raw) return;
            var s = JSON.parse(raw);
            if (typeof s.trackIndex === 'number' && PLAYLIST.length) {
                trackIndex = Math.min(Math.max(0, s.trackIndex), PLAYLIST.length - 1);
            }
            started = !!s.started;
            isOff = !!s.isOff;
            pendingRestoreTime = (typeof s.currentTime === 'number' && s.currentTime > 0) ? s.currentTime : 0;
            if (s.playing && !isOff) playing = true;
        } catch (e) { /* data korup — abaikan */ }
    }

    // Terapkan lagu & posisi yang tersimpan ke audio yang baru dibuat
    // (seek ditunda sampai metadata siap agar aman lintas browser).
    function applyRestoredPosition() {
        ensureAudio();
        if (!audio) return;
        var t = PLAYLIST[trackIndex];
        document.getElementById('musicIslandTrack').textContent = t.title || 'Musik';
        document.getElementById('musicExpandedTitle').textContent = t.title || '';
        var pos = pendingRestoreTime;
        if (!pos) return;
        if (audio.readyState >= 1) {
            audio.currentTime = pos;
            updateTime();
        } else {
            audio.addEventListener('loadedmetadata', function onMeta() {
                audio.removeEventListener('loadedmetadata', onMeta);
                try { audio.currentTime = pos; updateTime(); } catch (e) {}
            });
        }
    }

    function buildUI() {
        var island = document.createElement('div');
        island.id = 'musicIsland';
        island.setAttribute('role', 'region');
        island.setAttribute('aria-label', 'Pemutar musik');
        island.innerHTML =
            '<button type="button" id="musicIslandBtn" class="music-island-btn" aria-expanded="false">' +
                '<i class="fas fa-music music-island-icon" aria-hidden="true"></i>' +
                '<span id="musicIslandTrack" class="music-island-track">' + (PLAYLIST[0].title || 'Musik') + '</span>' +
                '<span id="musicIslandTime" class="music-island-time">0:00</span>' +
            '</button>' +
            '<div id="musicExpanded" class="music-expanded" hidden>' +
                '<span class="music-expanded-label">Now Playing</span>' +
                '<span class="music-expanded-title" id="musicExpandedTitle">' + (PLAYLIST[0].title || '') + '</span>' +
                '<div class="music-expanded-controls">' +
                    '<button type="button" id="musicPrev" class="music-ctrl" aria-label="Lagu sebelumnya"><i class="fas fa-step-backward" aria-hidden="true"></i></button>' +
                    '<button type="button" id="musicToggle" class="music-ctrl music-toggle" aria-label="Putar / Jeda"><i class="fas fa-play" aria-hidden="true"></i></button>' +
                    '<button type="button" id="musicNext" class="music-ctrl" aria-label="Lagu berikutnya"><i class="fas fa-step-forward" aria-hidden="true"></i></button>' +
                    '<button type="button" id="musicOff" class="music-ctrl" aria-label="Matikan musik"><i class="fas fa-power-off" aria-hidden="true"></i></button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(island);

        // Tombol status di pojok (indikator musik aktif tanpa melihat pill).
        var floatBtn = document.createElement('button');
        floatBtn.type = 'button';
        floatBtn.id = 'musicFloatingBtn';
        floatBtn.className = 'music-float-btn';
        floatBtn.setAttribute('aria-label', 'Putar musik');
        floatBtn.setAttribute('aria-pressed', 'false');
        floatBtn.title = 'Putar musik';
        floatBtn.innerHTML = '<i class="fas fa-music music-float-icon" aria-hidden="true"></i>';
        document.body.appendChild(floatBtn);

        // Klik 3x cepat pada tombol musik pojok = toggle HUD debug (tanpa
        // reload). Klik ke-1 & ke-2 berfungsi normal; klik ke-3 dikonsumsi
        // sehingga 3 klik netto tidak mengubah musik, hanya membalik HUD.
        var floatTapCount = 0;
        var floatTapTimer = null;
        floatBtn.addEventListener('click', function () {
            floatTapCount++;
            if (floatTapCount === 1) {
                floatTapTimer = setTimeout(function () { floatTapCount = 0; }, 600);
            }
            if (floatTapCount >= 3) {
                floatTapCount = 0;
                if (floatTapTimer) clearTimeout(floatTapTimer);
                // Toggle SEMUA HUD debug (music + hero + scroll-reveal).
                if (window.DebugHud) {
                    window.DebugHud.setEnabled(!window.DebugHud.isEnabled());
                    syncHudTimer();
                }
                return; // klik ke-3 tidak menyentuh musik
            }
            if (suppressCount > 0) return; // suara video lain sedang aktif
            if (isOff) { wakeFromOff(false); return; }
            togglePlay(true);
        });

        var btn = document.getElementById('musicIslandBtn');
        var expanded = document.getElementById('musicExpanded');

        // Simpan referensi handler agar powerOff() bisa melepasnya (hindari
        // double-toggle saat tombol "Matikan musik" dipakai).
        btn.toggleHandler = function () {
            var open = expanded.hidden;
            expanded.hidden = !open;
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            if (open) ensureAudio();
        };
        btn.addEventListener('click', btn.toggleHandler);

        document.getElementById('musicToggle').addEventListener('click', function () {
            togglePlay(true);
        });
        document.getElementById('musicNext').addEventListener('click', function () {
            nextTrack();
        });
        document.getElementById('musicPrev').addEventListener('click', function () {
            prevTrack();
        });
        document.getElementById('musicOff').addEventListener('click', function () {
            powerOff();
        });
    }

    /* ---- Debug HUD (opsional) ----
       HUD berada di container bersama src/js/debug-hud.js (?debug / ?debug=auto
       di URL, atau klik tombol musik pojok 3x cepat sebagai toggle runtime).
       Di sini hanya: daftarkan HUD 'music' + jaga interval refresh 300ms
       berjalan saat HUD aktif (dan berhenti saat nonaktif). */
    var hudTimer = null;

    function syncHudTimer() {
        if (window.DebugHud && window.DebugHud.isEnabled()) {
            if (!hudTimer) {
                hudTimer = setInterval(updateDebugHud, 300);
                updateDebugHud();
            }
        } else if (hudTimer) {
            clearInterval(hudTimer);
            hudTimer = null;
        }
    }

    function updateDebugHud() {
        if (!window.DebugHud) return;
        var island = document.getElementById('musicIsland');
        var floatBtn = document.getElementById('musicFloatingBtn');
        var t = '';
        t += 'suppressCount : ' + suppressCount + '\n';
        t += 'playing       : ' + playing + '\n';
        t += 'started       : ' + started + '\n';
        t += 'off           : ' + isOff + '\n';
        t += 'audio         : ' + (audio ? (audio.paused ? 'paused' : 'PLAYING') : 'null') + '\n';
        t += '  time        : ' + (audio ? Math.floor(audio.currentTime) + 's' : '-') +
            (audio && !isNaN(audio.duration) ? '/' + Math.floor(audio.duration) + 's' : '') + '\n';
        t += 'track         : ' + (PLAYLIST[trackIndex] ? PLAYLIST[trackIndex].title : '-') + '\n';
        t += 'island        : ' + (island && island.classList.contains('music-island-suppressed') ? 'HIDDEN' : 'visible') + '\n';
        t += 'float         : ' + (floatBtn && floatBtn.classList.contains('music-float-suppressed') ? 'HIDDEN' : 'visible');
        window.DebugHud.update('musicDebugHud', t);
    }

    function ensureAudio() {
        if (audio) return;
        audio = new Audio(PLAYLIST[trackIndex].src);
        audio.loop = false;
        audio.addEventListener('ended', nextTrack);
        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateTime);
        audio.addEventListener('error', function () {
            document.getElementById('musicIslandTrack').textContent = 'Musik tidak dapat dimuat';
        });
    }

    function loadTrack(i) {
        trackIndex = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
        var t = PLAYLIST[trackIndex];
        if (audio) {
            audio.src = t.src;
            audio.load();
        }
        document.getElementById('musicIslandTrack').textContent = t.title || 'Musik';
        document.getElementById('musicExpandedTitle').textContent = t.title || '';
        if (playing) {
            var p = audio ? audio.play() : null;
            if (p && p.catch) p.catch(function () {});
        }
    }

    function togglePlay(userGesture) {
        ensureAudio();
        if (!audio) return;
        if (suppressCount > 0) return; // sedang dipakai suara video lain
        if (userGesture) started = true;
        if (audio.paused) {
            var p = audio.play();
            if (p && p.catch) p.catch(function () {});
            playing = true;
            document.getElementById('musicToggle').innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
        } else {
            audio.pause();
            playing = false;
            document.getElementById('musicToggle').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        }
        updateFloating();
    }

    function nextTrack() { loadTrack(trackIndex + 1); }
    function prevTrack() { loadTrack(trackIndex - 1); }

    function powerOff() {
        if (audio) { audio.pause(); audio.currentTime = 0; }
        playing = false;
        started = false;
        isOff = true;
        var expanded = document.getElementById('musicExpanded');
        expanded.hidden = true;
        var btn = document.getElementById('musicIslandBtn');
        btn.setAttribute('aria-expanded', 'false');
        btn.classList.add('music-island-off');
        document.getElementById('musicIslandTrack').textContent = 'Musik Mati';
        document.getElementById('musicIslandTime').textContent = '';
        document.getElementById('musicToggle').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
        // Klik ikon kembali menghidupkan (lepas handler lama dulu agar
        // tidak double-toggle).
        btn.removeEventListener('click', btn.toggleHandler);
        btn.wakeHandler = function wake() {
            btn.removeEventListener('click', btn.wakeHandler);
            wakeFromOff(true); // perilaku lama: pill yang diklik ikut membuka panel
        };
        btn.addEventListener('click', btn.wakeHandler);
        updateFloating();
    }

    // Menghidupkan kembali dari state mati. openPanel=true → panel expanded
    // ikut dibuka (perilaku klik pill); false → hanya langsung putar (tombol pojok).
    function wakeFromOff(openPanel) {
        var btn = document.getElementById('musicIslandBtn');
        btn.classList.remove('music-island-off');
        document.getElementById('musicIslandTrack').textContent = PLAYLIST[trackIndex].title || 'Musik';
        // Lepas listener wake yang masih terpasang (mis. tombol pojok yang
        // menghidupkan lebih dulu) lalu pasang handler toggle normal.
        if (btn.wakeHandler) btn.removeEventListener('click', btn.wakeHandler);
        btn.removeEventListener('click', btn.toggleHandler);
        btn.addEventListener('click', btn.toggleHandler);
        isOff = false;
        var expanded = document.getElementById('musicExpanded');
        if (openPanel) {
            var open = expanded.hidden;
            expanded.hidden = !open;
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        } else {
            expanded.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }
        updateFloating();
        togglePlay(true);
    }

    // Sinkronkan tombol pojok dengan status pemutar: berputar = musik aktif,
    // statis = jeda/mati. Pengguna langsung tahu tanpa melihat pill di atas.
    function updateFloating() {
        var btn = document.getElementById('musicFloatingBtn');
        if (!btn) return;
        var icon = btn.querySelector('.music-float-icon');
        if (playing) {
            btn.classList.add('is-playing');
            btn.classList.remove('is-paused', 'is-off');
            icon.className = 'fas fa-music music-float-icon';
            btn.setAttribute('aria-label', 'Jeda musik');
            btn.title = 'Jeda musik';
            btn.setAttribute('aria-pressed', 'true');
        } else if (isOff) {
            btn.classList.remove('is-playing', 'is-paused');
            btn.classList.add('is-off');
            icon.className = 'fas fa-volume-xmark music-float-icon';
            btn.setAttribute('aria-label', 'Musik mati — hidupkan musik');
            btn.title = 'Hidupkan musik';
            btn.setAttribute('aria-pressed', 'false');
        } else {
            btn.classList.remove('is-playing', 'is-off');
            btn.classList.add('is-paused');
            icon.className = 'fas fa-music music-float-icon';
            btn.setAttribute('aria-label', 'Putar musik');
            btn.title = 'Putar musik';
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    function updateTime() {
        if (!audio || isNaN(audio.duration)) return;
        var m = Math.floor(audio.currentTime / 60);
        var s = Math.floor(audio.currentTime % 60);
        document.getElementById('musicIslandTime').textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Autoplay setelah interaksi pertama user (kebijakan browser modern).
    // Dipasang manual (bukan {once:true}) agar interaksi yang terjadi saat
    // musik sedang di-suppress video TIDAK menghabiskan kesempatan autoplay:
    // listener hanya dilepas ketika musik benar-benar mulai.
    var interactionPending = true;
    function handleInteraction(event) {
        if (!interactionPending) return;
        if (suppressCount > 0) return; // tunggu sampai video selesai
        // Klik pada kontrol pemutar (tombol pojok / panel expanded) sudah
        // menangani toggle-nya sendiri — jangan toggle dua kali di sini.
        var target = event.target;
        if (target && target.closest && target.closest('#musicFloatingBtn, #musicExpanded')) return;
        interactionPending = false;
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
        started = true;
        // Hanya mulai bila belum berputar (dan tidak dalam state mati):
        // mencegah toggle ganda saat kontrol pemutar sudah menjalankannya.
        if (!playing && !isOff) togglePlay(true);
    }

    /* ---- API untuk halaman lain: pause/resume saat video berbunyi ---- */
    function pauseForVideo() {
        suppressCount++;
        if (suppressCount !== 1) return;
        wasPlayingBeforeSuppress = playing;
        if (audio) audio.pause();
        playing = false;
        var island = document.getElementById('musicIsland');
        if (island) island.classList.add('music-island-suppressed');
        var floatBtn = document.getElementById('musicFloatingBtn');
        if (floatBtn) floatBtn.classList.add('music-float-suppressed');
        var expanded = document.getElementById('musicExpanded');
        if (expanded) expanded.hidden = true;
        var btn = document.getElementById('musicIslandBtn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        var toggle = document.getElementById('musicToggle');
        if (toggle) toggle.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
    }

    function resumeFromVideo() {
        if (suppressCount === 0) return;
        suppressCount--;
        if (suppressCount !== 0) return; // masih ada video lain yang aktif
        var island = document.getElementById('musicIsland');
        if (island) island.classList.remove('music-island-suppressed');
        var floatBtn = document.getElementById('musicFloatingBtn');
        if (floatBtn) floatBtn.classList.remove('music-float-suppressed');
        updateFloating();
        if (wasPlayingBeforeSuppress) {
            started = true;
            togglePlay(true);
        }
    }

    window.MusicPlayer = {
        pauseForVideo: pauseForVideo,
        resumeFromVideo: resumeFromVideo,
        isSuppressed: function () { return suppressCount > 0; },
        // Status lengkap (read-only) — dipakai test otomatis & debugging manual.
        getState: function () {
            return {
                suppressCount: suppressCount,
                playing: playing,
                started: started,
                isOff: isOff,
                hasAudio: !!audio,
                audioPaused: audio ? audio.paused : null,
                audioTime: audio ? audio.currentTime : null,
                audioDuration: audio ? audio.duration : null,
                trackTitle: PLAYLIST[trackIndex] ? PLAYLIST[trackIndex].title : null
            };
        }
    };
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    // Simpan state saat halaman ditinggalkan / tab tersembunyi, supaya
    // halaman berikutnya bisa melanjutkan dari posisi yang sama.
    window.addEventListener('pagehide', saveState);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') saveState();
    });

    function initPlayer() {
        buildUI();
        restoreState();

        if (isOff) {
            // User mematikan musik di halaman sebelumnya → tampilkan UI "Musik Mati".
            powerOff();
        } else if (playing) {
            applyRestoredPosition();
            document.getElementById('musicToggle').innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
            var p = audio.play();
            if (p && p.catch) p.catch(function () {
                // Autoplay diblokir browser → lanjut dari posisi tersimpan
                // lewat interaksi pertama user (listener handleInteraction).
                playing = false;
                document.getElementById('musicToggle').innerHTML = '<i class="fas fa-play" aria-hidden="true"></i>';
                updateFloating();
            });
            updateFloating();
        } else if (pendingRestoreTime || trackIndex !== 0) {
            // Dipulihkan dalam keadaan jeda: siapkan lagu & posisi tanpa memutar.
            applyRestoredPosition();
        }

        if (window.DebugHud) window.DebugHud.register('musicDebugHud', 'music');
        syncHudTimer();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayer);
    } else {
        initPlayer();
    }
})();
