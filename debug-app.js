#!/usr/bin/env node

// Comprehensive debugging script for MindGains app
require('dotenv').config();

console.log('🔍 MindGains App Debugging');
console.log('==========================\n');

// 1. Check Environment Variables
console.log('1️⃣ Environment Variables Check');
console.log('-------------------------------');
const envVars = {
  'EXPO_PUBLIC_SUPABASE_URL': process.env.EXPO_PUBLIC_SUPABASE_URL,
  'EXPO_PUBLIC_SUPABASE_ANON_KEY': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  'CLAUDE_API_KEY': process.env.CLAUDE_API_KEY,
  'GROK_API_KEY': process.env.GROK_API_KEY,
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value ? '✅ Set' : '❌ Missing'}`);
});

// 2. Check Edge Functions Deployment
console.log('\n2️⃣ Edge Functions Deployment Check');
console.log('-----------------------------------');
const fs = require('fs');
const path = require('path');

const functionsDir = path.join(__dirname, 'supabase', 'functions');
if (fs.existsSync(functionsDir)) {
  const functions = fs.readdirSync(functionsDir).filter(f => fs.statSync(path.join(functionsDir, f)).isDirectory());
  console.log(`Found ${functions.length} edge functions:`);
  functions.forEach(func => {
    const indexPath = path.join(functionsDir, func, 'index.ts');
    const exists = fs.existsSync(indexPath);
    console.log(`  - ${func}: ${exists ? '✅ Has index.ts' : '❌ Missing index.ts'}`);
  });
} else {
  console.log('❌ Edge functions directory not found!');
}

// 3. Check Required Files
console.log('\n3️⃣ Required Files Check');
console.log('-----------------------');
const requiredFiles = [
  'app/(tabs)/learn.tsx',
  'app/(tabs)/battle.tsx',
  'components/ui/ContentGenerationModal.tsx',
  'utils/supabaseService.ts',
  'utils/edgeFunctionService.ts',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
});

// 4. Common Issues and Solutions
console.log('\n4️⃣ Common Issues & Solutions');
console.log('-----------------------------');
console.log('Issue 1: Smart Text Generation not working');
console.log('  → Solution: Fixed missing Alert import in learn.tsx ✅');
console.log('  → Solution: Removed duplicate createMission method ✅');
console.log('');
console.log('Issue 2: Quick Battle not working');
console.log('  → Cause: ai-battle-content requires authentication');
console.log('  → Solution: Need to ensure user is logged in before calling');
console.log('');
console.log('Issue 3: Edge functions returning "Unauthorized"');
console.log('  → Cause: Functions require valid user token');
console.log('  → Solution: Ensure auth headers are properly sent');

// 5. Recommendations
console.log('\n5️⃣ Recommendations');
console.log('------------------');
console.log('1. Run the app and check browser console for errors');
console.log('2. Ensure user is logged in before testing features');
console.log('3. Check Supabase dashboard for edge function logs');
console.log('4. Verify API keys are valid and not expired');
console.log('5. Test with the provided demo accounts');

console.log('\n✅ Debugging complete!\n');