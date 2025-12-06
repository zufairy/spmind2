import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';
import { ChevronRight, Check } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
  gradient: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Snap & Solve Homework',
    description: 'Take a photo of any homework question and get instant step-by-step solutions with AI-powered explanations.',
    image: require('../assets/images/onboarding1.png'),
    gradient: ['#667eea', '#764ba2'],
  },
  {
    id: '2',
    title: 'Daily Brain Boost',
    description: 'Get personalized 15-minute AI tutoring sessions every day. Learn, teach, and take quizzes to boost your understanding.',
    image: require('../assets/images/onboarding2.png'),
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: 'Track & Achieve Goals',
    description: 'Build learning streaks, take notes, and watch your progress grow. Aligned with Malaysian KSSR & KSSM syllabus.',
    image: require('../assets/images/onboarding3.png'),
    gradient: ['#4facfe', '#00f2fe'],
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      // Go to next slide
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Last slide - mark as seen and go to login
      await finishIntro();
    }
  };

  const handleSkip = async () => {
    await finishIntro();
  };

  const finishIntro = async () => {
    try {
      await AsyncStorage.setItem('hasSeenIntro', 'true');
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error saving intro status:', error);
      router.replace('/auth/login');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Skip Button */}
          {currentIndex < slides.length - 1 && (
            <Animatable.View animation="fadeIn" style={styles.skipContainer}>
              <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Image */}
            <Animatable.View
              animation="fadeInDown"
              duration={800}
              delay={200}
              style={styles.imageContainer}
            >
              <View style={styles.imageCircle}>
                <Image source={item.image} style={styles.image} resizeMode="contain" />
              </View>
            </Animatable.View>

            {/* Text Content */}
            <Animatable.View
              animation="fadeInUp"
              duration={800}
              delay={400}
              style={styles.textContainer}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Animatable.View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Pagination Dots */}
            <View style={styles.pagination}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === currentIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            {/* Next/Get Started Button */}
            <Animatable.View animation="fadeInUp" duration={800} delay={600}>
              <TouchableOpacity
                onPress={handleNext}
                style={styles.nextButton}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>
                  {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                </Text>
                {currentIndex === slides.length - 1 ? (
                  <Check size={24} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <ChevronRight size={24} color="#FFFFFF" strokeWidth={3} />
                )}
              </TouchableOpacity>
            </Animatable.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  slide: {
    width,
    height,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  imageContainer: {
    marginBottom: 60,
  },
  imageCircle: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
  },
  image: {
    width: 260,
    height: 260,
    borderRadius: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 340,
    paddingHorizontal: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    paddingBottom: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeDot: {
    width: 30,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    gap: 8,
    minWidth: 200,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

