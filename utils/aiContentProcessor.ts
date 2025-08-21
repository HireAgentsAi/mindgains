import { AIModelOrchestrator, TaskType } from '@/components/ui/AIModelOrchestrator';

export interface ProcessedContent {
  title: string;
  summary: string;
  keyPoints: string[];
  questions: QuizQuestion[];
  flashcards: Flashcard[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  subject: string;
  examRelevance: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  subject: string;
  examRelevance: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export class AIContentProcessor {
  // Process any content type into structured learning material
  static async processContent(
    content: string,
    contentType: 'text' | 'youtube' | 'pdf' | 'image',
    subject?: string,
    examFocus?: string
  ): Promise<ProcessedContent> {
    try {
      // Step 1: Analyze content structure
      const analysisResult = await AIModelOrchestrator.executeRequest({
        taskType: 'content_analysis',
        prompt: this.createAnalysisPrompt(content, contentType, subject, examFocus),
        temperature: 0.3,
      });

      if (!analysisResult.success) {
        throw new Error('Content analysis failed');
      }

      const analysis = JSON.parse(analysisResult.data);

      // Step 2: Generate quiz questions
      const questionsResult = await AIModelOrchestrator.executeRequest({
        taskType: 'factual_questions',
        prompt: this.createQuestionsPrompt(content, analysis, examFocus),
        temperature: 0.7,
      });

      // Step 3: Generate flashcards
      const flashcardsResult = await AIModelOrchestrator.executeRequest({
        taskType: 'creative_questions',
        prompt: this.createFlashcardsPrompt(content, analysis),
        temperature: 0.8,
      });

      // Step 4: Generate explanations
      const explanationsResult = await AIModelOrchestrator.executeRequest({
        taskType: 'explanation_generation',
        prompt: this.createExplanationsPrompt(content, analysis),
        temperature: 0.6,
      });

      // Combine all results
      const questions = questionsResult.success ? JSON.parse(questionsResult.data).questions : [];
      const flashcards = flashcardsResult.success ? JSON.parse(flashcardsResult.data).flashcards : [];
      const explanations = explanationsResult.success ? JSON.parse(explanationsResult.data) : {};

      return {
        title: analysis.title || 'Learning Content',
        summary: analysis.summary || 'AI-generated learning content',
        keyPoints: analysis.keyPoints || [],
        questions: questions.map((q: any, index: number) => ({
          ...q,
          id: `q_${Date.now()}_${index}`,
          subject: analysis.subject || subject || 'General',
          examRelevance: analysis.examRelevance || 'Relevant for competitive exams',
        })),
        flashcards: flashcards.map((f: any, index: number) => ({
          ...f,
          id: `f_${Date.now()}_${index}`,
        })),
        difficulty: analysis.difficulty || 'intermediate',
        estimatedTime: analysis.estimatedTime || 15,
        subject: analysis.subject || subject || 'General',
        examRelevance: analysis.examRelevance || 'Relevant for competitive exams',
      };
    } catch (error) {
      console.error('Error processing content:', error);
      throw new Error('Failed to process content with AI');
    }
  }

  // Process YouTube video content
  static async processYouTubeVideo(videoUrl: string): Promise<ProcessedContent> {
    try {
      // Extract video ID
      const videoId = this.extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      // Get video metadata using YouTube API
      const youtubeApiKey = process.env.YOUTUBE_API_KEY;
      if (!youtubeApiKey) {
        throw new Error('YouTube API key not configured');
      }

      const metadataResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet,contentDetails`
      );

      if (!metadataResponse.ok) {
        throw new Error('Failed to fetch video metadata');
      }

      const metadata = await metadataResponse.json();
      const video = metadata.items[0];

      if (!video) {
        throw new Error('Video not found');
      }

      // Extract transcript (using a transcript service or captions)
      const transcript = await this.extractVideoTranscript(videoId);
      
      // Process the transcript content
      return await this.processContent(
        transcript,
        'youtube',
        this.detectSubjectFromTitle(video.snippet.title),
        'general'
      );
    } catch (error) {
      console.error('Error processing YouTube video:', error);
      throw error;
    }
  }

  // Process PDF content
  static async processPDF(fileData: string, fileName: string): Promise<ProcessedContent> {
    try {
      const pdfApiKey = process.env.PDF_CO_API_KEY;
      if (!pdfApiKey) {
        throw new Error('PDF.co API key not configured');
      }

      // Extract text from PDF using PDF.co
      const extractResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': pdfApiKey,
        },
        body: JSON.stringify({
          file: fileData,
          pages: '1-10', // Limit to first 10 pages
          inline: true,
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract text from PDF');
      }

      const extractData = await extractResponse.json();
      const extractedText = extractData.body;

      if (!extractedText || extractedText.length < 100) {
        throw new Error('No meaningful text extracted from PDF');
      }

      // Process the extracted text
      return await this.processContent(
        extractedText,
        'pdf',
        this.detectSubjectFromText(extractedText),
        'general'
      );
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  // Process image with OCR
  static async processImage(imageData: string): Promise<ProcessedContent> {
    try {
      const visionApiKey = process.env.GOOGLE_VISION_API_KEY;
      if (!visionApiKey) {
        throw new Error('Google Vision API key not configured');
      }

      // Use Google Vision API for OCR
      const visionResponse = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageData.replace(/^data:image\/[^;]+;base64,/, ''),
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 1,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!visionResponse.ok) {
        throw new Error('Google Vision API request failed');
      }

      const visionData = await visionResponse.json();
      const extractedText = visionData.responses[0]?.textAnnotations[0]?.description;

      if (!extractedText || extractedText.length < 20) {
        throw new Error('No text detected in image');
      }

      // Process the extracted text
      return await this.processContent(
        extractedText,
        'image',
        this.detectSubjectFromText(extractedText),
        'general'
      );
    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    }
  }

  // Generate daily quiz using AI orchestration
  static async generateDailyQuiz(date: string): Promise<any> {
    try {
      const prompt = `Generate 20 high-quality multiple-choice questions for Indian competitive exam preparation for ${date}.

SUBJECT DISTRIBUTION (exactly):
- History: 4 questions (Ancient, Medieval, Modern India, Freedom Movement)
- Polity: 4 questions (Constitution, Governance, Rights, Amendments)
- Geography: 3 questions (Physical, Economic, Indian Geography)
- Economy: 3 questions (Indian Economy, Banking, Current Policies)
- Science & Technology: 3 questions (Space, Defense, IT, Biotechnology)
- Current Affairs: 3 questions (Recent 6 months, Government Schemes)

DIFFICULTY DISTRIBUTION:
- Easy: 8 questions (basic facts, definitions)
- Medium: 8 questions (application, analysis)
- Hard: 4 questions (synthesis, evaluation)

Include recent developments, government schemes, and current affairs from the last 6 months.

Return JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation",
      "subject": "Subject name",
      "subtopic": "Specific subtopic",
      "difficulty": "easy|medium|hard",
      "points": 5,
      "exam_relevance": "Why important for exams"
    }
  ]
}`;

      const result = await AIModelOrchestrator.executeRequest({
        taskType: 'factual_questions',
        prompt,
        temperature: 0.7,
        maxTokens: 8000,
      });

      if (!result.success) {
        throw new Error('Failed to generate daily quiz');
      }

      return JSON.parse(result.data);
    } catch (error) {
      console.error('Error generating daily quiz:', error);
      throw error;
    }
  }

  // Helper methods
  private static createAnalysisPrompt(content: string, contentType: string, subject?: string, examFocus?: string): string {
    return `Analyze this ${contentType} content for educational structuring:

Content: ${content.slice(0, 2000)}
Subject: ${subject || 'Unknown'}
Exam Focus: ${examFocus || 'General'}

Return JSON:
{
  "title": "Content title",
  "summary": "Brief summary",
  "keyPoints": ["point1", "point2", "point3"],
  "subject": "Detected subject",
  "difficulty": "beginner|intermediate|advanced",
  "estimatedTime": 15,
  "examRelevance": "How relevant for competitive exams"
}`;
  }

  private static createQuestionsPrompt(content: string, analysis: any, examFocus?: string): string {
    return `Generate 10 multiple-choice questions based on this content:

Content: ${content.slice(0, 1500)}
Subject: ${analysis.subject}
Exam Focus: ${examFocus || 'general'}

Create questions suitable for Indian competitive exams (UPSC, SSC, Banking, etc.).

Return JSON:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard",
      "points": 10
    }
  ]
}`;
  }

  private static createFlashcardsPrompt(content: string, analysis: any): string {
    return `Generate 8 flashcards for memorization based on this content:

