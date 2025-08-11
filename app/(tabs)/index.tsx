import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { 
  Brain,
  Trophy,
  Zap,
  Target,
  Play,
  Crown,
  BookOpen,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface UserStats {
  currentLevel: number;
  totalXP: number;
  streakDays: number;
  totalQuizzes: number;
  accuracy: number;
  rank: number;
}

export default function Home() {
  const [userStats, setUserStats] = useState<UserStats>({
    currentLevel: 12,
    totalXP: 3450,
    streakDays: 15,
    totalQuizzes: 87,
    accuracy: 85,
    rank: 234,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');

  const fadeIn = useSharedValue(0);

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    fadeIn.value = withTiming(1, { duration: 800 });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const StatCard = ({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
        {label}
      </Text>
    </View>
  );

  const ActionCard = ({ icon: Icon, title, subtitle, gradient, onPress }: {
    icon: any;
    title: string;
    subtitle: string;
    gradient: string[];
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={gradient} style={styles.actionGradient}>
        <View style={styles.actionContent}>
          <View style={styles.actionIcon}>
            <Icon size={28} color="#ffffff" />
          </View>
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text.primary }]}>
              {greeting}!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              Ready to learn something new?
            </Text>
          </View>
          <View style={[styles.brainContainer, { backgroundColor: theme.colors.accent.purple }]}>
            <Brain size={32} color="#ffffff" />
          </View>
        </View>
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
          }
        >
          {/* Progress Card */}
          <View style={styles.section}>
            <View style={styles.progressCard}>
              <LinearGradient
                colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                style={styles.progressGradient}
              >
                <View style={styles.progressContent}>
                  <View style={styles.levelRow}>
                    <View style={styles.levelBadge}>
                      <Crown size={16} color="#ffffff" />
                      <Text style={styles.levelText}>Level {userStats.currentLevel}</Text>
                    </View>
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥 {userStats.streakDays}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.xpText}>
                    {userStats.totalXP.toLocaleString()} XP
                  </Text>
                  
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '65%' }]} />
                  </View>
                  
                  <Text style={styles.progressLabel}>
                    450 XP to Level {userStats.currentLevel + 1}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Your Progress
            </Text>
            <View style={styles.statsGrid}>
              <StatCard 
                icon={Target} 
                label="Accuracy" 
                value={`${userStats.accuracy}%`} 
                color={theme.colors.accent.green}
              />
              <StatCard 
                icon={Trophy} 
                label="Rank" 
                value={`#${userStats.rank}`} 
                color={theme.colors.accent.yellow}
              />
              <StatCard 
                icon={BookOpen} 
                label="Quizzes" 
                value={userStats.totalQuizzes} 
                color={theme.colors.accent.purple}
              />
              <StatCard 
                icon={Zap} 
                label="Streak" 
                value={userStats.streakDays} 
                color={theme.colors.accent.pink}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Start Learning
            </Text>
            <View style={styles.actionsContainer}>
              <ActionCard
                icon={Play}
                title="Daily Quiz"
                subtitle="Fresh questions every day"
                gradient={[theme.colors.accent.purple, theme.colors.accent.blue]}
                onPress={() => router.push('/quiz/daily')}
              />
              <ActionCard
                icon={Target}
                title="Topic Quiz"
                subtitle="Focus on specific subjects"
                gradient={[theme.colors.accent.green, theme.colors.accent.blue]}
                onPress={() => router.push('/quiz/topics')}
              />
              <ActionCard
                icon={Crown}
                title="Challenge Friends"
                subtitle="Compete with others"
                gradient={[theme.colors.accent.yellow, theme.colors.accent.pink]}
                onPress={() => router.push('/friends')}
              />
              <ActionCard
                icon={Zap}
                title="Speed Quiz"
                subtitle="Test your quick thinking"
                gradient={[theme.colors.accent.pink, theme.colors.accent.pink]}
                onPress={() => router.push('/quiz/speed')}
              />
            </View>
          </View>

          {/* Activity Feed */}
          <View style={[styles.section, { marginBottom: 100 }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Recent Activity
            </Text>
            <View style={styles.activityCard}>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.accent.green }]}>
                  <Trophy size={16} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text.primary }]}>
                    Perfect Score!
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.text.secondary }]}>
                    Mathematics Quiz • 2 hours ago
                  </Text>
                </View>
                <Text style={[styles.activityPoints, { color: theme.colors.accent.green }]}>
                  +50 XP
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.accent.yellow }]}>
                  <Crown size={16} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text.primary }]}>
                    Level Up!
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.text.secondary }]}>
                    Reached Level 12 • Yesterday
                  </Text>
                </View>
                <Text style={[styles.activityPoints, { color: theme.colors.accent.yellow }]}>
                  +100 XP
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.accent.purple }]}>
                  <Star size={16} color="#ffffff" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: theme.colors.text.primary }]}>
                    Challenge Victory
                  </Text>
                  <Text style={[styles.activityTime, { color: theme.colors.text.secondary }]}>
                    Friend Challenge • 2 days ago
                  </Text>
                </View>
                <Text style={[styles.activityPoints, { color: theme.colors.accent.purple }]}>
                  +75 XP
                </Text>
              </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  greeting: {
    fontSize: 28,
    fontWeight: '700',
  },
  
  subtitle: {
    fontSize: 16,
    marginTop: theme.spacing.xs,
  },
  
  brainContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  
  progressCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    height: 200,
    ...theme.shadows.card,
  },
  
  progressGradient: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  
  progressContent: {
    flex: 1,
  },
  
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: theme.spacing.xs,
  },
  
  levelText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  streakBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
  },
  
  streakText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  xpText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  
  progressLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontSize: 14,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  statCard: {
    flex: 1,
    minWidth: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  
  statLabel: {
    fontSize: 14,
  },
  
  actionsContainer: {
    gap: theme.spacing.md,
  },
  
  actionCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  
  actionGradient: {
    padding: theme.spacing.lg,
  },
  
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  
  actionText: {
    flex: 1,
  },
  
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: theme.spacing.xs,
  },
  
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  activityCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.tertiary,
  },
  
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  activityContent: {
    flex: 1,
  },
  
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  
  activityTime: {
    fontSize: 12,
  },
  
  activityPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
});