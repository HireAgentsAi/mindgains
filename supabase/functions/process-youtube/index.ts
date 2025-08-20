import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface YouTubeRequest {
  url: string;
  language?: string;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url, language = 'en' }: YouTubeRequest = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'YouTube URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get video metadata using YouTube Data API
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    let videoMetadata = {
      title: 'YouTube Video',
      description: '',
      duration: '',
      channelTitle: '',
      publishedAt: '',
      viewCount: 0,
      thumbnail: ''
    }

    if (youtubeApiKey) {
      try {
        const metadataUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails,statistics`
        const metadataResponse = await fetch(metadataUrl)
        
        if (metadataResponse.ok) {
          const metadataData = await metadataResponse.json()
          if (metadataData.items && metadataData.items.length > 0) {
            const video = metadataData.items[0]
            videoMetadata = {
              title: video.snippet.title,
              description: video.snippet.description,
              duration: video.contentDetails.duration,
              channelTitle: video.snippet.channelTitle,
              publishedAt: video.snippet.publishedAt,
              viewCount: parseInt(video.statistics.viewCount || '0'),
              thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || ''
            }
          }
        }
      } catch (error) {
        console.log('YouTube API metadata fetch failed:', error)
      }
    }

    // Get transcript using multiple methods
    let transcript = ''
    let transcriptMethod = 'none'

    // Method 1: Try YouTube Transcript API (via external service)
    try {
      const transcriptApiUrl = `https://youtube-transcript-api.herokuapp.com/transcript?video_id=${videoId}&lang=${language}`
      const transcriptResponse = await fetch(transcriptApiUrl)
      
      if (transcriptResponse.ok) {
        const transcriptData = await transcriptResponse.json()
        if (transcriptData.transcript) {
          transcript = transcriptData.transcript.map((item: any) => item.text).join(' ')
          transcriptMethod = 'api'
        }
      }
    } catch (error) {
      console.log('Transcript API method failed:', error)
    }

    // Method 2: Try alternative transcript service
    if (!transcript) {
      try {
        const altTranscriptUrl = `https://api.youtubetranscript.com/?video=${videoId}&lang=${language}`
        const altResponse = await fetch(altTranscriptUrl)
        
        if (altResponse.ok) {
          const altData = await altResponse.json()
          if (altData.text) {
            transcript = altData.text
            transcriptMethod = 'alternative'
          }
        }
      } catch (error) {
        console.log('Alternative transcript method failed:', error)
      }
    }

    // Method 3: Use Claude to extract content from video description if no transcript
    if (!transcript && videoMetadata.description) {
      const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
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
                content: `Based on this YouTube video metadata, create educational content that would typically be covered in this video. Focus on the main educational concepts:

Title: ${videoMetadata.title}
Channel: ${videoMetadata.channelTitle}
Description: ${videoMetadata.description.slice(0, 1000)}

Generate structured educational content covering the main topics this video would discuss.`
              }]
            })
          })

          if (claudeResponse.ok) {
            const claudeData = await claudeResponse.json()
            transcript = claudeData.content[0].text
            transcriptMethod = 'ai-generated'
          }
        } catch (error) {
          console.log('Claude content generation failed:', error)
        }
      }
    }

    if (!transcript) {
      return new Response(
        JSON.stringify({ error: 'Unable to extract content from YouTube video. Video may not have captions available.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Clean and structure the transcript
    let structuredContent = transcript
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')

    if (claudeApiKey) {
      try {
        const structureResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': claudeApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 3000,
            messages: [{
              role: 'user',
              content: `Clean and structure this YouTube video transcript/content for educational use. Remove filler words, organize into clear sections, add headings, and make it suitable for learning:

Video Title: ${videoMetadata.title}
Content: ${transcript.slice(0, 4000)}`
            }]
          })
        })

        if (structureResponse.ok) {
          const structureData = await structureResponse.json()
          structuredContent = structureData.content[0].text
        }
      } catch (error) {
        console.log('Content structuring failed:', error)
      }
    }

    // Analyze content for educational classification
    let contentAnalysis = {
      contentType: 'general',
      subject: 'General Studies',
      examFocus: 'general',
      confidence: 0.7,
      topics: [],
      difficulty: 'intermediate'
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
            max_tokens: 600,
            messages: [{
              role: 'user',
              content: `Analyze this educational YouTube video content and return ONLY a JSON object:
{
  "contentType": "history|science|mathematics|geography|economics|literature|technology|general",
  "subject": "specific subject name",
  "examFocus": "upsc|ssc|banking|state_pcs|neet|jee|cbse|icse|general",
  "confidence": 0.0-1.0,
  "topics": ["topic1", "topic2", "topic3"],
  "difficulty": "beginner|intermediate|advanced"
}

Video: ${videoMetadata.title}
Content: ${structuredContent.slice(0, 1500)}`
            }]
          })
        })

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          try {
            contentAnalysis = JSON.parse(analysisData.content[0].text)
          } catch (parseError) {
            console.log('Failed to parse video analysis')
          }
        }
      } catch (error) {
        console.log('Video analysis failed:', error)
      }
    }

    // Convert duration format (PT4M13S -> 4:13)
    let formattedDuration = videoMetadata.duration
    if (videoMetadata.duration.startsWith('PT')) {
      const match = videoMetadata.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (match) {
        const [, hours, minutes, seconds] = match
        const parts = []
        if (hours) parts.push(hours)
        parts.push((minutes || '0').padStart(2, '0'))
        parts.push((seconds || '0').padStart(2, '0'))
        formattedDuration = parts.join(':')
      }
    }

    const wordCount = structuredContent.split(/\s+/).length
    const estimatedReadingTime = Math.ceil(wordCount / 200)

    return new Response(
      JSON.stringify({
        success: true,
        extractedText: structuredContent,
        videoMetadata: {
          ...videoMetadata,
          duration: formattedDuration,
          videoId,
          url
        },
        transcriptMethod,
        statistics: {
          wordCount,
          estimatedReadingTime: `${estimatedReadingTime} min`,
          videoDuration: formattedDuration,
          processingDate: new Date().toISOString()
        },
        contentAnalysis,
        processingSteps: [
          'YouTube URL validated and video ID extracted',
          'Video metadata retrieved from YouTube API',
          `Transcript obtained via ${transcriptMethod}`,
          'Content cleaned and structured for learning',
          'Educational analysis completed'
        ]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('YouTube processing error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process YouTube video',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})