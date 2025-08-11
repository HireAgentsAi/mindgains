import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface AnalyzeContentRequest {
  content: string;
  method: string;
  subject?: string;
  contentType?: 'historical_period' | 'constitution' | 'geography' | 'science' | 'literature' | 'general';
  examFocus?: 'upsc' | 'ssc' | 'banking' | 'state_pcs' | 'neet' | 'jee' | 'general';
}

interface AdaptiveLearningContent {
  overview: string;
  contentType: string;
  examFocus: string;
  tabs: Array<{
    id: string;
    title: string;
    type: 'timeline' | 'list' | 'concepts' | 'articles' | 'rulers' | 'facts' | 'formulas' | 'points';
    content: any;
  }>;
  keyHighlights: string[];
  examTips: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { content, method, subject, contentType = 'general', examFocus = 'general' }: AnalyzeContentRequest = await req.json()

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Auto-detect content type and exam focus from the topic
    const detectedType = detectContentType(content)
    const detectedExam = detectExamFocus(content)
    
    const finalContentType = contentType !== 'general' ? contentType : detectedType
    const finalExamFocus = examFocus !== 'general' ? examFocus : detectedExam

    // Generate only Room of Clarity content first for faster initial load
    // Other rooms will be generated on-demand when user navigates to them
    const clarityContent = await generateClarityContent(content, finalContentType, finalExamFocus, subject);

