import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SubmitDailyQuizRequest {
  daily_quiz_id: string;
  answers: number[];
  time_spent: number;
}

Deno.serve(async (req: Request) => {
  console.log('📤 Submit daily quiz function called');
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      throw new Error('Invalid authentication token');
    }

    console.log('👤 User authenticated:', user.id);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      throw new Error('Invalid request body');
    }

    const { daily_quiz_id, answers, time_spent }: SubmitDailyQuizRequest = requestBody;

    console.log('📋 Submission data:', { daily_quiz_id, answersLength: answers?.length, time_spent });

    if (!daily_quiz_id || !Array.isArray(answers) || typeof time_spent !== 'number') {
      throw new Error('Missing required fields: daily_quiz_id, answers, time_spent');
    }

    // Get the daily quiz
    const { data: dailyQuiz, error: quizError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('id', daily_quiz_id)
      .single();

    if (quizError) {
      console.error('❌ Quiz fetch error:', quizError);
      throw new Error('Daily quiz not found');
    }

    if (!dailyQuiz) {
      throw new Error('Daily quiz not found');
    }

    console.log('📋 Quiz found:', { questionsCount: dailyQuiz.questions?.length });

    // Check if user already attempted today's quiz
    const today = new Date().toISOString().split('T')[0];
    const { data: existingAttempt } = await supabase
      .from('daily_quiz_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('quiz_date', today)
      .single();

    if (existingAttempt) {
      console.log('⚠️ User already attempted today');
      throw new Error('You have already attempted today\'s quiz');
    }

    // Calculate score
    const questions = dailyQuiz.questions as any[];
    if (!questions || !Array.isArray(questions)) {
      throw new Error('Invalid quiz questions format');
    }

    let correctAnswers = 0;
    let totalPoints = 0;
    const detailedResults: any[] = [];

    questions.forEach((question, index) => {
      const userAnswer = answers[index] ?? -1;
      const isCorrect = userAnswer === question.correct_answer;
      
      if (isCorrect) {
        correctAnswers++;
        totalPoints += question.points || 10;
      }

      detailedResults.push({
        question_id: question.id || `q${index}`,
        question: question.question,
        options: question.options,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? (question.points || 10) : 0,
        explanation: question.explanation,
        subject: question.subject,
        subtopic: question.subtopic || question.subject,
        difficulty: question.difficulty || 'medium'
      });
    });

    const scorePercentage = Math.round((correctAnswers / questions.length) * 100);

    console.log('📊 Score calculated:', { correctAnswers, totalQuestions: questions.length, scorePercentage, totalPoints });

    // Save attempt to database
    const { data: attempt, error: attemptError } = await supabase
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
      .single();

    if (attemptError) {
      console.error('❌ Attempt save error:', attemptError);
      // Continue without saving to database
    } else {
      console.log('✅ Attempt saved to database');
    }

    // Calculate XP reward
    const baseXP = 50; // Base XP for daily quiz
    const accuracyBonus = Math.round((correctAnswers / questions.length) * 50);
    const speedBonus = time_spent < 300 ? 20 : time_spent < 600 ? 10 : 0;
    const xpReward = baseXP + accuracyBonus + speedBonus;

    console.log('💰 XP calculation:', { baseXP, accuracyBonus, speedBonus, xpReward });

    // Update user stats
    try {
      await updateUserStats(supabase, user.id, xpReward, scorePercentage);
      console.log('✅ User stats updated');
    } catch (statsError) {
      console.error('⚠️ Stats update failed:', statsError);
      // Continue without stats update
    }

    // Generate Grok's witty response
    const mascotMessage = await generateMascotResponse(scorePercentage, correctAnswers, questions.length);
    console.log('🤖 Mascot message generated:', mascotMessage);

    // Generate mascot recommendations
    const recommendations = await generateMascotRecommendations(supabase, user.id, detailedResults, scorePercentage);
    console.log('💡 Recommendations generated:', recommendations.length);

    const finalResults = {
      correct_answers: correctAnswers,
      total_questions: questions.length,
      score_percentage: scorePercentage,
      total_points: totalPoints,
      time_spent,
      detailed_results: detailedResults,
      xp_earned: xpReward,
      xp_breakdown: {
        base: baseXP,
        accuracy: accuracyBonus,
        speed: speedBonus
      },
      mascot_message: mascotMessage,
      recommendations,
      attempt_id: attempt?.id
    };

    console.log('🎉 Quiz submission completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        results: finalResults,
        message: 'Daily quiz submitted successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('💥 Error in submit daily quiz:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to submit daily quiz',
        message: 'Quiz submission failed'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

async function updateUserStats(supabase: any, userId: string, xpReward: number, scorePercentage: number) {
  // Get current stats
  const { data: currentStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  const newTotalXP = (currentStats?.total_xp || 0) + xpReward;
  const newLevel = Math.floor(newTotalXP / 1000) + 1;
  
  // Update streak
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const lastActivity = currentStats?.last_activity_date;
  
  let newStreakDays = currentStats?.streak_days || 0;
  if (lastActivity === yesterday) {
    newStreakDays += 1;
  } else if (lastActivity !== today) {
    newStreakDays = 1;
  }

  // Update rank based on level and performance
  const newRank = calculateRank(newLevel, newTotalXP, scorePercentage);

  await supabase
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
    });

  return {
    total_xp: newTotalXP,
    current_level: newLevel,
    streak_days: newStreakDays,
    rank: newRank
  };
}

function calculateRank(level: number, totalXP: number, recentScore: number): string {
  if (level >= 20 && totalXP >= 25000) return 'Grandmaster Scholar';
  if (level >= 15 && totalXP >= 15000) return 'Master Scholar';
  if (level >= 10 && totalXP >= 8000) return 'Expert Scholar';
  if (level >= 7 && totalXP >= 4000) return 'Advanced Scholar';
  if (level >= 5 && totalXP >= 2000) return 'Intermediate Scholar';
  if (level >= 3 && totalXP >= 1000) return 'Developing Scholar';
  return 'Beginner Scholar';
}

async function generateMascotResponse(scorePercentage: number, correctAnswers: number, totalQuestions: number): Promise<string> {
  try {
    const grokApiKey = Deno.env.get('GROK_API_KEY');
    
    if (!grokApiKey) {
      console.log('⚠️ AI API key not available, using fallback');
      return getFallbackMascotMessage(scorePercentage);
    }

    const prompt = `You are the MindGains mascot, a witty and encouraging study buddy. A student just completed an Indian competitive exam daily quiz with ${correctAnswers}/${totalQuestions} correct answers (${scorePercentage}%).

Generate a witty, encouraging, and culturally relevant response that:
1. References Indian culture, history, or current events humorously
2. Is encouraging but realistic about their performance
3. Includes relevant emojis
4. Keeps it under 150 characters
5. Has a friendly, mascot-like personality

Make it specific to their ${scorePercentage}% score and Indian context.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${grokApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          {
            role: 'system',
            content: 'You are Grok, known for witty, humorous responses with cultural references. Keep responses brief and encouraging.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 200,
      }),
    });

    if (response.ok) {
      const grokResponse = await response.json();
      const message = grokResponse.choices[0].message.content.trim();
      console.log('🤖 Grok response generated:', message);
      return message;
    } else {
      console.log('⚠️ Grok API failed, using fallback');
      return getFallbackMascotMessage(scorePercentage);
    }
  } catch (error) {
    console.error('Error generating Grok response:', error);
    return getFallbackMascotMessage(scorePercentage);
  }
}

function getFallbackMascotMessage(percentage: number): string {
  if (percentage === 100) {
    return "🎯 Perfect score! You're basically a walking encyclopedia of Indian knowledge! Time to challenge Einstein! 🧠✨";
  } else if (percentage >= 90) {
    return "🌟 Outstanding! You're so smart, even Google would ask you for answers! Keep this momentum going! 🚀";
  } else if (percentage >= 80) {
    return "💪 Excellent work! You're crushing it like Bhagat Singh crushed the British morale! 🇮🇳";
  } else if (percentage >= 70) {
    return "📚 Good job! You're on the right track - just need to channel your inner Chandragupta Maurya! 👑";
  } else if (percentage >= 60) {
    return "🎯 Not bad! Rome wasn't built in a day, and neither was the Taj Mahal. Keep practicing! 🏛️";
  } else if (percentage >= 50) {
    return "🤔 Hmm, looks like you need to spend more time with books than with Netflix! But hey, we all start somewhere! 📖";
  } else {
    return "😅 Well, at least you showed up! That's more than what some Mughal emperors did for their empire! Try again tomorrow! 💪";
  }
}

async function generateMascotRecommendations(supabase: any, userId: string, results: any[], scorePercentage: number) {
  try {
    // Analyze performance
    const weakSubjects = results
      .filter(r => !r.is_correct)
      .map(r => r.subject)
      .reduce((acc: Record<string, number>, subject) => {
        acc[subject] = (acc[subject] || 0) + 1;
        return acc;
      }, {});

    const strongSubjects = results
      .filter(r => r.is_correct)
      .map(r => r.subject);

    // Generate AI-powered recommendations
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      // Fallback recommendations
      return createFallbackRecommendations(supabase, userId, scorePercentage, weakSubjects);
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
}`;

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
    });

    if (response.ok) {
      const aiResponse = await response.json();
      const aiRecommendations = JSON.parse(aiResponse.choices[0].message.content);
      
      // Store recommendations
      await supabase
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
        );

      return aiRecommendations.recommendations.map((r: any) => r.text);
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
  }

  // Fallback to rule-based recommendations
  return createFallbackRecommendations(supabase, userId, scorePercentage, weakSubjects);
}

