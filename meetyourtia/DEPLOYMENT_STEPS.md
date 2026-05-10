# 🚀 Quick Deployment Guide - Tia MVP

## ✅ What's Already Done:

- ✅ Clerk account configured
- ✅ Supabase database with all 7 tables created
- ✅ Anthropic API key obtained
- ✅ All environment variables configured in `.env.local`
- ✅ All dependencies installed

---

## 📋 Next Steps to Deploy:

### **Step 1: Create GitHub Repository**

Open terminal and run:

```bash
cd "c:/AI tools/Tia/meetyourtia"
git init
git add .
git commit -m "Initial commit - Tia MVP v1.0"
```

Then:
1. Go to https://github.com/new
2. Create a new repository called `tia-mvp`
3. **Don't** initialize with README (we already have code)
4. Copy the repository URL

Back in terminal:
```bash
git remote add origin https://github.com/YOUR_USERNAME/tia-mvp.git
git branch -M main
git push -u origin main
```

---

### **Step 2: Deploy to Vercel**

1. Go to https://vercel.com
2. Click **"New Project"**
3. Click **"Import Git Repository"**
4. Select your `tia-mvp` repository
5. Click **"Import"**

**IMPORTANT Configuration:**
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `meetyourtia` ⚠️ **CRITICAL - Must set this!**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)

---

### **Step 3: Add Environment Variables**

Click **"Environment Variables"** and add these one by one:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZmxlZXQtZWdyZXQtODIuY2xlcmsuYWNjb3VudHMuZGV2JA

CLERK_SECRET_KEY=sk_test_czXJK8q6Qkx6oHxAoI9AtT6fsgToRWeKrZ7czbgSek

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app

NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app/onboarding

NEXT_PUBLIC_SUPABASE_URL=https://zcjagcggeabaaalsjrws.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjamFnY2dnZWFiYWFhbHNqcndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDA0NzMsImV4cCI6MjA5MzkxNjQ3M30.eF5MqaSPrCwZEHr_PMemWVkaAvc9NDMwrOCbRSSqIMo

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjamFnY2dnZWFiYWFhbHNqcndzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MDQ3MywiZXhwIjoyMDkzOTE2NDczfQ.VBYNj7qPtaDFGekpKTP9tTAQwj9DUftqMV8EMO6C4Uk

ANTHROPIC_API_KEY=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

CRON_SECRET=tia_cron_2026_secure_xyz789abc123def456

NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

**Note:** For `NEXT_PUBLIC_APP_URL`, use the Vercel URL you'll get after deployment (you can update this later)

---

### **Step 4: Deploy**

1. Click **"Deploy"**
2. Wait 3-5 minutes for build to complete
3. You'll get a URL like: `https://tia-mvp-xxx.vercel.app`

---

### **Step 5: Update App URL**

1. Copy your Vercel deployment URL
2. Go to Vercel project **Settings** → **Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Update it with your actual Vercel URL
5. Vercel will auto-redeploy

---

### **Step 6: Update Clerk Redirect URLs**

1. Go to Clerk dashboard: https://dashboard.clerk.com
2. Select your application
3. Go to **Paths** section
4. Update redirect URLs to use your Vercel domain:
   - Sign-in redirect: `https://your-project.vercel.app/app`
   - Sign-up redirect: `https://your-project.vercel.app/app/onboarding`

---

## ✅ Testing Checklist:

Visit your Vercel URL and test:

- [ ] Landing page loads
- [ ] Click "Start for free"
- [ ] Sign up with email
- [ ] Complete onboarding (all 5 screens)
- [ ] Capture a voice task (use Chrome/Edge, not Safari)
- [ ] View tasks in list
- [ ] Click task to see details
- [ ] Mark task as done
- [ ] Check people page

---

## 🎯 Verify Database:

1. Go to Supabase dashboard
2. Click **Table Editor**
3. Check these tables have data:
   - `soul` - Should have 1 row with your Soul document
   - `brain` - Should have 1 row with Brain summary
   - `tasks` - Should have your captured tasks
   - `people` - Should have extracted people
   - `task_history` - Should have change logs

---

## 🚨 Common Issues:

**Issue**: Build fails on Vercel
- **Fix**: Make sure Root Directory is set to `meetyourtia`

**Issue**: "Unauthorized" errors
- **Fix**: Check all environment variables are correct

**Issue**: Voice capture not working
- **Fix**: Use Chrome or Edge (Safari not supported)
- **Fix**: Ensure you're on HTTPS (Vercel provides this)

**Issue**: Tasks not saving
- **Fix**: Check Supabase service role key is correct
- **Fix**: Verify database tables were created

---

## 📊 Your Credentials Summary:

**Clerk**: ✅ Configured
**Supabase**: ✅ Database ready with 7 tables
**Anthropic**: ✅ API key active
**Cron Job**: ✅ Configured (runs daily at 00:01 UTC)

---

## 🎉 You're Ready!

Total deployment time: ~15 minutes

Once deployed, your Tia MVP will be live and fully functional!
