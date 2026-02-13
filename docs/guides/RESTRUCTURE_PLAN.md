# FilingIQ Restructure Plan

## New Architecture

### 1. Homepage (`/`) - Product Landing Page
**Purpose**: Marketing page for FilingIQ SaaS product
- Hero section: "AI-Powered Tax Strategy Discovery for Tax Professionals"
- Features showcase
- Pricing/plans (optional)
- **CTA**: "Sign Up" or "Get Started" → leads to signup/login

### 2. Admin Dashboard (`/admin` or `/dashboard`) - Tax Prep Company Portal
**Purpose**: Where tax prep companies (like Flo Financial) manage their FilingIQ account

**Sections**:
- **Settings/Configuration**:
  - Company name, website, contact info
  - Branding (colors, logo)
  - Generate intake link (e.g., `intake.flo-financial.com`)
- **Clients/Submissions** (Nav tab):
  - Tax Pro Dashboard view (current `/dashboard` functionality)
  - Shows client submissions with AI insights
  - Strategy recommendations

### 3. Client Intake Flow (`/intake/[company-slug]` or custom domain)
**Purpose**: Where end clients submit their tax documents
- Current `/start` flow
- Branded with company's settings
- Submissions go to that company's admin dashboard

---

## Implementation Steps

1. **Update Homepage** - Make it a product landing page
2. **Restructure Admin** - Add settings/config section + nav tabs
3. **Move Tax Pro Dashboard** - Into admin as a "Clients" tab
4. **Create Signup Flow** - Basic structure for company registration
5. **Update Intake Flow** - Make it company-specific

