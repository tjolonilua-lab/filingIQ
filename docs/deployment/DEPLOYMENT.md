# Deployment Guide

This guide covers deploying the Tax Intake SaaS platform to Vercel and connecting it to your main website.

---

## 1. Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))

### Step 1: Push to GitHub

1. Create a new repository on GitHub (e.g., `tax-intake-saas`)
2. Initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tax-intake-saas.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click **"Deploy"**

### Step 3: Configure Environment Variables

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add the following variables:

**Required Business Branding:**
```
BUSINESS_NAME=Your Tax Service Name
BUSINESS_EMAIL=info@yourdomain.com
BUSINESS_PHONE=(555) 123-4567
BUSINESS_WEBSITE=yourdomain.com
MAIN_WEBSITE_URL=https://www.yourdomain.com
PRIMARY_COLOR=#1e3a5f
ACCENT_COLOR=#22c55e
```

**Required Business Configuration:**
```
ENABLE_AI_ANALYSIS=false  # Set to 'true' for Full Version with AI analysis
ADMIN_PASSWORD=your_secure_password_here  # Password for admin dashboard
```

**Optional Services:**
```
# OpenAI (required if ENABLE_AI_ANALYSIS=true)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o

# AWS S3 (optional, for cloud storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Resend (optional, for email notifications)
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_TO_EMAIL=info@yourdomain.com

# App Configuration
NEXT_PUBLIC_SITE_URL=https://intake.yourdomain.com
```

3. Click **"Save"** for each variable
4. Redeploy your project to apply changes

### Step 4: Build and Deploy

Vercel will automatically:
- Build your Next.js app
- Deploy to a production URL (e.g., `your-project.vercel.app`)

You can trigger a new deployment by:
- Pushing to the main branch
- Clicking **"Redeploy"** in the Vercel dashboard

---

## 2. Connect `intake.flo-financial.com` Subdomain

### Step 1: Add Domain in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Enter `intake.yourdomain.com` (replace with your actual domain)
3. Click **"Add"**

### Step 2: Configure DNS

Vercel will show you DNS configuration instructions. You'll need to add a CNAME record:

1. Log into your domain registrar (where you manage your main domain)
2. Navigate to DNS settings
3. Add a new CNAME record:
   - **Name/Host**: `intake`
   - **Value/Target**: `cname.vercel-dns.com` (or the value Vercel provides)
   - **TTL**: 3600 (or default)

### Step 3: Verify Domain

1. Wait for DNS propagation (can take a few minutes to 48 hours)
2. Vercel will automatically verify the domain
3. SSL certificate will be automatically provisioned

### Step 4: Test URL

Once DNS propagates, test:
- `https://intake.yourdomain.com` should load your microsite

---

## 3. Link from Your Main Website

### Step 1: Edit Your Main Website

1. Log into your website platform (Wix, WordPress, etc.)
2. Go to **Editor** for your main website

### Step 2: Add Button/Link

**Option A: Add a Button**
1. Drag a **Button** element onto your page
2. Set button text: "Start Your Tax Intake"
3. Click the button → **Settings** → **Link**
4. Choose **"Web Address"**
5. Enter: `https://intake.yourdomain.com`
6. Click **"Done"**

**Option B: Add to Navigation Menu**
1. Click on your site's navigation menu
2. Add a new menu item: "Tax Intake"
3. Link to: `https://intake.flo-financial.com`

**Option C: Add to Footer**
1. Scroll to your site footer
2. Add a text link: "Start Your Tax Intake"
3. Link to: `https://intake.flo-financial.com`

### Step 3: Style the Button (Optional)

- Match your site's color scheme
- Use green (`#22c55e`) or gold (`#d4af37`) to match the microsite
- Ensure it's clearly visible and accessible

### Step 4: Publish

1. Click **"Publish"** in Wix
2. Test the link on your live site

---

## 4. Testing Checklist

After deployment, verify:

**Public Site:**
- [ ] Landing page loads at `https://intake.yourdomain.com`
- [ ] "Start Your Tax Intake" button works
- [ ] Multi-step form functions correctly
- [ ] File upload works (test with a small PDF)
- [ ] Form submission succeeds
- [ ] Thank you page displays
- [ ] Email notification received (or console log if Resend not configured)
- [ ] Intake data saved to `/data/intakes/` (or S3 if configured)
- [ ] Link from Wix site works correctly
- [ ] Mobile responsive design works

**AI Analysis (if enabled):**
- [ ] Documents are analyzed after upload
- [ ] Analysis results appear in Step 5 (if ENABLE_AI_ANALYSIS=true)
- [ ] Analysis data is stored with submissions

**Admin Dashboard:**
- [ ] Admin dashboard accessible at `https://intake.yourdomain.com/admin`
- [ ] Login with `ADMIN_PASSWORD` works
- [ ] Submissions list displays correctly
- [ ] Individual submission details view works
- [ ] AI analysis results visible in detail view (if enabled)

---

## 5. Optional: Set Up S3 for File Storage

### Create S3 Bucket

1. Log into AWS Console
2. Go to S3 → Create bucket
3. Name: `your-business-intakes` (or your preferred name)
4. Region: `us-east-1` (or your preferred region)
5. Uncheck "Block all public access" (or configure bucket policy for private access)
6. Create bucket

### Configure Bucket Policy (if needed)

For private uploads, ensure your bucket policy allows PutObject from your Vercel deployment.

### Add IAM User

1. Create IAM user with programmatic access
2. Attach policy: `AmazonS3FullAccess` (or create custom policy for specific bucket)
3. Save Access Key ID and Secret Access Key
4. Add these to Vercel environment variables

---

## 6. Optional: Set Up Resend for Email

### Create Resend Account

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (optional, or use Resend's domain)
3. Get your API key from dashboard

### Add to Vercel

1. Add `RESEND_API_KEY` to Vercel environment variables
2. Set `RESEND_FROM_EMAIL` (must be verified domain or Resend domain)
3. Set `RESEND_TO_EMAIL` to your business email
4. Redeploy

---

## 7. Troubleshooting

### DNS Not Resolving
- Wait up to 48 hours for DNS propagation
- Use [whatsmydns.net](https://www.whatsmydns.net) to check propagation
- Verify CNAME record is correct

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally

### File Upload Fails
- Check S3 credentials if using S3
- Verify `/uploads` directory exists if using local storage
- Check file size limits (10MB per file)

### Email Not Sending
- Verify Resend API key is correct
- Check Resend dashboard for errors
- Check Vercel function logs for console output

---

## 8. Maintenance

### Updating the Site

1. Make changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Vercel will automatically redeploy

### Monitoring

- Check Vercel dashboard for deployment status
- Monitor function logs for errors
- Review intake submissions in `/data/intakes/` or S3

---

## Support

For issues:
- Check Vercel logs: Project → Deployments → View Function Logs
- Check Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)

