import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserProfileRequest {
  userId: string;
  email: string;
  fullName?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId, email, fullName }: CreateUserProfileRequest = await req.json()

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'userId and email are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      throw profileError
    }

    // Create initial user stats
    const { data: userStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .insert({
        user_id: userId,
        total_xp: 0,
        current_level: 1,
        missions_completed: 0,
        streak_days: 0,
        rank: 'Beginner',
        total_study_time: 0,
      })
      .select()
      .single()

    if (statsError) {
      console.error('Error creating user stats:', statsError)
      // Don't throw here, profile creation is more important
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        userStats,
        message: 'User profile created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-user-profile function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create user profile',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})