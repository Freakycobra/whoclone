# ConnectNow — Complete Deployment Guide
### Zero to Play Store, step by step. No coding experience needed.

---

## OVERVIEW — What You're Deploying

| Part | What it is | Where it runs |
|---|---|---|
| Mobile App | React Native (Expo) | Android phone / Play Store |
| Backend API | Node.js + Socket.IO | Railway.app (free tier) |
| Database | PostgreSQL | Supabase (free tier) |
| Video calls | Agora.io | Agora's cloud |

**Total cost to start: ~$0–25/month**

---

## PHASE 1 — Set Up Accounts (Day 1, ~2 hours)

### Step 1: Agora.io (Video calls — FREE)
1. Go to **agora.io** → Sign Up (free)
2. Create a new Project
3. Copy your **App ID** (looks like: `a1b2c3d4e5f6...`)
4. Enable **Token Authentication** → copy **App Certificate**
5. Paste into: `mobile/src/constants/index.js` → `AGORA_APP_ID`

### Step 2: Firebase (Phone OTP auth — FREE)
1. Go to **console.firebase.google.com** → Create project → name it "ConnectNow"
2. Authentication → Sign-in method → Enable **Phone**
3. Enable **Google** sign-in too
4. Project Settings → Add Android app → package name: `com.connectnow.app`
5. Download `google-services.json` → put it in `mobile/android/app/`

### Step 3: Supabase (Database — FREE up to 500MB)
1. Go to **supabase.com** → New project
2. Create project: "connectnow-db" (save your password!)
3. Go to SQL Editor → paste the entire contents of `backend/schema.sql` → Run
4. Settings → Database → copy **Connection String** (URI format)
5. Paste into `backend/.env` → `DATABASE_URL=...`

### Step 4: Railway.app (Backend hosting — FREE $5 credit/month)
1. Go to **railway.app** → Sign up with GitHub
2. New Project → Deploy from GitHub repo (we'll push code there)
3. Add environment variables from `backend/.env.example`
4. Your backend URL will be: `https://connectnow-api.up.railway.app`
5. Update `mobile/src/constants/index.js` → `API_BASE_URL`

### Step 5: Google Play Developer ($25 one-time)
1. Go to **play.google.com/console** → Create account
2. Pay $25 registration fee
3. Create new app → "ConnectNow" → Android → Free → Developer content policy
4. Keep this tab open — you'll come back to upload your APK

### Step 6: Stripe (Web payments — Free, takes 2.9% per transaction)
1. Go to **stripe.com** → Create account
2. Dashboard → Developers → API Keys → copy Secret Key
3. Paste into `backend/.env` → `STRIPE_SECRET_KEY=sk_live_...`

---

## PHASE 2 — Push Code to GitHub (30 minutes)

### Install Git on your computer
- Windows: download from **git-scm.com**
- Mac: already installed (open Terminal, type `git --version`)

### Push to GitHub
```bash
# 1. Create account on github.com
# 2. Create new repository called "connectnow"
# 3. Open Terminal/Command Prompt in the connectnow folder

cd /path/to/connectnow/backend
git init
git add .
git commit -m "Initial ConnectNow backend"
git remote add origin https://github.com/YOUR_USERNAME/connectnow.git
git push -u origin main
```

### Connect Railway to GitHub
1. In Railway → New Project → Deploy from GitHub
2. Select your `connectnow` repo
3. Point to `backend/` folder as root
4. Add all env variables from `.env.example`
5. Deploy! ✅

---

## PHASE 3 — Build the Android APK (2 hours)

### Install Required Software (one-time)
1. Download **Node.js** from nodejs.org (LTS version)
2. Open Terminal and run:
```bash
npm install -g expo-cli eas-cli
```

### Set Up EAS Build (Expo's build service — FREE)
```bash
# 1. Create account at expo.dev
# 2. In Terminal:
cd connectnow/mobile
npx eas login
npx eas build:configure
```

### Build Android APK
```bash
# This builds in Expo's cloud — no Android Studio needed!
npx eas build --platform android --profile preview
```
- Wait 10-15 minutes
- Expo sends you a download link for the `.apk` file
- ✅ You have an Android APK!

### Test on Your Phone First
1. Download the `.apk` to your Android phone
2. Settings → Security → Allow "Install from unknown sources"
3. Open the `.apk` file to install
4. Test everything works before submitting to Play Store

---

## PHASE 4 — Submit to Play Store

### Prepare Store Listing
1. Screenshots: Take 3-5 screenshots of the app on your phone
2. Feature graphic: 1024x500px banner (use **Canva.com** — free)
3. App icon: 512x512px (already in `assets/icon.png`)
4. Short description (80 chars): "Meet strangers worldwide via live video chat"
5. Full description: (see template below)

### App Description Template
```
ConnectNow — Meet New People via Live Video Chat

Connect instantly with real people around the world through live video chat. One tap and you're matched — no sign-up maze, no waiting.

✨ WHAT YOU CAN DO:
• Random 1v1 video chat with people globally
• Skip to the next person anytime
• Send virtual gifts during chats
• Go live and build your own audience
• Earn diamonds from gifts — withdraw as real money

💎 VIP FEATURES:
• Match by gender — your choice
• Filter by country
• Zero ads
• 3x faster matching
• Daily bonus coins

🌍 Available in India, Bangladesh, Indonesia, Philippines & worldwide

18+ only. Strong AI moderation for a safe experience.
```

### Submit to Play Store
1. Play Console → Your app → Production → Create new release
2. Upload your `.aab` file (use `eas build --platform android` for `.aab`)
3. Fill in release notes: "First release of ConnectNow"
4. Submit for review
5. Google reviews in **1-3 days**

---

## PHASE 5 — Go Live Checklist

Before launching:
- [ ] Backend deployed on Railway and responding at `/health`
- [ ] Supabase DB tables created (run schema.sql)
- [ ] Agora App ID set in `constants/index.js`
- [ ] API_BASE_URL updated to your Railway URL
- [ ] Test OTP flow works (Firebase phone auth)
- [ ] Test video chat connects (Agora)
- [ ] Test coin purchase (Stripe sandbox first)
- [ ] App passes Play Store review
- [ ] Age gate works (18+ check)
- [ ] Report user button works

---

## SERVICES PRICING AT SCALE

| Users | Monthly Cost |
|---|---|
| 0-1,000 | ~$0 (free tiers) |
| 1,000-10,000 | ~$20-50/month |
| 10,000-100,000 | ~$200-800/month |
| 100,000+ | Negotiate enterprise deals |

**Agora video costs:** ~$1.49/1,000 minutes (your biggest cost at scale)

---

## NEED HELP?

Common issues:
- **OTP not received**: Check Twilio account balance / Firebase limits
- **Video not connecting**: Double-check Agora App ID and App Certificate
- **App rejected by Play Store**: Common reasons — age gate missing, permissions not justified, content policy

Resources:
- Agora docs: docs.agora.io
- Expo build docs: docs.expo.dev/build/introduction
- Railway docs: docs.railway.app
- Supabase docs: supabase.com/docs

---

*Built with ConnectNow v1.0 — by Runable AI*
