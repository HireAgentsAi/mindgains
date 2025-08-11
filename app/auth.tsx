import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popup, setPopup] = useState({ visible: false, title: '', message: '' });
  const [activeInput, setActiveInput] = useState<string | null>(null);

  // Animation values
  const cardScale = useSharedValue(0.95);
  const cardOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-1);
  const backgroundY = useSharedValue(0);

  useEffect(() => {
    // Start animations
    cardOpacity.value = withTiming(1, { duration: 800 });
    cardScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back()) });
    logoOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    logoScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 100 }));
    formOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    formTranslateY.value = withDelay(600, withSpring(0, { damping: 15, stiffness: 100 }));
    
    // Continuous animations
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    
    backgroundY.value = withRepeat(
      withTiming(-height * 0.5, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const handleValidation = () => {
    if (!email || !password || (!isLogin && (!fullName || !confirmPassword))) {
      setError('All fields are required.');
      animateError();
      return false;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email.');
      animateError();
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      animateError();
      return false;
    }
    setError('');
    return true;
  };

  const animateError = () => {
    cardScale.value = withSequence(
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 }),
      withTiming(0.98, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleSubmit = async () => {
    if (!handleValidation()) return;
    setLoading(true);
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 300, easing: Easing.elastic(1.2) })
    );

    try {
      // Check if Supabase is configured
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
        // Demo authentication
        if (isLogin) {
          // Simulate successful login
          setTimeout(() => {
            setLoading(false);
            router.replace('/(tabs)');
          }, 1500);
        } else {
          // Simulate successful signup
          setTimeout(() => {
            setLoading(false);
            setPopup({
              visible: true,
              title: 'Demo Account Created',
              message: 'Welcome to MindGains AI! You can now explore all features with demo data.',
            });
            setIsLogin(true);
          }, 1500);
        }
        return;
      }
      
      if (isLogin) {
        const { user, error } = await SupabaseService.signIn(email, password);
        if (error || !user) throw new Error(error?.message || 'Login failed');
        
        // Track successful login
        await SupabaseService.trackUserActivity(user.id, 'sign_in');
        
        router.replace('/(tabs)');
      } else {
        const { error } = await SupabaseService.signUp(email, password, fullName);
        if (error) throw new Error(error.message);
        
        setPopup({
          visible: true,
          title: 'Account Created',
          message: 'Your account has been created successfully! Please sign in to continue.',
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
      animateError();
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    // Reset form
    setError('');
    
    // Animate form transition
    formOpacity.value = withSequence(
      withTiming(0, { duration: 200 }),
      withDelay(100, withTiming(1, { duration: 400 }))
    );
    formTranslateY.value = withSequence(
      withTiming(20, { duration: 200 }),
      withDelay(100, withTiming(0, { duration: 400, easing: Easing.out(Easing.back()) }))
    );
    
    // Toggle mode
    setIsLogin(!isLogin);
  };

  const handleInputFocus = (inputName: string) => {
    setActiveInput(inputName);
  };

  const handleInputBlur = () => {
    setActiveInput(null);
  };

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
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

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: backgroundY.value }],
  }));

  const getInputStyle = (inputName: string) => {
    return [
      styles.inputRow,
      activeInput === inputName && styles.inputRowActive,
    ];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Animated background */}
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={[
            '#0a0a1a',
            '#1a1a2e',
            '#16213e',
            '#0f0f23',
            '#0a0a1a',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <LinearGradient
              colors={[
                theme.colors.accent.purple,
                theme.colors.accent.blue,
                theme.colors.accent.blue,
              ]}
              style={styles.logoBackground}
            >
              <FontAwesome5 name="brain" size={50} color={theme.colors.text.primary} solid />
              
              {/* Shimmer effect */}
              <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </LinearGradient>
            
            <Text style={styles.logoText}>MindGains AI</Text>
            <Text style={styles.logoTagline}>India's #1 AI Learning Platform</Text>
          </Animated.View>

          {/* Auth Card */}
          <Animated.View style={[styles.cardContainer, cardAnimatedStyle]}>
            <LinearGradient
              colors={[
                'rgba(255,255,255,0.08)',
                'rgba(255,255,255,0.03)',
              ]}
              style={styles.card}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  {isLogin ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {isLogin 
                    ? 'Sign in to continue your learning journey' 
                    : 'Join millions of students across India'}
                </Text>
              </View>

              {/* Form */}
              <Animated.View style={[styles.form, formAnimatedStyle]}>
                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={getInputStyle('name')}>
                      <FontAwesome5 
                        name="user" 
                        size={16} 
                        color={activeInput === 'name' ? theme.colors.accent.purple : theme.colors.text.tertiary} 
                        solid 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Enter your full name" 
                        placeholderTextColor={theme.colors.text.tertiary}
                        value={fullName}
                        onChangeText={setFullName}
                        onFocus={() => handleInputFocus('name')}
                        onBlur={handleInputBlur}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={getInputStyle('email')}>
                    <FontAwesome5 
                      name="envelope" 
                      size={16} 
                      color={activeInput === 'email' ? theme.colors.accent.purple : theme.colors.text.tertiary} 
                      solid 
                    />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Enter your email" 
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => handleInputFocus('email')}
                      onBlur={handleInputBlur}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={getInputStyle('password')}>
                    <FontAwesome5 
                      name="lock" 
                      size={16} 
                      color={activeInput === 'password' ? theme.colors.accent.purple : theme.colors.text.tertiary} 
                      solid 
                    />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Enter your password" 
                      placeholderTextColor={theme.colors.text.tertiary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => handleInputFocus('password')}
                      onBlur={handleInputBlur}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <FontAwesome5 
                        name={showPassword ? "eye-slash" : "eye"} 
                        size={16} 
                        color={theme.colors.text.tertiary} 
                        solid 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isLogin && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={getInputStyle('confirmPassword')}>
                      <FontAwesome5 
                        name="lock" 
                        size={16} 
                        color={activeInput === 'confirmPassword' ? theme.colors.accent.purple : theme.colors.text.tertiary} 
                        solid 
                      />
                      <TextInput 
                        style={styles.input} 
                        placeholder="Confirm your password" 
                        placeholderTextColor={theme.colors.text.tertiary}
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => handleInputFocus('confirmPassword')}
                        onBlur={handleInputBlur}
                      />
                    </View>
                  </View>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Submit Button */}
                <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
                  <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                      </Text>
                      <FontAwesome5 name="arrow-right" size={16} color={theme.colors.text.primary} solid />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Switch Mode */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </Text>
                  <TouchableOpacity onPress={handleSwitchMode}>
                    <Text style={styles.switchButton}>
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Trust badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <FontAwesome5 name="check-circle" size={12} color={theme.colors.accent.green} solid />
              <Text style={styles.trustText}>Trusted by 1M+ students</Text>
            </View>
            <View style={styles.trustBadge}>
              <FontAwesome5 name="check-circle" size={12} color={theme.colors.accent.green} solid />
              <Text style={styles.trustText}>UPSC • JEE • NEET • Banking</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      <Modal
        visible={popup.visible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[styles.modalContainer]}
            entering={withSpring({ damping: 15, stiffness: 100 })}
          >
            <LinearGradient
              colors={[
                theme.colors.background.card,
                theme.colors.background.secondary,
              ]}
              style={styles.modalContent}
            >
              <View style={styles.modalIconContainer}>
                <LinearGradient
                  colors={[theme.colors.accent.green, theme.colors.accent.blue]}
                  style={styles.modalIcon}
                >
                  <FontAwesome5 name="check-circle" size={28} color={theme.colors.text.primary} solid />
                </LinearGradient>
              </View>
              
              <Text style={styles.modalTitle}>{popup.title}</Text>
              <Text style={styles.modalMessage}>{popup.message}</Text>
              
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setPopup({ ...popup, visible: false })}
              >
                <LinearGradient
                  colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
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
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 80 : 100,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 200,
    height: '100%',
    opacity: 0.8,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-20deg' }],
  },
  logoText: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  logoTagline: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text.secondary,
  },
  cardContainer: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputRowActive: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginLeft: 12,
  },
  errorText: {
    color: theme.colors.accent.pink,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    color: theme.colors.text.primary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  switchText: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  switchButton: {
    color: theme.colors.accent.purple,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trustText: {
    color: theme.colors.text.secondary,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: theme.colors.text.primary,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
});