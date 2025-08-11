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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { 
  Crown,
  Trophy,
  Medal,
  Star,
  Globe,
  Calendar,
  Users,
  MapPin,
} from 'lucide-react-native';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');

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
}

interface FilterTab {
  id: string;
  title: string;
  icon: any;
}

const FILTERS: FilterTab[] = [
  { id: 'global', title: 'Global', icon: Globe },
  { id: 'weekly', title: 'Weekly', icon: Calendar },
  { id: 'friends', title: 'Friends', icon: Users },
  { id: 'local', title: 'Local', icon: MapPin },
];

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

  const fadeIn = useSharedValue(0);

  useEffect(() => {
    loadLeaderboard();
    fadeIn.value = withTiming(1, { duration: 800 });
  }, [currentFilter]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      const mockData: LeaderboardUser[] = [
        { 
          id: '1', 
          full_name: 'Rahul Kumar', 
          total_xp: 4750, 
          current_level: 18, 
          streak_days: 32, 
          rank: 1, 
          location: 'Delhi',
          is_current_user: false 
        },
        { 
          id: '2', 
          full_name: 'Priya Sharma', 
          total_xp: 4340, 
          current_level: 16, 
          streak_days: 28, 
          rank: 2, 
          location: 'Mumbai'
        },
        { 
          id: '3', 
          full_name: 'Amit Singh', 
          total_xp: 3980, 
          current_level: 15, 
          streak_days: 24, 
          rank: 3, 
          location: 'Bangalore'
        },
        { 
          id: '4', 
          full_name: 'You', 
          total_xp: 3450, 
          current_level: 12, 
          streak_days: 15, 
          rank: 4, 
          location: 'Chennai',
          is_current_user: true 
        },
        { 
          id: '5', 
          full_name: 'Sneha Patel', 
          total_xp: 3200, 
          current_level: 11, 
          streak_days: 18, 
          rank: 5, 
          location: 'Pune'
        },
      ];

      setLeaderboardData(mockData);
      setCurrentUser(mockData.find(u => u.is_current_user) || null);
      
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const renderPodium = () => {
    const topThree = leaderboardData.slice(0, 3);
    if (topThree.length === 0) return null;

    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    const heights = [120, 160, 100];

    return (
      <View style={styles.podiumContainer}>
        <Text style={[styles.podiumTitle, { color: theme.colors.text.primary }]}>
          Top Champions
        </Text>
        
        <View style={styles.podiumRow}>
          {podiumOrder.map((user, index) => {
            if (!user) return null;
            const isWinner = user.rank === 1;
            
            return (
              <View key={user.id} style={[styles.podiumPerson, { height: heights[index] }]}>
                <View style={[styles.rankBadge, { 
                  backgroundColor: isWinner ? theme.colors.warning : theme.colors.primary 
                }]}>
                  {isWinner ? (
                    <Crown size={16} color="#ffffff" />
                  ) : (
                    <Text style={styles.rankNumber}>{user.rank}</Text>
                  )}
                </View>
                
                <View style={[styles.avatar, { 
                  backgroundColor: isWinner ? theme.colors.warning : theme.colors.primary 
                }]}>
                  <Text style={styles.avatarText}>
                    {user.full_name.charAt(0)}
                  </Text>
                </View>
                
                <Text style={[styles.podiumName, { color: theme.colors.text.primary }]} numberOfLines={2}>
                  {user.full_name}
                </Text>
                <Text style={[styles.podiumXP, { color: theme.colors.primary }]}>
                  {user.total_xp.toLocaleString()} XP
                </Text>
                {user.streak_days > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {user.streak_days}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderListItem = (user: LeaderboardUser, index: number) => {
    if (index < 3) return null;

    return (
      <TouchableOpacity
        key={user.id}
        style={[
          styles.listItem,
          user.is_current_user && styles.currentUserItem,
        ]}
        activeOpacity={0.8}
      >
        <View style={[styles.rankContainer, user.is_current_user && styles.currentUserRank]}>
          <Text style={[
            styles.rankText, 
            { color: user.is_current_user ? theme.colors.primary : theme.colors.text.secondary }
          ]}>
            {user.rank}
          </Text>
        </View>

        <View style={[styles.listAvatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.listAvatarText}>{user.full_name.charAt(0)}</Text>
        </View>

        <View style={styles.userInfoSection}>
          <View style={styles.userHeader}>
            <Text style={[
              styles.listUserName, 
              { color: user.is_current_user ? theme.colors.primary : theme.colors.text.primary }
            ]} numberOfLines={1}>
              {user.full_name}
            </Text>
            <View style={styles.xpContainer}>
              <Text style={[styles.listUserXP, { color: theme.colors.primary }]}>
                {user.total_xp.toLocaleString()}
              </Text>
              <Text style={[styles.xpLabel, { color: theme.colors.text.tertiary }]}>XP</Text>
            </View>
          </View>
          
          <View style={styles.userStats}>
            <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
              Level {user.current_level}
            </Text>
            <View style={styles.statDot} />
            <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
              📍 {user.location}
            </Text>
            {user.streak_days > 0 && (
              <>
                <View style={styles.statDot} />
                <Text style={[styles.statText, { color: theme.colors.warning }]}>
                  🔥 {user.streak_days}
                </Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={theme.colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Trophy size={24} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Leaderboard
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((filter) => {
          const IconComponent = filter.icon;
          const isActive = currentFilter === filter.id;
          
          return (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setCurrentFilter(filter.id)}
              style={[
                styles.filterTab,
                isActive && styles.activeFilterTab
              ]}
              activeOpacity={0.8}
            >
              <IconComponent 
                size={16} 
                color={isActive ? '#ffffff' : theme.colors.text.tertiary} 
              />
              <Text style={[
                styles.filterTitle,
                { color: isActive ? '#ffffff' : theme.colors.text.secondary }
              ]}>
                {filter.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Current User Banner */}
      {currentUser && (
        <View style={styles.currentUserBanner}>
          <Text style={[styles.currentUserText, { color: theme.colors.text.primary }]}>
            Your Rank: #{currentUser.rank} • {currentUser.total_xp.toLocaleString()} XP
          </Text>
        </View>
      )}

      {/* Content */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {renderPodium()}

          <View style={styles.listContainer}>
            <Text style={[styles.listTitle, { color: theme.colors.text.primary }]}>
              All Rankings
            </Text>
            {leaderboardData.map((user, index) => renderListItem(user, index))}
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
    gap: theme.spacing.sm,
  },
  
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  
  filtersContainer: {
    paddingBottom: theme.spacing.md,
  },
  
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.background.secondary,
    gap: theme.spacing.xs,
  },
  
  activeFilterTab: {
    backgroundColor: theme.colors.primary,
  },
  
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  currentUserBanner: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  
  currentUserText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  podiumContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.card,
  },
  
  podiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  
  podiumPerson: {
    alignItems: 'center',
    flex: 1,
  },
  
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  rankNumber: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 20,
  },
  
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    maxWidth: 80,
  },
  
  podiumXP: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  streakBadge: {
    backgroundColor: theme.colors.warning + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: 10,
  },
  
  streakText: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
  },
  
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: theme.spacing.lg,
  },
  
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  
  currentUserItem: {
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    backgroundColor: theme.colors.primary + '05',
  },
  
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  currentUserRank: {
    backgroundColor: theme.colors.primary + '20',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
  },
  
  rankText: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  
  listAvatarText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
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
    fontWeight: '600',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  
  listUserXP: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  xpLabel: {
    fontSize: 10,
  },
  
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statText: {
    fontSize: 12,
  },
  
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: theme.colors.text.quaternary,
    marginHorizontal: theme.spacing.sm,
  },
});