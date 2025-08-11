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

// Comprehensive Indian exam-focused question bank
const getIndianExamQuestions = (): DailyQuizQuestion[] => {
  return [
    // History Questions
    {
      id: "hist1",
      question: "Who founded the Mauryan Empire?",
      options: ["Chandragupta Maurya", "Ashoka", "Bindusara", "Kautilya"],
      correct_answer: 0,
      explanation: "Chandragupta Maurya founded the Mauryan Empire in 321 BCE with the help of Kautilya (Chanakya).",
      subject: "History",
      subtopic: "Ancient India",
      difficulty: "easy",
      points: 5
    },
    {
      id: "hist2",
      question: "In which year did the Jallianwala Bagh massacre take place?",
      options: ["1918", "1919", "1920", "1921"],
      correct_answer: 1,
      explanation: "The Jallianwala Bagh massacre occurred on April 13, 1919, in Amritsar, Punjab.",
      subject: "History",
      subtopic: "Freedom Movement",
      difficulty: "medium",
      points: 10
    },
    {
      id: "hist3",
      question: "Who was known as the 'Iron Man of India'?",
      options: ["Jawaharlal Nehru", "Sardar Vallabhbhai Patel", "Subhas Chandra Bose", "Bhagat Singh"],
      correct_answer: 1,
      explanation: "Sardar Vallabhbhai Patel was known as the 'Iron Man of India' for his role in uniting the princely states.",
      subject: "History",
      subtopic: "Freedom Fighters",
      difficulty: "easy",
      points: 5
    },
    {
      id: "hist4",
      question: "At what age was Bhagat Singh executed?",
      options: ["21", "22", "23", "24"],
      correct_answer: 2,
      explanation: "Bhagat Singh was executed at the young age of 23 on March 23, 1931, along with Rajguru and Sukhdev.",
      subject: "History",
      subtopic: "Freedom Fighters",
      difficulty: "medium",
      points: 10
    },
    
    // Constitution & Polity Questions
    {
      id: "pol1",
      question: "Which article of the Indian Constitution was related to Jammu and Kashmir's special status?",
      options: ["Article 356", "Article 370", "Article 371", "Article 372"],
      correct_answer: 1,
      explanation: "Article 370 granted special autonomous status to Jammu and Kashmir, which was abrogated in August 2019.",
      subject: "Polity",
      subtopic: "Constitutional Provisions",
      difficulty: "medium",
      points: 10
    },
    {
      id: "pol2",
      question: "How many fundamental rights are guaranteed by the Indian Constitution?",
      options: ["5", "6", "7", "8"],
      correct_answer: 1,
      explanation: "The Indian Constitution guarantees 6 fundamental rights after the 44th Amendment removed the Right to Property.",
      subject: "Polity",
      subtopic: "Fundamental Rights",
      difficulty: "medium",
      points: 10
    },
    {
      id: "pol3",
      question: "Who is known as the 'Father of the Indian Constitution'?",
      options: ["Mahatma Gandhi", "Dr. B.R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"],
      correct_answer: 1,
      explanation: "Dr. B.R. Ambedkar is known as the 'Father of the Indian Constitution' for his role as chairman of the drafting committee.",
      subject: "Polity",
      subtopic: "Constitutional History",
      difficulty: "easy",
      points: 5
    },
    {
      id: "pol4",
      question: "Which amendment is known as the 'Mini Constitution'?",
      options: ["42nd Amendment", "44th Amendment", "52nd Amendment", "73rd Amendment"],
      correct_answer: 0,
      explanation: "The 42nd Amendment (1976) is called the 'Mini Constitution' due to its extensive changes to the Constitution.",
      subject: "Polity",
      subtopic: "Constitutional Amendments",
      difficulty: "hard",
      points: 15
    },

    // Geography Questions
    {
      id: "geo1",
      question: "Which is the highest peak in India?",
      options: ["K2", "Kanchenjunga", "Nanda Devi", "Mount Everest"],
      correct_answer: 1,
      explanation: "Kanchenjunga (8,586m) is the highest peak entirely within India, located on the India-Nepal border.",
      subject: "Geography",
      subtopic: "Physical Features",
      difficulty: "medium",
      points: 10
    },
    {
      id: "geo2",
      question: "Which state in India has the longest coastline?",
      options: ["Tamil Nadu", "Gujarat", "Andhra Pradesh", "Maharashtra"],
      correct_answer: 1,
      explanation: "Gujarat has the longest coastline in India, stretching approximately 1,600 kilometers.",
      subject: "Geography",
      subtopic: "Coastal Geography",
      difficulty: "medium",
      points: 10
    },
    {
      id: "geo3",
      question: "The Tropic of Cancer passes through how many Indian states?",
      options: ["6", "7", "8", "9"],
      correct_answer: 2,
      explanation: "The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
      subject: "Geography",
      subtopic: "Astronomical Geography",
      difficulty: "hard",
      points: 15
    },

    // Economy Questions
    {
      id: "eco1",
      question: "What is the current repo rate set by RBI (as of 2024)?",
      options: ["6.25%", "6.50%", "6.75%", "7.00%"],
      correct_answer: 1,
      explanation: "The Reserve Bank of India has maintained the repo rate at 6.50% to control inflation and support economic growth.",
      subject: "Economy",
      subtopic: "Monetary Policy",
      difficulty: "medium",
      points: 10
    },
    {
      id: "eco2",
      question: "Which organization publishes the Human Development Index (HDI)?",
      options: ["World Bank", "IMF", "UNDP", "WHO"],
      correct_answer: 2,
      explanation: "The United Nations Development Programme (UNDP) publishes the Human Development Index annually.",
      subject: "Economy",
      subtopic: "Development Indicators",
      difficulty: "medium",
      points: 10
    },

    // Science & Technology Questions
    {
      id: "sci1",
      question: "Which Indian space mission successfully landed on the Moon's south pole in 2023?",
      options: ["Chandrayaan-2", "Chandrayaan-3", "Mangalyaan", "Aditya L1"],
      correct_answer: 1,
      explanation: "Chandrayaan-3 successfully landed on the Moon's south pole in August 2023, making India the fourth country to achieve this feat.",
      subject: "Science & Technology",
      subtopic: "Space Missions",
      difficulty: "easy",
      points: 5
    },
    {
      id: "sci2",
      question: "What is the full form of ISRO?",
      options: ["Indian Space Research Organisation", "Indian Scientific Research Organisation", "Indian Space Research Office", "Indian Scientific Research Office"],
      correct_answer: 0,
      explanation: "ISRO stands for Indian Space Research Organisation, India's national space agency.",
      subject: "Science & Technology",
      subtopic: "Space Organizations",
      difficulty: "easy",
      points: 5
    },

    // Current Affairs Questions
    {
      id: "curr1",
      question: "Which country held the G20 presidency in 2023?",
      options: ["Indonesia", "India", "Brazil", "South Africa"],
      correct_answer: 1,
      explanation: "India held the G20 presidency in 2023 and hosted the G20 Summit in New Delhi in September 2023.",
      subject: "Current Affairs",
      subtopic: "International Relations",
      difficulty: "easy",
      points: 5
    },
    {
      id: "curr2",
      question: "What is the theme of India's G20 presidency 2023?",
      options: ["One Earth, One Family, One Future", "Building a Sustainable Future", "Unity in Diversity", "Global Partnership for Growth"],
      correct_answer: 0,
      explanation: "India's G20 presidency theme was 'Vasudhaiva Kutumbakam' - One Earth, One Family, One Future.",
      subject: "Current Affairs",
      subtopic: "International Relations",
      difficulty: "medium",
      points: 10
    },

    // Additional Important Questions
    {
      id: "misc1",
      question: "Who wrote the Indian National Anthem 'Jana Gana Mana'?",
      options: ["Bankim Chandra Chattopadhyay", "Rabindranath Tagore", "Sarojini Naidu", "Subramanya Bharathi"],
      correct_answer: 1,
      explanation: "Rabindranath Tagore wrote 'Jana Gana Mana', which was adopted as India's National Anthem in 1950.",
      subject: "History",
      subtopic: "National Symbols",
      difficulty: "easy",
      points: 5
    },
    {
      id: "misc2",
      question: "Which is the largest state in India by area?",
      options: ["Madhya Pradesh", "Uttar Pradesh", "Rajasthan", "Maharashtra"],
      correct_answer: 2,
      explanation: "Rajasthan is the largest state in India by area, covering 342,239 square kilometers.",
      subject: "Geography",
      subtopic: "Indian States",
      difficulty: "easy",
      points: 5
    },
    {
      id: "misc3",
      question: "What is the minimum age to become the Prime Minister of India?",
      options: ["25 years", "30 years", "35 years", "No minimum age"],
      correct_answer: 0,
      explanation: "The minimum age to become Prime Minister is 25 years, as one must be eligible to be a member of Lok Sabha.",
      subject: "Polity",
      subtopic: "Executive",
      difficulty: "medium",
      points: 10
    },
    {
      id: "misc4",
      question: "Which Indian scientist is known as the 'Missile Man of India'?",
      options: ["C.V. Raman", "A.P.J. Abdul Kalam", "Homi Bhabha", "Vikram Sarabhai"],
      correct_answer: 1,
      explanation: "Dr. A.P.J. Abdul Kalam is known as the 'Missile Man of India' for his work on ballistic missile and launch vehicle technology.",
      subject: "Science & Technology",
      subtopic: "Indian Scientists",
      difficulty: "easy",
      points: 5
    },

    // More Advanced Questions
    {
      id: "adv1",
      question: "Which article of the Constitution deals with the procedure for amendment?",
      options: ["Article 356", "Article 368", "Article 370", "Article 371"],
      correct_answer: 1,
      explanation: "Article 368 deals with the power of Parliament to amend the Constitution and the procedure thereof.",
      subject: "Polity",
      subtopic: "Constitutional Amendments",
      difficulty: "hard",
      points: 15
    },
    {
      id: "adv2",
      question: "Who was the first Indian to win a Nobel Prize?",
      options: ["C.V. Raman", "Rabindranath Tagore", "Mother Teresa", "Amartya Sen"],
      correct_answer: 1,
      explanation: "Rabindranath Tagore was the first Indian to win a Nobel Prize, receiving the Nobel Prize in Literature in 1913.",
      subject: "History",
      subtopic: "Achievements",
      difficulty: "medium",
      points: 10
    },
    {
      id: "adv3",
      question: "Which constitutional body conducts elections in India?",
      options: ["Supreme Court", "Election Commission", "Parliament", "President"],
      correct_answer: 1,
      explanation: "The Election Commission of India is the constitutional body responsible for conducting free and fair elections.",
      subject: "Polity",
      subtopic: "Constitutional Bodies",
      difficulty: "easy",
      points: 5
    },
    {
      id: "adv4",
      question: "What is the full form of NITI Aayog?",
      options: ["National Institution for Transforming India", "National Institute for Technology Innovation", "National Integration and Technology Initiative", "National Investment and Trade Initiative"],
      correct_answer: 0,
      explanation: "NITI Aayog stands for National Institution for Transforming India, which replaced the Planning Commission in 2015.",
      subject: "Economy",
      subtopic: "Government Institutions",
      difficulty: "medium",
      points: 10
    },

    // Freedom Fighters Focus
    {
      id: "ff1",
      question: "Bhagat Singh was associated with which revolutionary organization?",
      options: ["Anushilan Samiti", "Hindustan Socialist Republican Association", "Ghadar Party", "Azad Hind Fauj"],
      correct_answer: 1,
      explanation: "Bhagat Singh was a prominent member of the Hindustan Socialist Republican Association (HSRA).",
      subject: "History",
      subtopic: "Freedom Fighters",
      difficulty: "medium",
      points: 10
    },
    {
      id: "ff2",
      question: "Who threw a bomb in the Central Legislative Assembly along with Bhagat Singh?",
      options: ["Rajguru", "Sukhdev", "Batukeshwar Dutt", "Chandrashekhar Azad"],
      correct_answer: 2,
      explanation: "Batukeshwar Dutt threw bombs in the Central Legislative Assembly along with Bhagat Singh on April 8, 1929.",
      subject: "History",
      subtopic: "Freedom Fighters",
      difficulty: "hard",
      points: 15
    },

    // Current Affairs & Recent Developments
    {
      id: "curr3",
      question: "Which Indian city hosted the Chess Olympiad in 2022?",
      options: ["New Delhi", "Mumbai", "Chennai", "Bangalore"],
      correct_answer: 2,
      explanation: "Chennai hosted the 44th Chess Olympiad in 2022, marking the first time India hosted this prestigious event.",
      subject: "Current Affairs",
      subtopic: "Sports",
      difficulty: "medium",
      points: 10
    },
    {
      id: "curr4",
      question: "What is the name of India's digital payment system launched by NPCI?",
      options: ["IMPS", "UPI", "NEFT", "RTGS"],
      correct_answer: 1,
      explanation: "UPI (Unified Payments Interface) is India's instant real-time payment system developed by NPCI.",
      subject: "Economy",
      subtopic: "Digital India",
      difficulty: "easy",
      points: 5
    },

    // Science & Environment
    {
      id: "env1",
      question: "Which gas is primarily responsible for the greenhouse effect?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correct_answer: 2,
      explanation: "Carbon dioxide is the primary greenhouse gas responsible for global warming and climate change.",
      subject: "Science & Technology",
      subtopic: "Environment",
      difficulty: "easy",
      points: 5
    },
    {
      id: "env2",
      question: "What is the full form of CRISPR in biotechnology?",
      options: ["Clustered Regularly Interspaced Short Palindromic Repeats", "Cellular Research in Systematic Protein Regulation", "Controlled Replication in Systematic Protein Research", "Cellular Regulation in Systematic Protein Repeats"],
      correct_answer: 0,
      explanation: "CRISPR stands for Clustered Regularly Interspaced Short Palindromic Repeats, a gene-editing technology.",
      subject: "Science & Technology",
      subtopic: "Biotechnology",
      difficulty: "hard",
      points: 15
    }
  ];
};

