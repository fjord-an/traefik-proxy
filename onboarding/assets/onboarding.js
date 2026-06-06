'use strict';

// ── Config ──────────────────────────────────────────────────────────────
const BACKEND = '/api'; // proxied via Traefik

// ── State ───────────────────────────────────────────────────────────────
const state = {
  os: null,
  interests: new Set(),
  experience: { level: null, years: null, background: '', workStyle: null },
  strengths: new Set(),
};

// ── Interest categories ──────────────────────────────────────────────────
const INTEREST_CATEGORIES = [
  // Creative
  { icon:'🎨', name:'Graphic Design',     sub:'Visual identity & print',       domain:'creative' },
  { icon:'✦',  name:'UI/UX Design',       sub:'Interfaces & user experience',  domain:'creative' },
  { icon:'🎬', name:'Motion Design',      sub:'Animation & video',             domain:'creative' },
  { icon:'✏️', name:'Illustration',       sub:'Digital & traditional art',     domain:'creative' },
  { icon:'📸', name:'Photography',        sub:'Visual storytelling',           domain:'creative' },
  { icon:'🎥', name:'Videography',        sub:'Video production & editing',    domain:'creative' },
  { icon:'🔤', name:'Typography',         sub:'Type, layout & composition',    domain:'creative' },
  { icon:'🎭', name:'Art Direction',      sub:'Creative vision & leading',     domain:'creative' },
  { icon:'🏷️', name:'Branding',          sub:'Identity systems & strategy',   domain:'creative' },
  { icon:'🧊', name:'3D Design',          sub:'Modelling, VFX & product viz',  domain:'creative' },
  // Technical
  { icon:'💻', name:'Software Development',       sub:'Building products & systems',   domain:'technical' },
  { icon:'🌐', name:'Web Development',            sub:'Frontend & full-stack web',     domain:'technical' },
  { icon:'📱', name:'Mobile Development',         sub:'iOS, Android & cross-platform', domain:'technical' },
  { icon:'🖥️', name:'Systems Administration',    sub:'Linux, servers & infrastructure',domain:'technical' },
  { icon:'🔧', name:'Systems Implementation',    sub:'Deploying & configuring systems',domain:'technical' },
  { icon:'🐳', name:'DevOps & Infrastructure',   sub:'CI/CD, containers & cloud',     domain:'technical' },
  { icon:'🔒', name:'Cybersecurity',             sub:'Security, hardening & audits',  domain:'technical' },
  { icon:'🗄️', name:'Database Administration',   sub:'SQL, NoSQL & data stores',      domain:'technical' },
  { icon:'🌐', name:'Networking',                sub:'VPN, DNS, routing & protocols', domain:'technical' },
  { icon:'🤖', name:'AI & Machine Learning',     sub:'Models, pipelines & LLMs',      domain:'technical' },
  { icon:'📊', name:'Data Engineering',          sub:'Pipelines, ETL & analytics',    domain:'technical' },
  { icon:'🔬', name:'Quality Assurance',         sub:'Testing, QA & reliability',     domain:'technical' },
  { icon:'📟', name:'Embedded Systems',          sub:'Hardware, firmware & IoT',      domain:'technical' },
  // Operational
  { icon:'📋', name:'Project Management',        sub:'Planning, delivery & oversight',domain:'operational' },
  { icon:'⚡', name:'Process Optimisation',      sub:'Efficiency & workflow design',  domain:'operational' },
  { icon:'📖', name:'Documentation',            sub:'Technical writing & runbooks',  domain:'operational' },
  { icon:'📈', name:'Business Analysis',         sub:'Requirements & process mapping',domain:'operational' },
  { icon:'🔄', name:'Operations',               sub:'Day-to-day running of systems', domain:'operational' },
  // Relational
  { icon:'🎧', name:'Customer Support',         sub:'Helping users resolve issues',  domain:'relational' },
  { icon:'🤝', name:'Customer Success',         sub:'Retention & relationship mgmt', domain:'relational' },
  { icon:'💬', name:'Client Relations',         sub:'External stakeholders & comms', domain:'relational' },
  { icon:'🧭', name:'Consultation',             sub:'Advisory & strategic guidance', domain:'relational' },
  { icon:'👥', name:'Community Management',     sub:'Online communities & forums',   domain:'relational' },
  { icon:'🏫', name:'Training & Mentorship',    sub:'Teaching & onboarding',         domain:'relational' },
  { icon:'🧑‍💼', name:'HR & Recruitment',       sub:'Hiring, culture & people ops',  domain:'relational' },
  // Strategic
  { icon:'📣', name:'Marketing',                sub:'Growth, campaigns & channels',  domain:'strategic' },
  { icon:'✍️', name:'Copywriting',             sub:'Words that persuade & inform',  domain:'strategic' },
  { icon:'📡', name:'Content Strategy',         sub:'Editorial planning & content ops',domain:'strategic' },
  { icon:'🧭', name:'Brand Strategy',           sub:'Positioning & market identity', domain:'strategic' },
  { icon:'🗺️', name:'Business Strategy',        sub:'Big-picture planning & vision', domain:'strategic' },
  { icon:'🧪', name:'Research',                 sub:'UX, market & competitive intel',domain:'strategic' },
  { icon:'🎯', name:'Product Management',       sub:'Roadmaps, specs & prioritisation',domain:'strategic' },
  { icon:'💰', name:'Sales',                    sub:'Pipeline, deals & conversion',  domain:'strategic' },
];

