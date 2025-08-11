import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateMissionRequest {
  title: string;
  description?: string;
  content_type: 'youtube' | 'pdf' | 'text' | 'camera';
  content_url?: string;
  content_text?: string;
  subject_name?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  contentType?: string;
  examFocus?: string;
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    const {
      title,
      description,
      content_type,
      content_url,
      content_text,
      subject_name,
      difficulty = 'medium',
      contentType,
      examFocus
    }: CreateMissionRequest = await req.json()

    // Find or create subject
    let subject_id = null
    if (subject_name) {
      const { data: subject } = await supabaseClient
        .from('subjects')
        .select('id')
        .eq('name', subject_name)
        .single()

      subject_id = subject?.id
    }

    // Create mission
    const { data: mission, error: missionError } = await supabaseClient
      .from('missions')
      .insert({
        user_id: user.id,
        title,
        description,
        subject_id,
        content_type,
        content_url,
        content_text,
        difficulty,
        status: 'active'
      })
      .select()
      .single()

    if (missionError) {
      throw missionError
    }

    // Generate AI content
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (openaiApiKey) {
      try {
        // Use the main content for all generations
        const mainContent = content_text || content_url || title
        
        // Generate learning content first
        const aiContent = await generateLearningContent(
          mainContent,
          content_type,
          subject_name,
          openaiApiKey,
          contentType,
          examFocus
        )

        // Store learning content
        await supabaseClient
          .from('learning_content')
          .insert({
            mission_id: mission.id,
            ...aiContent
          })

        // Generate all other content based on the SAME main content and learning content
        await Promise.all([
          generateFlashcards(mission.id, mainContent, aiContent, supabaseClient, openaiApiKey, examFocus),
          generateQuizQuestions(mission.id, mainContent, aiContent, supabaseClient, openaiApiKey, examFocus),
          generateTestQuestions(mission.id, mainContent, aiContent, supabaseClient, openaiApiKey, examFocus)
        ])
      } catch (aiError) {
        console.error('AI generation error:', aiError)
        // Continue without AI content
      }
    }

    // Initialize mission progress
    const rooms = ['clarity', 'quiz', 'memory', 'test']
    await supabaseClient
      .from('mission_progress')
      .insert(
        rooms.map(room => ({
          user_id: user.id,
          mission_id: mission.id,
          room_type: room,
          status: 'not_started'
        }))
      )

    return new Response(
      JSON.stringify({
        success: true,
        mission,
        message: 'Mission created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating mission:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create mission' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateLearningContent(
  content: string,
  contentType: string,
  subject?: string,
  apiKey?: string,
  smartContentType?: string,
  examFocus?: string
) {
  if (!apiKey) throw new Error('OpenAI API key not available')

  const examFocusPrompt = examFocus ? `Focus specifically on ${examFocus.toUpperCase()} exam requirements and patterns.` : ''
  const contentTypePrompt = smartContentType ? `Content type: ${smartContentType}.` : ''

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
          content: `You are an AI tutor creating educational content for Indian competitive exams. ${examFocusPrompt} ${contentTypePrompt} Generate comprehensive learning material in JSON format:
          {
            "overview": "Brief overview of the topic (2-3 sentences)",
            "key_points": ["point1", "point2", "point3", "point4", "point5"],
            "timeline": [{"event": "Event", "description": "Description", "year": "Year"}],
            "concepts": [{"term": "Term", "definition": "Definition"}],
            "sample_answers": ["answer1", "answer2"],
            "difficulty": "beginner|intermediate|advanced",
            "estimated_time": "time in minutes"
          }`
        },
        {
          role: 'user',
          content: `Create learning content for: ${content}. Content type: ${contentType}. Subject: ${subject || 'General'}. Make it relevant for Indian competitive exams.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const aiResponse = await response.json()
  return JSON.parse(aiResponse.choices[0].message.content)
}

async function generateFlashcards(
  missionId: string,
  originalContent: string,
  learningContent: any,
  supabaseClient: any,
  apiKey: string,
  examFocus?: string
) {
  const examFocusPrompt = examFocus ? `Focus on ${examFocus.toUpperCase()} exam important facts and concepts.` : ''

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
          content: `Create EXACTLY 5 flashcards for memorization based on the topic: "${originalContent}". ${examFocusPrompt} Return JSON array:
          [{"front": "Question/Term", "back": "Answer/Definition", "category": "Category", "difficulty": "easy|medium|hard", "hint": "Optional hint"}]
          
          Make sure all flashcards are directly related to: "${originalContent}"`
        },
        {
          role: 'user',
          content: `Create 5 flashcards for: ${originalContent}. Use this learning content for reference: ${JSON.stringify(learningContent)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  if (response.ok) {
    const aiResponse = await response.json()
    const flashcards = JSON.parse(aiResponse.choices[0].message.content)
    
    // Ensure exactly 5 flashcards
    const limitedFlashcards = flashcards.slice(0, 5)
    
    await supabaseClient
      .from('flashcards')
      .insert(
        limitedFlashcards.map((card: any) => ({
          mission_id: missionId,
          ...card
        }))
      )
  }
}

async function generateQuizQuestions(
  missionId: string,
  originalContent: string,
  learningContent: any,
  supabaseClient: any,
  apiKey: string,
  examFocus?: string
) {
  const examFocusPrompt = examFocus ? `Focus on ${examFocus.toUpperCase()} exam pattern questions.` : ''

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
          content: `Create EXACTLY 5 multiple choice questions based on the topic: "${originalContent}". ${examFocusPrompt} Return JSON array:
          [{"question": "Question text", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "Why correct", "difficulty": "easy|medium|hard", "points": 10}]
          
          Make sure all questions are directly related to: "${originalContent}"`
        },
        {
          role: 'user',
          content: `Create 5 quiz questions for: ${originalContent}. Use this learning content for reference: ${JSON.stringify(learningContent)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 1500,
    }),
  })

  if (response.ok) {
    const aiResponse = await response.json()
    const questions = JSON.parse(aiResponse.choices[0].message.content)
    
    // Ensure exactly 5 questions
    const limitedQuestions = questions.slice(0, 5)
    
    await supabaseClient
      .from('quiz_questions')
      .insert(
        limitedQuestions.map((q: any) => ({
          mission_id: missionId,
          ...q
        }))
      )
  }
}

async function generateTestQuestions(
  missionId: string,
  originalContent: string,
  learningContent: any,
  supabaseClient: any,
  apiKey: string,
  examFocus?: string
) {
  const examFocusPrompt = examFocus ? `Focus on ${examFocus.toUpperCase()} exam comprehensive test questions.` : ''

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
          content: `Create 8 test questions (mix of MCQ and short answer) based on the topic: "${originalContent}". ${examFocusPrompt} Return JSON array:
          [{"question": "Question", "question_type": "mcq|short", "options": ["A","B","C","D"], "correct_answer": 0, "points": 10, "explanation": "Explanation", "difficulty": "easy|medium|hard"}]
          
          Make sure all questions are directly related to: "${originalContent}"`
        },
        {
          role: 'user',
          content: `Create test questions for: ${originalContent}. Use this learning content for reference: ${JSON.stringify(learningContent)}`
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  })

  if (response.ok) {
    const aiResponse = await response.json()
    const questions = JSON.parse(aiResponse.choices[0].message.content)
    
    await supabaseClient
      .from('test_questions')
      .insert(
        questions.map((q: any) => ({
          mission_id: missionId,
          ...q
        }))
      )
  }
}