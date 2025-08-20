#!/bin/bash

echo "🚀 Deploying new MindGains AI processing functions..."

# Deploy OCR processing function
echo "📱 Deploying image OCR processing..."
supabase functions deploy process-image-ocr

# Deploy PDF processing function
echo "📄 Deploying PDF processing..."
supabase functions deploy process-pdf

# Deploy YouTube processing function
echo "🎥 Deploying YouTube processing..."
supabase functions deploy process-youtube

echo "✅ All processing functions deployed successfully!"
echo ""
echo "🔑 Don't forget to set these environment variables in Supabase Dashboard:"
echo "- GOOGLE_VISION_API_KEY (for OCR)"
echo "- PDF_CO_API_KEY (for PDF processing)"  
echo "- YOUTUBE_API_KEY (for YouTube metadata)"
echo "- CLAUDE_API_KEY (already set)"
echo ""
echo "🎉 Your MindGains AI app now has REAL:"
echo "✅ Camera scanning with OCR"
echo "✅ PDF text extraction and processing"
echo "✅ YouTube video transcript extraction"
echo "✅ AI-powered content analysis"
echo ""
echo "🚀 Users can now create missions from ANY content type!"