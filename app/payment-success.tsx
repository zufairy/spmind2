import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { 
  CheckCircle,
  Crown,
  Home,
  Star
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const plan = params.plan as string;
  const price = params.price as string;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    title: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    subtitle: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    planTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    featureText: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      <View style={styles.content}>
        {/* Success Animation */}
        <Animated.View 
          style={[
            styles.successContainer,
            {
              transform: [{
                scale: successAnim
              }]
            }
          ]}
        >
          <Animatable.View 
            animation="bounceIn" 
            delay={500}
            style={styles.successIcon}
          >
            <CheckCircle size={80} color="#00FF00" />
          </Animatable.View>
        </Animated.View>

        {/* Success Message */}
        <Animatable.View animation="fadeInUp" delay={700} style={styles.messageSection}>
          <Text style={[styles.title, dynamicStyles.title]}>Payment Successful!</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            Your subscription has been activated
          </Text>
        </Animatable.View>

        {/* Plan Details */}
        <Animatable.View animation="fadeInUp" delay={900} style={styles.planSection}>
          <View style={styles.planCard}>
            <LinearGradient
              colors={['#00FF00', '#32CD32', '#00CC00']}
              style={styles.planGradient}
            >
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <View style={styles.planIconContainer}>
                    <Crown size={24} color="#000000" />
                  </View>
                  <View>
                    <Text style={[styles.planTitle, dynamicStyles.planTitle]}>
                      {plan}
                    </Text>
                    <Text style={styles.planDescription}>
                      Activated Successfully
                    </Text>
                  </View>
                </View>
                <View style={styles.planPriceContainer}>
                  <Text style={styles.planPrice}>{price}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animatable.View>

        {/* Features */}
        <Animatable.View animation="fadeInUp" delay={1100} style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, dynamicStyles.title]}>What's Included:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Star size={20} color="#00FF00" />
              <Text style={[styles.featureText, dynamicStyles.featureText]}>
                Unlimited AI tutoring
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Star size={20} color="#00FF00" />
              <Text style={[styles.featureText, dynamicStyles.featureText]}>
                24/7 homework help
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Star size={20} color="#00FF00" />
              <Text style={[styles.featureText, dynamicStyles.featureText]}>
                Step-by-step solutions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Star size={20} color="#00FF00" />
              <Text style={[styles.featureText, dynamicStyles.featureText]}>
                Progress tracking
              </Text>
            </View>
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <Animatable.View animation="fadeInUp" delay={1300} style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <LinearGradient
              colors={['#00FF00', '#32CD32', '#00CC00']}
              style={styles.primaryButtonGradient}
            >
              <Home size={20} color="#000000" />
              <Text style={styles.primaryButtonText}>Go to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={[styles.secondaryButtonText, dynamicStyles.subtitle]}>
              View Profile
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
  },
  planSection: {
    width: '100%',
    marginBottom: 40,
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
  featuresSection: {
    width: '100%',
    marginBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  actionSection: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  secondaryButton: {
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
});
