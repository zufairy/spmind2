import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Animated,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Check,
  Shield,
  Lock,
  Clock,
  Crown,
  BookOpen,
  GraduationCap,
  CreditCard
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'fpx' | 'card' | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [showPaymentIframe, setShowPaymentIframe] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');
  
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

  const plan = params.plan as string;
  const price = params.price as string;
  const planType = params.planType as string;

  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const banks = [
    { code: 'MB2U0227', name: 'Maybank2u', logo: '🏦' },
    { code: 'BCBB0235', name: 'CIMB Clicks', logo: '🏦' },
    { code: 'PBB0233', name: 'Public Bank', logo: '🏦' },
    { code: 'RHB0218', name: 'RHB Now', logo: '🏦' },
    { code: 'HLB0224', name: 'HLB Connect', logo: '🏦' },
    { code: 'UOB0226', name: 'UOB Internet Banking', logo: '🏦' },
  ];

  const cardBrands = [
    { code: 'BP-BILLPLZ1', name: 'Visa / Mastercard', logo: '💳' },
    { code: 'BP-PPL01', name: 'PayPal', logo: '💳' },
    { code: 'BP-2C2P1', name: 'e-pay', logo: '💳' },
  ];

  const createBillplzBill = async () => {
    try {
      setLoading(true);
      
      // Billplz API credentials
      const apiKey = '8f8ea0fe-5fba-4f26-a246-988be0c9d891';
      const collectionId = 'mgef2q7b';
      
      const billData = {
        collection_id: collectionId,
        email: 'user@genius.com', // Default email
        mobile: '60123456789', // Default mobile
        name: 'Genius User', // Default name
        amount: parseInt(price.replace('RM', '')) * 100, // Convert to cents
        description: `Genius Plus - ${plan}`,
        callback_url: 'https://genius-app.com/callback', // Your callback URL
        redirect_url: 'https://genius-app.com/success', // Your redirect URL
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        // Add payment method if selected
        ...(paymentMethod === 'fpx' && selectedBank && { bank_code: selectedBank }),
      };

      const response = await fetch('https://www.billplz.com/api/v3/bills', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      const result = await response.json();

      if (result.id) {
        // Set payment URL and show iframe
        const billUrl = `https://www.billplz.com/bills/${result.id}`;
        setPaymentUrl(billUrl);
        setShowPaymentIframe(true);
      } else {
        throw new Error(result.error?.message || 'Failed to create bill');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      Alert.alert('Payment Method', 'Please select a payment method.');
      return;
    }

    if (paymentMethod === 'fpx' && !selectedBank) {
      Alert.alert('Bank Selection', 'Please select a bank for FPX payment.');
      return;
    }

    createBillplzBill();
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    headerTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    backButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    planCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    planTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    planPrice: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    sectionTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    paymentMethodCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    paymentMethodTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    bankCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    bankName: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            source={require('../assets/images/bg.jpg')}
            style={styles.headerBackground}
            resizeMode="cover"
          />
          <BlurView intensity={10} style={styles.headerBlurOverlay} />
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={[styles.backButton, dynamicStyles.backButton]}
                onPress={() => router.back()}
              >
                <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Payment</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
        </View>

        {/* Plan Summary */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.planSection}>
          <View style={[styles.planCard, dynamicStyles.planCard]}>
            <LinearGradient
              colors={['#00FF00', '#32CD32', '#00CC00']}
              style={styles.planGradient}
            >
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <View style={styles.planIconContainer}>
                    {planType === 'basic' ? (
                      <BookOpen size={24} color="#000000" />
                    ) : (
                      <GraduationCap size={24} color="#000000" />
                    )}
                  </View>
                  <View>
                    <Text style={[styles.planTitle, dynamicStyles.planTitle]}>
                      {plan}
                    </Text>
                    <Text style={styles.planDescription}>
                      {planType === 'basic' ? 'Perfect for focused learning' : 'Best value for all subjects'}
                    </Text>
                  </View>
                </View>
                <View style={styles.planPriceContainer}>
                  <Text style={[styles.planPrice, dynamicStyles.planPrice]}>{price}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animatable.View>

        {/* Payment Methods */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Payment Method</Text>
          
          {/* FPX Payment */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              dynamicStyles.paymentMethodCard,
              paymentMethod === 'fpx' && styles.selectedPaymentMethod
            ]}
            onPress={() => setPaymentMethod('fpx')}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={styles.paymentMethodLeft}>
                <View style={styles.paymentMethodIcon}>
                  <Text style={styles.paymentMethodEmoji}>🏦</Text>
                </View>
                <Text style={[styles.paymentMethodTitle, dynamicStyles.paymentMethodTitle]}>
                  FPX Online Banking
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                paymentMethod === 'fpx' && styles.radioButtonSelected
              ]}>
                {paymentMethod === 'fpx' && <Check size={16} color="#FFFFFF" />}
              </View>
            </View>
            <Text style={styles.paymentMethodDescription}>
              Pay securely with your online banking
            </Text>
          </TouchableOpacity>

          {/* Card Payment */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              dynamicStyles.paymentMethodCard,
              paymentMethod === 'card' && styles.selectedPaymentMethod
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentMethodHeader}>
              <View style={styles.paymentMethodLeft}>
                <View style={styles.paymentMethodIcon}>
                  <CreditCard size={24} color={isDark ? "#FFFFFF" : "#000000"} />
                </View>
                <Text style={[styles.paymentMethodTitle, dynamicStyles.paymentMethodTitle]}>
                  Credit/Debit Card
                </Text>
              </View>
              <View style={[
                styles.radioButton,
                paymentMethod === 'card' && styles.radioButtonSelected
              ]}>
                {paymentMethod === 'card' && <Check size={16} color="#FFFFFF" />}
              </View>
            </View>
            <Text style={styles.paymentMethodDescription}>
              Pay with Visa, Mastercard, or PayPal
            </Text>
          </TouchableOpacity>
        </Animatable.View>

        {/* Bank Selection (FPX) */}
        {paymentMethod === 'fpx' && (
          <Animatable.View animation="fadeInUp" delay={400} style={styles.bankSection}>
            <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Select Bank</Text>
            <View style={styles.bankGrid}>
              {banks.map((bank) => (
                <TouchableOpacity
                  key={bank.code}
                  style={[
                    styles.bankCard,
                    dynamicStyles.bankCard,
                    selectedBank === bank.code && styles.selectedBankCard
                  ]}
                  onPress={() => setSelectedBank(bank.code)}
                >
                  <Text style={styles.bankLogo}>{bank.logo}</Text>
                  <Text style={[styles.bankName, dynamicStyles.bankName]}>{bank.name}</Text>
                  {selectedBank === bank.code && (
                    <View style={styles.bankCheck}>
                      <Check size={16} color="#00FF00" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>
        )}

        {/* Security Features */}
        <Animatable.View animation="fadeInUp" delay={500} style={styles.securitySection}>
          <View style={styles.securityFeatures}>
            <View style={styles.securityFeature}>
              <Shield size={20} color="#00FF00" />
              <Text style={styles.securityText}>SSL Encrypted</Text>
            </View>
            <View style={styles.securityFeature}>
              <Lock size={20} color="#00FF00" />
              <Text style={styles.securityText}>Secure Payment</Text>
            </View>
            <View style={styles.securityFeature}>
              <Clock size={20} color="#00FF00" />
              <Text style={styles.securityText}>Instant Activation</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Pay Button */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.paySection}>
          <TouchableOpacity
            style={styles.payButton}
            onPress={handlePayment}
            disabled={loading}
          >
            <LinearGradient
              colors={['#00FF00', '#32CD32', '#00CC00']}
              style={styles.payButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Crown size={20} color="#000000" />
                  <Text style={styles.payButtonText}>
                    Pay {price} - Activate {plan}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          
          <Text style={styles.payDisclaimer}>
            By proceeding, you agree to our Terms of Service and Privacy Policy.
            Your subscription will be activated immediately after payment confirmation.
          </Text>
        </Animatable.View>
      </ScrollView>

      {/* Billplz Payment Iframe Modal */}
      {showPaymentIframe && (
        <View style={styles.iframeModal}>
          <View style={styles.iframeHeader}>
            <Text style={[styles.iframeTitle, dynamicStyles.headerTitle]}>Make Payment</Text>
            <TouchableOpacity
              style={styles.iframeCloseButton}
              onPress={() => setShowPaymentIframe(false)}
            >
              <Text style={styles.iframeCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: paymentUrl }}
            style={styles.iframeWebView}
            onNavigationStateChange={(navState) => {
              // Handle successful payment redirect
              if (navState.url.includes('success') || navState.url.includes('callback')) {
                setShowPaymentIframe(false);
                router.push({
                  pathname: '/payment-success',
                  params: { plan, price }
                });
              }
            }}
            onError={(error) => {
              console.error('WebView error:', error);
              Alert.alert('Payment Error', 'Failed to load payment page. Please try again.');
              setShowPaymentIframe(false);
            }}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    height: 120,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  headerContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 20,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  planPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(0, 0, 0, 0.7)',
  },
  formSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentMethodCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedPaymentMethod: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentMethodEmoji: {
    fontSize: 20,
  },
  paymentMethodTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  paymentMethodDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#00FF00',
    borderColor: '#00FF00',
  },
  bankSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bankCard: {
    width: (screenWidth - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  selectedBankCard: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  bankLogo: {
    fontSize: 32,
    marginBottom: 8,
  },
  bankName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bankCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securitySection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  securityFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  securityFeature: {
    alignItems: 'center',
    gap: 8,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
  },
  paySection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  payButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  payButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  payDisclaimer: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 18,
  },
  iframeModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 1000,
  },
  iframeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  iframeTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  iframeCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iframeCloseText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  iframeWebView: {
    flex: 1,
  },
});
