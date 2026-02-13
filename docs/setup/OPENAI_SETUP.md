# OpenAI API Setup Guide

This guide walks you through setting up OpenAI API for AI-powered document analysis in FilingIQ.

---

## Step 1: Create OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Click **"Sign Up"** or **"Log In"**
3. Sign up with your email or Google/Microsoft account
4. Verify your email address if prompted
5. Complete any identity verification required

---

## Step 2: Add Payment Method

⚠️ **Important:** OpenAI requires a payment method to use the API (even for free credits).

1. Go to **Settings** → **Billing**
2. Click **"Add Payment Method"**
3. Add a credit card or PayPal account
4. **Note:** You'll get $5 in free credits to start (as of 2025)

---

## Step 3: Get Your API Key

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Give it a name (e.g., "FilingIQ Production")
4. Click **"Create secret key"**
5. **Copy the API key immediately** - you won't be able to see it again!
   - It will look like: `sk-proj-1234567890abcdefghijklmnopqrstuvwxyz`

⚠️ **Important:** Save this key securely. You'll need it for the next step.

---

## Step 4: Check Your Usage Limits

1. Go to **Settings** → **Limits**
2. Review your rate limits:
   - **Free tier:** Usually 3 requests/minute, 200 requests/day
   - **Paid tier:** Higher limits based on usage
3. For production use, you may want to increase limits:
   - Go to **Settings** → **Billing** → **Usage limits**
   - Set spending limits to control costs

---

## Step 5: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Variables:

```
OPENAI_API_KEY = sk-proj-1234567890abcdefghijklmnopqrstuvwxyz
```
(Replace with your actual API key from Step 3)

```
ENABLE_AI_ANALYSIS = true
```
(Set to `true` to enable AI document analysis)

### Optional Variables (with defaults):

```
OPENAI_MODEL = gpt-4o
```
- **Recommended:** `gpt-4o` (best quality, supports vision)
- **Alternative:** `gpt-4o-mini` (faster, cheaper, still supports vision)
- **Default:** `gpt-4o` if not set

```
OPENAI_MAX_TOKENS = 2000
```
- Maximum tokens in response (default: 2000)
- Increase for longer analysis (costs more)

```
OPENAI_TEMPERATURE = 0.1
```
- Controls randomness (default: 0.1 for consistent extraction)
- Lower = more consistent, Higher = more creative

4. **Important:** Select all environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Click **"Save"** for each variable

---

## Step 6: Redeploy

After adding environment variables, you must redeploy:

1. Go to **Deployments** in Vercel
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

---

## Step 7: Test AI Analysis

### Test Document Analysis:

1. Go to your deployed site
2. Complete an intake form with a tax document (W-2, 1099, etc.)
3. Upload a document (PDF, PNG, or JPEG)
4. Submit the form
5. Check the admin dashboard → Client details
6. You should see:
   - Document type identified
   - Extracted data (amounts, dates, etc.)
   - Tax strategy recommendations
   - Confidence scores

### What Gets Analyzed:

- **Document Types:** W-2, 1099-NEC, 1099-K, 1099-INT, 1099-DIV, Schedule C, etc.
- **Extracted Data:**
  - Monetary amounts (wages, income, deductions, taxes withheld)
  - Employer/payer names
  - Tax year
  - Important dates
  - Recipient information (SSN masked for privacy)
- **Tax Strategies Identified:**
  - Retirement contribution opportunities
  - Deduction maximization
  - Income timing opportunities
  - Tax-advantaged investments
  - Business expense optimization
  - Estimated tax planning

---

## OpenAI Pricing

### GPT-4o (Recommended)
- **Input:** $2.50 per 1M tokens
- **Output:** $10.00 per 1M tokens
- **Average cost per document:** ~$0.01 - $0.05 per analysis

### GPT-4o-mini (Budget Option)
- **Input:** $0.15 per 1M tokens
- **Output:** $0.60 per 1M tokens
- **Average cost per document:** ~$0.001 - $0.005 per analysis

### Cost Estimation:
- **100 documents/month:** ~$1-5 (with GPT-4o) or ~$0.10-0.50 (with GPT-4o-mini)
- **1,000 documents/month:** ~$10-50 (with GPT-4o) or ~$1-5 (with GPT-4o-mini)

