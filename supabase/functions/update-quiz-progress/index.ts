import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface QuizProgressRequest {
  userId: string;
  quiz_type: 'daily' | 'subject';
  subject?: string;
  subtopic?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent: number;
  questions_data?: any[];
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

    const {
      userId,
      quiz_type,
      subject,
      subtopic,
      score,
      total_questions,
      correct_answers,
      time_spent,
      questions_data
    }: QuizProgressRequest = await req.json()

    // Get subject and subtopic IDs
    let subject_id = null
    let subtopic_id = null

    if (subject) {
      const { data: subjectData } = await supabaseClient
        .from('subjects')
        .select('id')
        .eq('name', subject)
        .single()
      subject_id = subjectData?.id
    }

    if (subtopic && subject_id) {
      const { data: subtopicData } = await supabaseClient
        .from('subtopics')
        .select('id')
        .eq('name', subtopic)
        .eq('subject_id', subject_id)
        .single()
      subtopic_id = subtopicData?.id
    }

    // Record quiz attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('quiz_attempts')
      .insert({
        user_id: userId,
        quiz_type,
        subject_id,
        subtopic_id,
        questions_answered: total_questions,
        correct_answers,
        total_points: score,
        score_percentage: Math.round((correct_answers / total_questions) * 100),
        time_spent
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Update user memory for personalization
    if (subject && questions_data) {
      await updateUserMemory(supabaseClient, userId, subject, subtopic || subject, correct_answers, total_questions, questions_data)
    }

    // Calculate XP reward
    const baseXP = quiz_type === 'daily' ? 20 : 15
    const accuracyBonus = Math.round((correct_answers / total_questions) * 30)
    const speedBonus = time_spent < 120 ? 10 : 0 // Bonus for completing under 2 minutes
    const xpReward = baseXP + accuracyBonus + speedBonus

    // Update user stats
    const { data: currentStats } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const newTotalXP = (currentStats?.total_xp || 0) + xpReward
    const newLevel = Math.floor(newTotalXP / 1000) + 1
    
    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const lastActivity = currentStats?.last_activity_date
    
    let newStreakDays = currentStats?.streak_days || 0
    if (lastActivity === yesterday) {
      newStreakDays += 1
    } else if (lastActivity !== today) {
      newStreakDays = 1
    }

    const { data: updatedStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_xp: newTotalXP,
        current_level: newLevel,
        streak_days: newStreakDays,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (statsError) throw statsError

    // Check for new achievements
    const newAchievements = await checkAchievements(supabaseClient, userId, updatedStats, attempt)

    return new Response(
      JSON.stringify({
        success: true,
        attempt,
        xp_reward: xpReward,
        user_stats: updatedStats,
        new_achievements: newAchievements
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error updating quiz progress:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update progress' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function updateUserMemory(supabaseClient: any, userId: string, subject: string, topic: string, correct: number, total: number, questionsData: any[]) {
  const proficiencyScore = Math.round((correct / total) * 100)
  
  // Analyze weak and strong areas from questions
  const weakAreas: string[] = []
  const strongAreas: string[] = []
  
  questionsData.forEach((q, index) => {
    if (q.user_answer !== q.correct_answer) {
      weakAreas.push(q.subtopic || q.subject)
    } else {
      strongAreas.push(q.subtopic || q.subject)
    }
  })

  await supabaseClient
    .from('user_memory')
    .upsert({
      user_id: userId,
      topic,
      subject,
      proficiency_score: proficiencyScore,
      weak_areas: [...new Set(weakAreas)],
      strong_areas: [...new Set(strongAreas)],
      last_interacted: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,topic'
    })
}

async function checkAchievements(supabaseClient: any, userId: string, userStats: any, attempt: any) {
  const newAchievements = []

  // Check streak achievements
  if (userStats.streak_days === 3) {
    await unlockAchievement(supabaseClient, userId, 'Streak Starter', newAchievements)
  }
  if (userStats.streak_days === 7) {
    await unlockAchievement(supabaseClient, userId, 'Consistent Learner', newAchievements)
  }

  // Check score achievements
  if (attempt.score_percentage === 100) {
    await unlockAchievement(supabaseClient, userId, 'Perfect Score', newAchievements)
  }

  // Check level achievements
  if (userStats.current_level >= 5) {
    await unlockAchievement(supabaseClient, userId, 'Knowledge Seeker', newAchievements)
  }

  return newAchievements
}

async function unlockAchievement(supabaseClient: any, userId: string, achievementName: string, newAchievements: any[]) {
  // Check if already unlocked
  const { data: existing } = await supabaseClient
    .from('user_achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('achievement_id', achievementName)
    .single()

  if (!existing) {
    const { data: achievement } = await supabaseClient
      .from('achievements')
      .select('*')
      .eq('name', achievementName)
      .single()

    if (achievement) {
      await supabaseClient
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          progress: achievement.required_value,
          completed: true,
          completed_at: new Date().toISOString()
        })

      newAchievements.push({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        xp_reward: achievement.xp_reward
      })
    }
  }
}