# Resend Email Setup Guide

This guide walks you through setting up Resend for email notifications (intake submissions and password resets).

---

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **"Sign Up"** (or "Get Started")
3. Sign up with your email or GitHub account
4. Verify your email address if prompted

---

## Step 2: Get Your API Key

1. After logging in, go to **API Keys** in the sidebar
2. Click **"Create API Key"**
3. Give it a name (e.g., "FilingIQ Production")
4. Select permissions:
   - **Sending access** (required)
   - **Read access** (optional, for viewing logs)
5. Click **"Add"**
6. **Copy the API key immediately** - you won't be able to see it again!
   - It will look like: `re_123456789abcdefghijklmnop`

⚠️ **Important:** Save this key securely. You'll need it for the next step.

---

## Step 3: Verify Your Domain (Recommended)

### Option A: Use Your Own Domain (Recommended for Production)

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `flo-financial.com`)
4. Resend will provide DNS records to add:
   - **SPF record**
   - **DKIM record**
   - **DMARC record** (optional but recommended)
5. Add these records to your domain's DNS settings
6. Wait for verification (usually 5-15 minutes)
7. Once verified, you can use emails like `noreply@flo-financial.com`

### Option B: Use Resend's Test Domain (Quick Start)

1. Resend provides a test domain: `onboarding.resend.dev`
2. **IMPORTANT:** You must verify this domain first:
   - Go to **Domains** in Resend dashboard
   - Find `onboarding.resend.dev` (may already be listed)
   - If not verified, click to verify it (usually automatic)
   - Wait for status to show "Verified" ✅
3. Once verified, you can use emails like `noreply@onboarding.resend.dev`
4. **Note:** This is for testing only - emails may go to spam
5. For production, verify your own domain
6. **⚠️ Error Fix:** If you get a 403 "domain not verified" error, you must verify the domain in Resend before using it!

---

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Variable:

```
RESEND_API_KEY = re_123456789abcdefghijklmnop
```
(Replace with your actual API key from Step 2)

### Optional Variables (with defaults):

```
RESEND_FROM_EMAIL = noreply@yourdomain.com
```
- Use your verified domain email (e.g., `noreply@flo-financial.com`)
- Or use Resend test domain: `noreply@onboarding.resend.dev`
- Defaults to `noreply@${your-business-website}` if not set

```
RESEND_TO_EMAIL = info@yourdomain.com
```
- Where to send intake submission notifications
- Defaults to your business email from branding settings

4. **Important:** Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Click **"Save"** for each variable

---

## Step 5: Redeploy

After adding environment variables, you must redeploy:

1. Go to **Deployments** in Vercel
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## Step 6: Test Email Functionality

### Test Password Reset:

1. Go to your deployed site: `https://your-app.vercel.app/forgot-password`
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email inbox (or Resend dashboard → Logs)
5. You should receive a password reset email

### Test Intake Submission:

1. Complete a test intake form submission
2. Check the email address set in `RESEND_TO_EMAIL`
3. You should receive an intake notification email

---

## Troubleshooting

### Issue: "Email not sending"

**Check:**
1. ✅ API key is correct in Vercel environment variables
2. ✅ Domain is verified (if using custom domain)
3. ✅ `RESEND_FROM_EMAIL` uses verified domain
4. ✅ Redeployed after adding environment variables
5. ✅ Check Resend dashboard → **Logs** for error messages

### Issue: "Emails going to spam"

**Solutions:**
1. Verify your domain with SPF, DKIM, and DMARC records
2. Use a custom domain (not `onboarding.resend.dev`)
3. Warm up your domain by sending gradually
4. Check Resend dashboard for deliverability issues

### Issue: "Invalid API key"

**Solutions:**
1. Verify the API key in Vercel matches Resend dashboard
2. Check for extra spaces or characters
3. Ensure you copied the full key (starts with `re_`)
4. Create a new API key if needed

### Issue: "Domain not verified" (403 Error)

**Error Message:** `The onboarding.resend.dev domain is not verified. Please, add and verify your domain on https://resend.com/domains`

**Solutions:**
1. **For `onboarding.resend.dev`:**
   - Go to [resend.com/domains](https://resend.com/domains)
   - Find `onboarding.resend.dev` in your domains list
   - Click to verify it (verification is usually automatic)
   - Wait for status to show "Verified" ✅
   - Then retry sending the email

2. **For custom domains:**
   - Check DNS records are added correctly
   - Wait 15-30 minutes for DNS propagation
   - Use Resend's DNS checker tool
   - Verify the domain shows as "Verified" in Resend dashboard

3. **Quick fix:** If using `onboarding.resend.dev`, make sure it's verified in your Resend account before using it

---

## Resend Pricing

- **Free Tier:** 3,000 emails/month, 100 emails/day
- **Pro:** $20/month for 50,000 emails
- **Enterprise:** Custom pricing

For most tax intake services, the free tier is sufficient to start.

---

## What Emails Are Sent?

1. **Intake Submission Notifications**
   - Sent to the **account owner's email** (the user who created the account)
   - Falls back to `RESEND_TO_EMAIL` or `BUSINESS_EMAIL` if account email not available
   - Includes client contact info, filing details, and uploaded documents

2. **Password Reset Emails**
   - Sent to user's email when they request password reset
   - Contains secure reset link (expires in 1 hour)

---

## Security Best Practices

1. ✅ Never commit API keys to git
2. ✅ Use environment variables only
3. ✅ Rotate API keys periodically
4. ✅ Use separate API keys for production/staging
5. ✅ Monitor Resend dashboard for suspicious activity

---

## Need Help?

- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **Resend Support:** support@resend.com
- **Check Logs:** Resend Dashboard → Logs

---

## Quick Checklist

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Domain verified (or using test domain)
- [ ] `RESEND_API_KEY` added to Vercel
- [ ] `RESEND_FROM_EMAIL` added to Vercel (optional)
- [ ] `RESEND_TO_EMAIL` added to Vercel (optional)
- [ ] Project redeployed
- [ ] Tested password reset email
- [ ] Tested intake submission email

✅ **You're all set!** Emails will now be sent via Resend instead of console logs.
