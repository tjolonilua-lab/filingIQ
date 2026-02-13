# Vercel Environment Variables Setup

To enable full functionality, you need to set the `JWT_SECRET` environment variable in Vercel.

---

## 🔐 Step 1: Generate JWT Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Or use Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Copy the generated string** - you'll need it in the next step.

---

## 📝 Step 2: Add to Vercel

1. Go to your Vercel dashboard: https://vercel.com
2. Select your **FilingIQ** project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key:** `JWT_SECRET`
   - **Value:** (paste the generated secret from Step 1)
   - **Environment:** Select **Production**, **Preview**, and **Development** (or just Production if you prefer)
6. Click **Save**

---

## 🔄 Step 3: Redeploy

After adding the environment variable:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Or simply push a new commit to trigger automatic deployment

---

## ✅ Verification

After deployment, test:

1. **Login** - Should create an httpOnly cookie session
2. **Check browser DevTools** → Application → Cookies
   - You should see a `session` cookie
   - It should be marked as `HttpOnly` and `Secure`
3. **Test rate limiting** - Try 6 login attempts quickly
   - Should get rate limited after 5 attempts

---

## 🔍 Optional: Sentry Setup (Error Monitoring)

If you want error monitoring:

1. Sign up at https://sentry.io (free tier available)
2. Create a new project (Next.js)
3. Copy the DSN
4. Add to Vercel as `SENTRY_DSN`
5. Run: `npx @sentry/wizard@latest -i nextjs`
6. Commit and push the Sentry config files

---

## 📋 Current Environment Variables Checklist

**Required:**
- ✅ `POSTGRES_URL` - Database connection
- ✅ `AWS_ACCESS_KEY_ID` - S3 access
- ✅ `AWS_SECRET_ACCESS_KEY` - S3 secret
- ✅ `AWS_S3_BUCKET` - S3 bucket name
- ✅ `AWS_REGION` - S3 region
- ⚠️ `JWT_SECRET` - **ADD THIS NOW** (for session management)

**Optional but Recommended:**
- `RESEND_API_KEY` - Email notifications
- `RESEND_FROM_EMAIL` - Email sender
- `RESEND_TO_EMAIL` - Email recipient
- `OPENAI_API_KEY` - AI document analysis
- `ENABLE_AI_ANALYSIS` - Set to `true` to enable AI
- `SENTRY_DSN` - Error monitoring

---

**Once you add `JWT_SECRET` and redeploy, you'll have full 10/10 functionality!** ✅
