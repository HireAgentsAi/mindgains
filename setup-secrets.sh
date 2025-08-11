#!/bin/bash

# MindGains AI - Setup API Keys in Supabase Secrets
echo "🔐 MindGains AI - Setting up API Keys"
echo "====================================="

# Load environment variables
if [ -f .env ]; then
    source .env
    echo "✅ Environment variables loaded from .env"
else
    echo "❌ .env file not found!"
    exit 1
fi

echo "🔑 Setting up Supabase secrets..."
echo "⚠️  Make sure you're logged in: npx supabase login"
echo ""

# Set OpenAI API key
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "🔐 Setting OpenAI API key..."
    echo "$OPENAI_API_KEY" | npx supabase secrets set OPENAI_API_KEY --project-ref iyguhaxhomtcjafvfupu
    echo "✅ OpenAI API key set successfully"
else
    echo "❌ OPENAI_API_KEY not found in .env"
fi

# Set Claude API key (optional)
if [ ! -z "$CLAUDE_API_KEY" ]; then
    echo "🔐 Setting Claude API key..."
    echo "$CLAUDE_API_KEY" | npx supabase secrets set CLAUDE_API_KEY --project-ref iyguhaxhomtcjafvfupu
    echo "✅ Claude API key set successfully"
fi

# Set Grok API key (optional)
if [ ! -z "$GROK_API_KEY" ]; then
    echo "🔐 Setting Grok API key..."
    echo "$GROK_API_KEY" | npx supabase secrets set GROK_API_KEY --project-ref iyguhaxhomtcjafvfupu
    echo "✅ Grok API key set successfully"
fi

echo ""
echo "🎉 API Keys Setup Complete!"
echo "========================="
echo "✅ All API keys have been set in Supabase secrets"
echo "✅ Edge functions will now use AI for quiz generation"
echo ""
echo "📊 You can verify secrets with:"
echo "   npx supabase secrets list --project-ref iyguhaxhomtcjafvfupu"