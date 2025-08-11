import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { Brain, Target, Trophy, Sparkles, ChevronRight, ArrowRight, User, GraduationCap, Calendar, BookOpen, Zap, CircleCheck as CheckCircle, ArrowLeft } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import MascotAvatar from '@/components/ui/MascotAvatar';
import { SupabaseService } from '@/utils/supabaseService';

const { width, height } = Dimensions.get('window');

interface OnboardingStep {
  id: number;
  type: 'intro' | 'form' | 'selection' | 'completion';
  title: string;
  description: string;
  icon: React.ReactNode;
  mascotMood: 'happy' | 'excited' | 'focused' | 'celebrating';
  backgroundColor: string[];
  formFields?: FormField[];
  selectionOptions?: SelectionOption[];
}

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'number';
  required: boolean;
}

interface SelectionOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    type: 'intro',
    title: "Welcome to India's #1 AI Learning Platform",
    description: "MindGains AI transforms any content into interactive learning missions optimized for competitive exams. Let's personalize your experience!",
    icon: <Sparkles size={60} color={theme.colors.text.primary} />,
    mascotMood: 'excited',
    backgroundColor: [theme.colors.accent.purple, theme.colors.accent.blue],
  },
  {
    id: 2,
    type: 'form',
    title: "Tell us about yourself",
    description: "Help us personalize your learning experience for competitive exams.",
    icon: <User size={60} color={theme.colors.text.primary} />,
    mascotMood: 'happy',
    backgroundColor: [theme.colors.accent.blue, theme.colors.accent.cyan],
    formFields: [
      {
        id: 'age',
        label: 'Age',
        placeholder: 'Enter your age',
        type: 'number',
        required: true,
      },
      {
        id: 'grade',
        label: 'Education Level',
        placeholder: 'e.g., 12th, College, Graduate',
        type: 'text',
        required: false,
      },
    ],
  },
  {
    id: 3,
    type: 'selection',
    title: "What's your exam goal?",
    description: "Choose your primary exam focus so we can tailor the content for you.",
    icon: <Target size={60} color={theme.colors.text.primary} />,
    mascotMood: 'focused',
    backgroundColor: [theme.colors.accent.cyan, theme.colors.accent.green],
    selectionOptions: [
      {
        id: 'upsc',
        title: 'UPSC',
        description: 'Civil Services Examination',
        icon: <GraduationCap size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.purple,
      },
      {
        id: 'jee_neet',
        title: 'JEE/NEET',
        description: 'Engineering & Medical',
        icon: <Brain size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.blue,
      },
      {
        id: 'banking',
        title: 'Banking',
        description: 'SBI, IBPS, RBI Exams',
        icon: <Zap size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.yellow,
      },
      {
        id: 'state_pcs',
        title: 'State PCS',
        description: 'State Civil Services',
        icon: <BookOpen size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.green,
      },
    ],
  },
  {
    id: 4,
    type: 'selection',
    title: "How much time do you have?",
    description: "We'll optimize mission length for your study sessions.",
    icon: <Calendar size={60} color={theme.colors.text.primary} />,
    mascotMood: 'focused',
    backgroundColor: [theme.colors.accent.green, theme.colors.accent.purple],
    selectionOptions: [
      {
        id: '15_min',
        title: '15 minutes',
        description: 'Quick learning sessions',
        icon: <Zap size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.yellow,
      },
      {
        id: '30_min',
        title: '30 minutes',
        description: 'Balanced study time',
        icon: <Target size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.blue,
      },
      {
        id: '60_min',
        title: '1 hour',
        description: 'Deep dive sessions',
        icon: <Brain size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.purple,
      },
      {
        id: 'flexible',
        title: 'Flexible',
        description: 'Varies by day',
        icon: <Calendar size={24} color={theme.colors.text.primary} />,
        color: theme.colors.accent.green,
      },
    ],
  },
  {
    id: 5,
    type: 'completion',
    title: "You're all set for success!",
    description: "Your personalized learning journey is ready. Get ready to ace your exams with India's most advanced AI learning platform!",
    icon: <Trophy size={60} color={theme.colors.text.primary} />,
    mascotMood: 'celebrating',
    backgroundColor: [theme.colors.accent.yellow, theme.colors.accent.green],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const progressValue = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const mascotScale = useSharedValue(1);
  const backgroundY = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if user is authenticated with error handling
    const initializeOnboarding = async () => {
      try {
        await checkUserStatus();
      } catch (error) {
        console.error('Error during onboarding initialization:', error);
        // Continue with onboarding if there's an error
      }
    };
    
    initializeOnboarding();
    
    progressValue.value = withTiming((currentStep + 1) / onboardingSteps.length, { duration: 600 });
    
    // Continuous background animation
    backgroundY.value = withRepeat(
      withTiming(-height * 0.5, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
    
    // Shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, [currentStep]);

  const checkUserStatus = async () => {
    try {
      // Check if component is still mounted before making async calls
      if (!isMounted) return;
      
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        // User not authenticated, redirect to auth
        if (!isMounted) return;
        router.replace('/auth');
        return;
      }

      const profile = await SupabaseService.getProfile(user.id);
      if (profile?.full_name) {
        // User already has profile, redirect to main app
        if (!isMounted) return;
        router.replace('/(tabs)');
        return;
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Continue with onboarding if there's an error
    }
  };

  const handleNext = async () => {
    const currentStepData = onboardingSteps[currentStep];
    
    // Validate current step
    if (currentStepData.type === 'form') {
      const requiredFields = currentStepData.formFields?.filter(field => field.required) || [];
      const missingFields = requiredFields.filter(field => !formData[field.id]?.trim());
      
      if (missingFields.length > 0) {
        Alert.alert(
          'Missing Information',
          `Please fill in: ${missingFields.map(f => f.label).join(', ')}`
        );
        return;
      }
    }
    
    if (currentStepData.type === 'selection') {
      if (!selectedOptions[currentStepData.id.toString()]) {
        Alert.alert('Please make a selection', 'Choose an option to continue.');
        return;
      }
    }

    // Button press animation
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );

    // Mascot reaction
    mascotScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );

    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });
    } else {
      // Complete onboarding
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      scrollViewRef.current?.scrollTo({
        x: prevStep * width,
        animated: true,
      });
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    
    try {
      const user = await SupabaseService.getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Update user profile with onboarding data
      await SupabaseService.updateProfile(user.id, {
        bio: `${formData.grade || 'Student'} • Exam Focus: ${getSelectionTitle('3')} • Study Time: ${getSelectionTitle('4')}`,
      });

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectionTitle = (stepId: string) => {
    const option = selectedOptions[stepId];
    const step = onboardingSteps.find(s => s.id.toString() === stepId);
    const selectionOption = step?.selectionOptions?.find(o => o.id === option);
    return selectionOption?.title || '';
  };

  const handleFormChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSelectionChange = (stepId: string, optionId: string) => {
    setSelectedOptions(prev => ({ ...prev, [stepId]: optionId }));
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const mascotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mascotScale.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: backgroundY.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [-1, 1],
      [-width * 2, width * 2]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated background */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={onboardingSteps[currentStep].backgroundColor}
          locations={[0, 1]}
          style={styles.backgroundGradient}
        />
        
        {/* Background pattern */}
        <View style={styles.patternContainer}>
          {[...Array(30)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.patternDot,
                {
                  top: Math.random() * height * 2,
                  left: Math.random() * width,
                  width: 1 + Math.random() * 3,
                  height: 1 + Math.random() * 3,
                  opacity: 0.1 + Math.random() * 0.2,
                }
              ]} 
            />
          ))}
        </View>
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header with back button and progress */}
        <View style={styles.header}>
          {currentStep > 0 && (
            <TouchableOpacity 
              onPress={handleBack}
              style={styles.backButton}
            >
              <ArrowLeft size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
              <Animated.View style={[styles.progressShimmer, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  style={styles.shimmerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>
              Step {currentStep + 1} of {onboardingSteps.length}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {onboardingSteps.map((step, index) => (
            <OnboardingStepComponent
              key={step.id}
              step={step}
              isActive={index === currentStep}
              index={index}
              formData={formData}
              selectedOptions={selectedOptions}
              onFormChange={handleFormChange}
              onSelectionChange={handleSelectionChange}
              mascotAnimatedStyle={mascotAnimatedStyle}
            />
          ))}
        </ScrollView>

        {/* Footer with next button */}
        <View style={styles.footer}>
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[
                  'rgba(255,255,255,0.2)',
                  'rgba(255,255,255,0.1)',
                ]}
                style={styles.nextButtonGradient}
              >
                <Text style={styles.nextButtonText}>
                  {isLoading ? "Setting up..." :
                   currentStep === onboardingSteps.length - 1 ? "Start Learning!" : "Continue"}
                </Text>
                {currentStep === onboardingSteps.length - 1 ? (
                  <ArrowRight size={20} color={theme.colors.text.primary} />
                ) : (
                  <ChevronRight size={20} color={theme.colors.text.primary} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Step indicators */}
          <View style={styles.indicators}>
            {onboardingSteps.map((_, index) => (
              <StepIndicator
                key={index}
                index={index}
                isActive={index === currentStep}
                isCompleted={index < currentStep}
              />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Separate component for step indicators to fix animation issues
function StepIndicator({ index, isActive, isCompleted }: {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(1);
  const width = useSharedValue(8);

  useEffect(() => {
    if (isActive) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1.2, { damping: 15, stiffness: 200 });
      width.value = withTiming(24, { duration: 300 });
    } else if (isCompleted) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
      width.value = withTiming(8, { duration: 300 });
    } else {
      opacity.value = withTiming(0.3, { duration: 300 });
      scale.value = withTiming(1, { duration: 300 });
      width.value = withTiming(8, { duration: 300 });
    }
  }, [isActive, isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    width: width.value,
  }));

  return (
    <Animated.View
      style={[
        styles.indicator,
        isActive && styles.activeIndicator,
        isCompleted && styles.completedIndicator,
        animatedStyle,
      ]}
    />
  );
}

interface OnboardingStepProps {
  step: OnboardingStep;
  isActive: boolean;
  index: number;
  formData: Record<string, string>;
  selectedOptions: Record<string, string>;
  onFormChange: (fieldId: string, value: string) => void;
  onSelectionChange: (stepId: string, optionId: string) => void;
  mascotAnimatedStyle: any;
}

function OnboardingStepComponent({ 
  step, 
  isActive, 
  index, 
  formData, 
  selectedOptions, 
  onFormChange, 
  onSelectionChange,
  mascotAnimatedStyle 
}: OnboardingStepProps) {
  const iconScale = useSharedValue(0.8);
  const textOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);

  useEffect(() => {
    if (isActive) {
      // Staggered animations
      iconScale.value = withDelay(100, withSpring(1, { damping: 15, stiffness: 100 }));
      textOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));
      contentOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));
      contentTranslateY.value = withDelay(500, withSpring(0, { damping: 15, stiffness: 100 }));
    } else {
      iconScale.value = withTiming(0.8, { duration: 300 });
      textOpacity.value = withTiming(0.7, { duration: 300 });
      contentOpacity.value = withTiming(0.7, { duration: 300 });
      contentTranslateY.value = withTiming(30, { duration: 300 });
    }
  }, [isActive]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const renderStepContent = () => {
    switch (step.type) {
      case 'form':
        return (
          <Animated.View style={[styles.formContainer, contentAnimatedStyle]}>
            {step.formFields?.map((field) => (
              <View key={field.id} style={styles.formField}>
                <Text style={styles.fieldLabel}>
                  {field.label} {field.required && <Text style={styles.required}>*</Text>}
                </Text>
                <View style={styles.fieldInputContainer}>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={theme.colors.text.primary + '60'}
                    value={formData[field.id] || ''}
                    onChangeText={(value) => onFormChange(field.id, value)}
                    keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                    autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                  />
                </View>
              </View>
            ))}
          </Animated.View>
        );

      case 'selection':
        return (
          <Animated.View style={[styles.selectionContainer, contentAnimatedStyle]}>
            {step.selectionOptions?.map((option, optionIndex) => (
              <SelectionOption
                key={option.id}
                option={option}
                isSelected={selectedOptions[step.id.toString()] === option.id}
                onSelect={() => onSelectionChange(step.id.toString(), option.id)}
                index={optionIndex}
              />
            ))}
          </Animated.View>
        );

      case 'completion':
        return (
          <Animated.View style={[styles.completionContainer, contentAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.accent.yellow + '30', theme.colors.accent.green + '30']}
              style={styles.completionCard}
            >
              <Trophy size={32} color={theme.colors.accent.yellow} />
              <Text style={styles.completionTitle}>Ready for Success!</Text>
              <Text style={styles.completionText}>
                Your personalized learning journey is set up. Get ready to ace your exams with India's most advanced AI learning platform!
              </Text>
            </LinearGradient>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>AI-powered learning missions</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>Exam-focused content generation</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>Interactive 4-room learning system</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>Progress tracking & achievements</Text>
              </View>
            </View>
          </Animated.View>
        );

      default:
        return (
          <Animated.View style={[styles.introContainer, contentAnimatedStyle]}>
            <LinearGradient
              colors={[theme.colors.text.primary + '20', theme.colors.text.primary + '10']}
              style={styles.introCard}
            >
              <Text style={styles.introHighlight}>
                India's Revolutionary AI Learning Platform
              </Text>
              <Text style={styles.introText}>
                Join millions of students across India who are transforming their exam preparation with MindGains AI.
              </Text>
            </LinearGradient>
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>UPSC, JEE, NEET, Banking & more</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>Personalized learning paths</Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.accent.green} />
                <Text style={styles.featureText}>Exam-focused content generation</Text>
              </View>
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.stepContainer}>
      {/* Mascot section */}
      <Animated.View style={[styles.mascotSection, mascotAnimatedStyle]}>
        <MascotAvatar
          size={120}
          animated={isActive}
          glowing={isActive}
          mood={step.mascotMood}
        />
        
        {/* Speech bubble */}
        <LinearGradient
          colors={[theme.colors.text.primary + '25', theme.colors.text.primary + '15']}
          style={styles.speechBubble}
        >
          <Text style={styles.speechText}>
            {step.id === 1 && "Namaste! I'm Twizzle, your AI study buddy for competitive exams! 🎉"}
            {step.id === 2 && "Tell me about yourself so I can personalize your exam prep! 📝"}
            {step.id === 3 && "Which competitive exam are you preparing for? 🎯"}
            {step.id === 4 && "How much time do you have for each study session? ⏰"}
            {step.id === 5 && "Perfect! Let's start your exam success journey! 🚀"}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced icon section */}
      <Animated.View style={[styles.iconSection, iconAnimatedStyle]}>
        <LinearGradient
          colors={[
            theme.colors.text.primary + '25',
            theme.colors.text.primary + '15',
          ]}
          style={styles.iconBackground}
        >
          {step.icon}
          
          {/* Shimmer effect */}
          <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']}
              style={styles.shimmerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Enhanced text section */}
      <Animated.View style={[styles.textSection, textAnimatedStyle]}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
      </Animated.View>

      {/* Step-specific content */}
      {renderStepContent()}
    </View>
  );
}

