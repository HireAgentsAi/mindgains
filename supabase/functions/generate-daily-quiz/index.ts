import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface DailyQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

Deno.serve(async (req: Request) => {
  console.log('🚀 Generate daily quiz function called');
  
  if (req.method === "OPTIONS") {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('📝 Processing daily quiz generation request');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Generating quiz for date:', today);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if quiz already exists for today
    const { data: existingQuiz, error: checkError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (existingQuiz) {
      console.log('✅ Quiz already exists for today');
      return new Response(
        JSON.stringify({
          success: true,
          quiz: existingQuiz,
          message: 'Daily quiz already exists'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Generate questions using OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    let questions: DailyQuizQuestion[] = [];

    if (openaiApiKey) {
      try {
        console.log('🤖 Generating questions with OpenAI...');
        
        // Get current date for current affairs
        const currentDate = new Date();
        const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const prompt = `Generate 10 high-quality multiple-choice questions for Indian competitive exams (UPSC, SSC, Banking).
        
Requirements:
1. Cover these subjects with specified counts:
   - History: 2 questions (focus on important events, personalities, movements)
   - Polity: 2 questions (Constitution, recent amendments, important articles)
   - Geography: 2 questions (physical features, resources, climate)
   - Economy: 1 question (recent economic policies, budget highlights, RBI decisions)
   - Science & Technology: 1 question (recent discoveries, space missions, technology)
   - Current Affairs: 2 questions (events from last 6 months as of ${monthYear})

2. Difficulty distribution:
   - Easy: 4 questions (basic facts, well-known information)
   - Medium: 4 questions (conceptual understanding, application)
   - Hard: 2 questions (in-depth knowledge, analysis)

3. Each question must be:
   - Factually accurate and verifiable
   - Relevant to Indian competitive exams
   - Clear and unambiguous
   - Have exactly one correct answer

4. For Current Affairs, include recent events like:
   - Government schemes launched in last 6 months
   - International summits/conferences India participated in
   - Recent Supreme Court judgments
   - New scientific achievements by India

Return a JSON object with "questions" array containing exactly 10 questions in this format:
{
  "questions": [
    {
      "question": "Clear, concise question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation with facts and context",
      "subject": "Subject name",
      "subtopic": "Specific topic",
      "difficulty": "easy",
      "points": 5
    }
  ]
}

Points allocation: easy=5, medium=10, hard=15`;

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
                content: 'You are an expert question setter for Indian competitive exams. Create factually accurate, exam-relevant questions. Always return valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('OpenAI response received');
          
          const content = JSON.parse(data.choices[0].message.content);
          const aiQuestions = content.questions || [];
          
          // Validate and map questions
          questions = aiQuestions.map((q: any, index: number) => ({
            id: `dq${index + 1}`,
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            correct_answer: typeof q.correct_answer === 'number' ? q.correct_answer : 0,
            explanation: q.explanation || '',
            subject: q.subject || 'General Knowledge',
            subtopic: q.subtopic || 'Miscellaneous',
            difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
            points: q.points || (q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10)
          }));
          
          console.log('✅ Generated questions with AI:', questions.length);
        } else {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status}`);
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        throw new Error(`Failed to generate questions with AI: ${aiError.message}`);
      }
    } else {
      console.error('❌ OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    // Ensure we have exactly 10 questions
    if (questions.length < 10) {
      throw new Error(`Only generated ${questions.length} questions, need 10`);
    } else if (questions.length > 10) {
      questions = questions.slice(0, 10);
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    const dailyQuiz = {
      date: today,
      questions,
      total_points: totalPoints,
      difficulty_distribution: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      },
      subjects_covered: [...new Set(questions.map(q => q.subject))],
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };

    // Save to database
    const { data: savedQuiz, error: saveError } = await supabase
      .from('daily_quizzes')
      .insert(dailyQuiz)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving quiz:', saveError);
      throw new Error(`Failed to save quiz: ${saveError.message}`);
    }

    console.log('🎉 Daily quiz generated and saved successfully');
    console.log('📈 Questions count:', questions.length);
    console.log('📊 Subjects covered:', dailyQuiz.subjects_covered.join(', '));

    return new Response(
      JSON.stringify({
        success: true,
        quiz: savedQuiz,
        message: 'Daily quiz generated successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('💥 Error in generate-daily-quiz:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate daily quiz',
        message: 'Quiz generation failed'
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