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
  withSequence,
} from 'react-native-reanimated';
import { ChevronLeft, Settings, RefreshCw, Database, Users, ChartBar as BarChart3, Crown, Zap, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle, Target, Calendar } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalSubjects: number;
  totalTopics: number;
  questionsPerTopic: Record<string, number>;
  lastGenerated: string;
}

export default function AdminPanelScreen() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentGeneratingTopic, setCurrentGeneratingTopic] = useState('');
  const [isGeneratingDailyQuiz, setIsGeneratingDailyQuiz] = useState(false);
  
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(30);
  const mascotScale = useSharedValue(1);

  useEffect(() => {
    checkAdminAccess();
    
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 600 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
  }, []);

  const handleGenerateDailyQuiz = async () => {
    Alert.alert(
      'Generate Daily Quiz',
      'This will create a new daily quiz for today. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setIsGeneratingDailyQuiz(true);
            
            try {
              const { data, error } = await supabase.functions.invoke('daily-quiz-generator', {
                body: { force: true, admin_trigger: true }
              });

              if (error) {
                throw new Error(error.message || 'Failed to generate daily quiz');
              }
              
              if (data.success) {
                Alert.alert('Success', 'Daily quiz generated successfully!');
              } else {
                Alert.alert('Error', data.error || 'Failed to generate daily quiz');
              }
            } catch (error) {
              console.error('Error generating daily quiz:', error);
              Alert.alert('Error', 'Failed to generate daily quiz. Please try again.');
            } finally {
              setIsGeneratingDailyQuiz(false);
            }
          }
        }
      ]
    );
  };

  const checkAdminAccess = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      
      if (!user || user.email !== 'ragularvind84@gmail.com') {
        Alert.alert(
          'Access Denied',
          'You do not have admin privileges.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      setIsAdmin(true);
      await loadAdminStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const stats = await SupabaseService.getAdminStats();
      setAdminStats(stats);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const handleRegenerateAllQuestions = async () => {
    Alert.alert(
      'Regenerate All Questions',
      'This will replace ALL existing questions with new AI-generated ones. This action cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setIsGenerating(true);
            setGenerationProgress(0);
            
            try {
              await SupabaseService.regenerateAllTopicQuestions(
                (progress, topic) => {
                  setGenerationProgress(progress);
                  setCurrentGeneratingTopic(topic);
                }
              );
              
              Alert.alert('Success', 'All questions have been regenerated successfully!');
              await loadAdminStats();
            } catch (error) {
              console.error('Error regenerating questions:', error);
              Alert.alert('Error', 'Failed to regenerate questions. Please try again.');
            } finally {
              setIsGenerating(false);
              setGenerationProgress(0);
              setCurrentGeneratingTopic('');
            }
          }
        }
      ]
    );
  };

  const handleRegenerateSubject = async (subjectName: string) => {
    Alert.alert(
      `Regenerate ${subjectName} Questions`,
      `This will replace all questions for ${subjectName} with new AI-generated ones. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setIsGenerating(true);
            
            try {
              await SupabaseService.regenerateSubjectQuestions(subjectName);
              Alert.alert('Success', `${subjectName} questions regenerated successfully!`);
              await loadAdminStats();
            } catch (error) {
              console.error('Error regenerating subject questions:', error);
              Alert.alert('Error', `Failed to regenerate ${subjectName} questions.`);
            } finally {
              setIsGenerating(false);
            }
          }
        }
      ]
    );
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
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
          <Text style={styles.loadingText}>Verifying admin access...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
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
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.8}>
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.backButtonGradient}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
            style={styles.adminIcon}
          >
            <Crown size={24} color={theme.colors.text.primary} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Question Management System</Text>
          </View>
        </View>
        
        <Animated.View style={mascotAnimatedStyle}>
          <MascotAvatar
            size={60}
            animated={true}
            glowing={true}
            mood="focused"
          />
        </Animated.View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Admin Stats */}
        <Animated.View style={[styles.statsContainer, cardAnimatedStyle]}>
          <LinearGradient
            colors={[
              theme.colors.background.card,
              theme.colors.background.secondary,
            ]}
            style={styles.statsCard}
          >
            <View style={styles.statsHeader}>
              <BarChart3 size={24} color={theme.colors.accent.purple} />
              <Text style={styles.statsTitle}>System Overview</Text>
            </View>
            
            {adminStats ? (
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Users size={20} color={theme.colors.accent.blue} />
                  <Text style={styles.statValue}>{adminStats.totalUsers}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Database size={20} color={theme.colors.accent.green} />
                  <Text style={styles.statValue}>{adminStats.totalQuestions}</Text>
                  <Text style={styles.statLabel}>Total Questions</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Settings size={20} color={theme.colors.accent.yellow} />
                  <Text style={styles.statValue}>{adminStats.totalSubjects}</Text>
                  <Text style={styles.statLabel}>Subjects</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Target size={20} color={theme.colors.accent.pink} />
                  <Text style={styles.statValue}>{adminStats.totalTopics}</Text>
                  <Text style={styles.statLabel}>Topics</Text>
                </View>
              </View>
            ) : (
              <ActivityIndicator size="large" color={theme.colors.accent.purple} />
            )}
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
                {currentGeneratingTopic || 'Preparing AI generation...'}
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
                Using OpenAI, Claude & Grok for diverse question generation
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View style={[styles.actionsContainer, cardAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Question Management</Text>
          
          <View style={styles.actionsList}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleRegenerateAllQuestions}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.accent.pink + '20', theme.colors.accent.purple + '20']}
                style={styles.actionCardGradient}
              >
                <View style={styles.actionIcon}>
                  <RefreshCw size={24} color={theme.colors.accent.pink} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Regenerate All Questions</Text>
                  <Text style={styles.actionDescription}>
                    Replace all existing questions with fresh AI-generated content across all subjects and topics.
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dailyQuizCard}
              onPress={handleGenerateDailyQuiz}
              disabled={isGeneratingDailyQuiz}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                style={styles.dailyQuizCardGradient}
              >
                <View style={styles.dailyQuizIcon}>
                  <Calendar size={24} color={theme.colors.text.primary} />
                </View>
                <View style={styles.dailyQuizText}>
                  <Text style={styles.dailyQuizTitle}>
                    {isGeneratingDailyQuiz ? 'Generating...' : 'Generate Daily Quiz'}
                  </Text>
                  <Text style={styles.dailyQuizSubtitle}>
                    Create today's quiz manually using AI
                  </Text>
                </View>
                {isGeneratingDailyQuiz && (
                  <View style={styles.dailyQuizLoader}>
                    <ActivityIndicator size="small" color={theme.colors.text.primary} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <GradientButton
              title={isGenerating ? "Generating..." : "Regenerate All Questions"}
              onPress={handleRegenerateAllQuestions}
              size="large"
              fullWidth
              disabled={isGenerating}
              icon={isGenerating ? undefined : <RefreshCw size={20} color={theme.colors.text.primary} />}
              colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
              style={styles.regenerateButton}
            />
          </View>
        </Animated.View>

        {/* Subject-wise Actions */}
        <Animated.View style={[styles.subjectsContainer, cardAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Subject-wise Management</Text>
          
          <View style={styles.subjectsList}>
            {['History', 'Polity', 'Geography', 'Economy', 'Science & Technology', 'Current Affairs'].map((subject, index) => (
              <SubjectAdminCard
                key={subject}
                subject={subject}
                questionsCount={adminStats?.questionsPerTopic[subject] || 0}
                onRegenerate={() => handleRegenerateSubject(subject)}
                isGenerating={isGenerating}
                index={index}
              />
            ))}
          </View>
        </Animated.View>

        {/* System Info */}
        <Animated.View style={[styles.systemInfoContainer, cardAnimatedStyle]}>
          <LinearGradient
            colors={[
              theme.colors.background.card,
              theme.colors.background.secondary,
            ]}
            style={styles.systemInfoCard}
          >
            <View style={styles.systemInfoHeader}>
              <Database size={20} color={theme.colors.accent.cyan} />
              <Text style={styles.systemInfoTitle}>System Information</Text>
            </View>
            
            <View style={styles.systemInfoList}>
              <View style={styles.systemInfoItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.systemInfoText}>AI APIs: OpenAI, Claude, Grok</Text>
              </View>
              
              <View style={styles.systemInfoItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.systemInfoText}>Database: Supabase PostgreSQL</Text>
              </View>
              
              <View style={styles.systemInfoItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.systemInfoText}>Auto-generation: 6 AM IST daily</Text>
              </View>
              
              <View style={styles.systemInfoItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.systemInfoText}>Questions per topic: 20 (10 random shown)</Text>
              </View>
            </View>
            
            {adminStats?.lastGenerated && (
              <Text style={styles.lastGenerated}>
                Last generated: {new Date(adminStats.lastGenerated).toLocaleString()}
              </Text>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function SubjectAdminCard({ subject, questionsCount, onRegenerate, isGenerating, index }: {
  subject: string;
  questionsCount: number;
  onRegenerate: () => void;
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

  const getSubjectIcon = (name: string) => {
    const icons: Record<string, string> = {
      'History': '🏛️',
      'Polity': '⚖️',
      'Geography': '🌍',
      'Economy': '💰',
      'Science & Technology': '🔬',
      'Current Affairs': '📰'
    };
    return icons[name] || '📚';
  };

  const getSubjectColor = (name: string) => {
    const colors: Record<string, string> = {
      'History': theme.colors.accent.purple,
      'Polity': theme.colors.accent.blue,
      'Geography': theme.colors.accent.green,
      'Economy': theme.colors.accent.yellow,
      'Science & Technology': theme.colors.accent.cyan,
      'Current Affairs': theme.colors.accent.pink
    };
    return colors[name] || theme.colors.accent.purple;
  };

  return (
    <Animated.View style={[styles.subjectAdminCard, animatedStyle]}>
      <LinearGradient
        colors={[
          theme.colors.background.card,
          theme.colors.background.secondary,
        ]}
        style={styles.subjectAdminCardGradient}
      >
        <View style={styles.subjectAdminHeader}>
          <View style={styles.subjectAdminInfo}>
            <Text style={styles.subjectAdminIcon}>{getSubjectIcon(subject)}</Text>
            <View style={styles.subjectAdminText}>
              <Text style={styles.subjectAdminName}>{subject}</Text>
              <Text style={styles.subjectAdminCount}>{questionsCount} questions</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.regenerateSubjectButton}
            onPress={onRegenerate}
            disabled={isGenerating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[getSubjectColor(subject), getSubjectColor(subject) + '80']}
              style={styles.regenerateSubjectButtonGradient}
            >
              <RefreshCw size={16} color={theme.colors.text.primary} />
              <Text style={styles.regenerateSubjectButtonText}>Regenerate</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  statsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statsCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  statItem: {
    width: '45%',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  statLabel: {
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
  actionsList: {
    gap: theme.spacing.md,
  },
  actionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  actionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    gap: theme.spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  actionWarning: {
    padding: theme.spacing.sm,
  },
  regenerateButton: {
    marginTop: theme.spacing.md,
  },
  dailyQuizButton: {
    marginTop: theme.spacing.md,
  },
  dailyQuizCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginTop: theme.spacing.md,
  },
  dailyQuizCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    gap: theme.spacing.md,
  },
  dailyQuizIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyQuizText: {
    flex: 1,
  },
  dailyQuizTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  dailyQuizSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    opacity: 0.8,
  },
  dailyQuizLoader: {
    padding: theme.spacing.sm,
  },
  subjectsContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  subjectsList: {
    gap: theme.spacing.md,
  },
  subjectAdminCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  subjectAdminCardGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  subjectAdminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectAdminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  subjectAdminIcon: {
    fontSize: 32,
  },
  subjectAdminText: {
    flex: 1,
  },
  subjectAdminName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subjectAdminCount: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  regenerateSubjectButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  regenerateSubjectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  regenerateSubjectButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  systemInfoContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  systemInfoCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  systemInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  systemInfoTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  systemInfoList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  systemInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  systemInfoText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  lastGenerated: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});