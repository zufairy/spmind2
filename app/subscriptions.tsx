import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { 
  ArrowLeft, 
  Crown,
  Check,
  BookOpen,
  GraduationCap,
  Star,
  Zap,
  Shield,
  Clock
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const plans = [
    {
      id: 'basic',
      title: '1 Subject',
      price: 'RM38',
      period: '/month',
      description: 'Perfect for focused learning',
      icon: BookOpen,
      color: '#4ECDC4',
      popular: false,
      features: [
        '1 Subject Access',
        'Unlimited AI tutoring',
        'Basic homework help',
        'Email support'
      ]
    },
    {
      id: 'premium',
      title: '5 Subjects',
      price: 'RM98',
      period: '/month',
      description: 'Best value for all subjects',
      icon: GraduationCap,
      color: '#00FF00',
      popular: true,
      features: [
        'All 5 Subjects Access',
        'Unlimited AI tutoring',
        '24/7 homework help',
        'Step-by-step solutions',
        'Progress tracking',
        'Priority support'
      ]
    }
  ];

  const handlePlanSelect = (plan: any) => {
    router.push({
      pathname: '/payment',
      params: {
        plan: plan.title,
        price: plan.price,
        planType: plan.id
      }
    });
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
    sectionTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    planCard: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    planTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    planDescription: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    planPrice: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    featureText: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    benefitText: {
      color: isDark ? '#CCCCCC' : '#666666',
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
              <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Subscriptions</Text>
              <View style={{ width: 40 }} />
            </View>
          </View>
        </View>

        {/* Hero Section */}
        <Animatable.View animation="fadeInUp" delay={200} style={styles.heroSection}>
          <Text style={[styles.heroTitle, dynamicStyles.headerTitle]}>Choose Your Plan</Text>
          <Text style={[styles.heroSubtitle, dynamicStyles.planDescription]}>
            Unlock the full potential of AI-powered learning with Genius Plus
          </Text>
        </Animatable.View>

        {/* Plans */}
        <Animatable.View animation="fadeInUp" delay={300} style={styles.plansSection}>
          {plans.map((plan, index) => (
            <Animatable.View 
              key={plan.id} 
              animation="fadeInUp" 
              delay={400 + index * 100}
              style={styles.planContainer}
            >
              <TouchableOpacity
                style={[
                  styles.planCard,
                  dynamicStyles.planCard,
                  plan.popular && styles.popularPlan
                ]}
                onPress={() => handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <View style={styles.planLeft}>
                    <View style={[styles.planIcon, { backgroundColor: `${plan.color}20` }]}>
                      <plan.icon size={24} color={plan.color} />
                    </View>
                    <View style={styles.planInfo}>
                      <Text style={[styles.planTitle, dynamicStyles.planTitle]}>{plan.title}</Text>
                      <Text style={[styles.planDescription, dynamicStyles.planDescription]}>
                        {plan.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.planPriceContainer}>
                    <Text style={[styles.planPrice, dynamicStyles.planPrice]}>{plan.price}</Text>
                    <Text style={[styles.planPeriod, dynamicStyles.planDescription]}>{plan.period}</Text>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.featureItem}>
                      <Check size={16} color="#00FF00" />
                      <Text style={[styles.featureText, dynamicStyles.featureText]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.planButton}>
                  <LinearGradient
                    colors={plan.popular ? ['#00FF00', '#32CD32'] : [plan.color, plan.color]}
                    style={styles.planButtonGradient}
                  >
                    <Text style={styles.planButtonText}>
                      Choose {plan.title}
                    </Text>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </Animatable.View>
          ))}
        </Animatable.View>

        {/* Benefits Section */}
        <Animatable.View animation="fadeInUp" delay={600} style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Why Choose Genius Plus?</Text>
          
          <View style={styles.benefitsGrid}>
            <Animatable.View animation="fadeInLeft" delay={700} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Zap size={24} color="#00FF00" />
              </View>
              <Text style={[styles.benefitTitle, dynamicStyles.planTitle]}>Instant Help</Text>
              <Text style={[styles.benefitText, dynamicStyles.benefitText]}>
                Get immediate answers to your questions 24/7
              </Text>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" delay={800} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Shield size={24} color="#00FF00" />
              </View>
              <Text style={[styles.benefitTitle, dynamicStyles.planTitle]}>Secure & Private</Text>
              <Text style={[styles.benefitText, dynamicStyles.benefitText]}>
                Your data is protected with enterprise-grade security
              </Text>
            </Animatable.View>

            <Animatable.View animation="fadeInLeft" delay={900} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Clock size={24} color="#00FF00" />
              </View>
              <Text style={[styles.benefitTitle, dynamicStyles.planTitle]}>Save Time</Text>
              <Text style={[styles.benefitText, dynamicStyles.benefitText]}>
                Complete homework faster with AI assistance
              </Text>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" delay={1000} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Star size={24} color="#00FF00" />
              </View>
              <Text style={[styles.benefitTitle, dynamicStyles.planTitle]}>Better Grades</Text>
              <Text style={[styles.benefitText, dynamicStyles.benefitText]}>
                Improve your understanding and academic performance
              </Text>
            </Animatable.View>
          </View>
        </Animatable.View>

        {/* FAQ Section */}
        <Animatable.View animation="fadeInUp" delay={1100} style={styles.faqSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItems}>
            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, dynamicStyles.planTitle]}>
                Can I cancel anytime?
              </Text>
              <Text style={[styles.faqAnswer, dynamicStyles.benefitText]}>
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, dynamicStyles.planTitle]}>
                What payment methods do you accept?
              </Text>
              <Text style={[styles.faqAnswer, dynamicStyles.benefitText]}>
                We accept all major credit cards, FPX online banking, and digital wallets through our secure payment partner.
              </Text>
            </View>

            <View style={styles.faqItem}>
              <Text style={[styles.faqQuestion, dynamicStyles.planTitle]}>
                Is there a free trial?
              </Text>
              <Text style={[styles.faqAnswer, dynamicStyles.benefitText]}>
                Yes! New users get a 7-day free trial to experience all features before committing to a plan.
              </Text>
            </View>
          </View>
        </Animatable.View>
      </ScrollView>
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
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  planContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  popularPlan: {
    borderColor: '#00FF00',
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#00FF00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#000000',
    letterSpacing: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  planPeriod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    flex: 1,
  },
  planButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  planButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  planButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  benefitsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsGrid: {
    gap: 16,
  },
  benefitItem: {
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  faqItems: {
    gap: 16,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    lineHeight: 20,
  },
});
