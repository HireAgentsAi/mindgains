import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';
import { demoUserProfile, demoUserStats, demoUserAchievements, demoAchievements } from '@/utils/demoData';

const { width = 375 } = Dimensions.get('window') || {};

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  badge_color: string;
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
  total_study_time: number;
}

export default function Profile() {
  const isMounted = useRef(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const fadeIn = useSharedValue(0);
  const headerScale = useSharedValue(0.9);
  const statsOpacity = useSharedValue(0);
  const achievementsOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(1);
  const xpCounterValue = useSharedValue(0);
  const levelProgress = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    isMounted.current = true;
    loadProfileData();
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    headerScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    statsOpacity.value = withTiming(1, { duration: 600, delay: 300 });
    achievementsOpacity.value = withTiming(1, { duration: 600, delay: 600 });
    
    // Mascot celebration
    mascotScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    
    // Shimmer effect
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  };

  const loadProfileData = async () => {
    try {
      if (!isMounted.current) return;
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        if (!isMounted.current) return;
        // Use demo data
        setUserProfile(demoUserProfile);
        setUserStats(demoUserStats);
        
        // Map demo achievements
        const mappedAchievements = demoAchievements.map(achievement => {
          const userAchievement = demoUserAchievements.find(ua => ua.achievement_id === achievement.id);
          return {
            ...achievement,
            unlocked: userAchievement?.completed || false,
            progress: userAchievement?.progress || 0,
            maxProgress: achievement.required_value,
          };
        });
        
        setAchievements(mappedAchievements);
        
        // Animate XP counter
        xpCounterValue.value = withTiming(demoUserStats.total_xp, { duration: 2000 });
        
        // Animate level progress
        const currentLevelXP = (demoUserStats.current_level - 1) * 1000;
        const nextLevelXP = demoUserStats.current_level * 1000;
        const progress = ((demoUserStats.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        levelProgress.value = withTiming(progress, { duration: 1500, delay: 500 });
        
        setIsLoading(false);
        return;
      }
      
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        if (!isMounted.current) return;
        router.replace('/auth');
        return;
      }

      const [profile, stats, userAchievements, allAchievements] = await Promise.all([
        SupabaseService.getProfile(user.id),
        SupabaseService.getUserStats(user.id),
        SupabaseService.getUserAchievements(user.id),
        SupabaseService.getAllAchievements(),
      ]);
      
      if (!isMounted.current) return;

      setUserProfile(profile);
      setUserStats(stats);
      
      // Map achievements with user progress
      const mappedAchievements = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
        return {
          ...achievement,
          unlocked: userAchievement?.completed || false,
          progress: userAchievement?.progress || 0,
          maxProgress: achievement.required_value,
        };
      });
      
      setAchievements(mappedAchievements);
      
      if (stats) {
        // Animate XP counter
        xpCounterValue.value = withTiming(stats.total_xp, { duration: 2000 });
        
        // Animate level progress
        const currentLevelXP = (stats.current_level - 1) * 1000;
        const nextLevelXP = stats.current_level * 1000;
        const progress = ((stats.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        levelProgress.value = withTiming(Math.min(progress, 100), { duration: 1500, delay: 500 });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      if (!isMounted.current) return;
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await SupabaseService.signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
              router.replace('/auth');
            }
          }
        },
      ]
    );
  };

  const handleShareProfile = async () => {
    if (!userStats || !userProfile) return;
    
    const shareText = `🚀 Check out my MindGains AI progress!

📊 Level ${userStats.current_level} • ${userStats.total_xp.toLocaleString()} XP
🔥 ${userStats.streak_days} day streak
🏆 ${userStats.missions_completed} missions completed
📚 ${Math.round(userStats.total_study_time / 60)} hours studied

Join India's #1 AI learning platform:
📱 Download: https://mindgains.ai

#MindGainsAI #CompetitiveExams #StudyProgress`;

    try {
      await Share.share({
        message: shareText,
        title: 'My MindGains AI Progress',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getLeague = (xp: number) => {
    if (xp >= 50000) return { name: 'Diamond', color: theme.colors.league.diamond, icon: 'gem' };
    if (xp >= 25000) return { name: 'Emerald', color: theme.colors.league.emerald, icon: 'certificate' };
    if (xp >= 15000) return { name: 'Sapphire', color: theme.colors.league.sapphire, icon: 'award' };
    if (xp >= 8000) return { name: 'Ruby', color: theme.colors.league.ruby, icon: 'medal' };
    if (xp >= 4000) return { name: 'Gold', color: theme.colors.league.gold, icon: 'trophy' };
    if (xp >= 2000) return { name: 'Silver', color: theme.colors.league.silver, icon: 'star' };
    return { name: 'Bronze', color: theme.colors.league.bronze, icon: 'shield-alt' };
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
    transform: [{ translateY: interpolate(statsOpacity.value, [0, 1], [20, 0]) }],
  }));

  const achievementsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: achievementsOpacity.value,
    transform: [{ translateY: interpolate(achievementsOpacity.value, [0, 1], [30, 0]) }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 500 }),
  }));

  const levelProgressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${levelProgress.value}%`,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 1.5, width * 1.5]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

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
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!userProfile || !userStats) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

  const league = getLeague(userStats.total_xp);
  const currentLevelXP = (userStats.current_level - 1) * 1000;
  const nextLevelXP = userStats.current_level * 1000;
  const xpToNextLevel = nextLevelXP - userStats.total_xp;

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
      
      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.headerIcon}
          >
            <FontAwesome5 name="user-circle" size={24} color={theme.colors.text.primary} solid />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Text style={styles.headerSubtitle}>Your learning journey</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShareProfile}>
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.shareButtonGradient}
            >
              <FontAwesome5 name="share-alt" size={16} color={theme.colors.accent.cyan} solid />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Enhanced Profile Card */}
            <Animated.View style={[styles.profileSection, headerAnimatedStyle]}>
              <LinearGradient
                colors={[theme.colors.background.card, theme.colors.background.secondary]}
                style={styles.profileCard}
              >
                {/* Shimmer effect */}
                <View style={styles.shimmerContainer}>
                  <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                
                <View style={styles.profileHeader}>
                  {/* Avatar with Mascot */}
                  <View style={styles.avatarSection}>
                    <LinearGradient
                      colors={[league.color, league.color + '80']}
                      style={styles.profileAvatar}
                    >
                      <Text style={styles.profileAvatarText}>
                        {userProfile.full_name.charAt(0)}
                      </Text>
                      
                      {/* League badge */}
                      <View style={[styles.leagueBadge, { backgroundColor: league.color }]}>
                        <FontAwesome5 name={league.icon} size={12} color={theme.colors.text.primary} solid />
                      </View>
                    </LinearGradient>
                    
                    {/* Mascot companion */}
                    <Animated.View style={[styles.mascotCompanion, mascotAnimatedStyle]}>
                      <MascotAvatar size={40} animated={true} mood="happy" />
                    </Animated.View>
                  </View>
                  
                  {/* User Info */}
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>{userProfile.full_name}</Text>
                    <Text style={styles.profileEmail}>{userProfile.email}</Text>
                    <Text style={styles.profileBio}>{userProfile.bio}</Text>
                    
                    {/* League and Rank */}
                    <View style={styles.profileBadges}>
                      <LinearGradient
                        colors={[league.color + '30', league.color + '20']}
                        style={styles.leagueCard}
                      >
                        <FontAwesome5 name={league.icon} size={16} color={league.color} solid />
                        <Text style={[styles.leagueText, { color: league.color }]}>
                          {league.name} League
                        </Text>
                      </LinearGradient>
                      
                      <View style={styles.rankCard}>
                        <FontAwesome5 name="chart-line" size={14} color={theme.colors.accent.green} solid />
                        <Text style={styles.rankText}>{userStats.rank}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Enhanced XP Progress */}
                <View style={styles.xpSection}>
                  <View style={styles.xpHeader}>
                    <View style={styles.levelInfo}>
                      <FontAwesome5 name="layer-group" size={16} color={theme.colors.accent.purple} solid />
                      <Text style={styles.levelText}>Level {userStats.current_level}</Text>
                    </View>
                    <Animated.View style={xpAnimatedStyle}>
                      <Text style={styles.xpText}>
                        {userStats.total_xp.toLocaleString()} XP
                      </Text>
                    </Animated.View>
                  </View>
                  
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <Animated.View style={[styles.progressFill, levelProgressAnimatedStyle]} />
                    </View>
                    <Text style={styles.progressText}>
                      {xpToNextLevel.toLocaleString()} XP to Level {userStats.current_level + 1}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Enhanced Stats Grid */}
            <Animated.View style={[styles.statsSection, statsAnimatedStyle]}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="chart-bar" size={18} color={theme.colors.accent.blue} solid />
                {' '}Your Progress
              </Text>
              
              <View style={styles.statsGrid}>
                <StatCard
                  icon="fire"
                  label="Streak"
                  value={`${userStats.streak_days} days`}
                  color={theme.colors.accent.yellow}
                  iconType="solid"
                />
                <StatCard
                  icon="bullseye"
                  label="Missions"
                  value={userStats.missions_completed.toString()}
                  color={theme.colors.accent.green}
                  iconType="solid"
                />
                <StatCard
                  icon="clock"
                  label="Study Time"
                  value={`${Math.round(userStats.total_study_time / 60)}h`}
                  color={theme.colors.accent.cyan}
                  iconType="solid"
                />
                <StatCard
                  icon="graduation-cap"
                  label="Achievements"
                  value={achievements.filter(a => a.unlocked).length.toString()}
                  color={theme.colors.accent.pink}
                  iconType="solid"
                />
              </View>
            </Animated.View>

            {/* Enhanced Achievements */}
            <Animated.View style={[styles.achievementsSection, achievementsAnimatedStyle]}>
              <View style={styles.achievementsHeader}>
                <Text style={styles.sectionTitle}>
                  <FontAwesome5 name="trophy" size={18} color={theme.colors.accent.gold} solid />
                  {' '}Achievements
                </Text>
                <Text style={styles.achievementsCount}>
                  {achievements.filter(a => a.unlocked).length}/{achievements.length}
                </Text>
              </View>
              
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement, index) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    index={index}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Enhanced Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="cog" size={18} color={theme.colors.accent.purple} solid />
                {' '}Settings & Actions
              </Text>
              
              <View style={styles.settingsCard}>
                <SettingItem
                  icon="bell"
                  title="Push Notifications"
                  description="Get notified about your learning progress"
                  type="toggle"
                  value={notifications}
                  onToggle={setNotifications}
                  color={theme.colors.accent.blue}
                />
                
                <SettingItem
                  icon="question-circle"
                  title="Help & Support"
                  description="Get help with the app"
                  type="navigation"
                  color={theme.colors.accent.green}
                />
                
                <SettingItem
                  icon="share-alt"
                  title="Share App"
                  description="Invite friends to join"
                  type="action"
                  onPress={handleShareProfile}
                  color={theme.colors.accent.cyan}
                />
                
                <SettingItem
                  icon="crown"
                  title="Upgrade to Premium"
                  description="Unlock unlimited features"
                  type="navigation"
                  onPress={() => router.push('/subscription')}
                  color={theme.colors.accent.gold}
                />
                
                <SettingItem
                  icon="sign-out-alt"
                  title="Sign Out"
                  description="Sign out of your account"
                  type="action"
                  onPress={handleSignOut}
                  color={theme.colors.accent.pink}
                  isDestructive
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatCard({ icon, label, value, color, iconType = 'solid' }: {
  icon: string;
  label: string;
  value: string;
  color: string;
  iconType?: 'solid' | 'regular';
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIcon, { backgroundColor: color + '30' }]}>
          <FontAwesome5 name={icon} size={20} color={color} solid={iconType === 'solid'} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

function AchievementCard({ achievement, index }: {
  achievement: Achievement;
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
    <Animated.View style={[styles.achievementCard, animatedStyle]}>
      <LinearGradient
        colors={
          achievement.unlocked
            ? [achievement.badge_color + '30', achievement.badge_color + '20']
            : [theme.colors.background.tertiary, theme.colors.background.secondary]
        }
        style={styles.achievementCardGradient}
      >
        <View style={[
          styles.achievementIcon,
          { backgroundColor: achievement.unlocked ? achievement.badge_color + '40' : theme.colors.background.tertiary }
        ]}>
          <Text style={styles.achievementIconText}>{achievement.icon}</Text>
          {achievement.unlocked && (
            <View style={styles.achievementCheck}>
              <FontAwesome5 name="check" size={8} color={theme.colors.text.primary} solid />
            </View>
          )}
        </View>
        
        <Text style={[
          styles.achievementTitle,
          { color: achievement.unlocked ? theme.colors.text.primary : theme.colors.text.tertiary }
        ]}>
          {achievement.name}
        </Text>
        
        <Text style={styles.achievementDescription} numberOfLines={2}>
          {achievement.description}
        </Text>
        
        {!achievement.unlocked && achievement.progress !== undefined && achievement.maxProgress && (
          <View style={styles.achievementProgress}>
            <View style={styles.achievementProgressBar}>
              <LinearGradient
                colors={[achievement.badge_color, achievement.badge_color + '80']}
                style={[
                  styles.achievementProgressFill,
                  { width: `${(achievement.progress / achievement.maxProgress) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.achievementProgressText}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function SettingItem({ icon, title, description, type, value, onToggle, onPress, color, isDestructive = false }: {
  icon: string;
  title: string;
  description?: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  color: string;
  isDestructive?: boolean;
}) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (type !== 'toggle') {
      scale.value = withSequence(
        withTiming(0.98, { duration: 100 }),
        withSpring(1, { damping: 15, stiffness: 120 })
      );
    }
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.settingItem, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={type === 'toggle'}
        activeOpacity={type === 'toggle' ? 1 : 0.8}
        style={styles.settingButton}
      >
        <View style={styles.settingContent}>
          <View style={[
            styles.settingIcon,
            { backgroundColor: isDestructive ? theme.colors.accent.pink + '20' : color + '20' }
          ]}>
            <FontAwesome5 
              name={icon} 
              size={18} 
              color={isDestructive ? theme.colors.accent.pink : color} 
              solid 
            />
          </View>
          
          <View style={styles.settingText}>
            <Text style={[
              styles.settingTitle,
              { color: isDestructive ? theme.colors.accent.pink : theme.colors.text.primary }
            ]}>
              {title}
            </Text>
            {description && (
              <Text style={styles.settingDescription}>{description}</Text>
            )}
          </View>

          {type === 'toggle' && (
            <Switch
              value={value}
              onValueChange={onToggle}
              trackColor={{
                false: theme.colors.border.primary,
                true: color + '40',
              }}
              thumbColor={value ? color : theme.colors.text.muted}
            />
          )}

          {type === 'navigation' && (
            <FontAwesome5 name="chevron-right" size={16} color={theme.colors.text.tertiary} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  profileCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: width * 2,
    height: 200,
    opacity: 0.3,
  },
  shimmerGradient: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    position: 'relative',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
    position: 'relative',
  },
  profileAvatarText: {
    color: theme.colors.text.primary,
    fontSize: 32,
    fontFamily: theme.fonts.heading,
  },
  leagueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  mascotCompanion: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  profileBio: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  profileBadges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  leagueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  leagueText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  rankText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
  },
  xpSection: {
    gap: theme.spacing.md,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  levelText: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  xpText: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.yellow,
  },
  progressContainer: {
    gap: theme.spacing.sm,
  },
  progressBar: {
    height: 12,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.purple,
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  achievementsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  achievementsCount: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.gold,
    backgroundColor: theme.colors.accent.gold + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  achievementCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  achievementCardGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
    minHeight: 140,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.accent.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: theme.spacing.sm,
  },
  achievementProgress: {
    width: '100%',
    gap: theme.spacing.xs,
  },
  achievementProgressBar: {
    height: 4,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  settingsCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  settingItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.tertiary,
  },
  settingButton: {
    padding: theme.spacing.lg,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
});