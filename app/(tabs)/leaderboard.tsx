import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SupabaseService } from '@/utils/supabaseService';

const { width = 375 } = Dimensions.get('window') || {};

interface LeaderboardUser {
  id: string;
  full_name: string;
  avatar_url?: string;
  total_xp: number;
  current_level: number;
  streak_days: number;
  rank: number;
  location?: string;
  is_current_user?: boolean;
  league?: string;
  status?: 'online' | 'studying' | 'offline';
}

interface FilterTab {
  id: string;
  title: string;
  icon: string;
  color: string;
}

const FILTERS: FilterTab[] = [
  { id: 'global', title: 'Global', icon: 'globe-asia', color: theme.colors.accent.blue },
  { id: 'weekly', title: 'Weekly', icon: 'calendar-week', color: theme.colors.accent.green },
  { id: 'friends', title: 'Friends', icon: 'user-friends', color: theme.colors.accent.pink },
  { id: 'local', title: 'Local', icon: 'map-marker-alt', color: theme.colors.accent.yellow },
];

const LEAGUES = {
  diamond: { name: 'Diamond', color: theme.colors.league.diamond, icon: 'gem', minXP: 50000 },
  emerald: { name: 'Emerald', color: theme.colors.league.emerald, icon: 'certificate', minXP: 25000 },
  sapphire: { name: 'Sapphire', color: theme.colors.league.sapphire, icon: 'award', minXP: 15000 },
  ruby: { name: 'Ruby', color: theme.colors.league.ruby, icon: 'medal', minXP: 8000 },
  gold: { name: 'Gold', color: theme.colors.league.gold, icon: 'trophy', minXP: 4000 },
  silver: { name: 'Silver', color: theme.colors.league.silver, icon: 'star', minXP: 2000 },
  bronze: { name: 'Bronze', color: theme.colors.league.bronze, icon: 'shield-alt', minXP: 0 },
};

