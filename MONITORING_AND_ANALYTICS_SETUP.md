# Monitoring & Analytics Setup Guide

## 🎯 Overview

This guide covers setting up:
1. **Sentry** - Error tracking and monitoring
2. **User Analytics** - User behavior and engagement tracking

---

## 🔴 Part 1: Sentry Error Tracking ✅ SETUP COMPLETE

### Why Sentry?
- Automatic error capture with stack traces
- Real-time alerts when errors occur
- Error grouping and deduplication
- Performance monitoring
- Release tracking
- User context and breadcrumbs

### ✅ What's Already Done
- ✅ Sentry config files created (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- ✅ Logger integrated with Sentry (errors automatically sent)
- ✅ Next.js config updated with Sentry webpack plugin
- ✅ Instrumentation file created (`instrumentation.ts`)
- ✅ All code ready - just needs package install + DSN

### Setup Steps (You Need To Do)

#### 1. Install Sentry Package
```bash
npm install @sentry/nextjs
```

#### 2. Get Your Sentry DSN
1. Go to [sentry.io](https://sentry.io) and sign up/login
2. Create a new project (select **Next.js**)
3. Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)
4. Note your **Organization** and **Project** names

#### 3. Add Environment Variables to Vercel
Go to Vercel → Settings → Environment Variables, add:

```
# Sentry Configuration
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=sntrys_your_auth_token_here

# For client-side Sentry (optional, same as SENTRY_DSN)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Important**: The `SENTRY_AUTH_TOKEN` is required for uploading source maps during the build process. This token:
- Is provided during the Sentry wizard setup
- Can be found in Sentry project settings under "Auth Tokens"
- Should start with `sntrys_` and be kept secret (never commit to git)
- Is used by the build process to upload source maps for better error tracking

**Example token format**: `sntrys_eyJpYXQiOjE3NzEwMDU2ODAuODE1ODk4LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL3VzLnNlbnRyeS5pbyIsIm9yZyI6InByb2xpZmljLWxhYnMifQ==_...`

#### 4. Redeploy
Vercel → Deployments → Redeploy

### How It Works
- **Logger automatically sends errors to Sentry** - No code changes needed!
- When you call `logger.error()`, it automatically captures in Sentry
- Warnings are also sent to Sentry
- All errors include context and stack traces

### Pricing
- **Free tier**: 5,000 errors/month
- **Team**: $26/month for 50,000 errors
- Usually sufficient for starting

---

## 📊 Part 2: User Analytics ✅ TEMPLATE READY

### ✅ What's Already Done
- ✅ Analytics utility created (`lib/analytics.ts`)
- ✅ Supports PostHog and Mixpanel
- ✅ AnalyticsProvider component created
- ✅ Integrated into root layout
- ✅ Ready to use - just install package and add env vars

### Recommended: PostHog ⭐

**Why PostHog?**
- Free tier: 1M events/month
- All-in-one: analytics + feature flags + session replay
- Privacy-friendly (self-hostable)
- Great for SaaS products
- Easy integration

### Setup Steps (When Ready)

#### 1. Install PostHog
```bash
npm install posthog-js
```

#### 2. Get PostHog API Key
1. Go to [posthog.com](https://posthog.com) and sign up
2. Create a new project
3. Copy your Project API Key

#### 3. Add Environment Variable
Add to Vercel → Settings → Environment Variables:
```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # or your self-hosted URL
```

#### 4. Use Analytics in Your Code
```typescript
import { trackEvent, identifyUser } from '@/lib/analytics'

// Track events
trackEvent('user_signed_up', { accountId: '123' })
trackEvent('form_submitted', { formType: 'intake' })

// Identify users
identifyUser('user-123', { email: 'user@example.com' })
```

### Alternative: Mixpanel

If you prefer Mixpanel:
```bash
npm install mixpanel-browser
```

Add to Vercel:
```
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

### Key Events to Track

Add tracking to these key actions:
- ✅ User signups (`user_signed_up`)
- ✅ Form submissions (`intake_submitted`)
- ✅ Document uploads (`document_uploaded`)
- ✅ Admin logins (`admin_logged_in`)
- ✅ Password resets (`password_reset_requested`)

---

## 🚀 Quick Start

### Sentry (Do Now):
1. Run: `npm install @sentry/nextjs`
2. Get DSN from sentry.io
3. Add env vars to Vercel
4. Redeploy
5. ✅ Done! Errors automatically tracked

### Analytics (When Ready):
1. Run: `npm install posthog-js`
2. Get API key from posthog.com
3. Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel
4. ✅ Done! Analytics ready to use

---

## 📝 Current Status

- ✅ **Sentry**: Fully integrated, just needs package install + DSN
- ✅ **Analytics**: Template ready, just needs package install + API key
- ✅ **Logger**: Automatically sends errors to Sentry when configured
- ✅ **Layout**: Analytics provider already added
