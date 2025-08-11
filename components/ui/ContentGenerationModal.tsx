import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, Sparkles, BookOpen, Users, Award, Zap } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import GradientButton from './GradientButton';

interface ContentGenerationModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (config: GenerationConfig) => void;
}

interface GenerationConfig {
  topic: string;
  contentType: 'historical_period' | 'constitution' | 'geography' | 'science' | 'literature' | 'general';
  examFocus: 'upsc' | 'ssc' | 'banking' | 'state_pcs' | 'neet' | 'jee' | 'general';
  subject?: string;
}

const contentTypes = [
  {
    id: 'historical_period',
    title: 'Historical Period',
    description: 'Dynasties, rulers, timelines',
    icon: <BookOpen size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.purple,
    examples: ['Delhi Sultanate', 'Mughal Empire', 'Gupta Period']
  },
  {
    id: 'constitution',
    title: 'Constitution',
    description: 'Articles, amendments, parts',
    icon: <Award size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.blue,
    examples: ['Fundamental Rights', 'DPSP', 'Emergency Provisions']
  },
  {
    id: 'geography',
    title: 'Geography',
    description: 'Physical, economic, political',
    icon: <Users size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.green,
    examples: ['Indian Rivers', 'Climate', 'Minerals']
  },
  {
    id: 'science',
    title: 'Science',
    description: 'Physics, chemistry, biology',
    icon: <Zap size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.yellow,
    examples: ['Photosynthesis', 'Atomic Structure', 'Laws of Motion']
  },
  {
    id: 'general',
    title: 'General Topic',
    description: 'Any other topic',
    icon: <Sparkles size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.pink,
    examples: ['Current Affairs', 'Economics', 'Polity']
  }
];

const examTypes = [
  { id: 'upsc', title: 'UPSC', description: 'Civil Services' },
  { id: 'ssc', title: 'SSC', description: 'Staff Selection' },
  { id: 'banking', title: 'Banking', description: 'Bank Exams' },
  { id: 'state_pcs', title: 'State PCS', description: 'State Services' },
  { id: 'neet', title: 'NEET', description: 'Medical Entrance' },
  { id: 'jee', title: 'JEE', description: 'Engineering Entrance' },
  { id: 'general', title: 'General', description: 'All Competitive' }
];

const quickTopics = [
  { topic: 'Delhi Sultanate', type: 'historical_period', exam: 'upsc' },
  { topic: 'Fundamental Rights', type: 'constitution', exam: 'upsc' },
  { topic: 'Indian Rivers', type: 'geography', exam: 'ssc' },
  { topic: 'Photosynthesis', type: 'science', exam: 'neet' },
  { topic: 'Mughal Empire', type: 'historical_period', exam: 'upsc' },
  { topic: 'Emergency Provisions', type: 'constitution', exam: 'banking' },
  { topic: 'Climate of India', type: 'geography', exam: 'state_pcs' },
  { topic: 'Atomic Structure', type: 'science', exam: 'jee' }
];