// Strengths are a focused subset
const STRENGTH_CHIPS = [
  'Problem solving','Attention to detail','Fast learner','Creative thinking',
  'Communication','Leadership','Collaboration','Self-management','Critical thinking',
  'Systems thinking','Empathy','Adaptability','Resilience','Initiative',
  'Research skills','Presentation','Written communication','Technical depth',
  'User empathy','Data literacy','Strategic vision','Facilitation','Coaching',
  'Conflict resolution','Negotiation','Process design','Documentation',
  'Pixel-perfect execution','Big picture thinking','Cross-functional work',
  'Mentorship','Curiosity','Reliability','Speed','Quality focus',
];

// ── Screen navigation ────────────────────────────────────────────────────
function goScreen(id) {
  document.querySelectorAll('.flow-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (!target) return;
  target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // When entering profile flow, show that div and hide cert flow
  if (['screen-profile-intro','screen-interests','screen-experience',
       'screen-strengths','screen-email','screen-done','screen-services'].includes(id)) {
    document.getElementById('certFlow').style.display = 'none';
    document.getElementById('profileFlow').style.display = 'block';
  } else {
    document.getElementById('certFlow').style.display = 'block';
    document.getElementById('profileFlow').style.display = 'none';
  }
}

function goProfileStep(step) {
  const map = {
    interests:  'screen-interests',
    experience: 'screen-experience',
    strengths:  'screen-strengths',
    email:      'screen-email',
  };
  goScreen(map[step] || 'screen-profile-intro');
}

// ── OS Detection ─────────────────────────────────────────────────────────
function detectOS() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua))          return 'android';
  if (/Mac/i.test(navigator.platform)) return 'macos';
  if (/Win/i.test(navigator.platform)) return 'windows';
  if (/Linux/i.test(navigator.platform)) return 'linux';
  return 'unknown';
}

const OS_META = {
  macos:   { emoji:'🍎', name:'macOS' },
  ios:     { emoji:'📱', name:'iPhone / iPad' },
  windows: { emoji:'🪟', name:'Windows' },
  linux:   { emoji:'🐧', name:'Linux' },
  android: { emoji:'🤖', name:'Android' },
  unknown: { emoji:'💻', name:'Unknown system' },
};

function selectOS(os) {
  state.os = os;
  const meta = OS_META[os] || OS_META.unknown;
  document.getElementById('osEmoji').textContent = meta.emoji;
  document.getElementById('osName').textContent  = meta.name;
  document.getElementById('osVer').textContent   = 'Showing instructions for your system';
  document.querySelectorAll('.install-method').forEach(m => m.style.display = 'none');
  const method = document.getElementById('method-' + os);
  if (method) method.style.display = 'block';
  toggleOsPicker(false);
}

function toggleOsPicker(force) {
  const picker = document.getElementById('osPicker');
  const show = force !== undefined ? force : picker.style.display === 'none';
  picker.style.display = show ? 'flex' : 'none';
}