    return new Response(
      JSON.stringify({
        success: true,
        content: clarityContent,
        missionId: generateMissionId(),
        detectedType: finalContentType,
        detectedExam: finalExamFocus,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error analyzing content:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze content' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateClarityContent(content: string, contentType: string, examFocus: string, subject?: string): Promise<AdaptiveLearningContent> {
  // Try Claude first for faster generation, fallback to OpenAI
  try {
    return await generateWithClaude(content, contentType, examFocus, subject);
  } catch (claudeError) {
    console.log('Claude failed, trying OpenAI:', claudeError);
    return await generateWithOpenAI(content, contentType, examFocus, subject);
  }
}

async function generateWithClaude(content: string, contentType: string, examFocus: string, subject?: string): Promise<AdaptiveLearningContent> {
  const claudeApiKey = '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';
  
  const smartPrompt = generateSmartPrompt(content, contentType, examFocus, subject);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': claudeApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307', // Fastest Claude model
      max_tokens: 3000,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: `${smartPrompt.systemPrompt}\n\n${smartPrompt.userPrompt}`
        }
      ]
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const claudeResponse = await response.json();
  return JSON.parse(claudeResponse.content[0].text);
}

async function generateWithOpenAI(content: string, contentType: string, examFocus: string, subject?: string): Promise<AdaptiveLearningContent> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const smartPrompt = generateSmartPrompt(content, contentType, examFocus, subject);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // Faster than GPT-4
      messages: [
        {
          role: 'system',
          content: smartPrompt.systemPrompt
        },
        {
          role: 'user',
          content: smartPrompt.userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const aiResponse = await response.json();
  return JSON.parse(aiResponse.choices[0].message.content);
}

function detectContentType(content: string): string {
  const contentLower = content.toLowerCase()
  
  // Historical periods
  if (contentLower.includes('sultanate') || contentLower.includes('empire') || 
      contentLower.includes('dynasty') || contentLower.includes('mughal') ||
      contentLower.includes('gupta') || contentLower.includes('maurya') ||
      contentLower.includes('chola') || contentLower.includes('vijayanagara')) {
    return 'historical_period'
  }
  
  // Constitution
  if (contentLower.includes('constitution') || contentLower.includes('article') ||
      contentLower.includes('fundamental rights') || contentLower.includes('dpsp') ||
      contentLower.includes('amendment') || contentLower.includes('preamble')) {
    return 'constitution'
  }
  
  // Geography
  if (contentLower.includes('river') || contentLower.includes('mountain') ||
      contentLower.includes('climate') || contentLower.includes('mineral') ||
      contentLower.includes('geography') || contentLower.includes('plateau')) {
    return 'geography'
  }
  
  // Science
  if (contentLower.includes('photosynthesis') || contentLower.includes('physics') ||
      contentLower.includes('chemistry') || contentLower.includes('biology') ||
      contentLower.includes('formula') || contentLower.includes('equation') ||
      contentLower.includes('atom') || contentLower.includes('cell')) {
    return 'science'
  }
  
  return 'general'
}

function detectExamFocus(content: string): string {
  const contentLower = content.toLowerCase()
  
  if (contentLower.includes('upsc') || contentLower.includes('civil service') ||
      contentLower.includes('ias') || contentLower.includes('ips')) {
    return 'upsc'
  }
  
  if (contentLower.includes('ssc') || contentLower.includes('staff selection')) {
    return 'ssc'
  }
  
  if (contentLower.includes('bank') || contentLower.includes('ibps') ||
      contentLower.includes('sbi') || contentLower.includes('rbi')) {
    return 'banking'
  }
  
  if (contentLower.includes('neet') || contentLower.includes('medical')) {
    return 'neet'
  }
  
  if (contentLower.includes('jee') || contentLower.includes('engineering')) {
    return 'jee'
  }
  
  return 'upsc' // Default to UPSC for Indian competitive exams
}

function generateSmartPrompt(content: string, contentType: string, examFocus: string, subject?: string) {
  const baseSystemPrompt = `You are Twizzle, an AI study buddy specialized in Indian competitive exams. Create adaptive, exam-focused learning content that's concise yet comprehensive. Always structure content in tabs based on the topic type.`

  const contentTypePrompts = {
    historical_period: {
      system: `${baseSystemPrompt} For historical periods, focus on rulers, timeline, key events, and exam-important facts. Structure content with tabs like: Rulers & Dynasties, Timeline, Key Events, Important Facts, Exam Points.`,
      structure: `{
        "overview": "Brief 2-3 line overview",
        "contentType": "historical_period",
        "examFocus": "${examFocus}",
        "tabs": [
          {
            "id": "rulers",
            "title": "Rulers & Dynasties",
            "type": "rulers",
            "content": [
              {
                "name": "Ruler Name",
                "dynasty": "Dynasty",
                "period": "Years",
                "capital": "Capital City",
                "keyAchievements": ["achievement1", "achievement2"]
              }
            ]
          },
          {
            "id": "timeline",
            "title": "Timeline",
            "type": "timeline",
            "content": [
              {
                "year": "Year/Period",
                "event": "Event",
                "significance": "Why important for exams"
              }
            ]
          },
          {
            "id": "key_events",
            "title": "Key Events",
            "type": "list",
            "content": [
              {
                "event": "Event Name",
                "date": "Date",
                "description": "Brief description",
                "examImportance": "Why asked in exams"
              }
            ]
          },
          {
            "id": "exam_points",
            "title": "Exam Important Points",
            "type": "points",
            "content": [
              "Point 1 - specific exam fact",
              "Point 2 - another exam fact"
            ]
          }
        ],
        "keyHighlights": ["highlight1", "highlight2"],
        "examTips": ["tip1", "tip2"],
        "difficulty": "intermediate",
        "estimatedTime": "15 minutes"
      }`
    },
    constitution: {
      system: `${baseSystemPrompt} For constitutional topics, focus on articles, parts, schedules, and amendments. Structure with tabs like: Articles, Parts & Schedules, Amendments, Key Provisions, Exam Facts.`,
      structure: `{
        "overview": "Brief overview of constitutional topic",
        "contentType": "constitution",
        "examFocus": "${examFocus}",
        "tabs": [
          {
            "id": "articles",
            "title": "Articles",
            "type": "articles",
            "content": [
              {
                "articleNumber": "Article Number",
                "title": "Article Title",
                "description": "What it covers",
                "keyPoints": ["point1", "point2"],
                "examRelevance": "Why important for exams"
              }
            ]
          },
          {
            "id": "parts_schedules",
            "title": "Parts & Schedules",
            "type": "list",
            "content": [
              {
                "type": "Part/Schedule",
                "number": "Number",
                "title": "Title",
                "articles": "Article range",
                "description": "What it contains"
              }
            ]
          },
          {
            "id": "amendments",
            "title": "Key Amendments",
            "type": "list",
            "content": [
              {
                "amendmentNumber": "Number",
                "year": "Year",
                "keyChanges": ["change1", "change2"],
                "examImportance": "Why frequently asked"
              }
            ]
          },
          {
            "id": "exam_facts",
            "title": "Exam Important Facts",
            "type": "points",
            "content": [
              "Fact 1 - specific constitutional fact",
              "Fact 2 - another important fact"
            ]
          }
        ],
        "keyHighlights": ["highlight1", "highlight2"],
        "examTips": ["tip1", "tip2"],
        "difficulty": "intermediate",
        "estimatedTime": "20 minutes"
      }`
    },
    science: {
      system: `${baseSystemPrompt} For science topics, focus on concepts, formulas, laws, and practical applications. Structure with tabs like: Key Concepts, Formulas & Laws, Applications, Exam Points.`,
      structure: `{
        "overview": "Brief overview of science topic",
        "contentType": "science",
        "examFocus": "${examFocus}",
        "tabs": [
          {
            "id": "concepts",
            "title": "Key Concepts",
            "type": "concepts",
            "content": [
              {
                "concept": "Concept Name",
                "definition": "Clear definition",
                "explanation": "Detailed explanation",
                "examples": ["example1", "example2"]
              }
            ]
          },
          {
            "id": "formulas",
            "title": "Formulas & Laws",
            "type": "formulas",
            "content": [
              {
                "name": "Formula/Law Name",
                "formula": "Mathematical expression",
                "variables": "Variable definitions",
                "applications": ["application1", "application2"]
              }
            ]
          },
          {
            "id": "applications",
            "title": "Applications",
            "type": "list",
            "content": [
              {
                "application": "Real-world application",
                "description": "How it works",
                "examRelevance": "Why important for exams"
              }
            ]
          },
          {
            "id": "exam_points",
            "title": "Exam Important Points",
            "type": "points",
            "content": [
              "Point 1 - specific science fact",
              "Point 2 - another important point"
            ]
          }
        ],
        "keyHighlights": ["highlight1", "highlight2"],
        "examTips": ["tip1", "tip2"],
        "difficulty": "intermediate",
        "estimatedTime": "25 minutes"
      }`
    },
    geography: {
      system: `${baseSystemPrompt} For geography topics, focus on physical features, economic aspects, and exam-relevant facts.`,
      structure: `{
        "overview": "Brief overview of geography topic",
        "contentType": "geography",
        "examFocus": "${examFocus}",
        "tabs": [
          {
            "id": "physical",
            "title": "Physical Features",
            "type": "concepts",
            "content": [
              {
                "concept": "Feature Name",
                "definition": "What it is",
                "explanation": "Detailed description",
                "examples": ["example1", "example2"]
              }
            ]
          },
          {
            "id": "economic",
            "title": "Economic Aspects",
            "type": "list",
            "content": [
              {
                "aspect": "Economic feature",
                "description": "Description",
                "examRelevance": "Why important"
              }
            ]
          },
          {
            "id": "exam_points",
            "title": "Exam Important Points",
            "type": "points",
            "content": [
              "Point 1 - specific geography fact",
              "Point 2 - another important point"
            ]
          }
        ],
        "keyHighlights": ["highlight1", "highlight2"],
        "examTips": ["tip1", "tip2"],
        "difficulty": "intermediate",
        "estimatedTime": "20 minutes"
      }`
    },
    general: {
      system: `${baseSystemPrompt} For general topics, create adaptive tabs based on the content. Use appropriate tab types like concepts, timeline, facts, or points based on what fits best.`,
      structure: `{
        "overview": "Brief overview",
        "contentType": "general",
        "examFocus": "${examFocus}",
        "tabs": [
          {
            "id": "overview_tab",
            "title": "Key Points",
            "type": "points",
            "content": [
              "Important point 1",
              "Important point 2"
            ]
          },
          {
            "id": "details",
            "title": "Detailed Information",
            "type": "concepts",
            "content": [
              {
                "concept": "Concept Name",
                "definition": "Definition",
                "explanation": "Explanation"
              }
            ]
          },
          {
            "id": "exam_focus",
            "title": "Exam Focus",
            "type": "points",
            "content": [
              "Exam point 1",
              "Exam point 2"
            ]
          }
        ],
        "keyHighlights": ["highlight1", "highlight2"],
        "examTips": ["tip1", "tip2"],
        "difficulty": "intermediate",
        "estimatedTime": "15 minutes"
      }`
    }
  }

  const selectedPrompt = contentTypePrompts[contentType as keyof typeof contentTypePrompts] || contentTypePrompts.general

  const examFocusInstructions = {
    upsc: "Focus on UPSC Civil Services exam pattern. Include Prelims MCQ points and Mains descriptive points.",
    ssc: "Focus on SSC exam pattern. Include quantitative and reasoning aspects where applicable.",
    banking: "Focus on banking exam requirements. Include current affairs and banking awareness points.",
    state_pcs: "Focus on state-level competitive exams. Include state-specific information where relevant.",
    neet: "Focus on NEET medical entrance exam. Include biological and chemical aspects.",
    jee: "Focus on JEE engineering entrance exam. Include mathematical and physical concepts.",
    general: "Focus on general competitive exam preparation."
  }

  return {
    systemPrompt: `${selectedPrompt.system}

EXAM FOCUS: ${examFocusInstructions[examFocus as keyof typeof examFocusInstructions]}

CRITICAL INSTRUCTIONS:
1. Keep content BRIEF and EXAM-FOCUSED
2. Each tab should have 3-8 items maximum
3. Focus on facts that appear in Indian competitive exams
4. Use simple, clear language
5. Include specific years, numbers, and names
6. Highlight exam-important points
7. Return ONLY valid JSON in this exact structure: ${selectedPrompt.structure}`,

    userPrompt: `Create exam-focused learning content for: "${content}"
Subject: ${subject || 'General'}
Content Type: ${contentType}
Exam Focus: ${examFocus}

Make it concise, exam-relevant, and structured with appropriate tabs. Focus on facts that frequently appear in ${examFocus.toUpperCase()} exams in India.`
  }
}

function generateMissionId(): string {
  return `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}