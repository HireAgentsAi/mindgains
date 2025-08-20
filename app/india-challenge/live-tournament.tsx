import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { supabaseService } from '@/utils/supabaseService';

const { width, height } = Dimensions.get('window');

interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  time_limit: number;
}

interface LiveStats {
  totalParticipants: number;
  currentRank: number;
  stateRank: number;
  leadingState: string;
  score: number;
}

export default function LiveTournament() {
  const params = useLocalSearchParams();
  const challengeId = params.challengeId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    totalParticipants: 125000,
    currentRank: 1250,
    stateRank: 45,
    leadingState: 'Maharashtra',
    score: 0
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [tournamentComplete, setTournamentComplete] = useState(false);

  // Animations
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rankAnim = useRef(new Animated.Value(0)).current;
  const correctAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadChallengeQuestions();
    startTimer();
    startAnimations();
    
    return () => {
      // Cleanup timers
    };
  }, []);

  const startAnimations = () => {
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000, // 30 seconds
      useNativeDriver: false,
    }).start();

    // Live indicator pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadChallengeQuestions = async () => {
    try {
      const challenge = await supabaseService.makeAIRequest('get_daily_challenge', {
        challenge_id: challengeId
      });
      
      if (challenge.questions) {
        setQuestions(challenge.questions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isAnswered) {
            submitAnswer(-1); // Auto-submit wrong answer
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset progress animation for each question
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();
  };

  const selectAnswer = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    // Stop the timer
    setTimeLeft(0);
    
    // Animate selection
    Animated.spring(correctAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    // Submit answer after short delay
    setTimeout(() => {
      submitAnswer(answerIndex);
    }, 1000);
  };

  const submitAnswer = async (answerIndex: number) => {
    try {
      const result = await supabaseService.makeAIRequest('submit_challenge_answer', {
        challenge_id: challengeId,
        question_index: currentQuestionIndex,
        selected_answer: answerIndex,
        time_taken: 30 - timeLeft
      });

      if (result.isCorrect) {
        setScore(prev => prev + result.points_earned);
        // Animate score increase
        Animated.sequence([
          Animated.timing(rankAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(rankAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }

      setShowExplanation(true);
      
      // Update live stats (simulate real-time updates)
      setLiveStats(prev => ({
        ...prev,
        currentRank: Math.max(1, prev.currentRank - (result.isCorrect ? 50 : 0)),
        stateRank: Math.max(1, prev.stateRank - (result.isCorrect ? 5 : 0)),
        score: score + (result.isCorrect ? 10 : 0)
      }));

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex >= questions.length - 1) {
      completeTournament();
      return;
    }

    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setTimeLeft(30);
    correctAnim.setValue(0);
    
    startTimer();
  };

  const completeTournament = () => {
    setTournamentComplete(true);
    // Calculate final results and show celebration
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (tournamentComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          style={styles.completionContainer}
        >
          <View style={styles.celebrationCard}>
            <FontAwesome5 name="trophy" size={64} color={theme.colors.accent.gold} solid />
            <Text style={styles.celebrationTitle}>🎉 Tournament Complete!</Text>
            
            <View style={styles.finalStats}>
              <Text style={styles.finalScore}>Final Score: {score}</Text>
              <Text style={styles.finalRank}>India Rank: #{liveStats.currentRank}</Text>
              <Text style={styles.finalRank}>State Rank: #{liveStats.stateRank}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => router.push('/india-challenge')}
            >
              <Text style={styles.homeButtonText}>View Results</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          style={styles.loadingContainer}
        >
          <FontAwesome5 name="spinner" size={48} color={theme.colors.accent.purple} />
          <Text style={styles.loadingText}>Loading Challenge...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background.primary} barStyle="light-content" />
      
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.background}
      >
        {/* Header with Live Stats */}
        <View style={styles.header}>
          <View style={styles.liveIndicator}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <FontAwesome5 name="circle" size={8} color={theme.colors.status.online} solid />
            </Animated.View>
            <Text style={styles.liveText}>LIVE</Text>
            <Text style={styles.participantsText}>{liveStats.totalParticipants.toLocaleString()} playing</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={() => router.back()}
          >
            <FontAwesome5 name="times" size={16} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        {/* Question Counter */}
        <View style={styles.questionCounter}>
          <Text style={styles.questionNumber}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
          <View style={styles.scoreContainer}>
            <Animated.View style={{ transform: [{ scale: rankAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }] }}>
              <FontAwesome5 name="star" size={16} color={theme.colors.accent.gold} solid />
            </Animated.View>
            <Text style={styles.scoreText}>{score}</Text>
          </View>
        </View>

        {/* Live Rankings */}
        <View style={styles.liveRankings}>
          <View style={styles.rankItem}>
            <FontAwesome5 name="globe-asia" size={12} color={theme.colors.accent.blue} solid />
            <Text style={styles.rankText}>India: #{liveStats.currentRank}</Text>
          </View>
          <View style={styles.rankItem}>
            <FontAwesome5 name="flag" size={12} color={theme.colors.accent.green} solid />
            <Text style={styles.rankText}>State: #{liveStats.stateRank}</Text>
          </View>
          <View style={styles.rankItem}>
            <FontAwesome5 name="crown" size={12} color={theme.colors.accent.gold} solid />
            <Text style={styles.rankText}>{liveStats.leadingState} leads!</Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correct_answer;
              const showResult = isAnswered;
              
              let buttonStyle = [styles.optionButton];
              let textStyle = [styles.optionText];
              
              if (showResult) {
                if (isCorrect) {
                  buttonStyle.push(styles.correctOption);
                  textStyle.push(styles.correctOptionText);
                } else if (isSelected && !isCorrect) {
                  buttonStyle.push(styles.wrongOption);
                  textStyle.push(styles.wrongOptionText);
                }
              } else if (isSelected) {
                buttonStyle.push(styles.selectedOption);
              }
              
              return (
                <TouchableOpacity
                  key={index}
                  style={buttonStyle}
                  onPress={() => selectAnswer(index)}
                  disabled={isAnswered}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLetter}>
                      <Text style={styles.optionLetterText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={textStyle}>{option}</Text>
                    {showResult && isCorrect && (
                      <FontAwesome5 name="check" size={16} color={theme.colors.accent.green} solid />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <FontAwesome5 name="times" size={16} color={theme.colors.gradient.error[0]} solid />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Explanation Modal */}
        <Modal visible={showExplanation} transparent animationType="fade">
          <View style={styles.explanationOverlay}>
            <View style={styles.explanationModal}>
              <LinearGradient
                colors={[theme.colors.background.card, theme.colors.background.tertiary]}
                style={styles.explanationContent}
              >
                <View style={styles.resultHeader}>
                  {selectedAnswer === currentQuestion.correct_answer ? (
                    <>
                      <FontAwesome5 name="check-circle" size={32} color={theme.colors.accent.green} solid />
                      <Text style={styles.resultTitle}>Correct! 🎉</Text>
                      <Text style={styles.pointsEarned}>+10 points</Text>
                    </>
                  ) : (
                    <>
                      <FontAwesome5 name="times-circle" size={32} color={theme.colors.gradient.error[0]} solid />
                      <Text style={styles.resultTitle}>Incorrect 😔</Text>
                      <Text style={styles.pointsEarned}>+0 points</Text>
                    </>
                  )}
                </View>
                
                <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                
                <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentQuestionIndex >= questions.length - 1 ? 'Finish' : 'Next Question'}
                    </Text>
                    <FontAwesome5 name="arrow-right" size={16} color={theme.colors.text.primary} solid />
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.status.online,
    marginLeft: 6,
  },
  participantsText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginLeft: 8,
  },
  exitButton: {
    padding: 8,
  },
  progressContainer: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    marginHorizontal: 20,
    borderRadius: 2,
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.accent.purple,
    borderRadius: 2,
  },
  timerText: {
    position: 'absolute',
    right: -40,
    top: -8,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  questionCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.accent.gold,
    marginLeft: 6,
  },
  liveRankings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.card + '40',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    lineHeight: 28,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.border.primary,
  },
  selectedOption: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: theme.colors.accent.purple + '10',
  },
  correctOption: {
    borderColor: theme.colors.accent.green,
    backgroundColor: theme.colors.accent.green + '10',
  },
  wrongOption: {
    borderColor: theme.colors.gradient.error[0],
    backgroundColor: theme.colors.gradient.error[0] + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  correctOptionText: {
    color: theme.colors.accent.green,
    fontWeight: '600',
  },
  wrongOptionText: {
    color: theme.colors.gradient.error[0],
  },
  explanationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  explanationModal: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  explanationContent: {
    padding: 24,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 12,
  },
  pointsEarned: {
    fontSize: 16,
    color: theme.colors.accent.gold,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 24,
  },
  finalStats: {
    alignItems: 'center',
    marginBottom: 24,
  },
  finalScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.accent.gold,
    marginBottom: 8,
  },
  finalRank: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  homeButton: {
    backgroundColor: theme.colors.accent.purple,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});