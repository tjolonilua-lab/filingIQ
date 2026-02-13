# Quick Setup Guide: OpenAI & Resend

Quick reference for setting up OpenAI API and Resend email service.

---

## 🚀 OpenAI API Setup (5 minutes)

### 1. Get API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)

### 2. Add to Vercel
Go to Vercel → Settings → Environment Variables, add:

```
OPENAI_API_KEY = sk-proj-... (your key)
ENABLE_AI_ANALYSIS = true
OPENAI_MODEL = gpt-4o
```

### 3. Redeploy
Vercel → Deployments → Redeploy

**Full Guide:** `docs/setup/OPENAI_SETUP.md`

---

## 📧 Resend Email Setup (5 minutes)

### 1. Get API Key
1. Go to [resend.com](https://resend.com)
2. Sign up / Log in
3. Go to **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### 2. Add to Vercel
Go to Vercel → Settings → Environment Variables, add:

```
RESEND_API_KEY = re_... (your key)
RESEND_FROM_EMAIL = noreply@yourdomain.com
RESEND_TO_EMAIL = info@yourdomain.com
```

**Note:** For quick testing, use `noreply@onboarding.resend.dev` as FROM email.

### 3. Redeploy
Vercel → Deployments → Redeploy

**Full Guide:** `docs/setup/RESEND_SETUP.md`

---

## ✅ Quick Test

### Test OpenAI:
1. Submit intake form with a tax document
2. Check admin dashboard → Client details
3. Should see AI analysis results

### Test Resend:
1. Go to `/forgot-password`
2. Enter your email
3. Check inbox for reset email

---

## 💰 Cost Estimates

### OpenAI:
- **GPT-4o:** ~$0.01-0.05 per document
- **GPT-4o-mini:** ~$0.001-0.005 per document (recommended for starting)

### Resend:
- **Free tier:** 3,000 emails/month
- Usually sufficient for starting

---

## 🔗 Full Documentation

- **OpenAI Setup:** `docs/setup/OPENAI_SETUP.md`
- **Resend Setup:** `docs/setup/RESEND_SETUP.md`
- **Full Deployment:** `FINAL_DEPLOYMENT_CHECKLIST.md`

---

**That's it!** Both services should be working after redeploy. 🎉
