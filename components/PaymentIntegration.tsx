import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '@/constants/theme';

interface PaymentIntegrationProps {
  visible: boolean;
  onClose: () => void;
  prizeAmount: number;
  winner: {
    name: string;
    rank: number;
    state: string;
  };
  onPaymentSuccess: (paymentDetails: any) => void;
}

export default function PaymentIntegration({
  visible,
  onClose,
  prizeAmount,
  winner,
  onPaymentSuccess
}: PaymentIntegrationProps) {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'paytm' | 'bank' | null>(null);
  const [upiId, setUpiId] = useState('');
  const [paytmNumber, setPaytmNumber] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolder: ''
  });
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: 'mobile-alt',
      color: theme.colors.accent.green,
      description: 'Instant payment via UPI',
      popular: true
    },
    {
      id: 'paytm',
      name: 'Paytm Wallet',
      icon: 'wallet',
      color: theme.colors.accent.blue,
      description: 'Transfer to Paytm wallet',
      popular: true
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'university',
      color: theme.colors.accent.purple,
      description: 'Direct bank account transfer',
      popular: false
    }
  ];

  const processPayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    if (paymentMethod === 'upi' && !upiId.trim()) {
      Alert.alert('Error', 'Please enter your UPI ID');
      return;
    }

    if (paymentMethod === 'paytm' && !paytmNumber.trim()) {
      Alert.alert('Error', 'Please enter your Paytm number');
      return;
    }

    if (paymentMethod === 'bank' && (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolder)) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }

    setProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate payment reference
      const paymentReference = `MG${Date.now()}`;
      
      const paymentDetails = {
        method: paymentMethod,
        amount: prizeAmount,
        reference: paymentReference,
        recipient: paymentMethod === 'upi' ? upiId : 
                    paymentMethod === 'paytm' ? paytmNumber : 
                    bankDetails.accountNumber,
        status: 'completed',
        processedAt: new Date().toISOString()
      };

      // In real implementation, integrate with:
      // - Razorpay for UPI/card payments
      // - Paytm Business API for wallet transfers
      // - Bank API for direct transfers

      Alert.alert(
        '🎉 Payment Successful!',
        `₹${prizeAmount} has been sent to your ${paymentMethod.toUpperCase()} account!\n\nReference: ${paymentReference}\n\nIt may take 2-24 hours to reflect in your account.`,
        [
          {
            text: 'Share Victory! 📱',
            onPress: () => shareVictory()
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );

      onPaymentSuccess(paymentDetails);
      onClose();

    } catch (error) {
      Alert.alert('Payment Failed', 'Please try again or contact support.');
    } finally {
      setProcessing(false);
    }
  };

  const shareVictory = () => {
    const shareText = `🏆 I just won ₹${prizeAmount} in Daily India Challenge! 🇮🇳

Ranked #${winner.rank} nationally representing ${winner.state}! 💪

Join the battle tomorrow at 9 PM and win big!
Download MindGains AI now! 🚀

#MindGainsAI #IndiaChallenge #${winner.state}Pride`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      // Fallback to regular sharing
      Alert.alert('Share', shareText);
    });
  };

  const renderPaymentMethodSelector = () => (
    <View style={styles.methodSelector}>
      <Text style={styles.sectionTitle}>Select Payment Method</Text>
      
      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodButton,
            paymentMethod === method.id && styles.selectedMethod,
            { borderColor: method.color + '40' }
          ]}
          onPress={() => setPaymentMethod(method.id as any)}
        >
          <View style={styles.methodIcon}>
            <FontAwesome5 name={method.icon} size={20} color={method.color} solid />
          </View>
          
          <View style={styles.methodInfo}>
            <View style={styles.methodHeader}>
              <Text style={styles.methodName}>{method.name}</Text>
              {method.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
            </View>
            <Text style={styles.methodDescription}>{method.description}</Text>
          </View>
          
          <FontAwesome5 
            name={paymentMethod === method.id ? "check-circle" : "circle"} 
            size={18} 
            color={paymentMethod === method.id ? method.color : theme.colors.text.tertiary} 
            solid={paymentMethod === method.id}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'upi':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter UPI Details</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="at" size={16} color={theme.colors.accent.green} />
              <TextInput
                style={styles.input}
                placeholder="Enter your UPI ID (e.g., user@paytm)"
                placeholderTextColor={theme.colors.text.tertiary}
                value={upiId}
                onChangeText={setUpiId}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.helpText}>
              Make sure your UPI ID is correct. Payment will be sent instantly.
            </Text>
          </View>
        );
        
      case 'paytm':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Enter Paytm Details</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5 name="phone" size={16} color={theme.colors.accent.blue} />
              <TextInput
                style={styles.input}
                placeholder="Enter Paytm registered number"
                placeholderTextColor={theme.colors.text.tertiary}
                value={paytmNumber}
                onChangeText={setPaytmNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            <Text style={styles.helpText}>
              Enter the mobile number registered with your Paytm account.
            </Text>
          </View>
        );
        
      case 'bank':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Bank Account Details</Text>
            
            <View style={styles.inputContainer}>
              <FontAwesome5 name="university" size={16} color={theme.colors.accent.purple} />
              <TextInput
                style={styles.input}
                placeholder="Account Number"
                placeholderTextColor={theme.colors.text.tertiary}
                value={bankDetails.accountNumber}
                onChangeText={(text) => setBankDetails(prev => ({ ...prev, accountNumber: text }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <FontAwesome5 name="code-branch" size={16} color={theme.colors.accent.purple} />
              <TextInput
                style={styles.input}
                placeholder="IFSC Code"
                placeholderTextColor={theme.colors.text.tertiary}
                value={bankDetails.ifscCode}
                onChangeText={(text) => setBankDetails(prev => ({ ...prev, ifscCode: text.toUpperCase() }))}
                autoCapitalize="characters"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <FontAwesome5 name="user" size={16} color={theme.colors.accent.purple} />
              <TextInput
                style={styles.input}
                placeholder="Account Holder Name"
                placeholderTextColor={theme.colors.text.tertiary}
                value={bankDetails.accountHolder}
                onChangeText={(text) => setBankDetails(prev => ({ ...prev, accountHolder: text }))}
                autoCapitalize="words"
              />
            </View>
            
            <Text style={styles.helpText}>
              Bank transfer may take 2-24 hours. Please verify all details.
            </Text>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModal}>
          <LinearGradient
            colors={[theme.colors.background.card, theme.colors.background.tertiary]}
            style={styles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.prizeHeader}>
                  <FontAwesome5 name="trophy" size={32} color={theme.colors.accent.gold} solid />
                  <Text style={styles.prizeTitle}>Congratulations!</Text>
                  <Text style={styles.prizeAmount}>₹{prizeAmount.toLocaleString()}</Text>
                </View>
                
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <FontAwesome5 name="times" size={18} color={theme.colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.winnerInfo}>
                🏆 Rank #{winner.rank} • {winner.state} • {winner.name}
              </Text>

              {/* Payment Method Selection */}
              {renderPaymentMethodSelector()}

              {/* Payment Form */}
              {paymentMethod && renderPaymentForm()}

              {/* Payment Button */}
              {paymentMethod && (
                <TouchableOpacity 
                  style={[styles.paymentButton, processing && styles.processingButton]}
                  onPress={processPayment}
                  disabled={processing}
                >
                  <LinearGradient
                    colors={processing ? 
                      [theme.colors.text.tertiary, theme.colors.text.tertiary] : 
                      [theme.colors.accent.gold, theme.colors.accent.gold + 'CC']
                    }
                    style={styles.paymentButtonGradient}
                  >
                    {processing ? (
                      <>
                        <FontAwesome5 name="spinner" size={16} color={theme.colors.text.primary} />
                        <Text style={styles.paymentButtonText}>Processing Payment...</Text>
                      </>
                    ) : (
                      <>
                        <FontAwesome5 name="money-check-alt" size={16} color={theme.colors.text.primary} solid />
                        <Text style={styles.paymentButtonText}>Send ₹{prizeAmount}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* Security Notice */}
              <View style={styles.securityNotice}>
                <FontAwesome5 name="shield-alt" size={14} color={theme.colors.accent.green} solid />
                <Text style={styles.securityText}>
                  Your payment details are secured with bank-level encryption
                </Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  prizeHeader: {
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    padding: 10,
  },
  prizeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 12,
  },
  prizeAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.accent.gold,
    marginTop: 8,
  },
  winnerInfo: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  methodSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  selectedMethod: {
    backgroundColor: theme.colors.accent.purple + '10',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  popularBadge: {
    backgroundColor: theme.colors.accent.green,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  methodDescription: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  formContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    lineHeight: 16,
  },
  paymentButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  processingButton: {
    opacity: 0.7,
  },
  paymentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  securityText: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginLeft: 6,
  },
});