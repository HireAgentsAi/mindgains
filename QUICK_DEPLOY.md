# 🚀 QUICK DEPLOYMENT CHECKLIST

## 1️⃣ Run Deployment Script
```bash
node deploy-supabase.js
```

## 2️⃣ Deploy to Supabase Dashboard

### SQL Migrations (in order):
1. **Battle System** → `supabase/migrations/20250812123000_battle_system.sql`
2. **Subscription** → `supabase/migrations/20250812124000_battle_subscription.sql`  
3. **Smart Bots** → `supabase/migrations/20250813000000_smart_bot_system.sql`

### Edge Functions:
1. **ai-battle-content** → Copy from `supabase/functions/ai-battle-content/index.ts`
2. **battle-operations** → Copy from `supabase/functions/battle-operations/index.ts`

### Environment Variables:
```
OPENAI_API_KEY=your-key
CLAUDE_API_KEY=your-key
GROK_API_KEY=your-key
```

## 3️⃣ Verify Deployment

### Check Tables:
```sql
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%battle%';
-- Should return: 10
```

### Check Pro Account:
```sql
SELECT email, subscription_type, balance FROM auth.users u
JOIN user_subscriptions s ON u.id = s.user_id
JOIN user_coins c ON u.id = c.user_id
WHERE email = 'ragularvind84@gmail.com';
-- Should show: Premium Lifetime, 50000 coins
```

## 4️⃣ Test Features
- ✅ Quick Battle with smart bot matching
- ✅ Custom topic battles  
- ✅ AI content moderation
- ✅ WhatsApp invites
- ✅ Coin transactions
- ✅ Pro features unlocked

## 🎯 Ready to Launch! 🚀