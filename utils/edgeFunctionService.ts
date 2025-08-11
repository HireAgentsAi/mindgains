// Simplified edge function service for core functionality only
export interface LearningContent {
  overview: string;
  keyPoints: string[];
  timeline: Array<{ event: string; description: string; year?: string }>;
  concepts: Array<{ term: string; definition: string }>;
  sampleAnswers: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export interface TestQuestion {
  id: string;
  type: 'mcq' | 'short' | 'long';
  question: string;
  options?: string[];
  correctAnswer?: number;
  points: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MascotResponse {
  message: string;
  mood: 'happy' | 'excited' | 'encouraging' | 'celebrating' | 'concerned';
  animation: 'bounce' | 'cheer' | 'think' | 'celebrate' | 'comfort';
}

// Simplified service that provides fallback data when Supabase is not available
export class EdgeFunctionService {
  static async analyzeContent(content: string, method: string, subject?: string) {
    // Return mock data for development
    return {
      content: {
        overview: "This is sample learning content for development.",
        keyPoints: ["Key point 1", "Key point 2", "Key point 3"],
        timeline: [
          { event: "Sample event", description: "Sample description", year: "2024" }
        ],
        concepts: [
          { term: "Sample term", definition: "Sample definition" }
        ],
        sampleAnswers: ["Sample answer 1", "Sample answer 2"],
        difficulty: 'intermediate' as const,
        estimatedTime: "15 minutes"
      },
      missionId: `mock_${Date.now()}`
    };
  }

  static async generateQuiz(missionId: string, content: LearningContent) {
    return {
      questions: [
        {
          id: "q1",
          question: "What is the capital of India?",
          options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
          correctAnswer: 1,
          explanation: "New Delhi is the capital of India.",
          difficulty: "easy" as const,
          points: 10
        }
      ],
      totalPoints: 10,
      timeLimit: 300
    };
  }

  static async generateFlashcards(missionId: string, content: LearningContent) {
    return {
      flashcards: [
        {
          id: "f1",
          front: "Capital of India",
          back: "New Delhi",
          category: "Geography",
          difficulty: "easy" as const
        }
      ],
      totalCards: 1,
      categories: ["Geography"]
    };
  }

  static async generateTest(missionId: string, content: LearningContent) {
    return {
      test: {
        title: "Sample Test",
        instructions: "Answer all questions",
        timeLimit: 900,
        totalPoints: 100,
        questions: [
          {
            id: "t1",
            type: "mcq" as const,
            question: "What is the capital of India?",
            options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
            correctAnswer: 1,
            points: 10,
            explanation: "New Delhi is the capital of India.",
            difficulty: "easy" as const
          }
        ]
      },
      passingScore: 60
    };
  }

  static async getMascotResponse(): Promise<MascotResponse> {
    return {
      message: "Keep going! You're doing amazing! 🌟",
      mood: 'encouraging',
      animation: 'bounce'
    };
  }
}