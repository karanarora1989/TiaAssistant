# 🤖 Tia Autonomous Assistant

## Overview

Tia is now an **autonomous executive assistant** that takes action on delegated tasks. This document explains how the system works and how to complete the implementation.

---

## ✅ What's Built (Phase 1)

### **1. Schema Updates**
- ✅ `assigned_from` - Who delegated the task
- ✅ `assigned_to` - Who is responsible (changed from array to single text)
- ✅ `status` - Enhanced: not_started/wip/blocked/done
- ✅ `status_details` - JSONB for rich status info
- ✅ `next_action_date` - When to follow up next
- ✅ `last_followup_at` - Last follow-up timestamp
- ✅ `followup_count` - Number of follow-ups
- ✅ `needs_intervention` - Owner needs to step in

### **2. Task Classification**
- ✅ `lib/task-classifier.ts` - Determines if Tia should act
- ✅ `isDelegatedTask()` - Identifies delegated tasks
- ✅ `isSelfAssignedTask()` - Identifies self-assigned tasks
- ✅ `canTiaAct()` - Permission check

### **3. Migration Script**
- ✅ `MIGRATION.sql` - Upgrades existing database
- ✅ Migrates `assigned_to` from array to text
- ✅ Updates status enum
- ✅ Adds new columns and indexes

---

## 🎯 How It Works

### **Task Types**

#### **Self-Assigned Tasks** ❌ No Action
```
You: "I need to review the Q2 report"

Task:
- assigned_from: null
- assigned_to: "self"
- Tia action: Just reminds you ⏰
```

#### **Delegated Tasks** ✅ Autonomous Action
```
You: "Ask John to review the Q2 report"

Task:
- assigned_from: "You"
- assigned_to: "John"
- Tia action: Follows up with John autonomously 🤖
```

### **Classification Logic**

```typescript
// Tia ONLY acts on delegated tasks
function isDelegatedTask(task) {
  return (
    task.assigned_to !== null &&
    task.assigned_to !== 'self' &&
    task.assigned_from === task.user_id &&
    task.status !== 'done' &&
    !task.archived
  );
}
```

---

## 🔜 What's Next (Phase 2-4)

### **Phase 2: WhatsApp Integration**
- [ ] Install Twilio SDK: `npm install twilio`
- [ ] Create `lib/whatsapp.ts`
- [ ] Create webhook: `app/api/webhooks/whatsapp/route.ts`
- [ ] Send follow-up messages
- [ ] Receive status updates

### **Phase 3: Multi-turn Conversations**
- [ ] Create `lib/conversation.ts`
- [ ] Use Claude for natural language understanding
- [ ] Extract status, blockers, next steps
- [ ] Update task automatically

### **Phase 4: Autonomous Actions**
- [ ] Create cron job: `app/jobs/autonomous-followup/route.ts`
- [ ] Daily follow-up logic
- [ ] Escalation to owner
- [ ] Notification system

---

## 📋 Implementation Steps

### **Step 1: Run Migration**

In Supabase SQL Editor:
```sql
-- Run MIGRATION.sql
```

This will:
- Add new columns
- Migrate existing data
- Create indexes

### **Step 2: Set Up Twilio** (Optional - for WhatsApp)

1. Create Twilio account: https://www.twilio.com/
2. Get WhatsApp sandbox number
3. Add to `.env.local`:
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### **Step 3: Update Claude Prompt**

Update `lib/claude.ts` to extract `assigned_from` and `assigned_to`:

```typescript
// In task extraction prompt
"Extract:
- assigned_from: who is delegating (the speaker)
- assigned_to: who should do it (null or 'self' if speaker)
- status: not_started (default)
"
```

### **Step 4: Test Task Classification**

```typescript
import { isDelegatedTask } from '@/lib/task-classifier';

const task = {
  user_id: 'user_123',
  assigned_from: 'user_123',
  assigned_to: 'John',
  status: 'not_started',
  archived: false,
};

console.log(isDelegatedTask(task)); // true - Tia will act
```

---

## 🎯 User Experience

### **Creating Tasks**

#### **Self-Assigned**:
```
You: "I need to call the client tomorrow"

Tia creates:
- assigned_from: null
- assigned_to: "self"
- Tia: Just reminds you ⏰
```

#### **Delegated**:
```
You: "Ask John to call the client tomorrow"

Tia creates:
- assigned_from: "You"
- assigned_to: "John"
- Tia: Follows up with John 🤖
```

### **Follow-up Flow**

```
Day 1: Tia sends WhatsApp to John
"Hi John! Quick check on: Call the client. What's the status?"

John: "WIP - calling this afternoon"

Day 1 (evening): Tia follows up
"Hi John! Did you get a chance to call the client?"

John: "Done! Called and got approval"

Tia: Marks task done, notifies you ✅
```

### **Escalation**

```
Day 1: Tia follows up
Sarah: "Blocked - need data from finance"

Tia: Escalates to you immediately 🚨
"Sarah is blocked on 'Prepare slides'. Needs data from finance."

You: Provide data or reassign
Tia: Continues following up
```

---

## 📊 Database Schema

### **Tasks Table** (Updated)

```sql
CREATE TABLE tasks (
  -- Core fields
  id                UUID PRIMARY KEY,
  user_id           TEXT NOT NULL,
  title             TEXT NOT NULL,
  
  -- Delegation (NEW)
  assigned_from     TEXT,        -- Who delegated
  assigned_to       TEXT,        -- Who is responsible
  
  -- Status (UPDATED)
  status            TEXT DEFAULT 'not_started',
  status_details    JSONB DEFAULT '{}',
  
  -- Follow-up (NEW)
  next_action_date  DATE,
  last_followup_at  TIMESTAMPTZ,
  followup_count    INTEGER DEFAULT 0,
  needs_intervention BOOLEAN DEFAULT false,
  
  -- ... other fields
);
```

### **Status Details** (JSONB)

```json
{
  "current_status": "wip",
  "progress_percentage": 60,
  "blockers": null,
  "next_steps": ["Finish section 3", "Get approval"],
  "estimated_completion": "2026-05-26",
  "last_update_message": "Almost done",
  "updated_at": "2026-05-24T17:00:00Z",
  "updated_by": "assignee"
}
```

---

## 💰 Cost Estimate

### **Twilio WhatsApp**:
- $0.005 per message (~₹0.40)
- 100 messages/day = ₹1,200/month

### **Claude API**:
- Already using for task extraction
- Multi-turn adds ~₹500/month

**Total**: ~₹2,000/month for autonomous system

---

## 🔐 Security

### **Permission Model**

```typescript
// Tia can only act on tasks where:
function canTiaAct(task, userId) {
  return (
    task.user_id === userId &&           // Task belongs to user
    task.assigned_from === userId &&     // User delegated it
    task.assigned_to !== null &&         // Has assignee
    task.assigned_to !== 'self' &&       // Not self-assigned
    task.status !== 'done' &&            // Not done
    !task.archived                       // Not archived
  );
}
```

---

## 📝 Next Steps

1. **Run migration** in Supabase
2. **Test task classification** locally
3. **Set up Twilio** (optional)
4. **Implement WhatsApp integration**
5. **Create autonomous cron job**
6. **Test end-to-end flow**

---

## 🎉 Result

**Before**:
- Tasks sit there
- Manual follow-ups
- No visibility

**After**:
- ✅ Tia follows up automatically
- ✅ Gets status updates
- ✅ Escalates when needed
- ✅ You stay informed effortlessly

**Tia is now a REAL executive assistant!** 🚀
