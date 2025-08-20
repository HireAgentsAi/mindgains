import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { action, ...params } = await req.json()

    switch (action) {
      case 'generate_battle_questions':
        return await generateBattleQuestions(supabase, user.id, params)
      case 'moderate_topic':
        return await moderateTopic(params)
      case 'check_subscription':
        return await checkUserSubscription(supabase, user.id)
      case 'get_popular_topics':
        return await getPopularTopics()
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function moderateTopic(params: any) {
  const { topic } = params
  
  // List of inappropriate keywords and patterns
  const inappropriateKeywords = [
    'sex', 'sexual', 'porn', 'adult', 'nude', 'naked', 'erotic', 'xxx',
    'drugs', 'cocaine', 'heroin', 'marijuana', 'cannabis', 'meth',
    'violence', 'murder', 'kill', 'suicide', 'bomb', 'terrorism',
    'hate', 'racist', 'nazi', 'fascist', 'discrimination',
    'gambling', 'casino', 'betting', 'poker',
    'alcohol', 'beer', 'wine', 'drunk', 'liquor'
  ]

  const topicLower = topic.toLowerCase()
  
  // Check for inappropriate content
  const hasInappropriateContent = inappropriateKeywords.some(keyword => 
    topicLower.includes(keyword)
  )

  if (hasInappropriateContent) {
    return new Response(
      JSON.stringify({
        isAppropriate: false,
        warning: '🚫 Inappropriate Content Detected',
        message: 'This topic contains content that is not suitable for educational battles. Please choose a different topic related to academics, science, history, or general knowledge.',
        suggestedTopics: [
          'Indian History and Freedom Struggle',
          'Science and Technology',
          'Geography of India',
          'Mathematics and Logic',
          'Literature and Arts',
          'Current Affairs and Politics'
        ]
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Enhanced moderation using AI (OpenAI)
  try {
    const aiModerationResult = await moderateWithAI(topic)
    
    if (!aiModerationResult.isAppropriate) {
      return new Response(
        JSON.stringify({
          isAppropriate: false,
          warning: '⚠️ Content Review Required',
          message: 'This topic may not be suitable for educational content. Please choose topics related to academics, competitive exams, or general knowledge.',
          suggestedTopics: aiModerationResult.suggestedTopics
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('AI moderation failed:', error)
    // Continue with basic moderation if AI fails
  }

  return new Response(
    JSON.stringify({
      isAppropriate: true,
      enhancedTopic: await enhanceTopicForEducation(topic)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function moderateWithAI(topic: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const moderationPrompt = `
You are an educational content moderator for a quiz app used by students in India preparing for competitive exams like UPSC, JEE, NEET, Banking, etc.

Analyze this topic: "${topic}"

Determine if this topic is:
1. Appropriate for educational quiz content
2. Suitable for students aged 16-30
3. Related to academics, competitive exams, general knowledge, or professional development

Respond with JSON only:
{
  "isAppropriate": boolean,
  "reason": "brief explanation",
  "suggestedTopics": ["alternative topic 1", "alternative topic 2", "alternative topic 3"]
}
`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an educational content moderator. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: moderationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  })

  if (!response.ok) {
    throw new Error('AI moderation request failed')
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error('Invalid AI response format')
  }
}

async function enhanceTopicForEducation(topic: string) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  
  if (!openaiApiKey) {
    return topic // Return original if no API key
  }

  const enhancementPrompt = `
Enhance this topic for Indian competitive exam preparation: "${topic}"

Make it more specific and educational. Examples:
- "History" → "Indian Freedom Struggle and Modern History"
- "Science" → "Physics and Chemistry for Competitive Exams"
- "Math" → "Quantitative Aptitude and Mathematical Reasoning"

Respond with just the enhanced topic name (max 50 characters):
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: enhancementPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 50
      })
    })

    if (response.ok) {
      const data = await response.json()
      const enhancedTopic = data.choices[0].message.content.trim()
      return enhancedTopic.length > 0 ? enhancedTopic : topic
    }
  } catch (error) {
    console.error('Topic enhancement failed:', error)
  }

  return topic
}

async function generateBattleQuestions(supabase: any, userId: string, params: any) {
  const { topic, difficulty, questionCount = 10, customTopic } = params
  
  // Check user subscription for AI generation limits
  const subscription = await checkUserSubscription(supabase, userId)
  
  if (!subscription.isPro && subscription.aiGenerationsUsed >= subscription.dailyAiLimit) {
    throw new Error(`Daily AI generation limit reached. Upgrade to Pro for unlimited AI battles!`)
  }

  const finalTopic = customTopic || topic
  
  // Generate questions using AI
  const questions = await generateQuestionsWithAI(finalTopic, difficulty, questionCount)
  
  // Track usage for free users
  if (!subscription.isPro) {
    await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        ai_generations_used: subscription.aiGenerationsUsed + 1
      })
  }

  return new Response(
    JSON.stringify({ questions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateQuestionsWithAI(topic: string, difficulty: string, count: number) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
  
  const questionPrompt = `
Generate ${count} multiple choice questions for a competitive exam quiz battle on the topic: "${topic}"

Difficulty level: ${difficulty}
Target audience: Indian students preparing for competitive exams (UPSC, JEE, NEET, Banking, SSC)

Requirements:
1. Questions should be factual and educational
2. 4 options each (A, B, C, D)
3. Include detailed explanations
4. Focus on ${difficulty} level complexity
5. Include current affairs if relevant
6. Make questions India-specific when applicable

Difficulty guidelines:
- Easy: Basic concepts, definitions, simple facts
- Medium: Application of concepts, moderate reasoning
- Hard: Complex analysis, advanced concepts, multi-step reasoning

Respond with JSON array only:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Detailed explanation why this is correct...",
    "category": "${topic}",
    "difficulty": "${difficulty}",
    "points": 10
  }
]
`

  // Try OpenAI first
  if (openaiApiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert quiz creator for Indian competitive exams. Generate high-quality educational questions. Respond only with valid JSON array.'
            },
            {
              role: 'user',
              content: questionPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0].message.content
        
        // Extract JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0])
          return questions.map((q: any, index: number) => ({
            ...q,
            id: `ai_${Date.now()}_${index}`,
            points: getPointsForDifficulty(difficulty)
          }))
        }
      }
    } catch (error) {
      console.error('OpenAI generation failed:', error)
    }
  }

  // Fallback to Claude
  if (claudeApiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': claudeApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: questionPrompt
            }
          ]
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.content[0].text
        
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const questions = JSON.parse(jsonMatch[0])
          return questions.map((q: any, index: number) => ({
            ...q,
            id: `ai_${Date.now()}_${index}`,
            points: getPointsForDifficulty(difficulty)
          }))
        }
      }
    } catch (error) {
      console.error('Claude generation failed:', error)
    }
  }

  // Ultimate fallback with sample questions
  return generateFallbackQuestions(topic, difficulty, count)
}

function generateFallbackQuestions(topic: string, difficulty: string, count: number) {
  const sampleQuestions = [
    {
      question: `Which concept is most important in ${topic}?`,
      options: ["Concept A", "Concept B", "Concept C", "Concept D"],
      correct_answer: 0,
      explanation: `This is a sample question about ${topic}. In a real implementation, this would be generated by AI.`,
      category: topic,
      difficulty: difficulty,
      points: getPointsForDifficulty(difficulty)
    }
  ]

  return Array(count).fill(0).map((_, index) => ({
    ...sampleQuestions[0],
    id: `fallback_${Date.now()}_${index}`,
    question: `Sample ${difficulty} question ${index + 1} about ${topic}?`
  }))
}

function getPointsForDifficulty(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 10
    case 'medium': return 20
    case 'hard': return 30
    default: return 15
  }
}

async function checkUserSubscription(supabase: any, userId: string) {
  // Check if user is ragularvind84@gmail.com (pro user)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  const isTestUser = profile?.email === 'ragularvind84@gmail.com'

  if (isTestUser) {
    return {
      isPro: true,
      plan: 'Pro (Test User)',
      dailyAiLimit: 999999,
      aiGenerationsUsed: 0,
      battleLimit: 999999,
      battlesUsed: 0
    }
  }

  // Check actual subscription
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single()

  const isPro = subscription && subscription.status === 'active' && new Date(subscription.expires_at) > new Date()

  return {
    isPro,
    plan: isPro ? subscription.subscription_type : 'Free',
    dailyAiLimit: isPro ? 999999 : 3,
    aiGenerationsUsed: usage?.ai_generations_used || 0,
    battleLimit: isPro ? 999999 : 5,
    battlesUsed: usage?.daily_quiz_limit || 0
  }
}

async function getPopularTopics() {
  const popularTopics = [
    {
      name: "Indian History and Freedom Struggle",
      category: "History",
      popularity: 95,
      examRelevance: "UPSC, SSC, State PCS"
    },
    {
      name: "Indian Constitution and Polity",
      category: "Polity",
      popularity: 92,
      examRelevance: "UPSC, Banking, SSC"
    },
    {
      name: "Geography of India",
      category: "Geography",
      popularity: 88,
      examRelevance: "UPSC, Railway, SSC"
    },
    {
      name: "Current Affairs 2024",
      category: "Current Affairs",
      popularity: 96,
      examRelevance: "All Competitive Exams"
    },
    {
      name: "Economics and Banking",
      category: "Economics",
      popularity: 85,
      examRelevance: "Banking, UPSC, SSC"
    },
    {
      name: "Science and Technology",
      category: "Science",
      popularity: 90,
      examRelevance: "UPSC, Railway, SSC"
    },
    {
      name: "Quantitative Aptitude",
      category: "Mathematics",
      popularity: 87,
      examRelevance: "Banking, SSC, Railway"
    },
    {
      name: "English Language and Comprehension",
      category: "English",
      popularity: 83,
      examRelevance: "All Competitive Exams"
    }
  ]

  return new Response(
    JSON.stringify(popularTopics),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}