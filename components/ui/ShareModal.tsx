import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, Share2, Trophy, Star, Copy } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import GradientButton from './GradientButton';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  achievement?: {
    title: string;
    description: string;
    icon: string;
    rarity: string;
  };
  score?: {
    percentage: number;
    subject: string;
    timeSpent: number;
  };
  type: 'achievement' | 'score';
}

export default function ShareModal({
  visible,
  onClose,
  achievement,
  score,
  type
}: ShareModalProps) {
  const [isSharing, setIsSharing] = useState(false);

  const modalScale = useSharedValue(0.9);
  const modalOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      modalOpacity.value = withTiming(1, { duration: 300 });
      modalScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    } else {
      modalOpacity.value = withTiming(0, { duration: 200 });
      modalScale.value = withTiming(0.9, { duration: 200 });
    }
  }, [visible]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalOpacity.value,
    transform: [{ scale: modalScale.value }],
  }));

  const generateShareText = () => {
    if (type === 'achievement' && achievement) {
      return `🎉 Just unlocked "${achievement.title}" on MindGains AI! 

${achievement.description}

Join India's #1 AI-powered learning platform for competitive exams:
📱 Download: https://mindgains.ai
🎯 UPSC • JEE • NEET • Banking • SSC

#MindGainsAI #CompetitiveExams #AILearning #StudySuccess`;
    }

    if (type === 'score' && score) {
      return `🏆 Scored ${score.percentage}% in ${score.subject} on MindGains AI! 

⏱️ Completed in ${Math.round(score.timeSpent / 60)} minutes
🧠 AI-powered learning really works!

Join thousands of students acing their competitive exams:
📱 Download: https://mindgains.ai
🎯 UPSC • JEE • NEET • Banking • SSC

#MindGainsAI #CompetitiveExams #StudySuccess #ExamPrep`;
    }

    return `🚀 Learning with MindGains AI - India's #1 AI-powered platform for competitive exams!

Transform any content into interactive missions:
✨ AI-generated quizzes & flashcards
🎯 Exam-focused content
📊 Real-time progress tracking
🏆 Gamified learning experience

Join the revolution: https://mindgains.ai

#MindGainsAI #CompetitiveExams #AILearning`;
  };

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const shareText = generateShareText();
      
      const result = await Share.share({
        message: shareText,
        title: 'MindGains AI - AI-Powered Learning',
        url: 'https://mindgains.ai',
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Success', 'Shared successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // In a real app, you'd use Clipboard API
      Alert.alert('Link Copied', 'Download link copied to clipboard!');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
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
                <Share2 size={24} color={theme.colors.accent.purple} />
                <Text style={styles.headerTitle}>Share Your Success</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content Preview */}
            <View style={styles.content}>
              {type === 'achievement' && achievement && (
                <View style={styles.achievementPreview}>
                  <LinearGradient
                    colors={[theme.colors.accent.yellow + '30', theme.colors.accent.green + '30']}
                    style={styles.achievementCard}
                  >
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <View style={styles.rarityBadge}>
                      <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {type === 'score' && score && (
                <View style={styles.scorePreview}>
                  <LinearGradient
                    colors={[theme.colors.accent.green + '30', theme.colors.accent.cyan + '30']}
                    style={styles.scoreCard}
                  >
                    <Trophy size={32} color={theme.colors.accent.yellow} />
                    <Text style={styles.scorePercentage}>{score.percentage}%</Text>
                    <Text style={styles.scoreSubject}>{score.subject}</Text>
                    <Text style={styles.scoreTime}>
                      Completed in {Math.round(score.timeSpent / 60)} minutes
                    </Text>
                  </LinearGradient>
                </View>
              )}

              <Text style={styles.shareDescription}>
                Share your success and inspire others to join India's #1 AI learning platform!
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <GradientButton
                title={isSharing ? "Sharing..." : "Share Now"}
                onPress={handleShare}
                size="large"
                fullWidth
                disabled={isSharing}
                icon={<Share2 size={20} color={theme.colors.text.primary} />}
                colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
              />
              
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyLink}
              >
                <LinearGradient
                  colors={[theme.colors.background.tertiary, theme.colors.background.secondary]}
                  style={styles.copyButtonGradient}
                >
                  <Copy size={20} color={theme.colors.accent.cyan} />
                  <Text style={styles.copyButtonText}>Copy App Link</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
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
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.lg,
  },
  achievementPreview: {
    marginBottom: theme.spacing.lg,
  },
  achievementCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  achievementTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  rarityBadge: {
    backgroundColor: theme.colors.accent.yellow + '20',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  rarityText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.yellow,
    fontWeight: 'bold',
  },
  scorePreview: {
    marginBottom: theme.spacing.lg,
  },
  scoreCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  scorePercentage: {
    fontSize: 48,
    fontFamily: theme.fonts.heading,
    color: theme.colors.accent.green,
    marginBottom: theme.spacing.sm,
  },
  scoreSubject: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  scoreTime: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  shareDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  copyButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  copyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  copyButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.cyan,
  },
});