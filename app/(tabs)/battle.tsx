import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Share,
  Modal,
  TextInput,
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

const { width = 375, height = 667 } = Dimensions.get('window') || {};

interface BattleRoom {
  id: string;
  name: string;
  host_id: string;
  host_name: string;
  topic: string;
  subject: string;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  created_at: string;
  players: BattlePlayer[];
}

interface BattlePlayer {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  score: number;
  current_question: number;
  is_ready: boolean;
  joined_at: string;
}

interface QuickBattleOption {
  id: string;
  topic: string;
  subject: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: number;
}

const QUICK_BATTLE_OPTIONS: QuickBattleOption[] = [
  {
    id: 'upsc_history',
    topic: 'Freedom Fighters',
    subject: 'History',
    icon: '🏛️',
    color: theme.colors.accent.purple,
    difficulty: 'medium',
    questions: 10,
  },
  {
    id: 'constitution',
    topic: 'Fundamental Rights',
    subject: 'Polity',
    icon: '⚖️',
    color: theme.colors.accent.blue,
    difficulty: 'medium',
    questions: 10,
  },
  {
    id: 'geography',
    topic: 'Indian Rivers',
    subject: 'Geography',
    icon: '🌊',
    color: theme.colors.accent.cyan,
    difficulty: 'easy',
    questions: 10,
  },
  {
    id: 'current_affairs',
    topic: 'Recent Developments',
    subject: 'Current Affairs',
    icon: '📰',
    color: theme.colors.accent.green,
    difficulty: 'hard',
    questions: 10,
  },
  {
    id: 'science',
    topic: 'Space Technology',
    subject: 'Science & Technology',
    icon: '🚀',
    color: theme.colors.accent.yellow,
    difficulty: 'medium',
    questions: 10,
  },
  {
    id: 'economy',
    topic: 'Banking & Finance',
    subject: 'Economy',
    icon: '💰',
    color: theme.colors.accent.pink,
    difficulty: 'hard',
    questions: 10,
  },
];

