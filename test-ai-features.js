#!/usr/bin/env node

// Test script to verify AI features are working
const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing MindGains AI Features');
console.log('================================');
console.log('📋 Supabase URL:', SUPABASE_URL ? 'Configured ✅' : 'Missing ❌');
console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? 'Configured ✅' : 'Missing ❌');
console.log('');

async function testSmartTextGeneration() {
  console.log('📝 Testing Smart Text Generation...');
  console.log('----------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'The Delhi Sultanate was a Muslim kingdom based mostly in Delhi that stretched over large parts of the Indian subcontinent for 320 years from 1206 to 1526.',
        method: 'text',
        contentType: 'historical_period',
        examFocus: 'upsc'
      })
    });

    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Response received successfully');
    console.log('📊 Content Structure:', Object.keys(data));
    
    if (data.content) {
      console.log('✅ Smart text generation working!');
      console.log('   - Overview:', data.content.overview ? 'Present' : 'Missing');
      console.log('   - Tabs:', data.content.tabs?.length || 0);
      console.log('   - Key Highlights:', data.content.keyHighlights?.length || 0);
      return true;
    }
    
  } catch (error) {
    console.log('💥 Error:', error.message);
    return false;
  }
}

async function testBattleQuizGeneration() {
  console.log('');
  console.log('⚔️ Testing Battle Quiz Generation...');
  console.log('-----------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-battle-content`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate_battle_questions',
        topic: 'Mixed Indian Competitive Exams',
        difficulty: 'mixed',
        questionCount: 10
      })
    });

    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Response received successfully');
    
    if (data.questions && Array.isArray(data.questions)) {
      console.log('✅ Battle quiz generation working!');
      console.log('   - Questions generated:', data.questions.length);
      console.log('   - Sample question:', data.questions[0]?.question?.substring(0, 50) + '...');
      return true;
    }
    
  } catch (error) {
    console.log('💥 Error:', error.message);
    return false;
  }
}

async function testCreateMission() {
  console.log('');
  console.log('🎯 Testing Mission Creation...');
  console.log('------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-mission`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Mission - Delhi Sultanate',
        description: 'Learn about the Delhi Sultanate period',
        content_type: 'text',
        content_text: 'The Delhi Sultanate ruled from 1206 to 1526',
        subject_name: 'History',
        difficulty: 'medium'
      })
    });

    console.log('📡 Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Mission creation working!');
    console.log('   - Mission ID:', data.id || 'Not returned');
    return true;
    
  } catch (error) {
    console.log('💥 Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  results.push(await testSmartTextGeneration());
  results.push(await testBattleQuizGeneration());
  results.push(await testCreateMission());
  
  console.log('');
  console.log('📊 Test Summary');
  console.log('===============');
  console.log('✅ Smart Text Generation:', results[0] ? 'Working' : 'Failed');
  console.log('✅ Battle Quiz Generation:', results[1] ? 'Working' : 'Failed');
  console.log('✅ Mission Creation:', results[2] ? 'Working' : 'Failed');
  
  const allPassed = results.every(r => r);
  console.log('');
  console.log(allPassed ? '🎉 All AI features are working!' : '❌ Some AI features are not working properly');
}

runTests();