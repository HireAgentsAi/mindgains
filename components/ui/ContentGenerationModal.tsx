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
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, BookOpen, Users, Award, Zap, Loader } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import GradientButton from './GradientButton';

interface ContentGenerationModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (config: any) => void;
  contentType?: string | null;
  isLoading?: boolean;
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
    examples: ['Fundamental Rights', 'DPSP', 'Union Executive']
  },
  {
    id: 'geography',
    title: 'Geography',
    description: 'Physical, human, economic',
    icon: <Zap size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.green,
    examples: ['Monsoon System', 'River Systems', 'Mineral Resources']
  },
  {
    id: 'science',
    title: 'Science',
    description: 'Physics, chemistry, biology',
    icon: <Zap size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.cyan,
    examples: ['Photosynthesis', 'Newton Laws', 'Chemical Reactions']
  },
  {
    id: 'literature',
    title: 'Literature',
    description: 'Authors, works, movements',
    icon: <BookOpen size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.pink,
    examples: ['Shakespeare', 'Tagore', 'Premchand']
  },
  {
    id: 'general',
    title: 'General',
    description: 'Any topic or subject',
    icon: <Users size={24} color={theme.colors.text.primary} />,
    color: theme.colors.accent.yellow,
    examples: ['Current Affairs', 'Economics', 'Technology']
  }
];

const examTypes = [
  { id: 'upsc', title: 'UPSC', color: theme.colors.accent.purple },
  { id: 'ssc', title: 'SSC', color: theme.colors.accent.blue },
  { id: 'banking', title: 'Banking', color: theme.colors.accent.green },
  { id: 'state_pcs', title: 'State PCS', color: theme.colors.accent.yellow },
  { id: 'neet', title: 'NEET', color: theme.colors.accent.pink },
  { id: 'jee', title: 'JEE', color: theme.colors.accent.cyan },
  { id: 'general', title: 'General', color: theme.colors.text.muted }
];

const quickTopics = [
  { topic: 'Indian Independence Movement', type: 'historical_period', exam: 'upsc' },
  { topic: 'Fundamental Rights', type: 'constitution', exam: 'upsc' },
  { topic: 'Photosynthesis', type: 'science', exam: 'neet' },
  { topic: 'Trigonometry', type: 'science', exam: 'jee' },
  { topic: 'Banking Awareness', type: 'general', exam: 'banking' },
  { topic: 'Current Affairs 2024', type: 'general', exam: 'ssc' }
];

export default function ContentGenerationModal(props: ContentGenerationModalProps) {
  const { visible, onClose, onGenerate, isLoading } = props;
  const [topic, setTopic] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string>('general');
  const [selectedExamType, setSelectedExamType] = useState<string>('general');
  const [subject, setSubject] = useState('');
  const [showQuickTopics, setShowQuickTopics] = useState(true);

  const handleGenerate = async () => {
    console.log('🚀 CONTENT GENERATION - handleGenerate called');
    
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter a topic to generate content for.');
      return;
    }

    const missionData = {
      title: topic.trim(),
      description: `Learn ${topic.trim()} with AI-generated content`,
      content_type: 'text',
      content_text: topic.trim(),
      subject_name: subject.trim() || selectedContentType,
      difficulty: 'medium',
      contentType: selectedContentType,
      examFocus: selectedExamType,
    };

    console.log('📦 Mission data created:', missionData);
    
    try {
      // Call the onGenerate callback which should handle the actual content generation
      await onGenerate(missionData);
      
      // Reset form only if successful - the parent will close modal
      setTopic('');
      setSelectedContentType('general');
      setSelectedExamType('general');
      setSubject('');
      setShowQuickTopics(true);
      
    } catch (error) {
      console.error('Error generating content:', error);
      Alert.alert('Error', 'Failed to generate content. Please try again.');
    }
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={() => {}}>
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.modal}
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

            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
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

                  {/* Exam Type Selection */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎓 Exam Focus</Text>
                    <Text style={styles.sectionSubtitle}>Optimize content for specific exam patterns</Text>
                    
                    <View style={styles.examTypesContainer}>
                      {examTypes.map((exam) => (
                        <TouchableOpacity
                          key={exam.id}
                          style={[
                            styles.examTypeChip,
                            selectedExamType === exam.id && styles.selectedExamType,
                            { borderColor: selectedExamType === exam.id ? exam.color : theme.colors.border.tertiary }
                          ]}
                          onPress={() => setSelectedExamType(exam.id)}
                        >
                          <Text style={[
                            styles.examTypeText,
                            { color: selectedExamType === exam.id ? exam.color : theme.colors.text.secondary }
                          ]}>
                            {exam.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Subject Input */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📚 Subject (Optional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g., History, Physics, Geography"
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={subject}
                      onChangeText={setSubject}
                    />
                  </View>

                  {/* Back to Quick Topics */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                      setShowQuickTopics(true);
                      setTopic('');
                    }}
                  >
                    <Text style={styles.backButtonText}>← Back to quick topics</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Generate Button */}
            {!showQuickTopics && (
              <View style={styles.footer}>
                <GradientButton
                  title={isLoading ? "Creating..." : "Generate Smart Content"}
                  onPress={handleGenerate}
                  size="large"
                  fullWidth
                  icon={isLoading ? 
                    <ActivityIndicator size={20} color={theme.colors.text.primary} /> :
                    <Sparkles size={20} color={theme.colors.text.primary} />
                  }
                  colors={[theme.colors.accent.purple, theme.colors.accent.blue]}
                  disabled={isLoading}
                />
              </View>
            )}
          </LinearGradient>
          
          {/* Loading Overlay - Duolingo Style */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <LinearGradient
                colors={[theme.colors.accent.purple + 'E6', theme.colors.accent.blue + 'E6']}
                style={styles.loadingContainer}
              >
                <View style={styles.loadingContent}>
                  <ActivityIndicator size={60} color={theme.colors.text.primary} />
                  <Text style={styles.loadingTitle}>Creating Your Learning Journey</Text>
                  <Text style={styles.loadingSubtitle}>
                    🧠 Analyzing your topic{'\n'}
                    📚 Structuring content{'\n'}
                    ✨ Generating smart materials
                  </Text>
                  <View style={styles.progressDots}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    height: '80%',
    maxHeight: 700,
  },
  modal: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
    backgroundColor: theme.colors.background.card,
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
  },
  scrollContainer: {
    padding: theme.spacing.lg,
    flexGrow: 1,
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
    padding: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.secondary,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionCard: {
    width: '48%',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  selectedOption: {
    transform: [{ scale: 0.98 }],
  },
  optionGradient: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
    borderRadius: theme.borderRadius.lg,
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
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  exampleTag: {
    fontSize: 10,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  examTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  examTypeChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    backgroundColor: theme.colors.background.tertiary,
  },
  selectedExamType: {
    backgroundColor: theme.colors.background.primary,
  },
  examTypeText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
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
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  customTopicButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  customTopicText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.accent.blue,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    width: '90%',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  loadingContent: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  loadingTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressDots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.background.tertiary,
  },
  dotActive: {
    backgroundColor: theme.colors.accent.green,
  },
});