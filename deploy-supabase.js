// Automated Supabase Deployment Script
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

console.log('\x1b[36m%s\x1b[0m', '🚀 Supabase Automated Deployment');
console.log('================================\n');

async function deployToSupabase() {
  try {
    // Get credentials
    console.log('\x1b[33m%s\x1b[0m', '📋 Please provide your Supabase credentials:\n');
    
    const projectUrl = await question('Supabase Project URL (e.g., https://xxxxx.supabase.co): ');
    const anonKey = await question('Supabase Anon Key: ');
    const serviceKey = await question('Supabase Service Role Key: ');
    
    console.log('\n\x1b[32m%s\x1b[0m', '✅ Credentials received\n');

    // SQL Migrations
    const migrations = [
      {
        file: './supabase/migrations/20250812123000_battle_system.sql',
        name: 'Battle System Tables'
      },
      {
        file: './supabase/migrations/20250812124000_battle_subscription.sql',
        name: 'Subscription System'
      },
      {
        file: './supabase/migrations/20250813000000_smart_bot_system.sql',
        name: 'Smart Bot System'
      }
    ];

    console.log('\x1b[36m%s\x1b[0m', '🗄️  Deploying Database Migrations...\n');

    for (const migration of migrations) {
      console.log(`📝 Reading ${migration.name}...`);
      
      try {
        const sql = await fs.readFile(migration.file, 'utf8');
        console.log(`   ✅ File loaded (${sql.length} characters)`);
        
        // Note: Direct SQL execution via API requires proper setup
        console.log(`   ⚠️  Please copy the SQL from ${migration.file} to Supabase SQL Editor`);
      } catch (error) {
        console.log(`   ❌ Error reading file: ${error.message}`);
      }
    }

    // Generate deployment guide
    const deploymentGuide = `
# 🚀 SUPABASE DEPLOYMENT GUIDE
Generated on: ${new Date().toLocaleString()}

## 📋 Your Project Details
- **Project URL**: ${projectUrl}
- **Status**: Ready for deployment

## 🗄️ Database Migrations (Run in SQL Editor)

### 1. Battle System Tables
\`\`\`sql
-- Copy from: supabase/migrations/20250812123000_battle_system.sql
-- Creates: battle_rooms, battle_participants, battle_invites, etc.
\`\`\`

### 2. Subscription System
\`\`\`sql
-- Copy from: supabase/migrations/20250812124000_battle_subscription.sql
-- Creates: subscription_plans, user_subscriptions, battle_stats, etc.
-- Sets up ragularvind84@gmail.com as Pro user with 50k coins
\`\`\`

### 3. Smart Bot System
\`\`\`sql
-- Copy from: supabase/migrations/20250813000000_smart_bot_system.sql
-- Creates: bot_profiles, bot_behavior_patterns, name generation system
-- Adds 80 bot personalities with 350+ Indian names
\`\`\`

## ⚡ Edge Functions

### 1. Create 'ai-battle-content' function
- Go to: ${projectUrl}/project/default/functions
- Create new function: \`ai-battle-content\`
- Copy code from: \`supabase/functions/ai-battle-content/index.ts\`

### 2. Create 'battle-operations' function
- Create new function: \`battle-operations\`
- Copy code from: \`supabase/functions/battle-operations/index.ts\`

### 3. Set Environment Variables
In Edge Functions settings, add:
- \`OPENAI_API_KEY\` = your-openai-key
- \`CLAUDE_API_KEY\` = your-claude-key
- \`GROK_API_KEY\` = your-grok-key

## ✅ Verification Checklist

### Database Tables (Should see 10 battle tables):
\`\`\`sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%battle%'
ORDER BY table_name;
\`\`\`

### Pro User Setup:
\`\`\`sql
SELECT u.email, s.subscription_type, s.status, c.balance
FROM auth.users u
LEFT JOIN user_subscriptions s ON u.id = s.user_id
LEFT JOIN user_coins c ON u.id = c.user_id
WHERE u.email = 'ragularvind84@gmail.com';
\`\`\`

### Test Edge Functions:
1. ai-battle-content: \`{ "action": "get_popular_topics" }\`
2. battle-operations: \`{ "action": "get_user_coins" }\`

## 🎮 Test the App
1. Run: \`npm run dev\`
2. Go to Battle tab
3. Try Quick Battle (smart bot matching)
4. Create custom battles with AI topics
5. Check your 50,000 coins balance

## 🎯 You're ready to become a billionaire! 💰
`;

    // Save deployment guide
    await fs.writeFile('DEPLOYMENT_GUIDE.md', deploymentGuide);
    console.log('\n\x1b[32m%s\x1b[0m', '✅ Deployment guide created: DEPLOYMENT_GUIDE.md');

    // Clean up old files
    console.log('\n\x1b[36m%s\x1b[0m', '🧹 Cleaning up old files...');
    
    const filesToDelete = [
      './supabase/migrations/20250812124000_battle_subscription_FIXED.sql',
      './deploy-database.md',
      './deploy-to-supabase.ps1' // Remove PS1 script since we have this JS version
    ];

    for (const file of filesToDelete) {
      try {
        await fs.unlink(file);
        console.log(`   🗑️  Deleted: ${file}`);
      } catch (error) {
        // File doesn't exist, that's fine
      }
    }

    console.log('\n\x1b[35m%s\x1b[0m', '✨ Deployment preparation complete!');
    console.log('\n\x1b[33m%s\x1b[0m', '📋 Next Steps:');
    console.log('1. Open DEPLOYMENT_GUIDE.md');
    console.log('2. Follow the step-by-step instructions');
    console.log('3. Deploy via Supabase Dashboard');
    console.log('4. Test your battle system!');
    
    console.log('\n\x1b[32m%s\x1b[0m', '🎯 Your app is ready for the #1 spot in India! 🇮🇳');

  } catch (error) {
    console.error('\n\x1b[31m%s\x1b[0m', '❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the deployment
deployToSupabase();