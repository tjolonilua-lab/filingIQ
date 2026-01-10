# AWS S3 Setup Guide for Flo Financial

This guide walks you through setting up AWS S3 for persistent file storage in production.

---

## Prerequisites

- AWS account (sign up at [aws.amazon.com](https://aws.amazon.com) if you don't have one)
- Access to AWS Console
- ~15-20 minutes

---

## Step 1: Create S3 Bucket

### 1.1 Log into AWS Console

1. Go to [aws.amazon.com/console](https://aws.amazon.com/console)
2. Sign in with your AWS account
3. Navigate to **S3** service (search "S3" in the top search bar)

### 1.2 Create New Bucket

1. Click **"Create bucket"** button
2. Configure the bucket:

   **Bucket name:**
   - Choose a unique name (e.g., `flo-financial-intakes`)
   - Bucket names must be globally unique across all AWS accounts
   - Use lowercase letters, numbers, and hyphens only
   - Suggestion: `flo-financial-intakes-2025` or `yourcompany-tax-intakes`

   **AWS Region:**
   - Select `us-east-1` (N. Virginia) - or choose closest to your users
   - **Note:** Remember this region - you'll need it for `AWS_REGION` env var

   **Object Ownership:**
   - Keep default: **"ACLs disabled (recommended)"**
   - This ensures only your IAM user can access files

   **Block Public Access settings:**
   - ✅ **Keep all checked** (block public access)
   - Files will be private - only accessible via signed URLs or IAM credentials
   - This is the secure approach for tax documents

   **Bucket Versioning:**
   - Optional: Enable if you want file version history
   - Recommended: **Disabled** for now (can enable later)

   **Default encryption:**
   - ✅ **Enable encryption**
   - Choose **"Amazon S3 managed keys (SSE-S3)"** (free)
   - This encrypts files at rest automatically

   **Advanced settings:**
   - Keep defaults for now

3. Click **"Create bucket"**

✅ **Bucket created!** Note the bucket name and region.

---

## Step 2: Create IAM User for S3 Access

We'll create a dedicated IAM user with S3 permissions (not your root AWS account).

### 2.1 Navigate to IAM

1. In AWS Console, search for **"IAM"** in the top search bar
2. Click on **IAM** service
3. Go to **"Users"** in the left sidebar
4. Click **"Create user"**

### 2.2 Configure User

1. **User name:** Enter `flo-financial-s3-user` (or your preferred name)
2. Click **"Next"**

### 2.3 Set Permissions

1. Select **"Attach policies directly"**
2. Search for `S3` in the policy search box
3. Select **"AmazonS3FullAccess"** policy
   - ⚠️ **Note:** This gives full S3 access. For production, consider creating a custom policy limited to just this bucket (see Step 3 for custom policy option)
4. Click **"Next"**
5. Click **"Create user"**

### 2.4 Create Access Keys

1. Click on the newly created user
2. Go to **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Application running outside AWS"** as the use case
6. Click **"Next"**
7. (Optional) Add description: "Vercel deployment for Flo Financial"
8. Click **"Create access key"**

### 2.5 Save Credentials

**⚠️ IMPORTANT:** You'll only see the secret key once!

1. Copy the **Access Key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
2. Copy the **Secret Access Key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
3. **Save these securely** - you'll add them to Vercel environment variables

✅ **IAM User and Access Keys created!**

---

## Step 3: (Optional) Create Custom S3 Policy for Better Security

For tighter security, you can create a policy that only allows access to your specific bucket.

### 3.1 Create Custom Policy

1. In IAM, go to **"Policies"** in the left sidebar
2. Click **"Create policy"**
3. Click **"JSON"** tab
4. Paste this policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

5. Click **"Next"**
6. **Policy name:** `FloFinancialS3Access` (or your preferred name)
7. **Description:** "S3 access for Flo Financial intake file uploads"
8. Click **"Create policy"**

### 3.2 Attach Custom Policy to User

1. Go back to **"Users"** → your user → **"Permissions"** tab
2. Click **"Add permissions"** → **"Attach policies directly"**
3. Search for your new policy name
4. Select it and click **"Add permissions"**
5. (Optional) Remove the `AmazonS3FullAccess` policy if you want stricter access

---

## Step 4: Configure Vercel Environment Variables

Now let's add the S3 credentials to your Vercel project.

### 4.1 Get Your Credentials Ready

You should have:
- **AWS_ACCESS_KEY_ID** - The Access Key ID from Step 2.5
- **AWS_SECRET_ACCESS_KEY** - The Secret Access Key from Step 2.5
- **AWS_REGION** - The region you selected (e.g., `us-east-1`)
- **AWS_S3_BUCKET** - The bucket name you created (e.g., `flo-financial-intakes`)

### 4.2 Add to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Navigate to your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

   **Variable 1:**
   - **Name:** `AWS_ACCESS_KEY_ID`
   - **Value:** Your Access Key ID (from Step 2.5)
   - **Environment:** Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 2:**
   - **Name:** `AWS_SECRET_ACCESS_KEY`
   - **Value:** Your Secret Access Key (from Step 2.5)
   - **Environment:** Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 3:**
   - **Name:** `AWS_REGION`
   - **Value:** Your region (e.g., `us-east-1`)
   - **Environment:** Production, Preview, Development (check all)
   - Click **"Save"**

   **Variable 4:**
   - **Name:** `AWS_S3_BUCKET`
   - **Value:** Your bucket name (e.g., `flo-financial-intakes`)
   - **Environment:** Production, Preview, Development (check all)
   - Click **"Save"**

### 4.3 Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **"..."** on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

✅ **Environment variables configured!**

---

## Step 5: Test S3 Upload (After Deployment)

### 5.1 Test via Intake Form

1. Go to your deployed site: `https://your-project.vercel.app`
2. Navigate to the intake form
3. Fill out the form
4. Upload a test PDF or image (small test file)
5. Submit the form
6. Check Vercel function logs for any S3 errors

### 5.2 Verify File in S3

1. Go to AWS Console → S3
2. Click on your bucket
3. Navigate to `intakes/` folder
4. You should see the uploaded file with a timestamp prefix
5. File name format: `{timestamp}-{filename}`

### 5.3 Check Vercel Logs

1. In Vercel dashboard, go to your project → **Functions** tab
2. Click on a recent function execution (e.g., `/api/intake`)
3. Check logs for:
   - ✅ `S3 upload successful` (if visible in logs)
   - ❌ Any S3 errors (permissions, bucket name, etc.)

---

## Step 5.5: AI Analysis with S3 (Optional Enhancement)

**Note:** Currently, AI document analysis skips files stored in S3. If you need AI analysis with S3 files, you'll need to update `lib/ai-analysis.ts` to download files from S3 before analysis. For now, AI analysis works with local file storage.

**To enable AI analysis with S3 files** (future enhancement):
1. Download file from S3 to temporary location
2. Run AI analysis on downloaded file
3. Clean up temporary file after analysis

This is a nice-to-have feature and doesn't block deployment - files will still be stored in S3 correctly.

---

## Step 6: Troubleshooting

### Issue: "Access Denied" Error

**Symptoms:**
- File upload fails with "Access Denied" in logs
- S3 operation returns 403 error

**Solutions:**
1. Verify Access Key ID and Secret Access Key are correct
2. Check IAM user has S3 permissions attached
3. Verify bucket name matches `AWS_S3_BUCKET` env var exactly
4. Check region matches `AWS_REGION` env var
5. Ensure IAM user has `PutObject` permission for the bucket

### Issue: "Bucket Not Found" Error

**Symptoms:**
- Error: "The specified bucket does not exist"

**Solutions:**
1. Verify bucket name in `AWS_S3_BUCKET` env var matches exactly
2. Check bucket region matches `AWS_REGION` env var
3. Verify bucket was created successfully in S3 console
4. Ensure bucket name is correct (case-sensitive)

### Issue: Files Upload but Can't Access

**Symptoms:**
- Upload succeeds but can't download/view files

**Solutions:**
1. Files are private by default (good for security)
2. Use the `/api/download` route with signed URLs
3. Verify `app/api/download/route.ts` is handling S3 URLs correctly
4. Check signed URL expiration (default: 1 hour)

### Issue: Still Using Local Storage

**Symptoms:**
- Files still saved to `/uploads` directory (visible in logs)

**Solutions:**
1. Verify all 4 environment variables are set in Vercel
2. Check environment variables are set for the correct environment (Production/Preview)
3. Redeploy after adding environment variables
4. Check logs for S3 client initialization errors

---

## Step 7: Cost Estimation

### AWS S3 Pricing (as of 2025)

**Storage:**
- First 50 TB/month: $0.023 per GB (Standard storage)
- For 100 intakes/month with ~5MB average file size = 500MB/month
- **Cost: ~$0.01/month** (essentially free tier eligible)

**Requests:**
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests
- 100 uploads/month = ~$0.001/month

**Total estimated cost: <$0.02/month** (well within AWS free tier)

### AWS Free Tier

- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- **First year free** for new AWS accounts

---

## Summary Checklist

Before deploying, ensure:

- [ ] S3 bucket created with unique name
- [ ] Bucket region noted (for `AWS_REGION`)
- [ ] Bucket name noted (for `AWS_S3_BUCKET`)
- [ ] IAM user created
- [ ] IAM user has S3 permissions (either `AmazonS3FullAccess` or custom policy)
- [ ] Access Key ID saved securely
- [ ] Secret Access Key saved securely
- [ ] All 4 environment variables added to Vercel:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_REGION`
  - [ ] `AWS_S3_BUCKET`
- [ ] Vercel project redeployed after adding env vars
- [ ] Test upload completed successfully
- [ ] File verified in S3 console

---

## Next Steps

After S3 is configured:

1. ✅ Files will persist across deployments
2. ✅ Intake submissions will be stored permanently
3. ✅ Admin dashboard will show all historical data
4. ✅ File downloads will work via signed URLs

You're ready for production! 🚀

---

## Security Best Practices

1. ✅ **Never commit** Access Key ID or Secret Access Key to git
2. ✅ Use IAM user (not root account) for programmatic access
3. ✅ Use custom policy (Step 3) to limit access to specific bucket
4. ✅ Enable encryption on bucket (should be default)
5. ✅ Keep public access blocked (default setting)
6. ✅ Rotate access keys periodically (every 90 days recommended)
7. ✅ Monitor S3 access logs (enable in bucket settings if needed)

---

## Support

If you run into issues:

1. Check Vercel function logs for detailed error messages
2. Check AWS CloudWatch logs (if enabled)
3. Verify all environment variables are set correctly
4. Test S3 access using AWS CLI (if installed locally)
5. Review IAM user permissions in AWS Console

For AWS support, see: [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)

