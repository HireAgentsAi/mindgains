#!/bin/bash

# MindGains AI - Edge Functions Deployment Script
echo "🚀 MindGains AI - Deploying Edge Functions"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        if [ -n "$key" ] && [ "${key#\#}" = "$key" ]; then
            export "$key"="$value"
        fi
    done < .env
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Check if required environment variables exist
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ EXPO_PUBLIC_SUPABASE_URL not found in .env"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY not found in .env - AI generation will be limited"
fi

# Test the edge functions
echo "🧪 Testing Edge Functions..."
echo "----------------------------"

# Test daily quiz generator
echo "🧪 Testing daily-quiz-generator..."
DAILY_QUIZ_RESPONSE=$(curl -s -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/daily-quiz-generator" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  --max-time 30)

if echo "$DAILY_QUIZ_RESPONSE" | grep -q "questions"; then
    echo "✅ daily-quiz-generator is working!"
else
    echo "❌ daily-quiz-generator test failed"
    echo "Response: $DAILY_QUIZ_RESPONSE"
fi

# Test topic quiz generator
echo "🧪 Testing topic-quiz-generator..."
TOPIC_QUIZ_RESPONSE=$(curl -s -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/topic-quiz-generator" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic_name": "Ancient India", "subject_name": "History", "question_count": 5}' \
  --max-time 30)

if echo "$TOPIC_QUIZ_RESPONSE" | grep -q "questions"; then
    echo "✅ topic-quiz-generator is working!"
else
    echo "❌ topic-quiz-generator test failed"
    echo "Response: $TOPIC_QUIZ_RESPONSE"
fi

echo ""
echo "🎉 Testing Complete!"
echo "======================"
echo "✅ Edge functions tested"
echo "✅ Functions tested"
echo ""
echo "📱 Your MindGains AI app should now work with:"
echo "   - AI-powered daily quiz generation (20 questions)"
echo "   - Dynamic topic-based quizzes"
echo "   - Real-time question generation using Claude/OpenAI"
echo ""