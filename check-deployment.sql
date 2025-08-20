-- Check deployment status
SELECT 'Battle Tables' as category, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%battle%'
UNION ALL
SELECT 'Bot Tables' as category, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%bot%'
UNION ALL 
SELECT 'Subscription Tables' as category, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%subscription%'
UNION ALL
SELECT 'Pro User Setup' as category, COUNT(*) as count FROM user_subscriptions WHERE subscription_type = 'Premium Lifetime';