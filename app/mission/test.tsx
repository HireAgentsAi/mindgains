import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import { Award, Clock, CircleCheck as CheckCircle, X, ArrowRight, Trophy, Star } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface TestQuestion {
  id: string;
  question: string;
  question_type: 'mcq' | 'short' | 'long';
  options?: string[];
  correct_answer?: number;
  points: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function TestTowerScreen() {
  const params = useLocalSearchParams();
  const { missionId } = params;
  
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<(number | string)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const optionScale = useSharedValue(1);

  useEffect(() => {
    loadTestContent();
    
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

  const loadTestContent = async () => {
    try {
      // Check if Supabase is configured or if it's a demo mission
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || (missionId as string).startsWith('demo_')) {
        // Use demo test questions
        const demoQuestions: TestQuestion[] = [
          {
            id: 't1',
            question: 'Which Article of the Constitution is known as the "Heart and Soul" of the Constitution?',
            question_type: 'mcq',
            options: ['Article 14', 'Article 19', 'Article 21', 'Article 32'],
            correct_answer: 3,
            points: 10,
            explanation: 'Article 32 (Right to Constitutional Remedies) was called the "Heart and Soul" by Dr. B.R. Ambedkar.',
            difficulty: 'medium',
          },
          {
            id: 't2',
            question: 'Explain the significance of Article 21 in the Indian Constitution.',
            question_type: 'short',
            points: 15,
            explanation: 'Article 21 guarantees Right to Life and Personal Liberty and has been expanded through judicial interpretation.',
            difficulty: 'medium',
          },
          {
            id: 't3',
            question: 'Discuss the evolution of Fundamental Rights through judicial interpretation with examples.',
            question_type: 'long',
            points: 25,
            explanation: 'This requires detailed discussion of landmark cases and judicial activism.',
            difficulty: 'hard',
          },
          {
            id: 't4',
            question: 'Which of the following writs can be issued against both judicial and administrative authorities?',
            question_type: 'mcq',
            options: ['Habeas Corpus', 'Mandamus', 'Prohibition', 'Certiorari'],
            correct_answer: 1,
            points: 10,
            explanation: 'Mandamus can be issued against both judicial and administrative authorities to compel performance of duty.',
            difficulty: 'hard',
          },
        ];
        
        setQuestions(demoQuestions);
        setUserAnswers(new Array(demoQuestions.length).fill(null));
        setIsLoading(false);
        return;
      }
      
      const result = await SupabaseService.getMissionContent(missionId as string, 'test');
      if (result.success && result.content.test_questions) {
        setQuestions(result.content.test_questions);
        setUserAnswers(new Array(result.content.test_questions.length).fill(null));
      }
    } catch (error) {
      console.error('Error loading test content:', error);
      Alert.alert('Error', 'Failed to load test questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResults) return;
    
    setSelectedAnswer(answerIndex);
    optionScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleTextAnswerChange = (text: string) => {
    setTextAnswer(text);
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    let answer: number | string;
    
    if (currentQuestion.question_type === 'mcq') {
      if (selectedAnswer === null) return;
      answer = selectedAnswer;
    } else {
      if (!textAnswer.trim()) return;
      answer = textAnswer.trim();
    }

    // Update user answers
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
    
    // Calculate score for MCQ questions
    if (currentQuestion.question_type === 'mcq' && selectedAnswer === currentQuestion.correct_answer) {
      setScore(prev => prev + currentQuestion.points);
    }
    
    // Move to next question or show results
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setTextAnswer('');
    } else {
      setShowResults(true);
    }
    
    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  };

  const handleCompleteTest = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
      const finalScore = Math.max(score, Math.round((score / totalPoints) * 100));
      
      await SupabaseService.updateProgress({
        mission_id: missionId as string,
        room_type: 'test',
        score: finalScore,
        max_score: 100,
        time_spent: timeSpent,
        completed: true,
      });

      // Track test completion and mission completion
      await SupabaseService.trackUserActivity(user.id, 'mission_completed', {
        missionId: missionId as string,
        finalScore,
        totalTimeSpent: timeSpent,
        questionsAnswered: questions.length
      });

      setIsCompleted(true);
      
      // Navigate to completion screen after delay
      setTimeout(() => {
        router.push({
          pathname: '/mission/completion',
          params: { 
            missionId,
            finalScore: finalScore.toString(),
            timeSpent: timeSpent.toString()
          },
        });
      }, 2000);
    } catch (error) {
      console.error('Error completing test:', error);
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
          <Text style={styles.loadingText}>Preparing your final test...</Text>
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
          <Text style={styles.errorText}>No test questions available</Text>
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
            colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
            style={styles.completionBadge}
          >
            <Award size={32} color={theme.colors.text.primary} />
            <Text style={styles.completionTitle}>Test Complete!</Text>
          </LinearGradient>
          
          <Text style={styles.scoreText}>Final Score: {percentage}%</Text>
          <Text style={styles.completionMessage}>
            Congratulations! You've completed all 4 learning rooms!
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (showResults) {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((score / totalPoints) * 100);
    
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
          theme.colors.background.tertiary,
        ]}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <MascotAvatar size={80} animated={true} glowing={true} mood="celebrating" />
              <Text style={styles.resultsTitle}>Test Results</Text>
              <Text style={styles.resultsScore}>{percentage}%</Text>
            </View>

            <View style={styles.resultsList}>
              {questions.map((question, index) => (
                <View key={question.id} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultQuestionNumber}>Q{index + 1}</Text>
                    <View style={styles.resultPoints}>
                      <Star size={16} color={theme.colors.accent.yellow} />
                      <Text style={styles.resultPointsText}>{question.points} pts</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.resultQuestion}>{question.question}</Text>
                  
                  {question.question_type === 'mcq' ? (
                    <View style={styles.resultAnswers}>
                      <Text style={styles.resultLabel}>Your answer:</Text>
                      <Text style={[
                        styles.resultAnswer,
                        userAnswers[index] === question.correct_answer ? styles.correctAnswer : styles.incorrectAnswer
                      ]}>
                        {question.options?.[userAnswers[index] as number] || 'No answer'}
                      </Text>
                      
                      {userAnswers[index] !== question.correct_answer && (
                        <>
                          <Text style={styles.resultLabel}>Correct answer:</Text>
                          <Text style={[styles.resultAnswer, styles.correctAnswer]}>
                            {question.options?.[question.correct_answer!]}
                          </Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <View style={styles.resultAnswers}>
                      <Text style={styles.resultLabel}>Your answer:</Text>
                      <Text style={styles.resultAnswer}>{userAnswers[index] as string || 'No answer'}</Text>
                    </View>
                  )}
                  
                  {question.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationTitle}>Explanation:</Text>
                      <Text style={styles.explanationText}>{question.explanation}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.completeButtonContainer}>
              <GradientButton
                title="Complete Mission"
                onPress={handleCompleteTest}
                size="large"
                fullWidth
                icon={<Trophy size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
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
          <Text style={styles.roomTitle}>🏆 Test Tower</Text>
          <Text style={styles.roomSubtitle}>Final assessment</Text>
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

              {currentQuestion.question_type === 'mcq' ? (
                <View style={styles.optionsContainer}>
                  {currentQuestion.options?.map((option, index) => (
                    <Animated.View key={index} style={optionAnimatedStyle}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          selectedAnswer === index && styles.selectedOption,
                        ]}
                        onPress={() => handleAnswerSelect(index)}
                      >
                        <View style={styles.optionContent}>
                          <View style={styles.optionNumber}>
                            <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
                          </View>
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              ) : (
                <View style={styles.textAnswerContainer}>
                  <Text style={styles.textAnswerLabel}>
                    {currentQuestion.question_type === 'short' ? 'Short Answer:' : 'Detailed Answer:'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textAnswerInput,
                      currentQuestion.question_type === 'long' && styles.longAnswerInput
                    ]}
                    placeholder="Type your answer here..."
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={textAnswer}
                    onChangeText={handleTextAnswerChange}
                    multiline={currentQuestion.question_type === 'long'}
                    numberOfLines={currentQuestion.question_type === 'long' ? 6 : 1}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Submit Button */}
      <View style={styles.actionContainer}>
        <GradientButton
          title={currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Test"}
          onPress={handleSubmitAnswer}
          size="large"
          fullWidth
          disabled={
            currentQuestion.question_type === 'mcq' 
              ? selectedAnswer === null 
              : !textAnswer.trim()
          }
          icon={<ArrowRight size={20} color={theme.colors.text.primary} />}
          colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
        />
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
    gap: theme.spacing.md,
  },
  questionText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    lineHeight: 26,
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
    fontSize: 12,
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
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
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
  textAnswerContainer: {
    gap: theme.spacing.md,
  },
  textAnswerLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  textAnswerInput: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
    padding: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    minHeight: 48,
  },
  longAnswerInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actionContainer: {
    paddingBottom: theme.spacing.xl,
  },
  resultsContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  resultsTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultsScore: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
  },
  resultsList: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  resultItem: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resultQuestionNumber: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  resultPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  resultPointsText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  resultQuestion: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  resultAnswers: {
    gap: theme.spacing.sm,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.secondary,
  },
  resultAnswer: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  correctAnswer: {
    backgroundColor: theme.colors.accent.green + '20',
    color: theme.colors.accent.green,
  },
  incorrectAnswer: {
    backgroundColor: theme.colors.accent.pink + '20',
    color: theme.colors.accent.pink,
  },
  explanationContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  explanationTitle: {
    fontSize: 14,
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
  completeButtonContainer: {
    marginTop: theme.spacing.lg,
  },
});