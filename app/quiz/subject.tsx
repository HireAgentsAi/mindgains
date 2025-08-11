import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  interpolate,
} from 'react-native-reanimated';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

const { width } = Dimensions.get('window');

interface SubjectTopic {
  id: string;
  name: string;
  description: string;
  importance_level: 'high' | 'medium' | 'low';
  exam_frequency: 'frequent' | 'moderate' | 'rare';
  total_questions: number;
  user_progress?: {
    questions_attempted: number;
    best_score: number;
    proficiency_level: string;
  };
}

const DEMO_TOPICS: SubjectTopic[] = [
  {
    id: '1',
    name: 'Ancient India',
    description: 'Indus Valley, Vedic Period, Mauryas, Guptas',
    importance_level: 'high',
    exam_frequency: 'frequent',
    total_questions: 25,
    user_progress: { questions_attempted: 15, best_score: 85, proficiency_level: 'advanced' }
  },
  {
    id: '2',
    name: 'Medieval India',
    description: 'Delhi Sultanate, Mughal Empire, Regional Kingdoms',
    importance_level: 'high',
    exam_frequency: 'frequent',
    total_questions: 30,
    user_progress: { questions_attempted: 20, best_score: 78, proficiency_level: 'intermediate' }
  },
  {
    id: '3',
    name: 'Modern India',
    description: 'British Rule, Freedom Struggle, Independence',
    importance_level: 'high',
    exam_frequency: 'frequent',
    total_questions: 35,
    user_progress: { questions_attempted: 25, best_score: 92, proficiency_level: 'expert' }
  },
  {
    id: '4',
    name: 'Art & Culture',
    description: 'Classical Arts, Literature, Architecture',
    importance_level: 'medium',
    exam_frequency: 'moderate',
    total_questions: 20,
    user_progress: { questions_attempted: 10, best_score: 65, proficiency_level: 'beginner' }
  },
  {
    id: '5',
    name: 'Geography',
    description: 'Physical Features, Climate, Resources',
    importance_level: 'high',
    exam_frequency: 'frequent',
    total_questions: 28,
    user_progress: { questions_attempted: 18, best_score: 88, proficiency_level: 'advanced' }
  },
];

