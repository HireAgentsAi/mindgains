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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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
      case 'get_daily_challenge':
        return await getDailyChallenge(supabase, params)
      case 'join_daily_challenge':
        return await joinDailyChallenge(supabase, user.id, params)
      case 'get_state_leaderboard':
        return await getStateLeaderboard(supabase, params)
      case 'get_tournament_moments':
        return await getTournamentMoments(supabase, params)
      case 'submit_challenge_answer':
        return await submitChallengeAnswer(supabase, user.id, params)
      case 'complete_daily_challenge':
        return await completeDailyChallenge(supabase, user.id, params)
      case 'create_daily_challenge':
        return await createDailyChallenge(supabase, params)
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

async function getDailyChallenge(supabase: any, params: any) {
  const { date } = params
  
  const { data: challenge, error } = await supabase
    .from('daily_challenges')
    .select('*')
    .eq('challenge_date', date)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  // If no challenge exists, create one
  if (!challenge) {
    const newChallenge = await createDailyChallenge(supabase, {
      date,
      title: `🇮🇳 Daily India Challenge - ${new Date(date).toLocaleDateString()}`,
      topic: 'General Knowledge',
      auto_generate: true
    })
    return newChallenge
  }

  return new Response(
    JSON.stringify(challenge),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createDailyChallenge(supabase: any, params: any) {
  const { date, title, topic, auto_generate = false } = params
  
  // Generate questions for the challenge
  const questions = await generateChallengeQuestions(topic)
  
  const challengeDate = date || new Date().toISOString().split('T')[0]
  const startTime = new Date(`${challengeDate}T15:30:00.000Z`) // 9 PM IST
  const endTime = new Date(`${challengeDate}T16:00:00.000Z`)   // 9:30 PM IST
  
  const { data: challenge, error } = await supabase
    .from('daily_challenges')
    .insert({
      challenge_date: challengeDate,
      title: title || `🇮🇳 Daily India Challenge - ${new Date(challengeDate).toLocaleDateString()}`,
      description: 'Test your knowledge and represent your state in India\'s biggest educational tournament!',
      topic,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_prize_pool: 25000,
      sponsor_name: 'MindGains AI',
      questions,
      total_questions: questions.length
    })
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify(challenge),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function joinDailyChallenge(supabase: any, userId: string, params: any) {
  const { challenge_id, state } = params
  
  // Check if user already joined
  const { data: existing } = await supabase
    .from('challenge_participants')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('user_id', userId)
    .single()

  if (existing) {
    return new Response(
      JSON.stringify({ success: true, message: 'Already joined' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Join the challenge
  const { data: participant, error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id,
      user_id: userId,
      state: state || 'Unknown'
    })
    .select()
    .single()

  if (error) throw error

  // Update challenge participant count
  await supabase.rpc('increment_challenge_participants', { challenge_id })

  // Generate joining moment
  await generateTournamentMoment(supabase, {
    challenge_id,
    moment_type: 'milestone',
    title: `🎯 ${state} Warrior Joins the Battle!`,
    description: 'Another brave soul enters tonight\'s India Challenge!'
  })

  return new Response(
    JSON.stringify({ success: true, participant }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getStateLeaderboard(supabase: any, params: any) {
  const { challenge_id } = params
  
  const { data: states, error } = await supabase
    .from('state_leaderboards')
    .select('*')
    .eq('challenge_id', challenge_id)
    .order('state_rank', { ascending: true })
    .limit(10)

  if (error) throw error

  return new Response(
    JSON.stringify(states || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getTournamentMoments(supabase: any, params: any) {
  const { challenge_id } = params
  
  const { data: moments, error } = await supabase
    .from('tournament_moments')
    .select('*')
    .eq('challenge_id', challenge_id)
    .order('timestamp', { ascending: false })
    .limit(20)

  if (error) throw error

  return new Response(
    JSON.stringify(moments || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function submitChallengeAnswer(supabase: any, userId: string, params: any) {
  const { challenge_id, question_index, selected_answer, time_taken } = params
  
  // Get participant
  const { data: participant } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challenge_id)
    .eq('user_id', userId)
    .single()

  if (!participant) {
    throw new Error('Not participating in this challenge')
  }

  // Get challenge questions
  const { data: challenge } = await supabase
    .from('daily_challenges')
    .select('questions')
    .eq('id', challenge_id)
    .single()

  const questions = challenge.questions
  const question = questions[question_index]
  const isCorrect = selected_answer === question.correct_answer

  // Update participant answers
  const currentAnswers = participant.answers || []
  currentAnswers.push({
    question_index,
    selected_answer,
    correct_answer: question.correct_answer,
    is_correct: isCorrect,
    time_taken,
    points_earned: isCorrect ? 10 : 0
  })

  const newScore = participant.score + (isCorrect ? 10 : 0)
  const correctAnswers = participant.correct_answers + (isCorrect ? 1 : 0)

  await supabase
    .from('challenge_participants')
    .update({
      answers: currentAnswers,
      score: newScore,
      correct_answers: correctAnswers,
      ...(question_index === questions.length - 1 && { finished_at: new Date().toISOString() })
    })
    .eq('id', participant.id)

  // Generate exciting moments for great answers
  if (isCorrect && newScore > 150) { // High scorer
    await generateTournamentMoment(supabase, {
      challenge_id,
      moment_type: 'streak',
      participant_id: userId,
      title: `🔥 ${participant.state} on Fire!`,
      description: `Perfect streak continues! Someone from ${participant.state} is dominating tonight!`
    })
  }

  return new Response(
    JSON.stringify({ 
      isCorrect,
      points_earned: isCorrect ? 10 : 0,
      current_score: newScore,
      explanation: question.explanation
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function completeDailyChallenge(supabase: any, userId: string, params: any) {
  const { challenge_id } = params
  
  // Mark challenge as completed and calculate rankings
  await supabase
    .from('daily_challenges')
    .update({ status: 'completed' })
    .eq('id', challenge_id)

  // This will trigger the automatic ranking calculation via triggers

  return new Response(
    JSON.stringify({ success: true, message: 'Challenge completed!' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function generateTournamentMoment(supabase: any, params: any) {
  const { challenge_id, moment_type, title, description, participant_id } = params
  
  await supabase
    .from('tournament_moments')
    .insert({
      challenge_id,
      moment_type,
      title,
      description,
      participant_id,
      is_viral: moment_type === 'upset' || moment_type === 'record'
    })
}

async function generateChallengeQuestions(topic: string) {
  // Generate 20 exciting questions for the daily challenge
  const questions = [
    {
      id: 1,
      question: "Which Indian state is known as 'God's Own Country'?",
      options: ["Tamil Nadu", "Kerala", "Karnataka", "Goa"],
      correct_answer: 1,
      explanation: "Kerala is famously known as 'God's Own Country' due to its natural beauty.",
      difficulty: "easy"
    },
    {
      id: 2,
      question: "The Bharat Ratna is India's highest civilian award. Who was the first recipient?",
      options: ["Mahatma Gandhi", "C. Rajagopalachari", "S. Radhakrishnan", "C.V. Raman"],
      correct_answer: 1,
      explanation: "C. Rajagopalachari was the first recipient of Bharat Ratna in 1954."
    },
    {
      id: 3,
      question: "Which Indian city is known as the 'Silicon Valley of India'?",
      options: ["Hyderabad", "Chennai", "Bangalore", "Pune"],
      correct_answer: 2,
      explanation: "Bangalore is known as the Silicon Valley of India due to its IT industry."
    },
    {
      id: 4,
      question: "The Gateway of India was built to commemorate the visit of which British monarch?",
      options: ["Queen Victoria", "King George V", "King Edward VII", "Queen Elizabeth I"],
      correct_answer: 1,
      explanation: "Gateway of India was built to commemorate King George V's visit to India."
    },
    {
      id: 5,
      question: "Which is the longest river in India?",
      options: ["Yamuna", "Ganga", "Godavari", "Brahmaputra"],
      correct_answer: 1,
      explanation: "Ganga is the longest river in India, flowing about 2,525 kilometers."
    }
  ]
  
  // Expand to 20 questions by duplicating and modifying
  const expandedQuestions = []
  for (let i = 0; i < 20; i++) {
    const baseQuestion = questions[i % questions.length]
    expandedQuestions.push({
      ...baseQuestion,
      id: i + 1,
      time_limit: 30
    })
  }
  
  return expandedQuestions
}