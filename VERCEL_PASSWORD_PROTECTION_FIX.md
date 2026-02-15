# How to Remove Vercel Password Protection

If you're seeing a browser authentication prompt asking for username/password, here's how to fix it:

## Step 1: Check Preview Deployment Protection

The settings you showed are for **Runtime Settings**, but password protection might be set at the **Preview Deployment** level:

1. Go to **Vercel Dashboard** → Your Project
2. Click on **Settings** (gear icon)
3. Go to **Deployments** section
4. Look for **"Preview Deployment Protection"** or **"Password Protection"**
5. Make sure it's **disabled**

## Step 2: Check Project-Level Settings

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Scroll to **"Deployments"** section
3. Look for:
   - **"Password Protection"**
   - **"Deployment Protection"**
   - **"Preview Protection"**
4. Disable all of them

## Step 3: Check the Specific Deployment

If it's a specific deployment (not production):

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the deployment that's asking for password
3. Look for **"..."** menu or **Settings** icon
4. Check for **"Password Protection"** or **"Deployment Protection"**
5. Disable it

## Step 4: Check Team/Organization Settings

Sometimes it's set at the team level:

1. Go to **Vercel Dashboard** → **Settings** (top right)
2. Go to **Team** or **Organization** settings
3. Look for deployment protection settings
4. Disable if found

## Step 5: Force a New Deployment

After disabling:
1. Make a small change (or just trigger a redeploy)
2. Wait for the new deployment
3. Try accessing the new deployment URL

## Alternative: Use Production Domain

If you have a production domain configured:
- Use your production domain instead of the preview URL
- Production deployments typically don't have password protection

## Still Not Working?

If you still see the prompt after disabling all settings:
1. Clear browser cache
2. Try incognito/private mode
3. Try a different browser
4. Check if it's a browser extension causing it
5. Contact Vercel support if the issue persists