function SelectionOption({ option, isSelected, onSelect, index }: {
  option: SelectionOption;
  isSelected: boolean;
  onSelect: () => void;
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

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 120 })
    );
    onSelect();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.selectionOption, animatedStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={
            isSelected
              ? [option.color + '40', option.color + '20']
              : [theme.colors.text.primary + '15', theme.colors.text.primary + '10']
          }
          style={[styles.selectionCard, isSelected && styles.selectedCard]}
        >
          <View style={[styles.optionIcon, { backgroundColor: option.color + '30' }]}>
            {option.icon}
          </View>
          <Text style={[styles.optionTitle, isSelected && { color: option.color }]}>
            {option.title}
          </Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <CheckCircle size={20} color={option.color} />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: height * 2,
  },
  backgroundGradient: {
    width: '100%',
    height: '100%',
  },
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  patternDot: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginLeft: 40, // To center with the back button
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.text.primary,
    borderRadius: 3,
  },
  progressShimmer: {
    position: 'absolute',
    top: 0,
    left: -50,
    width: 100,
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContainer: {
    width: width,
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  mascotSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    position: 'relative',
  },
  speechBubble: {
    position: 'absolute',
    top: -40,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: 280,
  },
  speechText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  iconSection: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 200,
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
    gap: 20,
  },
  formField: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  required: {
    color: theme.colors.accent.pink,
  },
  fieldInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  fieldInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.primary,
    height: 56,
  },
  selectionContainer: {
    width: '100%',
    gap: 16,
  },
  selectionOption: {
    width: '100%',
  },
  selectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  completionContainer: {
    width: '100%',
    gap: 24,
  },
  completionCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    gap: 16,
  },
  completionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
  },
  completionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  introContainer: {
    width: '100%',
    gap: 24,
  },
  introCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 16,
  },
  introHighlight: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  introText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text.primary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
    gap: 24,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: theme.colors.text.primary,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  activeIndicator: {
    backgroundColor: theme.colors.text.primary,
  },
  completedIndicator: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});