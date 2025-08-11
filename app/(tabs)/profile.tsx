import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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
  User, 
  Settings, 
  Trophy, 
  Star, 
  Crown, 
  Bell, 
  HelpCircle, 
  LogOut, 
  Edit3, 
  ChevronRight, 
  Share2,
  Zap,
  Target,
  Award,
  Medal,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface UserStats {
  total_xp: number;
  current_level: number;
  streak_days: number;
  missions_completed: number;
  rank: string;
  accuracy: number;
}

export default function Profile() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-123',
    full_name: 'Learning Explorer',
    email: 'explorer@mindgains.ai',
    bio: 'Expanding knowledge through AI-powered learning',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  const [userStats, setUserStats] = useState<UserStats>({
    total_xp: 8750,
    current_level: 15,
    streak_days: 23,
    missions_completed: 47,
    rank: 'Expert Learner',
    accuracy: 87.5,
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first quiz',
      icon: Star,
      unlocked: true,
    },
    {
      id: '2',
      title: 'Knowledge Seeker',
      description: 'Answer 100 questions correctly',
      icon: Target,
      unlocked: true,
    },
    {
      id: '3',
      title: 'Streak Master',
      description: 'Maintain 30-day learning streak',
      icon: Zap,
      unlocked: false,
      progress: 23,
      maxProgress: 30,
    },
    {
      id: '4',
      title: 'Quiz Champion',
      description: 'Score perfect on 10 quizzes',
      icon: Trophy,
      unlocked: false,
      progress: 6,
      maxProgress: 10,
    },
  ]);

  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const fadeIn = useSharedValue(0);

  useEffect(() => {
    fadeIn.value = withTiming(1, { duration: 800 });
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => router.replace('/auth') },
      ]
    );
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

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const IconComponent = achievement.icon;
    
    return (
      <View style={[
        styles.achievementCard,
        !achievement.unlocked && styles.lockedAchievement
      ]}>
        <View style={[styles.achievementIcon, {
          backgroundColor: achievement.unlocked ? theme.colors.primary + '20' : theme.colors.text.quaternary + '20'
        }]}>
          <IconComponent 
            size={24} 
            color={achievement.unlocked ? theme.colors.primary : theme.colors.text.quaternary} 
          />
        </View>
        
        <View style={styles.achievementContent}>
          <Text style={[styles.achievementTitle, { 
            color: achievement.unlocked ? theme.colors.text.primary : theme.colors.text.tertiary,
            opacity: achievement.unlocked ? 1 : 0.6 
          }]}>
            {achievement.title}
          </Text>
          <Text style={[styles.achievementDescription, { 
            color: theme.colors.text.secondary,
            opacity: achievement.unlocked ? 1 : 0.6 
          }]}>
            {achievement.description}
          </Text>
          
          {!achievement.unlocked && achievement.progress && achievement.maxProgress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                  backgroundColor: theme.colors.primary 
                }]} />
              </View>
              <Text style={styles.progressText}>
                {achievement.progress}/{achievement.maxProgress}
              </Text>
            </View>
          )}
        </View>
        
        {achievement.unlocked && (
          <View style={styles.achievementBadge}>
            <Award size={16} color={theme.colors.primary} />
          </View>
        )}
      </View>
    );
  };

  const settingsItems = [
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Get notified about your learning progress',
      icon: Bell,
      type: 'toggle' as const,
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      description: 'Switch to dark theme',
      icon: Settings,
      type: 'toggle' as const,
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: HelpCircle,
      type: 'navigation' as const,
    },
    {
      id: 'share',
      title: 'Share App',
      icon: Share2,
      type: 'action' as const,
    },
    {
      id: 'logout',
      title: 'Sign Out',
      icon: LogOut,
      type: 'action' as const,
      onPress: handleSignOut,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <User size={24} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Profile
          </Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Edit3 size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.section}>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={[styles.profileAvatar, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.profileAvatarText}>
                    {userProfile.full_name.charAt(0)}
                  </Text>
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                    {userProfile.full_name}
                  </Text>
                  <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
                    {userProfile.email}
                  </Text>
                  <Text style={[styles.profileBio, { color: theme.colors.text.tertiary }]}>
                    {userProfile.bio}
                  </Text>
                  
                  <View style={styles.rankContainer}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.info]}
                      style={styles.rankBadge}
                    >
                      <Crown size={16} color="#ffffff" />
                      <Text style={styles.rankText}>{userStats.rank}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Your Progress
            </Text>
            
            <View style={styles.statsGrid}>
              <StatCard 
                icon={Trophy} 
                label="Level" 
                value={userStats.current_level} 
                color={theme.colors.primary}
              />
              <StatCard 
                icon={Zap} 
                label="Streak" 
                value={`${userStats.streak_days}d`} 
                color={theme.colors.warning}
              />
              <StatCard 
                icon={Star} 
                label="XP" 
                value={userStats.total_xp.toLocaleString()} 
                color={theme.colors.success}
              />
              <StatCard 
                icon={Target} 
                label="Accuracy" 
                value={`${userStats.accuracy}%`} 
                color={theme.colors.info}
              />
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Achievements
            </Text>
            
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Settings
            </Text>
            
            <View style={styles.settingsCard}>
              {settingsItems.map((item, index) => (
                <View key={item.id} style={[
                  styles.settingItem,
                  index === settingsItems.length - 1 && styles.lastSettingItem
                ]}>
                  <TouchableOpacity 
                    style={styles.settingButton}
                    onPress={item.type === 'action' ? item.onPress : undefined}
                    activeOpacity={item.type !== 'toggle' ? 0.7 : 1}
                  >
                    <View style={styles.settingContent}>
                      <View style={[styles.settingIcon, { 
                        backgroundColor: item.id === 'logout' 
                          ? theme.colors.error + '20' 
                          : theme.colors.primary + '20' 
                      }]}>
                        <item.icon size={20} color={
                          item.id === 'logout' 
                            ? theme.colors.error 
                            : theme.colors.primary
                        } />
                      </View>
                      
                      <View style={styles.settingText}>
                        <Text style={[styles.settingTitle, { 
                          color: item.id === 'logout' 
                            ? theme.colors.error 
                            : theme.colors.text.primary 
                        }]}>
                          {item.title}
                        </Text>
                        {item.description && (
                          <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>
                            {item.description}
                          </Text>
                        )}
                      </View>

                      {item.type === 'toggle' && (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{
                            false: theme.colors.border.primary,
                            true: theme.colors.primary + '40',
                          }}
                          thumbColor={item.value ? theme.colors.primary : theme.colors.text.quaternary}
                        />
                      )}

                      {item.type === 'navigation' && (
                        <ChevronRight size={20} color={theme.colors.text.tertiary} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  
  profileCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.card,
  },
  
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.small,
  },
  
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  
  profileInfo: {
    flex: 1,
  },
  
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  
  profileEmail: {
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  
  profileBio: {
    fontSize: 14,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  
  rankContainer: {
    alignSelf: 'flex-start',
  },
  
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    gap: theme.spacing.sm,
  },
  
  rankText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  
  statCard: {
    flex: 1,
    minWidth: 150,
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
    textAlign: 'center',
  },
  
  achievementsContainer: {
    gap: theme.spacing.md,
  },
  
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.small,
  },
  
  lockedAchievement: {
    opacity: 0.7,
  },
  
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  achievementContent: {
    flex: 1,
  },
  
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  
  achievementDescription: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  
  progressContainer: {
    marginTop: theme.spacing.sm,
  },
  
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.border.primary,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  progressText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  
  settingsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  
  lastSettingItem: {
    borderBottomWidth: 0,
  },
  
  settingButton: {
    padding: theme.spacing.lg,
  },
  
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  settingText: {
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: theme.spacing.xs / 2,
  },
  
  settingDescription: {
    fontSize: 14,
  },
});