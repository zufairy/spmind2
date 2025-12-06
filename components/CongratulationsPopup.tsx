import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface CongratulationsPopupProps {
  isVisible: boolean;
  onComplete: () => void;
}

const { width, height } = Dimensions.get('window');

// Generate more confetti pieces with varied properties
const generateConfettiPieces = (count: number) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA', '#FF9F43', '#6C5CE7'];
  const shapes = ['square', 'circle', 'rectangle'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    translateY: new Animated.Value(-50 - Math.random() * 100),
    translateX: new Animated.Value(Math.random() * width),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5 + Math.random() * 0.5),
    color: colors[i % colors.length],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    size: 6 + Math.random() * 10,
    delay: i * 50,
    duration: 2500 + Math.random() * 2000,
    swingAmplitude: 20 + Math.random() * 40,
  }));
};

const CongratulationsPopup: React.FC<CongratulationsPopupProps> = ({
  isVisible,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const buttonShimmerAnim = useRef(new Animated.Value(0)).current;
  const buttonBounceAnim = useRef(new Animated.Value(0)).current;
  const buttonRotateAnim = useRef(new Animated.Value(0)).current;
  
  // More confetti pieces for better effect
  const confettiPieces = useRef(generateConfettiPieces(40)).current;

  useEffect(() => {
    if (isVisible) {
      let confettiTimeout: NodeJS.Timeout | null = null;
      let buttonShimmerAnimation: Animated.CompositeAnimation | null = null;

      // Start animations
      Animated.sequence([
        // Scale in with bounce effect
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      // Bouncy button animation - more dynamic!
      const buttonPulseAnimation = Animated.loop(
        Animated.sequence([
          // Quick bounce up
          Animated.spring(buttonPulseAnim, {
            toValue: 1.08,
            tension: 300,
            friction: 4,
            useNativeDriver: true,
          }),
          // Settle back
          Animated.spring(buttonPulseAnim, {
            toValue: 1,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
          // Small pause
          Animated.delay(800),
        ])
      );
      buttonPulseAnimation.start();
      
      // Subtle wiggle animation
      const buttonBounceAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonBounceAnim, {
            toValue: -3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(buttonBounceAnim, {
            toValue: 3,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(buttonBounceAnim, {
            toValue: -2,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(buttonBounceAnim, {
            toValue: 2,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(buttonBounceAnim, {
            toValue: 0,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      );
      buttonBounceAnimation.start();

      // Button shimmer animation for glassmorphism effect
      buttonShimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonShimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(buttonShimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      buttonShimmerAnimation.start();

      // Start confetti animation with staggered delays
      confettiTimeout = setTimeout(() => {
        confettiPieces.forEach((piece) => {
          // First fade in
          Animated.timing(piece.opacity, {
            toValue: 1,
            duration: 200,
            delay: piece.delay,
            useNativeDriver: true,
          }).start();

          // Fall animation with swing
          Animated.parallel([
            // Fall down
            Animated.timing(piece.translateY, {
              toValue: height + 100,
              duration: piece.duration,
              delay: piece.delay,
              useNativeDriver: true,
            }),
            // Horizontal swing using timing
            Animated.sequence([
              Animated.timing(piece.translateX, {
                toValue: piece.translateX._value + piece.swingAmplitude,
                duration: piece.duration / 4,
                delay: piece.delay,
                useNativeDriver: true,
              }),
              Animated.timing(piece.translateX, {
                toValue: piece.translateX._value - piece.swingAmplitude,
                duration: piece.duration / 4,
                useNativeDriver: true,
              }),
              Animated.timing(piece.translateX, {
                toValue: piece.translateX._value + piece.swingAmplitude / 2,
                duration: piece.duration / 4,
                useNativeDriver: true,
              }),
              Animated.timing(piece.translateX, {
                toValue: piece.translateX._value,
                duration: piece.duration / 4,
                useNativeDriver: true,
              }),
            ]),
            // Rotate while falling
            Animated.timing(piece.rotate, {
              toValue: 2 + Math.random() * 2,
              duration: piece.duration,
              delay: piece.delay,
              useNativeDriver: true,
            }),
            // Fade out near the end
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: 600,
              delay: piece.delay + piece.duration - 600,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 200);

      // CLEANUP - Stop all animations when component unmounts or becomes invisible
      return () => {
        if (buttonShimmerAnimation) buttonShimmerAnimation.stop();
        if (confettiTimeout) clearTimeout(confettiTimeout);
        scaleAnim.stopAnimation();
        fadeAnim.stopAnimation();
        buttonPulseAnim.stopAnimation();
        buttonShimmerAnim.stopAnimation();
        confettiPieces.forEach(piece => {
          piece.translateY.stopAnimation();
          piece.translateX.stopAnimation();
          piece.rotate.stopAnimation();
          piece.opacity.stopAnimation();
          piece.scale.stopAnimation();
        });
      };
    }
  }, [isVisible]);

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const buttonShimmerOpacity = buttonShimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.1, 0.4, 0.1],
  });

  if (!isVisible) return null;

  const renderConfettiPiece = (piece: typeof confettiPieces[0]) => {
    const rotateInterpolate = piece.rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    let shapeStyle = {};
    if (piece.shape === 'circle') {
      shapeStyle = { borderRadius: piece.size / 2 };
    } else if (piece.shape === 'rectangle') {
      shapeStyle = { width: piece.size, height: piece.size * 2 };
    }

    return (
      <Animated.View
        key={piece.id}
        style={[
          styles.confettiPiece,
          {
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.shape === 'rectangle' ? piece.size * 2 : piece.size,
            transform: [
              { translateY: piece.translateY },
              { translateX: piece.translateX },
              { rotate: rotateInterpolate },
              { scale: piece.scale },
            ],
            opacity: piece.opacity,
            ...shapeStyle,
          },
        ]}
      />
    );
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Confetti pieces - render behind popup */}
      {confettiPieces.map(renderConfettiPiece)}
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Solid white popup container */}
        <View style={styles.popupContainer}>
          {/* Content */}
          <View style={styles.content}>
            {/* Main title */}
            <Text style={styles.title}>
              Welcome to{'\n'}SPMind!
            </Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Your account is ready
            </Text>

            {/* Help with my homework button - ONLY this has Glassmorphism */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  transform: [
                    { scale: buttonPulseAnim },
                    { translateY: buttonBounceAnim },
                  ],
                },
              ]}
            >
              {/* Button glow */}
              <View style={styles.buttonGlow} />
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleComplete}
                activeOpacity={0.8}
              >
                {/* Glassmorphism blur background for button */}
                {Platform.OS === 'ios' ? (
                  <BlurView
                    intensity={25}
                    tint="light"
                    style={styles.buttonBlur}
                  />
                ) : null}
                
                {/* Gradient overlay - Orange theme */}
                <LinearGradient
                  colors={['rgba(255, 159, 67, 0.95)', 'rgba(255, 109, 0, 0.98)', 'rgba(230, 81, 0, 1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  {/* Glass highlight effect - top shine */}
                  <View style={styles.buttonGlassHighlight} />
                  
                  {/* Animated shimmer overlay */}
                  <Animated.View
                    style={[
                      styles.buttonShimmer,
                      { opacity: buttonShimmerOpacity },
                    ]}
                  />
                  
                  {/* Glass border effect */}
                  <View style={styles.buttonGlassBorder} />
                  
                  <Text style={styles.continueText}>
                    ✨ Help with my homework ✨
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.88,
    maxWidth: 400,
    borderRadius: 28,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  popupContainer: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    paddingTop: 40,
    paddingBottom: 36,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    fontWeight: '800',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Inter-Medium',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 159, 67, 0.4)',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  continueButton: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    // Glassmorphism border
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  buttonBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonGradient: {
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonGlassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonGlassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
    zIndex: 1001,
  },
});

export default CongratulationsPopup;
