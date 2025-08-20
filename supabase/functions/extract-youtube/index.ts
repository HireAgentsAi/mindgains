import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { videoId, url } = await req.json()

    if (!videoId && !url) {
      throw new Error('Video ID or URL is required')
    }

    // For now, return mock data since YouTube API requires authentication
    // In production, you would use YouTube Data API v3 here
    const mockVideoData = {
      title: `Educational Video Content`,
      description: `This is a comprehensive educational video covering important concepts and practical applications. The content is structured to provide maximum learning value.`,
      channelTitle: 'Educational Channel',
      duration: '15:30',
      thumbnail: 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg',
      transcript: `Welcome to this educational video. Today we'll explore important concepts that will help you understand the subject matter better.

First, let's discuss the fundamental principles. These form the foundation of our understanding and are crucial for building more advanced knowledge.

Next, we'll examine practical applications. Understanding how these concepts work in real-world scenarios helps reinforce learning and makes the material more memorable.

We'll also cover common misconceptions and how to avoid them. This is important for developing a clear and accurate understanding of the topic.

Finally, we'll summarize the key takeaways and provide guidance for further study. This helps consolidate learning and provides direction for continued exploration.

Remember, learning is a process that requires active engagement. Take notes, ask questions, and practice applying what you learn.`,
      topics: ['Educational Content', 'Learning Strategies', 'Practical Applications'],
      viewCount: 125000,
      publishedAt: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify(mockVideoData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in extract-youtube:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})