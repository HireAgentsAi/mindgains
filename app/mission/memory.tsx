import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  interpolate,
} from 'react-native-reanimated';
import { Brain, RotateCcw, ArrowRight, Trophy, Zap } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

export default function MemoryForgeScreen() {
  const params = useLocalSearchParams();
  const { missionId } = params;
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const cardOpacity = useSharedValue(0);
  const cardRotateY = useSharedValue(0);
  const mascotScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    loadMemoryContent();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [missionId]);

  useEffect(() => {
    if (flashcards.length > 0) {
      cardOpacity.value = withTiming(1, { duration: 800 });
    }
  }, [flashcards]);

  const loadMemoryContent = async () => {
    try {
      // Check if Supabase is configured or if it's a demo mission
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || (missionId as string).startsWith('demo_')) {
        // Use demo flashcards
        const demoFlashcards: Flashcard[] = [
          {
            id: 'f1',
            front: 'Article 14',
            back: 'Right to Equality - Equality before law and equal protection of laws',
            category: 'Fundamental Rights',
            difficulty: 'medium',
            hint: 'This article applies to all persons, not just citizens',
          },
          {
            id: 'f2',
            front: 'Article 19',
            back: 'Six fundamental freedoms including speech, assembly, and movement',
            category: 'Fundamental Rights',
            difficulty: 'medium',
            hint: 'Only available to citizens of India',
          },
          {
            id: 'f3',
            front: 'Habeas Corpus',
            back: 'Writ against illegal detention - "produce the body"',
            category: 'Writs',
            difficulty: 'hard',
            hint: 'Latin term meaning "you may have the body"',
          },
          {
            id: 'f4',
            front: 'Article 21',
            back: 'Right to Life and Personal Liberty - most important fundamental right',
            category: 'Fundamental Rights',
            difficulty: 'easy',
            hint: 'Expanded through judicial interpretation',
          },
          {
            id: 'f5',
            front: 'Article 32',
            back: 'Right to Constitutional Remedies - "Heart and Soul" of Constitution',
            category: 'Fundamental Rights',
            difficulty: 'medium',
            hint: 'Dr. Ambedkar called it the heart and soul',
          },
        ];
        
        setFlashcards(demoFlashcards);
        setIsLoading(false);
        return;
      }
      
      const result = await SupabaseService.getMissionContent(missionId as string, 'memory');
      if (result.success && result.content.flashcards) {
        setFlashcards(result.content.flashcards);
      }
    } catch (error) {
      console.error('Error loading memory content:', error);
      Alert.alert('Error', 'Failed to load flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlipCard = () => {
    cardRotateY.value = withSequence(
      withTiming(90, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );
    
    setTimeout(() => {
      setIsFlipped(!isFlipped);
    }, 200);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    // Button animation
    buttonScale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );

    // Move to next card or complete
    setTimeout(() => {
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setIsFlipped(false);
        cardRotateY.value = 0;
      } else {
        completeMemorySession();
      }
    }, 500);
  };

  const completeMemorySession = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      const totalCards = flashcards.length;
      const score = Math.round((correctCount / totalCards) * 100);
      
      await SupabaseService.updateProgress({
        mission_id: missionId as string,
        room_type: 'memory',
        score,
        max_score: 100,
        time_spent: timeSpent,
        completed: true,
      });

      // Track memory session completion
      await SupabaseService.trackUserActivity(user.id, 'room_completed', {
        missionId: missionId as string,
        roomType: 'memory',
        correctCount,
        totalCards,
        accuracy: score,
        timeSpent
      });

      setIsCompleted(true);
      
      // Navigate to test room after delay
      setTimeout(() => {
        router.push({
          pathname: '/mission/test',
          params: { missionId },
        });
      }, 2000);
    } catch (error) {
      console.error('Error completing memory session:', error);
      Alert.alert('Error', 'Failed to save progress');
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      {
        rotateY: `${cardRotateY.value}deg`,
      },
    ],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
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
          <Text style={styles.loadingText}>Preparing flashcards...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (flashcards.length === 0) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No flashcards available</Text>
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
    const accuracy = Math.round((correctCount / flashcards.length) * 100);
    
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
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.completionBadge}
          >
            <Brain size={32} color={theme.colors.text.primary} />
            <Text style={styles.completionTitle}>Memory Forged!</Text>
          </LinearGradient>
          
          <Text style={styles.scoreText}>{accuracy}% accuracy</Text>
          <Text style={styles.completionMessage}>
            Excellent memory work! Ready for the final test?
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const currentCard = flashcards[currentCardIndex];
  const progress = ((currentCardIndex + 1) / flashcards.length) * 100;

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
          <Text style={styles.roomTitle}>🧠 Memory Forge</Text>
          <Text style={styles.roomSubtitle}>Strengthen your recall</Text>
        </View>
      </View>

      {/* Progress and Stats */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Card {currentCardIndex + 1} of {flashcards.length}
          </Text>
          <View style={styles.statsContainer}>
            <Text style={styles.correctText}>✓ {correctCount}</Text>
            <Text style={styles.incorrectText}>✗ {incorrectCount}</Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={theme.colors.gradient.primary}
            style={[styles.progressFill, { width: `${progress}%` }]}
          />
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <Animated.View style={[styles.flashcard, cardAnimatedStyle]}>
          <TouchableOpacity
            style={styles.cardTouchable}
            onPress={handleFlipCard}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[
                theme.colors.background.card,
                theme.colors.background.secondary,
              ]}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>
                  {isFlipped ? 'Answer' : 'Question'}
                </Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{currentCard.difficulty}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardText}>
                  {isFlipped ? currentCard.back : currentCard.front}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <RotateCcw size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.flipHint}>Tap to flip</Text>
              </View>

              {currentCard.hint && !isFlipped && (
                <View style={styles.hintContainer}>
                  <Text style={styles.hintLabel}>Hint:</Text>
                  <Text style={styles.hintText}>{currentCard.hint}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Answer Buttons */}
      {isFlipped && (
        <View style={styles.answerContainer}>
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={styles.answerButton}
              onPress={() => handleAnswer(false)}
            >
              <LinearGradient
                colors={[theme.colors.accent.pink, '#ff6b6b']}
                style={styles.answerButtonGradient}
              >
                <Text style={styles.answerButtonText}>Need More Practice</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={styles.answerButton}
              onPress={() => handleAnswer(true)}
            >
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.answerButtonGradient}
              >
                <Text style={styles.answerButtonText}>Got It!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Instructions */}
      {!isFlipped && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Read the question, think of your answer, then tap to reveal
          </Text>
        </View>
      )}
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
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  correctText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.green,
  },
  incorrectText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.pink,
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
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  flashcard: {
    width: '100%',
    height: 400,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cardType: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
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
  cardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  flipHint: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  hintContainer: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  hintLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.yellow,
    marginBottom: theme.spacing.xs,
  },
  hintText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  answerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  answerButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  answerButtonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  answerButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  instructionsContainer: {
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
  },
});