**Tip:** Start with GPT-4o-mini for cost savings, upgrade to GPT-4o if you need better accuracy.

---

## Troubleshooting

### Issue: "OpenAI API key not configured"

**Check:**
1. ✅ `OPENAI_API_KEY` is set in Vercel environment variables
2. ✅ `ENABLE_AI_ANALYSIS=true` is set
3. ✅ Redeployed after adding environment variables
4. ✅ API key is correct (starts with `sk-`)
5. ✅ Check Vercel function logs for errors

### Issue: "Rate limit exceeded"

**Solutions:**
1. Check your OpenAI usage limits
2. Increase rate limits in OpenAI dashboard
3. Add retry logic (already implemented in code)
4. Consider upgrading to paid tier

### Issue: "Insufficient credits"

**Solutions:**
1. Add payment method in OpenAI dashboard
2. Check billing → Usage for current balance
3. Add credits if needed

### Issue: "Analysis not appearing"

**Check:**
1. ✅ `ENABLE_AI_ANALYSIS=true` is set
2. ✅ Document was uploaded successfully
3. ✅ Check admin dashboard → Client details → AI Analysis section
4. ✅ Check Vercel function logs for analysis errors
5. ✅ Verify document format is supported (PDF, PNG, JPEG)

### Issue: "High costs"

**Solutions:**
1. Switch to `gpt-4o-mini` model (much cheaper)
2. Reduce `OPENAI_MAX_TOKENS` (default: 2000)
3. Set spending limits in OpenAI dashboard
4. Monitor usage in OpenAI dashboard → Usage

---

## Security Best Practices

1. ✅ Never commit API keys to git
2. ✅ Use environment variables only
3. ✅ Rotate API keys periodically
4. ✅ Use separate API keys for production/staging
5. ✅ Set spending limits in OpenAI dashboard
6. ✅ Monitor usage regularly
7. ✅ Use least privilege (don't share API keys)

---

## Model Comparison

### GPT-4o (Recommended)
- **Best for:** Production use, high accuracy needed
- **Vision:** ✅ Excellent
- **Speed:** Fast
- **Cost:** Higher
- **Use when:** You need the best analysis quality

### GPT-4o-mini
- **Best for:** Budget-conscious deployments
- **Vision:** ✅ Good
- **Speed:** Very fast
- **Cost:** Much lower
- **Use when:** Cost is a concern, still need good quality

---

## What Happens Without OpenAI?

If OpenAI is not configured:
- ✅ Intake form still works
- ✅ File uploads still work
- ✅ Submissions are saved
- ❌ No AI document analysis
- ❌ No tax strategy recommendations
- ❌ No extracted data from documents

The application gracefully degrades - all features work except AI analysis.

---

## Need Help?

- **OpenAI Docs:** [platform.openai.com/docs](https://platform.openai.com/docs)
- **OpenAI Support:** support@openai.com
- **Check Usage:** OpenAI Dashboard → Usage
- **Check Logs:** Vercel Dashboard → Function Logs

---

## Quick Checklist

- [ ] OpenAI account created
- [ ] Payment method added
- [ ] API key generated and copied
- [ ] `OPENAI_API_KEY` added to Vercel
- [ ] `ENABLE_AI_ANALYSIS=true` added to Vercel
- [ ] `OPENAI_MODEL` set (optional, defaults to gpt-4o)
- [ ] Project redeployed
- [ ] Tested document upload with AI analysis
- [ ] Verified analysis appears in admin dashboard
- [ ] Set spending limits in OpenAI dashboard

✅ **You're all set!** AI document analysis is now enabled.

---

## Cost Monitoring

### Set Up Usage Alerts:

1. Go to OpenAI Dashboard → Settings → Limits
2. Set **Soft limit** (warning when reached)
3. Set **Hard limit** (stops API calls when reached)
4. Monitor usage in Dashboard → Usage

### Recommended Limits for Starting:
- **Soft limit:** $10/month
- **Hard limit:** $50/month
- Adjust based on your volume

---

**Last Updated:** January 2025
