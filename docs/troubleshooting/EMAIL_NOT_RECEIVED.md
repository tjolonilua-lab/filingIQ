# Email Not Received - Troubleshooting Guide

If you see "Email sent successfully" but don't receive the email, follow these steps:

---

## Step 1: Check Spam/Junk Folder

**Most common issue!** Emails from test domains often go to spam.

1. Check your **Spam** or **Junk** folder
2. Check **Promotions** tab (Gmail)
3. Search for "FilingIQ" or "Reset Your Password"
4. Mark as "Not Spam" if found

---

## Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **"View Function Logs"**
4. Look for log entries with:
   - `Password reset email sent via Resend` ✅ (email was sent)
   - `Resend email failed` ❌ (email failed to send)
   - `Error sending password reset email` ❌ (error occurred)

**What to look for:**
- `hasResendKey: true` - Resend API key is configured
- `fromEmail: noreply@onboarding.resend.dev` - Using test domain
- Any error messages

---

## Step 3: Check Resend Dashboard

1. Go to [resend.com/dashboard](https://resend.com/dashboard)
2. Click **"Logs"** in the sidebar
3. Look for recent emails sent to your address
4. Check the status:
   - ✅ **Delivered** - Email was sent (check spam!)
   - ⚠️ **Bounced** - Email address invalid
   - ❌ **Failed** - Check error message

**If you see emails in Resend logs but not in inbox:**
- Email is being sent correctly
- Likely in spam or blocked by email provider

---

## Step 4: Verify Environment Variables

Check Vercel → Settings → Environment Variables:

**Required:**
- ✅ `RESEND_API_KEY` - Should start with `re_`
- ✅ `RESEND_FROM_EMAIL` - Should be `noreply@onboarding.resend.dev` for testing

**Optional but helpful:**
- `NEXT_PUBLIC_SITE_URL` - Your Vercel app URL (e.g., `https://your-app.vercel.app`)

---

## Step 5: Test with Different Email

Try requesting a password reset with:
1. A different email address (Gmail, Outlook, etc.)
2. Check if that one arrives
3. This helps identify if it's email-specific

---

## Step 6: Verify Account Exists

The system always says "Email sent successfully" (for security), but:
- If the email doesn't exist in the database, no email is actually sent
- Check Vercel logs for: `Password reset requested for non-existent email`

**To verify:**
1. Make sure you signed up with that email
2. Check the database to confirm the account exists

---

## Step 7: Check Email Address Format

Make sure:
- Email is correctly formatted (e.g., `user@example.com`)
- No typos in the email address
- Using the same email you signed up with

---

## Common Issues & Solutions

### Issue: "Resend email failed" in logs

**Possible causes:**
1. Invalid API key
   - **Solution:** Regenerate API key in Resend dashboard
   - Update `RESEND_API_KEY` in Vercel
   - Redeploy

2. Invalid FROM email
   - **Solution:** Use `noreply@onboarding.resend.dev` for testing
   - Or verify your domain in Resend

3. Rate limiting
   - **Solution:** Wait a few minutes and try again
   - Check Resend dashboard for rate limits

### Issue: Email in Resend logs but not inbox

**Solutions:**
1. Check spam folder (most common)
2. Add `noreply@onboarding.resend.dev` to contacts
3. Check email provider's spam filters
4. Try a different email provider (Gmail, Outlook, etc.)

### Issue: Wrong reset URL in email

**Check:**
- `NEXT_PUBLIC_SITE_URL` is set correctly in Vercel
- Should be: `https://your-app.vercel.app` (with https://)
- Or your custom domain if configured

**Fix:**
- Add `NEXT_PUBLIC_SITE_URL` to Vercel environment variables
- Redeploy

---

## Quick Debug Checklist

- [ ] Checked spam/junk folder
- [ ] Checked Vercel function logs
- [ ] Checked Resend dashboard logs
- [ ] Verified `RESEND_API_KEY` is set
- [ ] Verified `RESEND_FROM_EMAIL` is set
- [ ] Verified account exists in database
- [ ] Tried different email address
- [ ] Checked email address for typos
- [ ] Added `NEXT_PUBLIC_SITE_URL` if using custom domain

---

## Still Not Working?

1. **Check Vercel Logs:**
   - Look for detailed error messages
   - Check if Resend API key is being read

2. **Check Resend Dashboard:**
   - Verify API key is active
   - Check for any account issues
   - Review delivery logs

3. **Test Resend Directly:**
   - Use Resend's test email feature
   - Verify your API key works

4. **Contact Support:**
   - Resend support: support@resend.com
   - Check Resend status page for outages

---

## Expected Behavior

**When working correctly:**
1. User requests password reset
2. System creates reset token
3. Email sent via Resend
4. Vercel logs show: `Password reset email sent via Resend`
5. Resend logs show: Email delivered
6. User receives email (may be in spam)

**If email doesn't arrive:**
- Check spam folder first
- Check Vercel logs for errors
- Check Resend logs for delivery status

---

**Most emails are in spam when using test domain!** Check spam folder first. 📧
