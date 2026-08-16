/* ==========================================================================
 * scripts/setup-vercel-env.mjs — Konfigurasi Environment Variables Vercel
 * --------------------------------------------------------------------------
 * Skrip ini membantu mengatur Environment Variables yang dipakai backend
 * `/api/post.js` (keamanan server-side + CRUD via GitHub API):
 *
 *     GITHUB_TOKEN   : Personal Access Token GitHub (scope `repo`) — WAJIB.
 *     GH_OWNER       : username pemilik repo (opsional, default env API).
 *     GH_REPO        : nama repo (opsional, default env API).
 *     GH_BRANCH      : branch target, default "main".
 *     ADMIN_PIN      : PIN admin (opsional — bila kosong, API memakai
 *                      PIN bawaan pemilik yang sudah di-hash SHA-256).
 *
 * Cara pakai:
 *   # Interaktif (meminta input satu per satu)
 *   node scripts/setup-vercel-env.mjs
 *
 *   # Isi sebagian lewat flag (sisanya diprompt / diambil dari env)
 *   node scripts/setup-vercel-env.mjs --token ghp_xxx --owner vaetherion --repo netflix-myqueen
 *
 *   # Langsung eksekusi `vercel env add` (perlu Vercel CLI + project ter-link)
 *   node scripts/setup-vercel-env.mjs --apply
 *
 *   # Tampilkan perintah saja tanpa menjalankan (default — aman)
 *   node scripts/setup-vercel-env.mjs
 *
 * FLAG:
 *   --token <val>   GITHUB_TOKEN        --owner <val>  GH_OWNER
 *   --repo <val>    GH_REPO             --branch <val> GH_BRANCH (default main)
 *   --pin <val>     ADMIN_PIN (opsional)
 *   --env <list>    Environment Vercel, koma: production,preview,development
 *                   (default: production,preview,development)
 *   --apply         benar-benar menjalankan `vercel env add`
 *   --skip-validation  lewati validasi token/repo ke GitHub API
 *   -h, --help      tampilkan bantuan ini
 *
 * KEAMANAN: nilai token/PIN tidak pernah dicetak utuh ke terminal
 * (hanya 4 karakter pertama + 4 terakhir), dan tidak pernah ditulis ke
 * file apa pun di repo.
 * ========================================================================== */

import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const ENV_NAMES = {
  GITHUB_TOKEN: { label: 'GITHUB_TOKEN (PAT GitHub, scope `repo`)', secret: true },
  GH_OWNER: { label: 'GH_OWNER (username pemilik repo)', secret: false },
  GH_REPO: { label: 'GH_REPO (nama repository)', secret: false },
  GH_BRANCH: { label: 'GH_BRANCH (branch target)', secret: false },
  ADMIN_PIN: { label: 'ADMIN_PIN (PIN admin — kosongkan untuk PIN bawaan)', secret: true },
};

// Alias flag CLI → nama Environment Variable.
const FLAG_ALIAS = {
  TOKEN: 'GITHUB_TOKEN',
  OWNER: 'GH_OWNER',
  REPO: 'GH_REPO',
  BRANCH: 'GH_BRANCH',
  PIN: 'ADMIN_PIN',
};

const DEFAULTS = { GH_BRANCH: 'main', ADMIN_PIN: '' };

/* --------------------------------------------------------------------------
 * Helper kecil
 * ------------------------------------------------------------------------ */
function maskSecret(v) {
  if (!v) return '(kosong)';
  if (v.length <= 8) return '*'.repeat(v.length);
  return v.slice(0, 4) + '*'.repeat(Math.max(4, v.length - 8)) + v.slice(-4);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') { flags.help = true; continue; }
    if (a === '--apply' || a === '-a') { flags.apply = true; continue; }
    if (a === '--skip-validation') { flags.skipValidation = true; continue; }
    const m = /^--([a-z-]+)(?:=(.*))?$/.exec(a);
    if (!m) continue;
    const key = m[1].toUpperCase().replace(/-/g, '_');
    if (key === 'ENV') { flags.env = (m[2] || argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean); continue; }
    flags[key] = m[2] !== undefined ? m[2] : argv[++i] || '';
  }
  return flags;
}

async function ask(rl, question, current) {
  const answer = (await rl.question(`${question}${current ? ` [${current}]` : ''}: `)).trim();
  return answer || current;
}

/* --------------------------------------------------------------------------
 * Validasi token & repo via GitHub API
 * ------------------------------------------------------------------------ */
