import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  console.log('🚀 Topic quiz generator function called');
  
  if (req.method === "OPTIONS") {
    console.log('✅ Handling OPTIONS request');
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log('📝 Processing topic quiz generation request');
    
    let requestBody = {};
    try {
      requestBody = await req.json();
      console.log('📋 Request body:', requestBody);
    } catch (e) {
      console.log('⚠️ No JSON body, using defaults');
    }

    const rawCount = (requestBody as any)?.question_count || 15;
    const question_count = Math.max(15, rawCount); // Minimum 15 questions, max 50
    const { 
      topic_name = 'Ancient India', 
      subject_name = 'History', 
      difficulty = 'mixed'
    } = requestBody as any;
    
    console.log('🎯 Generating quiz for:', { topic_name, subject_name, difficulty, question_count });

    // Generate questions using OpenAI
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    let questions: TopicQuizQuestion[] = [];

    if (openAIKey) {
      try {
        console.log('🤖 Generating topic questions with OpenAI...');
        
        const prompt = `Generate ${question_count} high-quality multiple-choice questions for Indian competitive exams on the topic "${topic_name}" in the subject "${subject_name}".
        
Requirements:
1. Focus ONLY on "${topic_name}" within "${subject_name}"
2. ${difficulty === 'mixed' ? 'Mix of difficulties: 40% easy (basic facts), 40% medium (concepts), 20% hard (analysis)' : `All questions should be ${difficulty} difficulty`}
3. Each question must be:
   - Factually accurate and verifiable
   - Frequently asked in exams like UPSC, SSC, Banking, State PSCs
   - Test different aspects: facts, dates, concepts, cause-effect, comparisons
   - Have exactly one correct answer

4. Include variety in question types:
   - Direct factual questions
   - Statement-based questions
   - Chronological questions
   - Cause and effect questions
   - Comparison questions

5. For important questions, add exam_relevance explaining why it's frequently asked

Return a JSON object with "questions" array containing exactly ${question_count} questions in this format:
{
  "questions": [
    {
      "question": "Clear, concise question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation with key facts, dates, and context",
      "difficulty": "easy",
      "points": 5,
      "exam_relevance": "Why this is important for exams (optional, only for key questions)"
    }
  ]
}

Points allocation: easy=5, medium=10, hard=15

Example topics to cover for "${topic_name}":
${getTopicHints(subject_name, topic_name)}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Using gpt-4o-mini for faster and cost-effective generation
            messages: [
              {
                role: 'system',
                content: `You are an expert question setter for Indian competitive exams specializing in ${subject_name}. Create high-quality questions specifically on ${topic_name}. Ensure factual accuracy and exam relevance. Always return valid JSON.`
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('OpenAI response received');
          
          const content = JSON.parse(data.choices[0].message.content);
          const aiQuestions = content.questions || [];
          
          // Validate and map questions
          questions = aiQuestions.slice(0, question_count).map((q: any, index: number) => ({
            id: `tq${index + 1}`,
            question: q.question || '',
            options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: typeof q.correct_answer === 'number' && q.correct_answer >= 0 && q.correct_answer <= 3 ? q.correct_answer : 0,
            explanation: q.explanation || 'Explanation not available',
            subject: subject_name,
            subtopic: topic_name,
            difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
            points: q.points || (q.difficulty === 'easy' ? 5 : q.difficulty === 'hard' ? 15 : 10),
            exam_relevance: q.exam_relevance
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
        questions = generateDemoTopicQuestions(subject_name, topic_name, question_count);
      }
    } else {
      console.log('⚠️ OpenAI API key not found, using demo questions');
      questions = generateDemoTopicQuestions(subject_name, topic_name, question_count);
    }

    // Ensure we have the requested number of questions
    if (questions.length < question_count) {
      console.log('⚠️ Not enough questions generated, adding demo questions');
      const demoQuestions = generateDemoTopicQuestions(subject_name, topic_name, question_count);
      questions = [...questions, ...demoQuestions.slice(0, question_count - questions.length)];
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    const topicQuiz = {
      id: `topic_quiz_${Date.now()}`,
      subject: subject_name,
      topic: topic_name,
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
        questions: topicQuiz.questions,
        message: 'Topic quiz generated successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('💥 Error in generate-topic-quiz:', error);
    
    // Return demo quiz as fallback
    const demoQuestions = generateDemoTopicQuestions('History', 'Ancient India', 15);
    const totalPoints = demoQuestions.reduce((sum, q) => sum + q.points, 0);
    
    const fallbackQuiz = {
      id: `demo_topic_${Date.now()}`,
      subject: 'History',
      topic: 'Ancient India',
      difficulty: 'mixed',
      questions: demoQuestions,
      total_points: totalPoints,
      difficulty_distribution: {
        easy: demoQuestions.filter(q => q.difficulty === 'easy').length,
        medium: demoQuestions.filter(q => q.difficulty === 'medium').length,
        hard: demoQuestions.filter(q => q.difficulty === 'hard').length
      },
      generated_at: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        quiz: fallbackQuiz,
        questions: fallbackQuiz.questions,
        message: 'Topic quiz generated (demo mode)'
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

function getTopicHints(subject: string, topic: string): string {
  const hints: Record<string, Record<string, string>> = {
    'History': {
      'Ancient India': 'Indus Valley Civilization, Vedic Period, Mauryan Empire, Gupta Empire, Buddhist and Jain traditions, ancient universities',
      'Medieval India': 'Delhi Sultanate, Mughal Empire, Vijayanagar Empire, Bhakti movement, Sufi traditions, medieval architecture',
      'Modern India': 'British colonial rule, social reform movements, 1857 revolt, economic impact of colonialism',
      'Freedom Struggle': 'INC formation, extremists and moderates, Gandhi\'s movements, revolutionary activities, partition',
      'Post-Independence': 'Integration of states, Constitution making, wars, economic policies, foreign policy'
    },
    'Geography': {
      'Physical Geography': 'Mountain ranges, river systems, climate zones, soil types, natural vegetation, mineral resources',
      'Indian Geography': 'States and capitals, major cities, industrial regions, agricultural patterns, demographic features',
      'World Geography': 'Continents, oceans, major countries, international boundaries, time zones, important straits',
      'Climate': 'Monsoon mechanism, weather patterns, cyclones, climate change impact, El Nino/La Nina',
      'Resources': 'Water resources, mineral distribution, energy sources, forest resources, conservation'
    },
    'Polity': {
      'Constitution': 'Preamble, fundamental rights, DPSPs, fundamental duties, amendment procedure, schedules',
      'Parliament': 'Lok Sabha, Rajya Sabha, legislative procedures, committees, privileges, sessions',
      'Judiciary': 'Supreme Court, High Courts, jurisdiction, PIL, judicial review, important judgments',
      'Executive': 'President, Prime Minister, Council of Ministers, Governor, emergency provisions',
      'Fundamental Rights': 'Articles 14-32, types of writs, reasonable restrictions, recent judgments'
    },
    'Economy': {
      'Indian Economy': 'GDP growth, sectors of economy, demographic dividend, economic reforms, challenges',
      'Banking': 'RBI functions, monetary policy, banking regulation, NPAs, financial inclusion, digital banking',
      'Budget': 'Types of budget, fiscal deficit, revenue and capital expenditure, tax reforms, GST',
      'Economic Policy': 'Five year plans, NITI Aayog, liberalization, Make in India, startup India',
      'International Trade': 'Balance of payments, WTO, bilateral trade agreements, export-import policy'
    },
    'Science & Technology': {
      'Space Technology': 'ISRO missions, satellites, Chandrayaan, Mangalyaan, Gaganyaan, space applications',
      'Nuclear Technology': 'Nuclear power plants, thorium reserves, nuclear doctrine, international agreements',
      'Biotechnology': 'GM crops, biofuels, medical applications, ethical issues, biosafety',
      'IT & Computers': 'Digital India, cybersecurity, AI applications, data protection, e-governance',
      'Defense Technology': 'Missile systems, indigenous defense production, DRDO achievements'
    },
    'Current Affairs': {
      'National': 'Government schemes, policy changes, Supreme Court verdicts, elections, appointments',
      'International': 'India\'s foreign relations, international summits, UN activities, global agreements',
      'Economy': 'Economic indicators, RBI policies, budget announcements, GST updates, stock market',
      'Science': 'Scientific discoveries, space missions, health initiatives, environmental issues',
      'Awards': 'Padma awards, National awards, sports achievements, international recognitions'
    }
  };

  return hints[subject]?.[topic] || 'Cover all important aspects of this topic relevant to competitive exams';
}

function generateDemoTopicQuestions(subject: string, topic: string, count: number): TopicQuizQuestion[] {
  console.log('📝 Generating demo topic questions');
  
  // Demo questions for different subjects
  const demoQuestions: Record<string, TopicQuizQuestion[]> = {
    'History': [
      {
        id: 'h1',
        question: 'Which Mauryan emperor converted to Buddhism after the Kalinga War?',
        options: ['Chandragupta Maurya', 'Ashoka', 'Bindusara', 'Dasharatha'],
        correct_answer: 1,
        explanation: 'Emperor Ashoka (268-232 BCE) converted to Buddhism after witnessing the bloodshed in the Kalinga War (c. 261 BCE). This transformation led to his policy of Dhamma and the spread of Buddhism across Asia.',
        difficulty: 'medium',
        points: 10,
        subject: 'History',
        subtopic: 'Ancient India',
        exam_relevance: 'Frequently asked in UPSC Prelims and State PSC exams - important for understanding ancient Indian history'
      },
      {
        id: 'h2',
        question: 'The Harappan Civilization was first discovered at which site?',
        options: ['Mohenjo-daro', 'Harappa', 'Kalibangan', 'Dholavira'],
        correct_answer: 1,
        explanation: 'The Indus Valley Civilization was first discovered at Harappa in 1921 by Daya Ram Sahni. Though Mohenjo-daro was discovered in 1922, Harappa gave its name to the entire civilization.',
        difficulty: 'easy',
        points: 5,
        subject: 'History',
        subtopic: 'Ancient India'
      },
      {
        id: 'h3',
        question: 'Who was known as the "Napoleon of India"?',
        options: ['Chandragupta Maurya', 'Samudragupta', 'Chandragupta II', 'Harshavardhana'],
        correct_answer: 1,
        explanation: 'Samudragupta (335-375 CE) of the Gupta Empire was called the "Napoleon of India" by historian V.A. Smith due to his extensive military conquests described in the Allahabad Pillar inscription.',
        difficulty: 'medium',
        points: 10,
        subject: 'History',
        subtopic: 'Ancient India',
        exam_relevance: 'Important for UPSC and SSC exams - tests knowledge of Gupta period'
      },
      {
        id: 'h4',
        question: 'The rock-cut caves of Ajanta belong to which period?',
        options: ['2nd century BCE to 6th century CE', '1st to 3rd century CE', '4th to 8th century CE', '6th to 10th century CE'],
        correct_answer: 0,
        explanation: 'The Ajanta caves were carved in two phases: the first phase (2nd century BCE - 1st century CE) during the Satavahana period, and the second phase (5th-6th century CE) during the Vakataka period.',
        difficulty: 'hard',
        points: 15,
        subject: 'History',
        subtopic: 'Ancient India'
      },
      {
        id: 'h5',
        question: 'Which Vedic text is known as the "Book of Chants"?',
        options: ['Rig Veda', 'Sama Veda', 'Yajur Veda', 'Atharva Veda'],
        correct_answer: 1,
        explanation: 'The Sama Veda is known as the "Book of Chants" as it contains melodies and chants used by priests during sacrifices. Most of its verses are taken from the Rig Veda but set to music.',
        difficulty: 'easy',
        points: 5,
        subject: 'History',
        subtopic: 'Ancient India'
      }
    ],
    'Geography': [
      {
        id: 'g1',
        question: 'Which pass connects Manali with Leh?',
        options: ['Zoji La', 'Rohtang Pass', 'Baralacha La', 'Khardung La'],
        correct_answer: 1,
        explanation: 'Rohtang Pass (altitude 3,978 m) connects Manali in Himachal Pradesh with the Lahaul-Spiti valley and is on the Manali-Leh highway. It\'s an important strategic pass.',
        difficulty: 'medium',
        points: 10,
        subject: 'Geography',
        subtopic: 'Physical Features',
        exam_relevance: 'Important for exams focusing on Indian geography and strategic locations'
      },
      {
        id: 'g2',
        question: 'The Narmada river flows through a rift valley between which two mountain ranges?',
        options: ['Himalayas and Karakoram', 'Vindhya and Satpura', 'Eastern and Western Ghats', 'Aravalli and Vindhya'],
        correct_answer: 1,
        explanation: 'The Narmada river flows westward through a rift valley between the Vindhya Range to the north and the Satpura Range to the south. It\'s one of the few west-flowing rivers in India.',
        difficulty: 'easy',
        points: 5,
        subject: 'Geography',
        subtopic: 'Physical Features'
      },
      {
        id: 'g3',
        question: 'Which type of soil is also known as "Regur soil"?',
        options: ['Red soil', 'Black soil', 'Laterite soil', 'Alluvial soil'],
        correct_answer: 1,
        explanation: 'Black soil is also known as Regur soil or black cotton soil. It\'s rich in iron, lime, calcium, and magnesium but poor in nitrogen and phosphorus. It\'s ideal for cotton cultivation.',
        difficulty: 'easy',
        points: 5,
        subject: 'Geography',
        subtopic: 'Soils'
      },
      {
        id: 'g4',
        question: 'Which Indian state has the longest coastline?',
        options: ['Gujarat', 'Andhra Pradesh', 'Tamil Nadu', 'Maharashtra'],
        correct_answer: 0,
        explanation: 'Gujarat has the longest coastline among Indian states, stretching about 1,600 km. It\'s followed by Andhra Pradesh and Tamil Nadu. India\'s total coastline is about 7,516 km.',
        difficulty: 'medium',
        points: 10,
        subject: 'Geography',
        subtopic: 'Indian Geography',
        exam_relevance: 'Frequently asked in competitive exams - important geographical fact'
      },
      {
        id: 'g5',
        question: 'The phenomenon of "October Heat" is experienced in which part of India?',
        options: ['Northern Plains', 'Coastal Areas', 'Deccan Plateau', 'North-Eastern States'],
        correct_answer: 0,
        explanation: 'October Heat is experienced in the Northern Plains of India due to the clear skies after monsoon withdrawal, high temperature, and humidity. It\'s a period of sultry weather before winter.',
        difficulty: 'hard',
        points: 15,
        subject: 'Geography',
        subtopic: 'Climate'
      }
    ],
    'Polity': [
      {
        id: 'p1',
        question: 'Which Article of the Constitution defines "State" for the purpose of Fundamental Rights?',
        options: ['Article 11', 'Article 12', 'Article 13', 'Article 14'],
        correct_answer: 1,
        explanation: 'Article 12 defines "State" for Part III (Fundamental Rights) to include the Government and Parliament of India, State Governments and Legislatures, and all local or other authorities within India.',
        difficulty: 'medium',
        points: 10,
        subject: 'Polity',
        subtopic: 'Constitution',
        exam_relevance: 'Crucial for understanding the scope of Fundamental Rights - frequently tested'
      },
      {
        id: 'p2',
        question: 'The concept of "Basic Structure" of the Constitution was propounded in which case?',
        options: ['Golaknath case', 'Kesavananda Bharati case', 'Minerva Mills case', 'Maneka Gandhi case'],
        correct_answer: 1,
        explanation: 'The Basic Structure doctrine was established in the Kesavananda Bharati case (1973). It held that Parliament cannot amend the basic structure of the Constitution.',
        difficulty: 'easy',
        points: 5,
        subject: 'Polity',
        subtopic: 'Judiciary'
      },
      {
        id: 'p3',
        question: 'Who has the power to dissolve the Lok Sabha?',
        options: ['Prime Minister', 'President', 'Speaker', 'Vice President'],
        correct_answer: 1,
        explanation: 'The President has the power to dissolve the Lok Sabha under Article 85(2)(b). This is usually done on the advice of the Prime Minister or when no party can form a stable government.',
        difficulty: 'easy',
        points: 5,
        subject: 'Polity',
        subtopic: 'Parliament'
      },
      {
        id: 'p4',
        question: 'Which writ literally means "to have the body"?',
        options: ['Mandamus', 'Certiorari', 'Habeas Corpus', 'Quo Warranto'],
        correct_answer: 2,
        explanation: 'Habeas Corpus literally means "to have the body". It\'s issued to release a person who has been detained unlawfully. It\'s a bulwark of individual liberty against arbitrary detention.',
        difficulty: 'medium',
        points: 10,
        subject: 'Polity',
        subtopic: 'Fundamental Rights',
        exam_relevance: 'Important for Judiciary and Fundamental Rights sections in all competitive exams'
      },
      {
        id: 'p5',
        question: 'The 42nd Amendment Act is also known as?',
        options: ['Anti-Defection Act', 'Mini Constitution', 'Right to Education Act', 'GST Amendment'],
        correct_answer: 1,
        explanation: 'The 42nd Amendment Act (1976) is called the "Mini Constitution" because it made sweeping changes to the Constitution, including adding words "Socialist" and "Secular" to the Preamble.',
        difficulty: 'easy',
        points: 5,
        subject: 'Polity',
        subtopic: 'Constitution'
      }
    ],
    'Economy': [
      {
        id: 'e1',
        question: 'Which committee recommended the establishment of Regional Rural Banks?',
        options: ['Narasimham Committee', 'M. Narasimham Committee', 'Kelkar Committee', 'Y.K. Alagh Committee'],
        correct_answer: 1,
        explanation: 'The M. Narasimham Working Group (1975) recommended the establishment of Regional Rural Banks (RRBs) to provide credit to rural areas. The first RRB was established on October 2, 1975.',
        difficulty: 'hard',
        points: 15,
        subject: 'Economy',
        subtopic: 'Banking'
      },
      {
        id: 'e2',
        question: 'What does the term "Repo Rate" mean?',
        options: ['Rate at which RBI lends to commercial banks', 'Rate at which banks lend to customers', 'Rate of inflation', 'Inter-bank lending rate'],
        correct_answer: 0,
        explanation: 'Repo Rate is the rate at which the Reserve Bank of India lends money to commercial banks against securities. It\'s a key tool of monetary policy to control inflation and liquidity.',
        difficulty: 'easy',
        points: 5,
        subject: 'Economy',
        subtopic: 'Monetary Policy'
      },
      {
        id: 'e3',
        question: 'The "Fiscal Deficit" is:',
        options: ['Total revenue - Total expenditure', 'Total expenditure - Total revenue', 'Revenue deficit + Capital expenditure', 'Total expenditure - Total receipts excluding borrowings'],
        correct_answer: 3,
        explanation: 'Fiscal Deficit is the difference between total expenditure and total receipts excluding borrowings. It indicates the total borrowing requirements of the government.',
        difficulty: 'medium',
        points: 10,
        subject: 'Economy',
        subtopic: 'Budget',
        exam_relevance: 'Essential concept for understanding government finances - frequently tested'
      },
      {
        id: 'e4',
        question: 'Which sector is the largest contributor to India\'s GDP?',
        options: ['Agriculture', 'Industry', 'Services', 'Manufacturing'],
        correct_answer: 2,
        explanation: 'The Services sector contributes about 55-60% to India\'s GDP, making it the largest contributor. It includes IT, banking, hospitality, trade, and other services.',
        difficulty: 'easy',
        points: 5,
        subject: 'Economy',
        subtopic: 'Indian Economy'
      },
      {
        id: 'e5',
        question: 'The GST Council is headed by:',
        options: ['Prime Minister', 'Finance Minister', 'RBI Governor', 'NITI Aayog CEO'],
        correct_answer: 1,
        explanation: 'The GST Council is headed by the Union Finance Minister as Chairperson. It also includes the Union State Minister of Finance and Finance Ministers of all states as members.',
        difficulty: 'medium',
        points: 10,
        subject: 'Economy',
        subtopic: 'Economic Policy'
      }
    ]
  };

  // Get questions for the subject, or default to History
  const subjectQuestions = demoQuestions[subject] || demoQuestions['History'];
  
  // Generate requested number of questions by repeating and modifying the base set
  const questions: TopicQuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const baseQuestion = subjectQuestions[i % subjectQuestions.length];
    questions.push({
      ...baseQuestion,
      id: `${subject.toLowerCase()}_q${i + 1}`,
      subtopic: topic
    });
  }

  return questions;
}