export default function Leaderboard() {
  const isMounted = useRef(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

  // Animation values
  const fadeIn = useSharedValue(0);
  const podiumScale = useSharedValue(0.9);
  const crownRotation = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    isMounted.current = true;
    loadLeaderboard();
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, [currentFilter]);

  const startAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    podiumScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    
    // Crown rotation for #1 position
    crownRotation.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.sin) })
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

  const loadLeaderboard = async () => {
    try {
      if (!isMounted.current) return;
      setIsLoading(true);
      
      // Load real leaderboard data
      const leaderboard = await SupabaseService.getLeaderboard(currentFilter as any);
      if (!isMounted.current) return;
      setLeaderboardData(leaderboard);
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      if (!isMounted.current) return;
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const getLeague = (xp: number) => {
    for (const [key, league] of Object.entries(LEAGUES)) {
      if (xp >= league.minXP) {
        return { key, ...league };
      }
    }
    return { key: 'bronze', ...LEAGUES.bronze };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return theme.colors.status.online;
      case 'studying': return theme.colors.status.studying;
      default: return theme.colors.status.offline;
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'online': return 'circle';
      case 'studying': return 'book-open';
      default: return 'circle';
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const podiumAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: podiumScale.value }],
  }));

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
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

  const renderPodium = () => {
    const topThree = leaderboardData.slice(0, 3);
    if (topThree.length === 0) return null;

    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    const heights = [140, 180, 120];
    const podiumColors = [theme.colors.gradient.silver, theme.colors.gradient.gold, theme.colors.gradient.bronze];

    return (
      <Animated.View style={[styles.podiumContainer, podiumAnimatedStyle]}>
        <LinearGradient
          colors={[theme.colors.background.card, theme.colors.background.secondary]}
          style={styles.podiumCard}
        >
          {/* Shimmer effect */}
          <View style={styles.shimmerContainer}>
            <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
          
          <View style={styles.podiumHeader}>
            <FontAwesome5 name="crown" size={24} color={theme.colors.accent.gold} solid />
            <Text style={styles.podiumTitle}>Hall of Fame</Text>
            <FontAwesome5 name="trophy" size={24} color={theme.colors.accent.gold} solid />
          </View>
          
          <View style={styles.podiumRow}>
            {podiumOrder.map((user, index) => {
              if (!user) return null;
              const isWinner = user.rank === 1;
              const league = getLeague(user.total_xp);
              
              return (
                <PodiumUser
                  key={user.id}
                  user={user}
                  height={heights[index]}
                  isWinner={isWinner}
                  podiumColor={podiumColors[index]}
                  league={league}
                  index={index}
                />
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderListItem = (user: LeaderboardUser, index: number) => {
    if (index < 3) return null;

    const league = getLeague(user.total_xp);
    
    return (
      <LeaderboardListItem
        key={user.id}
        user={user}
        league={league}
        index={index - 3}
      />
    );
  };

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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.headerIcon}
          >
            <FontAwesome5 name="trophy" size={24} color={theme.colors.text.primary} solid />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Leaderboard</Text>
            <Text style={styles.headerSubtitle}>Compete with India's brightest minds</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.refreshButtonGradient}
            >
              <FontAwesome5 name="sync-alt" size={16} color={theme.colors.accent.cyan} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Enhanced Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((filter) => {
            const isActive = currentFilter === filter.id;
            
            return (
              <FilterTab
                key={filter.id}
                filter={filter}
                isActive={isActive}
                onPress={() => setCurrentFilter(filter.id)}
              />
            );
          })}
        </ScrollView>

        {/* Enhanced Current User Banner */}
        {currentUser && (
          <CurrentUserBanner user={currentUser} />
        )}
      </SafeAreaView>

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
          contentContainerStyle={styles.scrollContent}
        >
          {renderPodium()}

          <View style={styles.listContainer}>
            <View style={styles.listHeader}>
              <FontAwesome5 name="list-ol" size={20} color={theme.colors.accent.purple} />
              <Text style={styles.listTitle}>All Rankings</Text>
              <View style={styles.totalUsers}>
                <FontAwesome5 name="users" size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.totalUsersText}>{leaderboardData.length}+ students</Text>
              </View>
            </View>
            
            <View style={styles.usersList}>
              {leaderboardData.map((user, index) => renderListItem(user, index))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}

function FilterTab({ filter, isActive, onPress }: {
  filter: FilterTab;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  
  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={handlePress}
        style={styles.filterTab}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isActive
              ? [filter.color, filter.color + '80']
              : [theme.colors.background.card, theme.colors.background.secondary]
          }
          style={styles.filterTabGradient}
        >
          <FontAwesome5 
            name={filter.icon} 
            size={16} 
            color={isActive ? theme.colors.text.primary : theme.colors.text.tertiary}
            solid={isActive}
          />
          <Text style={[
            styles.filterTitle,
            { color: isActive ? theme.colors.text.primary : theme.colors.text.secondary }
          ]}>
            {filter.title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CurrentUserBanner({ user }: { user: LeaderboardUser }) {
  const league = getLeague(user.total_xp);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <Animated.View style={[styles.currentUserBanner, animatedStyle]}>
      <LinearGradient
        colors={[league.color + '30', league.color + '20']}
        style={styles.currentUserGradient}
      >
        <View style={styles.currentUserContent}>
          <View style={styles.currentUserLeft}>
            <FontAwesome5 name={league.icon} size={20} color={league.color} solid />
            <View style={styles.currentUserInfo}>
              <Text style={styles.currentUserRank}>Your Rank: #{user.rank}</Text>
              <Text style={styles.currentUserLeague}>{league.name} League</Text>
            </View>
          </View>
          
          <View style={styles.currentUserRight}>
            <Text style={styles.currentUserXP}>{user.total_xp.toLocaleString()} XP</Text>
            <View style={styles.currentUserStreak}>
              <FontAwesome5 name="fire" size={12} color={theme.colors.accent.yellow} solid />
              <Text style={styles.currentUserStreakText}>{user.streak_days}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function PodiumUser({ user, height, isWinner, podiumColor, league, index }: {
  user: LeaderboardUser;
  height: number;
  isWinner: boolean;
  podiumColor: string[];
  league: any;
  index: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 600 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 200);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return 'crown';
      case 2: return 'medal';
      case 3: return 'award';
      default: return 'trophy';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return theme.colors.accent.gold;
      case 2: return theme.colors.accent.silver;
      case 3: return theme.colors.accent.bronze;
      default: return theme.colors.accent.purple;
    }
  };

  return (
    <Animated.View style={[styles.podiumPerson, { height }, animatedStyle]}>
      {/* Podium Base */}
      <LinearGradient
        colors={podiumColor}
        style={[styles.podiumBase, { height: height * 0.4 }]}
      >
        <Text style={styles.podiumRankNumber}>{user.rank}</Text>
      </LinearGradient>
      
      {/* User Info */}
      <View style={styles.podiumUserInfo}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(user.rank) }]}>
          <FontAwesome5 
            name={getRankIcon(user.rank)} 
            size={isWinner ? 18 : 16} 
            color={theme.colors.text.primary} 
            solid 
          />
        </View>
        
        {/* Avatar */}
        <LinearGradient
          colors={[league.color, league.color + '80']}
          style={styles.podiumAvatar}
        >
          <Text style={styles.podiumAvatarText}>
            {user.full_name.charAt(0)}
          </Text>
          
          {/* Status indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(user.status) }]}>
            <FontAwesome5 
              name={getStatusIcon(user.status)} 
              size={8} 
              color={theme.colors.text.primary} 
              solid 
            />
          </View>
        </LinearGradient>
        
        {/* User Details */}
        <Text style={styles.podiumName} numberOfLines={2}>
          {user.full_name}
        </Text>
        
        <View style={styles.podiumStats}>
          <Text style={styles.podiumXP}>
            {user.total_xp.toLocaleString()} XP
          </Text>
          <Text style={styles.podiumLevel}>Level {user.current_level}</Text>
        </View>
        
        {/* League Badge */}
        <View style={[styles.leagueBadge, { backgroundColor: league.color + '20' }]}>
          <FontAwesome5 name={league.icon} size={10} color={league.color} solid />
          <Text style={[styles.leagueText, { color: league.color }]}>
            {league.name}
          </Text>
        </View>
        
        {/* Streak */}
        {user.streak_days > 0 && (
          <View style={styles.podiumStreak}>
            <FontAwesome5 name="fire" size={12} color={theme.colors.accent.yellow} solid />
            <Text style={styles.podiumStreakText}>{user.streak_days}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function LeaderboardListItem({ user, league, index }: {
  user: LeaderboardUser;
  league: any;
  index: number;
}) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 100);
  }, [index]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.listItem, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={[
          styles.listItemTouchable,
          user.is_current_user && styles.currentUserItem,
        ]}
      >
        <LinearGradient
          colors={
            user.is_current_user
              ? [theme.colors.accent.purple + '20', theme.colors.accent.blue + '20']
              : [theme.colors.background.card, theme.colors.background.secondary]
          }
          style={styles.listItemGradient}
        >
          {/* Rank */}
          <View style={[
            styles.rankContainer,
            user.is_current_user && styles.currentUserRank
          ]}>
            <Text style={[
              styles.rankText, 
              { color: user.is_current_user ? theme.colors.accent.purple : theme.colors.text.secondary }
            ]}>
              {user.rank}
            </Text>
          </View>

          {/* Avatar with League */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[league.color, league.color + '80']}
              style={styles.listAvatar}
            >
              <Text style={styles.listAvatarText}>{user.full_name.charAt(0)}</Text>
              
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(user.status) }]}>
                <FontAwesome5 
                  name={getStatusIcon(user.status)} 
                  size={6} 
                  color={theme.colors.text.primary} 
                  solid 
                />
              </View>
            </LinearGradient>
            
            {/* League badge */}
            <View style={[styles.miniLeagueBadge, { backgroundColor: league.color }]}>
              <FontAwesome5 name={league.icon} size={8} color={theme.colors.text.primary} solid />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoSection}>
            <View style={styles.userHeader}>
              <Text style={[
                styles.listUserName, 
                { color: user.is_current_user ? theme.colors.accent.purple : theme.colors.text.primary }
              ]} numberOfLines={1}>
                {user.full_name}
              </Text>
              <View style={styles.xpContainer}>
                <FontAwesome5 name="coins" size={12} color={theme.colors.accent.yellow} solid />
                <Text style={styles.listUserXP}>
                  {user.total_xp.toLocaleString()}
                </Text>
              </View>
            </View>
            
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <FontAwesome5 name="layer-group" size={10} color={theme.colors.accent.blue} />
                <Text style={styles.statText}>L{user.current_level}</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <FontAwesome5 name="map-marker-alt" size={10} color={theme.colors.accent.green} />
                <Text style={styles.statText}>{user.location}</Text>
              </View>
              
              {user.streak_days > 0 && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <FontAwesome5 name="fire" size={10} color={theme.colors.accent.yellow} solid />
                    <Text style={[styles.statText, { color: theme.colors.accent.yellow }]}>
                      {user.streak_days}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Challenge Button */}
          {!user.is_current_user && (
            <TouchableOpacity style={styles.challengeButton}>
              <LinearGradient
                colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
                style={styles.challengeButtonGradient}
              >
                <FontAwesome5 name="sword" size={12} color={theme.colors.text.primary} solid />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
  refreshButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  filtersContainer: {
    paddingBottom: theme.spacing.md,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  filterTab: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  filterTabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  filterTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
  },
  currentUserBanner: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  currentUserGradient: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  currentUserContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  currentUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  currentUserInfo: {
    gap: 2,
  },
  currentUserRank: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  currentUserLeague: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  currentUserRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  currentUserXP: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  currentUserStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  currentUserStreakText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  podiumContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  podiumCard: {
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
  podiumHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  podiumTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  podiumPerson: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  podiumBase: {
    width: '100%',
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
  },
  podiumRankNumber: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    opacity: 0.8,
  },
  podiumUserInfo: {
    alignItems: 'center',
    zIndex: 1,
    marginBottom: theme.spacing.lg,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.button,
  },
  podiumAvatar: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
    position: 'relative',
  },
  podiumAvatarText: {
    color: theme.colors.text.primary,
    fontSize: 24,
    fontFamily: theme.fonts.heading,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  podiumName: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    maxWidth: 80,
  },
  podiumStats: {
    alignItems: 'center',
    gap: 2,
    marginBottom: theme.spacing.sm,
  },
  podiumXP: {
    fontSize: 12,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.yellow,
  },
  podiumLevel: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
    marginBottom: theme.spacing.xs,
  },
  leagueText: {
    fontSize: 8,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
  },
  podiumStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  podiumStreakText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  totalUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  totalUsersText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  usersList: {
    gap: theme.spacing.md,
  },
  listItem: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  listItemTouchable: {
    borderRadius: theme.borderRadius.lg,
  },
  currentUserItem: {
    ...theme.shadows.glow,
  },
  listItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  currentUserRank: {
    backgroundColor: theme.colors.accent.purple + '20',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
  },
  rankText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  listAvatarText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.subheading,
    fontSize: 16,
  },
  miniLeagueBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  userInfoSection: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  listUserName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    flex: 1,
    marginRight: theme.spacing.md,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listUserXP: {
    fontSize: 14,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.yellow,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  statDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.text.muted,
  },
  challengeButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  challengeButtonGradient: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
});