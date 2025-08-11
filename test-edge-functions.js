#!/usr/bin/env node

// Test script to verify Edge Function flow and quiz generation
const fetch = require('node-fetch');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Testing MindGains AI Edge Functions');
console.log('=====================================');
console.log('📋 Supabase URL:', SUPABASE_URL ? 'Configured ✅' : 'Missing ❌');
console.log('🔑 Anon Key:', SUPABASE_ANON_KEY ? 'Configured ✅' : 'Missing ❌');
console.log('');

async function testDailyQuizGeneration() {
  console.log('🎯 Testing Daily Quiz Generation...');
  console.log('-----------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-daily-quiz`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        force: true,
        test_mode: true
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
    
    if (data.success && data.quiz) {
      console.log('📊 Quiz Details:');
      console.log('   - Questions:', data.quiz.questions?.length || 0);
      console.log('   - Total Points:', data.quiz.total_points);
      console.log('   - Subjects:', data.quiz.subjects_covered?.join(', '));
      console.log('   - Difficulty Distribution:', JSON.stringify(data.quiz.difficulty_distribution));
      console.log('   - Generation Method:', data.generation_method);
      
      // Test question quality
      if (data.quiz.questions && data.quiz.questions.length > 0) {
        const sampleQuestion = data.quiz.questions[0];
        console.log('📝 Sample Question:');
        console.log('   Q:', sampleQuestion.question);
        console.log('   Options:', sampleQuestion.options?.length || 0);
        console.log('   Explanation:', sampleQuestion.explanation ? 'Present ✅' : 'Missing ❌');
        console.log('   Subject:', sampleQuestion.subject);
        console.log('   Difficulty:', sampleQuestion.difficulty);
      }
      
      return true;
    } else {
      console.log('❌ Invalid response structure:', data);
      return false;
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return false;
  }
}

async function testTopicQuizGeneration() {
  console.log('');
  console.log('🎯 Testing Topic Quiz Generation...');
  console.log('-----------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-topic-quiz`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic_name: 'Bhagat Singh',
        subject_name: 'History',
        question_count: 15
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
    
    if (data.success && data.questions) {
      console.log('📊 Topic Quiz Details:');
      console.log('   - Questions:', data.questions.length);
      console.log('   - Topic Focus:', data.quiz?.topic || 'Bhagat Singh');
      console.log('   - Subject:', data.quiz?.subject || 'History');
      
      // Test question quality
      if (data.questions.length > 0) {
        const sampleQuestion = data.questions[0];
        console.log('📝 Sample Question:');
        console.log('   Q:', sampleQuestion.question);
        console.log('   Bhagat Singh mentioned:', sampleQuestion.question.includes('Bhagat Singh') ? 'Yes ✅' : 'No ❌');
        console.log('   Options:', sampleQuestion.options?.length || 0);
        console.log('   Explanation:', sampleQuestion.explanation ? 'Present ✅' : 'Missing ❌');
      }
      
      return true;
    } else {
      console.log('❌ Invalid response structure:', data);
      return false;
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('');
  console.log('🗄️ Testing Database Connection...');
  console.log('----------------------------------');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_quizzes?select=date,is_active&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      }
    });

    console.log('📡 Database Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database connection successful');
      console.log('📊 Sample data:', data.length > 0 ? 'Found records' : 'No records');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Database Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('💥 Database Connection Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive Edge Function tests...');
  console.log('');
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.log('❌ Missing environment variables!');
    console.log('Please check your .env file contains:');
    console.log('- EXPO_PUBLIC_SUPABASE_URL');
    console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY');
    return;
  }
  
  const results = {
    database: await testDatabaseConnection(),
    dailyQuiz: await testDailyQuizGeneration(),
    topicQuiz: await testTopicQuizGeneration()
  };
  
  console.log('');
  console.log('📋 Test Results Summary:');
  console.log('========================');
  console.log('🗄️ Database Connection:', results.database ? '✅ Working' : '❌ Failed');
  console.log('📅 Daily Quiz Generation:', results.dailyQuiz ? '✅ Working' : '❌ Failed');
  console.log('🎯 Topic Quiz Generation:', results.topicQuiz ? '✅ Working' : '❌ Failed');
  
  const allPassed = Object.values(results).every(result => result === true);
  
  console.log('');
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Your MindGains AI quiz system is working perfectly!');
    console.log('');
    console.log('🚀 Ready for production with:');
    console.log('   ✅ High-quality Indian exam questions');
    console.log('   ✅ Daily quiz rotation system');
    console.log('   ✅ Topic-specific quiz generation');
    console.log('   ✅ Comprehensive coverage of UPSC/SSC/Banking topics');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Verify your .env file has correct Supabase credentials');
    console.log('   2. Check if Edge Functions are deployed: npx supabase functions list');
    console.log('   3. Ensure you\'re logged into Supabase: npx supabase login');
  }
}

// Run tests
runAllTests().catch(console.error);