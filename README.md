# FilingIQ

**AI-Powered Tax Strategy Discovery**

Imagine your tax software not just filing forms but using AI to identify top tax strategies fitting each of your clients. FilingIQ ingests tax documents from your clients and turns them into actionable strategies that typically have been reserved for billionaires.

A white-label SaaS platform that transforms tax document intake into intelligent strategy recommendations. Fully customizable branding and AI-powered analysis that identifies opportunities beyond simple form filing.

## Features

- Simple branded landing page
- Multi-step intake form (4-5 steps, depending on business configuration)
- **Business-Level Configuration**: 
  - **Lite Version**: Standard intake form without AI analysis
  - **Full Version**: Includes AI-powered document analysis
  - Configured via `ENABLE_AI_ANALYSIS` environment variable
- **AI Document Analysis** (Full Version only): 
  - Automatically identifies tax document types (W-2, 1099s, etc.)
  - Extracts key information (amounts, dates, employers)
  - Provides confidence levels and summaries
  - Powered by OpenAI GPT-4 Vision
- **Admin Dashboard**: 
  - View all intake submissions
  - Detailed submission views with AI analysis results
  - Password-protected access
- Secure document upload
- Email notifications with analysis summaries
- Thank you confirmation page

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - **Business Branding** (REQUIRED):
     - `BUSINESS_NAME` - Your business name (e.g., "Flo Financial & Tax Services")
     - `BUSINESS_EMAIL` - Contact email (e.g., "info@example.com")
     - `BUSINESS_PHONE` - Contact phone (e.g., "(555) 123-4567")
     - `BUSINESS_WEBSITE` - Your website domain (e.g., "flo-financial.com")
     - `MAIN_WEBSITE_URL` - Full URL to main website (optional, for "Return to Main Website" link)
     - `PRIMARY_COLOR` - Primary brand color (hex, default: #1e3a5f)
     - `ACCENT_COLOR` - Accent/button color (hex, default: #22c55e)
   - **Business Configuration**:
     - `ENABLE_AI_ANALYSIS=true` - Enable AI document analysis (Full Version)
     - `ADMIN_PASSWORD` - Password for admin dashboard access
   - **OpenAI API Key** (required if `ENABLE_AI_ANALYSIS=true`):
     - `OPENAI_API_KEY` - Your OpenAI API key
     - `OPENAI_MODEL` - Model to use (default: gpt-4o)
   - **Optional Services**:
     - S3 credentials for cloud storage
     - Resend API key for email notifications

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Project Structure

- `/app` - Next.js app router pages
  - `/admin` - Admin dashboard for viewing submissions
  - `/api/config` - Business configuration endpoint
  - `/api/submissions` - Submissions API endpoint
- `/components` - Reusable React components
- `/lib` - Utility functions (validation, upload, email, business-config)
- `/data/intakes` - Local JSON storage (gitignored)
- `/uploads` - Local file storage (gitignored)

## Admin Dashboard

Access the admin dashboard at `/admin` to view all intake submissions.

1. Navigate to `http://localhost:3000/admin`
2. Enter the admin password (set via `ADMIN_PASSWORD` env var)
3. View all submissions in a table format
4. Click "View Details" to see full submission information including AI analysis results

See `DEPLOYMENT.md` for deployment instructions.

