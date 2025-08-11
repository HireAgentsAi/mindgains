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

// Fallback questions when AI generation fails
const getFallbackQuestions = (): DailyQuizQuestion[] => {
  return [
    {
      id: "dq1",
      question: "Who was the first President of India?",
      options: ["Dr. Rajendra Prasad", "Dr. A.P.J. Abdul Kalam", "Dr. S. Radhakrishnan", "Zakir Husain"],
      correct_answer: 0,
      explanation: "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.",
      subject: "History",
      subtopic: "Indian Independence",
      difficulty: "easy",
      points: 5
    },
    {
      id: "dq2",
      question: "Which article of the Indian Constitution deals with the Right to Equality?",
      options: ["Article 14", "Article 19", "Article 21", "Article 32"],
      correct_answer: 0,
      explanation: "Article 14 of the Indian Constitution guarantees equality before law and equal protection of laws.",
      subject: "Polity",
      subtopic: "Fundamental Rights",
      difficulty: "medium",
      points: 10
    },
    {
      id: "dq3",
      question: "Which is the longest river in India?",
      options: ["Yamuna", "Ganga", "Godavari", "Narmada"],
      correct_answer: 1,
      explanation: "The Ganga is the longest river in India, flowing for about 2,525 kilometers.",
      subject: "Geography",
      subtopic: "Rivers",
      difficulty: "easy",
      points: 5
    },
    {
      id: "dq4",
      question: "What is the current repo rate set by RBI as of 2024?",
      options: ["6.50%", "6.25%", "6.75%", "7.00%"],
      correct_answer: 0,
      explanation: "The Reserve Bank of India has maintained the repo rate at 6.50% to control inflation.",
      subject: "Economy",
      subtopic: "Monetary Policy",
      difficulty: "medium",
      points: 10
    },
    {
      id: "dq5",
      question: "Which mission successfully landed on the Moon's south pole in 2023?",
      options: ["Chandrayaan-2", "Chandrayaan-3", "Mangalyaan", "Aditya L1"],
      correct_answer: 1,
      explanation: "Chandrayaan-3 successfully landed on the Moon's south pole in August 2023, making India the fourth country to land on the Moon.",
      subject: "Science & Technology",
      subtopic: "Space Missions",
      difficulty: "easy",
      points: 5
    },
    {
      id: "dq6",
      question: "Who founded the Indian National Congress?",
      options: ["Dadabhai Naoroji", "A.O. Hume", "Bal Gangadhar Tilak", "Gopal Krishna Gokhale"],
      correct_answer: 1,
      explanation: "Allan Octavian Hume, a British civil servant, founded the Indian National Congress in 1885.",
      subject: "History",
      subtopic: "Freedom Movement",
      difficulty: "medium",
      points: 10
    },
    {
      id: "dq7",
      question: "Which state has the highest literacy rate in India?",
      options: ["Tamil Nadu", "Maharashtra", "Kerala", "Gujarat"],
      correct_answer: 2,
      explanation: "Kerala has the highest literacy rate in India at approximately 93.91% according to the 2011 census.",
      subject: "Geography",
      subtopic: "Demographics",
      difficulty: "medium",
      points: 10
    },
    {
      id: "dq8",
      question: "What does GDP stand for?",
      options: ["Gross Domestic Product", "General Development Program", "Global Development Policy", "Gross Development Product"],
      correct_answer: 0,
      explanation: "GDP stands for Gross Domestic Product, which measures the total value of goods and services produced in a country.",
      subject: "Economy",
      subtopic: "Economic Indicators",
      difficulty: "easy",
      points: 5
    },
    {
      id: "dq9",
      question: "Which Indian city hosted the G20 Summit in 2023?",
      options: ["Mumbai", "New Delhi", "Bangalore", "Chennai"],
      correct_answer: 1,
      explanation: "New Delhi hosted the G20 Summit in September 2023, with India holding the G20 presidency.",
      subject: "Current Affairs",
      subtopic: "International Relations",
      difficulty: "easy",
      points: 5
    },
    {
      id: "dq10",
      question: "Who can remove the President of India from office?",
      options: ["Prime Minister", "Supreme Court", "Parliament through impeachment", "Council of Ministers"],
      correct_answer: 2,
      explanation: "The President can be removed from office through impeachment by Parliament, requiring a special majority in both houses.",
      subject: "Polity",
      subtopic: "Constitutional Provisions",
      difficulty: "hard",
      points: 15
    }
  ];
};

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
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('❌ Missing Supabase configuration');
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if quiz already exists for today
    const { data: existingQuiz, error: checkError } = await supabase
      .from('daily_quizzes')
      .select('*')
      .eq('date', today)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing quiz:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

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

    // Try to generate questions using OpenAI, fallback to demo questions
    let questions: DailyQuizQuestion[] = [];
    let generationMethod = 'fallback';

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')?.trim();
    
    if (openaiApiKey && openaiApiKey.length > 0) {
      try {
        console.log('🤖 Attempting to generate questions with OpenAI...');
        
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenAI API error:', response.status, errorText);
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI response received');
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid OpenAI response structure');
        }
        
        const content = JSON.parse(data.choices[0].message.content);
        const aiQuestions = content.questions || [];
        
        if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
          throw new Error('No questions received from OpenAI');
        }
        
        // Validate and map questions
        questions = aiQuestions.slice(0, 10).map((q: any, index: number) => ({
          id: `dq${index + 1}`,
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
          correct_answer: typeof q.correct_answer === 'number' ? Math.max(0, Math.min(3, q.correct_answer)) : 0,
          explanation: q.explanation || '',
          subject: q.subject || 'General Knowledge',
          subtopic: q.subtopic || 'Miscellaneous',
          difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
          points: q.points || (q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10)
        }));
        
        // Validate questions have required fields
        questions = questions.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 && 
          q.explanation
        );
        
        if (questions.length >= 10) {
          generationMethod = 'ai';
          questions = questions.slice(0, 10);
          console.log('✅ Generated questions with AI:', questions.length);
        } else {
          throw new Error(`Only generated ${questions.length} valid questions, need 10`);
        }
        
      } catch (aiError) {
        console.error('❌ AI generation failed:', aiError);
        console.log('🔄 Falling back to demo questions');
        questions = getFallbackQuestions();
        generationMethod = 'fallback';
      }
    } else {
      console.log('⚠️ OpenAI API key not found, using fallback questions');
      questions = getFallbackQuestions();
      generationMethod = 'fallback';
    }

    // Ensure we have exactly 10 questions
    if (questions.length < 10) {
      console.log('⚠️ Not enough questions, padding with fallback');
      const fallbackQuestions = getFallbackQuestions();
      while (questions.length < 10 && fallbackQuestions.length > 0) {
        questions.push(fallbackQuestions[questions.length % fallbackQuestions.length]);
      }
    }

    questions = questions.slice(0, 10);
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
      console.error('❌ Error saving quiz:', saveError);
      throw new Error(`Failed to save quiz: ${saveError.message}`);
    }

    console.log('🎉 Daily quiz generated and saved successfully');
    console.log('📈 Questions count:', questions.length);
    console.log('🔧 Generation method:', generationMethod);
    console.log('📊 Subjects covered:', dailyQuiz.subjects_covered.join(', '));

    return new Response(
      JSON.stringify({
        success: true,
        quiz: savedQuiz,
        generation_method: generationMethod,
        message: `Daily quiz generated successfully using ${generationMethod}`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('💥 Critical error in generate-daily-quiz:', error);
    
    // Even if everything fails, try to return fallback questions
    try {
      const today = new Date().toISOString().split('T')[0];
      const fallbackQuestions = getFallbackQuestions();
      
      const fallbackQuiz = {
        date: today,
        questions: fallbackQuestions,
        total_points: fallbackQuestions.reduce((sum, q) => sum + q.points, 0),
        difficulty_distribution: {
          easy: fallbackQuestions.filter(q => q.difficulty === 'easy').length,
          medium: fallbackQuestions.filter(q => q.difficulty === 'medium').length,
          hard: fallbackQuestions.filter(q => q.difficulty === 'hard').length
        },
        subjects_covered: [...new Set(fallbackQuestions.map(q => q.subject))],
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      console.log('🆘 Returning emergency fallback quiz');
      
      return new Response(
        JSON.stringify({
          success: true,
          quiz: fallbackQuiz,
          generation_method: 'emergency_fallback',
          message: 'Daily quiz generated using emergency fallback'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (fallbackError) {
      console.error('💀 Even fallback failed:', fallbackError);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || 'Failed to generate daily quiz',
          message: 'Quiz generation failed completely'
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
  }
});