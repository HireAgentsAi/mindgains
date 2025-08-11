import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { ChevronLeft, Trophy, Star, Clock, Target, CircleCheck as CheckCircle, X, Brain, Share2, Chrome as Home, TrendingUp, Award } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

export default function DailyQuizResultsScreen() {
  const params = useLocalSearchParams();
  const { attemptId, results: resultsParam, quizDate } = params;
  
  const [results, setResults] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const questionsOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(1);

  useEffect(() => {
    loadResults();
    
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    scoreScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    statsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    questionsOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    
    // Mascot celebration
    mascotScale.value = withSequence(
      withDelay(1200, withTiming(1.2, { duration: 300 })),
      withTiming(1, { duration: 300 })
    );
  }, []);

  const loadResults = async () => {
    try {
      if (resultsParam) {
        // Results passed from previous screen
        const parsedResults = JSON.parse(resultsParam as string);
        setResults(parsedResults);
        setIsLoading(false);
        return;
      }

      if (attemptId) {
        // Load results from database
        const user = await SupabaseService.getCurrentUser();
        if (!user) {
          router.replace('/auth');
          return;
        }

        // Get attempt details
        const { data: attempt, error } = await supabase
          .from('daily_quiz_attempts')
          .select('*')
          .eq('id', attemptId)
          .eq('user_id', user.id)
          .single();

        if (error || !attempt) {
          throw new Error('Quiz attempt not found');
        }

        setResults({
          correct_answers: attempt.correct_answers,
          total_questions: attempt.total_questions,
          score_percentage: attempt.score_percentage,
          total_points: attempt.total_points,
          time_spent: attempt.time_spent,
          detailed_results: attempt.answers
        });

        // Get fresh recommendations
        const recs = await SupabaseService.getMascotRecommendations(user.id);
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Error loading results:', error);
      Alert.alert('Error', 'Failed to load quiz results');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!results) return;
    
    const shareText = `🏆 Just scored ${results.score_percentage}% on today's MindGains AI Daily Quiz!

📊 Results:
✅ ${results.correct_answers}/${results.total_questions} correct
⏱️ Completed in ${Math.round(results.time_spent / 60)} minutes
⭐ ${results.total_points} points earned

Join India's #1 AI learning platform:
📱 Download: https://mindgains.ai
🎯 UPSC • JEE • NEET • Banking • SSC

#MindGainsAI #DailyQuiz #CompetitiveExams #StudySuccess`;

    try {
      await Share.share({
        message: shareText,
        title: 'MindGains AI Daily Quiz Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return theme.colors.accent.green;
    if (percentage >= 70) return theme.colors.accent.cyan;
    if (percentage >= 50) return theme.colors.accent.blue;
    return theme.colors.accent.pink;
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return "Outstanding! You're a true scholar! 🌟";
    if (percentage >= 70) return "Excellent work! Keep it up! 💪";
    if (percentage >= 50) return "Good job! Room for improvement! 📚";
    return "Keep practicing! You'll get better! 🎯";
  };

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
    opacity: scoreScale.value,
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: (1 - statsOpacity.value) * 20 }],
  }));

  const questionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: questionsOpacity.value,
    transform: [{ translateY: (1 - questionsOpacity.value) * 30 }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
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
          <Text style={styles.loadingText}>Loading your results...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!results) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Results not found</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

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
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
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
          <Text style={styles.headerTitle}>📅 Daily Quiz Results</Text>
          <Text style={styles.headerSubtitle}>{quizDate || 'Today'}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.shareButtonGradient}
          >
            <Share2 size={20} color={theme.colors.accent.cyan} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Score Display */}
        <Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
          <Animated.View style={mascotAnimatedStyle}>
            <MascotAvatar
              size={100}
              animated={true}
              glowing={true}
              mood="celebrating"
            />
          </Animated.View>
          
          <LinearGradient
            colors={[getScoreColor(results.score_percentage), getScoreColor(results.score_percentage) + '80']}
            style={styles.scoreBadge}
          >
            <Trophy size={32} color={theme.colors.text.primary} />
            <Text style={styles.scoreValue}>{results.score_percentage}%</Text>
          </LinearGradient>
          
          <Text style={styles.scoreMessage}>
            {getPerformanceMessage(results.score_percentage)}
          </Text>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              icon={<CheckCircle size={24} color={theme.colors.text.primary} />}
              title="Correct"
              value={results.correct_answers.toString()}
              color={theme.colors.accent.green}
            />
            
            <StatCard
              icon={<X size={24} color={theme.colors.text.primary} />}
              title="Incorrect"
              value={(results.total_questions - results.correct_answers).toString()}
              color={theme.colors.accent.pink}
            />
            
            <StatCard
              icon={<Clock size={24} color={theme.colors.text.primary} />}
              title="Time"
              value={`${Math.round(results.time_spent / 60)}m`}
              color={theme.colors.accent.blue}
            />
            
            <StatCard
              icon={<Star size={24} color={theme.colors.text.primary} />}
              title="Points"
              value={results.total_points.toString()}
              color={theme.colors.accent.yellow}
            />
          </View>
        </Animated.View>

        {/* Subject Performance */}
        <Animated.View style={[styles.subjectPerformanceContainer, statsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Subject Performance</Text>
          
          <View style={styles.subjectPerformanceList}>
            {getSubjectPerformance(results.detailed_results).map((subject, index) => (
              <SubjectPerformanceCard key={subject.name} subject={subject} index={index} />
            ))}
          </View>
        </Animated.View>

        {/* Mascot Recommendations */}
        {recommendations.length > 0 && (
          <Animated.View style={[styles.recommendationsContainer, questionsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>Twizzle's Recommendations</Text>
            
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.recommendationsCard}
            >
              <View style={styles.recommendationsHeader}>
                <MascotAvatar size={50} animated={true} mood="happy" />
                <Text style={styles.recommendationsTitle}>Study Tips for You</Text>
              </View>
              
              <View style={styles.recommendationsList}>
                {recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Brain size={16} color={theme.colors.accent.purple} />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Detailed Question Review */}
        <Animated.View style={[styles.questionsContainer, questionsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Question Review</Text>
          
          <View style={styles.questionsList}>
            {results.detailed_results.map((result: any, index: number) => (
              <QuestionResultCard key={index} result={result} index={index} />
            ))}
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <GradientButton
            title="Back to Home"
            onPress={() => router.replace('/(tabs)')}
            size="large"
            fullWidth
            icon={<Home size={20} color={theme.colors.text.primary} />}
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.actionButton}
          />
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.shareButtonGradient}
            >
              <Share2 size={20} color={theme.colors.accent.cyan} />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function StatCard({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) {
  return (
    <LinearGradient
      colors={[color + '20', color + '10']}
      style={styles.statCard}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '30' }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );
}

function SubjectPerformanceCard({ subject, index }: {
  subject: { name: string; correct: number; total: number; percentage: number };
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 150);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getSubjectColor = (name: string) => {
    const colors: Record<string, string> = {
      'History': theme.colors.accent.purple,
      'Polity': theme.colors.accent.blue,
      'Geography': theme.colors.accent.green,
      'Economy': theme.colors.accent.yellow,
      'Science & Technology': theme.colors.accent.cyan,
      'Current Affairs': theme.colors.accent.pink,
    };
    return colors[name] || theme.colors.accent.purple;
  };

  return (
    <Animated.View style={[styles.subjectCard, animatedStyle]}>
      <LinearGradient
        colors={[getSubjectColor(subject.name) + '20', getSubjectColor(subject.name) + '10']}
        style={styles.subjectCardGradient}
      >
        <View style={styles.subjectHeader}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <Text style={[styles.subjectPercentage, { color: getSubjectColor(subject.name) }]}>
            {subject.percentage}%
          </Text>
        </View>
        
        <Text style={styles.subjectScore}>
          {subject.correct}/{subject.total} correct
        </Text>
        
        <View style={styles.subjectProgressBar}>
          <LinearGradient
            colors={[getSubjectColor(subject.name), getSubjectColor(subject.name) + '80']}
            style={[styles.subjectProgressFill, { width: `${subject.percentage}%` }]}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function QuestionResultCard({ result, index }: {
  result: any;
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 100);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.questionCard, animatedStyle]}>
      <LinearGradient
        colors={[
          theme.colors.background.card,
          theme.colors.background.secondary,
        ]}
        style={styles.questionCardGradient}
      >
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>Q{index + 1}</Text>
          </View>
          
          <View style={styles.questionMeta}>
            <View style={[
              styles.resultIndicator,
              { backgroundColor: result.is_correct ? theme.colors.accent.green + '20' : theme.colors.accent.pink + '20' }
            ]}>
              {result.is_correct ? (
                <CheckCircle size={16} color={theme.colors.accent.green} />
              ) : (
                <X size={16} color={theme.colors.accent.pink} />
              )}
            </View>
            
            <Text style={styles.subjectTag}>{result.subject}</Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{result.question}</Text>
        
        <View style={styles.answersSection}>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Your answer:</Text>
            <Text style={[
              styles.answerText,
              result.is_correct ? styles.correctAnswerText : styles.incorrectAnswerText
            ]}>
              {result.user_answer !== -1 && result.user_answer < 4 
                ? String.fromCharCode(65 + result.user_answer) + '. ' + (result.options?.[result.user_answer] || 'No answer')
                : 'No answer'
              }
            </Text>
          </View>
          
          {!result.is_correct && (
            <View style={styles.answerRow}>
              <Text style={styles.answerLabel}>Correct answer:</Text>
              <Text style={styles.correctAnswerText}>
                {String.fromCharCode(65 + result.correct_answer)}. {result.options?.[result.correct_answer]}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.explanationContainer}>
          <View style={styles.explanationHeader}>
            <Brain size={16} color={theme.colors.accent.purple} />
            <Text style={styles.explanationTitle}>Explanation</Text>
          </View>
          <Text style={styles.explanationText}>{result.explanation}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function getSubjectPerformance(detailedResults: any[]) {
  const subjectStats: Record<string, { correct: number; total: number }> = {};
  
  detailedResults.forEach(result => {
    if (!subjectStats[result.subject]) {
      subjectStats[result.subject] = { correct: 0, total: 0 };
    }
    subjectStats[result.subject].total++;
    if (result.is_correct) {
      subjectStats[result.subject].correct++;
    }
  });
  
  return Object.entries(subjectStats).map(([name, stats]) => ({
    name,
    correct: stats.correct,
    total: stats.total,
    percentage: Math.round((stats.correct / stats.total) * 100)
  }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  shareButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  scoreValue: {
    fontSize: 32,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  scoreMessage: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  subjectPerformanceContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  subjectPerformanceList: {
    gap: theme.spacing.md,
  },
  subjectCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  subjectCardGradient: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  subjectName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  subjectPercentage: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
  },
  subjectScore: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  subjectProgressBar: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  recommendationsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  recommendationsCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  recommendationsList: {
    gap: theme.spacing.md,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  questionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  questionsList: {
    gap: theme.spacing.lg,
  },
  questionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  questionCardGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  resultIndicator: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectTag: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  questionText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  answersSection: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  answerRow: {
    gap: theme.spacing.xs,
  },
  answerLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.secondary,
  },
  answerText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  correctAnswerText: {
    backgroundColor: theme.colors.accent.green + '20',
    color: theme.colors.accent.green,
  },
  incorrectAnswerText: {
    backgroundColor: theme.colors.accent.pink + '20',
    color: theme.colors.accent.pink,
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
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  explanationText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.cyan,
  },
  bottomSpacing: {
    height: 20,
  },
});