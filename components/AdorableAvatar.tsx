import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAvatarStore, EmotionType, InteractionType } from '../stores/avatarStore';

// Optional gesture handler import with fallback
let PanGestureHandler: any = null;
let useAnimatedGestureHandler: any = null;

try {
  const gestureHandler = require('react-native-gesture-handler');
  PanGestureHandler = gestureHandler.PanGestureHandler;
  useAnimatedGestureHandler = gestureHandler.useAnimatedGestureHandler;
} catch (error) {
  console.log('Gesture handler not available, using basic touch interactions');
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdorableAvatarProps {
  size?: number;
  onInteraction?: (interaction: InteractionType) => void;
  enableDrag?: boolean;
  enableTouch?: boolean;
}

export default function AdorableAvatar({
  size = 200,
  onInteraction,
  enableDrag = true,
  enableTouch = true,
}: AdorableAvatarProps) {
  const {
    currentEmotion,
    emotionIntensity,
    isAnimating,
    personality,
    eyePosition,
    hairColor,
    eyeColor,
    skinTone,
    accessories,
    handleInteraction,
    updateEyePosition,
  } = useAvatarStore();

  // Animation values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const eyeScale = useSharedValue(1);
  const mouthScale = useSharedValue(1);
  const eyebrowY = useSharedValue(0);
  const hairRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const tearOpacity = useSharedValue(0);
  const bodyBounce = useSharedValue(0);
  const hairBounce = useSharedValue(0);
  const headTilt = useSharedValue(0);
  const blushIntensity = useSharedValue(0);
  
  // New premium animation values
  const eyePositionX = useSharedValue(0);
  const faceDirection = useSharedValue(0); // -1 to 1 for left/right facing
  const glowIntensity = useSharedValue(0.8);
  const floatAnimation = useSharedValue(0);
  const breathingScale = useSharedValue(1);

  // Touch tracking
  const [touchPosition, setTouchPosition] = useState({ x: 0, y: 0 });
  const [isBeingTouched, setIsBeingTouched] = useState(false);

  // Premium animations
  useEffect(() => {
    // Continuous floating animation
    floatAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(-1, { duration: 2000 })
      ),
      -1,
      true
    );

    // Breathing animation
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(0.98, { duration: 1500 })
      ),
      -1,
      true
    );

    // Subtle glow pulsing
    glowIntensity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000 }),
        withTiming(0.6, { duration: 3000 })
      ),
      -1,
      true
    );
  }, []);

  // Eye tracking based on touch position
  useEffect(() => {
    if (touchPosition.x !== 0 || touchPosition.y !== 0) {
      const normalizedX = (touchPosition.x - size / 2) / (size / 2);
      const normalizedY = (touchPosition.y - size / 2) / (size / 2);
      
      // Eye movement (limited range)
      eyePositionX.value = withSpring(Math.max(-0.3, Math.min(0.3, normalizedX * 0.3)), {
        damping: 15,
        stiffness: 100
      });
      
      // Face direction based on eye position
      faceDirection.value = withSpring(normalizedX * 0.1, {
        damping: 20,
        stiffness: 80
      });
    }
  }, [touchPosition]);




  // Emotion-based animations
  useEffect(() => {
    const intensity = emotionIntensity;
    
    switch (currentEmotion) {
      case 'happy':
        scale.value = withSpring(1 + intensity * 0.1, { damping: 15 });
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          true
        );
        sparkleOpacity.value = withTiming(0.8, { duration: 500 });
        break;
        
      case 'excited':
        scale.value = withSpring(1 + intensity * 0.15, { damping: 12 });
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 200 }),
            withTiming(0, { duration: 200 })
          ),
          -1,
          true
        );
        hairRotation.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 150 }),
            withTiming(-5, { duration: 150 })
          ),
          -1,
          true
        );
        sparkleOpacity.value = withTiming(1, { duration: 300 });
        break;
        
      case 'surprised':
        eyeScale.value = withSpring(1 + intensity * 0.3, { damping: 10 });
        eyebrowY.value = withSpring(-10, { damping: 15 });
        scale.value = withSpring(1 + intensity * 0.05, { damping: 20 });
        break;
        
      case 'sleepy':
        eyeScale.value = withSpring(0.3, { damping: 15 });
        eyebrowY.value = withSpring(5, { damping: 15 });
        scale.value = withSpring(0.95, { damping: 20 });
        break;
        
      case 'curious':
        headTilt.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 1000 }),
            withTiming(-5, { duration: 1000 })
          ),
          -1,
          true
        );
        eyebrowY.value = withSpring(-5, { damping: 15 });
        break;
        
      case 'shy':
        scale.value = withSpring(0.9, { damping: 20 });
        headTilt.value = withSpring(-10, { damping: 15 });
        break;
        
      case 'playful':
        rotation.value = withRepeat(
          withSequence(
            withTiming(5, { duration: 400 }),
            withTiming(-5, { duration: 400 })
          ),
          -1,
          true
        );
        bodyBounce.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 250 }),
            withTiming(0, { duration: 250 })
          ),
          -1,
          true
        );
        break;
        
      case 'confused':
        headTilt.value = withRepeat(
          withSequence(
            withTiming(10, { duration: 800 }),
            withTiming(-10, { duration: 800 })
          ),
          -1,
          true
        );
        eyebrowY.value = withSpring(8, { damping: 15 });
        break;
        
      case 'sad':
        scale.value = withSpring(0.9, { damping: 20 });
        eyebrowY.value = withSpring(8, { damping: 15 });
        tearOpacity.value = withTiming(0.8, { duration: 1000 });
        break;
        
      case 'love-struck':
        scale.value = withSpring(1 + intensity * 0.1, { damping: 15 });
        heartOpacity.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          true
        );
        sparkleOpacity.value = withTiming(0.9, { duration: 500 });
        break;
        
      default:
        scale.value = withSpring(1, { damping: 20 });
        bodyBounce.value = withTiming(0, { duration: 500 });
        hairRotation.value = withTiming(0, { duration: 500 });
        sparkleOpacity.value = withTiming(0, { duration: 500 });
        heartOpacity.value = withTiming(0, { duration: 500 });
        tearOpacity.value = withTiming(0, { duration: 500 });
        eyebrowY.value = withSpring(0, { damping: 15 });
        headTilt.value = withSpring(0, { damping: 15 });
        rotation.value = withSpring(0, { damping: 15 });
    }
  }, [currentEmotion, emotionIntensity]);

  // Idle animations
  useEffect(() => {
    const idleAnimation = () => {
      if (currentEmotion === 'neutral' || currentEmotion === 'thinking') {
        // Subtle breathing animation
        scale.value = withRepeat(
          withSequence(
            withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
        
        // Occasional head tilt
        setTimeout(() => {
          if (currentEmotion === 'neutral') {
            headTilt.value = withSequence(
              withTiming(3, { duration: 1000 }),
              withTiming(0, { duration: 1000 })
            );
          }
        }, Math.random() * 5000 + 3000);
      }
    };

    idleAnimation();
  }, [currentEmotion]);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      eyeScale.value = withSequence(
        withTiming(0.1, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );
    };

    const blinkInterval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Gesture handlers (with fallback)
  const panGestureHandler = useAnimatedGestureHandler ? useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (enableDrag) {
        translateX.value = context.startX + event.translationX;
        translateY.value = context.startY + event.translationY;
      }
    },
    onEnd: () => {
      if (enableDrag) {
        // Snap back to center with spring
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    },
  }) : null;

  const handleTouch = (event: any) => {
    if (!enableTouch) return;
    
    const { locationX, locationY } = event.nativeEvent;
    const touchPos = { x: locationX, y: locationY };
    
    setTouchPosition(touchPos);
    setIsBeingTouched(true);
    updateEyePosition(touchPos);
    
    // Determine interaction type based on touch position
    let interaction: InteractionType = 'tap';
    const centerX = size / 2;
    const centerY = size / 2;
    
    if (locationY < centerY * 0.7) {
      interaction = 'pet';
    } else if (locationY > centerY * 1.3) {
      interaction = 'tickle';
    }
    
    handleInteraction(interaction, touchPos);
    onInteraction?.(interaction);
    
    // Visual feedback
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
    
    setTimeout(() => setIsBeingTouched(false), 500);
  };

  // Animated styles
  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + floatAnimation.value * 5 },
      { scale: scale.value * breathingScale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const headStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${headTilt.value + faceDirection.value * 5}deg` },
      { scaleY: 1 + bodyBounce.value * 0.1 },
    ],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: eyeScale.value },
      { translateX: eyePositionX.value * 8 },
    ],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mouthScale.value }],
  }));

  const hairStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${hairRotation.value}deg` },
      { scaleY: 1 + hairBounce.value * 0.2 },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
  }));

  const tearStyle = useAnimatedStyle(() => ({
    opacity: tearOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const AvatarWrapper = PanGestureHandler && panGestureHandler ? PanGestureHandler : View;
  const wrapperProps = PanGestureHandler && panGestureHandler ? {
    onGestureEvent: panGestureHandler,
    enabled: enableDrag
  } : {};

  return (
    <AvatarWrapper {...wrapperProps}>
      <Animated.View style={[styles.container, { width: size, height: size }]}>
        <TouchableOpacity
          onPress={handleTouch}
          activeOpacity={0.8}
          style={styles.touchArea}
        >
          <Animated.View style={[styles.avatar, avatarStyle]}>
            {/* Premium Glow Effect */}
            <Animated.View style={[styles.glowEffect, glowStyle]} />
            
            {/* Main Avatar Body - Perfect Circle */}
            <Animated.View style={[styles.head, headStyle]}>
              <LinearGradient
                colors={['#FFB6C1', '#E6E6FA', '#98FB98']} // Coral pink, lavender, mint green
                style={[styles.perfectCircle, { width: size, height: size }]}
              >
                {/* Eyes - Cuter and More Expressive */}
                <View style={styles.eyesContainer}>
                  <Animated.View style={[styles.cuteEye, eyeStyle]}>
                    <View style={[styles.eyePupil, { backgroundColor: '#000000' }]} />
                    <View style={styles.eyeHighlight} />
                  </Animated.View>
                  <Animated.View style={[styles.cuteEye, eyeStyle]}>
                    <View style={[styles.eyePupil, { backgroundColor: '#000000' }]} />
                    <View style={styles.eyeHighlight} />
                  </Animated.View>
                </View>

                {/* Mouth - More Expressive and Animated */}
                <Animated.View style={[styles.expressiveMouth, mouthStyle]}>
                  <View style={[
                    styles.mouthShape,
                    currentEmotion === 'happy' && styles.happyMouth,
                    currentEmotion === 'excited' && styles.excitedMouth,
                    currentEmotion === 'surprised' && styles.surprisedMouth,
                    currentEmotion === 'sleepy' && styles.sleepyMouth,
                    currentEmotion === 'sad' && styles.sadMouth,
                    currentEmotion === 'love-struck' && styles.loveMouth,
                  ]} />
                </Animated.View>
              </LinearGradient>
            </Animated.View>

            {/* Sparkles for Premium Feel */}
            <Animated.View style={[styles.sparklesContainer, sparkleStyle]}>
              {[...Array(8)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.premiumSparkle,
                    {
                      top: Math.random() * size,
                      left: Math.random() * size,
                      transform: [{ rotate: `${i * 45}deg` }],
                    },
                  ]}
                >
                  <View style={styles.sparkleInner} />
                </Animated.View>
              ))}
            </Animated.View>

            {/* Hearts for Love Emotions */}
            <Animated.View style={[styles.heartsContainer, heartStyle]}>
              {[...Array(3)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.premiumHeart,
                    {
                      top: size * 0.1 + i * 15,
                      left: size * 0.2 + i * 20,
                      transform: [{ rotate: `${i * 20}deg` }],
                    },
                  ]}
                >
                  <Text style={styles.heartEmoji}>💖</Text>
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </AvatarWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  head: {
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
    top: '-10%',
    left: '-10%',
  },
  perfectCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 1000,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    gap: 20,
  },
  cuteEye: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  eyePupil: {
    width: 18,
    height: 18,
    borderRadius: 9,
    position: 'relative',
  },
  eyeHighlight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 3,
  },
  expressiveMouth: {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: [{ translateX: -20 }],
  },
  mouthShape: {
    width: 40,
    height: 20,
    backgroundColor: '#000000',
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  happyMouth: {
    width: 45,
    height: 25,
    borderRadius: 25,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  excitedMouth: {
    width: 50,
    height: 30,
    borderRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  surprisedMouth: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sleepyMouth: {
    width: 35,
    height: 8,
    borderRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  sadMouth: {
    width: 40,
    height: 20,
    borderRadius: 20,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  loveMouth: {
    width: 30,
    height: 15,
    borderRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: '#FF69B4',
  },
  sparklesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  premiumSparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleInner: {
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  premiumHeart: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 16,
    textShadowColor: '#FF69B4',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