// Function to select 10 questions for daily quiz with proper distribution
function selectDailyQuestions(allQuestions: DailyQuizQuestion[]): DailyQuizQuestion[] {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Use day of year as seed for consistent daily selection
  const shuffled = [...allQuestions].sort(() => {
    return Math.sin(dayOfYear * 9301 + allQuestions.indexOf(allQuestions[0]) * 49297) - 0.5;
  });
  
  // Ensure proper difficulty distribution: 4 easy, 4 medium, 2 hard
  const easy = shuffled.filter(q => q.difficulty === 'easy').slice(0, 4);
  const medium = shuffled.filter(q => q.difficulty === 'medium').slice(0, 4);
  const hard = shuffled.filter(q => q.difficulty === 'hard').slice(0, 2);
  
  const selectedQuestions = [...easy, ...medium, ...hard];
  
  // If we don't have enough questions in any category, fill from others
  while (selectedQuestions.length < 10) {
    const remaining = shuffled.filter(q => !selectedQuestions.includes(q));
    if (remaining.length > 0) {
      selectedQuestions.push(remaining[0]);
    } else {
      break;
    }
  }
  
  // Shuffle the final selection and assign new IDs
  return selectedQuestions.slice(0, 10).map((q, index) => ({
    ...q,
    id: `dq${index + 1}`
  }));
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
      console.error('❌ Error checking existing quiz:', checkError);
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

    // Get all available questions and select 10 for today
    const allQuestions = getIndianExamQuestions();
    const todayQuestions = selectDailyQuestions(allQuestions);
    
    console.log('📊 Selected questions for today:', todayQuestions.length);
    
    const totalPoints = todayQuestions.reduce((sum, q) => sum + q.points, 0);
    
    const dailyQuiz = {
      date: today,
      questions: todayQuestions,
      total_points: totalPoints,
      difficulty_distribution: {
        easy: todayQuestions.filter(q => q.difficulty === 'easy').length,
        medium: todayQuestions.filter(q => q.difficulty === 'medium').length,
        hard: todayQuestions.filter(q => q.difficulty === 'hard').length
      },
      subjects_covered: [...new Set(todayQuestions.map(q => q.subject))],
      generated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    };

    console.log('💾 Saving quiz to database...');

    // Save to database
    const { data: savedQuiz, error: saveError } = await supabase
      .from('daily_quizzes')
      .insert(dailyQuiz)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving quiz:', saveError);
      
      // Even if save fails, return the quiz data
      console.log('⚠️ Database save failed, returning quiz data anyway');
      return new Response(
        JSON.stringify({
          success: true,
          quiz: dailyQuiz,
          generation_method: 'curated_questions',
          message: 'Daily quiz generated successfully (save failed but quiz available)'
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
    console.log('📈 Questions count:', todayQuestions.length);
    console.log('📊 Subjects covered:', dailyQuiz.subjects_covered.join(', '));
    console.log('🎯 Difficulty distribution:', dailyQuiz.difficulty_distribution);

    return new Response(
      JSON.stringify({
        success: true,
        quiz: savedQuiz,
        generation_method: 'curated_questions',
        message: 'Daily quiz generated successfully with curated Indian exam questions'
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
    
    // Emergency fallback - return quiz without saving to database
    try {
      const today = new Date().toISOString().split('T')[0];
      const allQuestions = getIndianExamQuestions();
      const todayQuestions = selectDailyQuestions(allQuestions);
      
      const emergencyQuiz = {
        id: `emergency_${today}`,
        date: today,
        questions: todayQuestions,
        total_points: todayQuestions.reduce((sum, q) => sum + q.points, 0),
        difficulty_distribution: {
          easy: todayQuestions.filter(q => q.difficulty === 'easy').length,
          medium: todayQuestions.filter(q => q.difficulty === 'medium').length,
          hard: todayQuestions.filter(q => q.difficulty === 'hard').length
        },
        subjects_covered: [...new Set(todayQuestions.map(q => q.subject))],
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      console.log('🆘 Returning emergency quiz');
      
      return new Response(
        JSON.stringify({
          success: true,
          quiz: emergencyQuiz,
          generation_method: 'emergency_curated',
          message: 'Daily quiz generated using emergency curated questions'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    } catch (emergencyError) {
      console.error('💀 Emergency fallback failed:', emergencyError);
      
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