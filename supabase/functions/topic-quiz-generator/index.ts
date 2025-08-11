import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TopicQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exam_relevance?: string;
}

Deno.serve(async (req: Request) => {
  console.log('🎯 Topic quiz generator function called');
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let requestBody = {};
    try {
      requestBody = await req.json();
    } catch (e) {
      console.log('⚠️ No JSON body, using defaults');
    }

    const {
      topic_name = 'Indian Constitution',
      subject_name = 'Polity',
      difficulty = 'mixed',
      question_count = 15
    } = requestBody as any;

    // Ensure minimum 15 questions
    const finalQuestionCount = Math.max(15, question_count);
    
    console.log('🎯 Generating topic quiz:', { topic_name, subject_name, difficulty, question_count: finalQuestionCount });

    // Generate questions using AI
    const questions = await generateTopicQuizWithAI(topic_name, subject_name, difficulty, finalQuestionCount);
    
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    const topicQuiz = {
      id: `topic_quiz_${Date.now()}`,
      topic: topic_name,
      subject: subject_name,
      difficulty,
      questions,
      total_points: totalPoints,
      difficulty_distribution: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length
      },
      generated_at: new Date().toISOString()
    };

    console.log('🎉 Topic quiz generated successfully');
    console.log('📈 Questions count:', questions.length);
    console.log('📊 Difficulty distribution:', topicQuiz.difficulty_distribution);

    return new Response(
      JSON.stringify({
        success: true,
        quiz: topicQuiz,
        questions: questions,
        message: 'Topic quiz generated successfully with AI'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('💥 Error in topic quiz generator:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate topic quiz',
        message: 'Topic quiz generation failed'
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

async function generateTopicQuizWithAI(topicName: string, subjectName: string, difficulty: string, questionCount: number): Promise<TopicQuizQuestion[]> {
  const claudeApiKey = Deno.env.get('CLAUDE_API_KEY');
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!claudeApiKey && !openaiApiKey) {
    throw new Error('No AI API keys configured');
  }

  // Universal prompt template for any topic
  const universalPrompt = `Generate exactly ${questionCount} high-quality multiple-choice questions specifically about "${topicName}" in the subject "${subjectName}" for Indian competitive exam preparation.

TOPIC FOCUS: "${topicName}"
SUBJECT: "${subjectName}"
DIFFICULTY: ${difficulty === 'mixed' ? 'Mixed (40% easy, 40% medium, 20% hard)' : `All ${difficulty}`}

REQUIREMENTS:
1. ALL questions must be directly related to "${topicName}" - no generic ${subjectName} questions
2. Focus on facts, concepts, and details specifically about "${topicName}"
3. Include specific dates, names, events, and numbers related to "${topicName}"
4. Questions should be frequently asked in Indian competitive exams
5. Cover different aspects of "${topicName}": facts, chronology, significance, related personalities

QUESTION TYPES for "${topicName}":
- Direct factual questions about "${topicName}"
- Chronological questions related to "${topicName}"
- Questions about personalities associated with "${topicName}"
- Questions about significance/impact of "${topicName}"
- Comparative questions involving "${topicName}"

EXAM FOCUS:
- UPSC Civil Services (Prelims & Mains relevant)
- SSC Combined Graduate Level
- Banking (IBPS, SBI) where applicable
- State Public Service Commissions
- Railway and other government exams

${getTopicSpecificGuidelines(topicName, subjectName)}

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "Specific question about ${topicName}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation with context about ${topicName}",
      "subject": "${subjectName}",
      "subtopic": "${topicName}",
      "difficulty": "easy|medium|hard",
      "points": 5,
      "exam_relevance": "Why this ${topicName} question is important for exams"
    }
  ]
}

Points: easy=5, medium=10, hard=15`;

  // Try Claude first (better for Indian content)
  if (claudeApiKey) {
    try {
      console.log('🤖 Generating topic questions with Claude...');
      return await generateWithClaude(universalPrompt, claudeApiKey, questionCount);
    } catch (claudeError) {
      console.log('⚠️ Claude failed, trying OpenAI:', claudeError.message);
    }
  }

  // Fallback to OpenAI
  if (openaiApiKey) {
    try {
      console.log('🤖 Generating topic questions with OpenAI...');
      return await generateWithOpenAI(universalPrompt, openaiApiKey, questionCount);
    } catch (openaiError) {
      console.log('⚠️ OpenAI failed:', openaiError.message);
    }
  }

  throw new Error('All AI providers failed for topic quiz generation');
}

async function generateWithClaude(prompt: string, apiKey: string, questionCount: number): Promise<TopicQuizQuestion[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an expert in Indian competitive exams and education. ${prompt}`
        }
      ]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const claudeResponse = await response.json();
  const content = JSON.parse(claudeResponse.content[0].text);
  
  return validateAndFormatQuestions(content.questions, questionCount);
}

async function generateWithOpenAI(prompt: string, apiKey: string, questionCount: number): Promise<TopicQuizQuestion[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Indian competitive exams and education with deep knowledge of UPSC, SSC, Banking, and State PCS patterns.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const aiResponse = await response.json();
  const content = JSON.parse(aiResponse.choices[0].message.content);
  
  return validateAndFormatQuestions(content.questions, questionCount);
}

function validateAndFormatQuestions(questions: any[], expectedCount: number): TopicQuizQuestion[] {
  if (!Array.isArray(questions)) {
    throw new Error('Invalid questions format from AI');
  }

  const validatedQuestions = questions.slice(0, expectedCount).map((q: any, index: number) => ({
    id: `tq${index + 1}`,
    question: q.question || `Question ${index + 1}`,
    options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer: typeof q.correct_answer === 'number' && q.correct_answer >= 0 && q.correct_answer <= 3 ? q.correct_answer : 0,
    explanation: q.explanation || 'Explanation not available',
    subject: q.subject || 'General',
    subtopic: q.subtopic || 'General',
    difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    points: q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10,
    exam_relevance: q.exam_relevance
  }));

  if (validatedQuestions.length < expectedCount) {
    throw new Error(`Generated only ${validatedQuestions.length} questions, expected ${expectedCount}`);
  }

  return validatedQuestions;
}

function getTopicSpecificGuidelines(topicName: string, subjectName: string): string {
  const guidelines: Record<string, Record<string, string>> = {
    'History': {
      'Bhagat Singh': `
SPECIFIC FOCUS for Bhagat Singh:
- Birth date, place, family background
- Association with HSRA (Hindustan Socialist Republican Association)
- Assembly bombing incident with Batukeshwar Dutt
- Jail experiences and hunger strikes
- Execution date and companions (Rajguru, Sukhdev)
- Revolutionary philosophy and writings
- Impact on freedom movement`,
      
      'Chandrashekhar Azad': `
SPECIFIC FOCUS for Chandrashekhar Azad:
- Real name (Chandrashekhar Tiwari)
- Role in Kakori Conspiracy
- Leadership of HSRA
- Mentorship of young revolutionaries
- Death at Alfred Park, Allahabad
- Revolutionary activities and philosophy`,
      
      'Article 370': `
SPECIFIC FOCUS for Article 370:
- Original provisions and special status
- Temporary nature and conditions
- Powers granted to J&K
- Related Article 35A
- Abrogation in August 2019
- Constitutional and political implications
- Supreme Court cases and judgments`
    },
    'Polity': {
      'Fundamental Rights': `
SPECIFIC FOCUS for Fundamental Rights:
- Articles 12-35 details
- Six fundamental rights after 44th Amendment
- Reasonable restrictions
- Writs and their types
- Landmark Supreme Court cases
- Conflicts with DPSP`,
      
      'Constitution': `
SPECIFIC FOCUS for Constitution:
- Drafting committee and key personalities
- Salient features and sources
- Parts, schedules, and articles
- Amendment procedures
- Landmark amendments and their impact`
    },
    'Geography': {
      'Indian Rivers': `
SPECIFIC FOCUS for Indian Rivers:
- Major river systems and tributaries
- Origin points and drainage patterns
- Economic importance and irrigation
- River linking projects
- Interstate water disputes`,
      
      'Physical Features': `
SPECIFIC FOCUS for Physical Features:
- Mountain ranges and peaks
- Plateaus and plains
- Coastal features and islands
- Climate zones and monsoons`
    }
  };

  const subjectGuidelines = guidelines[subjectName];
  if (subjectGuidelines && subjectGuidelines[topicName]) {
    return subjectGuidelines[topicName];
  }

  return `
GENERAL FOCUS for "${topicName}":
- Key facts and definitions related to "${topicName}"
- Historical context and significance of "${topicName}"
- Current relevance and applications of "${topicName}"
- Related personalities, dates, and events
- Exam-important aspects of "${topicName}"`;
}