async function validateToken(token) {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'netflix-myqueen-setup' },
    });
    if (!res.ok) {
      console.log(`  ⚠ Token tidak valid / tidak punya akses (HTTP ${res.status}): ${(await res.json().catch(() => ({}))).message || ''}`);
      return false;
    }
    const user = await res.json();
    console.log(`  ✅ Token valid — login GitHub: ${user.login}`);
    return true;
  } catch (e) {
    console.log(`  ⚠ Tidak bisa memvalidasi token (offline?): ${e.message}`);
    return false;
  }
}

async function validateRepo(token, owner, repo) {
  if (!token || !owner || !repo) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'User-Agent': 'netflix-myqueen-setup' },
    });
    if (res.ok) {
      const r = await res.json();
      console.log(`  ✅ Repo ditemukan: ${owner}/${repo} (${r.private ? 'private' : 'publik — token di browser bisa terlihat!'})`);
      if (!r.private) {
        console.log('  ⚠ Repo PUBLIK: semua orang bisa melihat kode. Token hanya boleh di Environment Variables Vercel (jangan pernah di repo).');
      }
    } else {
      console.log(`  ⚠ Repo ${owner}/${repo} tidak ditemukan / tidak bisa diakses (HTTP ${res.status}).`);
    }
  } catch (e) {
    console.log(`  ⚠ Gagal memvalidasi repo: ${e.message}`);
  }
}

/* --------------------------------------------------------------------------
 * Deteksi Vercel CLI
 * ------------------------------------------------------------------------ */
async function vercelAvailable() {
  try {
    const { stdout } = await execFileAsync('vercel', ['--version'], { timeout: 15000 });
    console.log(`  ✅ Vercel CLI terdeteksi (${stdout.trim().split('\n')[0]})`);
    return true;
  } catch {
    try {
      const { stdout } = await execFileAsync('npx', ['--no-install', 'vercel', '--version'], { timeout: 15000 });
      console.log(`  ✅ Vercel CLI terdeteksi via npx (${stdout.trim().split('\n')[0]})`);
      return true;
    } catch {
      console.log('  ⚠ Vercel CLI tidak ditemukan. Install dulu: `npm i -g vercel` (atau `npx vercel`).');
      return false;
    }
  }
}

/* --------------------------------------------------------------------------
 * Susun perintah `vercel env add`
 * ------------------------------------------------------------------------ */
function buildCommands(values, envs) {
  const cmds = [];
  for (const [name, value] of Object.entries(values)) {
    if (value === '' || value === undefined) continue;
    for (const env of envs) {
      cmds.push(`echo '${String(value).replace(/'/g, "'\\''")}' | vercel env add ${name} ${env}`);
    }
  }
  return cmds;
}

async function runCommands(cmds) {
  for (const cmd of cmds) {
    console.log(`  ▶ ${cmd.split(' | ').pop()}`);
    try {
      await execFileAsync('bash', ['-c', cmd], { timeout: 60000 });
      console.log('    ✔ selesai');
    } catch (e) {
      const msg = String(e.stderr || e.message || '');
      if (/link/i.test(msg)) {
        console.log('    ✗ Project belum ter-link. Jalankan dulu: `vercel link`, lalu ulangi skrip ini dengan --apply.');
      } else {
        console.log(`    ✗ Gagal: ${msg.split('\n').slice(0, 4).join(' ')}`);
      }
    }
  }
}

/* --------------------------------------------------------------------------
 * Tulis .env.example (template aman — tanpa secret)
 * ------------------------------------------------------------------------ */
function writeEnvExample(owner, repo, branch) {
  const file = join(process.cwd(), '.env.example');
  if (existsSync(file)) return;
  const content = `# ==========================================================================
# .env.example — TEMPLATE Environment Variables untuk /api/post.js (Vercel)
# --------------------------------------------------------------------------
# Salin ke Environment Variables Vercel (Project → Settings → Environment
# Variables) atau jalankan:  node scripts/setup-vercel-env.mjs
#
# JANGAN PERNAH commit file .env / .env.local yang berisi nilai asli!
# ==========================================================================

# WAJIB — Personal Access Token GitHub dengan scope "repo".
# Buat di: GitHub → Settings → Developer settings → Personal access tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Opsional — target repo default untuk API (bisa juga diisi dari panel admin).
GH_OWNER=${owner || 'username-anda'}
GH_REPO=${repo || 'netflix-myqueen'}
GH_BRANCH=${branch || 'main'}

# Opsional — PIN admin. Bila kosong, API memakai PIN bawaan pemilik
# (dibandingkan sebagai hash SHA-256, PIN asli tidak pernah disimpan).
ADMIN_PIN=
`;
  writeFileSync(file, content);
  console.log(`  📄 Template dibuat: .env.example (tanpa secret)`);
}

