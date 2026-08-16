/* ==========================================================================
 * api/post.js — Vercel Serverless Function (Netflix-MyQueen)
 * --------------------------------------------------------------------------
 * ENDPOINT:  POST /api/post.js?action=<aksi>
 *
 * BACKEND KEAMANAN (4-LAYER BAN — lapisan server):
 *   - Verifikasi PIN lewat Environment Variable `ADMIN_PIN`.
 *   - Pengecekan status IP terblokir di `src/data/banned_ips.json`
 *     via GitHub REST API (`GITHUB_TOKEN`).
 *   - Auto-ban IP server-side setelah 3x salah PIN.
 *   - PIN BENAR SELALU DITERIMA: saat verifikasi, PIN dicek TERLEBIH
 *     DAHULU — bila benar, IP otomatis di-unban & hitungan di-reset
 *     (pemilik yang tidak sengaja terblokir tetap bisa masuk).
 *   - Unban / kelola daftar IP terblokir.
 *
 * BACKEND CRUD (FULL CRUD ke repository via GitHub API):
 *   - read  : baca isi file (data postingan / konten teks / JSON).
 *   - write : tambah / edit isi file (auto-create bila belum ada).
 *   - delete: hapus file dari repo.
 *
 * KONFIGURASI (Environment Variables di Vercel — JANGAN hardcode):
 *   - GITHUB_TOKEN  : Personal Access Token dengan scope `repo` (WAJIB).
 *   - ADMIN_PIN     : PIN admin (hash SHA-256 dibandingkan — PIN asli
 *                     tidak pernah ditulis ke log/response).
 *   - GH_OWNER      : username pemilik repo (opsional — bisa dikirim body).
 *   - GH_REPO       : nama repo (opsional — bisa dikirim body).
 *   - GH_BRANCH     : branch, default "main".
 * ========================================================================== */

'use strict';

const crypto = require('crypto');

/* --------------------------------------------------------------------------
 * Konfigurasi — hanya dari Environment Variables (rule keamanan #1).
 * PIN default (hash SHA-256 dari PIN bawaan pemilik) dipakai bila
 * ADMIN_PIN belum diset di environment.
 * ------------------------------------------------------------------------ */
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ADMIN_PIN = process.env.ADMIN_PIN || '';
// Hash SHA-256 PIN bawaan pemilik (d03f21ae…bbfea).
const DEFAULT_PIN_HASH =
  'd03f21ae7af2e2199935eee2e74e863e45cdda7cad26f866a0df8b867b9bbfea';
const GH_BRANCH = process.env.GH_BRANCH || 'main';

// File daftar IP terblokir (server-side), disimpan sebagai JSON murni
// TANPA komentar (#) agar selalu valid saat di-parse.
const BANNED_IPS_PATH = 'src/data/banned_ips.json';

// Jumlah percobaan salah PIN sebelum auto-ban server-side.
const MAX_PIN_FAILURES = 3;

/* --------------------------------------------------------------------------
 * Util kecil
 * ------------------------------------------------------------------------ */
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// Verifikasi PIN: bandingkan hash SHA-256 input dengan ADMIN_PIN (env)
// atau hash bawaan. ADMIN_PIN boleh berisi PIN mentah ATAU hash SHA-256
// (keduanya didukung agar tidak ada mismatch). Perbandingan konstan waktu
// untuk mencegah timing attack.
function constantEq(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function pinMatches(input) {
  const hash = sha256(input);
  if (ADMIN_PIN) {
    // Case 1: ADMIN_PIN diisi HASH → cocokkan langsung.
    if (constantEq(hash, ADMIN_PIN)) return true;
    // Case 2: ADMIN_PIN diisi PIN mentah → bandingkan hash-nya.
    return constantEq(hash, sha256(ADMIN_PIN));
  }
  return constantEq(hash, DEFAULT_PIN_HASH);
}

// Hanya izinkan path di dalam direktori konten repo (cegah path traversal).
function safeRepoPath(p) {
  const path = String(p || '').replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^src\/(data|images|videos|audio)\//.test(path)) return null;
  if (path.split('/').includes('..')) return null;
  return path;
}

function json(res, status, payload) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

/* --------------------------------------------------------------------------
 * GitHub REST API helpers (pakai GITHUB_TOKEN dari env).
 * ------------------------------------------------------------------------ */
function ghHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: 'Bearer ' + GITHUB_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'netflix-myqueen-admin',
  };
}

