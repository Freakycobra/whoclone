const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { moderateText, moderateImageUrl } = require('../services/moderation');

const JWT_SECRET = process.env.JWT_SECRET || 'connectnow_secret_change_in_production';

// In-memory user store (replace with PostgreSQL in production)
const users = new Map();
const otpStore = new Map(); // phone -> { otp, expiresAt }

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/otp/send
router.post('/otp/send', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  const otp = generateOTP();
  otpStore.set(phone, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min

  // In production: send via Twilio
  // await twilioClient.messages.create({ body: `Your ConnectNow OTP: ${otp}`, from: TWILIO_FROM, to: phone });

  console.log(`OTP for ${phone}: ${otp}`); // Remove in production!

  res.json({ success: true, message: 'OTP sent' });
});

// POST /auth/otp/verify
router.post('/otp/verify', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const stored = otpStore.get(phone);

  // Dev mode: accept '123456' as universal OTP
  const isValid = stored?.otp === otp || otp === '123456';
  const isExpired = stored && Date.now() > stored.expiresAt;

  if (!isValid || isExpired) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  otpStore.delete(phone);

  // Find or create user
  let user = [...users.values()].find(u => u.phone === phone);
  const isNewUser = !user;

  if (!user) {
    user = {
      id: uuidv4(),
      phone,
      coins: 100, // Welcome bonus
      diamonds: 0,
      isVip: false,
      friends: 0,
      createdAt: new Date().toISOString(),
    };
    users.set(user.id, user);
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

  res.json({ token, user, isNewUser });
});

// POST /auth/google
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  // In production: verify with Firebase Admin SDK
  // const decodedToken = await admin.auth().verifyIdToken(idToken);

  // Demo mode
  const user = {
    id: uuidv4(),
    displayName: 'Google User',
    coins: 100,
    diamonds: 0,
    isVip: false,
  };
  users.set(user.id, user);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user, isNewUser: true });
});

// POST /auth/profile/setup
router.post('/profile/setup', authMiddleware, async (req, res) => {
  const { displayName, gender, age, dob, bio, photoUrl } = req.body;
  const user = users.get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  // ── Moderate display name ────────────────────────────────────────────────
  if (displayName) {
    const nameCheck = await moderateText(displayName);
    if (!nameCheck.allowed) {
      return res.status(422).json({
        error: 'display_name_flagged',
        message: nameCheck.reason || 'Your display name violates our community guidelines. Please choose a different name.',
      });
    }
  }

  // ── Moderate bio ─────────────────────────────────────────────────────────
  if (bio && bio.trim().length > 0) {
    const bioCheck = await moderateText(bio);
    if (!bioCheck.allowed) {
      return res.status(422).json({
        error: 'bio_flagged',
        message: bioCheck.reason || 'Your bio violates our community guidelines. Please revise it.',
      });
    }
  }

  // ── Moderate profile photo ───────────────────────────────────────────────
  if (photoUrl) {
    const photoCheck = await moderateImageUrl(photoUrl);
    if (!photoCheck.allowed) {
      return res.status(422).json({
        error: 'photo_flagged',
        message: photoCheck.reason || 'Your profile photo violates our community guidelines.',
      });
    }
  }

  Object.assign(user, { displayName, gender, age, dob, bio, photoUrl, profileComplete: true });
  users.set(user.id, user);

  res.json({ user });
});

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = users.get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = router;
