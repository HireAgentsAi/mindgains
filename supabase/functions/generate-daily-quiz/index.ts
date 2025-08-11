import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const today = new Date().toISOString().split('T')[0]

    // Check if today's quiz already exists
    const { data: existingQuiz } = await supabaseClient
      .from('daily_quizzes')
      .select('*')
      .eq('date', today)
      .single()

    if (existingQuiz) {
      return new Response(
        JSON.stringify(existingQuiz),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate new daily quiz using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const subjects = ['History', 'Polity', 'Geography', 'Economy', 'Science & Technology', 'Current Affairs']
    
    const prompt = `Generate 10 multiple choice questions for Indian students covering these subjects: ${subjects.join(', ')}.

Focus on Indian government exam syllabus topics:

HISTORY:
- Ancient India: Indus Valley Civilization, Vedic Period, Mauryan Empire, Gupta Period
- Medieval India: Delhi Sultanate, Mughal Empire, Regional Kingdoms
- Modern India: British Rule, Freedom Struggle, Independence Movement, Post-Independence

POLITY:
- Constitution: Preamble, Fundamental Rights, DPSP, Constitutional Articles
- Governance: Parliament, Judiciary, Executive, Federalism, Local Government
- Political Thinkers: Gandhi, Nehru, Ambedkar, Constitutional Assembly

GEOGRAPHY:
- Physical Geography: Rivers, Mountains, Climate, Monsoons, Natural Resources
- Economic Geography: Agriculture, Industries, Transportation, Trade

ECONOMY:
- Economic Development: Five Year Plans, Economic Reforms, Poverty Alleviation
- Economic Policy: Fiscal Policy, Monetary Policy, Banking, Financial Institutions

SCIENCE & TECHNOLOGY:
- Space Program: ISRO missions, Satellites, Mars Mission
- Nuclear Program: Nuclear Power, Research Reactors
- IT Revolution: Digital India, Technology Parks, Software Industry

CURRENT AFFAIRS:
- Government Schemes: PM-KISAN, Ayushman Bharat, Digital India
- International Relations: Bilateral agreements, Trade partnerships
- Recent Developments: Policy changes, Awards, Sports achievements

Question Distribution:
- 2 questions from History (1 Ancient/Medieval, 1 Modern/Freedom Struggle)
- 2 questions from Polity (1 Constitution, 1 Governance)
- 2 questions from Geography (1 Physical, 1 Economic)
- 1 question from Economy (Development/Policy)
- 1 question from Science & Technology (Recent achievements)
- 2 questions from Current Affairs (Recent 12 months)

Difficulty Distribution:
- 6 Easy questions (basic facts, definitions)
- 3 Medium questions (application, analysis)
- 1 Hard question (synthesis, evaluation)

Each question should:
- Be factually accurate and India-specific
- Have 4 clear options with only 1 correct answer
- Include detailed explanation with exam context
- Be relevant for UPSC, SSC, Banking, State PCS exams
- Include specific dates, names, and facts
- Focus on frequently asked exam topics

Return JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation with exam relevance",
      "subject": "Subject name",
      "subtopic": "Specific subtopic",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Indian education and competitive exams. Generate high-quality quiz questions for Indian students preparing for government exams.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const aiResponse = await response.json()
    const quizData = JSON.parse(aiResponse.choices[0].message.content)

    // Store daily quiz
    const { data: dailyQuiz, error } = await supabaseClient
      .from('daily_quizzes')
      .insert({
        date: today,
        questions: quizData.questions,
        total_points: quizData.questions.reduce((sum: number, q: any) => sum + q.points, 0),
        difficulty_distribution: {
          easy: quizData.questions.filter((q: any) => q.difficulty === 'easy').length,
          medium: quizData.questions.filter((q: any) => q.difficulty === 'medium').length,
          hard: quizData.questions.filter((q: any) => q.difficulty === 'hard').length
        },
        subjects_covered: [...new Set(quizData.questions.map((q: any) => q.subject))],
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify(dailyQuiz),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating daily quiz:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate daily quiz' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})