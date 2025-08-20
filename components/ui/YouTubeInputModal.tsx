import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { 
  X, 
  Youtube, 
  CheckCircle, 
  AlertCircle,
  Link,
  Play,
  Clock,
  Eye,
  Zap
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from './MascotAvatar';

const { width, height } = Dimensions.get('window');

interface YouTubeInputModalProps {
  visible: boolean;
  onClose: () => void;
  onContentExtracted: (text: string, analysis: any, metadata: any) => void;
}

interface VideoPreview {
  title: string;
  thumbnail: string;
  duration: string;
  channelTitle: string;
  viewCount: number;
  publishedAt: string;
}

export default function YouTubeInputModal({ visible, onClose, onContentExtracted }: YouTubeInputModalProps) {
  const [url, setUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState<VideoPreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  // Animation values
  const processingOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const inputScale = useSharedValue(1);

  const validateYouTubeURL = (url: string): boolean => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
      /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    return patterns.some(pattern => pattern.test(url));
  };

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
      /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const previewVideo = async () => {
    if (!url.trim()) {
      Alert.alert('URL Required', 'Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeURL(url)) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube URL');
      inputScale.value = withSpring(1.05, { damping: 15, stiffness: 100 });
      setTimeout(() => {
        inputScale.value = withSpring(1);
      }, 200);
      return;
    }

    // For demo purposes, create a mock preview
    // In production, you would call YouTube API here
    const videoId = extractVideoId(url);
    if (videoId) {
      setVideoPreview({
        title: 'Educational Video Content',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '15:30',
        channelTitle: 'Educational Channel',
        viewCount: 125000,
        publishedAt: '2023-12-01',
      });
    }
  };

  const processVideo = async () => {
    if (!url.trim()) return;

    try {
      setIsProcessing(true);
      processingOpacity.value = withTiming(1, { duration: 300 });

      setProcessingStep('Fetching video metadata...');
      
      // Call our YouTube processing function
      const response = await SupabaseService.callEdgeFunction('process-youtube', {
        url: url.trim(),
        language: 'en'
      });

      if (!response.success) {
        throw new Error(response.error || 'YouTube processing failed');
      }

      setProcessingStep('Extracting transcript...');
      
      // Simulate processing steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessingStep('Analyzing educational content...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('Content processed successfully!');
      successScale.value = withSpring(1, { damping: 15, stiffness: 100 });

      // Wait a moment to show success, then return results
      setTimeout(() => {
        onContentExtracted(
          response.extractedText,
          response.contentAnalysis,
          {
            videoMetadata: response.videoMetadata,
            transcriptMethod: response.transcriptMethod,
            statistics: response.statistics,
            processingSteps: response.processingSteps,
          }
        );
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('YouTube Processing Error:', error);
      setIsProcessing(false);
      processingOpacity.value = withTiming(0);
      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process YouTube video. Please ensure the video has captions or educational content.',
        [{ text: 'Try Another Video', onPress: () => {
          setUrl('');
          setVideoPreview(null);
        }}]
      );
    }
  };

  const formatViewCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const handleClose = () => {
    setUrl('');
    setVideoPreview(null);
    setIsProcessing(false);
    setProcessingStep('');
    processingOpacity.value = 0;
    successScale.value = 0;
    inputScale.value = 1;
    onClose();
  };

  // Animation styles
  const inputStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
  }));

  const processingStyle = useAnimatedStyle(() => ({
    opacity: processingOpacity.value,
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View 
          style={styles.modal}
        >
          <LinearGradient
            colors={[
              theme.colors.background.card,
              theme.colors.background.secondary,
            ]}
            style={styles.modalGradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Youtube size={24} color={theme.colors.accent.red} />
                <Text style={styles.headerTitle}>YouTube Video</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.inputSection}>
                <View style={styles.mascotContainer}>
                  <MascotAvatar 
                    mood="excited" 
                    size={60}
                    showSpeechBubble
                    speechText="Paste any educational YouTube video and I'll extract all the content!"
                  />
                </View>

                <Text style={styles.inputLabel}>YouTube URL</Text>
                <Animated.View style={inputStyle}>
                  <View style={styles.inputContainer}>
                    <View style={styles.inputIcon}>
                      <Link size={20} color={theme.colors.accent.red} />
                    </View>
                    <TextInput
                      style={styles.textInput}
                      placeholder="https://youtube.com/watch?v=..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={url}
                      onChangeText={setUrl}
                      keyboardType="url"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {url.length > 0 && (
                      <TouchableOpacity 
                        style={styles.clearButton} 
                        onPress={() => {
                          setUrl('');
                          setVideoPreview(null);
                        }}
                      >
                        <X size={16} color={theme.colors.text.tertiary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>

                {url.length > 0 && !videoPreview && (
                  <TouchableOpacity style={styles.previewButton} onPress={previewVideo}>
                    <LinearGradient
                      colors={[theme.colors.accent.red + '20', theme.colors.accent.pink + '10']}
                      style={styles.previewButtonGradient}
                    >
                      <Play size={16} color={theme.colors.accent.red} />
                      <Text style={styles.previewButtonText}>Preview Video</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {videoPreview && (
                  <View style={styles.videoPreview}>
                    <LinearGradient
                      colors={[theme.colors.accent.red + '10', theme.colors.background.card]}
                      style={styles.videoPreviewGradient}
                    >
                      <View style={styles.thumbnailContainer}>
                        <Image 
                          source={{ uri: videoPreview.thumbnail }}
                          style={styles.thumbnail}
                          defaultSource={{ uri: 'https://via.placeholder.com/320x180/333/fff?text=YouTube' }}
                        />
                        <View style={styles.playOverlay}>
                          <Play size={24} color={theme.colors.text.primary} />
                        </View>
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{videoPreview.duration}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={2}>
                          {videoPreview.title}
                        </Text>
                        <Text style={styles.channelName}>{videoPreview.channelTitle}</Text>
                        
                        <View style={styles.videoStats}>
                          <View style={styles.statItem}>
                            <Eye size={12} color={theme.colors.text.tertiary} />
                            <Text style={styles.statText}>
                              {formatViewCount(videoPreview.viewCount)}
                            </Text>
                          </View>
                          <View style={styles.statItem}>
                            <Clock size={12} color={theme.colors.text.tertiary} />
                            <Text style={styles.statText}>{videoPreview.duration}</Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                <View style={styles.supportedFeatures}>
                  <Text style={styles.featuresTitle}>What I can extract:</Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <CheckCircle size={16} color={theme.colors.accent.green} />
                      <Text style={styles.featureText}>Video transcripts and captions</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle size={16} color={theme.colors.accent.green} />
                      <Text style={styles.featureText}>Educational content analysis</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle size={16} color={theme.colors.accent.green} />
                      <Text style={styles.featureText}>Subject and exam focus detection</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle size={16} color={theme.colors.accent.green} />
                      <Text style={styles.featureText}>Structured learning materials</Text>
                    </View>
                  </View>
                </View>

                {url.length > 0 && (
                  <TouchableOpacity style={styles.processButton} onPress={processVideo}>
                    <LinearGradient
                      colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                      style={styles.processButtonGradient}
                    >
                      <Zap size={20} color={theme.colors.text.primary} />
                      <Text style={styles.processButtonText}>Extract Content</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <View style={styles.disclaimer}>
                  <AlertCircle size={16} color={theme.colors.accent.yellow} />
                  <Text style={styles.disclaimerText}>
                    Works best with educational videos that have captions or clear audio
                  </Text>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* Processing Overlay */}
        <Animated.View style={[styles.processingOverlay, processingStyle]}>
          <LinearGradient
            colors={[theme.colors.background.primary + 'CC', theme.colors.background.secondary + 'CC']}
            style={styles.processingContainer}
          >
            <MascotAvatar mood="thinking" size={60} />
            <Text style={styles.processingTitle}>Processing Video</Text>
            <Text style={styles.processingStep}>{processingStep}</Text>

            <Animated.View style={successStyle}>
              {processingStep.includes('success') && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={24} color={theme.colors.accent.green} />
                  <Text style={styles.successText}>Content Extracted!</Text>
                </View>
              )}
            </Animated.View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modal: {
    width: width - 40,
    maxHeight: height - 100,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    borderRadius: theme.borderRadius.xl,
    maxHeight: height - 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.tertiary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  content: {
    maxHeight: height - 250,
  },
  inputSection: {
    padding: theme.spacing.xl,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.md,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  previewButton: {
    alignSelf: 'flex-start',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  previewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  previewButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.red,
  },
  videoPreview: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  videoPreviewGradient: {
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: theme.colors.background.tertiary,
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.primary,
  },
  videoInfo: {
    gap: theme.spacing.xs,
  },
  videoTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  channelName: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
  },
  videoStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  supportedFeatures: {
    marginBottom: theme.spacing.lg,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  featureList: {
    gap: theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
  },
  processButton: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  processButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.yellow + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    margin: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    ...theme.shadows.card,
  },
  processingTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  processingStep: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.green + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  successText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.green,
  },
});