Content: ${content.slice(0, 1500)}
Subject: ${analysis.subject}

Create flashcards that help memorize key facts, definitions, and concepts.

Return JSON:
{
  "flashcards": [
    {
      "front": "Question or term",
      "back": "Answer or definition",
      "category": "Category name",
      "difficulty": "easy|medium|hard",
      "hint": "Optional hint"
    }
  ]
}`;
  }

  private static createExplanationsPrompt(content: string, analysis: any): string {
    return `Generate detailed explanations for the key concepts in this content:

Content: ${content.slice(0, 1500)}
Subject: ${analysis.subject}

Create clear, comprehensive explanations that help students understand complex topics.

Return JSON:
{
  "explanations": {
    "overview": "Overall explanation",
    "keyConceptExplanations": ["explanation1", "explanation2"],
    "examTips": ["tip1", "tip2"]
  }
}`;
  }

  private static extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  private static async extractVideoTranscript(videoId: string): Promise<string> {
    // In a real implementation, you'd use a transcript service
    // For now, return a placeholder
    return `Educational video transcript for video ${videoId}. This would contain the actual video content extracted from captions or transcript services.`;
  }

  private static detectSubjectFromTitle(title: string): string {
    const subjects = {
      'history': ['history', 'ancient', 'medieval', 'modern', 'empire', 'dynasty', 'war', 'independence'],
      'science': ['science', 'physics', 'chemistry', 'biology', 'experiment', 'theory', 'formula'],
      'mathematics': ['math', 'algebra', 'geometry', 'calculus', 'equation', 'theorem'],
      'geography': ['geography', 'climate', 'river', 'mountain', 'continent', 'country'],
      'economics': ['economics', 'economy', 'market', 'trade', 'finance', 'business'],
    };

    const titleLower = title.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjects)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return subject.charAt(0).toUpperCase() + subject.slice(1);
      }
    }

    return 'General';
  }

  private static detectSubjectFromText(text: string): string {
    // Similar logic to detectSubjectFromTitle but for longer text
    return this.detectSubjectFromTitle(text);
  }
}