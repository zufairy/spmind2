import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CongratulationsPopupProps {
  isVisible: boolean;
  onComplete: () => void;
}

const CongratulationsPopup: React.FC<CongratulationsPopupProps> = ({
  isVisible,
  onComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const textGlowAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Confetti animations
  const confettiPieces = useRef(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(Math.random() * width),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (isVisible) {
      let glowAnimation: Animated.CompositeAnimation | null = null;
      let textGlowAnimation: Animated.CompositeAnimation | null = null;
      let confettiTimeout: NodeJS.Timeout | null = null;

      // Start animations
      Animated.sequence([
        // Scale in with bounce effect
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Pause for a moment
        Animated.delay(500),
      ]).start();

      // Continuous glow animation
      glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      glowAnimation.start();

      // Text glow animation
      textGlowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(textGlowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(textGlowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      textGlowAnimation.start();

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Start confetti animation after a short delay
      confettiTimeout = setTimeout(() => {
        confettiPieces.forEach((piece, index) => {
          const delay = index * 100; // Stagger confetti pieces
          
          Animated.parallel([
            // Fall down
            Animated.timing(piece.translateY, {
              toValue: height + 100,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            // Rotate while falling
            Animated.timing(piece.rotate, {
              toValue: 1,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            // Fade out near the end
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: 500,
              delay: 2500 + Math.random() * 1000,
              useNativeDriver: true,
            }),
          ]).start();
        });
      }, 500);

      // CLEANUP - Stop all animations when component unmounts or becomes invisible
      return () => {
        if (glowAnimation) glowAnimation.stop();
        if (textGlowAnimation) textGlowAnimation.stop();
        if (confettiTimeout) clearTimeout(confettiTimeout);
        scaleAnim.stopAnimation();
        glowAnim.stopAnimation();
        textGlowAnim.stopAnimation();
        fadeAnim.stopAnimation();
        confettiPieces.forEach(piece => {
          piece.translateY.stopAnimation();
          piece.translateX.stopAnimation();
          piece.rotate.stopAnimation();
          piece.opacity.stopAnimation();
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const textGlowOpacity = textGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      {/* Confetti pieces */}
      {confettiPieces.map((piece) => {
        const rotateInterpolate = piece.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        
        const confettiColors = ['#FF6B35', '#FF8E53', '#FFB366', '#FFFFFF', '#FFD700'];
        const randomColor = confettiColors[piece.id % confettiColors.length];
        
        return (
          <Animated.View
            key={piece.id}
            style={[
              styles.confettiPiece,
              {
                backgroundColor: randomColor,
                transform: [
                  { translateY: piece.translateY },
                  { translateX: piece.translateX },
                  { rotate: rotateInterpolate },
                ],
                opacity: piece.opacity,
              },
            ]}
          />
        );
      })}
      
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glowing background effect */}
        <Animated.View
          style={[
            styles.glowBackground,
            {
              opacity: glowOpacity,
            },
          ]}
        />
        
        {/* Main gradient background */}
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner glow effect */}
          <Animated.View
            style={[
              styles.innerGlow,
              {
                opacity: glowOpacity,
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            {/* Main title */}
            <Animated.Text
              style={[
                styles.title,
                {
                  textShadowColor: `rgba(255, 255, 255, ${textGlowOpacity})`,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 20,
                },
              ]}
            >
              Welcome to Genius
            </Animated.Text>
            
            {/* Subtitle */}
            <Animated.Text
              style={[
                styles.subtitle,
                {
                  textShadowColor: `rgba(255, 255, 255, ${textGlowOpacity})`,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 15,
                },
              ]}
            >
              Your account is ready
            </Animated.Text>
          </View>

          {/* Help my homeworks button */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>Help my homeworks</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: width * 0.9,
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 25,
  },
  glowBackground: {
    position: 'absolute',
    top: -15,
    left: -15,
    right: -15,
    bottom: -15,
    borderRadius: 24,
    backgroundColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  gradientBackground: {
    borderRadius: 16,
    padding: 35,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    alignItems: 'center',
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFF8F0',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
    letterSpacing: 0.2,
  },
  continueButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
    zIndex: 999,
  },
});

export default CongratulationsPopup;
