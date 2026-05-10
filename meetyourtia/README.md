# Tia — Your Executive Assistant

An AI executive assistant that captures tasks from natural conversation, tracks them intelligently, and closes every loop.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk (separate app)
- **Database**: Supabase (separate project)
- **AI**: Anthropic Claude Sonnet 4
- **STT**: Deepgram Nova-2 (Pro) / Web Speech API (Free)
- **TTS**: ElevenLabs Rachel (Pro)
- **Payments**: Razorpay (₹499/month, ₹3,999/year)
- **Rate Limiting**: Upstash Redis
- **Hosting**: Vercel

## 📋 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values:

```bash
cp .env.example .env.local
```

You'll need API keys for:
- Clerk (auth)
- Supabase (database)
- Anthropic (Claude API)
- Deepgram (STT)
- ElevenLabs (TTS)
- Razorpay (payments)
- Upstash Redis (rate limiting)

### 3. Set Up Supabase Database

1. Create a new Supabase project
2. Go to SQL Editor
3. Run the entire `SUPABASE_SCHEMA.sql` file

### 4. Configure Clerk

1. Create a new Clerk application
2. Enable Email + Google OAuth
3. Set redirect URLs:
   - Sign-in: `/sign-in`
   - Sign-up: `/sign-up`
   - After sign-in: `/app`
   - After sign-up: `/app/onboarding`
4. Add custom metadata fields:
   - `onboarding_complete` (boolean)
   - `plan` (string: 'free' or 'pro')

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
meetyourtia/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── capture/       # Task capture endpoint
│   │   ├── tasks/         # Task CRUD endpoints
│   │   ├── people/        # People registry endpoint
│   │   └── onboarding/    # Onboarding completion
│   ├── app/               # Authenticated app routes
│   │   ├── onboarding/    # 5-screen onboarding flow
│   │   ├── voice/         # Voice capture screen
│   │   ├── tasks/         # Task views (list + detail)
│   │   ├── people/        # People registry screen
│   │   └── page.tsx       # Home screen
│   ├── jobs/              # Cron job endpoints
│   │   └── carry-over/    # Daily carry-over job
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/tia/        # Tia-specific components
│   ├── shared.tsx         # 15 reusable UI components
│   └── TaskCard.tsx       # Task card component
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Database client
│   ├── claude.ts         # AI client
│   ├── context.ts        # Brain + Soul context
│   ├── brain-update.ts   # Brain update logic
│   ├── auth.ts           # Clerk helpers
│   ├── free-tier.ts      # Free tier validation
│   ├── rate-limit.ts     # Rate limiting
│   ├── razorpay.ts       # Payment client
│   └── api-handler.ts    # API error handling
├── middleware.ts          # Auth + routing middleware
├── SUPABASE_SCHEMA.sql   # Database schema
├── TESTING.md            # Testing guide
├── DEPLOYMENT.md         # Deployment guide
└── vercel.json           # Vercel configuration
```

## 🎯 Key Features

### ✅ Completed (MVP v1.0)
- ✅ **Onboarding flow** (5 screens with Soul synthesis)
- ✅ **Voice capture** (Web Speech API with real-time transcription)
- ✅ **AI task extraction** (Claude-powered with multi-task splitting)
- ✅ **Entity extraction** (People, projects, entities auto-detected)
- ✅ **Smart priority ranking** (Carry-over, deadline, priority algorithm)
- ✅ **Today view** (Priority-ranked task list)
- ✅ **Next 5 days view** (Upcoming tasks)
- ✅ **Task detail screen** (Full task information)
- ✅ **Mark done/blocked** (Status updates with history)
- ✅ **People registry** (Auto-populated from tasks)
- ✅ **Free tier enforcement** (5 open tasks limit)
- ✅ **Rate limiting** (20 requests/minute)
- ✅ **Daily carry-over job** (Automated task aging)
- ✅ **Complete task history** (All changes logged)
- ✅ **Brain updates** (Auto-updating world knowledge)

### 🚧 Deferred to v1.1
- Voice status updates
- EOD guided sweep
- Morning brief (7am nudge)
- EOD nudge (6pm reminder)
- Swipe gestures
- Razorpay monetization
- WhatsApp nudges
- Agent outreach
- Soul update job
- Recurring tasks
- Settings screen
- Data export

## 🧠 Core Concepts

### Soul
The master's identity model. Captures:
- Who they are (role, context, pressure)
- How they communicate (register, vocabulary, phrases)
- How they delegate (style, context, deadlines)
- What they value (non-negotiables, stress signals)

### Brain
The master's world knowledge. Tracks:
- People registry (everyone mentioned)
- Entity registry (projects, products, patients)
- Task patterns (delegation ratio, closure rate)
- Pre-computed summary (injected into every Claude call)

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Rate limiting: 20 requests/minute per user
- Free tier: 5 open tasks max
- No DELETE operations on tasks (permanent records)
- Webhook signature verification for payments

## 📊 Database Schema

7 tables:
- `tasks` - All task data
- `brain` - User's world knowledge (JSONB)
- `soul` - User's identity model (JSONB)
- `people` - People registry
- `entities` - Entity registry
- `task_history` - All task changes
- `nudges` - In-app notifications
- `subscription_map` - Payment tracking

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.

### Quick Deploy to Vercel
1. Push to GitHub
2. Import to Vercel
3. Set root directory to `meetyourtia`
4. Add environment variables
5. Deploy

### Cron Jobs
Configured in `vercel.json`:
- **Carry-over**: 00:01 daily (implemented)
- Morning brief: 07:00 daily (v1.1)
- EOD nudge: 18:00 daily (v1.1)

### Required Services
- **Clerk**: Authentication
- **Supabase**: Database
- **Anthropic**: Claude API
- **Vercel**: Hosting + Cron

### Optional Services (v1.1)
- Deepgram: Premium STT
- ElevenLabs: Premium TTS
- Razorpay: Payments
- Upstash Redis: Rate limiting

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, contact: [your-email]
