import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Vibration,
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
  withDelay,
  Easing,
  interpolate,
  withRepeat,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Camera,
  Youtube,
  FileText,
  Sparkles,
  Brain,
  Target,
  Clock,
  Users,
  Trophy,
  Zap,
  BookOpen,
  Play,
  Upload,
  Mic,
  Image,
  Link,
  Star,
  Crown,
  Rocket,
  ArrowRight,
  CheckCircle,
  X,
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import ContentGenerationModal from '@/components/ui/ContentGenerationModal';

const { width, height } = Dimensions.get('window');

interface ContentType {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string[];
  description: string;
  examples: string[];
  premium?: boolean;
}

interface QuickTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
  color: string;
  trending?: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    id: 'text',
    title: 'Smart Text',
    subtitle: 'Transform any text into structured lessons',
    icon: FileText,
    color: [theme.colors.accent.blue, theme.colors.accent.cyan],
    description: 'Paste notes, articles, or type directly',
    examples: ['Study notes', 'Research papers', 'Book chapters', 'Articles'],
  },
];

const TRENDING_TOPICS: QuickTopic[] = [
  {
    id: 'independence_movement',
    title: 'Indian Independence Movement',
    category: 'History',
    icon: 'flag',
    color: theme.colors.accent.yellow,
    trending: true,
    difficulty: 'Intermediate',
    estimatedTime: '45 min',
  },
  {
    id: 'fundamental_rights',
    title: 'Fundamental Rights',
    category: 'Polity',
    icon: 'balance-scale',
    color: theme.colors.accent.blue,
    difficulty: 'Beginner',
    estimatedTime: '30 min',
  },
  {
    id: 'photosynthesis',
    title: 'Photosynthesis Process',
    category: 'Science',
    icon: 'leaf',
    color: theme.colors.accent.green,
    difficulty: 'Intermediate',
    estimatedTime: '35 min',
  },
  {
    id: 'economic_planning',
    title: 'Indian Economic Planning',
    category: 'Economy',
    icon: 'chart-line',
    color: theme.colors.accent.purple,
    trending: true,
    difficulty: 'Advanced',
    estimatedTime: '50 min',
  },
  {
    id: 'monsoon_system',
    title: 'Indian Monsoon System',
    category: 'Geography',
    icon: 'cloud-rain',
    color: theme.colors.accent.cyan,
    difficulty: 'Intermediate',
    estimatedTime: '40 min',
  },
  {
    id: 'current_affairs',
    title: 'Current Affairs Digest',
    category: 'Current Affairs',
    icon: 'newspaper',
    color: theme.colors.accent.red,
    trending: true,
    difficulty: 'Advanced',
    estimatedTime: '25 min',
  },
];

