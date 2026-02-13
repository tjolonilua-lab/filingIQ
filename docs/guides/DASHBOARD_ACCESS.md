# How to Access FilingIQ Dashboards

## Quick Access

### 1. Tax Pro Dashboard (New - Sora Style)
**URL**: `http://localhost:3000/dashboard`

**Password**: `admin123` (default) or your `ADMIN_PASSWORD` env variable

**Features**:
- Holographic UI with neon/cyan glow
- Client cards with strategy summaries
- Click any client card to see detailed AI insights
- Split layout: AI insights (left) + Metrics (right)

### 2. Admin Dashboard (Original)
**URL**: `http://localhost:3000/admin`

**Password**: Same as above (`admin123`)

**Features**:
- Table view of all submissions
- Basic submission detail view
- Simple, clean interface

## Testing Without Submissions

If you don't have any client submissions yet:

1. **Submit a test intake**:
   - Go to `http://localhost:3000/start`
   - Fill out the form and upload some documents
   - Submit the form
   - The submission will appear in both dashboards

2. **Or create test data manually**:
   - Submissions are stored in `/data/intakes/*.json`
   - You can create JSON files there following the `IntakeSubmission` schema

## Environment Variables

Make sure you have set:
```bash
ADMIN_PASSWORD=your_secure_password
```

If not set, defaults to `admin123`.

## Troubleshooting

**Can't see submissions?**
- Check that `/data/intakes/` directory exists
- Verify files are JSON format
- Check browser console for errors
- Ensure password matches `ADMIN_PASSWORD` env var

**Dashboard not loading?**
- Make sure dev server is running: `npm run dev`
- Check that port 3000 is available
- Verify all components are built: `npm run build`

