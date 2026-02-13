# Demo Video Setup Guide

## Overview

The "See Demo" button on the landing page links to `/demo`, which displays an embedded YouTube video walkthrough of FilingIQ.

## What to Include in the Demo Video

### Recommended Flow (5-10 minutes)

1. **Introduction (30 seconds)**
   - Brief overview of FilingIQ
   - What problem it solves for tax professionals

2. **Signup & Setup (1-2 minutes)**
   - Creating an account
   - Setting up company branding
   - Customizing colors and settings

3. **Client Intake Journey (2-3 minutes)**
   - Show the branded intake form from client perspective
   - Walk through each step:
     - Contact Information
     - Filing Information
     - Income Types
     - Document Upload
   - Show form validation and user experience

4. **AI Document Analysis (1-2 minutes)**
   - Upload sample tax documents (W-2, 1099)
   - Show AI analysis in action
   - Display extracted information
   - Show confidence scores

5. **Strategy Recommendations (1-2 minutes)**
   - View AI-generated strategies
   - Show potential savings calculations
   - Explain actionable insights

6. **Admin Dashboard (1-2 minutes)**
   - View all client submissions
   - Navigate to detailed client view
   - Show document management
   - Export capabilities

7. **Closing (30 seconds)**
   - Recap key benefits
   - Call to action

## Video Production Tips

### Recording
- Use screen recording software (Loom, OBS, QuickTime)
- Record in 1080p or higher
- Use a clear, professional voiceover
- Add captions for accessibility

### Editing
- Keep it concise (5-10 minutes ideal)
- Add text overlays for key points
- Use smooth transitions
- Highlight important features

### Upload to YouTube
1. Upload video to YouTube
2. Set visibility to "Unlisted" (or "Public" if preferred)
3. Copy the video ID from the URL
   - Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Video ID: `dQw4w9WgXcQ`

## Updating the Demo Page

Once you have your YouTube video:

1. Open `app/demo/page.tsx`
2. Find this line:
   ```tsx
   src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID"
   ```
3. Replace `YOUTUBE_VIDEO_ID` with your actual video ID
4. Save and deploy

## Alternative: No Video Yet?

If you don't have a video yet, you can:

1. **Use a placeholder**: Show a "Coming Soon" message
2. **Use screenshots**: Create a carousel of screenshots
3. **Interactive demo**: Link to a demo account
4. **Temporary redirect**: Redirect to signup page with a note

## Example Video Script Outline

```
[0:00-0:30] Introduction
"Hi, I'm [Your Name]. Today I'm going to show you FilingIQ, 
an AI-powered tax strategy discovery platform built specifically 
for tax professionals..."

[0:30-2:30] Signup & Setup
"Let's start by creating an account. As you can see, the signup 
process is straightforward. Once logged in, you can customize 
your branding..."

[2:30-5:00] Client Intake Journey
"Now let's see what your clients experience. I'll walk through 
the intake form as if I'm a client submitting my tax documents..."

[5:00-7:00] AI Analysis
"Watch as FilingIQ automatically analyzes the uploaded documents. 
It identifies document types, extracts key information, and 
provides confidence scores..."

[7:00-9:00] Strategy Recommendations
"Here's where the magic happens. FilingIQ generates personalized 
tax strategies based on the client's documents..."

[9:00-10:30] Admin Dashboard
"As the tax professional, you can view all submissions in your 
admin dashboard. Let's look at a detailed client view..."

[10:30-11:00] Closing
"FilingIQ makes it easy to identify tax optimization opportunities 
for your clients. Ready to get started? Sign up for free today."
```

## Best Practices

- **Keep it real**: Use actual data and scenarios
- **Show value**: Focus on benefits, not just features
- **Be concise**: Respect viewers' time
- **Update regularly**: Keep video current with new features
- **Add captions**: Improves accessibility and SEO

---

**Need help?** Consider using a service like Loom for quick, professional screen recordings with automatic captions.
