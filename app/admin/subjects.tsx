import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ChevronLeft, Settings, RefreshCw, Database, Users, ChartBar as BarChart3, Crown, Zap, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Target, BookOpen } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface SubjectStats {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalTopics: number;
  totalQuestions: number;
  questionsPerTopic: number;
  lastGenerated?: string;
}

export default function SubjectsAdminScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingSubject, setCurrentGeneratingSubject] = useState('');
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);

  useEffect(() => {
    checkAdminAccess();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      
      if (!user || user.email !== 'ragularvind84@gmail.com') {
        Alert.alert(
          'Access Denied',
          'This panel is only accessible to administrators.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setIsAdmin(true);
      await loadSubjectStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadSubjectStats = async () => {
    try {
      const subjects = await SupabaseService.getIndianSubjects();
      
      const statsPromises = subjects.map(async (subject) => {
        const topics = await SupabaseService.getSubjectTopics(subject.id);
        
        let totalQuestions = 0;
        for (const topic of topics) {
          const questions = await SupabaseService.getTopicQuestions(topic.id);
          totalQuestions += questions.length;
        }
        
        return {
          id: subject.id,
          name: subject.name,
          icon: subject.icon,
          color: subject.color,
          totalTopics: topics.length,
          totalQuestions,
          questionsPerTopic: topics.length > 0 ? Math.round(totalQuestions / topics.length) : 0,
          lastGenerated: subject.updated_at
        };
      });
      
      const stats = await Promise.all(statsPromises);
      setSubjectStats(stats);
    } catch (error) {
      console.error('Error loading subject stats:', error);
    }
  };

  const handleGenerateAllQuestions = async () => {
    Alert.alert(
      'Generate All Questions',
      'This will generate 20 AI-powered questions for each topic across all subjects. This may take several minutes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGenerating(true);
            setGenerationProgress(0);
            
            try {
              await SupabaseService.generateAllTopicQuestions(
                (progress, topic) => {
                  setGenerationProgress(progress);
                  setCurrentGeneratingSubject(topic);
                }
              );
              
              Alert.alert('Success', 'All questions have been generated successfully!');
              await loadSubjectStats();
            } catch (error) {
              console.error('Error generating questions:', error);
              Alert.alert('Error', 'Failed to generate questions. Please try again.');
            } finally {
              setIsGenerating(false);
              setGenerationProgress(0);
              setCurrentGeneratingSubject('');
            }
          }
        }
      ]
    );
  };

  const handleGenerateSubjectQuestions = async (subjectName: string) => {
    Alert.alert(
      `Generate ${subjectName} Questions`,
      `This will generate fresh questions for all topics in ${subjectName}. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGenerating(true);
            setCurrentGeneratingSubject(subjectName);
            
            try {
              await SupabaseService.regenerateSubjectQuestions(subjectName);
              Alert.alert('Success', `${subjectName} questions generated successfully!`);
              await loadSubjectStats();
            } catch (error) {
              console.error('Error generating subject questions:', error);
              Alert.alert('Error', `Failed to generate ${subjectName} questions.`);
            } finally {
              setIsGenerating(false);
              setCurrentGeneratingSubject('');
            }
          }
        }
      ]
    );
  };

  const handleValidateDailyQuiz = async () => {
    try {
      setIsLoading(true);
      const validation = await SupabaseService.validateDailyQuiz();
      
      Alert.alert(
        'Quiz Validation Complete',
        `Quality Score: ${validation.validation.overall_quality}/100\n` +
        `Status: ${validation.quiz_approved ? 'Approved ✅' : 'Needs Review ⚠️'}\n\n` +
        `Recommendations:\n${validation.recommendations.join('\n')}`
      );
    } catch (error) {
      console.error('Error validating quiz:', error);
      Alert.alert('Error', 'Failed to validate daily quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
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
          <Text style={styles.loadingText}>Loading subjects admin panel...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const totalQuestions = subjectStats.reduce((sum, s) => sum + s.totalQuestions, 0);
  const totalTopics = subjectStats.reduce((sum, s) => sum + s.totalTopics, 0);

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
          <LinearGradient
            colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
            style={styles.adminIcon}
          >
            <BookOpen size={24} color={theme.colors.text.primary} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Subjects Admin</Text>
            <Text style={styles.headerSubtitle}>Indian Exam Content Management</Text>
          </View>
        </View>
        
        <MascotAvatar
          size={60}
          animated={true}
          glowing={true}
          mood="focused"
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overview Stats */}
        <Animated.View style={[styles.overviewContainer, cardAnimatedStyle]}>
          <LinearGradient
            colors={[
              theme.colors.background.card,
              theme.colors.background.secondary,
            ]}
            style={styles.overviewCard}
          >
            <View style={styles.overviewHeader}>
              <BarChart3 size={24} color={theme.colors.accent.purple} />
              <Text style={styles.overviewTitle}>Content Overview</Text>
            </View>
            
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{subjectStats.length}</Text>
                <Text style={styles.overviewStatLabel}>Subjects</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{totalTopics}</Text>
                <Text style={styles.overviewStatLabel}>Topics</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{totalQuestions}</Text>
                <Text style={styles.overviewStatLabel}>Questions</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatValue}>{Math.round(totalQuestions / totalTopics) || 0}</Text>
                <Text style={styles.overviewStatLabel}>Avg/Topic</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Generation Progress */}
        {isGenerating && (
          <Animated.View style={[styles.progressContainer, cardAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.accent.purple + '20', theme.colors.accent.blue + '20']}
              style={styles.progressCard}
            >
              <View style={styles.progressHeader}>
                <Zap size={24} color={theme.colors.accent.yellow} />
                <Text style={styles.progressTitle}>Generating Questions</Text>
              </View>
              
              <Text style={styles.progressText}>
                {currentGeneratingSubject || 'Preparing AI generation...'}
              </Text>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
                    style={[styles.progressFill, { width: `${generationProgress}%` }]}
                  />
                </View>
                <Text style={styles.progressPercentage}>{Math.round(generationProgress)}%</Text>
              </View>
              
              <Text style={styles.progressSubtext}>
                Using Claude, OpenAI & Grok for diverse, high-quality questions
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[styles.actionsContainer, cardAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <GradientButton
              title={isGenerating ? "Generating..." : "Generate All Questions"}
              onPress={handleGenerateAllQuestions}
              size="large"
              fullWidth
              disabled={isGenerating}
              icon={<RefreshCw size={20} color={theme.colors.text.primary} />}
              colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
              style={styles.actionButton}
            />
            
            <GradientButton
              title="Validate Daily Quiz"
              onPress={handleValidateDailyQuiz}
              size="large"
              fullWidth
              disabled={isGenerating}
              icon={<CheckCircle size={20} color={theme.colors.text.primary} />}
              colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
              style={styles.actionButton}
            />
          </View>
        </Animated.View>

        {/* Subjects Management */}
        <Animated.View style={[styles.subjectsContainer, cardAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Subject Management</Text>
          
          <View style={styles.subjectsList}>
            {subjectStats.map((subject, index) => (
              <SubjectAdminCard
                key={subject.id}
                subject={subject}
                onGenerate={() => handleGenerateSubjectQuestions(subject.name)}
                isGenerating={isGenerating}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function SubjectAdminCard({ subject, onGenerate, isGenerating, index }: {
  subject: SubjectStats;
  onGenerate: () => void;
  isGenerating: boolean;
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

  const getStatusColor = (questionsCount: number) => {
    if (questionsCount >= 100) return theme.colors.accent.green;
    if (questionsCount >= 50) return theme.colors.accent.yellow;
    return theme.colors.accent.pink;
  };

  return (
    <Animated.View style={[styles.subjectCard, animatedStyle]}>
      <LinearGradient
        colors={[subject.color + '20', subject.color + '10']}
        style={styles.subjectCardGradient}
      >
        <View style={styles.subjectHeader}>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectIcon}>{subject.icon}</Text>
            <View style={styles.subjectText}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectMeta}>
                {subject.totalTopics} topics • {subject.totalQuestions} questions
              </Text>
              <Text style={styles.subjectAverage}>
                Avg: {subject.questionsPerTopic} questions/topic
              </Text>
            </View>
          </View>
          
          <View style={styles.subjectActions}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(subject.totalQuestions) + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(subject.totalQuestions) }
              ]}>
                {subject.totalQuestions >= 100 ? 'Complete' : 
                 subject.totalQuestions >= 50 ? 'Partial' : 'Needs Work'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.generateButton}
              onPress={onGenerate}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[subject.color, subject.color + '80']}
                style={styles.generateButtonGradient}
              >
                <RefreshCw size={16} color={theme.colors.text.primary} />
                <Text style={styles.generateButtonText}>Generate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.subjectProgress}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Question Coverage</Text>
            <Text style={styles.progressValue}>
              {subject.totalQuestions}/{subject.totalTopics * 20}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[subject.color, subject.color + '80']}
                style={[
                  styles.progressFill,
                  { width: `${Math.min((subject.totalQuestions / (subject.totalTopics * 20)) * 100, 100)}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
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
  adminIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  overviewContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  overviewCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatValue: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  overviewStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  progressCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  progressText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 12,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  progressPercentage: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  progressSubtext: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  subjectsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  subjectsList: {
    gap: theme.spacing.md,
  },
  subjectCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  subjectCardGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  subjectIcon: {
    fontSize: 32,
  },
  subjectText: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subjectMeta: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  subjectAverage: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  subjectActions: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  statusIndicator: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
  },
  generateButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  generateButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  subjectProgress: {
    gap: theme.spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  progressValue: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  progressBarContainer: {
    width: '100%',
  },
  bottomSpacing: {
    height: 20,
  },
});