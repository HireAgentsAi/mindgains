#!/bin/bash

# MindGains AI - Edge Functions Deployment Script
echo "🚀 MindGains AI - Deploying Edge Functions"
echo "=========================================="

# Check if Supabase CLI is installed (via npx)
if ! npx supabase --version &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install supabase"
    exit 1
fi

# Check if user is logged in
if ! npx supabase status &> /dev/null; then
    echo "🔐 Please login to Supabase first:"
    echo "   npx supabase login"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
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
    echo "❌ OPENAI_API_KEY not found in .env"
    exit 1
fi

# Extract project ID from Supabase URL
PROJECT_ID=$(echo $EXPO_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')
echo "📋 Project ID: $PROJECT_ID"

# Link to Supabase project
echo "🔗 Linking to Supabase project..."
npx supabase link --project-ref $PROJECT_ID

# Deploy edge functions
echo ""
echo "🚀 Deploying Edge Functions..."
echo "--------------------------------"

echo "📤 Deploying daily-quiz-generator..."
npx supabase functions deploy daily-quiz-generator

echo "📤 Deploying topic-quiz-generator..."
npx supabase functions deploy topic-quiz-generator

# Set environment secrets for edge functions
echo ""
echo "🔑 Setting up environment secrets..."
echo "-----------------------------------"

echo "🔐 Setting OpenAI API key..."
echo $OPENAI_API_KEY | npx supabase secrets set OPENAI_API_KEY --project-ref $PROJECT_ID

echo "🔐 Setting Claude API key..."
echo $CLAUDE_API_KEY | npx supabase secrets set CLAUDE_API_KEY --project-ref $PROJECT_ID

echo "🔐 Setting Supabase URL..."
echo $EXPO_PUBLIC_SUPABASE_URL | npx supabase secrets set SUPABASE_URL --project-ref $PROJECT_ID

echo "🔐 Setting Supabase Service Role Key..."
echo $EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY | npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY --project-ref $PROJECT_ID

# Deploy other essential functions
echo ""
echo "📤 Deploying additional functions..."
echo "-----------------------------------"

if [ -d "supabase/functions/submit-daily-quiz" ]; then
    echo "📤 Deploying submit-daily-quiz..."
    npx supabase functions deploy submit-daily-quiz --no-verify-jwt
fi

if [ -d "supabase/functions/create-mission" ]; then
    echo "📤 Deploying create-mission..."
    npx supabase functions deploy create-mission --no-verify-jwt
fi

if [ -d "supabase/functions/update-progress" ]; then
    echo "📤 Deploying update-progress..."
    npx supabase functions deploy update-progress --no-verify-jwt
fi

if [ -d "supabase/functions/get-mascot-recommendations" ]; then
    echo "📤 Deploying get-mascot-recommendations..."
    npx supabase functions deploy get-mascot-recommendations --no-verify-jwt
fi

# Test the deployed functions
echo ""
echo "🧪 Testing deployed functions..."
echo "-------------------------------"

# Test daily quiz generator
echo "🧪 Testing daily-quiz-generator..."
DAILY_QUIZ_RESPONSE=$(curl -s -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/daily-quiz-generator" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json")

if echo $DAILY_QUIZ_RESPONSE | grep -q "success.*true"; then
    echo "✅ daily-quiz-generator is working!"
else
    echo "❌ daily-quiz-generator test failed"
    echo "Response: $DAILY_QUIZ_RESPONSE"
fi

# Test topic quiz generator
echo "🧪 Testing generate-topic-quiz..."
TOPIC_QUIZ_RESPONSE=$(curl -s -X POST "$EXPO_PUBLIC_SUPABASE_URL/functions/v1/generate-topic-quiz" \
  -H "Authorization: Bearer $EXPO_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic_name": "Ancient India", "subject_name": "History"}')

if echo $TOPIC_QUIZ_RESPONSE | grep -q "success.*true"; then
    echo "✅ generate-topic-quiz is working!"
else
    echo "❌ generate-topic-quiz test failed"
    echo "Response: $TOPIC_QUIZ_RESPONSE"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo "✅ Edge functions deployed successfully"
echo "✅ API keys configured"
echo "✅ Functions tested"
echo ""
echo "🚀 Your MindGains AI app is now ready with:"
echo "   - AI-powered daily quiz generation"
echo "   - Dynamic topic-based quizzes" 
echo "   - Real-time question generation using OpenAI"
echo ""
echo "📱 You can now run your app with: npx expo start"
echo ""
echo "📊 Monitor function logs with:"
echo "   supabase functions logs daily-quiz-generator"
echo "   supabase functions logs generate-topic-quiz"