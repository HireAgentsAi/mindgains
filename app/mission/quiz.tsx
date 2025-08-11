import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Target, Clock, CircleCheck as CheckCircle, X, ArrowRight, Trophy } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export default function QuizArenaScreen() {
  const params = useLocalSearchParams();
  const { missionId } = params;
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const optionScale = useSharedValue(1);

  useEffect(() => {
    loadQuizContent();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [missionId]);

  useEffect(() => {
    if (questions.length > 0) {
      cardOpacity.value = withTiming(1, { duration: 800 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [questions]);

  const loadQuizContent = async () => {
    try {
      // Check if Supabase is configured or if it's a demo mission
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || (missionId as string).startsWith('demo_')) {
        // Use demo quiz questions
        const demoQuestions: QuizQuestion[] = [
          {
            id: 'q1',
            question: 'Which Article of the Indian Constitution guarantees Right to Equality?',
            options: ['Article 12', 'Article 14', 'Article 16', 'Article 19'],
            correct_answer: 1,
            explanation: 'Article 14 guarantees equality before law and equal protection of laws to all persons.',
            difficulty: 'medium',
            points: 10,
          },
          {
            id: 'q2',
            question: 'How many fundamental freedoms are guaranteed under Article 19?',
            options: ['Four', 'Five', 'Six', 'Seven'],
            correct_answer: 2,
            explanation: 'Article 19 guarantees six fundamental freedoms to all citizens of India.',
            difficulty: 'easy',
            points: 10,
          },
          {
            id: 'q3',
            question: 'Which writ is known as the "bulwark of personal liberty"?',
            options: ['Mandamus', 'Prohibition', 'Habeas Corpus', 'Certiorari'],
            correct_answer: 2,
            explanation: 'Habeas Corpus protects against illegal detention and is called the bulwark of personal liberty.',
            difficulty: 'hard',
            points: 15,
          },
        ];
        
        setQuestions(demoQuestions);
        setIsLoading(false);
        return;
      }
      
      const result = await SupabaseService.getMissionContent(missionId as string, 'quiz');
      if (result.success && result.content.quiz_questions) {
        setQuestions(result.content.quiz_questions);
      }
    } catch (error) {
      console.error('Error loading quiz content:', error);
      Alert.alert('Error', 'Failed to load quiz questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    optionScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    // Update user answers
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setUserAnswers(newAnswers);
    
    // Update score
    if (isCorrect) {
      setScore(prev => prev + currentQuestion.points);
    }
    
    setShowExplanation(true);
    
    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      
      await SupabaseService.updateProgress({
        mission_id: missionId as string,
        room_type: 'quiz',
        score,
        max_score: totalPoints,
        time_spent: timeSpent,
        completed: true,
      });

      // Track quiz completion
      await SupabaseService.trackUserActivity(user.id, 'room_completed', {
        missionId: missionId as string,
        roomType: 'quiz',
        score,
        totalPoints,
        timeSpent
      });

      setIsCompleted(true);
      
      // Navigate to memory room after delay
      setTimeout(() => {
        router.push({
          pathname: '/mission/memory',
          params: { missionId },
        });
      }, 2000);
    } catch (error) {
      console.error('Error completing quiz:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const optionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: optionScale.value }],
  }));

  if (isLoading) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <MascotAvatar size={80} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>Preparing quiz questions...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (questions.length === 0) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No quiz questions available</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

  if (isCompleted) {
    const percentage = Math.round((score / questions.reduce((sum, q) => sum + q.points, 0)) * 100);
    
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.completionContainer}>
          <MascotAvatar size={120} animated={true} glowing={true} mood="celebrating" />
          
          <LinearGradient
            colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
            style={styles.completionBadge}
          >
            <Trophy size={32} color={theme.colors.text.primary} />
            <Text style={styles.completionTitle}>Quiz Complete!</Text>
          </LinearGradient>
          
          <Text style={styles.scoreText}>You scored {percentage}%</Text>
          <Text style={styles.completionMessage}>
            Great job! Moving to the Memory Forge next.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <LinearGradient
      colors={[
        theme.colors.background.primary,
        theme.colors.background.secondary,
        theme.colors.background.tertiary,
      ]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={mascotAnimatedStyle}>
          <MascotAvatar
            size={80}
            animated={true}
            glowing={true}
            mood="focused"
          />
        </Animated.View>
        
        <View style={styles.headerText}>
          <Text style={styles.roomTitle}>🎯 Quiz Arena</Text>
          <Text style={styles.roomSubtitle}>Test your knowledge</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.scoreText}>Score: {score}</Text>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      {/* Question Content */}
      <Animated.View style={[styles.contentContainer, cardAnimatedStyle]}>
        <LinearGradient
          colors={[
            theme.colors.background.card,
            theme.colors.background.secondary,
          ]}
          style={styles.contentCard}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.questionContainer}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
                </View>
              </View>

              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option, index) => (
                  <Animated.View key={index} style={optionAnimatedStyle}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        selectedAnswer === index && styles.selectedOption,
                        showExplanation && index === currentQuestion.correct_answer && styles.correctOption,
                        showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && styles.incorrectOption,
                      ]}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionNumber}>
                          <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                        {showExplanation && index === currentQuestion.correct_answer && (
                          <CheckCircle size={20} color={theme.colors.accent.green} />
                        )}
                        {showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                          <X size={20} color={theme.colors.accent.pink} />
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {showExplanation && currentQuestion.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {!showExplanation ? (
          <GradientButton
            title="Submit Answer"
            onPress={handleSubmitAnswer}
            size="large"
            fullWidth
            disabled={selectedAnswer === null}
            colors={[theme.colors.accent.blue, theme.colors.accent.purple]}
          />
        ) : (
          <GradientButton
            title={currentQuestionIndex < questions.length - 1 ? "Next Question" : "Complete Quiz"}
            onPress={handleNextQuestion}
            size="large"
            fullWidth
            icon={<ArrowRight size={20} color={theme.colors.text.primary} />}
            colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  completionTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  completionMessage: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  roomSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.yellow,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  contentContainer: {
    flex: 1,
    marginBottom: theme.spacing.lg,
  },
  contentCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    gap: theme.spacing.lg,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  questionText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    lineHeight: 26,
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: theme.colors.accent.blue + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.blue,
    textTransform: 'uppercase',
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
    overflow: 'hidden',
  },
  selectedOption: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: theme.colors.accent.purple + '10',
  },
  correctOption: {
    borderColor: theme.colors.accent.green,
    backgroundColor: theme.colors.accent.green + '10',
  },
  incorrectOption: {
    borderColor: theme.colors.accent.pink,
    backgroundColor: theme.colors.accent.pink + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  explanationContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  actionContainer: {
    paddingBottom: theme.spacing.xl,
  },
});