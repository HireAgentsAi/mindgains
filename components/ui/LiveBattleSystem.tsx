import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  withDelay,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Sword, Zap, Trophy, Star, Crown, Target, Clock, Users } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from './MascotAvatar';
import { ConfettiExplosion, ScreenShake, XPCollectionAnimation } from './DuolingoAnimations';

const { width, height } = Dimensions.get('window');

interface LiveBattleProps {
  battleId: string;
  onBattleComplete: (results: any) => void;
}

interface BattlePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  currentAnswer?: number;
  isReady: boolean;
  streak: number;
  powerUps: string[];
  reaction?: 'thinking' | 'confident' | 'celebrating' | 'disappointed';
}

interface BattleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  timeLimit: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function LiveBattleSystem({ battleId, onBattleComplete }: LiveBattleProps) {
  const [players, setPlayers] = useState<BattlePlayer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BattleQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [battlePhase, setBattlePhase] = useState<'waiting' | 'countdown' | 'question' | 'results' | 'complete'>('waiting');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [screenShake, setScreenShake] = useState(false);

  // Animation values
  const questionScale = useSharedValue(0.8);
  const questionOpacity = useSharedValue(0);
  const timerPulse = useSharedValue(1);
  const playerPositions = useSharedValue([0, 0, 0, 0]);
  const battleIntensity = useSharedValue(0);
  const countdownScale = useSharedValue(0);
  const answerButtonScales = [useSharedValue(1), useSharedValue(1), useSharedValue(1), useSharedValue(1)];

  // Realtime subscription
  const battleChannel = useRef<any>(null);

  useEffect(() => {
    initializeBattle();
    setupRealtimeSubscription();
    
    return () => {
      battleChannel.current?.unsubscribe();
    };
  }, [battleId]);

  useEffect(() => {
    if (battlePhase === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Pulse animation when time is running low
      if (timeLeft <= 10) {
        timerPulse.value = withSequence(
          withTiming(1.2, { duration: 200 }),
          withTiming(1, { duration: 200 })
        );
        
        if (Platform.OS !== 'web') {
          Vibration.vibrate(50);
        }
      }

      return () => clearTimeout(timer);
    }
  }, [timeLeft, battlePhase]);

  const initializeBattle = async () => {
    try {
      // Load battle data and questions
      const battleData = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'get_battle_data',
        battle_id: battleId,
      });

