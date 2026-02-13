# Setup Required for Perfect 10/10 Features

To fully enable all the new security and monitoring features, you need to install a few dependencies and set environment variables.

---

## 📦 Install Dependencies

```bash
npm install jose
```

**Optional (for error monitoring):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 🔐 Environment Variables

Add these to your Vercel project settings:

### Required

1. **`JWT_SECRET`** - Secret key for signing JWT session tokens
   - Generate a secure random string: `openssl rand -base64 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - **Important:** Use a strong, unique secret in production!

### Optional (but recommended)

2. **`SENTRY_DSN`** - Sentry DSN for error monitoring
   - Sign up at https://sentry.io
   - Create a project
   - Copy the DSN
   - Add to Vercel environment variables

---

## ✅ What's Already Working

Even without these dependencies, the codebase will work:
- ✅ Rate limiting (in-memory, works for single server)
- ✅ Session management (will work once `jose` is installed)
- ✅ Sentry integration (gracefully degrades if not configured)
- ✅ All other features work immediately

---

## 🚀 Quick Start

1. **Install jose:**
   ```bash
   npm install jose
   ```

2. **Set JWT_SECRET in Vercel:**
   - Go to your Vercel project → Settings → Environment Variables
   - Add `JWT_SECRET` with a secure random string
   - Redeploy

3. **Test:**
   - Try logging in
   - Check that httpOnly cookie is set
   - Verify rate limiting works (try 6 login attempts)

---

## 📝 Notes

- The `jose` package is needed for JWT signing/verification
- Without it, session management won't work (but everything else will)
- Sentry is completely optional - errors will still be logged to console
- Rate limiting works in-memory (perfect for single-server deployments)

---

**Once you install `jose` and set `JWT_SECRET`, you'll have full 10/10 functionality!** ✅
