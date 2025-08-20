const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (you'll need to add your keys)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env');
  console.log('Please check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test functions mapping
const testFunctions = [
  // Core Learning Functions
  {
    name: 'daily-quiz-generator',
    description: 'Daily quiz generation',
    testPayload: { subject: 'History', difficulty: 'medium' },
    required: true
  },
  {
    name: 'create-mission',
    description: 'Mission creation with AI',
    testPayload: { 
      title: 'Test Mission',
      content_type: 'text',
      content_text: 'Indian Independence Movement',
      subject_name: 'History'
    },
    required: true
  },
  {
    name: 'get-mission-content',
    description: 'Retrieve mission content',
    testPayload: { missionId: 'test-mission-id' },
    required: true
  },

  // New Processing Functions
  {
    name: 'process-image-ocr',
    description: 'Camera OCR processing',
    testPayload: { 
      imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//2Q=',
      imageType: 'image/jpeg'
    },
    required: false // Optional since it needs Google Vision API billing
  },
  {
    name: 'process-pdf',
    description: 'PDF text extraction',
    testPayload: {
      fileData: 'JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0xlbmd0aCA0NDAKL0ZpbHRlciAvRmxhdGVEZWNvZGUKPj4Kc3RyZWFtCnicBYuxDQAyDAPj',
      fileName: 'test.pdf'
    },
    required: false // Optional since it needs PDF.co API
  },
  {
    name: 'process-youtube',
    description: 'YouTube video processing',
    testPayload: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    required: false // Optional since it needs YouTube API
  },

  // Battle System Functions
  {
    name: 'battle-operations',
    description: 'Battle system operations',
    testPayload: { action: 'create_room', difficulty: 'medium' },
    required: true
  },
  {
    name: 'ai-battle-content',
    description: 'AI battle content generation',
    testPayload: { topic: 'Indian History', difficulty: 'medium' },
    required: true
  },

  // India Challenge Functions
  {
    name: 'india-challenge',
    description: 'Daily India Challenge system',
    testPayload: { action: 'get_challenges' },
    required: true
  },

  // Quiz Functions
  {
    name: 'generate-subject-quiz',
    description: 'Subject quiz generation',
    testPayload: { subject: 'History', count: 5 },
    required: true
  },
  {
    name: 'topic-quiz-generator',
    description: 'Topic quiz generation',
    testPayload: { topic: 'Ancient India', difficulty: 'medium' },
    required: true
  }
];

async function testFunction(functionName, payload, isRequired = true) {
  console.log(`\n🧪 Testing: ${functionName}`);
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload
    });

    if (error) {
      console.log(`❌ ${functionName}: ${error.message}`);
      if (isRequired) {
        return { name: functionName, status: 'FAILED', error: error.message };
      } else {
        return { name: functionName, status: 'OPTIONAL_FAIL', error: error.message };
      }
    }

    console.log(`✅ ${functionName}: Working`);
    return { name: functionName, status: 'SUCCESS' };

  } catch (error) {
    console.log(`❌ ${functionName}: ${error.message}`);
    if (isRequired) {
      return { name: functionName, status: 'FAILED', error: error.message };
    } else {
      return { name: functionName, status: 'OPTIONAL_FAIL', error: error.message };
    }
  }
}

async function runAllTests() {
  console.log('🚀 MindGains AI - Edge Functions Audit\n');
  console.log('='.repeat(50));

  const results = [];
  
  for (const func of testFunctions) {
    const result = await testFunction(func.name, func.testPayload, func.required);
    result.description = func.description;
    result.required = func.required;
    results.push(result);
  }

  // Generate Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 EDGE FUNCTIONS AUDIT REPORT');
  console.log('='.repeat(50));

  const working = results.filter(r => r.status === 'SUCCESS');
  const failed = results.filter(r => r.status === 'FAILED');
  const optionalFailed = results.filter(r => r.status === 'OPTIONAL_FAIL');

  console.log(`\n✅ WORKING FUNCTIONS (${working.length}):`);
  working.forEach(r => {
    console.log(`   ✅ ${r.name} - ${r.description}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ CRITICAL FAILURES (${failed.length}):`);
    failed.forEach(r => {
      console.log(`   ❌ ${r.name} - ${r.description}`);
      console.log(`      Error: ${r.error}`);
    });
  }

  if (optionalFailed.length > 0) {
    console.log(`\n⚠️  OPTIONAL FAILURES (${optionalFailed.length}):`);
    optionalFailed.forEach(r => {
      console.log(`   ⚠️  ${r.name} - ${r.description}`);
      console.log(`      Error: ${r.error}`);
    });
  }

  // Overall Status
  console.log('\n' + '='.repeat(50));
  if (failed.length === 0) {
    console.log('🎉 ALL CRITICAL FUNCTIONS WORKING!');
    console.log('🚀 Your MindGains AI app is ready to launch!');
    
    if (optionalFailed.length > 0) {
      console.log(`\n💡 ${optionalFailed.length} optional features need API keys to work fully.`);
    }
  } else {
    console.log(`❌ ${failed.length} critical functions need attention.`);
  }

  console.log('\n📱 App Features Status:');
  console.log(`   ${working.some(r => r.name === 'daily-quiz-generator') ? '✅' : '❌'} Daily Quiz System`);
  console.log(`   ${working.some(r => r.name === 'create-mission') ? '✅' : '❌'} Mission Creation`);
  console.log(`   ${working.some(r => r.name === 'battle-operations') ? '✅' : '❌'} Battle System`);
  console.log(`   ${working.some(r => r.name === 'india-challenge') ? '✅' : '❌'} India Challenge`);
  console.log(`   ${working.some(r => r.name === 'process-pdf') ? '✅' : '⚠️ '} PDF Processing`);
  console.log(`   ${working.some(r => r.name === 'process-youtube') ? '✅' : '⚠️ '} YouTube Processing`);
  console.log(`   ${working.some(r => r.name === 'process-image-ocr') ? '✅' : '⚠️ '} Camera OCR`);

  return results;
}

// Run the audit
runAllTests().catch(console.error);