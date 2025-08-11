import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { 
  Calendar, 
  Clock, 
  Target, 
  Trophy, 
  Star, 
  ArrowRight, 
  ChevronLeft,
  CircleCheck as CheckCircle,
  X,
  Brain,
  Zap
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';
import type { DailyQuiz, DailyQuizQuestion } from '@/utils/supabaseService';

const { width = 375 } = Dimensions.get('window') || {};

export default function DailyQuizScreen() {
  const isMounted = useRef(true);
  const params = useLocalSearchParams();
  const { quizId } = params;
  
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const optionScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-1);
  const progressPulse = useSharedValue(1);

  useEffect(() => {
    isMounted.current = true;
    loadDailyQuiz();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    
    // Continuous animations
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    
    progressPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    return () => {
      clearInterval(interval);
      isMounted.current = false;
    };
  }, [quizId]);

  const loadDailyQuiz = async () => {
    try {
      if (!isMounted.current) return;
      
      console.log('📱 Loading daily quiz...', { supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL });
      
      // Check authentication first
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        if (!isMounted.current) return;
        router.replace('/auth');
        return;
      }

      console.log('👤 User authenticated:', user.id);

      // Check user limits first
      console.log('🔍 Checking user limits...');
      const limits = await SupabaseService.checkUserLimits(user.id);
      console.log('📊 User limits:', limits);
      
      if (!limits.canTakeQuiz) {
        console.log('❌ User cannot take quiz - limit reached');
        if (!isMounted.current) return;
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

      // Get today's quiz (will generate if doesn't exist)
      console.log('🔍 Calling ensureTodayQuiz...');
      const dailyQuiz = await SupabaseService.ensureTodayQuiz();
      
      console.log('📋 Quiz retrieval result:', {
        quizExists: !!dailyQuiz,
        questionsCount: dailyQuiz?.questions?.length || 0,
        quizId: dailyQuiz?.id || 'No ID',
        quizDate: dailyQuiz?.date || 'No date'
      });
      
      if (!dailyQuiz) {
        console.error('❌ No quiz returned from ensureTodayQuiz');
        throw new Error('Failed to load or generate daily quiz');
      }
      
      if (!dailyQuiz.questions || !Array.isArray(dailyQuiz.questions) || dailyQuiz.questions.length === 0) {
        console.error('❌ Quiz has no questions:', {
          hasQuestions: !!dailyQuiz.questions,
          isArray: Array.isArray(dailyQuiz.questions),
          length: dailyQuiz.questions?.length || 0
        });
        throw new Error('Quiz has no questions');
      }
      
      if (!isMounted.current) return;
      console.log('✅ Daily quiz loaded:', {
        questionsCount: dailyQuiz.questions?.length || 0,
        firstQuestion: dailyQuiz.questions?.[0]?.question || 'No question',
        subjects: dailyQuiz.subjects_covered || []
      });
      
      setQuiz(dailyQuiz);
      setUserAnswers(new Array(dailyQuiz.questions?.length || 0).fill(-1));
    } catch (error) {
      console.error('❌ Error loading daily quiz:', error);
      if (!isMounted.current) return;
      Alert.alert(
        'Quiz Loading Error', 
        `Failed to load daily quiz: ${error.message}. Please check your internet connection and try again.`,
        [
          { text: 'Retry', onPress: () => loadDailyQuiz() },
          { text: 'Go Back', onPress: () => router.back() }
        ]
      );
    } finally {
      if (!isMounted.current) return;
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
    
    // Animate option selection
    optionScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowExplanation(true);
    
    // Animate mascot based on answer correctness
    const isCorrect = selectedAnswer === quiz!.questions[currentQuestionIndex].correct_answer;
    mascotScale.value = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex + 1] !== -1 ? userAnswers[currentQuestionIndex + 1] : null);
      setShowExplanation(false);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('📤 Submitting daily quiz...');
      
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        if (!isMounted.current) return;
        router.replace('/auth');
        return;
      }

      const correctCount = userAnswers.filter((answer, index) => 
        answer === quiz.questions[index].correct_answer
      ).length;
      const percentage = Math.round((correctCount / quiz.questions.length) * 100);
      
      console.log('📊 Calculating results...', {
        correctCount,
        totalQuestions: quiz.questions.length,
        percentage,
        timeSpent
      });
      
      // Submit quiz results
      console.log('🚀 Calling submitDailyQuiz with:', {
        quizId: quiz.id,
        answersLength: userAnswers.length,
        timeSpent
      });
      
      const submitResult = await SupabaseService.submitDailyQuiz(quiz.id, userAnswers, timeSpent);
      
      console.log('📤 Submit result:', submitResult);
      
      if (!isMounted.current) return;
      
      if (submitResult.success && submitResult.results) {
        console.log('✅ Quiz submitted successfully with results');
        setResults(submitResult.results);
        
        // Show success message
        Alert.alert(
          '🎉 Quiz Complete!',
          `You scored ${submitResult.results.score_percentage}%!\n\n${submitResult.results.grok_message || 'Great job!'}`,
          [{ text: 'View Results', onPress: () => {} }]
        );
      } else {
        console.log('⚠️ Quiz submission failed, error:', submitResult.error);
        throw new Error(submitResult.error || 'Submission failed');
      }
      
      setIsCompleted(true);
  };

  const getGrokMessage = (percentage: number, correct: number, total: number): string => {
    if (percentage === 100) {
      return "🎯 Perfect score! You're basically a walking encyclopedia of Indian knowledge! Time to challenge Einstein! 🧠✨";
    } else if (percentage >= 90) {
      return "🌟 Outstanding! You're so smart, even Google would ask you for answers! Keep this momentum going! 🚀";
    } else if (percentage >= 80) {
      return "💪 Excellent work! You're crushing it like Bhagat Singh crushed the British morale! 🇮🇳";
    } else if (percentage >= 70) {
      return "📚 Good job! You're on the right track - just need to channel your inner Chandragupta Maurya! 👑";
    } else if (percentage >= 60) {
      return "🎯 Not bad! Rome wasn't built in a day, and neither was the Taj Mahal. Keep practicing! 🏛️";
    } else if (percentage >= 50) {
      return "🤔 Hmm, looks like you need to spend more time with books than with Netflix! But hey, we all start somewhere! 📖";
    } else {
      return "😅 Well, at least you showed up! That's more than what some Mughal emperors did for their empire! Try again tomorrow! 💪";
    }
  };

  const getMascotCelebration = (percentage: number): string => {
    if (percentage >= 90) return 'celebrating';
    if (percentage >= 70) return 'excited';
    if (percentage >= 50) return 'happy';
    return 'encouraging';
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(userAnswers[currentQuestionIndex - 1] !== -1 ? userAnswers[currentQuestionIndex - 1] : null);
      setShowExplanation(false);
    } else {
      router.back();
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
  
  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 1.5, width * 1.5]
    );
    
    return {
      transform: [
        { translateX },
        { rotate: '-30deg' }
      ],
    };
  });
  
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progressPulse.value }],
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
          <MascotAvatar size={100} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>Loading today's quiz...</Text>
          <Text style={styles.loadingSubtext}>AI-powered questions on History, Polity, Geography, Economy, Science & Current Affairs</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!quiz) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Today's quiz is not available</Text>
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
                {results.correct_answers} out of {results.total_questions} correct
              </Text>
              
              {/* Grok's Witty Message */}
              {results.grok_message && (
                <View style={styles.grokMessageContainer}>
                  <LinearGradient
                    colors={[theme.colors.accent.purple + '20', theme.colors.accent.blue + '20']}
                    style={styles.grokMessageCard}
                  >
                    <View style={styles.grokMessageHeader}>
                      <Text style={styles.grokMessageIcon}>🤖</Text>
                      <Text style={styles.grokMessageTitle}>Grok's Take</Text>
                    </View>
                    <Text style={styles.grokMessageText}>{results.grok_message}</Text>
                  </LinearGradient>
                </View>
              )}
              
              {/* XP Reward Display */}
              {results.xp_earned && (
                <View style={styles.xpRewardContainer}>
                  <LinearGradient
                    colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
                    style={styles.xpRewardBadge}
                  >
                    <Zap size={20} color={theme.colors.text.primary} />
                    <Text style={styles.xpRewardText}>+{results.xp_earned} XP Earned!</Text>
                  </LinearGradient>
                </View>
              )}
            </View>

            <View style={styles.resultsStats}>
              <View style={styles.resultStat}>
                <CheckCircle size={24} color={theme.colors.accent.green} />
                <Text style={styles.resultStatValue}>{results.correct_answers}</Text>
                <Text style={styles.resultStatLabel}>Correct</Text>
              </View>
              
              <View style={styles.resultStat}>
                <X size={24} color={theme.colors.accent.pink} />
                <Text style={styles.resultStatValue}>{results.total_questions - results.correct_answers}</Text>
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
                title="View Detailed Results"
                onPress={() => router.push({
                  pathname: '/quiz/daily-results',
                  params: { 
                    results: JSON.stringify(results),
                    quizDate: quiz.date
                  }
                })}
                size="large"
                fullWidth
                icon={<Brain size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                style={styles.actionButton}
              />
              
              <GradientButton
                title="Back to Home"
                onPress={() => router.replace('/(tabs)')}
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

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

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
          onPress={handleBack}
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
            <Text style={styles.headerTitle}>
              <FontAwesome5 name="calendar-day" size={16} color={theme.colors.accent.purple} solid />
              {' '}Daily Quiz
            </Text>
            <Text style={styles.headerSubtitle}>
              <FontAwesome5 name="flag" size={12} color={theme.colors.text.secondary} />
              {' '}India Knowledge Challenge
            </Text>
          </View>
        </View>
        
        <View style={styles.timerContainer}>
          <FontAwesome5 name="clock" size={14} color={theme.colors.accent.blue} solid />
          <Text style={styles.timerText}>{Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <Animated.View style={[styles.progressContainer, progressAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.background.card, theme.colors.background.secondary]}
          style={styles.progressCard}
        >
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Text>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{currentQuestion.subject}</Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
            
            {/* Shimmer effect */}
            <View style={styles.progressShimmerContainer}>
              <Animated.View style={[styles.progressShimmer, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  style={styles.shimmerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
          </View>
          
          <View style={styles.questionMeta}>
            <View style={styles.difficultyBadge}>
              <FontAwesome5 name="layer-group" size={10} color={theme.colors.accent.blue} />
              <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
            </View>
            <View style={styles.pointsBadge}>
              <FontAwesome5 name="star" size={10} color={theme.colors.accent.yellow} solid />
              <Text style={styles.pointsText}>{currentQuestion.points} pts</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

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
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
              <Text style={styles.subtopicText}>{currentQuestion.subtopic}</Text>

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
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.optionNumber,
                          selectedAnswer === index && styles.selectedOptionNumber,
                          showExplanation && index === currentQuestion.correct_answer && styles.correctOptionNumber,
                        ]}>
                          <Text style={[
                            styles.optionNumberText,
                            selectedAnswer === index && styles.selectedOptionNumberText,
                          ]}>
                            {String.fromCharCode(65 + index)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.optionText,
                          selectedAnswer === index && styles.selectedOptionText,
                        ]}>
                          {option}
                        </Text>
                        {showExplanation && index === currentQuestion.correct_answer && (
                          <FontAwesome5 name="check-circle" size={18} color={theme.colors.accent.green} solid />
                        )}
                        {showExplanation && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                          <FontAwesome5 name="times-circle" size={18} color={theme.colors.accent.pink} solid />
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>

              {showExplanation && (
                <View style={styles.explanationContainer}>
                  <View style={styles.explanationHeader}>
                    <FontAwesome5 name="brain" size={16} color={theme.colors.accent.purple} solid />
                    <Text style={styles.explanationTitle}>Explanation</Text>
                  </View>
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
            title={
              isSubmitting
                ? "Submitting..."
                : currentQuestionIndex < quiz.questions.length - 1 
                  ? "Next Question" 
                  : "Complete Quiz"
            }
            onPress={handleNextQuestion}
            size="large"
            fullWidth
            disabled={isSubmitting}
            icon={<FontAwesome5 name="arrow-right" size={16} color={theme.colors.text.primary} solid />}
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
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
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
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
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
  progressCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    position: 'relative',
    overflow: 'hidden',
  },
  progressShimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  progressShimmer: {
    position: 'absolute',
    top: -50,
    left: -100,
    width: width * 2,
    height: 100,
    opacity: 0.3,
  },
  shimmerGradient: {
    flex: 1,
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
  subjectBadge: {
    backgroundColor: theme.colors.accent.purple + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  subjectText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
    position: 'relative',
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
  scrollContent: {
    flexGrow: 1,
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
  },
  subtopicText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
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
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOptionNumber: {
    backgroundColor: theme.colors.accent.purple,
  },
  correctOptionNumber: {
    backgroundColor: theme.colors.accent.green,
  },
  optionNumberText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.tertiary,
  },
  selectedOptionNumberText: {
    color: theme.colors.text.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.subheading,
  },
  explanationContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
    marginTop: theme.spacing.md,
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
  grokMessageContainer: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
  grokMessageCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  grokMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  grokMessageIcon: {
    fontSize: 20,
  },
  grokMessageTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  grokMessageText: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  xpRewardContainer: {
    marginTop: theme.spacing.md,
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  xpRewardText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
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