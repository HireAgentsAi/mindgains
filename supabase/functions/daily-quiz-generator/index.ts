import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

const SUBJECTS = [
  { name: 'History', topics: ['Ancient India', 'Medieval India', 'Modern India', 'Freedom Struggle', 'Post-Independence'] },
  { name: 'Polity', topics: ['Constitution', 'Parliament', 'Judiciary', 'Executive', 'Fundamental Rights'] },
  { name: 'Geography', topics: ['Physical Geography', 'Indian Geography', 'World Geography', 'Climate', 'Resources'] },
  { name: 'Economy', topics: ['Indian Economy', 'Banking', 'Budget', 'Economic Policy', 'International Trade'] },
  { name: 'Science & Technology', topics: ['Physics', 'Chemistry', 'Biology', 'Space Technology', 'IT & Computers'] },
  { name: 'Current Affairs', topics: ['National', 'International', 'Sports', 'Awards', 'Government Schemes'] }
];

Deno.serve(async (req: Request) => {
  console.log('🚀 Daily quiz generator function called');
  
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
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    let questions: DailyQuizQuestion[] = [];

    if (openAIKey) {
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
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Using gpt-4o-mini for faster and cheaper generation
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
        // Fall back to demo questions if AI fails
        questions = generateDemoQuestions();
      }
    } else {
      console.log('⚠️ OpenAI API key not found, using demo questions');
      questions = generateDemoQuestions();
    }

    // Ensure we have exactly 10 questions
    if (questions.length < 10) {
      console.log('⚠️ Not enough questions generated, adding demo questions');
      const demoQuestions = generateDemoQuestions();
      questions = [...questions, ...demoQuestions.slice(0, 10 - questions.length)];
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
      // Return the generated quiz even if save fails
      return new Response(
        JSON.stringify({
          success: true,
          quiz: { id: `temp_${Date.now()}`, ...dailyQuiz },
          message: 'Quiz generated but not saved to database'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
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
    console.error('💥 Error in daily-quiz-generator:', error);
    
    // Return demo quiz as fallback
    const demoQuestions = generateDemoQuestions();
    const today = new Date().toISOString().split('T')[0];
    const totalPoints = demoQuestions.reduce((sum, q) => sum + q.points, 0);
    
    const fallbackQuiz = {
      id: `demo_${Date.now()}`,
      date: today,
      questions: demoQuestions,
      total_points: totalPoints,
      difficulty_distribution: {
        easy: demoQuestions.filter(q => q.difficulty === 'easy').length,
        medium: demoQuestions.filter(q => q.difficulty === 'medium').length,
        hard: demoQuestions.filter(q => q.difficulty === 'hard').length
      },
      subjects_covered: [...new Set(demoQuestions.map(q => q.subject))],
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        quiz: fallbackQuiz,
        message: 'Daily quiz generated (demo mode)'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});

function generateDemoQuestions(): DailyQuizQuestion[] {
  console.log('📝 Generating 10 demo questions');
  
  return [
    {
      id: 'dq1',
      question: 'Who was the first President of India?',
      options: ['Dr. Rajendra Prasad', 'Dr. A.P.J. Abdul Kalam', 'Dr. Sarvepalli Radhakrishnan', 'Zakir Husain'],
      correct_answer: 0,
      explanation: 'Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962. He was a key leader in the Indian independence movement and played a crucial role in the Constituent Assembly.',
      difficulty: 'easy',
      points: 5,
      subject: 'Polity',
      subtopic: 'Constitutional Posts'
    },
    {
      id: 'dq2',
      question: 'Which river is known as the "Ganga of the South"?',
      options: ['Godavari', 'Krishna', 'Kaveri', 'Tungabhadra'],
      correct_answer: 0,
      explanation: 'The Godavari is known as the "Ganga of the South" or "Dakshina Ganga". It is the second longest river in India after the Ganges, flowing through Maharashtra, Telangana, and Andhra Pradesh.',
      difficulty: 'medium',
      points: 10,
      subject: 'Geography',
      subtopic: 'Rivers'
    },
    {
      id: 'dq3',
      question: 'The Battle of Plassey was fought in which year?',
      options: ['1757', '1764', '1761', '1767'],
      correct_answer: 0,
      explanation: 'The Battle of Plassey was fought on 23 June 1757 between the East India Company forces led by Robert Clive and the Nawab of Bengal, Siraj-ud-Daulah. This battle marked the beginning of British political control in India.',
      difficulty: 'medium',
      points: 10,
      subject: 'History',
      subtopic: 'British Rule'
    },
    {
      id: 'dq4',
      question: 'Which Five Year Plan is known as the "Gadgil Plan"?',
      options: ['First Plan', 'Second Plan', 'Third Plan', 'Fourth Plan'],
      correct_answer: 3,
      explanation: 'The Fourth Five Year Plan (1969-74) is known as the Gadgil Plan, named after D.R. Gadgil who was the Deputy Chairman of the Planning Commission. It focused on growth with stability and progressive achievement of self-reliance.',
      difficulty: 'hard',
      points: 15,
      subject: 'Economy',
      subtopic: 'Planning'
    },
    {
      id: 'dq5',
      question: 'ISRO was established in which year?',
      options: ['1969', '1972', '1975', '1980'],
      correct_answer: 0,
      explanation: 'The Indian Space Research Organisation (ISRO) was established on 15 August 1969 under the leadership of Dr. Vikram Sarabhai, who is considered the father of the Indian space program.',
      difficulty: 'medium',
      points: 10,
      subject: 'Science & Technology',
      subtopic: 'Space Program'
    },
    {
      id: 'dq6',
      question: 'Which article of the Constitution deals with the Right to Education?',
      options: ['Article 21', 'Article 21A', 'Article 45', 'Article 46'],
      correct_answer: 1,
      explanation: 'Article 21A was inserted by the 86th Constitutional Amendment Act, 2002. It provides for free and compulsory education for all children between the ages of 6 to 14 years as a Fundamental Right.',
      difficulty: 'medium',
      points: 10,
      subject: 'Polity',
      subtopic: 'Fundamental Rights'
    },
    {
      id: 'dq7',
      question: 'The Western Ghats are also known as?',
      options: ['Sahyadri', 'Nilgiris', 'Cardamom Hills', 'Anamalai Hills'],
      correct_answer: 0,
      explanation: 'The Western Ghats are also known as Sahyadri, meaning "benevolent mountains". They run parallel to the western coast of India and are recognized as a UNESCO World Heritage Site for their biodiversity.',
      difficulty: 'easy',
      points: 5,
      subject: 'Geography',
      subtopic: 'Mountain Ranges'
    },
    {
      id: 'dq8',
      question: 'Who founded the Indian National Congress?',
      options: ['A.O. Hume', 'Dadabhai Naoroji', 'Surendranath Banerjee', 'W.C. Bonnerjee'],
      correct_answer: 0,
      explanation: 'Allan Octavian Hume, a British civil servant, founded the Indian National Congress in 1885. The first session was held in Bombay (now Mumbai) with W.C. Bonnerjee as the first president.',
      difficulty: 'easy',
      points: 5,
      subject: 'History',
      subtopic: 'Freedom Struggle'
    },
    {
      id: 'dq9',
      question: 'Which Indian city hosted the G20 Summit in 2023?',
      options: ['Mumbai', 'New Delhi', 'Bangalore', 'Chennai'],
      correct_answer: 1,
      explanation: 'New Delhi hosted the G20 Summit in September 2023 at the newly built Bharat Mandapam. India\'s G20 presidency theme was "Vasudhaiva Kutumbakam" (One Earth, One Family, One Future).',
      difficulty: 'easy',
      points: 5,
      subject: 'Current Affairs',
      subtopic: 'International Relations'
    },
    {
      id: 'dq10',
      question: 'The National Green Tribunal was established in which year?',
      options: ['2008', '2010', '2012', '2014'],
      correct_answer: 1,
      explanation: 'The National Green Tribunal (NGT) was established on 18 October 2010 under the National Green Tribunal Act 2010. It deals with environmental protection, conservation of forests, and other natural resources.',
      difficulty: 'hard',
      points: 15,
      subject: 'Current Affairs',
      subtopic: 'Environment'
    }
  ];
}