/* --------------------------------------------------------------------------
 * Main
 * ------------------------------------------------------------------------ */
async function main() {
  const flags = parseArgs(process.argv);
  if (flags.help) {
    console.log(`Penggunaan: node scripts/setup-vercel-env.mjs [--token ..] [--owner ..] [--repo ..] [--branch ..] [--pin ..] [--env a,b,c] [--apply] [--skip-validation]
  --token <val>   GITHUB_TOKEN (PAT GitHub, scope repo) — WAJIB
  --owner <val>   GH_OWNER (username pemilik repo)
  --repo <val>    GH_REPO (nama repository)
  --branch <val>  GH_BRANCH (default: main)
  --pin <val>     ADMIN_PIN (opsional; kosong = PIN bawaan)
  --env <list>    environment Vercel dipisah koma (default: production,preview,development)
  --apply         langsung menjalankan \`vercel env add\` (butuh CLI + project ter-link)
  --skip-validation  lewati validasi token/repo
  -h, --help      bantuan ini`);
    return;
  }

  const envs = flags.env || ['production', 'preview', 'development'];
  const interactive = Boolean(input.isTTY);
  const rl = interactive ? createInterface({ input, output }) : null;

  console.log('⚙️  Setup Environment Variables Vercel — /api/post.js');
  console.log('----------------------------------------------------------');

  const values = {};
  for (const [name, cfg] of Object.entries(ENV_NAMES)) {
    const flagKey = Object.keys(FLAG_ALIAS).find((k) => FLAG_ALIAS[k] === name) || name;
    let value = flags[flagKey] !== undefined ? flags[flagKey] : (process.env[name] || '');
    if (value === undefined) value = '';
    if (!value && name === 'GH_BRANCH') value = DEFAULTS.GH_BRANCH;
    if (!value && rl) {
      value = await ask(rl, `${cfg.label}${cfg.secret ? ' (tidak akan ditampilkan utuh)' : ''}`, value || undefined);
    }
    values[name] = value || '';
    console.log(`  ${name} = ${cfg.secret ? maskSecret(values[name]) : (values[name] || '(kosong)')}`);
  }
  if (rl) rl.close();

  if (!values.GITHUB_TOKEN) {
    console.log('\n⚠ GITHUB_TOKEN wajib diisi — tanpa token, /api/post.js menolak semua aksi (HTTP 503).');
  }

  // Validasi (opsional lewati dengan --skip-validation)
  if (!flags.skipValidation && values.GITHUB_TOKEN) {
    console.log('\nValidasi token GitHub…');
    await validateToken(values.GITHUB_TOKEN);
    await validateRepo(values.GITHUB_TOKEN, values.GH_OWNER, values.GH_REPO);
  }

  // Template .env.example
  writeEnvExample(values.GH_OWNER, values.GH_REPO, values.GH_BRANCH);

  // Susun perintah vercel env add
  const cmds = buildCommands(values, envs);
  if (!cmds.length) {
    console.log('\nTidak ada variabel yang perlu diset.');
    return;
  }

  console.log(`\nEnvironment Vercel target: ${envs.join(', ')}`);
  if (flags.apply) {
    console.log('\nMenjalankan `vercel env add`…');
    const ok = await vercelAvailable();
    if (!ok) {
      console.log('\nCara manual — jalankan perintah berikut (value dikirim via stdin):\n');
      cmds.forEach((c) => console.log('  ' + c));
      return;
    }
    await runCommands(cmds);
  } else {
    console.log('\nPerintah yang bisa dijalankan (atau salin-tempel di terminal):\n');
    cmds.forEach((c) => console.log('  ' + c));
    console.log('\nAtau set manual di Vercel → Project → Settings → Environment Variables.');
    console.log('Untuk langsung menjalankan: node scripts/setup-vercel-env.mjs --apply');
  }

  console.log('\nSelesai. Setelah env diset, redeploy Vercel agar /api/post.js memuat nilai baru.');
}

main().catch((e) => {
  console.error('Gagal menjalankan skrip:', e.message);
  process.exit(1);
});
