import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
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
  withDelay,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';

const { width = 375 } = Dimensions.get('window') || {};

interface BattleResult {
  id: string;
  full_name: string;
  score: number;
  rank: number;
  is_current_user?: boolean;
}

// Floating confetti component
function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(Math.random() * width);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const delay = Math.random() * 2000;
    const duration = 3000 + Math.random() * 2000;
    
    setTimeout(() => {
      translateY.value = withTiming(800, { duration });
      rotation.value = withTiming(360 * 3, { duration });
      opacity.value = withTiming(0, { duration: duration * 0.8 });
    }, delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const colors = [
    theme.colors.accent.purple,
    theme.colors.accent.blue,
    theme.colors.accent.cyan,
    theme.colors.accent.yellow,
    theme.colors.accent.green,
    theme.colors.accent.pink,
  ];

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: colors[index % colors.length],
          left: Math.random() * width,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function BattleResultsScreen() {
  const params = useLocalSearchParams();
  const { roomId, winnerId, winnerName, winnerScore, players: playersParam, topic, subject } = params;
  
  const [players, setPlayers] = useState<BattleResult[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values
  const fadeIn = useSharedValue(0);
  const winnerScale = useSharedValue(0);
  const podiumOpacity = useSharedValue(0);
  const crownRotation = useSharedValue(0);
  const celebrationPulse = useSharedValue(1);

  useEffect(() => {
    loadResults();
    startCelebrationAnimations();
  }, []);

  const loadResults = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      setCurrentUser(user);
      
      if (playersParam) {
        const parsedPlayers = JSON.parse(playersParam as string);
        const rankedPlayers = parsedPlayers.map((player: any, index: number) => ({
          ...player,
          rank: index + 1,
          is_current_user: player.user_id === user?.id,
        }));
        
        setPlayers(rankedPlayers);
        
        // Show confetti for winner
        if (rankedPlayers[0]?.is_current_user) {
          setShowConfetti(true);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const startCelebrationAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    winnerScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    podiumOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    
    // Crown rotation
    crownRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    
    // Celebration pulse
    celebrationPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  };

  const handleShare = async () => {
    const currentUserResult = players.find(p => p.is_current_user);
    const isWinner = currentUserResult?.rank === 1;
    
    const shareText = `${isWinner ? '🏆 VICTORY!' : '⚔️ Battle Complete!'} 

Just ${isWinner ? 'WON' : 'fought in'} an epic quiz battle on MindGains AI!

📊 Battle Results:
${isWinner ? '👑' : '🥇'} Rank: #${currentUserResult?.rank || 'N/A'}
⭐ Score: ${currentUserResult?.score || 0} points
🎯 Topic: ${topic} (${subject})

${isWinner 
  ? 'I dominated this battle! 💪' 
  : 'Great battle! Ready for a rematch! 🔥'
}

Challenge me on India's #1 AI learning platform:
📱 Download: https://mindgains.ai

#MindGainsAI #QuizBattle #CompetitiveExams #${isWinner ? 'Victory' : 'Challenge'}`;

    try {
      await Share.share({
        message: shareText,
        title: 'Quiz Battle Results',
      });
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  const handleRematch = () => {
    router.push({
      pathname: '/battle/room',
      params: { roomId: `rematch_${Date.now()}` },
    });
  };

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

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1: return 120;
      case 2: return 100;
      case 3: return 80;
      default: return 60;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const winnerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: winnerScale.value }],
  }));

  const podiumAnimatedStyle = useAnimatedStyle(() => ({
    opacity: podiumOpacity.value,
    transform: [{ translateY: interpolate(podiumOpacity.value, [0, 1], [20, 0]) }],
  }));

  const crownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${crownRotation.value}deg` }],
  }));

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationPulse.value }],
  }));

  const winner = players.find(p => p.rank === 1);
  const currentUserResult = players.find(p => p.is_current_user);
  const isCurrentUserWinner = currentUserResult?.rank === 1;

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
      
      {/* Confetti */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(30)].map((_, index) => (
            <ConfettiPiece key={index} index={index} />
          ))}
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, animatedStyle]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.replace('/(tabs)/battle')}
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
            <Text style={styles.headerTitle}>Battle Results</Text>
            <Text style={styles.headerSubtitle}>{topic} • {subject}</Text>
          </View>
          
          <TouchableOpacity style={styles.shareHeaderButton} onPress={handleShare}>
            <LinearGradient
              colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
              style={styles.shareHeaderButtonGradient}
            >
              <FontAwesome5 name="share-alt" size={16} color={theme.colors.text.primary} solid />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Winner Announcement */}
        <Animated.View style={[styles.winnerSection, winnerAnimatedStyle]}>
          <Animated.View style={celebrationAnimatedStyle}>
            <MascotAvatar
              size={100}
              animated={true}
              glowing={true}
              mood="celebrating"
            />
          </Animated.View>
          
          <LinearGradient
            colors={[theme.colors.accent.gold, theme.colors.accent.yellow]}
            style={styles.winnerBadge}
          >
            <Animated.View style={crownAnimatedStyle}>
              <FontAwesome5 name="crown" size={32} color={theme.colors.text.primary} solid />
            </Animated.View>
            <Text style={styles.winnerTitle}>Battle Champion!</Text>
          </LinearGradient>
          
          <Text style={styles.winnerName}>{winner?.full_name || 'Unknown'}</Text>
          <Text style={styles.winnerScore}>{winner?.score || 0} points</Text>
          
          <Text style={styles.celebrationMessage}>
            {isCurrentUserWinner 
              ? "🎉 VICTORY IS YOURS! You dominated this epic battle! 🏆"
              : `🔥 ${winner?.full_name} conquered this battle! Epic fight! 💪`
            }
          </Text>
        </Animated.View>

        {/* Podium */}
        <Animated.View style={[styles.podiumSection, podiumAnimatedStyle]}>
          <Text style={styles.podiumTitle}>
            <FontAwesome5 name="trophy" size={20} color={theme.colors.accent.gold} solid />
            {' '}Final Rankings
          </Text>
          
          <View style={styles.podiumContainer}>
            {players.slice(0, 3).map((player, index) => (
              <PodiumPlayer
                key={player.id}
                player={player}
                index={index}
                height={getPodiumHeight(player.rank)}
              />
            ))}
          </View>
        </Animated.View>

        {/* Detailed Results */}
        <View style={styles.detailedResultsSection}>
          <Text style={styles.sectionTitle}>Battle Statistics</Text>
          
          <View style={styles.resultsList}>
            {players.map((player, index) => (
              <ResultCard key={player.id} player={player} index={index} />
            ))}
          </View>
        </View>

        {/* Battle Summary */}
        <View style={styles.summarySection}>
          <LinearGradient
            colors={[
              theme.colors.background.card,
              theme.colors.background.secondary,
            ]}
            style={styles.summaryCard}
          >
            <View style={styles.summaryHeader}>
              <FontAwesome5 name="chart-bar" size={20} color={theme.colors.accent.blue} solid />
              <Text style={styles.summaryTitle}>Battle Summary</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{players.length}</Text>
                <Text style={styles.summaryStatLabel}>Warriors</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>5</Text>
                <Text style={styles.summaryStatLabel}>Questions</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{Math.max(...players.map(p => p.score))}</Text>
                <Text style={styles.summaryStatLabel}>Top Score</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>
                  {Math.round(players.reduce((sum, p) => sum + p.score, 0) / players.length)}
                </Text>
                <Text style={styles.summaryStatLabel}>Avg Score</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <GradientButton
            title="Challenge Again"
            onPress={handleRematch}
            size="large"
            fullWidth
            icon={<FontAwesome5 name="redo" size={16} color={theme.colors.text.primary} solid />}
            colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
            style={styles.actionButton}
          />
          
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
          >
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.shareButtonGradient}
            >
              <FontAwesome5 name="share-alt" size={16} color={theme.colors.accent.cyan} solid />
              <Text style={styles.shareButtonText}>Share Results</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <GradientButton
            title="Back to Battle Arena"
            onPress={() => router.replace('/(tabs)/battle')}
            size="large"
            fullWidth
            icon={<FontAwesome5 name="home" size={16} color={theme.colors.text.primary} solid />}
            colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </LinearGradient>
  );
}

function PodiumPlayer({ player, index, height }: {
  player: BattleResult;
  index: number;
  height: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 600 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 300);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return [theme.colors.accent.gold, theme.colors.accent.yellow];
      case 2: return [theme.colors.accent.silver, '#c0c0c0'];
      case 3: return [theme.colors.accent.bronze, '#cd7f32'];
      default: return [theme.colors.accent.purple, theme.colors.accent.blue];
    }
  };

  return (
    <Animated.View style={[styles.podiumPlayer, { height }, animatedStyle]}>
      {/* Podium Base */}
      <LinearGradient
        colors={getRankColor(player.rank)}
        style={[styles.podiumBase, { height: height * 0.4 }]}
      >
        <Text style={styles.podiumRankNumber}>{player.rank}</Text>
      </LinearGradient>
      
      {/* Player Info */}
      <View style={styles.podiumPlayerInfo}>
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: getRankColor(player.rank)[0] }]}>
          <FontAwesome5 
            name={getRankIcon(player.rank)} 
            size={player.rank === 1 ? 20 : 16} 
            color={theme.colors.text.primary} 
            solid 
          />
        </View>
        
        {/* Avatar */}
        <LinearGradient
          colors={getRankColor(player.rank)}
          style={styles.podiumAvatar}
        >
          <Text style={styles.podiumAvatarText}>
            {player.full_name.charAt(0)}
          </Text>
        </LinearGradient>
        
        {/* Player Details */}
        <Text style={styles.podiumName} numberOfLines={2}>
          {player.full_name}
          {player.is_current_user && ' (You)'}
        </Text>
        
        <Text style={styles.podiumScore}>{player.score} pts</Text>
        
        {player.rank === 1 && (
          <View style={styles.winnerCrown}>
            <FontAwesome5 name="crown" size={16} color={theme.colors.accent.gold} solid />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ResultCard({ player, index }: {
  player: BattleResult;
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 200);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.resultCard, animatedStyle]}>
      <LinearGradient
        colors={
          player.is_current_user
            ? [theme.colors.accent.purple + '30', theme.colors.accent.purple + '20']
            : [theme.colors.background.card, theme.colors.background.secondary]
        }
        style={[
          styles.resultCardGradient,
          player.is_current_user && styles.currentUserResult,
        ]}
      >
        <View style={styles.resultRank}>
          <LinearGradient
            colors={[getRankColor(player.rank), getRankColor(player.rank) + '80']}
            style={styles.resultRankBadge}
          >
            <Text style={styles.resultRankText}>#{player.rank}</Text>
          </LinearGradient>
        </View>

        <View style={styles.resultPlayerInfo}>
          <LinearGradient
            colors={[getRankColor(player.rank), getRankColor(player.rank) + '80']}
            style={styles.resultAvatar}
          >
            <Text style={styles.resultAvatarText}>
              {player.full_name.charAt(0)}
            </Text>
          </LinearGradient>
          
          <View style={styles.resultDetails}>
            <Text style={[
              styles.resultPlayerName,
              player.is_current_user && { color: theme.colors.accent.purple }
            ]}>
              {player.full_name}
              {player.is_current_user && ' (You)'}
            </Text>
            <Text style={styles.resultPlayerScore}>{player.score} points</Text>
          </View>
        </View>

        <View style={styles.resultBadges}>
          {player.rank <= 3 && (
            <View style={[styles.medalBadge, { backgroundColor: getRankColor(player.rank) + '20' }]}>
              <FontAwesome5 
                name={getRankIcon(player.rank)} 
                size={16} 
                color={getRankColor(player.rank)} 
                solid 
              />
            </View>
          )}
          
          {player.is_current_user && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
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
  shareHeaderButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  shareHeaderButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  winnerSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    ...theme.shadows.card,
  },
  winnerTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  winnerName: {
    fontSize: 28,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  winnerScore: {
    fontSize: 20,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.green,
  },
  celebrationMessage: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  podiumSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  podiumTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  podiumPlayer: {
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
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    opacity: 0.8,
  },
  podiumPlayerInfo: {
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
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  podiumAvatarText: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontFamily: theme.fonts.heading,
  },
  podiumName: {
    fontSize: 12,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    maxWidth: 80,
  },
  podiumScore: {
    fontSize: 14,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.yellow,
  },
  winnerCrown: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
  },
  detailedResultsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  resultsList: {
    gap: theme.spacing.md,
  },
  resultCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  resultCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  currentUserResult: {
    borderColor: theme.colors.accent.purple,
    ...theme.shadows.glow,
  },
  resultRank: {
    marginRight: theme.spacing.md,
  },
  resultRankBadge: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultRankText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  resultPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultAvatarText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
  },
  resultDetails: {
    flex: 1,
  },
  resultPlayerName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  resultPlayerScore: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
  },
  resultBadges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  medalBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  youBadge: {
    backgroundColor: theme.colors.accent.purple + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  youBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    fontWeight: 'bold',
  },
  summarySection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  summaryStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  actionsContainer: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  shareButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  shareButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.cyan,
  },
  bottomSpacing: {
    height: 20,
  },
});

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return 'crown';
    case 2: return 'medal';
    case 3: return 'award';
    default: return 'trophy';
  }
}

function getRankColor(rank: number) {
  switch (rank) {
    case 1: return theme.colors.accent.gold;
    case 2: return theme.colors.accent.silver;
    case 3: return theme.colors.accent.bronze;
    default: return theme.colors.accent.purple;
  }
}