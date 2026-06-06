'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 8083;

// ── Config ──────────────────────────────────────────────────────────────
const SMTP_HOST   = process.env.SMTP_HOST   || 'mail.paceyspace.com';
const SMTP_PORT   = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // default true
const SMTP_USER   = process.env.SMTP_USER   || 'noreply@paceyspace.com';
const SMTP_PASS   = process.env.SMTP_PASS   || '';
const NOTIFY_TO   = process.env.NOTIFY_TO   || 'jordan@paceyspace.com';
const FROM_ADDR   = `"PaceySpace Onboarding" <${SMTP_USER}>`;

// ── Mailer ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   SMTP_HOST,
  port:   SMTP_PORT,
  secure: SMTP_SECURE,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false }, // internal CA
});

// ── Middleware ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(cors({ origin: '*' })); // Traefik handles access control
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please try again later.' },
}));

// ── Health ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Submit Profile ────────────────────────────────────────────────────────
const profileValidators = [
  body('fullName').trim().notEmpty().isLength({ max: 120 }),
  body('displayName').trim().notEmpty().isLength({ max: 120 }),
  body('emailUsername')
    .trim().notEmpty()
    .matches(/^[a-z0-9._-]+$/).withMessage('Invalid email username')
    .isLength({ max: 64 }),
  body('role').trim().notEmpty().isLength({ max: 80 }),
  body('interests').isArray({ min: 1, max: 30 }),
  body('interests.*').isString().isLength({ max: 80 }),
  body('experience').isObject(),
  body('strengths').isArray({ max: 20 }),
];

app.post('/submit-profile', profileValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const {
    fullName, displayName, emailUsername, role,
    interests = [], experience = {}, strengths = [], notes = '',
  } = req.body;

  const requestedEmail = `${emailUsername}@paceyspace.com`;
  const submittedAt    = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane' });

  // ── Score / profile summary ────────────────────────────────────────────
  const profile = buildProfile({ interests, experience, strengths });

  // ── Email to Jordan ───────────────────────────────────────────────────
  const adminHtml = renderAdminEmail({
    fullName, displayName, requestedEmail, role,
    interests, experience, strengths, notes, profile, submittedAt,
  });

  // ── Confirmation to new member (if they provided a personal email) ─────
  const personalEmail = req.body.personalEmail;

  try {
    await transporter.sendMail({
      from:    FROM_ADDR,
      to:      NOTIFY_TO,
      subject: `🧑‍💼 New member request: ${fullName} — ${requestedEmail}`,
      html:    adminHtml,
    });

    if (personalEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      await transporter.sendMail({
        from:    FROM_ADDR,
        to:      personalEmail,
        subject: 'Welcome to PaceySpace — Your request has been received',
        html:    renderConfirmationEmail({ fullName, requestedEmail }),
      });
    }

    res.json({ success: true, message: 'Profile submitted successfully.' });
  } catch (err) {
    console.error('Mail error:', err.message);
    // Still return success to the user — log the submission
    console.log('PROFILE SUBMISSION (mail failed):', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Profile recorded. You will be contacted shortly.' });
  }
});

// ── Profile scoring ───────────────────────────────────────────────────────
function buildProfile({ interests, experience, strengths }) {
  // Map interests to capability domains
  const domainWeights = {
    creative:    0,
    technical:   0,
    operational: 0,
    relational:  0,
    strategic:   0,
  };

  const interestDomainMap = {
    // Creative
    'Graphic Design': 'creative', 'UI/UX Design': 'creative', 'Motion Design': 'creative',
    'Illustration': 'creative', 'Art Direction': 'creative', 'Photography': 'creative',
    'Videography': 'creative', 'Branding': 'creative', 'Typography': 'creative',
    '3D Design': 'creative',
    // Technical
    'Software Development': 'technical', 'Systems Administration': 'technical',
    'DevOps & Infrastructure': 'technical', 'Systems Implementation': 'technical',
    'Networking': 'technical', 'Cybersecurity': 'technical', 'Data Engineering': 'technical',
    'AI & Machine Learning': 'technical', 'Web Development': 'technical',
    'Mobile Development': 'technical', 'Database Administration': 'technical',
    'Quality Assurance': 'technical', 'Embedded Systems': 'technical',
    // Operational
    'Project Management': 'operational', 'Process Optimisation': 'operational',
    'Documentation': 'operational', 'Customer Support': 'relational',
    'Customer Service': 'relational', 'Business Analysis': 'operational',
    // Relational
    'Consultation': 'relational', 'Client Relations': 'relational',
    'Sales': 'relational', 'Community Management': 'relational',
    'Training & Mentorship': 'relational', 'HR & Recruitment': 'relational',
    // Strategic
    'Business Strategy': 'strategic', 'Product Management': 'strategic',
    'Research': 'strategic', 'Marketing': 'strategic', 'Content Strategy': 'strategic',
    'Copywriting': 'strategic', 'Brand Strategy': 'strategic',
  };

  interests.forEach(i => {
    const domain = interestDomainMap[i] || 'operational';
    domainWeights[domain] += 1;
  });

  // Experience level weight
  const levelMultiplier = {
    'Beginner': 0.5, 'Intermediate': 1.0, 'Advanced': 1.5, 'Expert': 2.0,
  };
  const lvl = levelMultiplier[experience.level] || 1.0;

  // Strength bonuses
  strengths.forEach(s => {
    const domain = interestDomainMap[s] || 'operational';
    domainWeights[domain] += 0.5;
  });

  // Apply experience multiplier to dominant domain
  const dominant = Object.entries(domainWeights).sort((a, b) => b[1] - a[1])[0];

  // Build persona label
  const personas = {
    creative:    'Creative Specialist',
    technical:   'Technical Expert',
    operational: 'Operations & Process',
    relational:  'People & Client Facing',
    strategic:   'Strategic Thinker',
  };

  return {
    domains: domainWeights,
    persona: personas[dominant[0]] || 'Generalist',
    experienceLevel: experience.level || 'Not specified',
    interestCount: interests.length,
    strengthCount: strengths.length,
  };
}

