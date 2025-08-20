# 🚀 Windows Deployment Guide - Supabase Dashboard Method

Since Supabase CLI has installation issues on Windows, we'll deploy via the Dashboard (actually easier!).

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Deploy Database Tables

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Create a new query and paste the following:

#### First Migration (Battle System):
```sql
-- Copy the entire content from: supabase/migrations/20250812123000_battle_system.sql
-- This creates battle_rooms, battle_participants, battle_invites, etc.
```

5. Click **Run** to execute
6. Create another new query for the second migration:

#### Second Migration (Subscription System - FIXED):
```sql
-- Copy the entire content from: supabase/migrations/20250812124000_battle_subscription.sql
-- This sets up subscription tracking and your Pro account
-- NOTE: This file has been fixed to resolve all ON CONFLICT errors
```

7. Click **Run** to execute

8. Create a third query for the smart bot system:

#### Third Migration (Smart Bot System):
```sql
-- Copy the entire content from: supabase/migrations/20250813000000_smart_bot_system.sql
-- This creates intelligent bot opponents with human-like behavior
```

9. Click **Run** to execute

### Step 2: Deploy Edge Functions

1. In Supabase Dashboard, go to **Edge Functions**
2. Click **Create a new function**
3. Name: `ai-battle-content`
4. Copy the entire content from: `supabase/functions/ai-battle-content/index.ts`
5. Click **Deploy function**

6. Repeat for second function:
   - Name: `battle-operations`
   - Copy content from: `supabase/functions/battle-operations/index.ts`
   - Click **Deploy function**

### Step 3: Set Environment Variables

1. Go to **Settings** > **Edge Functions**
2. Scroll to **Environment Variables**
3. Add these variables:

```
OPENAI_API_KEY=sk-your-openai-key-here
CLAUDE_API_KEY=sk-ant-your-claude-key-here
GROK_API_KEY=xai-your-grok-key-here
```

### Step 4: Verify Deployment

#### Test Database Tables:
In SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%battle%'
ORDER BY table_name;
```

Should return 10 tables:
- battle_achievements
- battle_invites
- battle_participants
- battle_rooms
- battle_stats
- battle_transactions
- popular_battle_topics
- bot_profiles
- bot_behavior_patterns
- bot_response_history

#### Test Your Pro Account:
```sql
SELECT 
  u.email,
  s.subscription_type,
  s.status,
  c.balance as coins
FROM auth.users u
LEFT JOIN user_subscriptions s ON u.id = s.user_id
LEFT JOIN user_coins c ON u.id = c.user_id
WHERE u.email = 'ragularvind84@gmail.com';
```

Should show: Pro status + 50,000 coins

#### Test Edge Functions:
1. Go to **Edge Functions** tab
2. Click on `ai-battle-content`
3. In the test panel, paste:
```json
{
  "action": "get_popular_topics"
}
```
4. Click **Send request**
5. Should return popular topics array

## Method 2: Alternative CLI Installation (If needed later)

### Option A: Chocolatey (Windows Package Manager)
```powershell
# Install chocolatey first: https://chocolatey.org/install
choco install supabase
```

### Option B: Direct Binary Download
1. Go to: https://github.com/supabase/cli/releases
2. Download `supabase_windows_amd64.tar.gz`
3. Extract and add to PATH

### Option C: WSL (Windows Subsystem for Linux)
```bash
# In WSL terminal
curl -sSf https://supabase.com/install.sh | sh
```

## 🎯 Quick Test After Deployment

1. **Start your app**: `npm run dev`
2. **Go to Battle tab**
3. **Check these work**:
   - ✅ Popular topics load
   - ✅ Coin balance shows (you should see 50,000)
   - ✅ Custom topic input (Pro feature)
   - ✅ Create battle room
   - ✅ AI moderation (try entering "inappropriate content")

## 🚨 Troubleshooting

**If functions don't work:**
- Check Environment Variables are set correctly
- Verify functions deployed without errors
- Check function logs in Dashboard

**If database queries fail:**
- Check migrations ran successfully
- Look for error messages in SQL Editor
- Verify table permissions

**If your account isn't Pro:**
- Re-run the subscription migration
- Check the user_subscriptions table
- Manually insert Pro record if needed

## ✅ Success Indicators

- [ ] 7 battle tables created
- [ ] 2 edge functions deployed  
- [ ] Environment variables set
- [ ] ragularvind84@gmail.com has Pro status
- [ ] Battle creation works in app
- [ ] AI features functional

**Once these are checked, your battle system is LIVE! 🔥**