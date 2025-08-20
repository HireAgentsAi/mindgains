import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  BookOpen,
  Brain,
  Target,
  Zap,
  Clock,
  Trophy,
  CheckCircle,
  Circle,
  Lock,
  Play,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

const { width, height } = Dimensions.get('window');

interface ContentTab {
  id: string;
  title: string;
  icon: any;
  color: string;
  content: string;
  completed: boolean;
}

interface LearningContent {
  title: string;
  description: string;
  tabs: ContentTab[];
  quiz: any;
  estimatedTime: number;
  difficulty: string;
  source: string;
}

export default function ContentViewer() {
  const params = useLocalSearchParams();
  const { contentId, contentType, source } = params;
  
  const [content, setContent] = useState<LearningContent | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [tabsCompleted, setTabsCompleted] = useState<string[]>([]);
  
  // Animation values
  const fadeIn = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const tabsOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.95);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    loadContent();
    startAnimations();
  }, [contentId]);

  const startAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    tabsOpacity.value = withTiming(1, { duration: 600, delay: 300 });
    contentScale.value = withSpring(1, { damping: 12, stiffness: 120 });
  };

  const loadContent = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Loading content for ID:', contentId);
      
      let data;
      
      try {
        // Try to call edge function first
        console.log('🔥 Calling analyze-content edge function...');
        const response = await SupabaseService.callEdgeFunction('analyze-content', {
          contentId,
          contentType,
          source,
        });
        
        console.log('✅ Edge function response:', response);
        data = response;
        
      } catch (edgeError) {
        console.log('⚠️ Edge function failed, using fallback:', edgeError);
        
        // Fallback: Get mission data from database and create structured content locally
        const { data: mission, error: missionError } = await SupabaseService.supabase
          .from('missions')
          .select('*')
          .eq('id', contentId)
          .single();
        
        if (missionError || !mission) {
          console.error('Mission error:', missionError);
          throw new Error('Mission not found');
        }
        
        console.log('📋 Found mission:', mission);
        
        // Generate structured content locally (fallback)
        data = {
          title: mission.title,
          description: mission.description,
          overview: `This learning module covers ${mission.title}. The content has been structured to provide you with a comprehensive understanding of the topic through multiple learning perspectives.

${mission.content_text ? mission.content_text.slice(0, 300) + '...' : ''}

This content is designed to help you master the subject through systematic learning and practice.`,
        keyConcepts: `Key concepts for ${mission.title}:

• Fundamental principles and definitions
• Core concepts that form the foundation  
• Important terminology and frameworks
• Essential relationships between ideas
• Critical thinking applications

${mission.content_text ? 'Based on the source material, the main concepts include understanding the foundational elements and their practical applications.' : ''}`,
        detailedExplanation: mission.content_text || `Detailed exploration of ${mission.title}. 

This section provides in-depth coverage of the topic with comprehensive explanations and analysis. Each concept is broken down into manageable parts to ensure thorough understanding.

The material is structured to build upon previous knowledge while introducing new concepts in a logical progression.`,
        examples: `Practical examples for ${mission.title}:

• Real-world applications and use cases
• Step-by-step demonstrations
• Case studies and scenarios
• Problem-solving approaches
• Implementation strategies

${mission.content_type === 'youtube' ? 'Examples from the video content help illustrate key points.' : ''}
${mission.content_type === 'pdf' ? 'Examples extracted from the document provide practical context.' : ''}
${mission.content_type === 'text' ? 'Examples related to the text content show practical applications.' : ''}`,
        practiceQuestions: `Practice exercises for ${mission.title}:

1. What are the key principles covered in this topic?
2. How can you apply these concepts in practice?
3. What are the main challenges you might face?
4. Can you identify real-world examples?
5. How does this relate to other concepts you've learned?
6. What would you do in a similar situation?
7. How can you verify your understanding?
8. What are the potential applications?

Use these questions to test your comprehension and identify areas that need more focus.`,
        quiz: {
          questions: [
            {
              question: `What is the main focus of this ${mission.title} content?`,
              options: ['Understanding concepts', 'Practical application', 'Both understanding and application', 'Neither'],
              correctAnswer: 2,
              explanation: 'Effective learning combines both conceptual understanding and practical application.'
            },
            {
              question: `How should you approach learning this material?`,
              options: ['Memorize everything', 'Focus only on examples', 'Understand concepts and practice application', 'Skip difficult parts'],
              correctAnswer: 2,
              explanation: 'The best approach is to understand the underlying concepts while practicing their application.'
            }
          ]
        },
          estimatedTime: Math.max(5, Math.ceil((mission.content_text?.length || 1000) / 200)),
          difficulty: mission.difficulty || 'medium',
        };
      }

      // Transform AI response into structured content
      const structuredContent: LearningContent = {
        title: data.title || 'Learning Content',
        description: data.description || '',
        tabs: [
          {
            id: 'overview',
            title: 'Overview',
            icon: BookOpen,
            color: theme.colors.accent.purple,
            content: data.overview || 'No overview available',
            completed: false,
          },
          {
            id: 'key-concepts',
            title: 'Key Concepts',
            icon: Brain,
            color: theme.colors.accent.blue,
            content: data.keyConcepts || 'No key concepts available',
            completed: false,
          },
          {
            id: 'detailed-explanation',
            title: 'Deep Dive',
            icon: Target,
            color: theme.colors.accent.green,
            content: data.detailedExplanation || 'No detailed explanation available',
            completed: false,
          },
          {
            id: 'examples',
            title: 'Examples',
            icon: Zap,
            color: theme.colors.accent.yellow,
            content: data.examples || 'No examples available',
            completed: false,
          },
          {
            id: 'practice',
            title: 'Practice',
            icon: Trophy,
            color: theme.colors.accent.pink,
            content: data.practiceQuestions || 'No practice questions available',
            completed: false,
          },
        ],
        quiz: data.quiz,
        estimatedTime: data.estimatedTime || 15,
        difficulty: data.difficulty || 'medium',
        source: source as string || 'text',
      };

      setContent(structuredContent);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load content. Please try again.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabComplete = () => {
    if (!content) return;
    
    const currentTabId = content.tabs[activeTab].id;
    if (!tabsCompleted.includes(currentTabId)) {
      const newCompleted = [...tabsCompleted, currentTabId];
      setTabsCompleted(newCompleted);
      
      // Update progress
      const newProgress = (newCompleted.length / content.tabs.length) * 100;
      setProgress(newProgress);
      progressWidth.value = withSpring(newProgress, { damping: 15, stiffness: 100 });
      
      // Move to next tab if available
      if (activeTab < content.tabs.length - 1) {
        handleTabChange(activeTab + 1);
      }
    }
  };

  const handleTabChange = (index: number) => {
    contentScale.value = withSequence(
      withTiming(0.95, { duration: 150 }),
      withSpring(1, { damping: 12, stiffness: 120 })
    );
    setActiveTab(index);
  };

  const handleStartQuiz = () => {
    if (!content?.quiz) {
      Alert.alert('No Quiz', 'No quiz available for this content.');
      return;
    }
    
    router.push({
      pathname: '/quiz/content-quiz',
      params: {
        contentId,
        quizData: JSON.stringify(content.quiz),
      },
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabsOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (isLoading) {
    return (
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <MascotAvatar size={80} animated mood="thinking" />
          <Text style={styles.loadingText}>Generating your personalized content...</Text>
          <ActivityIndicator size="large" color={theme.colors.accent.purple} />
        </View>
      </LinearGradient>
    );
  }

  if (!content) return null;

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
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {content.title}
              </Text>
              <View style={styles.headerMeta}>
                <Clock size={14} color={theme.colors.text.secondary} />
                <Text style={styles.metaText}>{content.estimatedTime} min</Text>
                <View style={styles.metaDivider} />
                <Text style={[styles.metaText, styles.difficulty]}>
                  {content.difficulty}
                </Text>
              </View>
            </View>
            
            <Animated.View style={headerAnimatedStyle}>
              <MascotAvatar size={50} animated mood="happy" />
            </Animated.View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
            </View>
            <Text style={styles.progressText}>
              {tabsCompleted.length} of {content.tabs.length} completed
            </Text>
          </View>

          {/* Tabs */}
          <Animated.View style={[styles.tabsContainer, tabsAnimatedStyle]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContent}
            >
              {content.tabs.map((tab, index) => {
                const isCompleted = tabsCompleted.includes(tab.id);
                const isActive = activeTab === index;
                const isLocked = index > 0 && !tabsCompleted.includes(content.tabs[index - 1].id);
                
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tab,
                      isActive && styles.activeTab,
                      isCompleted && styles.completedTab,
                    ]}
                    onPress={() => !isLocked && handleTabChange(index)}
                    disabled={isLocked}
                  >
                    <LinearGradient
                      colors={
                        isActive
                          ? [tab.color + '30', tab.color + '20']
                          : ['transparent', 'transparent']
                      }
                      style={styles.tabGradient}
                    >
                      <View style={[
                        styles.tabIcon,
                        { backgroundColor: isActive ? tab.color + '20' : theme.colors.background.tertiary }
                      ]}>
                        {isLocked ? (
                          <Lock size={20} color={theme.colors.text.tertiary} />
                        ) : isCompleted ? (
                          <CheckCircle size={20} color={theme.colors.accent.green} />
                        ) : (
                          <tab.icon size={20} color={isActive ? tab.color : theme.colors.text.secondary} />
                        )}
                      </View>
                      <Text style={[
                        styles.tabTitle,
                        isActive && styles.activeTabTitle,
                        isLocked && styles.lockedTabTitle,
                      ]}>
                        {tab.title}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Content Area */}
          <ScrollView 
            style={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[styles.contentCard, contentAnimatedStyle]}>
              <LinearGradient
                colors={[
                  theme.colors.background.card,
                  theme.colors.background.secondary,
                ]}
                style={styles.contentGradient}
              >
                {/* Tab Header */}
                <View style={styles.contentHeader}>
                  <View style={[
                    styles.contentIcon,
                    { backgroundColor: content.tabs[activeTab].color + '20' }
                  ]}>
                    {React.createElement(content.tabs[activeTab].icon, {
                      size: 24,
                      color: content.tabs[activeTab].color,
                    })}
                  </View>
                  <Text style={styles.contentTitle}>
                    {content.tabs[activeTab].title}
                  </Text>
                </View>

                {/* Dynamic Content */}
                <View style={styles.contentBody}>
                  <Text style={styles.contentText}>
                    {content.tabs[activeTab].content}
                  </Text>
                </View>

                {/* Action Button */}
                <View style={styles.contentFooter}>
                  {tabsCompleted.includes(content.tabs[activeTab].id) ? (
                    <View style={styles.completedBadge}>
                      <CheckCircle size={20} color={theme.colors.accent.green} />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  ) : (
                    <GradientButton
                      title="Mark as Complete"
                      onPress={handleTabComplete}
                      size="medium"
                      icon={<CheckCircle size={18} color={theme.colors.text.primary} />}
                      colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                    />
                  )}
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Quiz Section */}
            {progress === 100 && (
              <View style={styles.quizSection}>
                <LinearGradient
                  colors={[
                    theme.colors.accent.green + '20',
                    theme.colors.accent.blue + '20',
                  ]}
                  style={styles.quizCard}
                >
                  <Trophy size={48} color={theme.colors.accent.gold} />
                  <Text style={styles.quizTitle}>Ready for the Quiz?</Text>
                  <Text style={styles.quizSubtitle}>
                    Test your knowledge with {content.quiz?.questions?.length || 5} questions
                  </Text>
                  <GradientButton
                    title="Start Quiz"
                    onPress={handleStartQuiz}
                    size="large"
                    icon={<Play size={20} color={theme.colors.text.primary} />}
                    colors={[theme.colors.accent.green, theme.colors.accent.blue]}
                  />
                </LinearGradient>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
    marginTop: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border.secondary,
    marginHorizontal: theme.spacing.xs,
  },
  difficulty: {
    textTransform: 'capitalize',
    color: theme.colors.accent.yellow,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.green,
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  tabsContainer: {
    marginBottom: theme.spacing.lg,
  },
  tabsContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tab: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  activeTab: {
    transform: [{ scale: 1.02 }],
  },
  completedTab: {
    opacity: 0.9,
  },
  tabGradient: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  tabIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.secondary,
  },
  activeTabTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.heading,
  },
  lockedTabTitle: {
    color: theme.colors.text.tertiary,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  contentCard: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  contentGradient: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.xl,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  contentIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  contentBody: {
    marginBottom: theme.spacing.xl,
  },
  contentText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },
  contentFooter: {
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.green + '20',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  completedText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.green,
  },
  quizSection: {
    marginBottom: theme.spacing.xl,
  },
  quizCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.green + '30',
  },
  quizTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  quizSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});