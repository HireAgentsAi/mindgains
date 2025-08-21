import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Dimensions,
  Share,
  RefreshControl,
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
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

const { width = 375 } = Dimensions.get('window') || {};

interface PopularTopic {
  name: string;
  category: string;
  popularity: number;
  examRelevance: string;
}

interface BattleRoom {
  id: string;
  name: string;
  host_name: string;
  subject_name: string;
  difficulty: string;
  bet_amount: number;
  current_participants: number;
  max_participants: number;
  room_code: string;
  created_at: string;
}

// Floating battle particles for epic feel
function BattleParticle({ index }: { index: number }) {
  const translateY = useSharedValue(Math.random() * 800);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0.1 + Math.random() * 0.3);
  const scale = useSharedValue(0.5 + Math.random() * 0.5);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withTiming(
        translateY.value - 200 - Math.random() * 300, 
        { duration: 8000 + Math.random() * 4000, easing: Easing.linear }
      );
      
      rotation.value = withTiming(360, { duration: 8000 });
      
      opacity.value = withSequence(
        withTiming(0.4, { duration: 2000 }),
        withTiming(0, { duration: 4000 })
      );
    };
    
    const timer = setTimeout(startAnimation, index * 300);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const icons = ['⚔️', '🏆', '⚡', '🔥', '💎', '👑', '🎯', '💪'];
  const icon = icons[index % icons.length];

  return (
    <Animated.View style={[styles.battleParticle, animatedStyle]}>
      <Text style={styles.battleParticleText}>{icon}</Text>
    </Animated.View>
  );
}