async function createFallbackRecommendations(supabase: any, userId: string, scorePercentage: number, weakSubjects: Record<string, number>) {
  const recommendations = [];

  if (scorePercentage >= 90) {
    recommendations.push("Outstanding! You're mastering Indian knowledge! 🌟");
  } else if (scorePercentage >= 70) {
    recommendations.push("Great job! Keep up the excellent work! 💪");
  } else if (scorePercentage >= 50) {
    recommendations.push("Good effort! Focus on weak areas to improve! 📚");
  } else {
    recommendations.push("Don't worry! Practice makes perfect! 🎯");
  }

  // Add subject-specific recommendations
  const topWeakSubject = Object.keys(weakSubjects).reduce((a, b) => 
    weakSubjects[a] > weakSubjects[b] ? a : b, Object.keys(weakSubjects)[0]
  );

  if (topWeakSubject) {
    const subjectTips = {
      'History': "Try timeline-based learning for History! 📅",
      'Polity': "Focus on article numbers for Polity! ⚖️",
      'Geography': "Use maps for Geography concepts! 🗺️",
      'Economy': "Connect economic policies to current events! 💰",
      'Science & Technology': "Follow ISRO and tech news! 🚀",
      'Current Affairs': "Read newspapers daily! 📰"
    };
    
    recommendations.push(subjectTips[topWeakSubject as keyof typeof subjectTips] || "Keep practicing this subject! 📖");
  }

  // Store fallback recommendations
  try {
    await supabase
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
      );
  } catch (error) {
    console.error('Error storing recommendations:', error);
  }

  return recommendations;
}