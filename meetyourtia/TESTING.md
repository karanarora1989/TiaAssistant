# Testing the Onboarding Flow

## Prerequisites

Before you can test the onboarding flow, you need to set up the following services:

### 1. Clerk (Authentication)
1. Go to https://clerk.com and create a free account
2. Create a new application
3. Enable **Email** and **Google OAuth** as sign-in methods
4. Go to **API Keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
5. Paste these into `.env.local`

### 2. Supabase (Database)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **Project Settings** → **API** and copy:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **SQL Editor** and run the entire `SUPABASE_SCHEMA.sql` file
5. Paste the keys into `.env.local`

### 3. Anthropic (Claude API)
1. Go to https://console.anthropic.com
2. Create an account and add credits
3. Go to **API Keys** and create a new key
4. Copy the key → `ANTHROPIC_API_KEY`
5. Paste into `.env.local`

### 4. Optional Services (Can Skip for Testing)
- **Deepgram** (STT) - Can skip, Web Speech API will be used
- **ElevenLabs** (TTS) - Can skip for now
- **Razorpay** (Payments) - Can skip for now
- **Upstash Redis** (Rate limiting) - Can skip, will fail open

## Running the App

Once you have the required environment variables set up:

```bash
cd meetyourtia
npm run dev
```

Open http://localhost:3000

## Testing the Onboarding Flow

### Step 1: Landing Page
- Visit http://localhost:3000
- You should see the landing page with hero, features, and pricing
- Click "Start for free" or "Get started"

### Step 2: Sign Up
- Clerk will show the sign-up form
- Sign up with email or Google
- After sign-up, you'll be redirected to `/app/onboarding`

### Step 3: Onboarding Welcome
- You should see the welcome screen with:
  - Tia logo
  - "Meet Tia. Your executive assistant."
  - 4 capability cards
  - "Set me up — 2 minutes" button
- Click the button

### Step 4: About You
- **Progress bar**: 20% (STEP 1 OF 4)
- Select assistant name (Tia, Aria, Maya, Nova, Lea, or custom)
- Select your role (PM, Doctor, Founder, or Other)
- Click "Continue →"

### Step 5: Your World
- **Progress bar**: 50% (STEP 2 OF 4)
- Add up to 4 key people (name + role)
- Optionally add sensitive handling notes
- Choose sensitivity level (Careful or Critical)
- Click "Continue →"

### Step 6: Your Style
- **Progress bar**: 75% (STEP 3 OF 4)
- Choose communication style (Brief, Warm, or Formal)
- Choose nudge frequency (Daily, Urgent only, or Leave me alone)
- Click "Continue →"

### Step 7: All Set
- See summary of what Tia knows about you
- Click "Start capturing tasks →"
- This will:
  1. Call `/api/onboarding/complete`
  2. Use Claude to synthesize a Soul document
  3. Initialize Brain with your data
  4. Insert people into the database
  5. Update Clerk metadata
  6. Redirect to `/app` (home screen)

### Expected Result
- After completion, you should be redirected to `/app`
- Currently this will show a blank screen (home screen not built yet)
- But your onboarding data is saved in Supabase!

## Verifying Data in Supabase

After completing onboarding, check your Supabase database:

1. Go to **Table Editor** in Supabase
2. Check the `soul` table - should have 1 row with your Soul document
3. Check the `brain` table - should have 1 row with your Brain summary
4. Check the `people` table - should have rows for each person you added

## Troubleshooting

### "Unauthorized" error
- Make sure Clerk keys are correct in `.env.local`
- Restart the dev server after adding env variables

### "Failed to complete onboarding"
- Check browser console for errors
- Make sure Anthropic API key is valid and has credits
- Make sure Supabase schema was run correctly

### Middleware redirect loop
- Clear browser cookies and localStorage
- Make sure Clerk metadata is being updated correctly

### Can't see onboarding screens
- Make sure you're signed in
- Check that middleware is working (should redirect to `/app/onboarding` after sign-up)

## Next Steps

After testing onboarding, the next features to build are:
1. Home screen (`/app/page.tsx`)
2. Capture system for creating tasks
3. Task views (Today, 5-day)
4. Update flows

The foundation is solid and ready for these features!
