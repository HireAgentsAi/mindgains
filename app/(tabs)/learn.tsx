import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { 
  BookOpen, 
  Target, 
  Play, 
  Star, 
  Crown, 
  Brain,
  Trophy,
  Clock,
  Users,
  Award,
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';

const { width } = Dimensions.get('window');

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
  progress: number;
  totalTopics: number;
  completedTopics: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  onPress: () => void;
}

export default function Learn() {
  const isMounted = useRef(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userProgress, setUserProgress] = useState({
    totalXP: 3450,
    currentLevel: 12,
    streakDays: 15,
    completedLessons: 87,
  });

  const fadeIn = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    loadSubjects();
    fadeIn.value = withTiming(1, { duration: 800 });
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadSubjects = async () => {
    try {
      if (!isMounted.current) return;
      // Mock data - in real app, load from Supabase
      const mockSubjects: Subject[] = [
        {
          id: '1',
          name: 'Mathematics',
          icon: Target,
          color: theme.colors.accent.purple,
          progress: 75,
          totalTopics: 45,
          completedTopics: 34,
          difficulty: 'intermediate',
        },
        {
          id: '2',
          name: 'Physics',
          icon: Brain,
          color: theme.colors.accent.green,
          progress: 60,
          totalTopics: 38,
          completedTopics: 23,
          difficulty: 'advanced',
        },
        {
          id: '3',
          name: 'Chemistry',
          icon: Trophy,
          color: theme.colors.accent.yellow,
          progress: 45,
          totalTopics: 42,
          completedTopics: 19,
          difficulty: 'intermediate',
        },
        {
          id: '4',
          name: 'English',
          icon: BookOpen,
          color: theme.colors.accent.blue,
          progress: 85,
          totalTopics: 30,
          completedTopics: 26,
          difficulty: 'beginner',
        },
        {
          id: '5',
          name: 'General Knowledge',
          icon: Star,
          color: theme.colors.accent.pink,
          progress: 30,
          totalTopics: 50,
          completedTopics: 15,
          difficulty: 'expert',
        },
      ];
      
      if (!isMounted.current) return;
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSubjects().finally(() => {
      if (isMounted.current) {
        setRefreshing(false);
      }
    });
  };

  const quickActions: QuickAction[] = [
    {
      id: 'daily',
      title: 'Daily Quiz',
      subtitle: 'Quick 10-question challenge',
      icon: 'play-circle',
      color: theme.colors.accent.purple,
      onPress: () => router.push('/quiz/daily'),
    },
    {
      id: 'practice',
      title: 'Practice Mode',
      subtitle: 'Unlimited practice questions',
      icon: 'bullseye',
      color: theme.colors.accent.green,
      onPress: () => router.push('/quiz/practice'),
    },
    {
      id: 'mock',
      title: 'Mock Test',
      subtitle: 'Full-length exam simulation',
      icon: 'clock',
      color: theme.colors.accent.yellow,
      onPress: () => router.push('/quiz/mock'),
    },
    {
      id: 'compete',
      title: 'Compete',
      subtitle: 'Challenge friends',
      icon: 'user-friends',
      color: theme.colors.accent.pink,
      onPress: () => router.push('/compete'),
    },
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'expert': return theme.colors.accent.pink;
      case 'advanced': return theme.colors.accent.yellow;
      case 'intermediate': return theme.colors.accent.blue;
      case 'beginner': return theme.colors.accent.green;
      default: return theme.colors.text.muted;
    }
  };

  const SubjectCard = ({ subject }: { subject: Subject }) => {
    const IconComponent = subject.icon;
    
    return (
      <TouchableOpacity
        style={styles.subjectCard}
        onPress={() => router.push(`/quiz/subject?id=${subject.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.subjectHeader}>
          <View style={[styles.subjectIcon, { backgroundColor: subject.color + '20' }]}>
            <IconComponent size={24} color={subject.color} />
          </View>
          <View style={styles.subjectInfo}>
            <Text style={[styles.subjectName, { color: theme.colors.text.primary }]}>
              {subject.name}
            </Text>
            <Text style={[styles.subjectProgress, { color: theme.colors.text.secondary }]}>
              {subject.completedTopics}/{subject.totalTopics} topics
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(subject.difficulty) + '20' }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(subject.difficulty) }]}>
              {subject.difficulty}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill, 
              { 
                width: `${subject.progress}%`,
                backgroundColor: subject.color
              }
            ]} />
          </View>
          <Text style={[styles.progressPercent, { color: subject.color }]}>
            {subject.progress}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const QuickActionCard = ({ action }: { action: QuickAction }) => {
    
    return (
      <TouchableOpacity
        style={styles.actionCard}
        onPress={action.onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[action.color, action.color + '80']}
          style={styles.actionGradient}
        >
          <View style={styles.actionIcon}>
            <FontAwesome5 name={action.icon} size={20} color="#ffffff" solid />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <LinearGradient
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.headerIcon}
          >
            <FontAwesome5 name="graduation-cap" size={20} color={theme.colors.text.primary} solid />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Learn</Text>
            <Text style={styles.headerSubtitle}>Explore subjects & topics</Text>
          </View>
        </View>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressOverview}>
        <LinearGradient
          colors={[theme.colors.accent.purple, theme.colors.accent.purpleLight]}
          style={styles.progressGradient}
        >
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <FontAwesome5 name="crown" size={16} color="#ffffff" solid />
              <Text style={styles.statValue}>Level {userProgress.currentLevel}</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="trophy" size={16} color="#ffffff" solid />
              <Text style={styles.statValue}>{userProgress.totalXP} XP</Text>
            </View>
            <View style={styles.statItem}>
              <FontAwesome5 name="medal" size={16} color="#ffffff" solid />
              <Text style={styles.statValue}>{userProgress.streakDays} day streak</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.accent.purple]}
              tintColor={theme.colors.accent.purple}
            />
          }>
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Quick Actions
            </Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action) => (
                <QuickActionCard key={action.id} action={action} />
              ))}
            </View>
          </View>

          {/* Subjects */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Subjects
            </Text>
            <View style={styles.subjectsContainer}>
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  
  headerText: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  
  headerSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  
  progressOverview: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  
  progressGradient: {
    padding: theme.spacing.lg,
  },
  
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  
  statValue: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: theme.fonts.subheading,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  actionCard: {
    flex: 1,
    minWidth: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  
  actionGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  actionContent: {
    alignItems: 'center',
  },
  
  actionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    textAlign: 'center',
  },
  
  subjectsContainer: {
    gap: theme.spacing.md,
  },
  
  subjectCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  subjectInfo: {
    flex: 1,
  },
  
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  
  subjectProgress: {
    fontSize: 14,
  },
  
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.border.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
});