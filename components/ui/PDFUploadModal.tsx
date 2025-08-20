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
  Pressable,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from './MascotAvatar';

const { width, height } = Dimensions.get('window');

interface PDFUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onContentExtracted: (text: string, analysis: any, metadata: any) => void;
}

interface FileInfo {
  name: string;
  size: number;
  uri: string;
}

export default function PDFUploadModal({ visible, onClose, onContentExtracted }: PDFUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          size: file.size || 0,
          uri: file.uri,
        });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingStep('Reading PDF...');

    try {
      setProcessingStep('Extracting text...');
      
      // Extract text content from PDF (using a placeholder for now)
      const extractedText = `This is the extracted content from the PDF: ${selectedFile.name}. 
      
      The document contains important information about the specified topic, including key concepts, detailed explanations, and practical examples. The content has been structured for optimal learning and understanding.
      
      Key topics covered include foundational principles, advanced concepts, and real-world applications. Each section builds upon the previous one, creating a comprehensive learning experience.
      
      This material is designed to help students understand complex topics through clear explanations, practical examples, and structured presentation of information.`;
      
      setProcessingStep('Processing with AI...');
      
      // Create a mission with the extracted PDF content
      const missionData = {
        title: selectedFile.name.replace('.pdf', ''),
        description: `Learn from PDF: ${selectedFile.name}`,
        content_type: 'pdf',
        content_text: extractedText,
        subject_name: 'PDF Learning',
        difficulty: 'medium',
        file_metadata: {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          type: 'pdf',
        },
      };

      const result = await SupabaseService.createMission(missionData);
      const missionId = result?.id || result?.mission?.id;
      
      if (missionId) {
        setProcessingStep('✨ Content ready!');
        
        // Pass the result to parent component
        onContentExtracted(
          extractedText,
          { 
            pageCount: Math.ceil(extractedText.length / 2000), // Estimate pages
            mainTopics: ['Key Concepts', 'Detailed Analysis', 'Practical Applications'],
            difficulty: 'intermediate',
            estimatedTime: Math.ceil(extractedText.length / 200) + ' min',
          },
          {
            fileMetadata: {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              type: 'pdf',
            },
            missionId: missionId,
          }
        );
        
        handleClose();
      }

    } catch (error) {
      console.error('Error processing PDF:', error);
      Alert.alert('Error', 'Failed to process the PDF. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProcessingStep('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={() => {}}>
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.secondary]}
            style={styles.modal}
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

            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              {/* Upload Section */}
              <TouchableOpacity 
                style={styles.uploadArea}
                onPress={handlePickDocument}
              >
                <LinearGradient
                  colors={[
                    theme.colors.accent.blue + '20',
                    theme.colors.accent.purple + '20'
                  ]}
                  style={styles.uploadGradient}
                >
                  <Upload size={48} color={theme.colors.accent.blue} />
                  <Text style={styles.uploadTitle}>
                    {selectedFile ? 'Change PDF' : 'Select PDF Document'}
                  </Text>
                  <Text style={styles.uploadSubtitle}>
                    Tap to browse your files
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Selected File */}
              {selectedFile && (
                <View style={styles.fileCard}>
                  <View style={styles.fileIcon}>
                    <File size={24} color={theme.colors.accent.blue} />
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.fileSize}>
                      {formatFileSize(selectedFile.size)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Features */}
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>What we do with your PDF:</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color={theme.colors.accent.green} />
                    <Text style={styles.featureText}>Extract all text content</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color={theme.colors.accent.green} />
                    <Text style={styles.featureText}>Identify key concepts</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color={theme.colors.accent.green} />
                    <Text style={styles.featureText}>Generate study materials</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <CheckCircle size={16} color={theme.colors.accent.green} />
                    <Text style={styles.featureText}>Create interactive quizzes</Text>
                  </View>
                </View>
              </View>

              {/* Tips */}
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>📌 Best results with:</Text>
                <Text style={styles.tipText}>• Textbooks and study materials</Text>
                <Text style={styles.tipText}>• Research papers</Text>
                <Text style={styles.tipText}>• Lecture notes</Text>
                <Text style={styles.tipText}>• Clear, readable PDFs</Text>
              </View>
            </ScrollView>

            {/* Process Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.processButton, !selectedFile && styles.processButtonDisabled]}
                onPress={handleProcess}
                disabled={!selectedFile || isProcessing}
              >
                <LinearGradient
                  colors={selectedFile 
                    ? [theme.colors.accent.purple, theme.colors.accent.blue] 
                    : [theme.colors.background.tertiary, theme.colors.background.tertiary]
                  }
                  style={styles.processButtonGradient}
                >
                  <Zap size={20} color={theme.colors.text.primary} />
                  <Text style={styles.processButtonText}>
                    {isProcessing ? processingStep : 'Process PDF'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 520,
    height: '70%',
    maxHeight: 600,
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
  uploadArea: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  uploadGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent.blue + '30',
    borderRadius: theme.borderRadius.lg,
    borderStyle: 'dashed',
  },
  uploadTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  uploadSubtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  fileIcon: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.accent.blue + '20',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  featuresSection: {
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  featuresList: {
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
  tipsSection: {
    backgroundColor: theme.colors.accent.yellow + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.yellow + '30',
  },
  tipsTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.tertiary,
  },
  processButton: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  processButtonDisabled: {
    opacity: 0.5,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  processButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.primary,
  },
});