export default function CreateMissionScreen() {
  const isMounted = useRef(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<QuickTopic | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(0.8);
  const cardsTranslateY = useSharedValue(50);
  const cardsOpacity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const floatingY = useSharedValue(0);

  useEffect(() => {
    isMounted.current = true;
    startAnimations();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const startAnimations = () => {
    // Entrance animations
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    mascotScale.value = withDelay(400, withSpring(1, { damping: 15, stiffness: 100 }));
    cardsOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    cardsTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));

    // Continuous animations
    sparkleRotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    floatingY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  };

  const handleCreateMission = async (missionData: any) => {
    try {
      if (!isMounted.current) return;
      setIsCreating(true);
      Vibration.vibrate(50);

      const mission = await SupabaseService.createMission(missionData);
      
      if (!isMounted.current) return;
      Alert.alert(
        'Mission Created! 🚀',
        'Your learning journey is ready. Start with the Clarity Room!',
        [
          {
            text: 'Start Learning',
            onPress: () => router.push(`/mission/clarity?missionId=${mission.id}`),
            style: 'default',
          },
        ]
      );
    } catch (error) {
      console.error('Error creating mission:', error);
      if (!isMounted.current) return;
      Alert.alert('Error', 'Failed to create mission. Please try again.');
    } finally {
      if (isMounted.current) {
        setIsCreating(false);
      }
    }
  };

  const handleQuickTopic = async (topic: QuickTopic) => {
    await handleCreateMission({
      title: topic.title,
      description: `Learn ${topic.title} in ${topic.estimatedTime}`,
      content_type: 'text',
      content_text: topic.title,
      subject_name: topic.category,
      difficulty: topic.difficulty.toLowerCase(),
      contentType: topic.category.toLowerCase(),
      examFocus: 'upsc',
    });
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedType(type.id);
    Vibration.vibrate(30);
    setShowContentModal(true);
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }, { translateY: floatingY.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const renderContentTypeCard = (type: ContentType, index: number) => {
    const IconComponent = type.icon;
    const isSelected = selectedType === type.id;

    return (
      <Animated.View
        key={type.id}
        style={[
          cardsAnimatedStyle,
          {
            transform: [
              {
                translateY: cardsTranslateY.value + index * 10,
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.contentCard, isSelected && styles.selectedCard]}
          onPress={() => handleContentTypeSelect(type)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isSelected ? type.color : [theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.contentCardGradient}
          >
            <View style={[styles.iconContainer, { backgroundColor: type.color[0] + '20' }]}>
              <IconComponent 
                size={28} 
                color={isSelected ? theme.colors.text.primary : type.color[0]} 
              />
            </View>

            <View style={styles.contentInfo}>
              <Text style={[styles.contentTitle, isSelected && styles.selectedText]}>
                {type.title}
              </Text>
              <Text style={[styles.contentSubtitle, isSelected && styles.selectedSubtext]}>
                {type.subtitle}
              </Text>
              <Text style={[styles.contentDescription, isSelected && styles.selectedDescription]}>
                {type.description}
              </Text>

              <View style={styles.examplesContainer}>
                {type.examples.slice(0, 2).map((example, i) => (
                  <View key={i} style={[styles.exampleChip, isSelected && styles.selectedChip]}>
                    <Text style={[styles.exampleText, isSelected && styles.selectedChipText]}>
                      {example}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {isSelected && (
              <View style={styles.selectedIndicator}>
                <CheckCircle size={20} color={theme.colors.text.primary} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderQuickTopicCard = (topic: QuickTopic, index: number) => (
    <TouchableOpacity
      key={topic.id}
      style={styles.quickTopicCard}
      onPress={() => handleQuickTopic(topic)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[topic.color + '20', topic.color + '10']}
        style={styles.quickTopicGradient}
      >
        {topic.trending && (
          <View style={styles.trendingBadge}>
            <FontAwesome5 name="fire" size={10} color={theme.colors.accent.yellow} solid />
            <Text style={styles.trendingText}>TRENDING</Text>
          </View>
        )}

        <View style={[styles.quickTopicIcon, { backgroundColor: topic.color }]}>
          <FontAwesome5 name={topic.icon} size={16} color={theme.colors.text.primary} solid />
        </View>

        <Text style={styles.quickTopicTitle} numberOfLines={2}>
          {topic.title}
        </Text>

        <View style={styles.quickTopicMeta}>
          <View style={styles.quickTopicMetaItem}>
            <FontAwesome5 name="signal" size={10} color={theme.colors.text.tertiary} />
            <Text style={styles.quickTopicMetaText}>{topic.difficulty}</Text>
          </View>
          <View style={styles.quickTopicMetaItem}>
            <Clock size={10} color={theme.colors.text.tertiary} />
            <Text style={styles.quickTopicMetaText}>{topic.estimatedTime}</Text>
          </View>
        </View>

        <Text style={styles.quickTopicCategory}>{topic.category}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

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
        <Animated.View style={[styles.header, headerAnimatedStyle]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.background.card, theme.colors.background.secondary]}
              style={styles.backButtonGradient}
            >
              <ChevronLeft size={24} color={theme.colors.text.primary} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Create Mission</Text>
              <Animated.View style={sparkleAnimatedStyle}>
                <Sparkles size={20} color={theme.colors.accent.yellow} />
              </Animated.View>
            </View>
            <Text style={styles.headerSubtitle}>Transform anything into your next breakthrough</Text>
          </View>

          <TouchableOpacity style={styles.helpButton} activeOpacity={0.8}>
            <FontAwesome5 name="question-circle" size={20} color={theme.colors.accent.purple} />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero Section with Mascot */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.mascotContainer, mascotAnimatedStyle]}>
            <MascotAvatar 
              mood="excited" 
              size={80}
              showSpeechBubble
              speechText="Let's create something amazing!"
            />
          </Animated.View>
          <Text style={styles.heroText}>
            What would you like to master today?
          </Text>
          <Text style={styles.heroSubtext}>
            Choose how you want to learn, and I'll create a personalized 4-room journey
          </Text>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Start - Trending Topics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="rocket" size={18} color={theme.colors.accent.yellow} solid />
              <Text style={styles.sectionTitle}>Quick Start</Text>
              <View style={styles.trendingBadge}>
                <FontAwesome5 name="fire" size={10} color={theme.colors.accent.yellow} solid />
                <Text style={styles.trendingText}>HOT</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => setShowQuickModal(true)}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ArrowRight size={14} color={theme.colors.accent.purple} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickTopicsContainer}
          >
            {TRENDING_TOPICS.slice(0, 4).map((topic, index) => renderQuickTopicCard(topic, index))}
          </ScrollView>
        </View>

        {/* Content Types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Brain size={18} color={theme.colors.accent.purple} />
              <Text style={styles.sectionTitle}>Choose Your Content</Text>
            </View>
            <Text style={styles.sectionSubtitle}>How do you want to learn?</Text>
          </View>

          <View style={styles.contentTypesContainer}>
            {CONTENT_TYPES.map((type, index) => renderContentTypeCard(type, index))}
          </View>
        </View>

        {/* Pro Features Teaser */}
        <Animated.View style={[styles.proSection, pulseAnimatedStyle]}>
          <LinearGradient
            colors={[theme.colors.accent.gold + '20', theme.colors.accent.yellow + '10']}
            style={styles.proSectionGradient}
          >
            <View style={styles.proHeader}>
              <Crown size={24} color={theme.colors.accent.gold} />
              <Text style={styles.proTitle}>Unlock Pro Features</Text>
            </View>
            <Text style={styles.proDescription}>
              Camera scanning, PDF uploads, advanced AI analysis, and unlimited missions
            </Text>
            <GradientButton
              title="Upgrade to Pro"
              onPress={() => router.push('/subscription')}
              colors={[theme.colors.accent.gold, theme.colors.accent.yellow]}
              style={styles.proButton}
            />
          </LinearGradient>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Content Generation Modal */}
      {showContentModal && (
        <ContentGenerationModal
          visible={showContentModal}
          onClose={() => setShowContentModal(false)}
          onGenerate={handleCreateMission}
          contentType={selectedType}
          isLoading={isCreating}
        />
      )}

      {/* Loading Overlay */}
      {isCreating && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={[theme.colors.background.primary + 'CC', theme.colors.background.secondary + 'CC']}
            style={styles.loadingContainer}
          >
            <MascotAvatar mood="thinking" size={60} />
            <Text style={styles.loadingText}>Creating your mission...</Text>
            <Text style={styles.loadingSubtext}>AI is analyzing and structuring your content</Text>
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  backButton: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
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
    marginTop: 2,
  },
  helpButton: {
    padding: theme.spacing.sm,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  mascotContainer: {
    marginBottom: theme.spacing.md,
  },
  heroText: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  heroSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  quickTopicsContainer: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  quickTopicCard: {
    width: 160,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quickTopicGradient: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    minHeight: 140,
    position: 'relative',
  },
  trendingBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  trendingText: {
    fontSize: 8,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    fontWeight: 'bold',
  },
  quickTopicIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  quickTopicTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  quickTopicMeta: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  quickTopicMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickTopicMetaText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  quickTopicCategory: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    position: 'absolute',
    bottom: theme.spacing.sm,
    left: theme.spacing.md,
  },
  contentTypesContainer: {
    gap: theme.spacing.lg,
  },
  contentCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  selectedCard: {
    ...theme.shadows.glow,
  },
  contentCardGradient: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.gold + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.gold,
    fontWeight: 'bold',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
    ...theme.shadows.button,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedText: {
    color: theme.colors.text.primary,
  },
  contentSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  selectedSubtext: {
    color: theme.colors.text.primary + 'CC',
  },
  contentDescription: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  selectedDescription: {
    color: theme.colors.text.primary + '99',
  },
  examplesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  exampleChip: {
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  selectedChip: {
    backgroundColor: theme.colors.text.primary + '20',
  },
  exampleText: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  selectedChipText: {
    color: theme.colors.text.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  proSection: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  proSectionGradient: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.accent.gold + '30',
    alignItems: 'center',
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  proTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.gold,
  },
  proDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  proButton: {
    minWidth: 160,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    margin: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  loadingSubtext: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});