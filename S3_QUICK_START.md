# S3 Quick Start Checklist

Quick reference for setting up AWS S3 for Flo Financial.

## Pre-Setup (5 min)

- [ ] AWS account created
- [ ] AWS Console access ready

## Step 1: Create S3 Bucket (5 min)

1. AWS Console → S3 → **Create bucket**
2. **Bucket name:** `flo-financial-intakes` (or your unique name)
3. **Region:** `us-east-1` (or closest to users)
4. ✅ **Block Public Access:** Keep checked (private)
5. ✅ **Encryption:** Enable (SSE-S3)
6. **Create bucket**

**Save:** Bucket name = `AWS_S3_BUCKET`  
**Save:** Region = `AWS_REGION`

## Step 2: Create IAM User (5 min)

1. AWS Console → IAM → **Users** → **Create user**
2. **User name:** `flo-financial-s3-user`
3. **Attach policy:** `AmazonS3FullAccess`
4. **Create user**

## Step 3: Get Access Keys (2 min)

1. IAM → Your user → **Security credentials** tab
2. **Access keys** → **Create access key**
3. **Use case:** Application running outside AWS
4. **Create access key**
5. **Copy Access Key ID** → `AWS_ACCESS_KEY_ID`
6. **Copy Secret Access Key** → `AWS_SECRET_ACCESS_KEY` ⚠️ Save now - only shown once!

## Step 4: Add to Vercel (5 min)

1. Vercel → Your project → **Settings** → **Environment Variables**
2. Add 4 variables:

```
AWS_ACCESS_KEY_ID = [paste from Step 3]
AWS_SECRET_ACCESS_KEY = [paste from Step 3]
AWS_REGION = us-east-1 (or your region)
AWS_S3_BUCKET = flo-financial-intakes (or your bucket)
```

3. ✅ Check: Production, Preview, Development
4. **Save** each variable
5. **Redeploy** project

## Step 5: Test (5 min)

1. Go to deployed site
2. Submit test intake form with PDF upload
3. Check S3 Console → Your bucket → `intakes/` folder
4. File should appear with timestamp prefix

## ✅ Done!

Files now persist across deployments.

---

## Troubleshooting

**"Access Denied"**
→ Check IAM user has `AmazonS3FullAccess` policy

**"Bucket Not Found"**
→ Verify `AWS_S3_BUCKET` matches bucket name exactly

**Still using local storage**
→ Verify all 4 env vars are set in Vercel
→ Redeploy after adding env vars

**Files upload but can't download**
→ Files are private (secure)
→ Use `/api/download` route which generates signed URLs

---

## Need Detailed Instructions?

See `S3_SETUP.md` for complete step-by-step guide with screenshots and security best practices.

