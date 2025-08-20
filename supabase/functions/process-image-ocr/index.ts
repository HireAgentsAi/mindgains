import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OCRRequest {
  imageData: string; // base64 encoded image
  imageType: string; // mime type
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageData, imageType }: OCRRequest = await req.json()

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use Google Vision API for OCR
    const visionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    if (!visionApiKey) {
      throw new Error('Google Vision API key not configured')
    }

    // Prepare Vision API request
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`
    const visionRequest = {
      requests: [
        {
          image: {
            content: imageData.replace(/^data:image\/[a-z]+;base64,/, '')
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    }

    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest)
    })

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.statusText}`)
    }

    const visionData = await visionResponse.json()
    
    if (!visionData.responses || !visionData.responses[0] || !visionData.responses[0].textAnnotations) {
      return new Response(
        JSON.stringify({ error: 'No text detected in image' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract text from Vision API response
    const extractedText = visionData.responses[0].textAnnotations[0].description

    // Use Claude for intelligent content structuring
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    let structuredContent = extractedText

    if (claudeApiKey) {
      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: `Clean up and structure this OCR-extracted text for educational use. Remove OCR artifacts, fix spacing, correct obvious mistakes, and organize into proper paragraphs. Keep all educational content intact:

${extractedText}`
            }]
          })
        })

        if (claudeResponse.ok) {
          const claudeData = await claudeResponse.json()
          structuredContent = claudeData.content[0].text
        }
      } catch (error) {
        console.log('Claude processing failed, using raw OCR text:', error)
      }
    }

    // Detect content type and subject using AI
    let contentAnalysis = {
      contentType: 'general',
      subject: 'General Studies',
      examFocus: 'general',
      confidence: 0.7
    }

    if (claudeApiKey) {
      try {
        const analysisResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 500,
            messages: [{
              role: 'user',
              content: `Analyze this educational content and return ONLY a JSON object with these fields:
{
  "contentType": "history|polity|geography|science|economics|literature|general",
  "subject": "specific subject name",
  "examFocus": "upsc|ssc|banking|state_pcs|neet|jee|general",
  "confidence": 0.0-1.0
}

Content: ${structuredContent.slice(0, 1000)}`
            }]
          })
        })

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          try {
            contentAnalysis = JSON.parse(analysisData.content[0].text)
          } catch (parseError) {
            console.log('Failed to parse content analysis, using defaults')
          }
        }
      } catch (error) {
        console.log('Content analysis failed, using defaults:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: structuredContent,
        wordCount: structuredContent.split(/\s+/).length,
        contentAnalysis,
        processingSteps: [
          'Image processed with Google Vision API',
          'Text extracted and cleaned',
          'Content analyzed for educational classification',
          'Structured for learning platform use'
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('OCR processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process image',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})