// ── Email templates ──────────────────────────────────────────────────────
function renderAdminEmail({ fullName, displayName, requestedEmail, role,
  interests, experience, strengths, notes, profile, submittedAt }) {
  const interestChips = interests.map(i =>
    `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px 2px;">${i}</span>`
  ).join('');

  const strengthChips = strengths.map(s =>
    `<span style="display:inline-block;background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px 2px;">${s}</span>`
  ).join('');

  const domainBars = Object.entries(profile.domains)
    .sort((a, b) => b[1] - a[1])
    .map(([d, v]) => {
      const max = Math.max(...Object.values(profile.domains), 1);
      const pct = Math.round((v / max) * 100);
      const colours = { creative: '#8b5cf6', technical: '#3b82f6', operational: '#f59e0b', relational: '#10b981', strategic: '#ef4444' };
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#374151;margin-bottom:3px;">
            <span style="text-transform:capitalize;">${d}</span><span>${v} pts</span>
          </div>
          <div style="background:#e5e7eb;border-radius:4px;height:8px;">
            <div style="background:${colours[d]};width:${pct}%;height:8px;border-radius:4px;"></div>
          </div>
        </div>`;
    }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Inter',sans-serif;background:#f9fafb;margin:0;padding:20px;">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.07);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;color:white;">
    <h1 style="margin:0;font-size:24px;font-weight:700;">🧑‍💼 New Member Request</h1>
    <p style="margin:8px 0 0;opacity:.85;">${submittedAt}</p>
  </div>

  <div style="padding:32px;">
    <!-- Identity -->
    <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
      <tr><td style="padding:10px;font-weight:600;color:#6b7280;width:160px;">Full Name</td>
          <td style="padding:10px;font-size:17px;font-weight:700;">${fullName}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:600;color:#6b7280;">Display Name</td>
          <td style="padding:10px;">${displayName}</td></tr>
      <tr><td style="padding:10px;font-weight:600;color:#6b7280;">Requested Email</td>
          <td style="padding:10px;font-family:monospace;color:#6366f1;font-weight:600;">${requestedEmail}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px;font-weight:600;color:#6b7280;">Role</td>
          <td style="padding:10px;">${role}</td></tr>
      <tr><td style="padding:10px;font-weight:600;color:#6b7280;">Experience</td>
          <td style="padding:10px;">${experience.level || '—'} · ${experience.years || '—'} yrs · ${experience.background || '—'}</td></tr>
    </table>

    <!-- Profile summary -->
    <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:20px;margin-bottom:24px;">
      <h3 style="margin:0 0 4px;color:#4338ca;font-size:16px;">🧠 Work Profile</h3>
      <p style="margin:0 0 16px;font-size:24px;font-weight:700;color:#312e81;">
        ${profile.persona}
        <span style="font-size:13px;font-weight:400;color:#6366f1;margin-left:8px;">${profile.experienceLevel}</span>
      </p>
      ${domainBars}
    </div>

    <!-- Interests -->
    <h3 style="font-size:14px;font-weight:600;color:#6b7280;margin:0 0 10px;text-transform:uppercase;letter-spacing:.5px;">Areas of Interest</h3>
    <div style="margin-bottom:24px;">${interestChips || '<em style="color:#9ca3af;">None selected</em>'}</div>

    <!-- Strengths -->
    <h3 style="font-size:14px;font-weight:600;color:#6b7280;margin:0 0 10px;text-transform:uppercase;letter-spacing:.5px;">Top Strengths</h3>
    <div style="margin-bottom:24px;">${strengthChips || '<em style="color:#9ca3af;">None selected</em>'}</div>

    ${notes ? `<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:24px;">
      <h3 style="margin:0 0 8px;color:#92400e;font-size:14px;">Notes</h3>
      <p style="margin:0;color:#78350f;">${notes}</p>
    </div>` : ''}

    <!-- CTA -->
    <div style="text-align:center;margin-top:24px;">
      <a href="https://mail.pspace" style="display:inline-block;background:#6366f1;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
        Create Email Account →
      </a>
    </div>
  </div>
  <div style="padding:16px 32px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center;">
    PaceySpace Onboarding System — submitted via onboarding.pspace
  </div>
</div>
</body></html>`;
}

function renderConfirmationEmail({ fullName, requestedEmail }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:'Inter',sans-serif;background:#f9fafb;margin:0;padding:20px;">
<div style="max-width:540px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.07);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;color:white;text-align:center;">
    <h1 style="margin:0;font-size:22px;">Welcome to PaceySpace! 🎉</h1>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="font-size:16px;color:#374151;">Hi <strong>${fullName}</strong>,</p>
    <p style="color:#6b7280;">Your request for a PaceySpace email address has been received.</p>
    <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Requested address</p>
      <p style="margin:4px 0 0;font-size:20px;font-family:monospace;color:#6366f1;font-weight:700;">${requestedEmail}</p>
    </div>
    <p style="color:#6b7280;font-size:14px;">You'll receive your credentials within 24 hours. The team will be in touch.</p>
  </div>
  <div style="padding:16px;background:#f9fafb;font-size:12px;color:#9ca3af;text-align:center;">PaceySpace · Internal Network</div>
</div>
</body></html>`;
}

// ── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Onboarding backend running on :${PORT}`);
  transporter.verify().then(() =>
    console.log('SMTP connection verified ✓')
  ).catch(e =>
    console.warn('SMTP not available (will log submissions):', e.message)
  );
});
