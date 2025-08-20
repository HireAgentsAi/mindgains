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
      case 'create_battle_room':
        return await createBattleRoom(supabase, user.id, params)
      case 'join_battle_room':
        return await joinBattleRoom(supabase, user.id, params)
      case 'send_invite':
        return await sendBattleInvite(supabase, user.id, params)
      case 'accept_invite':
        return await acceptBattleInvite(supabase, user.id, params)
      case 'start_battle':
        return await startBattle(supabase, user.id, params)
      case 'submit_answer':
        return await submitBattleAnswer(supabase, user.id, params)
      case 'complete_battle':
        return await completeBattle(supabase, user.id, params)
      case 'get_user_coins':
        return await getUserCoins(supabase, user.id)
      case 'get_battle_rooms':
        return await getBattleRooms(supabase)
      case 'find_or_create_battle':
        return await findOrCreateBattle(supabase, user.id, params)
      case 'bot_answer_question':
        return await botAnswerQuestion(supabase, params)
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

async function createBattleRoom(supabase: any, userId: string, params: any) {
  const { topic_id, subject_name, difficulty, bet_amount, max_participants, room_name } = params

  // Check user has enough coins
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (!userCoins || userCoins.balance < bet_amount) {
    throw new Error('Insufficient coins')
  }

  // Generate questions for the battle
  const questions = await generateBattleQuestions(supabase, topic_id, subject_name, difficulty)

  // Create battle room
  const { data: battleRoom, error } = await supabase
    .from('battle_rooms')
    .insert({
      name: room_name,
      host_id: userId,
      topic_id,
      subject_name,
      difficulty,
      bet_amount,
      max_participants,
      questions,
    })
    .select()
    .single()

  if (error) throw error

  // Add host as participant
  await supabase
    .from('battle_participants')
    .insert({
      battle_room_id: battleRoom.id,
      user_id: userId,
      coins_bet: bet_amount,
    })

  // Deduct coins from host
  await deductCoins(supabase, userId, bet_amount, battleRoom.id, 'bet')

  return new Response(
    JSON.stringify({ battleRoom }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function joinBattleRoom(supabase: any, userId: string, params: any) {
  const { room_code } = params

  // Get battle room
  const { data: battleRoom } = await supabase
    .from('battle_rooms')
    .select('*')
    .eq('room_code', room_code)
    .eq('status', 'waiting')
    .single()

  if (!battleRoom) {
    throw new Error('Battle room not found or not available')
  }

  // Check if room is full
  if (battleRoom.current_participants >= battleRoom.max_participants) {
    throw new Error('Battle room is full')
  }

  // Check user has enough coins
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (!userCoins || userCoins.balance < battleRoom.bet_amount) {
    throw new Error('Insufficient coins')
  }

  // Check if user already joined
  const { data: existingParticipant } = await supabase
    .from('battle_participants')
    .select('id')
    .eq('battle_room_id', battleRoom.id)
    .eq('user_id', userId)
    .single()

  if (existingParticipant) {
    throw new Error('Already joined this battle')
  }

  // Add participant
  await supabase
    .from('battle_participants')
    .insert({
      battle_room_id: battleRoom.id,
      user_id: userId,
      coins_bet: battleRoom.bet_amount,
    })

  // Deduct coins
  await deductCoins(supabase, userId, battleRoom.bet_amount, battleRoom.id, 'bet')

  // Start battle if room is full
  if (battleRoom.current_participants + 1 >= battleRoom.max_participants) {
    await supabase
      .from('battle_rooms')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', battleRoom.id)
  }

  return new Response(
    JSON.stringify({ success: true, battleRoom }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendBattleInvite(supabase: any, userId: string, params: any) {
  const { battle_room_id, recipient_phone } = params

  // Create invite
  const { data: invite, error } = await supabase
    .from('battle_invites')
    .insert({
      battle_room_id,
      sender_id: userId,
      recipient_phone,
    })
    .select(`
      *,
      battle_rooms (
        name,
        bet_amount,
        subject_name,
        room_code
      ),
      profiles (
        full_name
      )
    `)
    .single()

  if (error) throw error

  // Generate WhatsApp invite message
  const senderName = invite.profiles.full_name
  const roomName = invite.battle_rooms.name
  const betAmount = invite.battle_rooms.bet_amount
  const subject = invite.battle_rooms.subject_name
  const roomCode = invite.battle_rooms.room_code
  
  const inviteMessage = `🔥 BATTLE CHALLENGE! 🔥

${senderName} challenges you to a quiz battle!

📚 Topic: ${subject}
💰 Bet: ${betAmount} coins
🎯 Room: ${roomName}

Join now with code: ${roomCode}

Download MindGains AI and accept the challenge!
https://mindgains.app/battle/join/${invite.invite_code}`

  const whatsappUrl = `https://wa.me/${recipient_phone}?text=${encodeURIComponent(inviteMessage)}`

  return new Response(
    JSON.stringify({ 
      invite,
      whatsappUrl,
      inviteMessage
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function acceptBattleInvite(supabase: any, userId: string, params: any) {
  const { invite_code } = params

  // Get invite
  const { data: invite } = await supabase
    .from('battle_invites')
    .select(`
      *,
      battle_rooms (*)
    `)
    .eq('invite_code', invite_code)
    .eq('status', 'pending')
    .single()

  if (!invite) {
    throw new Error('Invite not found or expired')
  }

  // Check if invite is expired
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('Invite has expired')
  }

  // Join the battle room
  const result = await joinBattleRoom(supabase, userId, { 
    room_code: invite.battle_rooms.room_code 
  })

  // Update invite status
  await supabase
    .from('battle_invites')
    .update({
      status: 'accepted',
      recipient_id: userId,
      responded_at: new Date().toISOString()
    })
    .eq('id', invite.id)

  return result
}

async function generateBattleQuestions(supabase: any, topicId: string, subjectName: string, difficulty: string) {
  // Get questions from the topic
  let { data: questions } = await supabase
    .from('topic_questions')
    .select('*')
    .eq('topic_id', topicId)
    .eq('difficulty', difficulty)
    .limit(10)

  // If not enough questions from topic, get from subject
  if (!questions || questions.length < 10) {
    const { data: moreQuestions } = await supabase
      .from('topic_questions')
      .select(`
        *,
        subject_topics (
          indian_subjects (name)
        )
      `)
      .eq('subject_topics.indian_subjects.name', subjectName)
      .eq('difficulty', difficulty)
      .limit(10)
    
    questions = moreQuestions || []
  }

  // If still not enough, use AI generation as fallback
  if (!questions || questions.length < 5) {
    questions = await generateQuestionsWithAI(subjectName, difficulty)
  }

  // Shuffle and return 10 questions
  return questions
    .sort(() => Math.random() - 0.5)
    .slice(0, 10)
    .map((q, index) => ({
      id: q.id || `generated_${index}`,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: getPointsForDifficulty(difficulty)
    }))
}

async function generateQuestionsWithAI(subject: string, difficulty: string) {
  // Fallback questions - in production, this would call your AI service
  return [
    {
      id: 'fallback_1',
      question: `Sample ${subject} question for ${difficulty} level`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 0,
      explanation: 'This is a sample explanation',
    }
  ]
}

function getPointsForDifficulty(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 10
    case 'medium': return 20
    case 'hard': return 30
    default: return 15
  }
}

async function deductCoins(supabase: any, userId: string, amount: number, battleRoomId: string, type: string) {
  // Get current balance
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', userId)
    .single()

  if (!userCoins || userCoins.balance < amount) {
    throw new Error('Insufficient coins')
  }

  const newBalance = userCoins.balance - amount

  // Update balance
  await supabase
    .from('user_coins')
    .update({ 
      balance: newBalance,
      total_spent: supabase.rpc('increment_total_spent', { amount }),
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  // Record transaction
  await supabase
    .from('battle_transactions')
    .insert({
      battle_room_id: battleRoomId,
      user_id: userId,
      transaction_type: type,
      amount: -amount,
      balance_before: userCoins.balance,
      balance_after: newBalance,
    })
}

async function addCoins(supabase: any, userId: string, amount: number, battleRoomId: string, type: string) {
  // Get current balance
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('balance')
    .eq('user_id', userId)
    .single()

  const newBalance = userCoins.balance + amount

  // Update balance
  await supabase
    .from('user_coins')
    .update({ 
      balance: newBalance,
      total_earned: supabase.rpc('increment_total_earned', { amount }),
      last_updated: new Date().toISOString()
    })
    .eq('user_id', userId)

  // Record transaction
  await supabase
    .from('battle_transactions')
    .insert({
      battle_room_id: battleRoomId,
      user_id: userId,
      transaction_type: type,
      amount: amount,
      balance_before: userCoins.balance,
      balance_after: newBalance,
    })
}

async function submitBattleAnswer(supabase: any, userId: string, params: any) {
  const { battle_room_id, question_index, selected_answer, time_taken } = params

  // Get participant
  const { data: participant } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battle_room_id)
    .eq('user_id', userId)
    .single()

  if (!participant) {
    throw new Error('Not a participant in this battle')
  }

  // Get battle room and questions
  const { data: battleRoom } = await supabase
    .from('battle_rooms')
    .select('questions')
    .eq('id', battle_room_id)
    .single()

  const questions = battleRoom.questions
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
    points_earned: isCorrect ? question.points : 0
  })

  const newScore = participant.current_score + (isCorrect ? question.points : 0)

  await supabase
    .from('battle_participants')
    .update({
      answers: currentAnswers,
      current_score: newScore,
      ...(question_index === questions.length - 1 && { finished_at: new Date().toISOString() })
    })
    .eq('id', participant.id)

  return new Response(
    JSON.stringify({ 
      isCorrect,
      points_earned: isCorrect ? question.points : 0,
      current_score: newScore,
      explanation: question.explanation
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function completeBattle(supabase: any, userId: string, params: any) {
  const { battle_room_id } = params

  // Get all participants
  const { data: participants } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battle_room_id)
    .order('current_score', { ascending: false })

  if (!participants || participants.length === 0) {
    throw new Error('No participants found')
  }

  // Determine winner (highest score)
  const winner = participants[0]
  const totalPrize = participants.reduce((sum, p) => sum + p.coins_bet, 0)

  // Update battle room
  await supabase
    .from('battle_rooms')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      winner_id: winner.user_id
    })
    .eq('id', battle_room_id)

  // Award coins to winner
  await addCoins(supabase, winner.user_id, totalPrize, battle_room_id, 'win')

  // Update participant records
  await supabase
    .from('battle_participants')
    .update({ coins_won: totalPrize })
    .eq('id', winner.id)

  return new Response(
    JSON.stringify({ 
      winner_id: winner.user_id,
      total_prize: totalPrize,
      final_scores: participants.map(p => ({
        user_id: p.user_id,
        score: p.current_score,
        coins_won: p.user_id === winner.user_id ? totalPrize : 0
      }))
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getUserCoins(supabase: any, userId: string) {
  const { data: userCoins } = await supabase
    .from('user_coins')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!userCoins) {
    // Create default coins for new user
    const { data: newCoins } = await supabase
      .from('user_coins')
      .insert({
        user_id: userId,
        balance: 1000,
        total_earned: 1000
      })
      .select()
      .single()
    
    return new Response(
      JSON.stringify(newCoins),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify(userCoins),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getBattleRooms(supabase: any) {
  const { data: battleRooms } = await supabase
    .from('battle_rooms')
    .select(`
      *,
      profiles (
        full_name
      ),
      battle_participants (
        user_id,
        profiles (
          full_name
        )
      )
    `)
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(20)

  return new Response(
    JSON.stringify(battleRooms || []),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function findOrCreateBattle(supabase: any, userId: string, params: any) {
  const { topic_id, subject_name, difficulty, bet_amount } = params
  
  // Check if user has subscription for custom topics
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('subscription_type')
    .eq('user_id', userId)
    .single()

  // First, try to find an existing waiting room
  const { data: existingRooms } = await supabase
    .from('battle_rooms')
    .select(`
      *,
      battle_participants (count)
    `)
    .eq('status', 'waiting')
    .eq('difficulty', difficulty)
    .eq('bet_amount', bet_amount)
    .not('host_id', 'eq', userId)

  // Filter rooms that match criteria and have space
  const availableRoom = existingRooms?.find(room => {
    const participantCount = room.battle_participants?.[0]?.count || 1
    return participantCount < room.max_participants &&
           (room.topic_id === topic_id || room.subject_name === subject_name)
  })

  if (availableRoom) {
    // Join existing room
    return await joinBattleRoom(supabase, userId, { room_code: availableRoom.room_code })
  }

  // No suitable room found, create new room with bot after delay
  const roomName = `Quick Battle - ${subject_name}`
  const createResult = await createBattleRoom(supabase, userId, {
    topic_id,
    subject_name,
    difficulty,
    bet_amount,
    max_participants: 2,
    room_name: roomName
  })

  const battleRoom = JSON.parse(createResult.body).battleRoom

  // Get user's estimated skill level based on stats
  const { data: userStats } = await supabase
    .from('battle_stats')
    .select('win_percentage, total_battles')
    .eq('user_id', userId)
    .single()

  let userSkillLevel = 'intermediate'
  if (userStats && userStats.total_battles > 5) {
    if (userStats.win_percentage >= 75) userSkillLevel = 'advanced'
    else if (userStats.win_percentage >= 85) userSkillLevel = 'expert'
    else if (userStats.win_percentage <= 40) userSkillLevel = 'beginner'
  }

  // Schedule bot to join after 5-10 seconds if no real player joins
  setTimeout(async () => {
    // Check if room still waiting
    const { data: roomStatus } = await supabase
      .from('battle_rooms')
      .select('status, current_participants')
      .eq('id', battleRoom.id)
      .single()

    if (roomStatus?.status === 'waiting' && roomStatus.current_participants === 1) {
      // Get a matching bot
      const { data: bot } = await supabase
        .rpc('get_matching_bot', { 
          p_user_skill_level: userSkillLevel,
          p_exclude_bot_ids: [] 
        })
        .single()

      if (bot) {
        // Create a temporary bot user profile for this battle
        const { data: tempBotProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: bot.bot_id,
            full_name: bot.bot_name,
            email: `bot_${bot.bot_id}@mindgains.ai`,
            is_bot: true
          })
          .select()
          .single()

        // Add bot as participant (ignore profile creation errors if already exists)
        await supabase
          .from('battle_participants')
          .insert({
            battle_room_id: battleRoom.id,
            user_id: bot.bot_id,
            coins_bet: bet_amount
          })

        // Start the battle
        await supabase
          .from('battle_rooms')
          .update({ 
            status: 'active',
            started_at: new Date().toISOString(),
            has_bot: true
          })
          .eq('id', battleRoom.id)

        // Start bot simulation
        simulateBotBattle(supabase, battleRoom.id, bot.bot_id)
      }
    }
  }, Math.floor(Math.random() * 5000) + 5000) // 5-10 seconds

  return createResult
}

async function simulateBotBattle(supabase: any, battleRoomId: string, botId: string) {
  // Get battle room questions
  const { data: battleRoom } = await supabase
    .from('battle_rooms')
    .select('questions, difficulty')
    .eq('id', battleRoomId)
    .single()

  if (!battleRoom) return

  const questions = battleRoom.questions
  
  // Get bot participant record
  const { data: botParticipant } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battleRoomId)
    .eq('user_id', botId)
    .single()

  // Get human participant for score comparison
  const { data: humanParticipant } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battleRoomId)
    .neq('user_id', botId)
    .single()

  // Simulate bot answering questions
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    const scoreDifference = (humanParticipant?.current_score || 0) - (botParticipant?.current_score || 0)
    
    // Get bot response
    const { data: response } = await supabase
      .rpc('simulate_bot_response', {
        p_bot_id: botId,
        p_question_difficulty: battleRoom.difficulty,
        p_question_number: i + 1,
        p_score_difference: scoreDifference,
        p_time_remaining: 30
      })
      .single()

    if (!response) continue

    // Wait for response time
    await new Promise(resolve => setTimeout(resolve, response.response_time_ms))

    // Check if battle is still active
    const { data: currentRoom } = await supabase
      .from('battle_rooms')
      .select('status')
      .eq('id', battleRoomId)
      .single()

    if (currentRoom?.status !== 'active') break

    // Submit bot answer
    const selectedAnswer = response.is_correct ? 
      question.correct_answer : 
      (question.correct_answer + 1 + Math.floor(Math.random() * 3)) % 4

    await submitBattleAnswer(supabase, botId, {
      battle_room_id: battleRoomId,
      question_index: i,
      selected_answer: selectedAnswer,
      time_taken: Math.floor(response.response_time_ms / 1000)
    })

    // Record bot response for learning
    await supabase
      .from('bot_response_history')
      .insert({
        bot_id: botId,
        battle_room_id: battleRoomId,
        question_number: i + 1,
        question_difficulty: battleRoom.difficulty,
        responded_correctly: response.is_correct,
        response_time: response.response_time_ms,
        score_difference: scoreDifference
      })

    // Small delay between questions
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // Update bot statistics
  const { data: finalParticipants } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battleRoomId)
    .order('current_score', { ascending: false })

  const botWon = finalParticipants?.[0]?.user_id === botId
  const coinsChange = botWon ? 
    finalParticipants.reduce((sum, p) => sum + p.coins_bet, 0) - botParticipant.coins_bet :
    -botParticipant.coins_bet

  await supabase
    .rpc('update_bot_statistics', {
      p_bot_id: botId,
      p_won: botWon,
      p_coins_change: coinsChange
    })
}

async function botAnswerQuestion(supabase: any, params: any) {
  const { battle_room_id, bot_id, question_index } = params
  
  // This function is called by the client to get bot's answer for real-time display
  const { data: battleRoom } = await supabase
    .from('battle_rooms')
    .select('questions, difficulty')
    .eq('id', battle_room_id)
    .single()

  const { data: participants } = await supabase
    .from('battle_participants')
    .select('*')
    .eq('battle_room_id', battle_room_id)

  const botParticipant = participants.find(p => p.user_id === bot_id)
  const humanParticipant = participants.find(p => p.user_id !== bot_id)
  const scoreDifference = (humanParticipant?.current_score || 0) - (botParticipant?.current_score || 0)

  // Get bot response simulation
  const { data: response } = await supabase
    .rpc('simulate_bot_response', {
      p_bot_id: bot_id,
      p_question_difficulty: battleRoom.difficulty,
      p_question_number: question_index + 1,
      p_score_difference: scoreDifference,
      p_time_remaining: 30
    })
    .single()

  const question = battleRoom.questions[question_index]
  const selectedAnswer = response.is_correct ? 
    question.correct_answer : 
    (question.correct_answer + 1 + Math.floor(Math.random() * 3)) % 4

  return new Response(
    JSON.stringify({
      selected_answer: selectedAnswer,
      response_time: response.response_time_ms,
      is_correct: response.is_correct
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}