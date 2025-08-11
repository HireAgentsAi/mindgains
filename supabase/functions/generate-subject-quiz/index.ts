import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GenerateQuizRequest {
  subject: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionCount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { subject, subtopic, difficulty, questionCount = 15 }: GenerateQuizRequest = await req.json()

    if (!subject) {
      throw new Error('Subject is required')
    }

    // Get AI API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const claudeApiKey = Deno.env.get('CLAUDE_API_KEY')
    const grokApiKey = Deno.env.get('GROK_API_KEY')

    if (!openaiApiKey && !claudeApiKey && !grokApiKey) {
      throw new Error('No AI API keys configured')
    }

    // Generate quiz using available AI service
    let quizData
    if (openaiApiKey) {
      quizData = await generateWithOpenAI(subject, subtopic, difficulty, questionCount, openaiApiKey)
    } else if (claudeApiKey) {
      quizData = await generateWithClaude(subject, subtopic, difficulty, questionCount, claudeApiKey)
    } else if (grokApiKey) {
      quizData = await generateWithGrok(subject, subtopic, difficulty, questionCount, grokApiKey)
    }

    return new Response(
      JSON.stringify({
        success: true,
        questions: quizData.questions,
        total_points: quizData.questions.reduce((sum: number, q: any) => sum + q.points, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating subject quiz:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate quiz' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateWithOpenAI(subject: string, subtopic?: string, difficulty?: string, questionCount = 15, apiKey: string) {
  const prompt = createQuizPrompt(subject, subtopic, difficulty, questionCount)

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Indian education and competitive exams. Generate high-quality quiz questions for Indian students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const aiResponse = await response.json()
  return JSON.parse(aiResponse.choices[0].message.content)
}

async function generateWithClaude(subject: string, subtopic?: string, difficulty?: string, questionCount = 15, apiKey: string) {
  const prompt = createQuizPrompt(subject, subtopic, difficulty, questionCount)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert in Indian education. ${prompt}`
        }
      ]
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`)
  }

  const claudeResponse = await response.json()
  return JSON.parse(claudeResponse.content[0].text)
}

async function generateWithGrok(subject: string, subtopic?: string, difficulty?: string, questionCount = 15, apiKey: string) {
  const prompt = createQuizPrompt(subject, subtopic, difficulty, questionCount)

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-4-latest',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Indian education with a witty personality. Generate engaging quiz questions for Indian students.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Grok API error: ${response.status}`)
  }

  const grokResponse = await response.json()
  return JSON.parse(grokResponse.choices[0].message.content)
}

function createQuizPrompt(subject: string, subtopic?: string, difficulty?: string, questionCount = 15): string {
  const topicFocus = subtopic ? `specifically on ${subtopic}` : `covering various aspects of ${subject}`
  const difficultyNote = difficulty ? `with ${difficulty} difficulty level` : 'with mixed difficulty levels'

  return `Generate ${questionCount} multiple choice questions about Indian ${subject} ${topicFocus} ${difficultyNote}.

Focus areas by subject:
- History: Ancient India (Indus Valley, Vedic, Mauryas, Guptas), Medieval India (Delhi Sultanate, Mughals), Modern India (Freedom Struggle, Leaders)
- Polity: Constitution (Preamble, Fundamental Rights, DPSP), Governance (Parliament, Judiciary, Executive)
- Geography: Physical features, Climate, Rivers, Resources, Agriculture
- Economy: Economic development, Planning, Banking, Trade
- Science & Technology: Space program, Nuclear program, IT revolution, Medical advances
- Current Affairs: Recent developments, Government schemes, International relations

Each question should:
- Be factually accurate and India-specific
- Have 4 clear options with only 1 correct answer
- Include detailed explanation with context
- Be relevant for Indian students and competitive exams
- Include specific dates, names, and facts where applicable

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation with context",
      "subject": "${subject}",
      "subtopic": "${subtopic || 'General'}",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}`
}