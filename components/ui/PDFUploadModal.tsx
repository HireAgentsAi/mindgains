import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  File,
  BookOpen,
  Zap,
  Download
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from './MascotAvatar';

const { width, height } = Dimensions.get('window');

interface PDFUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onTextExtracted: (text: string, analysis: any, metadata: any) => void;
}

interface FileInfo {
  name: string;
  size: number;
  uri: string;
  mimeType: string;
}

export default function PDFUploadModal({ visible, onClose, onTextExtracted }: PDFUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Animation values
  const uploadScale = useSharedValue(1);
  const processingOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileInfo: FileInfo = {
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/pdf',
        };

        setSelectedFile(fileInfo);
        
        // Animate upload button
        uploadScale.value = withSequence(
          withTiming(1.1, { duration: 150 }),
          withSpring(1, { damping: 15, stiffness: 100 })
        );
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select PDF file. Please try again.');
    }
  };

  const processPDF = async () => {
    if (!selectedFile) return;

    try {
      setIsProcessing(true);
      processingOpacity.value = withTiming(1, { duration: 300 });

      // Validate file size (limit to 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSizeInBytes) {
        throw new Error('File size too large. Please select a PDF smaller than 10MB.');
      }

      setProcessingStep('Reading PDF file...');
      progressWidth.value = withTiming(0.2, { duration: 500 });

      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setProcessingStep('Processing PDF pages...');
      progressWidth.value = withTiming(0.5, { duration: 500 });

      // Call our PDF processing function
      const response = await SupabaseService.callEdgeFunction('process-pdf', {
        fileData: fileContent,
        fileName: selectedFile.name,
        maxPages: 20, // Limit processing to first 20 pages
      });

      if (!response.success) {
        throw new Error(response.error || 'PDF processing failed');
      }

      setProcessingStep('Extracting and structuring content...');
      progressWidth.value = withTiming(0.8, { duration: 500 });

      // Simulate final processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProcessingStep('PDF processed successfully!');
      progressWidth.value = withTiming(1, { duration: 300 });
      successScale.value = withSpring(1, { damping: 15, stiffness: 100 });

      // Wait a moment to show success, then return results
      setTimeout(() => {
        onTextExtracted(
          response.extractedText,
          response.contentAnalysis,
          {
            fileName: selectedFile.name,
            fileSize: formatFileSize(selectedFile.size),
            statistics: response.statistics,
            processingSteps: response.processingSteps,
          }
        );
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('PDF Processing Error:', error);
      setIsProcessing(false);
      processingOpacity.value = withTiming(0);
      progressWidth.value = withTiming(0);
      Alert.alert(
        'Processing Failed',
        error.message || 'Failed to process PDF. Please ensure the file is a valid PDF with readable text.',
        [{ text: 'Try Another File', onPress: () => setSelectedFile(null) }]
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    setProcessingStep('');
    setUploadProgress(0);
    processingOpacity.value = 0;
    successScale.value = 0;
    progressWidth.value = 0;
    uploadScale.value = 1;
    onClose();
  };

  // Animation styles
  const uploadButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uploadScale.value }],
  }));

  const processingStyle = useAnimatedStyle(() => ({
    opacity: processingOpacity.value,
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
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
                <FileText size={24} color={theme.colors.accent.blue} />
                <Text style={styles.headerTitle}>Upload PDF</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {!selectedFile ? (
                // Upload Area
                <View style={styles.uploadSection}>
                  <View style={styles.mascotContainer}>
                    <MascotAvatar 
                      mood="excited" 
                      size={60}
                      showSpeechBubble
                      speechText="Upload your PDF and I'll extract all the learning content!"
                    />
                  </View>

                  <Animated.View style={uploadButtonStyle}>
                    <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
                      <LinearGradient
                        colors={[theme.colors.accent.blue + '20', theme.colors.accent.cyan + '10']}
                        style={styles.uploadAreaGradient}
                      >
                        <View style={styles.uploadIcon}>
                          <Upload size={48} color={theme.colors.accent.blue} />
                        </View>
                        
                        <Text style={styles.uploadTitle}>Choose PDF File</Text>
                        <Text style={styles.uploadSubtitle}>
                          Select textbooks, notes, or study materials
                        </Text>
                        
                        <View style={styles.uploadButton}>
                          <LinearGradient
                            colors={[theme.colors.accent.blue, theme.colors.accent.cyan]}
                            style={styles.uploadButtonGradient}
                          >
                            <FontAwesome5 name="file-upload" size={16} color={theme.colors.text.primary} />
                            <Text style={styles.uploadButtonText}>Browse Files</Text>
                          </LinearGradient>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={styles.supportedFormats}>
                    <Text style={styles.supportedTitle}>Supported Features</Text>
                    <View style={styles.featureList}>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color={theme.colors.accent.green} />
                        <Text style={styles.featureText}>Extract text from PDFs</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color={theme.colors.accent.green} />
                        <Text style={styles.featureText}>Auto-detect subject and topics</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color={theme.colors.accent.green} />
                        <Text style={styles.featureText}>Structure content for learning</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <CheckCircle size={16} color={theme.colors.accent.green} />
                        <Text style={styles.featureText}>Generate study materials</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.limitations}>
                    <AlertCircle size={16} color={theme.colors.accent.yellow} />
                    <Text style={styles.limitationText}>
                      Maximum file size: 10MB • Text-based PDFs work best
                    </Text>
                  </View>
                </View>
              ) : (
                // File Preview
                <View style={styles.previewSection}>
                  <View style={styles.filePreview}>
                    <LinearGradient
                      colors={[theme.colors.accent.blue + '20', theme.colors.accent.cyan + '10']}
                      style={styles.filePreviewGradient}
                    >
                      <View style={styles.fileIcon}>
                        <File size={40} color={theme.colors.accent.blue} />
                      </View>
                      
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
                        <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                        <Text style={styles.fileType}>PDF Document</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.changeFileButton} 
                        onPress={() => setSelectedFile(null)}
                      >
                        <X size={20} color={theme.colors.text.secondary} />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {!isProcessing && (
                    <View style={styles.processSection}>
                      <Text style={styles.processTitle}>Ready to Process</Text>
                      <Text style={styles.processDescription}>
                        AI will extract text, identify subjects, and structure the content for learning
                      </Text>
                      
                      <TouchableOpacity style={styles.processButton} onPress={processPDF}>
                        <LinearGradient
                          colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                          style={styles.processButtonGradient}
                        >
                          <Zap size={20} color={theme.colors.text.primary} />
                          <Text style={styles.processButtonText}>Process PDF</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
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
            <Text style={styles.processingTitle}>Processing PDF</Text>
            <Text style={styles.processingStep}>{processingStep}</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>
            </View>

            <Animated.View style={successStyle}>
              {processingStep.includes('success') && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={24} color={theme.colors.accent.green} />
                  <Text style={styles.successText}>PDF Processed!</Text>
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
  uploadSection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  mascotContainer: {
    marginBottom: theme.spacing.xl,
  },
  uploadArea: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  uploadAreaGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent.blue + '30',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: theme.spacing.lg,
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  uploadButton: {
    borderRadius: theme.borderRadius.lg,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
  supportedFormats: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  supportedTitle: {
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
  limitations: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accent.yellow + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  limitationText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  previewSection: {
    padding: theme.spacing.xl,
  },
  filePreview: {
    marginBottom: theme.spacing.xl,
  },
  filePreviewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  fileIcon: {
    marginRight: theme.spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.tertiary,
  },
  fileType: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.accent.blue,
  },
  changeFileButton: {
    padding: theme.spacing.xs,
  },
  processSection: {
    alignItems: 'center',
  },
  processTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  processDescription: {
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  processButton: {
    borderRadius: theme.borderRadius.lg,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  processButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
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
  progressContainer: {
    width: 200,
    marginBottom: theme.spacing.lg,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.blue,
    borderRadius: 3,
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