import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
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
  Camera, 
  Image as ImageIcon, 
  Zap, 
  CheckCircle, 
  RotateCcw,
  Flash,
  FlashOff,
  ScanLine,
  FileText
} from 'lucide-react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';
import { SupabaseService } from '@/utils/supabaseService';
import MascotAvatar from './MascotAvatar';

const { width, height } = Dimensions.get('window');

interface CameraScanModalProps {
  visible: boolean;
  onClose: () => void;
  onTextExtracted: (text: string, analysis: any) => void;
}

export default function CameraScanModal({ visible, onClose, onTextExtracted }: CameraScanModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const cameraRef = useRef<CameraView>(null);

  // Animation values
  const scanLineY = useSharedValue(0);
  const processingOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      startScanAnimation();
    }
  }, [visible]);

  const startScanAnimation = () => {
    scanLineY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  };

  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      return result.granted;
    }
    return true;
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Camera Permission', 'Camera access is required to scan documents');
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo) {
        setCapturedImage(photo.uri);
        await processImage(photo.base64!, 'image/jpeg');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedImage(asset.uri);
        await processImage(asset.base64!, asset.type || 'image/jpeg');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const processImage = async (base64Data: string, imageType: string) => {
    try {
      setIsProcessing(true);
      processingOpacity.value = withTiming(1, { duration: 300 });

      setProcessingStep('Analyzing image...');
      
      // Call our OCR processing function
      const response = await SupabaseService.callEdgeFunction('process-image-ocr', {
        imageData: `data:${imageType};base64,${base64Data}`,
        imageType
      });

      if (!response.success) {
        throw new Error(response.error || 'OCR processing failed');
      }

      setProcessingStep('Text extracted successfully!');
      successScale.value = withSpring(1, { damping: 15, stiffness: 100 });

      // Wait a moment to show success, then return results
      setTimeout(() => {
        onTextExtracted(response.extractedText, response.contentAnalysis);
        handleClose();
      }, 1500);

    } catch (error) {
      console.error('OCR Error:', error);
      setIsProcessing(false);
      processingOpacity.value = withTiming(0);
      Alert.alert(
        'Processing Failed', 
        error.message || 'Failed to extract text from image. Please ensure the image has clear, readable text.',
        [{ text: 'Try Again', onPress: () => setCapturedImage(null) }]
      );
    }
  };

  const handleClose = () => {
    setCapturedImage(null);
    setIsProcessing(false);
    processingOpacity.value = 0;
    successScale.value = 0;
    scanLineY.value = 0;
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash(!flash);
  };

  // Animation styles
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value * (height * 0.6 - 100) }],
  }));

  const processingStyle = useAnimatedStyle(() => ({
    opacity: processingOpacity.value,
  }));

  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        {!capturedImage && (
          <>
            {/* Camera View */}
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              flash={flash ? 'on' : 'off'}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
                  <View style={styles.headerButtonBackground}>
                    <X size={24} color={theme.colors.text.primary} />
                  </View>
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>Scan Document</Text>
                
                <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
                  <View style={styles.headerButtonBackground}>
                    {flash ? (
                      <Flash size={24} color={theme.colors.accent.yellow} />
                    ) : (
                      <FlashOff size={24} color={theme.colors.text.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Scanning Overlay */}
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={styles.scanCorners}>
                    <View style={[styles.corner, styles.topLeft]} />
                    <View style={[styles.corner, styles.topRight]} />
                    <View style={[styles.corner, styles.bottomLeft]} />
                    <View style={[styles.corner, styles.bottomRight]} />
                  </View>
                  
                  <Animated.View style={[styles.scanLine, scanLineStyle]}>
                    <LinearGradient
                      colors={[
                        'transparent',
                        theme.colors.accent.cyan + '80',
                        theme.colors.accent.blue + '60',
                        theme.colors.accent.cyan + '80',
                        'transparent'
                      ]}
                      style={styles.scanLineGradient}
                    />
                  </Animated.View>
                </View>
                
                <Text style={styles.scanInstructions}>
                  Position document within the frame
                </Text>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                <TouchableOpacity style={styles.galleryButton} onPress={pickImageFromGallery}>
                  <LinearGradient
                    colors={[theme.colors.background.card, theme.colors.background.secondary]}
                    style={styles.controlButton}
                  >
                    <ImageIcon size={24} color={theme.colors.text.primary} />
                  </LinearGradient>
                  <Text style={styles.controlButtonText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                  <LinearGradient
                    colors={[theme.colors.accent.blue, theme.colors.accent.cyan]}
                    style={styles.captureButtonGradient}
                  >
                    <Camera size={32} color={theme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <LinearGradient
                    colors={[theme.colors.background.card, theme.colors.background.secondary]}
                    style={styles.controlButton}
                  >
                    <RotateCcw size={24} color={theme.colors.text.primary} />
                  </LinearGradient>
                  <Text style={styles.controlButtonText}>Flip</Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </>
        )}

        {/* Image Preview & Processing */}
        {capturedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            
            {!isProcessing && (
              <View style={styles.previewControls}>
                <TouchableOpacity style={styles.retakeButton} onPress={() => setCapturedImage(null)}>
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.processButton} 
                  onPress={() => {
                    // Process the captured image
                    FileSystem.readAsStringAsync(capturedImage, { encoding: 'base64' })
                      .then(base64 => processImage(base64, 'image/jpeg'));
                  }}
                >
                  <LinearGradient
                    colors={[theme.colors.accent.green, theme.colors.accent.cyan]}
                    style={styles.processButtonGradient}
                  >
                    <Text style={styles.processButtonText}>Extract Text</Text>
                    <Zap size={20} color={theme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Processing Overlay */}
        <Animated.View style={[styles.processingOverlay, processingStyle]}>
          <LinearGradient
            colors={[theme.colors.background.primary + 'CC', theme.colors.background.secondary + 'CC']}
            style={styles.processingContainer}
          >
            <MascotAvatar mood="thinking" size={60} />
            <Text style={styles.processingTitle}>AI Processing</Text>
            <Text style={styles.processingStep}>{processingStep}</Text>
            
            <Animated.View style={successStyle}>
              {processingStep.includes('success') && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={24} color={theme.colors.accent.green} />
                  <Text style={styles.successText}>Text Extracted!</Text>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerButton: {
    borderRadius: theme.borderRadius.full,
  },
  headerButtonBackground: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary + '80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.heading,
    color: theme.colors.text.primary,
    textAlign: 'center',
    backgroundColor: theme.colors.background.primary + '80',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  scanOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  scanFrame: {
    width: width - 80,
    height: (width - 80) * 1.2,
    position: 'relative',
  },
  scanCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: theme.colors.accent.cyan,
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 2,
  },
  scanInstructions: {
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary + '80',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
    paddingTop: theme.spacing.lg,
  },
  captureButton: {
    borderRadius: theme.borderRadius.full,
  },
  captureButtonGradient: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.button,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.tertiary,
  },
  galleryButton: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  flipButton: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  controlButtonText: {
    fontSize: 12,
    fontFamily: theme.fonts.caption,
    color: theme.colors.text.secondary,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
  },
  retakeButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.primary,
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: theme.fonts.subheading,
    color: theme.colors.text.secondary,
  },
  processButton: {
    borderRadius: theme.borderRadius.lg,
  },
  processButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
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
  },
  successIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
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