// ── Test Connection ──────────────────────────────────────────────────────
async function runTests() {
  const btn = document.getElementById('runTestsBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Running…';

  let pass = 0, total = 3;

  // 1 — Tailscale (can we reach any .pspace?)
  const tsOk = await testReach('https://proxy.pspace/dashboard/');
  setTestRow('tailscale', tsOk, tsOk ? 'Connected' : 'Not reachable');
  if (tsOk) pass++;

  // 2 — DNS (resolve a second domain to confirm AdGuard is working)
  const dnsOk = await testReach('https://dns.pspace');
  setTestRow('dns', dnsOk, dnsOk ? 'Resolving' : 'Not resolving');
  if (dnsOk) pass++;

  // 3 — HTTPS (same-origin fetch, will fail if cert is untrusted)
  let httpsOk = false;
  try {
    const r = await fetch('https://proxy.pspace/dashboard/', { method:'HEAD', signal: AbortSignal.timeout(5000) });
    httpsOk = r.status < 600; // any real response = trusted
  } catch {}
  setTestRow('https', httpsOk, httpsOk ? 'Certificate trusted' : 'Not trusted — install certificate');
  if (httpsOk) pass++;

  // Result
  const res = document.getElementById('testResult');
  res.style.display = 'block';
  const nav = document.getElementById('testNav');
  const tb  = document.getElementById('testTroubleshoot');

  if (pass === total) {
    res.className = 'pass';
    res.textContent = '✅ All tests passed — you\'re good to go!';
    tb.style.display = 'none';
    nav.style.display = 'flex';
  } else {
    res.className = 'fail';
    res.textContent = `⚠️ ${total - pass} test${total - pass > 1 ? 's' : ''} failed — see troubleshooting below.`;
    nav.style.display = 'flex'; // allow skip

    tb.style.display = 'block';
    const tips = [];
    if (!tsOk) tips.push('<li><strong>Tailscale not connected:</strong> Open the Tailscale app and make sure you\'re signed in to the PaceySpace network.</li>');
    if (!dnsOk) tips.push('<li><strong>DNS not resolving:</strong> In the Tailscale app, open <em>DNS</em> settings and confirm <em>"Use Tailscale DNS Settings"</em> is enabled.</li>');
    if (!httpsOk) tips.push('<li><strong>Certificate not trusted:</strong> Go back to Step 1 and complete the certificate installation for your OS. Restart your browser after installing.</li>');
    tb.innerHTML = `<h3>🔧 Troubleshooting</h3><ul>${tips.join('')}</ul>`;
  }

  btn.disabled = false;
  btn.textContent = '↺ Re-run';
}

async function testReach(url) {
  try {
    await fetch(url, { method:'HEAD', mode:'no-cors', signal: AbortSignal.timeout(5000) });
    return true;
  } catch { return false; }
}

function setTestRow(id, ok, label) {
  const row = document.getElementById('tr-' + id);
  const ind = document.getElementById('ti-' + id);
  const bdg = document.getElementById('tb-' + id);
  if (!row) return;
  row.classList.toggle('pass', ok);
  row.classList.toggle('fail', !ok);
  ind.textContent = ok ? '✅' : '❌';
  bdg.textContent = label;
}

// ── Interest grid ────────────────────────────────────────────────────────
function buildInterestGrid() {
  const grid = document.getElementById('interestGrid');
  if (!grid) return;
  grid.innerHTML = '';
  INTEREST_CATEGORIES.forEach(item => {
    const el = document.createElement('div');
    el.className = 'int-category';
    el.dataset.name = item.name;
    el.innerHTML = `
      <div class="int-check">✓</div>
      <div class="int-remove">✕</div>
      <div class="int-icon">${item.icon}</div>
      <div class="int-name">${item.name}</div>
      <div class="int-sub">${item.sub}</div>
    `;
    el.addEventListener('click', () => toggleInterest(el, item.name));
    grid.appendChild(el);
  });
}

function toggleInterest(el, name) {
  if (state.interests.has(name)) {
    state.interests.delete(name);
    el.classList.remove('selected');
  } else {
    state.interests.add(name);
    el.classList.add('selected');
  }
  const n = state.interests.size;
  document.getElementById('interestCount').textContent = n;
  const btn = document.getElementById('interestNext');
  if (btn) btn.disabled = n === 0;
}

// ── Strength chips ───────────────────────────────────────────────────────
function buildStrengthGrid() {
  const grid = document.getElementById('strengthGrid');
  if (!grid) return;
  grid.innerHTML = '';
  STRENGTH_CHIPS.forEach(name => {
    const el = document.createElement('div');
    el.className = 'str-chip';
    el.innerHTML = `${name} <span class="str-x">✕</span>`;
    el.addEventListener('click', () => toggleStrength(el, name));
    grid.appendChild(el);
  });
}

function toggleStrength(el, name) {
  const maxed = state.strengths.size >= 10 && !state.strengths.has(name);
  if (maxed) { el.style.opacity = '.4'; setTimeout(() => { el.style.opacity=''; }, 600); return; }
  if (state.strengths.has(name)) {
    state.strengths.delete(name);
    el.classList.remove('selected');
  } else {
    state.strengths.add(name);
    el.classList.add('selected');
  }
  document.getElementById('strengthCount').textContent = state.strengths.size;
}

// ── Experience pickers ───────────────────────────────────────────────────
function selectLevel(btn) {
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.experience.level = btn.dataset.level;
}

function selectYears(btn) {
  document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.experience.years = btn.dataset.years;
}

// ── Email username validation ────────────────────────────────────────────
function validateUsername() {
  const input = document.getElementById('fieldEmailUsername');
  const val   = document.getElementById('usernameValidation');
  if (!input || !val) return true;
  const v = input.value;
  if (!v) { val.className = 'field-validation'; val.textContent = ''; return false; }
  const ok = /^[a-z0-9._-]+$/.test(v);
  val.className = 'field-validation ' + (ok ? 'ok' : 'err');
  val.textContent = ok ? '✓ Looks good — ' + v + '@paceyspace.com' : '✕ Only lowercase letters, numbers, dots, hyphens, underscores';
  return ok;
}

// ── Submit profile ───────────────────────────────────────────────────────
async function submitProfile() {
  const btn = document.getElementById('submitBtn');
  const status = document.getElementById('submitStatus');

  const fullName     = document.getElementById('fieldFullName')?.value.trim();
  const displayName  = (document.getElementById('fieldDisplayName')?.value.trim()) || fullName;
  const emailUsername= document.getElementById('fieldEmailUsername')?.value.trim().toLowerCase();
  const role         = document.getElementById('fieldRole')?.value;
  const personalEmail= document.getElementById('fieldPersonalEmail')?.value.trim();
  const notes        = document.getElementById('fieldNotes')?.value.trim();
  const workStyle    = document.querySelector('input[name="workStyle"]:checked')?.value || null;
  const background   = document.getElementById('expBackground')?.value.trim();
  const strengthNotes= document.getElementById('strengthNotes')?.value.trim();

  if (!fullName)      return showStatus(status, 'err', '⚠ Full name is required.');
  if (!emailUsername) return showStatus(status, 'err', '⚠ Email username is required.');
  if (!validateUsername()) return showStatus(status, 'err', '⚠ Please fix the email username.');
  if (!role)          return showStatus(status, 'err', '⚠ Please select your role.');

  state.experience.background = background || '';
  state.experience.workStyle  = workStyle;

  const payload = {
    fullName,
    displayName,
    emailUsername,
    role,
    personalEmail,
    notes: [notes, strengthNotes].filter(Boolean).join('\n\n'),
    interests: [...state.interests],
    experience: state.experience,
    strengths: [...state.strengths],
  };

  btn.disabled = true;
  btn.textContent = '⏳ Submitting…';
  status.style.display = 'none';

  try {
    const res = await fetch(BACKEND + '/submit-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('confirmedEmail').textContent = emailUsername + '@paceyspace.com';
      goScreen('screen-done');
    } else {
      showStatus(status, 'err', '⚠ ' + (data.error || 'Submission failed. Please try again.'));
    }
  } catch (e) {
    showStatus(status, 'err', '⚠ Could not reach the server. Please try again or contact the admin.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Profile →';
  }
}

function showStatus(el, type, msg) {
  el.className = type;
  el.textContent = msg;
  el.style.display = 'block';
  el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ── Clipboard ────────────────────────────────────────────────────────────
function copyCode(btn) {
  const pre = btn.parentElement.querySelector('pre');
  navigator.clipboard.writeText(pre.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.textContent = orig; }, 2000);
  });
}

// ── Init ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // OS detection
  const detected = detectOS();
  selectOS(detected);

  // Build grids
  buildInterestGrid();
  buildStrengthGrid();

  // Work style radio cards
  document.querySelectorAll('.style-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.style-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      card.querySelector('input').checked = true;
    });
  });
});
