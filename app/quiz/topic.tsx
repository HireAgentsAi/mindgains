import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
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
import { ChevronLeft, Target, Clock, CircleCheck as CheckCircle, X, ArrowRight, Trophy, Star, Brain } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface TopicQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  exam_relevance?: string;
}

export default function TopicQuizScreen() {
  const params = useLocalSearchParams();
  const { topicId, topicName, subjectName } = params;
  
  const [questions, setQuestions] = useState<TopicQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const optionScale = useSharedValue(1);

  useEffect(() => {
    loadTopicQuestions();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [topicId]);

  useEffect(() => {
    if (questions.length > 0) {
      cardOpacity.value = withTiming(1, { duration: 800 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [questions]);

  const loadTopicQuestions = async () => {
    try {
      // Check if user can take quiz
      const user = await SupabaseService.getCurrentUser();
      if (user) {
        const limits = await SupabaseService.checkUserLimits(user.id);
        if (!limits.canTakeQuiz) {
          Alert.alert(
            'Daily Limit Reached',
            `You've used all ${limits.dailyLimit} free quizzes today. Upgrade to Premium for unlimited access!`,
            [
              { text: 'Maybe Later', onPress: () => router.back() },
              { text: 'Upgrade Now', onPress: () => router.push('/subscription') }
            ]
          );
          return;
        }
      }

      // Try to get existing questions first
      let topicQuestions = await SupabaseService.getTopicQuestions(topicId as string);
      
      if (!topicQuestions || topicQuestions.length === 0) {
        // No questions available, generate them using AI
        setIsLoading(true);
        
        const result = await SupabaseService.generateTopicQuiz(
          topicName as string,
          subjectName as string,
          'mixed',
          15
        );
        
        if (result.success && result.questions) {
          // Convert AI questions to TopicQuestion format
          const aiQuestions = result.questions.map((q: any, index: number) => ({
            id: `ai_${index}`,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            difficulty: q.difficulty,
            points: q.points,
            exam_relevance: q.exam_relevance
          }));
          
          setQuestions(aiQuestions);
          setUserAnswers(new Array(aiQuestions.length).fill(-1));
        } else {
          throw new Error(result.error || 'Failed to generate questions');
        }
      } else {
        // Use existing questions, randomly select 10
        const shuffled = topicQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffled.slice(0, 10);
        
        setQuestions(selectedQuestions);
        setUserAnswers(new Array(selectedQuestions.length).fill(-1));
      }
    } catch (error) {
      console.error('Error loading topic questions:', error);
      Alert.alert('Error', 'Failed to load or generate quiz questions. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    
    // Update user answers array
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
    
    optionScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    
    if (isCorrect) {
      setScore(prev => prev + currentQuestion.points);
    }
    
    setShowExplanation(true);
    
    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(isCorrect ? 1.3 : 0.9, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] !== -1 ? userAnswers[currentQuestionIndex + 1] : null);
      setShowExplanation(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    try {
      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const correctCount = userAnswers.filter((answer, index) => 
        answer === questions[index].correct_answer
      ).length;
      const percentage = Math.round((correctCount / questions.length) * 100);
      
      const quizResults = {
        topic_id: topicId as string,
        questions_attempted: questions.length,
        questions_correct: correctCount,
        score_percentage: percentage,
        total_points: score,
        time_spent: timeSpent,
        detailed_results: questions.map((q, index) => ({
          question: q.question,
          user_answer: userAnswers[index],
          correct_answer: q.correct_answer,
          is_correct: userAnswers[index] === q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty
        }))
      };
      
      // Update user progress
      await SupabaseService.updateTopicProgress(quizResults);
      
      setResults(quizResults);
      setIsCompleted(true);
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
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <MascotAvatar size={80} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>Loading {topicName} quiz...</Text>
          <Text style={styles.loadingSubtext}>Preparing 10 random questions</Text>
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
          <Text style={styles.errorText}>No questions available for this topic</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

  if (isCompleted && results) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
          theme.colors.background.tertiary,
        ]}
        style={styles.container}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <MascotAvatar size={100} animated={true} glowing={true} mood="celebrating" />
              
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.resultsBadge}
              >
                <Trophy size={32} color={theme.colors.text.primary} />
                <Text style={styles.resultsTitle}>Quiz Complete!</Text>
              </LinearGradient>
              
              <Text style={styles.resultsScore}>{results.score_percentage}%</Text>
              <Text style={styles.resultsSubtext}>
                {results.questions_correct} out of {results.questions_attempted} correct
              </Text>
              <Text style={styles.topicTitle}>{topicName} • {subjectName}</Text>
            </View>

            <View style={styles.resultsStats}>
              <View style={styles.resultStat}>
                <CheckCircle size={24} color={theme.colors.accent.green} />
                <Text style={styles.resultStatValue}>{results.questions_correct}</Text>
                <Text style={styles.resultStatLabel}>Correct</Text>
              </View>
              
              <View style={styles.resultStat}>
                <X size={24} color={theme.colors.accent.pink} />
                <Text style={styles.resultStatValue}>{results.questions_attempted - results.questions_correct}</Text>
                <Text style={styles.resultStatLabel}>Incorrect</Text>
              </View>
              
              <View style={styles.resultStat}>
                <Clock size={24} color={theme.colors.accent.blue} />
                <Text style={styles.resultStatValue}>{Math.round(results.time_spent / 60)}m</Text>
                <Text style={styles.resultStatLabel}>Time</Text>
              </View>
              
              <View style={styles.resultStat}>
                <Star size={24} color={theme.colors.accent.yellow} />
                <Text style={styles.resultStatValue}>{results.total_points}</Text>
                <Text style={styles.resultStatLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <GradientButton
                title="Try Another Topic"
                onPress={() => router.back()}
                size="large"
                fullWidth
                icon={<Brain size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                style={styles.actionButton}
              />
              
              <GradientButton
                title="Back to Subjects"
                onPress={() => router.replace('/(tabs)/learn')}
                size="large"
                fullWidth
                icon={<ArrowRight size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
              />
            </View>
          </View>
        </ScrollView>
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
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.backButtonGradient}
          >
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Animated.View style={mascotAnimatedStyle}>
            <MascotAvatar
              size={60}
              animated={true}
              glowing={true}
              mood="focused"
            />
          </Animated.View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{topicName}</Text>
            <Text style={styles.headerSubtitle}>{subjectName} Quiz</Text>
          </View>
        </View>
        
        <View style={styles.timerContainer}>
          <Clock size={16} color={theme.colors.accent.blue} />
          <Text style={styles.timerText}>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</Text>
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
        
        <View style={styles.questionMeta}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
          </View>
          <View style={styles.pointsBadge}>
            <Star size={12} color={theme.colors.accent.yellow} />
            <Text style={styles.pointsText}>{currentQuestion.points} pts</Text>
          </View>
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
              <Text style={styles.questionText}>{currentQuestion.question}</Text>

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

              {showExplanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <Brain size={20} color={theme.colors.accent.purple} />
                    <Text style={styles.explanationTitle}>Explanation</Text>
                  </View>
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                  
                  {currentQuestion.exam_relevance && (
                    <View style={styles.examRelevanceContainer}>
                      <Target size={16} color={theme.colors.accent.green} />
                      <Text style={styles.examRelevanceText}>{currentQuestion.exam_relevance}</Text>
                    </View>
                  )}
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
  },
  scrollView: {
    flex: 1,
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
  loadingSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  timerText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.blue,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  difficultyBadge: {
    backgroundColor: theme.colors.accent.blue + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.blue,
    textTransform: 'uppercase',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  pointsText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  contentCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  questionContainer: {
    gap: theme.spacing.lg,
  },
  questionText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  examRelevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.green + '10',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  examRelevanceText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    fontStyle: 'italic',
  },
  actionContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  resultsContainer: {
    padding: theme.spacing.lg,
    paddingTop: 80,
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  resultsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  resultsTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultsScore: {
    fontSize: 48,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
  },
  resultsSubtext: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  topicTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    textAlign: 'center',
  },
  resultsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  resultStat: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultStatValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  actionButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});