export default function BattleScreen() {
  const isMounted = useRef(true);
  const [activeRooms, setActiveRooms] = useState<BattleRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<QuickBattleOption | null>(null);
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  // Animation values
  const fadeIn = useSharedValue(0);
  const swordRotation = useSharedValue(0);
  const battlePulse = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const roomsOpacity = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    loadBattleData();
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startAnimations = () => {
    fadeIn.value = withTiming(1, { duration: 800 });
    
    // Sword rotation animation
    swordRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-10, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    
    // Battle pulse animation
    battlePulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
    
    // Sparkle animation
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      true
    );
    
    // Rooms fade in
    roomsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
  };

  const loadBattleData = async () => {
    try {
      if (!isMounted.current) return;
      
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        if (!isMounted.current) return;
        router.replace('/auth');
        return;
      }

      setCurrentUser(user);
      
      // Load active battle rooms (demo data for now)
      const demoRooms: BattleRoom[] = [
        {
          id: 'room1',
          name: '🏛️ History Legends Battle',
          host_id: 'user1',
          host_name: 'Priya Sharma',
          topic: 'Freedom Fighters',
          subject: 'History',
          max_players: 4,
          current_players: 2,
          status: 'waiting',
          created_at: new Date().toISOString(),
          players: [
            {
              id: 'p1',
              user_id: 'user1',
              full_name: 'Priya Sharma',
              score: 0,
              current_question: 0,
              is_ready: true,
              joined_at: new Date().toISOString(),
            },
            {
              id: 'p2',
              user_id: 'user2',
              full_name: 'Rahul Kumar',
              score: 0,
              current_question: 0,
              is_ready: false,
              joined_at: new Date().toISOString(),
            },
          ],
        },
        {
          id: 'room2',
          name: '⚖️ Constitution Champions',
          host_id: 'user3',
          host_name: 'Anjali Patel',
          topic: 'Fundamental Rights',
          subject: 'Polity',
          max_players: 2,
          current_players: 1,
          status: 'waiting',
          created_at: new Date().toISOString(),
          players: [
            {
              id: 'p3',
              user_id: 'user3',
              full_name: 'Anjali Patel',
              score: 0,
              current_question: 0,
              is_ready: true,
              joined_at: new Date().toISOString(),
            },
          ],
        },
      ];
      
      if (!isMounted.current) return;
      setActiveRooms(demoRooms);
      
      // Load friends list
      const demoFriends = [
        { id: 'friend1', full_name: 'Arjun Singh', status: 'online' },
        { id: 'friend2', full_name: 'Kavya Reddy', status: 'studying' },
        { id: 'friend3', full_name: 'Vikram Joshi', status: 'offline' },
        { id: 'friend4', full_name: 'Sneha Gupta', status: 'online' },
      ];
      
      setFriends(demoFriends);
    } catch (error) {
      console.error('Error loading battle data:', error);
    } finally {
      if (!isMounted.current) return;
      setIsLoading(false);
    }
  };

  const handleQuickBattle = (option: QuickBattleOption) => {
    setSelectedTopic(option);
    setRoomName(`${option.icon} ${option.topic} Battle`);
    setShowCreateRoom(true);
  };

  const handleCreateRoom = async () => {
    if (!selectedTopic || !roomName.trim()) {
      Alert.alert('Missing Information', 'Please select a topic and enter a room name.');
      return;
    }

    try {
      // Create battle room
      const newRoom: BattleRoom = {
        id: `room_${Date.now()}`,
        name: roomName.trim(),
        host_id: currentUser.id,
        host_name: currentUser.email.split('@')[0],
        topic: selectedTopic.topic,
        subject: selectedTopic.subject,
        max_players: 4,
        current_players: 1,
        status: 'waiting',
        created_at: new Date().toISOString(),
        players: [
          {
            id: `player_${Date.now()}`,
            user_id: currentUser.id,
            full_name: currentUser.email.split('@')[0],
            score: 0,
            current_question: 0,
            is_ready: true,
            joined_at: new Date().toISOString(),
          },
        ],
      };

      setActiveRooms(prev => [newRoom, ...prev]);
      setShowCreateRoom(false);
      setSelectedTopic(null);
      setRoomName('');

      // Navigate to battle room
      router.push({
        pathname: '/battle/room',
        params: { roomId: newRoom.id },
      });
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create battle room. Please try again.');
    }
  };

  const handleJoinRoom = (room: BattleRoom) => {
    if (room.current_players >= room.max_players) {
      Alert.alert('Room Full', 'This battle room is already full.');
      return;
    }

    router.push({
      pathname: '/battle/room',
      params: { roomId: room.id },
    });
  };

  const handleInviteFriends = () => {
    setShowInviteFriends(true);
  };

  const handleSendInvites = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select friends to invite.');
      return;
    }

    const inviteText = `🔥 Battle Challenge! 🔥

Join me for an epic quiz battle on MindGains AI!

Topic: ${selectedTopic?.topic}
Subject: ${selectedTopic?.subject}
Questions: ${selectedTopic?.questions}

Let's see who's the real knowledge champion! 💪

Download MindGains AI: https://mindgains.ai
#MindGainsAI #QuizBattle #CompetitiveExams`;

    try {
      await Share.share({
        message: inviteText,
        title: 'Quiz Battle Invitation',
      });

      setShowInviteFriends(false);
      setSelectedFriends([]);
      Alert.alert('Invites Sent!', 'Your friends have been invited to the battle!');
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return theme.colors.status.online;
      case 'studying': return theme.colors.status.studying;
      default: return theme.colors.status.offline;
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: interpolate(fadeIn.value, [0, 1], [30, 0]) }],
  }));

  const swordAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${swordRotation.value}deg` }],
  }));

  const battleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: battlePulse.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const roomsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: roomsOpacity.value,
    transform: [{ translateY: interpolate(roomsOpacity.value, [0, 1], [20, 0]) }],
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
          <MascotAvatar size={80} animated={true} glowing={true} mood="excited" />
          <Text style={styles.loadingText}>Preparing battle arena...</Text>
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
      
      {/* Floating Battle Elements */}
      <View style={styles.floatingElements}>
        {[...Array(8)].map((_, index) => (
          <FloatingBattleIcon key={index} index={index} />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea}>
        {/* Enhanced Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.headerIcon, swordAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
              style={styles.headerIconGradient}
            >
              <FontAwesome5 name="sword" size={28} color={theme.colors.text.primary} solid />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Quiz Battle Arena</Text>
            <Text style={styles.headerSubtitle}>Challenge friends in real-time!</Text>
          </View>
          
          <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFriends}>
            <LinearGradient
              colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
              style={styles.inviteButtonGradient}
            >
              <FontAwesome5 name="user-plus" size={16} color={theme.colors.text.primary} solid />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Quick Battle Section */}
            <Animated.View style={[styles.quickBattleSection, battleAnimatedStyle]}>
              <LinearGradient
                colors={[
                  theme.colors.accent.pink + '30',
                  theme.colors.accent.purple + '30',
                ]}
                style={styles.quickBattleCard}
              >
                <Animated.View style={sparkleAnimatedStyle}>
                  <View style={styles.sparkleContainer}>
                    <FontAwesome5 name="sparkles" size={20} color={theme.colors.accent.yellow} solid />
                    <FontAwesome5 name="bolt" size={16} color={theme.colors.accent.cyan} solid />
                    <FontAwesome5 name="fire" size={18} color={theme.colors.accent.pink} solid />
                  </View>
                </Animated.View>
                
                <View style={styles.quickBattleHeader}>
                  <FontAwesome5 name="zap" size={24} color={theme.colors.accent.yellow} solid />
                  <Text style={styles.quickBattleTitle}>Quick Battle</Text>
                  <FontAwesome5 name="zap" size={24} color={theme.colors.accent.yellow} solid />
                </View>
                
                <Text style={styles.quickBattleSubtitle}>
                  Start an instant battle with popular exam topics!
                </Text>
                
                <View style={styles.quickBattleGrid}>
                  {QUICK_BATTLE_OPTIONS.map((option, index) => (
                    <QuickBattleCard
                      key={option.id}
                      option={option}
                      onPress={() => handleQuickBattle(option)}
                      index={index}
                    />
                  ))}
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Active Rooms */}
            <Animated.View style={[styles.activeRoomsSection, roomsAnimatedStyle]}>
              <View style={styles.sectionHeader}>
                <FontAwesome5 name="users" size={20} color={theme.colors.accent.blue} solid />
                <Text style={styles.sectionTitle}>Active Battle Rooms</Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              
              {activeRooms.length > 0 ? (
                <View style={styles.roomsList}>
                  {activeRooms.map((room, index) => (
                    <BattleRoomCard
                      key={room.id}
                      room={room}
                      onJoin={() => handleJoinRoom(room)}
                      index={index}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyRooms}>
                  <MascotAvatar size={60} animated={true} mood="encouraging" />
                  <Text style={styles.emptyRoomsText}>No active battles right now</Text>
                  <Text style={styles.emptyRoomsSubtext}>Create one and invite your friends!</Text>
                </View>
              )}
            </Animated.View>

            {/* Battle Stats */}
            <View style={styles.battleStatsSection}>
              <Text style={styles.sectionTitle}>
                <FontAwesome5 name="chart-line" size={18} color={theme.colors.accent.green} solid />
                {' '}Your Battle Stats
              </Text>
              
              <View style={styles.battleStatsGrid}>
                <BattleStatCard
                  icon="trophy"
                  label="Wins"
                  value="12"
                  color={theme.colors.accent.gold}
                />
                <BattleStatCard
                  icon="shield-alt"
                  label="Battles"
                  value="18"
                  color={theme.colors.accent.blue}
                />
                <BattleStatCard
                  icon="percentage"
                  label="Win Rate"
                  value="67%"
                  color={theme.colors.accent.green}
                />
                <BattleStatCard
                  icon="crown"
                  label="Rank"
                  value="#234"
                  color={theme.colors.accent.purple}
                />
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Create Room Modal */}
      <Modal
        visible={showCreateRoom}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateRoom(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createRoomModal}>
            <LinearGradient
              colors={[
                theme.colors.background.card,
                theme.colors.background.secondary,
              ]}
              style={styles.createRoomGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Battle Room</Text>
                <TouchableOpacity onPress={() => setShowCreateRoom(false)}>
                  <FontAwesome5 name="times" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {selectedTopic && (
                <View style={styles.selectedTopicDisplay}>
                  <LinearGradient
                    colors={[selectedTopic.color + '30', selectedTopic.color + '20']}
                    style={styles.selectedTopicCard}
                  >
                    <Text style={styles.selectedTopicIcon}>{selectedTopic.icon}</Text>
                    <View style={styles.selectedTopicInfo}>
                      <Text style={styles.selectedTopicName}>{selectedTopic.topic}</Text>
                      <Text style={styles.selectedTopicSubject}>{selectedTopic.subject}</Text>
                    </View>
                    <View style={styles.selectedTopicMeta}>
                      <Text style={styles.selectedTopicQuestions}>{selectedTopic.questions}Q</Text>
                      <Text style={styles.selectedTopicDifficulty}>{selectedTopic.difficulty}</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              <View style={styles.roomNameSection}>
                <Text style={styles.inputLabel}>Room Name</Text>
                <TextInput
                  style={styles.roomNameInput}
                  placeholder="Enter battle room name..."
                  placeholderTextColor={theme.colors.text.tertiary}
                  value={roomName}
                  onChangeText={setRoomName}
                  maxLength={50}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCreateRoom(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <GradientButton
                  title="Create & Invite"
                  onPress={handleCreateRoom}
                  size="medium"
                  icon={<FontAwesome5 name="rocket" size={16} color={theme.colors.text.primary} solid />}
                  colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
                  style={styles.createButton}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Invite Friends Modal */}
      <Modal
        visible={showInviteFriends}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteFriends(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.inviteFriendsModal}>
            <LinearGradient
              colors={[
                theme.colors.background.card,
                theme.colors.background.secondary,
              ]}
              style={styles.inviteFriendsGradient}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invite Friends to Battle</Text>
                <TouchableOpacity onPress={() => setShowInviteFriends(false)}>
                  <FontAwesome5 name="times" size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriends.includes(friend.id) && styles.selectedFriend,
                    ]}
                    onPress={() => toggleFriendSelection(friend.id)}
                  >
                    <View style={styles.friendAvatar}>
                      <Text style={styles.friendAvatarText}>
                        {friend.full_name.charAt(0)}
                      </Text>
                      <View style={[
                        styles.friendStatus,
                        { backgroundColor: getStatusColor(friend.status) }
                      ]} />
                    </View>
                    
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.full_name}</Text>
                      <Text style={styles.friendStatusText}>{friend.status}</Text>
                    </View>
                    
                    {selectedFriends.includes(friend.id) && (
                      <FontAwesome5 name="check-circle" size={20} color={theme.colors.accent.green} solid />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Text style={styles.selectedCount}>
                  {selectedFriends.length} friends selected
                </Text>
                
                <GradientButton
                  title="Send Invites"
                  onPress={handleSendInvites}
                  size="large"
                  fullWidth
                  disabled={selectedFriends.length === 0}
                  icon={<FontAwesome5 name="paper-plane" size={16} color={theme.colors.text.primary} solid />}
                  colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function FloatingBattleIcon({ index }: { index: number }) {
  const translateY = useSharedValue(height + 100);
  const translateX = useSharedValue(Math.random() * width);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const startAnimation = () => {
      translateY.value = withTiming(-100, { 
        duration: 8000 + Math.random() * 4000,
        easing: Easing.linear 
      });
      opacity.value = withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.6, { duration: 6000 }),
        withTiming(0, { duration: 1000 })
      );
      rotation.value = withTiming(360, { 
        duration: 8000 + Math.random() * 4000,
        easing: Easing.linear 
      });
    };

    const timer = setTimeout(startAnimation, index * 1000);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const icons = ['sword', 'shield-alt', 'crown', 'trophy', 'bolt', 'fire', 'star', 'gem'];
  const colors = [
    theme.colors.accent.purple,
    theme.colors.accent.blue,
    theme.colors.accent.cyan,
    theme.colors.accent.yellow,
    theme.colors.accent.green,
    theme.colors.accent.pink,
  ];

  return (
    <Animated.View style={[styles.floatingIcon, animatedStyle]}>
      <FontAwesome5 
        name={icons[index % icons.length]}
        size={12 + Math.random() * 8} 
        color={colors[index % colors.length]} 
        solid
      />
    </Animated.View>
  );
}

function QuickBattleCard({ option, onPress, index }: {
  option: QuickBattleOption;
  onPress: () => void;
  index: number;
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
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.quickBattleOption, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={[option.color + '40', option.color + '20']}
          style={styles.quickBattleOptionGradient}
        >
          <Text style={styles.quickBattleIcon}>{option.icon}</Text>
          <Text style={styles.quickBattleTopic}>{option.topic}</Text>
          <Text style={styles.quickBattleSubject}>{option.subject}</Text>
          
          <View style={styles.quickBattleMeta}>
            <View style={styles.quickBattleMetaItem}>
              <FontAwesome5 name="question-circle" size={10} color={option.color} />
              <Text style={[styles.quickBattleMetaText, { color: option.color }]}>
                {option.questions}Q
              </Text>
            </View>
            <View style={styles.quickBattleMetaItem}>
              <FontAwesome5 name="layer-group" size={10} color={option.color} />
              <Text style={[styles.quickBattleMetaText, { color: option.color }]}>
                {option.difficulty}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function BattleRoomCard({ room, onJoin, index }: {
  room: BattleRoom;
  onJoin: () => void;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return theme.colors.accent.yellow;
      case 'starting': return theme.colors.accent.blue;
      case 'active': return theme.colors.accent.green;
      case 'finished': return theme.colors.accent.purple;
      default: return theme.colors.text.muted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return 'clock';
      case 'starting': return 'play';
      case 'active': return 'bolt';
      case 'finished': return 'flag-checkered';
      default: return 'question';
    }
  };

  return (
    <Animated.View style={[styles.battleRoomCard, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={[
            theme.colors.background.card,
            theme.colors.background.secondary,
          ]}
          style={styles.battleRoomGradient}
        >
          <View style={styles.roomHeader}>
            <View style={styles.roomInfo}>
              <Text style={styles.roomName}>{room.name}</Text>
              <Text style={styles.roomTopic}>
                {room.topic} • {room.subject}
              </Text>
            </View>
            
            <View style={[styles.roomStatus, { backgroundColor: getStatusColor(room.status) + '20' }]}>
              <FontAwesome5 name={getStatusIcon(room.status)} size={12} color={getStatusColor(room.status)} solid />
              <Text style={[styles.roomStatusText, { color: getStatusColor(room.status) }]}>
                {room.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.roomDetails}>
            <View style={styles.roomHost}>
              <FontAwesome5 name="crown" size={14} color={theme.colors.accent.gold} solid />
              <Text style={styles.roomHostText}>Host: {room.host_name}</Text>
            </View>
            
            <View style={styles.roomPlayers}>
              <FontAwesome5 name="users" size={14} color={theme.colors.accent.blue} solid />
              <Text style={styles.roomPlayersText}>
                {room.current_players}/{room.max_players} players
              </Text>
            </View>
          </View>

          <View style={styles.roomActions}>
            <GradientButton
              title={room.status === 'waiting' ? "Join Battle" : "Spectate"}
              onPress={handlePress}
              size="small"
              icon={<FontAwesome5 name="sword" size={14} color={theme.colors.text.primary} solid />}
              colors={[theme.colors.accent.pink, theme.colors.accent.purple]}
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
    <Animated.View style={[styles.battleStatCard, animatedStyle]}>
      <LinearGradient
        colors={[color + '20', color + '10']}
        style={styles.battleStatGradient}
      >
        <View style={[styles.battleStatIcon, { backgroundColor: color + '30' }]}>
          <FontAwesome5 name={icon} size={20} color={color} solid />
        </View>
        <Text style={styles.battleStatValue}>{value}</Text>
        <Text style={styles.battleStatLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  floatingIcon: {
    position: 'absolute',
  },
  safeArea: {
    flex: 1,
    paddingTop: 50,
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  headerIcon: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  headerIconGradient: {
    width: 56,
    height: 56,
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
  inviteButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  inviteButtonGradient: {
    width: 44,
    height: 44,
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
  quickBattleSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  quickBattleCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickBattleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  quickBattleTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  quickBattleSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  quickBattleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  quickBattleOption: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quickBattleOptionGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
    minHeight: 120,
  },
  quickBattleIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  quickBattleTopic: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickBattleSubject: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickBattleMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  quickBattleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickBattleMetaText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
  },
  activeRoomsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.green + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent.green,
  },
  liveText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    fontWeight: 'bold',
  },
  roomsList: {
    gap: theme.spacing.md,
  },
  emptyRooms: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyRoomsText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  emptyRoomsSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  battleRoomCard: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  battleRoomGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    borderRadius: theme.borderRadius.lg,
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
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  roomTopic: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  roomStatusText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    fontWeight: 'bold',
  },
  roomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  roomHost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  roomHostText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  roomPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  roomPlayersText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  roomActions: {
    alignItems: 'flex-end',
  },
  battleStatsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  battleStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  battleStatCard: {
    width: '47%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  battleStatGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
  },
  battleStatIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  battleStatValue: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  battleStatLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  createRoomModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  createRoomGradient: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.tertiary,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  selectedTopicDisplay: {
    padding: theme.spacing.lg,
  },
  selectedTopicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  selectedTopicIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  selectedTopicInfo: {
    flex: 1,
  },
  selectedTopicName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedTopicSubject: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  selectedTopicMeta: {
    alignItems: 'flex-end',
  },
  selectedTopicQuestions: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  selectedTopicDifficulty: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  roomNameSection: {
    padding: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  roomNameInput: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    minHeight: 48,
  },
  modalActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.tertiary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.secondary,
  },
  createButton: {
    flex: 2,
  },
  inviteFriendsModal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  inviteFriendsGradient: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  friendsList: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
  },
  selectedFriend: {
    borderColor: theme.colors.accent.green,
    backgroundColor: theme.colors.accent.green + '10',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  friendAvatarText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
  },
  friendStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.background.card,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  friendStatusText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textTransform: 'capitalize',
  },
  selectedCount: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});