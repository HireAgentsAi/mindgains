import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Alert,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { router } from 'expo-router';
import { supabaseService } from '@/utils/supabaseService';

const { width, height } = Dimensions.get('window');

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  topic: string;
  start_time: string;
  end_time: string;
  total_prize_pool: number;
  sponsor_name: string;
  status: 'upcoming' | 'live' | 'completed';
  total_participants: number;
  questions: any[];
}

interface StateLeaderboard {
  state: string;
  total_participants: number;
  average_score: number;
  state_rank: number;
  top_score: number;
}

interface TournamentMoment {
  id: string;
  moment_type: string;
  title: string;
  description: string;
  state?: string;
  timestamp: string;
  is_viral: boolean;
}

export default function IndiaChallenge() {
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge | null>(null);
  const [stateLeaderboard, setStateLeaderboard] = useState<StateLeaderboard[]>([]);
  const [tournamentMoments, setTournamentMoments] = useState<TournamentMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeToChallenge, setTimeToChallenge] = useState('');
  const [userState, setUserState] = useState('Maharashtra'); // User's state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prizeAnim = useRef(new Animated.Value(0)).current;
  const statesAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadChallengeData();
    startAnimations();
    
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const startAnimations = () => {
    // Pulsing animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Prize pool animation
    Animated.spring(prizeAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // States leaderboard animation
    Animated.stagger(100, 
      Array.from({length: 5}, (_, i) => 
        Animated.spring(statesAnim, {
          toValue: 1,
          delay: i * 100,
          useNativeDriver: true,
        })
      )
    ).start();
  };

  const loadChallengeData = async () => {
    try {
      setLoading(true);
      
      // Load today's challenge
      const challenge = await supabaseService.makeBattleRequest('get_daily_challenge', {
        date: new Date().toISOString().split('T')[0]
      });
      
      if (challenge) {
        setCurrentChallenge(challenge);
        
        // Load state leaderboard for this challenge
        const states = await supabaseService.makeBattleRequest('get_state_leaderboard', {
          challenge_id: challenge.id
        });
        setStateLeaderboard(states || []);
        
        // Load exciting moments
        const moments = await supabaseService.makeBattleRequest('get_tournament_moments', {
          challenge_id: challenge.id
        });
        setTournamentMoments(moments || []);
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!currentChallenge) return;
    
    const now = new Date();
    const challengeTime = new Date(currentChallenge.start_time);
    const diff = challengeTime.getTime() - now.getTime();
    
    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeToChallenge(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeToChallenge('LIVE NOW!');
    }
  };

  const joinChallenge = async () => {
    try {
      const result = await supabaseService.makeBattleRequest('join_daily_challenge', {
        challenge_id: currentChallenge?.id,
        state: userState
      });
      
      if (result.success) {
        setIsJoined(true);
        setShowJoinModal(false);
        Alert.alert(
          '🎯 Challenge Joined!',
          `You're representing ${userState} in tonight's India Challenge! Get ready at 9 PM sharp!`,
          [{ text: 'Let\'s Go!', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join challenge. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return theme.colors.status.online;
      case 'upcoming': return theme.colors.accent.yellow;
      case 'completed': return theme.colors.text.tertiary;
      default: return theme.colors.text.secondary;
    }
  };

  const getStateFlag = (state: string) => {
    const flags: { [key: string]: string } = {
      'Maharashtra': '🏛️', 'Tamil Nadu': '🏛️', 'Karnataka': '🏛️',
      'Gujarat': '🦁', 'Rajasthan': '🐪', 'Punjab': '🌾',
      'West Bengal': '🐅', 'Uttar Pradesh': '🕌', 'Delhi': '🏛️',
      'Kerala': '🥥', 'Andhra Pradesh': '⭐', 'Telangana': '💎'
    };
    return flags[state] || '🇮🇳';
  };

  const renderPrizePool = () => (
    <Animated.View style={[styles.prizePoolCard, { transform: [{ scale: prizeAnim }] }]}>
      <LinearGradient
        colors={[theme.colors.accent.gold + '20', theme.colors.accent.gold + '10']}
        style={styles.prizePoolGradient}
      >
        <View style={styles.prizeHeader}>
          <FontAwesome5 name="trophy" size={24} color={theme.colors.accent.gold} solid />
          <Text style={styles.prizeTitle}>Today's Prize Pool</Text>
        </View>
        
        <Text style={styles.prizeAmount}>₹{currentChallenge?.total_prize_pool.toLocaleString()}</Text>
        
        <View style={styles.prizeBreakdown}>
          <View style={styles.prizeItem}>
            <FontAwesome5 name="medal" size={16} color={theme.colors.accent.gold} solid />
            <Text style={styles.prizeText}>1st: ₹5,000</Text>
          </View>
          <View style={styles.prizeItem}>
            <FontAwesome5 name="medal" size={14} color={theme.colors.accent.silver} solid />
            <Text style={styles.prizeText}>2nd: ₹2,000</Text>
          </View>
          <View style={styles.prizeItem}>
            <FontAwesome5 name="medal" size={12} color={theme.colors.accent.bronze} solid />
            <Text style={styles.prizeText}>3rd: ₹1,000</Text>
          </View>
        </View>
        
        <Text style={styles.sponsorText}>Sponsored by {currentChallenge?.sponsor_name}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const renderStateWars = () => (
    <View style={styles.stateWarsCard}>
      <View style={styles.sectionHeader}>
        <FontAwesome5 name="flag" size={20} color={theme.colors.accent.purple} solid />
        <Text style={styles.sectionTitle}>State vs State Battle</Text>
        <FontAwesome5 name="fire" size={18} color={theme.colors.gradient.error[0]} solid />
      </View>
      
      <FlatList
        data={stateLeaderboard.slice(0, 5)}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View 
            style={[
              styles.stateCard, 
              { transform: [{ scale: statesAnim }] },
              index === 0 && styles.winningStateCard
            ]}
          >
            <View style={styles.stateRank}>
              <Text style={styles.rankNumber}>#{item.state_rank}</Text>
              {index === 0 && <FontAwesome5 name="crown" size={12} color={theme.colors.accent.gold} solid />}
            </View>
            
            <Text style={styles.stateFlag}>{getStateFlag(item.state)}</Text>
            <Text style={styles.stateName}>{item.state}</Text>
            
            <View style={styles.stateStats}>
              <Text style={styles.stateScore}>{item.average_score}</Text>
              <Text style={styles.stateParticipants}>{item.total_participants} players</Text>
            </View>
            
            {item.state === userState && (
              <View style={styles.yourStateIndicator}>
                <FontAwesome5 name="heart" size={10} color={theme.colors.accent.pink} solid />
                <Text style={styles.yourStateText}>Your State</Text>
              </View>
            )}
          </Animated.View>
        )}
        keyExtractor={(item) => item.state}
      />
    </View>
  );

  const renderLiveMoments = () => (
    <View style={styles.momentsCard}>
      <View style={styles.sectionHeader}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <FontAwesome5 name="broadcast-tower" size={18} color={theme.colors.status.online} solid />
        </Animated.View>
        <Text style={styles.sectionTitle}>Live Tournament Feed</Text>
      </View>
      
      {tournamentMoments.map((moment, index) => (
        <View key={moment.id} style={styles.momentItem}>
          <View style={styles.momentIcon}>
            <FontAwesome5 
              name={moment.is_viral ? "fire" : "bolt"} 
              size={14} 
              color={moment.is_viral ? theme.colors.gradient.error[0] : theme.colors.accent.blue} 
              solid 
            />
          </View>
          <View style={styles.momentContent}>
            <Text style={styles.momentTitle}>{moment.title}</Text>
            <Text style={styles.momentDescription}>{moment.description}</Text>
            <Text style={styles.momentTime}>{new Date(moment.timestamp).toLocaleTimeString()}</Text>
          </View>
          {moment.is_viral && (
            <TouchableOpacity style={styles.shareButton}>
              <FontAwesome5 name="share" size={12} color={theme.colors.accent.purple} solid />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderJoinModal = () => (
    <Modal visible={showJoinModal} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.joinModal}>
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.tertiary]}
            style={styles.joinModalContent}
          >
            <Text style={styles.joinModalTitle}>🇮🇳 Join India's Biggest Educational Battle!</Text>
            
            <View style={styles.challengeInfo}>
              <FontAwesome5 name="clock" size={16} color={theme.colors.accent.blue} solid />
              <Text style={styles.challengeTime}>Tonight at 9:00 PM IST</Text>
            </View>
            
            <View style={styles.challengeInfo}>
              <FontAwesome5 name="users" size={16} color={theme.colors.accent.green} solid />
              <Text style={styles.challengeParticipants}>
                {currentChallenge?.total_participants.toLocaleString()} Indians already joined!
              </Text>
            </View>
            
            <View style={styles.stateSelector}>
              <Text style={styles.stateSelectorLabel}>Representing:</Text>
              <TouchableOpacity style={styles.stateButton}>
                <Text style={styles.stateButtonText}>{getStateFlag(userState)} {userState}</Text>
                <FontAwesome5 name="chevron-down" size={12} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.joinButton} onPress={joinChallenge}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.joinButtonGradient}
              >
                <FontAwesome5 name="sword" size={18} color={theme.colors.text.primary} solid />
                <Text style={styles.joinButtonText}>Join the Battle!</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowJoinModal(false)}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.background.primary, theme.colors.background.secondary]}
          style={styles.loadingContainer}
        >
          <FontAwesome5 name="spinner" size={48} color={theme.colors.accent.purple} />
          <Text style={styles.loadingText}>Loading India Challenge...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background.primary} barStyle="light-content" />
      
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <FontAwesome5 name="flag-usa" size={24} color={theme.colors.accent.gold} solid />
              <Text style={styles.headerTitle}>Daily India Challenge</Text>
              <View style={[styles.liveIndicator, { backgroundColor: getStatusColor(currentChallenge?.status || 'upcoming') }]}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <FontAwesome5 name="circle" size={8} color={theme.colors.text.primary} solid />
                </Animated.View>
                <Text style={styles.liveText}>{currentChallenge?.status?.toUpperCase()}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.headerSubtitle}>
            {currentChallenge?.description || 'India\'s most exciting educational tournament'}
          </Text>
          
          {currentChallenge?.status === 'upcoming' && (
            <View style={styles.countdownContainer}>
              <FontAwesome5 name="stopwatch" size={16} color={theme.colors.accent.yellow} solid />
              <Text style={styles.countdownText}>Starts in: {timeToChallenge}</Text>
            </View>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Challenge Info */}
          <View style={styles.challengeCard}>
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.tertiary]}
              style={styles.challengeGradient}
            >
              <Text style={styles.challengeTitle}>{currentChallenge?.title}</Text>
              <Text style={styles.challengeTopic}>📚 {currentChallenge?.topic}</Text>
              
              <View style={styles.challengeStats}>
                <View style={styles.statItem}>
                  <FontAwesome5 name="users" size={16} color={theme.colors.accent.blue} solid />
                  <Text style={styles.statText}>{currentChallenge?.total_participants.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Participants</Text>
                </View>
                
                <View style={styles.statItem}>
                  <FontAwesome5 name="clock" size={16} color={theme.colors.accent.purple} solid />
                  <Text style={styles.statText}>30 min</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                
                <View style={styles.statItem}>
                  <FontAwesome5 name="question-circle" size={16} color={theme.colors.accent.green} solid />
                  <Text style={styles.statText}>20</Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>
              </View>
              
              {!isJoined && currentChallenge?.status === 'upcoming' && (
                <TouchableOpacity 
                  style={styles.primaryButton} 
                  onPress={() => setShowJoinModal(true)}
                >
                  <LinearGradient
                    colors={theme.colors.gradient.primary}
                    style={styles.primaryButtonGradient}
                  >
                    <FontAwesome5 name="plus" size={16} color={theme.colors.text.primary} solid />
                    <Text style={styles.primaryButtonText}>Join Challenge</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              {isJoined && (
                <View style={styles.joinedIndicator}>
                  <FontAwesome5 name="check-circle" size={16} color={theme.colors.accent.green} solid />
                  <Text style={styles.joinedText}>You're in! Representing {userState}</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Prize Pool */}
          {renderPrizePool()}

          {/* State Wars */}
          {renderStateWars()}

          {/* Live Moments */}
          {renderLiveMoments()}
        </ScrollView>

        {/* Join Modal */}
        {renderJoinModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.primary + '20',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.accent.yellow,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  challengeCard: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: theme.colors.background.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  challengeGradient: {
    padding: 20,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  challengeTopic: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  joinedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  joinedText: {
    fontSize: 14,
    color: theme.colors.accent.green,
    marginLeft: 8,
    fontWeight: '600',
  },
  prizePoolCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  prizePoolGradient: {
    padding: 20,
  },
  prizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prizeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  prizeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.accent.gold,
    textAlign: 'center',
    marginBottom: 16,
  },
  prizeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  sponsorText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  stateWarsCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  stateCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  winningStateCard: {
    borderWidth: 2,
    borderColor: theme.colors.accent.gold,
  },
  stateRank: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  stateFlag: {
    fontSize: 24,
    marginBottom: 8,
  },
  stateName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stateStats: {
    alignItems: 'center',
  },
  stateScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.accent.blue,
  },
  stateParticipants: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  yourStateIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  yourStateText: {
    fontSize: 10,
    color: theme.colors.accent.pink,
    marginLeft: 4,
  },
  momentsCard: {
    marginBottom: 20,
  },
  momentItem: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  momentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  momentContent: {
    flex: 1,
  },
  momentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  momentDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  momentTime: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinModal: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  joinModalContent: {
    padding: 24,
  },
  joinModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeTime: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 8,
    fontWeight: '600',
  },
  challengeParticipants: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  stateSelector: {
    marginVertical: 16,
  },
  stateSelectorLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 12,
    padding: 12,
  },
  stateButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
});