async function ghFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  return { status: res.status, ok: res.ok, data };
}

function ghApiUrl(owner, repo, branch) {
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}

// Baca isi file dari repo (base64 → utf8). Return { sha, content }.
async function ghGetFile(owner, repo, branch, path) {
  const url = `${ghApiUrl(owner, repo, branch)}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const r = await ghFetch(url, { method: 'GET', headers: ghHeaders() });
  if (!r.ok) {
    const err = new Error(r.data && r.data.message ? r.data.message : 'GitHub GET gagal (HTTP ' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  const buf = Buffer.from(r.data.content, 'base64');
  return { sha: r.data.sha, content: buf.toString('utf8') };
}

// Tulis / perbarui file di repo. sha = null untuk create baru.
async function ghPutFile(owner, repo, branch, path, content, message, sha) {
  const body = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (sha) body.sha = sha;
  const url = `${ghApiUrl(owner, repo, branch)}/contents/${encodeURIComponent(path)}`;
  const r = await ghFetch(url, { method: 'PUT', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!r.ok) {
    const err = new Error(r.data && r.data.message ? r.data.message : 'GitHub PUT gagal (HTTP ' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  return r.data;
}

// Hapus file dari repo (perlu sha file saat ini).
async function ghDeleteFile(owner, repo, branch, path, message) {
  const { sha } = await ghGetFile(owner, repo, branch, path);
  const body = { message, branch, sha };
  const url = `${ghApiUrl(owner, repo, branch)}/contents/${encodeURIComponent(path)}`;
  const r = await ghFetch(url, { method: 'DELETE', headers: ghHeaders(), body: JSON.stringify(body) });
  if (!r.ok) {
    const err = new Error(r.data && r.data.message ? r.data.message : 'GitHub DELETE gagal (HTTP ' + r.status + ')');
    err.status = r.status;
    throw err;
  }
  return r.data;
}

/* --------------------------------------------------------------------------
 * Data IP terblokir (server-side) — baca/tulis via GitHub API.
 * Format JSON murni TANPA komentar (#), struktur OBJEK:
 *   {
 *     "banned":  [ { "ip": "203.0.113.7", "reason": "3x salah PIN", "added": "2026-08-17", "fails": 3 } ],
 *     "attempts": { "203.0.113.9": 2 }
 *   }
 *   - banned  : daftar IP yang benar-benar diblokir.
 *   - attempts: hitungan PIN salah per IP (di bawah ambang ban).
 * ------------------------------------------------------------------------ */
async function loadBanData(owner, repo, branch) {
  try {
    const { content } = await ghGetFile(owner, repo, branch, BANNED_IPS_PATH);
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      // Migrasi otomatis dari format lama (array entri) → struktur objek baru.
      const banned = parsed.filter((x) => x && x.ip && Number(x.fails) >= MAX_PIN_FAILURES);
      const attempts = {};
      parsed.forEach((x) => {
        if (x && x.ip && typeof x.fails === 'number' && x.fails > 0 && x.fails < MAX_PIN_FAILURES) {
          attempts[x.ip] = x.fails;
        }
      });
      return { banned, attempts };
    }
    return {
      banned: Array.isArray(parsed.banned) ? parsed.banned : [],
      attempts: parsed.attempts && typeof parsed.attempts === 'object' && !Array.isArray(parsed.attempts)
        ? parsed.attempts
        : {},
    };
  } catch (e) {
    // 404 = file belum ada → data kosong (bukan error).
    if (e.status === 404) return { banned: [], attempts: {} };
    throw e;
  }
}

async function saveBanData(owner, repo, branch, data) {
  const pretty = JSON.stringify({ banned: data.banned, attempts: data.attempts }, null, 4) + '\n';
  let sha = null;
  try {
    const existing = await ghGetFile(owner, repo, branch, BANNED_IPS_PATH);
    sha = existing.sha;
  } catch (e) { /* file belum ada → create baru */ }
  return ghPutFile(owner, repo, branch, BANNED_IPS_PATH, pretty, 'update ' + BANNED_IPS_PATH + ' via api/post.js', sha);
}

function findBan(list, ip) {
  const needle = String(ip || '').trim().toLowerCase();
  if (!needle) return -1;
  return list.findIndex((b) => b && String(b.ip || '').trim().toLowerCase() === needle);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* --------------------------------------------------------------------------
 * Handler utama
 * ------------------------------------------------------------------------ */
module.exports = async function handler(req, res) {
  // Hanya izinkan metode yang dipakai admin panel.
  if (!['POST', 'GET', 'OPTIONS'].includes(req.method)) {
    return json(res, 405, { ok: false, error: 'Method tidak diizinkan.' });
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  // Parse body (JSON) — aman untuk POST.
  let body = {};
  if (req.body && typeof req.body === 'object') body = req.body;
  else if (typeof req.body === 'string' && req.body) {
    try { body = JSON.parse(req.body); } catch (e) { body = {}; }
  }

  const action = String(req.query.action || body.action || '').toLowerCase();

  // Owner/repo: prioritaskan dari env, fallback body (admin mengirim konfigurasinya).
  const owner = String(process.env.GH_OWNER || body.owner || '').trim();
  const repo = String(process.env.GH_REPO || body.repo || '').trim();
  const branch = String(body.branch || GH_BRANCH).trim() || 'main';

  if (!GITHUB_TOKEN) {
    return json(res, 503, {
      ok: false,
      error: 'GITHUB_TOKEN belum diset di Environment Variables Vercel.',
    });
  }

  // Aksi yang butuh repo owner/repo.
  if (['status', 'verify', 'reset', 'ban', 'unban', 'list', 'read', 'write', 'delete'].includes(action)) {
    if (!owner || !repo) {
      return json(res, 400, { ok: false, error: 'Owner & Repository wajib diisi (env GH_OWNER/GH_REPO atau body owner/repo).' });
    }
  }

  try {
    switch (action) {
      /* ======================= KEAMANAN ======================= */
      case 'status': {
        // Cek apakah IP/Fingerprint terblokir di banned_ips.json.
        const data = await loadBanData(owner, repo, branch);
        const ip = String(body.ip || '').trim().toLowerCase();
        const fp = String(body.fingerprint || '').trim().toLowerCase();
        const hit = data.banned.find((b) => {
          if (!b) return false;
          const v = String(b.ip || '').trim().toLowerCase();
          return (ip && v === ip) || (fp && v === fp);
        });
        return json(res, 200, {
          ok: true,
          banned: !!hit,
          reason: hit ? hit.reason || 'IP terdaftar di daftar blokir.' : '',
        });
      }

      case 'verify': {
        // Verifikasi PIN server-side — PIN dicek TERLEBIH DAHULU agar
        // pemilik dengan PIN benar SELALU bisa masuk (dan otomatis
        // di-unban bila IP-nya sempat terblokir).
        const ip = String(body.ip || '').trim();
        const fingerprint = String(body.fingerprint || '').trim();
        if (!ip && !fingerprint) {
          return json(res, 400, { ok: false, error: 'IP wajib dikirim untuk verifikasi.' });
        }

        const data = await loadBanData(owner, repo, branch);
        const key = ip || fingerprint;
        const pin = String(body.pin || '');

        if (pinMatches(pin)) {
          // PIN BENAR → unban IP ini + reset hitungan, lalu sukses.
          const idx = findBan(data.banned, key);
          if (idx >= 0) data.banned.splice(idx, 1);
          if (ip && data.attempts[ip]) delete data.attempts[ip];
          await saveBanData(owner, repo, branch, data);
          return json(res, 200, { ok: true, verified: true });
        }

        // PIN SALAH → IP yang sudah diblokir tetap 403.
        if (findBan(data.banned, key) >= 0) {
          return json(res, 403, { ok: false, banned: true, error: 'IP Anda diblokir di server.' });
        }

        // Naikkan hitungan percobaan; 3x → auto-ban.
        if (ip) {
          data.attempts[ip] = (data.attempts[ip] || 0) + 1;
          const fails = data.attempts[ip];
          if (fails >= MAX_PIN_FAILURES) {
            delete data.attempts[ip];
            data.banned.push({
              ip,
              reason: '3x salah PIN (auto-ban server-side)',
              added: todayISO(),
              fails,
              bannedAt: new Date().toISOString(),
            });
            await saveBanData(owner, repo, branch, data);
            return json(res, 403, {
              ok: false,
              banned: true,
              error: 'Terlalu banyak percobaan salah PIN. IP Anda diblokir.',
              reason: '3x salah PIN (auto-ban server-side)',
            });
          }
          await saveBanData(owner, repo, branch, data);
          return json(res, 200, {
            ok: false,
            banned: false,
            attemptsLeft: MAX_PIN_FAILURES - fails,
          });
        }
        return json(res, 400, { ok: false, error: 'IP wajib dikirim untuk melacak percobaan.' });
      }

      case 'reset': {
        // Reset hitungan gagal untuk IP (bukan unban — unban lewat verify/unban).
        const ip = String(body.ip || '').trim();
        if (!ip) return json(res, 400, { ok: false, error: 'IP wajib dikirim.' });
        const data = await loadBanData(owner, repo, branch);
        if (data.attempts[ip]) {
          delete data.attempts[ip];
          await saveBanData(owner, repo, branch, data);
        }
        return json(res, 200, { ok: true });
      }

      case 'ban': {
        // Tambah IP ke daftar blokir server (manual / auto).
        const ip = String(body.ip || '').trim();
        if (!ip) return json(res, 400, { ok: false, error: 'IP wajib dikirim.' });
        const data = await loadBanData(owner, repo, branch);
        let idx = findBan(data.banned, ip);
        if (idx < 0) {
          data.banned.push({
            ip,
            reason: String(body.reason || 'Diblokir via admin panel').trim(),
            added: todayISO(),
            fails: Number(body.fails) || 0,
          });
        } else {
          data.banned[idx].reason = String(body.reason || data.banned[idx].reason || 'Diblokir via admin panel').trim();
        }
        if (data.attempts[ip]) delete data.attempts[ip];
        await saveBanData(owner, repo, branch, data);
        return json(res, 200, { ok: true, ip });
      }

      case 'unban': {
        // Hapus IP dari daftar blokir + bersihkan hitungan.
        const ip = String(body.ip || '').trim();
        if (!ip) return json(res, 400, { ok: false, error: 'IP wajib dikirim.' });
        const data = await loadBanData(owner, repo, branch);
        const idx = findBan(data.banned, ip);
        if (idx >= 0) data.banned.splice(idx, 1);
        if (data.attempts[ip]) delete data.attempts[ip];
        await saveBanData(owner, repo, branch, data);
        return json(res, 200, { ok: true, ip });
      }

      case 'list': {
        const data = await loadBanData(owner, repo, branch);
        return json(res, 200, { ok: true, banned: data.banned, attempts: data.attempts });
      }

      /* ======================= FULL CRUD ======================= */
      case 'read': {
        const path = safeRepoPath(body.path);
        if (!path) return json(res, 400, { ok: false, error: 'Path tidak valid (harus di dalam src/).' });
        const { sha, content } = await ghGetFile(owner, repo, branch, path);
        return json(res, 200, { ok: true, path, sha, content });
      }

      case 'write': {
        const path = safeRepoPath(body.path);
        if (!path) return json(res, 400, { ok: false, error: 'Path tidak valid (harus di dalam src/).' });
        const content = String(body.content == null ? '' : body.content);
        const message = String(body.message || 'update ' + path + ' via api/post.js').trim();
        const sha = body.sha || null;
        const r = await ghPutFile(owner, repo, branch, path, content, message, sha);
        return json(res, 200, {
          ok: true,
          path,
          sha: r.content && r.content.sha ? r.content.sha : null,
        });
      }

      case 'delete': {
        const path = safeRepoPath(body.path);
        if (!path) return json(res, 400, { ok: false, error: 'Path tidak valid (harus di dalam src/).' });
        const message = String(body.message || 'delete ' + path + ' via api/post.js').trim();
        await ghDeleteFile(owner, repo, branch, path, message);
        return json(res, 200, { ok: true, path });
      }

      default:
        return json(res, 400, { ok: false, error: 'Aksi tidak dikenali. Gunakan ?action=status|verify|reset|ban|unban|list|read|write|delete' });
    }
  } catch (e) {
    const status = e.status || 500;
    return json(res, status, {
      ok: false,
      error: e.message || 'Terjadi kesalahan server.',
    });
  }
};
