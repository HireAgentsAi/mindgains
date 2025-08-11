import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SubmitDailyQuizRequest {
  daily_quiz_id: string;
  answers: number[];
  time_spent: number;
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

    const { daily_quiz_id, answers, time_spent }: SubmitDailyQuizRequest = await req.json()

    // Get the daily quiz
    const { data: dailyQuiz, error: quizError } = await supabaseClient
      .from('daily_quizzes')
      .select('*')
      .eq('id', daily_quiz_id)
      .single()

    if (quizError || !dailyQuiz) {
      throw new Error('Daily quiz not found')
    }

    // Check if user already attempted today's quiz
    const today = new Date().toISOString().split('T')[0]
    const { data: existingAttempt } = await supabaseClient
      .from('daily_quiz_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('quiz_date', today)
      .single()

    if (existingAttempt) {
      throw new Error('You have already attempted today\'s quiz')
    }

    // Calculate score
    const questions = dailyQuiz.questions as any[]
    let correctAnswers = 0
    let totalPoints = 0
    const detailedResults: any[] = []

    questions.forEach((question, index) => {
      const userAnswer = answers[index]
      const isCorrect = userAnswer === question.correct_answer
      
      if (isCorrect) {
        correctAnswers++
        totalPoints += question.points
      }

      detailedResults.push({
        question_id: question.id,
        question: question.question,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? question.points : 0,
        explanation: question.explanation,
        subject: question.subject,
        subtopic: question.subtopic
      })
    })

    const scorePercentage = Math.round((correctAnswers / questions.length) * 100)

    // Save attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('daily_quiz_attempts')
      .insert({
        user_id: user.id,
        daily_quiz_id,
        quiz_date: today,
        answers: detailedResults,
        correct_answers: correctAnswers,
        total_questions: questions.length,
        score_percentage: scorePercentage,
        total_points: totalPoints,
        time_spent
      })
      .select()
      .single()

    if (attemptError) throw attemptError

    // Update user memory for each subject
    await updateUserMemoryFromQuiz(supabaseClient, user.id, detailedResults)

    // Calculate XP reward
    const baseXP = 50 // Base XP for daily quiz
    const accuracyBonus = Math.round((correctAnswers / questions.length) * 50)
    const speedBonus = time_spent < 300 ? 20 : time_spent < 600 ? 10 : 0 // Bonus for speed
    const streakBonus = await calculateStreakBonus(supabaseClient, user.id)
    const xpReward = baseXP + accuracyBonus + speedBonus + streakBonus

    // Update user stats
    await updateUserStats(supabaseClient, user.id, xpReward, scorePercentage)

    // Generate personalized mascot recommendations
    const recommendations = await generateMascotRecommendations(supabaseClient, user.id, detailedResults, scorePercentage)

    // Check for achievements
    const newAchievements = await checkDailyQuizAchievements(supabaseClient, user.id, scorePercentage, correctAnswers, time_spent)

    return new Response(
      JSON.stringify({
        success: true,
        attempt,
        results: {
          correct_answers: correctAnswers,
          total_questions: questions.length,
          score_percentage: scorePercentage,
          total_points: totalPoints,
          time_spent,
          detailed_results: detailedResults
        },
        rewards: {
          xp_earned: xpReward,
          breakdown: {
            base: baseXP,
            accuracy: accuracyBonus,
            speed: speedBonus,
            streak: streakBonus
          }
        },
        recommendations,
        new_achievements: newAchievements
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error submitting daily quiz:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to submit quiz',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function updateUserMemoryFromQuiz(supabaseClient: any, userId: string, results: any[]) {
  // Group results by subject
  const subjectResults: Record<string, any[]> = {}
  
  results.forEach(result => {
    if (!subjectResults[result.subject]) {
      subjectResults[result.subject] = []
    }
    subjectResults[result.subject].push(result)
  })

  // Update memory for each subject
  for (const [subject, subjectQuestions] of Object.entries(subjectResults)) {
    const correctCount = subjectQuestions.filter(q => q.is_correct).length
    const totalCount = subjectQuestions.length
    const proficiencyScore = Math.round((correctCount / totalCount) * 100)
    
    const weakAreas = subjectQuestions
      .filter(q => !q.is_correct)
      .map(q => q.subtopic)
      .filter(Boolean)
    
    const strongAreas = subjectQuestions
      .filter(q => q.is_correct)
      .map(q => q.subtopic)
      .filter(Boolean)

    await supabaseClient
      .from('user_memory')
      .upsert({
        user_id: userId,
        topic: `Daily Quiz - ${subject}`,
        subject,
        proficiency_score: proficiencyScore,
        attempts_count: 1,
        correct_answers: correctCount,
        total_questions: totalCount,
        weak_areas: [...new Set(weakAreas)],
        strong_areas: [...new Set(strongAreas)],
        last_interacted: new Date().toISOString(),
        learning_pattern: {
          daily_quiz_performance: proficiencyScore,
          last_attempt_date: new Date().toISOString().split('T')[0]
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,topic,subject'
      })
  }
}

async function updateUserStats(supabaseClient: any, userId: string, xpReward: number, scorePercentage: number) {
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

  // Update rank based on level and performance
  const newRank = calculateRank(newLevel, newTotalXP, scorePercentage)

  await supabaseClient
    .from('user_stats')
    .upsert({
      user_id: userId,
      total_xp: newTotalXP,
      current_level: newLevel,
      streak_days: newStreakDays,
      rank: newRank,
      last_activity_date: today,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
}

async function calculateStreakBonus(supabaseClient: any, userId: string): Promise<number> {
  const { data: stats } = await supabaseClient
    .from('user_stats')
    .select('streak_days')
    .eq('user_id', userId)
    .single()

  const streakDays = stats?.streak_days || 0
  
  if (streakDays >= 30) return 50
  if (streakDays >= 14) return 30
  if (streakDays >= 7) return 20
  if (streakDays >= 3) return 10
  return 0
}

function calculateRank(level: number, totalXP: number, recentScore: number): string {
  if (level >= 20 && totalXP >= 25000) return 'Grandmaster Scholar'
  if (level >= 15 && totalXP >= 15000) return 'Master Scholar'
  if (level >= 10 && totalXP >= 8000) return 'Expert Scholar'
  if (level >= 7 && totalXP >= 4000) return 'Advanced Scholar'
  if (level >= 5 && totalXP >= 2000) return 'Intermediate Scholar'
  if (level >= 3 && totalXP >= 1000) return 'Developing Scholar'
  return 'Beginner Scholar'
}

async function generateMascotRecommendations(supabaseClient: any, userId: string, results: any[], scorePercentage: number) {
  try {
    // Analyze performance
    const weakSubjects = results
      .filter(r => !r.is_correct)
      .map(r => r.subject)
      .reduce((acc: Record<string, number>, subject) => {
        acc[subject] = (acc[subject] || 0) + 1
        return acc
      }, {})

    const strongSubjects = results
      .filter(r => r.is_correct)
      .map(r => r.subject)

    // Generate AI-powered recommendations
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      // Fallback recommendations
      return await createFallbackRecommendations(supabaseClient, userId, scorePercentage, weakSubjects)
    }

    const prompt = `As Twizzle, the friendly AI mascot for Indian students, generate 3 personalized recommendations based on this daily quiz performance:

Score: ${scorePercentage}%
Weak areas: ${Object.keys(weakSubjects).join(', ') || 'None'}
Strong areas: ${strongSubjects.join(', ') || 'None'}

Generate encouraging, specific recommendations that:
1. Address weak areas with study tips
2. Celebrate strong performance
3. Suggest next steps for improvement
4. Include relevant Indian exam context

Keep each recommendation under 80 characters. Be friendly and motivating.

Return JSON:
{
  "recommendations": [
    {
      "text": "Short encouraging message with emoji",
      "type": "weak_area|celebration|study_tip|motivation",
      "subject": "Subject name or General",
      "priority": 1
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Twizzle, a friendly AI mascot helping Indian students with competitive exam preparation. Be encouraging, specific, and culturally aware.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    })

    if (response.ok) {
      const aiResponse = await response.json()
      const aiRecommendations = JSON.parse(aiResponse.choices[0].message.content)
      
      // Store recommendations
      await supabaseClient
        .from('mascot_recommendations')
        .insert(
          aiRecommendations.recommendations.map((rec: any) => ({
            user_id: userId,
            recommendation_text: rec.text,
            recommendation_type: rec.type,
            subject: rec.subject,
            priority: rec.priority || 1,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }))
        )

      return aiRecommendations.recommendations.map((r: any) => r.text)
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error)
  }

  // Fallback to rule-based recommendations
  return await createFallbackRecommendations(supabaseClient, userId, scorePercentage, weakSubjects)
}

async function createFallbackRecommendations(supabaseClient: any, userId: string, scorePercentage: number, weakSubjects: Record<string, number>) {
  const recommendations = []

  if (scorePercentage >= 90) {
    recommendations.push("Outstanding! You're mastering Indian knowledge! 🌟")
  } else if (scorePercentage >= 70) {
    recommendations.push("Great job! Keep up the excellent work! 💪")
  } else if (scorePercentage >= 50) {
    recommendations.push("Good effort! Focus on weak areas to improve! 📚")
  } else {
    recommendations.push("Don't worry! Practice makes perfect! 🎯")
  }

  // Add subject-specific recommendations
  const topWeakSubject = Object.keys(weakSubjects).reduce((a, b) => 
    weakSubjects[a] > weakSubjects[b] ? a : b, Object.keys(weakSubjects)[0]
  )

  if (topWeakSubject) {
    const subjectTips = {
      'History': "Try timeline-based learning for History! 📅",
      'Polity': "Focus on article numbers for Polity! ⚖️",
      'Geography': "Use maps for Geography concepts! 🗺️",
      'Economy': "Connect economic policies to current events! 💰",
      'Science & Technology': "Follow ISRO and tech news! 🚀",
      'Current Affairs': "Read newspapers daily! 📰"
    }
    
    recommendations.push(subjectTips[topWeakSubject as keyof typeof subjectTips] || "Keep practicing this subject! 📖")
  }

  // Store fallback recommendations
  await supabaseClient
    .from('mascot_recommendations')
    .insert(
      recommendations.map((text, index) => ({
        user_id: userId,
        recommendation_text: text,
        recommendation_type: 'fallback',
        subject: index === 1 ? topWeakSubject : 'General',
        priority: index + 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }))
    )

  return recommendations
}

async function checkDailyQuizAchievements(supabaseClient: any, userId: string, scorePercentage: number, correctAnswers: number, timeSpent: number) {
  const newAchievements = []

  // Perfect score achievement
  if (scorePercentage === 100) {
    await unlockAchievement(supabaseClient, userId, 'Daily Quiz Master', newAchievements)
  }

  // Speed achievement
  if (timeSpent < 300 && scorePercentage >= 80) {
    await unlockAchievement(supabaseClient, userId, 'Lightning Quick', newAchievements)
  }

  // Consistency achievement (check streak)
  const { data: attempts } = await supabaseClient
    .from('daily_quiz_attempts')
    .select('quiz_date')
    .eq('user_id', userId)
    .order('quiz_date', { ascending: false })
    .limit(7)

  if (attempts && attempts.length >= 7) {
    await unlockAchievement(supabaseClient, userId, 'Daily Dedication', newAchievements)
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