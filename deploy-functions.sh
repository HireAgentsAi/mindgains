#!/bin/bash

# MindGains AI - Database and Functions Deployment Script
echo "🚀 Starting MindGains AI Database + Functions Deployment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if user is logged in
echo "🔐 Checking Supabase authentication..."
supabase status 2>/dev/null || {
    echo "Please login to Supabase first:"
    echo "supabase login"
    exit 1
}

# Deploy database migrations
echo "📊 Deploying database migrations..."
echo "Migration 1: Battle System Tables..."
supabase db push --file ./supabase/migrations/20250812123000_battle_system.sql

echo "Migration 2: Battle Subscription System..."  
supabase db push --file ./supabase/migrations/20250812124000_battle_subscription.sql

# Deploy edge functions
echo "⚡ Deploying Edge Functions..."

echo "Function 1: AI Battle Content..."
supabase functions deploy ai-battle-content --no-verify-jwt

echo "Function 2: Battle Operations..."
supabase functions deploy battle-operations --no-verify-jwt

# Set environment variables (you need to do this manually in dashboard)
echo "🔧 Environment Variables Setup Required:"
echo "Go to Supabase Dashboard > Settings > Edge Functions > Environment Variables"
echo "Add these variables:"
echo "- OPENAI_API_KEY=your_key_here"
echo "- CLAUDE_API_KEY=your_key_here" 
echo "- GROK_API_KEY=your_key_here"

# Test deployment
echo "🧪 Testing deployment..."
echo "Testing popular topics endpoint..."
curl -X POST "$(supabase status | grep 'Edge Functions' | awk '{print $3}')/ai-battle-content" \
  -H "Content-Type: application/json" \
  -d '{"action": "get_popular_topics"}'

echo ""
echo "✅ Deployment Complete!"
echo "🎯 Next steps:"
echo "1. Set environment variables in Supabase Dashboard"
echo "2. Test battle creation in your app"
echo "3. Verify ragularvind84@gmail.com has Pro status"
echo ""
echo "🎉 Your MindGains AI battle system is now live!"