# Deployment Guide for Tia MVP

## Prerequisites

Before deploying, ensure you have:
1. ✅ Clerk account with application configured
2. ✅ Supabase project with schema deployed
3. ✅ Anthropic API key with credits
4. ✅ Vercel account
5. ✅ GitHub repository (optional but recommended)

## Step 1: Prepare Environment Variables

Create a `.env.production` file or configure in Vercel dashboard:

```bash
# Required - Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/onboarding

# Required - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Required - Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Required - Cron Secret (generate random string)
CRON_SECRET=your_random_secret_here

# Required - App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional - Premium Features (can add later)
DEEPGRAM_API_KEY=...
ELEVENLABS_API_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Step 2: Deploy Database Schema

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run the entire `SUPABASE_SCHEMA.sql` file
4. Verify all 7 tables are created:
   - tasks
   - brain
   - soul
   - people
   - entities
   - task_history
   - nudges
   - subscription_map

## Step 3: Configure Clerk

1. Go to your Clerk dashboard
2. Set **Redirect URLs**:
   - Sign-in redirect: `https://your-domain.vercel.app/app`
   - Sign-up redirect: `https://your-domain.vercel.app/app/onboarding`
3. Enable **Email** and **Google OAuth**
4. Add **Custom Metadata** fields:
   - `onboarding_complete` (boolean)
   - `plan` (string)

## Step 4: Deploy to Vercel

### Option A: Deploy via GitHub (Recommended)

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit - Tia MVP"
git remote add origin https://github.com/yourusername/tia.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **New Project**
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `meetyourtia`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
6. Add all environment variables
7. Click **Deploy**

### Option B: Deploy via Vercel CLI

```bash
cd meetyourtia
npm install -g vercel
vercel login
vercel --prod
```

Follow prompts and add environment variables when asked.

## Step 5: Configure Cron Jobs

Vercel will automatically set up the cron job from `vercel.json`:
- **Carry-over job**: Runs daily at 00:01 UTC

To test the cron job manually:
```bash
curl -X GET https://your-domain.vercel.app/jobs/carry-over \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Step 6: Verify Deployment

### Test Checklist:
- [ ] Landing page loads at root URL
- [ ] Sign up flow works
- [ ] Onboarding completes successfully
- [ ] Voice capture works (Web Speech API)
- [ ] Tasks are created and saved
- [ ] Tasks view shows priority ranking
- [ ] Task detail page works
- [ ] Mark done functionality works
- [ ] People page shows registry
- [ ] Navigation works between screens

### Database Verification:
- [ ] Check `soul` table has user data
- [ ] Check `brain` table has summary
- [ ] Check `tasks` table has captured tasks
- [ ] Check `people` table has extracted people
- [ ] Check `task_history` table has change logs

## Step 7: Monitor & Debug

### Vercel Logs
- Go to your project in Vercel dashboard
- Click **Logs** tab
- Monitor for errors

### Supabase Logs
- Go to Supabase dashboard
- Click **Logs** → **API Logs**
- Check for RLS policy issues

### Common Issues

**Issue**: "Unauthorized" errors
- **Fix**: Check Clerk keys are correct and match environment

**Issue**: Tasks not saving
- **Fix**: Verify Supabase RLS policies are enabled
- **Fix**: Check service role key is correct

**Issue**: Voice capture not working
- **Fix**: Ensure HTTPS is enabled (required for Web Speech API)
- **Fix**: Test in Chrome/Edge (Safari not supported)

**Issue**: Cron job not running
- **Fix**: Verify `CRON_SECRET` matches in both code and Vercel env vars
- **Fix**: Check Vercel cron logs in dashboard

## Step 8: Post-Deployment Setup

### 1. Test with Real Data
- Create a test account
- Complete onboarding
- Capture 5-10 tasks
- Verify priority ranking
- Test mark done flow

### 2. Monitor Performance
- Check Vercel analytics
- Monitor Supabase usage
- Track Anthropic API usage

### 3. Set Up Alerts (Optional)
- Vercel: Enable deployment notifications
- Supabase: Set up usage alerts
- Anthropic: Monitor credit usage

## Production Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Clerk redirect URLs updated
- [ ] Cron jobs tested
- [ ] Error handling tested
- [ ] Free tier limits working (5 tasks)
- [ ] Rate limiting working (20 req/min)
- [ ] HTTPS enabled
- [ ] Custom domain configured (optional)

## Scaling Considerations

### When to Upgrade:
- **Vercel**: Free tier supports ~100 users
- **Supabase**: Free tier supports ~50 concurrent users
- **Anthropic**: Monitor token usage, ~$0.003 per task capture

### Future Enhancements:
- Add Deepgram for better voice recognition
- Add ElevenLabs for voice responses
- Add Razorpay for monetization
- Add Upstash Redis for better rate limiting
- Add monitoring (Sentry, LogRocket)

## Support

For deployment issues:
- Vercel: https://vercel.com/docs
- Supabase: https://supabase.com/docs
- Clerk: https://clerk.com/docs

## Rollback Plan

If deployment fails:
1. Revert to previous Vercel deployment
2. Check error logs
3. Fix issues locally
4. Test thoroughly
5. Redeploy

---

**Deployment Time**: ~30 minutes
**First Deploy**: May take 5-10 minutes
**Subsequent Deploys**: 2-3 minutes