export default function SubjectQuizScreen() {
  const isMounted = useRef(true);
  const params = useLocalSearchParams();
  const { subjectId, subjectName } = params;
  
  const [topics, setTopics] = useState<SubjectTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Animation values
  const fadeIn = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const topicsOpacity = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    loadSubjectTopics();
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, [subjectId]);

  const startAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    topicsOpacity.value = withTiming(1, { duration: 600, delay: 300 });
  };

  const loadSubjectTopics = async () => {
    try {
      if (!isMounted.current) return;
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        if (!isMounted.current) return;
        // Use demo topics
        setTopics(DEMO_TOPICS);
        setIsLoading(false);
        return;
      }
      
      if (!isMounted.current) return;
      const subjectTopics = await SupabaseService.getSubjectTopics(subjectId as string);
      setTopics(subjectTopics);
    } catch (error) {
      console.error('Error loading subject topics:', error);
    } finally {
      if (!isMounted.current) return;
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (topicId: string, topicName: string) => {
    setSelectedTopic(topicId);
    
    // Navigate to topic quiz
    router.push({
      pathname: '/quiz/topic',
      params: {
        topicId,
        topicName,
        subjectName: subjectName as string,
      },
    });
  };

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.accent.green;
      case 'medium': return theme.colors.accent.yellow;
      case 'low': return theme.colors.accent.pink;
      default: return theme.colors.text.muted;
    }
  };

  const getImportanceIcon = (level: string) => {
    switch (level) {
      case 'high': return 'exclamation-triangle';
      case 'medium': return 'info-circle';
      case 'low': return 'minus-circle';
      default: return 'circle';
    }
  };

  const getProficiencyIcon = (level: string) => {
    switch (level) {
      case 'expert': return 'crown';
      case 'advanced': return 'trophy';
      case 'intermediate': return 'medal';
      case 'beginner': return 'seedling';
      default: return 'question-circle';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return theme.colors.accent.gold;
      case 'advanced': return theme.colors.accent.purple;
      case 'intermediate': return theme.colors.accent.blue;
      case 'beginner': return theme.colors.accent.green;
      default: return theme.colors.text.muted;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const topicsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: topicsOpacity.value,
    transform: [{ translateY: interpolate(topicsOpacity.value, [0, 1], [20, 0]) }],
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
          <Text style={styles.loadingText}>Loading {subjectName} topics...</Text>
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
      
      {/* Enhanced Header */}
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
            <FontAwesome5 name="chevron-left" size={20} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.subjectIcon}
          >
            <FontAwesome5 name="book" size={24} color={theme.colors.text.primary} solid />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{subjectName}</Text>
            <Text style={styles.headerSubtitle}>Choose a topic to practice</Text>
          </View>
        </View>
        
        <MascotAvatar size={60} animated={true} glowing={true} mood="focused" />
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={[styles.topicsContainer, topicsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="list" size={18} color={theme.colors.accent.purple} solid />
              {' '}Available Topics
            </Text>
            
            <View style={styles.topicsList}>
              {topics.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  index={index}
                  onSelect={() => handleTopicSelect(topic.id, topic.name)}
                  isSelected={selectedTopic === topic.id}
                />
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

function TopicCard({ topic, index, onSelect, isSelected }: {
  topic: SubjectTopic;
  index: number;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 150);
  }, [index]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getImportanceColor = (level: string) => {
    switch (level) {
      case 'high': return theme.colors.accent.green;
      case 'medium': return theme.colors.accent.yellow;
      case 'low': return theme.colors.accent.pink;
      default: return theme.colors.text.muted;
    }
  };

  const getImportanceIcon = (level: string) => {
    switch (level) {
      case 'high': return 'exclamation-triangle';
      case 'medium': return 'info-circle';
      case 'low': return 'minus-circle';
      default: return 'circle';
    }
  };

  const getProficiencyIcon = (level: string) => {
    switch (level) {
      case 'expert': return 'crown';
      case 'advanced': return 'trophy';
      case 'intermediate': return 'medal';
      case 'beginner': return 'seedling';
      default: return 'question-circle';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'expert': return theme.colors.accent.gold;
      case 'advanced': return theme.colors.accent.purple;
      case 'intermediate': return theme.colors.accent.blue;
      case 'beginner': return theme.colors.accent.green;
      default: return theme.colors.text.muted;
    }
  };

  return (
    <Animated.View style={[styles.topicCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={
            isSelected
              ? [theme.colors.accent.purple + '30', theme.colors.accent.blue + '30']
              : [theme.colors.background.card, theme.colors.background.secondary]
          }
          style={[styles.topicCardGradient, isSelected && styles.selectedTopic]}
        >
          {/* Topic Header */}
          <View style={styles.topicHeader}>
            <View style={styles.topicInfo}>
              <Text style={styles.topicName}>{topic.name}</Text>
              <Text style={styles.topicDescription}>{topic.description}</Text>
            </View>
            
            <View style={styles.topicBadges}>
              <View style={[
                styles.importanceBadge,
                { backgroundColor: getImportanceColor(topic.importance_level) + '20' }
              ]}>
                <FontAwesome5 
                  name={getImportanceIcon(topic.importance_level)} 
                  size={10} 
                  color={getImportanceColor(topic.importance_level)} 
                  solid 
                />
                <Text style={[
                  styles.importanceText,
                  { color: getImportanceColor(topic.importance_level) }
                ]}>
                  {topic.importance_level}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Section */}
          {topic.user_progress && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <View style={styles.proficiencyBadge}>
                  <FontAwesome5 
                    name={getProficiencyIcon(topic.user_progress.proficiency_level)} 
                    size={12} 
                    color={getProficiencyColor(topic.user_progress.proficiency_level)} 
                    solid 
                  />
                  <Text style={[
                    styles.proficiencyText,
                    { color: getProficiencyColor(topic.user_progress.proficiency_level) }
                  ]}>
                    {topic.user_progress.proficiency_level}
                  </Text>
                </View>
                
                <Text style={styles.bestScore}>
                  Best: {topic.user_progress.best_score}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[
                    getProficiencyColor(topic.user_progress.proficiency_level),
                    getProficiencyColor(topic.user_progress.proficiency_level) + '80'
                  ]}
                  style={[
                    styles.progressFill,
                    { width: `${topic.user_progress.best_score}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {/* Topic Stats */}
          <View style={styles.topicStats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="question-circle" size={14} color={theme.colors.accent.blue} />
              <Text style={styles.statText}>{topic.total_questions} questions</Text>
            </View>
            
            <View style={styles.statItem}>
              <FontAwesome5 name="chart-line" size={14} color={theme.colors.accent.green} />
              <Text style={styles.statText}>{topic.exam_frequency} in exams</Text>
            </View>
            
            {topic.user_progress && (
              <View style={styles.statItem}>
                <FontAwesome5 name="history" size={14} color={theme.colors.accent.yellow} />
                <Text style={styles.statText}>
                  {topic.user_progress.questions_attempted} attempted
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.topicAction}>
            <GradientButton
              title={topic.user_progress ? "Continue Practice" : "Start Quiz"}
              onPress={onSelect}
              size="medium"
              fullWidth
              icon={
                <FontAwesome5 
                  name={topic.user_progress ? "play" : "rocket"} 
                  size={14} 
                  color={theme.colors.text.primary} 
                  solid 
                />
              }
              colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  topicsContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  topicsList: {
    gap: theme.spacing.md,
  },
  topicCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  topicCardGradient: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  selectedTopic: {
    borderColor: theme.colors.accent.purple,
    ...theme.shadows.glow,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  topicInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  topicName: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  topicDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  topicBadges: {
    gap: theme.spacing.xs,
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  importanceText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  proficiencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proficiencyText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  bestScore: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  topicStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  topicAction: {
    marginTop: theme.spacing.sm,
  },
});