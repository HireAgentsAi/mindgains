import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
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
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ChevronLeft, Clock, BookOpen, Target, ArrowRight, Sparkles, Crown, Users, Award, List, ChevronDown, ChevronUp, Calendar, MapPin, Zap, Lightbulb } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import GradientButton from '@/components/ui/GradientButton';
import { SupabaseService } from '@/utils/supabaseService';

const { width } = Dimensions.get('window');

interface AdaptiveLearningContent {
  overview: string;
  contentType: string;
  examFocus: string;
  tabs: Array<{
    id: string;
    title: string;
    type: 'timeline' | 'list' | 'concepts' | 'articles' | 'rulers' | 'facts' | 'formulas' | 'points';
    content: any;
  }>;
  keyHighlights: string[];
  examTips: string[];
  difficulty: string;
  estimatedTime: string;
}

export default function ClarityRoomScreen() {
  const params = useLocalSearchParams();
  const { missionId } = params;
  
  const [content, setContent] = useState<AdaptiveLearningContent | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  
  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const mascotScale = useSharedValue(1);
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const shimmerPosition = useSharedValue(-1);
  const tabsOpacity = useSharedValue(0);
  const tabsTranslateY = useSharedValue(30);

  useEffect(() => {
    loadMissionContent();
    
    // Track time spent
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    // Start animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withTiming(0, { duration: 600, easing: Easing.out(Easing.back()) });
    
    // Continuous shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, [missionId]);

  useEffect(() => {
    if (content) {
      cardOpacity.value = withTiming(1, { duration: 800 });
      cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
      tabsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
      tabsTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
      setLoadingProgress(100);
    }
  }, [content]);

  const loadMissionContent = async () => {
    try {
      // Check if Supabase is configured or if it's a demo mission
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || (missionId as string).startsWith('demo_')) {
        // Use demo content
        const demoContent: AdaptiveLearningContent = {
          overview: "This is a comprehensive learning mission about Indian Constitution's Fundamental Rights. You'll explore Articles 12-35 which form the cornerstone of individual liberty in India.",
          contentType: "constitution",
          examFocus: "upsc",
          tabs: [
            {
              id: "articles",
              title: "Key Articles",
              type: "articles",
              content: [
                {
                  articleNumber: "Article 14",
                  title: "Right to Equality",
                  description: "Equality before law and equal protection of laws",
                  keyPoints: [
                    "Applies to all persons, not just citizens",
                    "Prohibits discrimination by the state",
                    "Foundation of rule of law in India"
                  ],
                  examRelevance: "Frequently asked in Prelims and Mains"
                },
                {
                  articleNumber: "Article 19",
                  title: "Protection of Rights",
                  description: "Six fundamental freedoms for citizens",
                  keyPoints: [
                    "Freedom of speech and expression",
                    "Freedom to assemble peacefully",
                    "Freedom to form associations"
                  ],
                  examRelevance: "Important for both Prelims MCQs and Mains essays"
                }
              ]
            },
            {
              id: "timeline",
              title: "Historical Timeline",
              type: "timeline",
              content: [
                {
                  year: "1950",
                  event: "Constitution came into effect",
                  significance: "Fundamental Rights became enforceable"
                },
                {
                  year: "1951",
                  event: "First Amendment Act",
                  significance: "Added restrictions to freedom of speech"
                }
              ]
            },
            {
              id: "concepts",
              title: "Key Concepts",
              type: "concepts",
              content: [
                {
                  concept: "Negative Rights",
                  definition: "Rights that restrict government action",
                  explanation: "Fundamental Rights are primarily negative rights that prevent state interference",
                  examples: ["Right to Life", "Right to Equality", "Right to Freedom"]
                },
                {
                  concept: "Writ Jurisdiction",
                  definition: "Power of courts to issue writs for enforcement of Fundamental Rights",
                  explanation: "Supreme Court and High Courts can issue five types of writs",
                  examples: ["Habeas Corpus", "Mandamus", "Prohibition"]
                }
              ]
            }
          ],
          keyHighlights: [
            "Fundamental Rights are justiciable and enforceable by courts",
            "They can be suspended during national emergency",
            "Some rights are available only to citizens, others to all persons"
          ],
          examTips: [
            "Focus on Article numbers and their specific provisions for Prelims",
            "Understand the philosophy behind each right for Mains answers",
            "Learn landmark Supreme Court cases for comprehensive understanding",
            "Practice writing answers on conflicts between Fundamental Rights and DPSP"
          ],
          difficulty: "intermediate",
          estimatedTime: "25 minutes"
        };
        
        setContent(demoContent);
        setIsLoading(false);
        return;
      }
      
      const result = await SupabaseService.getMissionContent(missionId as string, 'clarity');
      if (result.success && result.content.learning_content) {
        setContent(result.content.learning_content);
      }
    } catch (error) {
      console.error('Error loading mission content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSectionChange = (index: number) => {
    setCurrentSection(index);
    mascotScale.value = withSequence(
      withTiming(1.1, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };

  const handleContinue = async () => {
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Update progress
      await SupabaseService.updateProgress({
        mission_id: missionId as string,
        room_type: 'clarity',
        score: 100, // Full score for completing clarity room
        max_score: 100,
        time_spent: timeSpent,
        completed: true,
      });

      // Track room completion
      await SupabaseService.trackUserActivity(user.id, 'room_completed', {
        missionId: missionId as string,
        roomType: 'clarity',
        timeSpent
      });

      // Navigate to quiz
      router.push({
        pathname: '/mission/quiz',
        params: { missionId },
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      // Navigate anyway
      router.push({
        pathname: '/mission/quiz',
        params: { missionId },
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const toggleTip = (index: number) => {
    setExpandedTip(expandedTip === index ? null : index);
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));
  
  const tabsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabsOpacity.value,
    transform: [{ translateY: tabsTranslateY.value }],
  }));
  
  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 1.5, width * 1.5]
    );
    
    return {
      transform: [
        { translateX },
        { rotate: '-30deg' }
      ],
    };
  });

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'timeline': return <Clock size={20} color={theme.colors.text.primary} />;
      case 'rulers': return <Crown size={20} color={theme.colors.text.primary} />;
      case 'articles': return <Award size={20} color={theme.colors.text.primary} />;
      case 'concepts': return <BookOpen size={20} color={theme.colors.text.primary} />;
      case 'formulas': return <Target size={20} color={theme.colors.text.primary} />;
      case 'list': return <List size={20} color={theme.colors.text.primary} />;
      case 'points': return <Sparkles size={20} color={theme.colors.text.primary} />;
      default: return <Lightbulb size={20} color={theme.colors.text.primary} />;
    }
  };

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
          <MascotAvatar size={100} animated={true} glowing={true} mood="focused" />
          <Text style={styles.loadingText}>Preparing your learning content...</Text>
          
          <View style={styles.loadingProgressContainer}>
            <View style={styles.loadingBar}>
              <Animated.View 
                style={[
                  styles.loadingFill, 
                  { width: `${loadingProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.loadingPercentage}>{loadingProgress}%</Text>
          </View>
          
          <View style={styles.loadingSteps}>
            <View style={styles.loadingStep}>
              <View style={[styles.loadingStepDot, loadingProgress > 25 && styles.loadingStepCompleted]}>
                {loadingProgress > 25 && <Sparkles size={12} color={theme.colors.text.primary} />}
              </View>
              <Text style={styles.loadingStepText}>Analyzing content</Text>
            </View>
            <View style={styles.loadingStep}>
              <View style={[styles.loadingStepDot, loadingProgress > 50 && styles.loadingStepCompleted]}>
                {loadingProgress > 50 && <Sparkles size={12} color={theme.colors.text.primary} />}
              </View>
              <Text style={styles.loadingStepText}>Creating learning materials</Text>
            </View>
            <View style={styles.loadingStep}>
              <View style={[styles.loadingStepDot, loadingProgress > 75 && styles.loadingStepCompleted]}>
                {loadingProgress > 75 && <Sparkles size={12} color={theme.colors.text.primary} />}
              </View>
              <Text style={styles.loadingStepText}>Preparing exam-focused content</Text>
            </View>
            <View style={styles.loadingStep}>
              <View style={[styles.loadingStepDot, loadingProgress > 90 && styles.loadingStepCompleted]}>
                {loadingProgress > 90 && <Sparkles size={12} color={theme.colors.text.primary} />}
              </View>
              <Text style={styles.loadingStepText}>Finalizing your mission</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (!content) {
    return (
      <LinearGradient
        colors={[
          theme.colors.background.primary,
          theme.colors.background.secondary,
        ]}
        style={styles.container}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content not available</Text>
          <GradientButton
            title="Go Back"
            onPress={() => router.back()}
            size="medium"
          />
        </View>
      </LinearGradient>
    );
  }

  const renderTabContent = () => {
    const currentTab = content.tabs[currentSection];
    
    switch (currentTab.type) {
      case 'rulers':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((ruler: any, index: number) => (
              <View key={index} style={styles.rulerCard}>
                <View style={styles.rulerHeader}>
                  <Text style={styles.rulerName}>{ruler.name}</Text>
                  <Text style={styles.rulerPeriod}>{ruler.period}</Text>
                </View>
                <Text style={styles.rulerDynasty}>{ruler.dynasty}</Text>
                <Text style={styles.rulerCapital}>Capital: {ruler.capital}</Text>
                {ruler.keyAchievements && (
                  <View style={styles.achievementsContainer}>
                    <Text style={styles.achievementsTitle}>Key Achievements:</Text>
                    {ruler.keyAchievements.map((achievement: string, i: number) => (
                      <View key={i} style={styles.achievementItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.achievementText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      
      case 'timeline':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((event: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineYear}>{event.year}</Text>
                  <Text style={styles.timelineEvent}>{event.event}</Text>
                  <Text style={styles.timelineSignificance}>{event.significance}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      
      case 'articles':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((article: any, index: number) => (
              <View key={index} style={styles.articleCard}>
                <View style={styles.articleHeader}>
                  <Text style={styles.articleNumber}>Article {article.articleNumber}</Text>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                </View>
                <Text style={styles.articleDescription}>{article.description}</Text>
                {article.keyPoints && (
                  <View style={styles.keyPointsContainer}>
                    {article.keyPoints.map((point: string, i: number) => (
                      <View key={i} style={styles.keyPointItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.keyPointText}>{point}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.examRelevance}>{article.examRelevance}</Text>
              </View>
            ))}
          </View>
        );
      
      case 'concepts':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((concept: any, index: number) => (
              <View key={index} style={styles.conceptItem}>
                <Text style={styles.conceptTerm}>{concept.concept || concept.term}</Text>
                <Text style={styles.conceptDefinition}>{concept.definition}</Text>
                {concept.explanation && (
                  <Text style={styles.conceptExplanation}>{concept.explanation}</Text>
                )}
                {concept.examples && concept.examples.length > 0 && (
                  <View style={styles.examplesContainer}>
                    <Text style={styles.examplesTitle}>Examples:</Text>
                    {concept.examples.map((example: string, i: number) => (
                      <View key={i} style={styles.exampleItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.exampleText}>{example}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      
      case 'formulas':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((formula: any, index: number) => (
              <View key={index} style={styles.formulaCard}>
                <Text style={styles.formulaName}>{formula.name}</Text>
                <LinearGradient
                  colors={[theme.colors.background.primary, theme.colors.background.secondary]}
                  style={styles.formulaExpressionContainer}
                >
                  <Text style={styles.formulaExpression}>{formula.formula}</Text>
                </LinearGradient>
                <Text style={styles.formulaVariables}>{formula.variables}</Text>
                {formula.applications && (
                  <View style={styles.applicationsContainer}>
                    <Text style={styles.applicationsTitle}>Applications:</Text>
                    {formula.applications.map((app: string, i: number) => (
                      <View key={i} style={styles.applicationItem}>
                        <View style={styles.bulletPoint} />
                        <Text style={styles.applicationText}>{app}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      
      case 'list':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((item: any, index: number) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{item.event || item.type || item.application}</Text>
                <Text style={styles.listItemDescription}>{item.description}</Text>
                {item.examImportance && (
                  <View style={styles.examImportanceContainer}>
                    <Zap size={14} color={theme.colors.accent.yellow} />
                    <Text style={styles.examImportance}>{item.examImportance}</Text>
                  </View>
                )}
                {item.date && <Text style={styles.listItemDate}>{item.date}</Text>}
                {item.examRelevance && (
                  <View style={styles.examRelevanceContainer}>
                    <Target size={14} color={theme.colors.accent.green} />
                    <Text style={styles.examRelevance}>{item.examRelevance}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      
      case 'points':
        return (
          <View style={styles.contentSection}>
            {currentTab.content.map((point: string, index: number) => (
              <View key={index} style={styles.pointItem}>
                <View style={styles.pointIconContainer}>
                  <Sparkles size={14} color={theme.colors.accent.purple} />
                </View>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>
        );
      
      default:
        return (
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>Content not available for this tab type.</Text>
          </View>
        );
    }
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
      
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.backButtonGradient}
          >
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
            style={styles.roomIcon}
          >
            <Sparkles size={24} color={theme.colors.text.primary} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.roomTitle}>Room of Clarity</Text>
            <Text style={styles.roomSubtitle}>
              {content.contentType} • {content.examFocus.toUpperCase()} Focus
            </Text>
          </View>
        </View>
        
        <Animated.View style={mascotAnimatedStyle}>
          <MascotAvatar
            size={60}
            animated={true}
            glowing={true}
            mood="focused"
          />
        </Animated.View>
      </Animated.View>

      {/* Overview */}
      <View style={styles.overviewContainer}>
        <LinearGradient
          colors={[theme.colors.background.card, theme.colors.background.secondary]}
          style={styles.overviewCard}
        >
          <Text style={styles.overviewText}>{content.overview}</Text>
          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Clock size={14} color={theme.colors.text.tertiary} />
              <Text style={styles.metaText}>{content.estimatedTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Target size={14} color={theme.colors.text.tertiary} />
              <Text style={styles.metaText}>{content.difficulty}</Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={14} color={theme.colors.text.tertiary} />
              <Text style={styles.metaText}>{content.examFocus.toUpperCase()}</Text>
            </View>
          </View>
          
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
        </LinearGradient>
      </View>

      {/* Section Navigation */}
      <Animated.View style={[styles.sectionNavContainer, tabsAnimatedStyle]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sectionNav}
          contentContainerStyle={styles.sectionNavContent}
        >
          {content.tabs.map((tab, index) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleSectionChange(index)}
              style={[
                styles.sectionButton,
                currentSection === index && styles.activeSectionButton,
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  currentSection === index
                    ? [theme.colors.accent.purple, theme.colors.accent.blue]
                    : [theme.colors.background.card, theme.colors.background.secondary]
                }
                style={styles.sectionButtonGradient}
              >
                {getTabIcon(tab.type)}
                <Text
                  style={[
                    styles.sectionButtonText,
                    currentSection === index && styles.activeSectionButtonText,
                  ]}
                >
                  {tab.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[styles.contentContainer, cardAnimatedStyle]}>
        <LinearGradient
          colors={[
            theme.colors.background.card,
            theme.colors.background.secondary,
          ]}
          style={styles.contentCard}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {renderTabContent()}
          </ScrollView>
          
          {/* Shimmer effect */}
          <View style={styles.shimmerContainer}>
            <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.03)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Exam Tips */}
      {content.examTips && content.examTips.length > 0 && (
        <View style={styles.examTipsContainer}>
          <View style={styles.examTipsHeader}>
            <Lightbulb size={20} color={theme.colors.accent.yellow} />
            <Text style={styles.examTipsTitle}>Exam Tips</Text>
          </View>
          
          <View style={styles.examTipsList}>
            {content.examTips.map((tip, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.examTip}
                onPress={() => toggleTip(index)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[theme.colors.accent.yellow + '20', theme.colors.accent.yellow + '10']}
                  style={styles.examTipGradient}
                >
                  <View style={styles.examTipHeader}>
                    <Text style={styles.examTipNumber}>Tip {index + 1}</Text>
                    {expandedTip === index ? (
                      <ChevronUp size={16} color={theme.colors.accent.yellow} />
                    ) : (
                      <ChevronDown size={16} color={theme.colors.accent.yellow} />
                    )}
                  </View>
                  
                  <Text 
                    style={styles.examTipText}
                    numberOfLines={expandedTip === index ? undefined : 2}
                  >
                    {tip}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Continue Button */}
      <View style={styles.continueContainer}>
        <GradientButton
          title="Continue to Quiz Arena"
          onPress={handleContinue}
          size="large"
          fullWidth
          icon={<ArrowRight size={20} color={theme.colors.text.primary} />}
          colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
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
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  loadingProgressContainer: {
    width: '80%',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  loadingBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.purple,
    borderRadius: theme.borderRadius.sm,
  },
  loadingPercentage: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  loadingSteps: {
    width: '80%',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  loadingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingStepCompleted: {
    backgroundColor: theme.colors.accent.green,
    borderColor: theme.colors.accent.green,
  },
  loadingStepText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
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
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerText: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  roomSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  overviewContainer: {
    marginBottom: theme.spacing.md,
  },
  overviewCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
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
    opacity: 0.4,
  },
  shimmerGradient: {
    flex: 1,
  },
  overviewText: {
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  sectionNavContainer: {
    marginBottom: theme.spacing.md,
  },
  sectionNav: {
    maxHeight: 50,
  },
  sectionNavContent: {
    paddingRight: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  sectionButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    minWidth: 120,
  },
  activeSectionButton: {
    ...theme.shadows.button,
  },
  sectionButtonGradient: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  activeSectionButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.subheading,
  },
  contentContainer: {
    flex: 1,
    marginBottom: theme.spacing.md,
  },
  contentCard: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.md,
  },
  contentSection: {
    gap: theme.spacing.md,
  },
  contentText: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  // Ruler-specific styles
  rulerCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  rulerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  rulerName: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  rulerPeriod: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  rulerDynasty: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    marginBottom: theme.spacing.xs,
  },
  rulerCapital: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  achievementsContainer: {
    marginTop: theme.spacing.sm,
  },
  achievementsTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.purple,
    marginTop: 7,
    marginRight: 8,
  },
  achievementText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  // Timeline-specific styles
  timelineItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent.blue,
    marginTop: theme.spacing.xs,
    marginRight: theme.spacing.md,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  timelineYear: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    marginBottom: theme.spacing.xs,
  },
  timelineEvent: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  timelineSignificance: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  // Article-specific styles
  articleCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  articleHeader: {
    marginBottom: theme.spacing.sm,
  },
  articleNumber: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    marginBottom: theme.spacing.xs,
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  articleDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  keyPointsContainer: {
    marginBottom: theme.spacing.sm,
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  keyPointText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  examRelevance: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.green,
    fontStyle: 'italic',
  },
  examRelevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  // Concept-specific styles
  conceptItem: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  conceptTerm: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  conceptDefinition: {
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  conceptExplanation: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
    fontStyle: 'italic',
  },
  examplesContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary + '80',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  examplesTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  // Formula-specific styles
  formulaCard: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  formulaName: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  formulaExpressionContainer: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  formulaExpression: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.blue,
    textAlign: 'center',
  },
  formulaVariables: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  applicationsContainer: {
    marginTop: theme.spacing.sm,
  },
  applicationsTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  applicationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  // List-specific styles
  listItem: {
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  listItemTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  listItemDescription: {
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  listItemDate: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    marginBottom: theme.spacing.xs,
  },
  examImportanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.accent.yellow + '10',
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  examImportance: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    fontStyle: 'italic',
  },
  // Points-specific styles
  pointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  pointIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accent.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  examTipsContainer: {
    marginBottom: theme.spacing.md,
  },
  examTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  examTipsTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  examTipsList: {
    gap: theme.spacing.sm,
  },
  examTip: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  examTipGradient: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.yellow + '40',
  },
  examTipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  examTipNumber: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.yellow,
  },
  examTipText: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  continueContainer: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
});