export default function Battle() {
  const isMounted = useRef(true);
  const [popularTopics, setPopularTopics] = useState<PopularTopic[]>([]);
  const [battleRooms, setBattleRooms] = useState<BattleRoom[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [betAmount, setBetAmount] = useState(100);
  const [userCoins, setUserCoins] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCreatingBattle, setIsCreatingBattle] = useState(false);
  const [showCustomBattle, setShowCustomBattle] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const coinsScale = useSharedValue(1);
  const quickBattleScale = useSharedValue(0.95);
  const topicsOpacity = useSharedValue(0);
  const roomsOpacity = useSharedValue(0);
  const battleGlow = useSharedValue(0);
  const swordRotation = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    loadBattleData();
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startAnimations = () => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 800 });
    quickBattleScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    topicsOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
    roomsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));

    // Continuous animations
    battleGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    swordRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 3000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Coins pulse
    coinsScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  };

  const loadBattleData = async () => {
    try {
      if (!isMounted.current) return;
      setIsLoading(true);

      // Check authentication
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        if (!isMounted.current) return;
        router.replace('/auth');
        return;
      }

      // Load user coins
      const coins = await SupabaseService.getUserCoins(user.id);
      if (!isMounted.current) return;
      setUserCoins(coins?.balance || 1000);

      // Load popular topics
      const topics = await SupabaseService.callEdgeFunction('ai-battle-content', {
        action: 'get_popular_topics',
      });
      
      if (!isMounted.current) return;
      setPopularTopics(topics || []);

      // Load active battle rooms
      const rooms = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'get_battle_rooms',
      });
      
      if (!isMounted.current) return;
      setBattleRooms(rooms || []);

    } catch (error) {
      console.error('Error loading battle data:', error);
      if (!isMounted.current) return;
      // Set demo data for offline mode
      setPopularTopics([
        {
          name: "Indian History and Freedom Struggle",
          category: "History",
          popularity: 95,
          examRelevance: "UPSC, SSC, State PCS"
        },
        {
          name: "Indian Constitution and Polity",
          category: "Polity", 
          popularity: 92,
          examRelevance: "UPSC, Banking, SSC"
        },
        {
          name: "Current Affairs 2024",
          category: "Current Affairs",
          popularity: 96,
          examRelevance: "All Competitive Exams"
        },
      ]);
      setUserCoins(1000);
    } finally {
      if (!isMounted.current) return;
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBattleData();
  };

  const handleQuickBattle = async () => {
    try {
      setIsCreatingBattle(true);
      
      // Animate quick battle button
      quickBattleScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withSpring(1, { damping: 15, stiffness: 120 })
      );

      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Check if user has enough coins
      if (userCoins < betAmount) {
        Alert.alert(
          'Insufficient Coins',
          `You need ${betAmount} coins to start a battle. You have ${userCoins} coins.`,
          [
            { text: 'Get More Coins', onPress: () => router.push('/subscription') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Find or create a quick battle
      const result = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'find_or_create_battle',
        topic_id: null,
        subject_name: 'Mixed Indian Competitive Exams',
        difficulty: selectedDifficulty,
        bet_amount: betAmount,
      });

      if (result.success) {
        // Navigate to battle room
        router.push({
          pathname: '/battle/room',
          params: { roomId: result.battleRoom.id },
        });
      } else {
        throw new Error(result.error || 'Failed to create battle');
      }
    } catch (error) {
      console.error('Error creating quick battle:', error);
      Alert.alert('Error', 'Failed to create battle. Please try again.');
    } finally {
      setIsCreatingBattle(false);
    }
  };

  const handleCustomBattle = async () => {
    if (!customTopic.trim()) {
      Alert.alert('Missing Topic', 'Please enter a topic for your custom battle.');
      return;
    }

    try {
      setIsCreatingBattle(true);

      // First, moderate the topic using AI
      const moderation = await SupabaseService.callEdgeFunction('ai-battle-content', {
        action: 'moderate_topic',
        topic: customTopic.trim(),
      });

      if (!moderation.isAppropriate) {
        Alert.alert(
          moderation.warning || 'Inappropriate Content',
          moderation.message,
          [
            { text: 'Choose Different Topic', style: 'cancel' },
            {
              text: 'See Suggestions',
              onPress: () => {
                const suggestions = moderation.suggestedTopics?.join('\n• ') || '';
                Alert.alert('Suggested Topics', `• ${suggestions}`);
              }
            }
          ]
        );
        return;
      }

      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Check subscription for custom topics
      const limits = await SupabaseService.checkUserLimits(user.id);
      if (!limits.isPremium) {
        Alert.alert(
          'Premium Feature',
          'Custom battle topics are available for Premium users only. Upgrade to unlock unlimited custom battles!',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => router.push('/subscription') }
          ]
        );
        return;
      }

      // Create custom battle room
      const result = await SupabaseService.createBattleRoom({
        name: `🎯 ${moderation.enhancedTopic || customTopic}`,
        topic_id: null,
        subject_name: moderation.enhancedTopic || customTopic,
        difficulty: selectedDifficulty,
        bet_amount: betAmount,
        max_participants: 4,
      });

      if (result.success) {
        setCustomTopic('');
        setShowCustomBattle(false);
        
        // Navigate to battle room
        router.push({
          pathname: '/battle/room',
          params: { roomId: result.battleRoom.id },
        });
      } else {
        throw new Error(result.error || 'Failed to create custom battle');
      }
    } catch (error) {
      console.error('Error creating custom battle:', error);
      Alert.alert('Error', 'Failed to create custom battle. Please try again.');
    } finally {
      setIsCreatingBattle(false);
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const result = await SupabaseService.joinBattleRoom(roomCode);
      
      if (result.success) {
        router.push({
          pathname: '/battle/room',
          params: { roomId: result.battleRoom.id },
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to join battle room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join battle room');
    }
  };

  const handleTopicBattle = async (topic: PopularTopic) => {
    try {
      setIsCreatingBattle(true);

      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Create battle for this topic
      const result = await SupabaseService.callEdgeFunction('battle-operations', {
        action: 'find_or_create_battle',
        topic_id: null,
        subject_name: topic.name,
        difficulty: selectedDifficulty,
        bet_amount: betAmount,
      });

      if (result.success) {
        router.push({
          pathname: '/battle/room',
          params: { roomId: result.battleRoom.id },
        });
      } else {
        throw new Error(result.error || 'Failed to create topic battle');
      }
    } catch (error) {
      console.error('Error creating topic battle:', error);
      Alert.alert('Error', 'Failed to create battle. Please try again.');
    } finally {
      setIsCreatingBattle(false);
    }
  };

  const handleShareBattle = async () => {
    const shareText = `🔥 Join me for an epic Quiz Battle on MindGains AI! 🔥

💰 Bet: ${betAmount} coins
🎯 Difficulty: ${selectedDifficulty}
🏆 Winner takes all!

Challenge your knowledge in India's #1 AI learning platform!

Download MindGains AI: https://mindgains.ai
#MindGainsAI #QuizBattle #CompetitiveExams`;

    try {
      await Share.share({
        message: shareText,
        title: 'Quiz Battle Challenge',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Animation styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const coinsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coinsScale.value }],
  }));

  const quickBattleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: quickBattleScale.value }],
    shadowOpacity: 0.3 + battleGlow.value * 0.4,
    shadowRadius: 20 + battleGlow.value * 30,
  }));

  const topicsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: topicsOpacity.value,
    transform: [{ translateY: interpolate(topicsOpacity.value, [0, 1], [20, 0]) }],
  }));

  const roomsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: roomsOpacity.value,
    transform: [{ translateY: interpolate(roomsOpacity.value, [0, 1], [30, 0]) }],
  }));

  const swordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swordRotation.value}deg` }],
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
          <MascotAvatar size={100} animated={true} glowing={true} mood="excited" />
          <Text style={styles.loadingText}>Preparing battle arena...</Text>
          <Text style={styles.loadingSubtext}>Loading epic quiz battles for you!</Text>
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
      
      {/* Battle Particles */}
      <View style={styles.particlesContainer}>
        {[...Array(15)].map((_, index) => (
          <BattleParticle key={index} index={index} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header */}
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <LinearGradient
                colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
                style={styles.battleIcon}
              >
                <Animated.View style={swordAnimatedStyle}>
                  <FontAwesome5 name="fist-raised" size={28} color={theme.colors.text.primary} solid />
                </Animated.View>
              </LinearGradient>
              <View style={styles.titleText}>
                <Text style={styles.headerTitle}>Battle Arena</Text>
                <Text style={styles.headerSubtitle}>Challenge friends & earn coins</Text>
              </View>
            </View>
            
            <Animated.View style={[styles.coinsDisplay, coinsAnimatedStyle]}>
              <LinearGradient
                colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
                style={styles.coinsGradient}
              >
                <FontAwesome5 name="coins" size={16} color={theme.colors.text.primary} solid />
                <Text style={styles.coinsText}>{userCoins.toLocaleString()}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.content}
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
          {/* Quick Battle Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="bolt" size={20} color={theme.colors.accent.yellow} solid />
              {' '}Quick Battle
            </Text>
            <Text style={styles.sectionSubtitle}>
              Instant matchmaking with smart opponents
            </Text>

            <Animated.View style={[styles.quickBattleCard, quickBattleAnimatedStyle]}>
              <LinearGradient
                colors={[theme.colors.accent.pink, theme.colors.accent.purple, theme.colors.accent.blue]}
                style={styles.quickBattleGradient}
              >
                {/* Battle Settings */}
                <View style={styles.battleSettings}>
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Difficulty:</Text>
                    <View style={styles.difficultySelector}>
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <TouchableOpacity
                          key={diff}
                          style={[
                            styles.difficultyChip,
                            selectedDifficulty === diff && styles.selectedDifficultyChip,
                          ]}
                          onPress={() => setSelectedDifficulty(diff)}
                        >
                          <Text style={[
                            styles.difficultyText,
                            selectedDifficulty === diff && styles.selectedDifficultyText,
                          ]}>
                            {diff}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Bet Amount:</Text>
                    <View style={styles.betSelector}>
                      {[50, 100, 200, 500].map((amount) => (
                        <TouchableOpacity
                          key={amount}
                          style={[
                            styles.betChip,
                            betAmount === amount && styles.selectedBetChip,
                          ]}
                          onPress={() => setBetAmount(amount)}
                        >
                          <FontAwesome5 name="coins" size={12} color={theme.colors.text.primary} solid />
                          <Text style={[
                            styles.betText,
                            betAmount === amount && styles.selectedBetText,
                          ]}>
                            {amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Quick Battle Button */}
                <GradientButton
                  title={isCreatingBattle ? "Finding Opponent..." : "⚔️ Start Quick Battle"}
                  onPress={handleQuickBattle}
                  size="large"
                  fullWidth
                  disabled={isCreatingBattle}
                  colors={[theme.colors.accent.yellow, theme.colors.accent.green]}
                  style={styles.quickBattleButton}
                />

                <Text style={styles.quickBattleNote}>
                  🤖 Smart matchmaking finds opponents of similar skill level
                </Text>
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Popular Topics */}
          <Animated.View style={[styles.section, topicsAnimatedStyle]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="fire" size={20} color={theme.colors.accent.yellow} solid />
                {' '}Trending Battle Topics
              </Text>
              <TouchableOpacity 
                style={styles.customTopicButton}
                onPress={() => setShowCustomBattle(!showCustomBattle)}
              >
                <LinearGradient
                  colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                  style={styles.customTopicGradient}
                >
                  <FontAwesome5 name="plus" size={14} color={theme.colors.text.primary} solid />
                  <Text style={styles.customTopicText}>Custom</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Custom Battle Creator */}
            {showCustomBattle && (
              <View style={styles.customBattleCard}>
                <LinearGradient
                  colors={[theme.colors.accent.purple + '20', theme.colors.accent.blue + '20']}
                  style={styles.customBattleGradient}
                >
                  <Text style={styles.customBattleTitle}>
                    <FontAwesome5 name="crown" size={16} color={theme.colors.accent.gold} solid />
                    {' '}Create Custom Battle (Pro)
                  </Text>
                  
                  <View style={styles.customInputContainer}>
                    <FontAwesome5 name="lightbulb" size={16} color={theme.colors.accent.yellow} solid />
                    <TextInput
                      style={styles.customInput}
                      placeholder="Enter your battle topic..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={customTopic}
                      onChangeText={setCustomTopic}
                    />
                  </View>

                  <GradientButton
                    title={isCreatingBattle ? "Creating..." : "🚀 Create Battle"}
                    onPress={handleCustomBattle}
                    size="medium"
                    fullWidth
                    disabled={isCreatingBattle || !customTopic.trim()}
                    colors={[theme.colors.accent.gold, theme.colors.accent.yellow]}
                  />
                </LinearGradient>
              </View>
            )}

            <View style={styles.topicsGrid}>
              {popularTopics.map((topic, index) => (
                <PopularTopicCard
                  key={topic.name}
                  topic={topic}
                  index={index}
                  onPress={() => handleTopicBattle(topic)}
                  isCreating={isCreatingBattle}
                />
              ))}
            </View>
          </Animated.View>

          {/* Active Battle Rooms */}
          <Animated.View style={[styles.section, roomsAnimatedStyle]}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="users" size={20} color={theme.colors.accent.blue} solid />
              {' '}Active Battle Rooms
            </Text>
            <Text style={styles.sectionSubtitle}>
              Join ongoing battles or create your own
            </Text>

            <View style={styles.battleRoomsList}>
              {battleRooms.length > 0 ? (
                battleRooms.map((room, index) => (
                  <BattleRoomCard
                    key={room.id}
                    room={room}
                    index={index}
                    onJoin={() => handleJoinRoom(room.room_code)}
                  />
                ))
              ) : (
                <View style={styles.emptyRoomsCard}>
                  <LinearGradient
                    colors={[theme.colors.background.card, theme.colors.background.secondary]}
                    style={styles.emptyRoomsGradient}
                  >
                    <FontAwesome5 name="search" size={32} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyRoomsText}>No active battles right now</Text>
                    <Text style={styles.emptyRoomsSubtext}>
                      Start a quick battle to get matched instantly!
                    </Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Battle Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="chart-bar" size={20} color={theme.colors.accent.green} solid />
              {' '}Your Battle Stats
            </Text>
            
            <View style={styles.statsGrid}>
              <BattleStatCard
                icon="trophy"
                label="Battles Won"
                value="12"
                color={theme.colors.accent.gold}
              />
              <BattleStatCard
                icon="fist-raised"
                label="Total Battles"
                value="18"
                color={theme.colors.accent.purple}
              />
              <BattleStatCard
                icon="coins"
                label="Coins Earned"
                value="2,450"
                color={theme.colors.accent.yellow}
              />
              <BattleStatCard
                icon="chart-line"
                label="Win Rate"
                value="67%"
                color={theme.colors.accent.green}
              />
            </View>
          </View>

          {/* Share Section */}
          <View style={styles.shareSection}>
            <LinearGradient
              colors={[theme.colors.accent.cyan + '20', theme.colors.accent.blue + '20']}
              style={styles.shareCard}
            >
              <FontAwesome5 name="share-alt" size={24} color={theme.colors.accent.cyan} solid />
              <Text style={styles.shareTitle}>Invite Friends to Battle!</Text>
              <Text style={styles.shareSubtitle}>
                Challenge your friends and show who's the real knowledge champion
              </Text>
              <GradientButton
                title="Share Battle Invite"
                onPress={handleShareBattle}
                size="medium"
                icon={<FontAwesome5 name="paper-plane" size={16} color={theme.colors.text.primary} solid />}
                colors={[theme.colors.accent.cyan, theme.colors.accent.blue]}
              />
            </LinearGradient>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PopularTopicCard({ topic, index, onPress, isCreating }: {
  topic: PopularTopic;
  index: number;
  onPress: () => void;
  isCreating: boolean;
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
    if (isCreating) return;
    
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getTopicColor = (category: string) => {
    const colors: Record<string, string> = {
      'History': theme.colors.accent.purple,
      'Polity': theme.colors.accent.blue,
      'Geography': theme.colors.accent.green,
      'Economy': theme.colors.accent.yellow,
      'Science & Technology': theme.colors.accent.cyan,
      'Current Affairs': theme.colors.accent.pink,
    };
    return colors[category] || theme.colors.accent.purple;
  };

  const getTopicIcon = (category: string) => {
    const icons: Record<string, string> = {
      'History': 'landmark',
      'Polity': 'balance-scale',
      'Geography': 'globe-asia',
      'Economy': 'chart-line',
      'Science & Technology': 'rocket',
      'Current Affairs': 'newspaper',
    };
    return icons[category] || 'book';
  };

  return (
    <Animated.View style={[styles.topicCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} disabled={isCreating}>
        <LinearGradient
          colors={[getTopicColor(topic.category) + '30', getTopicColor(topic.category) + '20']}
          style={styles.topicCardGradient}
        >
          {/* Popularity Badge */}
          <View style={styles.popularityBadge}>
            <FontAwesome5 name="fire" size={10} color={theme.colors.accent.yellow} solid />
            <Text style={styles.popularityText}>{topic.popularity}%</Text>
          </View>

          <View style={[styles.topicIcon, { backgroundColor: getTopicColor(topic.category) }]}>
            <FontAwesome5 name={getTopicIcon(topic.category)} size={20} color={theme.colors.text.primary} solid />
          </View>

          <Text style={styles.topicName} numberOfLines={2}>
            {topic.name}
          </Text>

          <Text style={styles.topicCategory}>{topic.category}</Text>

          <View style={styles.examRelevanceContainer}>
            <FontAwesome5 name="bullseye" size={10} color={theme.colors.accent.green} solid />
            <Text style={styles.examRelevanceText} numberOfLines={1}>
              {topic.examRelevance}
            </Text>
          </View>

          <View style={styles.battleButton}>
            <FontAwesome5 name="sword" size={14} color={getTopicColor(topic.category)} solid />
            <Text style={[styles.battleButtonText, { color: getTopicColor(topic.category) }]}>
              Battle Now
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BattleRoomCard({ room, index, onJoin }: {
  room: BattleRoom;
  index: number;
  onJoin: () => void;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    setTimeout(() => {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, index * 200);
  }, [index]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
    onJoin();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return theme.colors.accent.green;
      case 'hard': return theme.colors.accent.pink;
      default: return theme.colors.accent.blue;
    }
  };

  return (
    <Animated.View style={[styles.battleRoomCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={[theme.colors.background.card, theme.colors.background.secondary]}
          style={styles.battleRoomGradient}
        >
          <View style={styles.roomHeader}>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName} numberOfLines={1}>
                {room.name}
              </Text>
              <Text style={styles.roomHost}>by {room.host_name}</Text>
            </View>
            
            <View style={styles.roomMeta}>
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(room.difficulty) + '20' }]}>
                <Text style={[styles.difficultyBadgeText, { color: getDifficultyColor(room.difficulty) }]}>
                  {room.difficulty}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.roomDetails}>
            <View style={styles.roomDetail}>
              <FontAwesome5 name="book" size={12} color={theme.colors.text.tertiary} />
              <Text style={styles.roomDetailText}>{room.subject_name}</Text>
            </View>
            
            <View style={styles.roomDetail}>
              <FontAwesome5 name="users" size={12} color={theme.colors.text.tertiary} />
              <Text style={styles.roomDetailText}>
                {room.current_participants}/{room.max_participants}
              </Text>
            </View>
            
            <View style={styles.roomDetail}>
              <FontAwesome5 name="coins" size={12} color={theme.colors.accent.yellow} solid />
              <Text style={styles.roomDetailText}>{room.bet_amount}</Text>
            </View>
          </View>

          <View style={styles.joinButtonContainer}>
            <GradientButton
              title="Join Battle"
              onPress={handlePress}
              size="small"
              icon={<FontAwesome5 name="sword" size={14} color={theme.colors.text.primary} solid />}
              colors={[getDifficultyColor(room.difficulty), getDifficultyColor(room.difficulty) + '80']}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BattleStatCard({ icon, label, value, color }: {
  icon: string;
  label: string;
  value: string;
  color: string;
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
          <FontAwesome5 name={icon} size={20} color={color} solid />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  battleParticle: {
    position: 'absolute',
  },
  battleParticleText: {
    fontSize: 16,
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
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
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
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  battleIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.glow,
  },
  titleText: {
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
  coinsDisplay: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  coinsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  coinsText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  customTopicButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  customTopicGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  customTopicText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  quickBattleCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: theme.colors.accent.pink,
  },
  quickBattleGradient: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  battleSettings: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  settingRow: {
    gap: theme.spacing.sm,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  difficultySelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  difficultyChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  selectedDifficultyChip: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  difficultyText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  selectedDifficultyText: {
    opacity: 1,
    fontFamily: theme.fonts.heading,
  },
  betSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  betChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    gap: theme.spacing.xs,
  },
  selectedBetChip: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(255,255,255,0.6)',
  },
  betText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    opacity: 0.8,
  },
  selectedBetText: {
    opacity: 1,
    fontFamily: theme.fonts.heading,
  },
  quickBattleButton: {
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.accent.yellow,
  },
  quickBattleNote: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
    textAlign: 'center',
    opacity: 0.8,
  },
  customBattleCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
  },
  customBattleGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  customBattleTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  customInput: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  topicCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  topicCardGradient: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
    minHeight: 160,
    position: 'relative',
  },
  popularityBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.yellow + '30',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  popularityText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    fontWeight: 'bold',
  },
  topicIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  topicName: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  topicCategory: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  examRelevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  examRelevanceText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    flex: 1,
  },
  battleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
    marginTop: 'auto',
  },
  battleButtonText: {
    fontSize: 12,
    fontFamily: theme.fonts.subheading,
  },
  battleRoomsList: {
    gap: theme.spacing.md,
  },
  battleRoomCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  battleRoomGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  roomInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  roomName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  roomHost: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  roomMeta: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomDetailText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  joinButtonContainer: {
    alignItems: 'flex-end',
  },
  emptyRoomsCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  emptyRoomsGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderStyle: 'dashed',
  },
  emptyRoomsText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyRoomsSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
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
  shareSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  shareCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    gap: theme.spacing.md,
  },
  shareTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  shareSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  bottomSpacing: {
    height: 20,
  },
});