export default function ContentGenerationModal({
  visible,
  onClose,
  onGenerate
}: ContentGenerationModalProps) {
  const [topic, setTopic] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('general');
  const [selectedExamType, setSelectedExamType] = useState<string>('general');
  const [subject, setSubject] = useState('');
  const [showQuickTopics, setShowQuickTopics] = useState(true);

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

  const handleGenerate = () => {
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter a topic to generate content for.');
      return;
    }

    const config: GenerationConfig = {
      topic: topic.trim(),
      contentType: selectedContentType as any,
      examFocus: selectedExamType as any,
      subject: subject.trim() || undefined
    };

    onGenerate(config);
    onClose();
    
    // Reset form
    setTopic('');
    setSelectedContentType('general');
    setSelectedExamType('general');
    setSubject('');
    setShowQuickTopics(true);
  };

  const handleQuickTopic = (quickTopic: any) => {
    setTopic(quickTopic.topic);
    setSelectedContentType(quickTopic.type);
    setSelectedExamType(quickTopic.exam);
    setShowQuickTopics(false);
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
                <Sparkles size={24} color={theme.colors.accent.purple} />
                <Text style={styles.headerTitle}>Smart Content Generator</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Quick Topics */}
              {showQuickTopics && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🚀 Quick Generate</Text>
                  <Text style={styles.sectionSubtitle}>Popular exam topics</Text>
                  
                  <View style={styles.quickTopicsGrid}>
                    {quickTopics.map((quickTopic, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quickTopicCard}
                        onPress={() => handleQuickTopic(quickTopic)}
                      >
                        <LinearGradient
                          colors={[
                            theme.colors.accent.purple + '20',
                            theme.colors.accent.blue + '20'
                          ]}
                          style={styles.quickTopicGradient}
                        >
                          <Text style={styles.quickTopicText}>{quickTopic.topic}</Text>
                          <Text style={styles.quickTopicExam}>{quickTopic.exam.toUpperCase()}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.customTopicButton}
                    onPress={() => setShowQuickTopics(false)}
                  >
                    <Text style={styles.customTopicText}>Or create custom topic →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Custom Topic Form */}
              {!showQuickTopics && (
                <>
                  {/* Topic Input */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 Enter Topic</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., Delhi Sultanate, Fundamental Rights, Photosynthesis"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={topic}
                      onChangeText={setTopic}
                      autoFocus
                    />
                  </View>

                  {/* Content Type Selection */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 Content Type</Text>
                    <Text style={styles.sectionSubtitle}>Choose the type of content to generate optimal tabs</Text>
                    
                    <View style={styles.optionsGrid}>
                      {contentTypes.map((type) => (
                        <TouchableOpacity
                          key={type.id}
                          style={[
                            styles.optionCard,
                            selectedContentType === type.id && styles.selectedOption
                          ]}
                          onPress={() => setSelectedContentType(type.id)}
                        >
                          <LinearGradient
                            colors={
                              selectedContentType === type.id
                                ? [type.color + '40', type.color + '20']
                                : [theme.colors.background.tertiary, theme.colors.background.secondary]
                            }
                            style={styles.optionGradient}
                          >
                            <View style={[styles.optionIcon, { backgroundColor: type.color + '30' }]}>
                              {type.icon}
                            </View>
                            <Text style={styles.optionTitle}>{type.title}</Text>
                            <Text style={styles.optionDescription}>{type.description}</Text>
                            <View style={styles.exampleTags}>
                              {type.examples.slice(0, 2).map((example, index) => (
                                <Text key={index} style={styles.exampleTag}>{example}</Text>
                              ))}
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Exam Focus Selection */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎓 Exam Focus</Text>
                    <Text style={styles.sectionSubtitle}>Tailor content for specific competitive exams</Text>
                    
                    <View style={styles.examGrid}>
                      {examTypes.map((exam) => (
                        <TouchableOpacity
                          key={exam.id}
                          style={[
                            styles.examCard,
                            selectedExamType === exam.id && styles.selectedExam
                          ]}
                          onPress={() => setSelectedExamType(exam.id)}
                        >
                          <Text style={[
                            styles.examTitle,
                            selectedExamType === exam.id && styles.selectedExamText
                          ]}>
                            {exam.title}
                          </Text>
                          <Text style={styles.examDescription}>{exam.description}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Subject Input */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📚 Subject (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., History, Polity, Physics"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={subject}
                      onChangeText={setSubject}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setShowQuickTopics(true)}
                  >
                    <Text style={styles.backButtonText}>← Back to Quick Topics</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Generate Button */}
            {!showQuickTopics && (
              <View style={styles.footer}>
                <GradientButton
                  title="Generate Smart Content"
                  onPress={handleGenerate}
                  size="large"
                  fullWidth
                  icon={<Sparkles size={20} color={theme.colors.text.primary} />}
                  colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                />
              </View>
            )}
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
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
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
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  textInput: {
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
  quickTopicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  quickTopicCard: {
    width: '48%',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  quickTopicGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.md,
  },
  quickTopicText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  quickTopicExam: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.purple,
    backgroundColor: theme.colors.accent.purple + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  customTopicButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  customTopicText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.purple,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionCard: {
    width: '48%',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  selectedOption: {
    ...theme.shadows.card,
  },
  optionGradient: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.md,
    minHeight: 140,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  optionTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  exampleTag: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.background.tertiary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  examGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  examCard: {
    width: '31%',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.tertiary,
  },
  selectedExam: {
    borderColor: theme.colors.accent.purple,
    backgroundColor: theme.colors.accent.purple + '20',
  },
  examTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectedExamText: {
    color: theme.colors.accent.purple,
  },
  examDescription: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.blue,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.tertiary,
  },
});