      if (battleData.success) {
        setPlayers(battleData.players);
        setCurrentQuestion(battleData.questions[0]);
        setBattlePhase('countdown');
        startCountdown();
      }
    } catch (error) {
      console.error('Error initializing battle:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    battleChannel.current = SupabaseService.supabase
      .channel(`battle_${battleId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'battle_participants',
          filter: `battle_room_id=eq.${battleId}`
        }, 
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();
  };

  const handleRealtimeUpdate = (payload: any) => {
    // Update player data in real-time
    if (payload.eventType === 'UPDATE') {
      setPlayers(prev => prev.map(player => 
        player.id === payload.new.user_id 
          ? { ...player, score: payload.new.current_score, currentAnswer: payload.new.current_answer }
          : player
      ));
      
      // Animate player position changes
      updatePlayerPositions();
    }
  };

  const startCountdown = () => {
    let count = 3;
    const countdownInterval = setInterval(() => {
      if (count > 0) {
        countdownScale.value = withSequence(
          withTiming(1.5, { duration: 200 }),
          withTiming(1, { duration: 300 })
        );
        count--;
      } else {
        clearInterval(countdownInterval);
        setBattlePhase('question');
        startQuestion();
      }
    }, 1000);
  };

  const startQuestion = () => {
    // Reset question animations
    questionOpacity.value = 0;
    questionScale.value = 0.8;
    
    // Animate question entrance
    questionOpacity.value = withTiming(1, { duration: 600 });
    questionScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Reset timer
    setTimeLeft(currentQuestion?.timeLimit || 30);
    setSelectedAnswer(null);
    setShowExplanation(false);
    
    // Increase battle intensity
    battleIntensity.value = withTiming(Math.min(questionIndex / 10, 1), { duration: 1000 });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || showExplanation) return;
    
    setSelectedAnswer(answerIndex);
    
    // Animate selected answer
    answerButtonScales[answerIndex].value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1.05, { damping: 12, stiffness: 150 }),
      withTiming(1, { duration: 200 })
    );
    
    // Submit answer
    submitAnswer(answerIndex);
  };

  const submitAnswer = async (answerIndex: number) => {
    try {
      const isCorrect = answerIndex === currentQuestion?.correctAnswer;
      const timeTaken = (currentQuestion?.timeLimit || 30) - timeLeft;
      
      // Submit to backend
      const result = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'submit_answer',
        battle_room_id: battleId,
        question_index: questionIndex,
        selected_answer: answerIndex,
        time_taken: timeTaken,
      });

      if (result.success) {
        // Show immediate feedback
        if (isCorrect) {
          setShowConfetti(true);
          setXpEarned(result.points_earned);
          setShowXPAnimation(true);
          
          if (Platform.OS !== 'web') {
            Vibration.vibrate([100, 50, 100]);
          }
        } else {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
          
          if (Platform.OS !== 'web') {
            Vibration.vibrate(200);
          }
        }
        
        // Show explanation after delay
        setTimeout(() => {
          setShowExplanation(true);
        }, 1500);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      // Auto-submit no answer
      submitAnswer(-1);
    }
  };

  const nextQuestion = () => {
    if (questionIndex < 9) { // 10 questions total
      setQuestionIndex(prev => prev + 1);
      // Load next question and restart
      loadNextQuestion();
    } else {
      completeBattle();
    }
  };

  const loadNextQuestion = async () => {
    try {
      const nextQuestionData = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'get_next_question',
        battle_room_id: battleId,
        question_index: questionIndex + 1,
      });

      if (nextQuestionData.success) {
        setCurrentQuestion(nextQuestionData.question);
        startQuestion();
      }
    } catch (error) {
      console.error('Error loading next question:', error);
    }
  };

  const completeBattle = async () => {
    try {
      setBattlePhase('complete');
      
      const results = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'complete_battle',
        battle_room_id: battleId,
      });

      if (results.success) {
        onBattleComplete(results);
      }
    } catch (error) {
      console.error('Error completing battle:', error);
    }
  };

  const updatePlayerPositions = () => {
    // Animate player rankings based on scores
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const newPositions = sortedPlayers.map((_, index) => index * 80);
    
    playerPositions.value = withSpring(newPositions, { damping: 15, stiffness: 100 });
  };

  // Animation styles
  const questionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionOpacity.value,
    transform: [{ scale: questionScale.value }],
  }));

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerPulse.value }],
  }));

  const battleBackgroundStyle = useAnimatedStyle(() => {
    const intensity = battleIntensity.value;
    return {
      backgroundColor: interpolate(
        intensity,
        [0, 1],
        [theme.colors.background.primary, theme.colors.accent.purple + '20']
      ),
    };
  });

  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  const renderCountdown = () => (
    <View style={styles.countdownOverlay}>
      <LinearGradient
        colors={[theme.colors.background.primary + 'CC', theme.colors.background.secondary + 'CC']}
        style={styles.countdownContainer}
      >
        <Animated.View style={[styles.countdownCircle, countdownAnimatedStyle]}>
          <Text style={styles.countdownText}>3</Text>
        </Animated.View>
        <Text style={styles.countdownLabel}>Battle begins...</Text>
      </LinearGradient>
    </View>
  );

  const renderQuestion = () => (
    <Animated.View style={[styles.questionContainer, questionAnimatedStyle]}>
      <LinearGradient
        colors={[theme.colors.background.card, theme.colors.background.secondary]}
        style={styles.questionCard}
      >
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <View style={styles.questionMeta}>
            <Text style={styles.questionNumber}>Q{questionIndex + 1}/10</Text>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{currentQuestion?.difficulty}</Text>
            </View>
          </View>
          
          <Animated.View style={[styles.timer, timerAnimatedStyle]}>
            <LinearGradient
              colors={timeLeft <= 10 ? [theme.colors.accent.pink, '#ff4444'] : [theme.colors.accent.blue, theme.colors.accent.cyan]}
              style={styles.timerGradient}
            >
              <Clock size={16} color={theme.colors.text.primary} />
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* Question Text */}
        <Text style={styles.questionText}>{currentQuestion?.question}</Text>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion?.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showResult = showExplanation;
            
            const animatedStyle = useAnimatedStyle(() => ({
              transform: [{ scale: answerButtonScales[index].value }],
            }));

            return (
              <Animated.View key={index} style={animatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    isSelected && styles.selectedOption,
                    showResult && isCorrect && styles.correctOption,
                    showResult && isSelected && !isCorrect && styles.incorrectOption,
                  ]}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLetter}>
                      <Text style={styles.optionLetterText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                    
                    {showResult && isCorrect && (
                      <View style={styles.resultIcon}>
                        <Star size={20} color={theme.colors.accent.green} />
                      </View>
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <View style={styles.resultIcon}>
                        <X size={20} color={theme.colors.accent.pink} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* Explanation */}
        {showExplanation && (
          <View style={styles.explanationContainer}>
            <LinearGradient
              colors={[theme.colors.accent.purple + '20', theme.colors.accent.blue + '20']}
              style={styles.explanationCard}
            >
              <View style={styles.explanationHeader}>
                <Target size={20} color={theme.colors.accent.purple} />
                <Text style={styles.explanationTitle}>Explanation</Text>
              </View>
              <Text style={styles.explanationText}>{currentQuestion?.explanation}</Text>
              
              <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
                <LinearGradient
                  colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>Next Question</Text>
                  <Zap size={16} color={theme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  const renderPlayers = () => (
    <View style={styles.playersContainer}>
      {players.map((player, index) => (
        <PlayerAvatar
          key={player.id}
          player={player}
          position={index}
          isCurrentUser={player.id === 'current_user'} // You'd get this from auth
        />
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.container, battleBackgroundStyle]}>
      {/* Battle Particles Background */}
      <View style={styles.particlesContainer}>
        {[...Array(20)].map((_, index) => (
          <BattleParticle key={index} index={index} />
        ))}
      </View>

      {/* Screen Shake Effect */}
      <ScreenShake trigger={screenShake} />

      {/* Players Display */}
      {renderPlayers()}

      {/* Battle Content */}
      {battlePhase === 'countdown' && renderCountdown()}
      {battlePhase === 'question' && renderQuestion()}

      {/* Confetti Effect */}
      <ConfettiExplosion 
        visible={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* XP Animation */}
      <XPCollectionAnimation
        visible={showXPAnimation}
        amount={xpEarned}
        onComplete={() => setShowXPAnimation(false)}
      />
    </Animated.View>
  );
}

function PlayerAvatar({ player, position, isCurrentUser }: {
  player: BattlePlayer;
  position: number;
  isCurrentUser: boolean;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (player.reaction) {
      switch (player.reaction) {
        case 'celebrating':
          scale.value = withSequence(
            withSpring(1.3, { damping: 10, stiffness: 100 }),
            withSpring(1, { damping: 15, stiffness: 100 })
          );
          glow.value = withSequence(
            withTiming(1, { duration: 500 }),
            withTiming(0, { duration: 500 })
          );
          break;
        case 'disappointed':
          scale.value = withSequence(
            withTiming(0.9, { duration: 200 }),
            withSpring(1, { damping: 15, stiffness: 100 })
          );
          break;
      }
    }
  }, [player.reaction]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: 0.2 + glow.value * 0.5,
    shadowRadius: 10 + glow.value * 20,
  }));

  return (
    <Animated.View style={[styles.playerContainer, animatedStyle]}>
      <LinearGradient
        colors={
          isCurrentUser
            ? [theme.colors.accent.purple, theme.colors.accent.blue]
            : [theme.colors.background.card, theme.colors.background.secondary]
        }
        style={[styles.playerCard, isCurrentUser && styles.currentPlayerCard]}
      >
        <MascotAvatar 
          size={40} 
          mood={player.reaction || 'focused'} 
          animated={true}
        />
        
        <Text style={styles.playerName} numberOfLines={1}>
          {player.name}
        </Text>
        
        <View style={styles.playerScore}>
          <Trophy size={12} color={theme.colors.accent.gold} />
          <Text style={styles.scoreText}>{player.score}</Text>
        </View>
        
        {player.streak > 0 && (
          <View style={styles.streakIndicator}>
            <Text style={styles.streakText}>🔥{player.streak}</Text>
          </View>
        )}
        
        {player.powerUps.length > 0 && (
          <View style={styles.powerUpIndicator}>
            <Text style={styles.powerUpText}>⚡</Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function BattleParticle({ index }: { index: number }) {
  const translateY = useSharedValue(Math.random() * height);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0.1 + Math.random() * 0.2);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withTiming(
        translateY.value - 100 - Math.random() * 200, 
        { duration: 8000 + Math.random() * 4000, easing: Easing.linear }
      );
      
      opacity.value = withSequence(
        withTiming(0.3, { duration: 2000 }),
        withTiming(0, { duration: 4000 })
      );
    };
    
    const timer = setTimeout(startAnimation, index * 200);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const icons = ['⚔️', '🏆', '⚡', '🔥', '💎', '👑'];
  const icon = icons[index % icons.length];

  return (
    <Animated.View style={[styles.particle, animatedStyle]}>
      <Text style={styles.particleText}>{icon}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
  },
  particleText: {
    fontSize: 16,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  playerContainer: {
    alignItems: 'center',
    shadowColor: theme.colors.accent.purple,
    shadowOffset: { width: 0, height: 4 },
  },
  playerCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    minWidth: 80,
  },
  currentPlayerCard: {
    borderColor: theme.colors.accent.purple,
    borderWidth: 2,
  },
  playerName: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  playerScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.gold,
  },
  streakIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.accent.yellow,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 10,
    color: theme.colors.text.primary,
  },
  powerUpIndicator: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: theme.colors.accent.cyan,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  powerUpText: {
    fontSize: 10,
  },
  countdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  countdownContainer: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  countdownText: {
    fontSize: 48,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  countdownLabel: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  questionCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  questionNumber: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.purple,
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
  timer: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  timerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  timerText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  questionText: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: theme.spacing.xl,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
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
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  explanationContainer: {
    marginTop: theme.spacing.lg,
  },
  explanationCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  explanationTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.purple,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  nextButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
});