import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface UpdateProgressRequest {
  mission_id: string;
  room_type: 'clarity' | 'quiz' | 'memory' | 'test';
  score: number;
  max_score: number;
  time_spent: number;
  completed: boolean;
}

serve(async (req: Request) => {
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
      mission_id,
      room_type,
      score,
      max_score,
      time_spent,
      completed
    }: UpdateProgressRequest = await req.json()

    // Update mission progress with proper conflict resolution
    const { data: progress, error: progressError } = await supabaseClient
      .from('mission_progress')
      .upsert({
        user_id: user.id,
        mission_id,
        room_type,
        score,
        max_score,
        time_spent,
        attempts: 1, // Increment attempts
        status: completed ? 'completed' : 'in_progress',
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,mission_id,room_type' 
      })
      .select()
      .single()

    if (progressError) {
      throw progressError
    }

    // Calculate XP reward
    const xpReward = calculateXP(score, max_score, room_type, time_spent)
    
    // Get or create user stats
    const { data: existingStats } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    let newTotalXP = xpReward
    let newLevel = 1
    let newMissionsCompleted = 0

    if (existingStats) {
      newTotalXP = (existingStats.total_xp || 0) + xpReward
      newLevel = calculateLevel(newTotalXP)
      newMissionsCompleted = existingStats.missions_completed || 0
    }

    // Update user stats
    const { data: updatedStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: newTotalXP,
        current_level: newLevel,
        missions_completed: newMissionsCompleted,
        last_activity_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (statsError) {
      console.error('Stats update error:', statsError)
    }

    // Check if mission is fully completed (all room types completed)
    const { data: allProgress } = await supabaseClient
      .from('mission_progress')
      .select('status, room_type')
      .eq('user_id', user.id)
      .eq('mission_id', mission_id)

    const requiredRoomTypes = ['clarity', 'quiz', 'memory', 'test']
    const completedRoomTypes = allProgress?.filter(p => p.status === 'completed').map(p => p.room_type) || []
    const missionCompleted = requiredRoomTypes.every(roomType => completedRoomTypes.includes(roomType))

    if (missionCompleted && existingStats) {
      // Update mission status
      await supabaseClient
        .from('missions')
        .update({ status: 'completed' })
        .eq('id', mission_id)

      // Update missions completed count
      await supabaseClient
        .from('user_stats')
        .update({ 
          missions_completed: newMissionsCompleted + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    }

    // Simple achievement checking based on current stats
    const newAchievements = await checkSimpleAchievements(supabaseClient, user.id, newTotalXP, newLevel)

    return new Response(
      JSON.stringify({
        success: true,
        progress,
        xp_reward: xpReward,
        user_stats: updatedStats,
        new_achievements: newAchievements || [],
        mission_completed: missionCompleted
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error updating progress:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to update progress' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

function calculateXP(score: number, maxScore: number, roomType: string, timeSpent: number): number {
  const baseXP = {
    clarity: 20,
    quiz: 30,
    memory: 25,
    test: 50
  }

  const accuracy = score / maxScore
  const speedBonus = timeSpent < 300 ? 1.2 : 1 // Bonus for completing under 5 minutes
  
  return Math.round(baseXP[roomType as keyof typeof baseXP] * accuracy * speedBonus)
}

function calculateLevel(totalXP: number): number {
  // Simple level calculation: every 1000 XP = 1 level
  return Math.floor(totalXP / 1000) + 1
}

async function checkSimpleAchievements(supabaseClient: any, userId: string, totalXP: number, currentLevel: number) {
  const newAchievements = []

  // Check for level-based achievements
  if (currentLevel >= 5) {
    const { data: existing } = await supabaseClient
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', 'level_5')
      .single()

    if (!existing) {
      await supabaseClient
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: 'level_5',
          achievement_title: 'Rising Star',
          achievement_description: 'Reached level 5',
          achievement_icon: '⭐'
        })
      
      newAchievements.push({
        id: 'level_5',
        title: 'Rising Star',
        description: 'Reached level 5',
        icon: '⭐'
      })
    }
  }

  // Check for XP-based achievements
  if (totalXP >= 1000) {
    const { data: existing } = await supabaseClient
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', 'xp_1000')
      .single()

    if (!existing) {
      await supabaseClient
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: 'xp_1000',
          achievement_title: 'Knowledge Seeker',
          achievement_description: 'Earned 1000 XP',
          achievement_icon: '🎓'
        })
      
      newAchievements.push({
        id: 'xp_1000',
        title: 'Knowledge Seeker',
        description: 'Earned 1000 XP',
        icon: '🎓'
      })
    }
  }

  return newAchievements
}