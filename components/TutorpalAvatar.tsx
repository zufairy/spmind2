import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

export type AvatarState = 
  | 'idle' 
  | 'quiet' 
  | 'listening' 
  | 'talking' 
  | 'motivating' 
  | 'asking' 
  | 'waiting' 
  | 'encouraging' 
  | 'confused'
  | 'happy'
  | 'excited'
  | 'thoughtful'
  | 'surprised';

interface TutorpalAvatarProps {
  state: AvatarState;
  amplitude?: number; // 0-1 for mouth animation
  emoji?: string[]; // Additional emoji popups
  size?: number;
  isVisible?: boolean;
  onTap?: () => void; // Add tap handler
}

export default function TutorpalAvatar({ 
  state, 
  amplitude = 0, 
  emoji = [], 
  size = 140,
  isVisible = true,
  onTap
}: TutorpalAvatarProps) {
  const [currentEmoji, setCurrentEmoji] = useState<string>('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  
  // Animated values for smooth transitions
  const eyeScale = useRef(new Animated.Value(1)).current;
  const mouthScale = useRef(new Animated.Value(1)).current;
  const eyebrowPosition = useRef(new Animated.Value(0)).current;
  const blushOpacity = useRef(new Animated.Value(0)).current;
  const sparkleOpacity = useRef(new Animated.Value(0)).current;
  const bounceScale = useRef(new Animated.Value(1)).current;
  const rotationValue = useRef(new Animated.Value(0)).current;

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      if (state === 'idle' || state === 'waiting' || state === 'listening') {
        setIsBlinking(true);
        Animated.sequence([
          Animated.timing(eyeScale, {
            toValue: 0.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(eyeScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
        setTimeout(() => setIsBlinking(false), 250);
      }
    };

    const blinkInterval = setInterval(blink, 4000 + Math.random() * 3000);
    return () => clearInterval(blinkInterval);
  }, [state, eyeScale]);

  // Winking animation for certain states
  useEffect(() => {
    if (state === 'motivating' || state === 'encouraging') {
      const wink = () => {
        setIsWinking(true);
        setTimeout(() => setIsWinking(false), 300);
      };
      const winkInterval = setInterval(wink, 6000 + Math.random() * 2000);
      return () => clearInterval(winkInterval);
    }
  }, [state]);

  // Bounce animation for excited states
  useEffect(() => {
    if (state === 'excited' || state === 'happy') {
      setIsBouncing(true);
      Animated.sequence([
        Animated.timing(bounceScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => setIsBouncing(false), 400);
    }
  }, [state, bounceScale]);

  // Tap handler for interactive animations
  const handleTap = () => {
    if (onTap) {
      onTap();
    }
    
    // Add cute tap animation
    setIsBouncing(true);
    setShowHearts(true);
    
    Animated.sequence([
      Animated.timing(bounceScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bounceScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Spin animation for fun
    Animated.timing(rotationValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      rotationValue.setValue(0);
    });
    
    setTimeout(() => {
      setIsBouncing(false);
      setShowHearts(false);
    }, 1000);
  };

  // State-based emoji popups and animations
  useEffect(() => {
    switch (state) {
      case 'quiet':
        showEmojiPopup('🤔', 'yellow');
        break;
      case 'listening':
        showEmojiPopup('🎧', 'blue');
        Animated.timing(eyebrowPosition, {
          toValue: -5,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 'motivating':
        showEmojiPopup('⭐', 'gold');
        Animated.timing(blushOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        break;
      case 'asking':
        showEmojiPopup('❓', 'blue');
        Animated.timing(eyebrowPosition, {
          toValue: 5,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 'waiting':
        showEmojiPopup('⏳', 'purple');
        break;
      case 'encouraging':
        showEmojiPopup('💪', 'green');
        Animated.timing(blushOpacity, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }).start();
        break;
      case 'confused':
        showEmojiPopup('🤷‍♀️', 'orange');
        Animated.timing(eyebrowPosition, {
          toValue: 8,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 'happy':
        showEmojiPopup('😊', 'pink');
        Animated.timing(blushOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
        break;
      case 'excited':
        showEmojiPopup('🎉', 'rainbow');
        Animated.timing(sparkleOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        break;
      case 'surprised':
        showEmojiPopup('😲', 'yellow');
        Animated.timing(eyebrowPosition, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }).start();
        break;
      default:
        Animated.timing(eyebrowPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        Animated.timing(blushOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
        Animated.timing(sparkleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
    }
  }, [state, eyebrowPosition, blushOpacity, sparkleOpacity]);

  // Emoji popup function
  const showEmojiPopup = (emojiChar: string, color: string) => {
    setCurrentEmoji(emojiChar);
    setShowEmoji(true);
    
    setTimeout(() => {
      setShowEmoji(false);
    }, 2500);
  };

  // Get face expression based on state
  const getFaceExpression = () => {
    switch (state) {
      case 'idle':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 24, height: 6, borderRadius: 3 },
          mouthType: 'smile'
        };
      case 'quiet':
        return {
          eyes: { width: 16, height: 16, borderRadius: 8 },
          eyebrows: { left: -2, right: 2 },
          mouth: { width: 20, height: 8, borderRadius: 4 },
          mouthType: 'neutral'
        };
      case 'listening':
        return {
          eyes: { width: 20, height: 18, borderRadius: 10 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 18, height: 10, borderRadius: 5 },
          mouthType: 'slightly_open'
        };
      case 'talking':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 28, height: 14, borderRadius: 7 },
          mouthType: 'open'
        };
      case 'motivating':
        return {
          eyes: { width: 16, height: 14, borderRadius: 8 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 32, height: 10, borderRadius: 5 },
          mouthType: 'big_smile'
        };
      case 'asking':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: 1, right: 1 },
          mouth: { width: 22, height: 8, borderRadius: 4 },
          mouthType: 'question'
        };
      case 'waiting':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 20, height: 6, borderRadius: 3 },
          mouthType: 'neutral'
        };
      case 'encouraging':
        return {
          eyes: { width: 18, height: 16, borderRadius: 9 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 26, height: 8, borderRadius: 4 },
          mouthType: 'encouraging'
        };
      case 'confused':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: -1, right: 1 },
          mouth: { width: 20, height: 8, borderRadius: 4 },
          mouthType: 'confused'
        };
      case 'happy':
        return {
          eyes: { width: 16, height: 14, borderRadius: 8 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 30, height: 12, borderRadius: 6 },
          mouthType: 'happy'
        };
      case 'excited':
        return {
          eyes: { width: 14, height: 12, borderRadius: 7 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 34, height: 14, borderRadius: 7 },
          mouthType: 'excited'
        };
      case 'thoughtful':
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: -1, right: -1 },
          mouth: { width: 22, height: 6, borderRadius: 3 },
          mouthType: 'thoughtful'
        };
      case 'surprised':
        return {
          eyes: { width: 20, height: 20, borderRadius: 10 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 24, height: 16, borderRadius: 8 },
          mouthType: 'surprised'
        };
      default:
        return {
          eyes: { width: 18, height: 18, borderRadius: 9 },
          eyebrows: { left: 0, right: 0 },
          mouth: { width: 24, height: 6, borderRadius: 3 },
          mouthType: 'smile'
        };
    }
  };

  const expression = getFaceExpression();

  // Get emoji-like colors based on state
  const getEmojiColors = () => {
    switch (state) {
      case 'happy':
      case 'excited':
        return ['#FFE135', '#FFD700', '#FFA500']; // Bright yellow gradient
      case 'motivating':
      case 'encouraging':
        return ['#FF69B4', '#FF1493', '#DC143C']; // Pink gradient
      case 'listening':
        return ['#87CEEB', '#4169E1', '#0000CD']; // Blue gradient
      case 'talking':
        return ['#98FB98', '#90EE90', '#32CD32']; // Green gradient
      case 'thinking':
      case 'waiting':
        return ['#DDA0DD', '#DA70D6', '#BA55D3']; // Purple gradient
      case 'confused':
        return ['#FFA07A', '#FF7F50', '#FF6347']; // Orange gradient
      case 'surprised':
        return ['#FFB6C1', '#FFC0CB', '#FFE4E1']; // Light pink gradient
      default:
        return ['#FFE135', '#FFD700', '#FFA500']; // Default bright yellow
    }
  };

  if (!isVisible) return null;

  const spin = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity 
      style={[styles.container, { width: size, height: size }]}
      onPress={handleTap}
      activeOpacity={0.8}
    >
      {/* Hearts for tap interaction */}
      {showHearts && (
        <View style={styles.heartsContainer}>
          <Animatable.View animation="fadeInUp" duration={400} style={[styles.heart, styles.heart1]}>
            <Text style={styles.heartText}>💖</Text>
          </Animatable.View>
          <Animatable.View animation="fadeInUp" duration={500} delay={100} style={[styles.heart, styles.heart2]}>
            <Text style={styles.heartText}>💕</Text>
          </Animatable.View>
          <Animatable.View animation="fadeInUp" duration={600} delay={200} style={[styles.heart, styles.heart3]}>
            <Text style={styles.heartText}>💗</Text>
          </Animatable.View>
        </View>
      )}

      {/* Sparkles for excited state */}
      <Animated.View style={[styles.sparklesContainer, { opacity: sparkleOpacity }]}>
        <Animatable.View animation="bounce" iterationCount="infinite" duration={1000} style={[styles.sparkle, styles.sparkle1]}>
          <Text style={styles.sparkleText}>✨</Text>
        </Animatable.View>
        <Animatable.View animation="bounce" iterationCount="infinite" duration={1200} delay={200} style={[styles.sparkle, styles.sparkle2]}>
          <Text style={styles.sparkleText}>⭐</Text>
        </Animatable.View>
        <Animatable.View animation="bounce" iterationCount="infinite" duration={1100} delay={400} style={[styles.sparkle, styles.sparkle3]}>
          <Text style={styles.sparkleText}>💫</Text>
        </Animatable.View>
      </Animated.View>

      {/* Main Avatar - Cute Emoji Style */}
      <Animated.View 
        style={[
          styles.avatar,
          {
            transform: [
              { scale: bounceScale },
              { rotate: spin }
            ]
          }
        ]}
      >
        <LinearGradient
          colors={getEmojiColors()}
          style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {/* Cute Hair/Head Accessory */}
          <View style={styles.hairContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.hair}
            />
            <View style={styles.hairStrand1} />
            <View style={styles.hairStrand2} />
          </View>

          {/* Blush */}
          <Animated.View style={[styles.blush, styles.blushLeft, { opacity: blushOpacity }]} />
          <Animated.View style={[styles.blush, styles.blushRight, { opacity: blushOpacity }]} />

          {/* Cute Eyes */}
          <View style={styles.eyesContainer}>
            <Animated.View
              style={[
                styles.eye,
                expression.eyes,
                { transform: [{ scale: eyeScale }] },
                isBlinking && styles.eyeBlinking,
                isWinking && styles.eyeWinking
              ]}
            >
              <View style={styles.eyeHighlight} />
              <View style={styles.eyePupil} />
            </Animated.View>
            <Animated.View
              style={[
                styles.eye,
                expression.eyes,
                { transform: [{ scale: eyeScale }] },
                isBlinking && styles.eyeBlinking
              ]}
            >
              <View style={styles.eyeHighlight} />
              <View style={styles.eyePupil} />
            </Animated.View>
          </View>

          {/* Cute Eyebrows */}
          <View style={styles.eyebrowsContainer}>
            <Animated.View 
              style={[
                styles.eyebrow, 
                { 
                  left: expression.eyebrows.left,
                  transform: [{ translateY: eyebrowPosition }]
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.eyebrow, 
                { 
                  right: expression.eyebrows.right,
                  transform: [{ translateY: eyebrowPosition }]
                }
              ]} 
            />
          </View>

          {/* Cute Mouth */}
          <Animated.View 
            style={[
              styles.mouth, 
              expression.mouth,
              { transform: [{ scale: mouthScale }] },
              state === 'talking' && { height: 14 + (amplitude * 10) }
            ]} 
          >
            {expression.mouthType === 'big_smile' && <View style={styles.mouthTeeth} />}
            {expression.mouthType === 'open' && <View style={styles.mouthTongue} />}
          </Animated.View>

          {/* Cute Nose */}
          <View style={styles.nose} />
        </LinearGradient>
      </Animated.View>

      {/* Emoji Popup */}
      {showEmoji && (
        <Animatable.View 
          animation="fadeInUp" 
          duration={400}
          style={styles.emojiContainer}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
            style={styles.emojiBubble}
          >
            <Text style={styles.emojiText}>{currentEmoji}</Text>
          </LinearGradient>
        </Animatable.View>
      )}

      {/* Additional Emoji Popups */}
      {emoji.map((emojiChar, index) => (
        <Animatable.View
          key={index}
          animation="fadeInUp"
          delay={index * 200}
          style={[styles.additionalEmoji, { top: -20 - (index * 30) }]}
        >
          <Text style={styles.additionalEmojiText}>{emojiChar}</Text>
        </Animatable.View>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  hairContainer: {
    position: 'absolute',
    top: -15,
    width: '100%',
    height: '65%',
    alignItems: 'center',
  },
  hair: {
    width: '85%',
    height: '100%',
    borderRadius: 50,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  hairStrand1: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 10,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 5,
    transform: [{ rotate: '-20deg' }],
  },
  hairStrand2: {
    position: 'absolute',
    top: 20,
    right: 25,
    width: 8,
    height: 25,
    backgroundColor: '#FFA500',
    borderRadius: 4,
    transform: [{ rotate: '25deg' }],
  },
  blush: {
    position: 'absolute',
    width: 25,
    height: 15,
    backgroundColor: '#FFB6C1',
    borderRadius: 15,
    opacity: 0.7,
  },
  blushLeft: {
    left: 20,
    top: '50%',
  },
  blushRight: {
    right: 20,
    top: '50%',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 80,
    marginBottom: 25,
    marginTop: 15,
  },
  eye: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  eyeHighlight: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  eyePupil: {
    width: 12,
    height: 12,
    backgroundColor: '#2E2E2E',
    borderRadius: 6,
  },
  eyeBlinking: {
    opacity: 0.1,
  },
  eyeWinking: {
    opacity: 0.1,
    transform: [{ scaleY: 0.1 }],
  },
  eyebrowsContainer: {
    position: 'absolute',
    top: '25%',
    width: '100%',
    height: 30,
  },
  eyebrow: {
    position: 'absolute',
    width: 18,
    height: 5,
    backgroundColor: '#8B4513',
    borderRadius: 3,
    top: 0,
  },
  nose: {
    position: 'absolute',
    top: '40%',
    width: 8,
    height: 10,
    backgroundColor: '#FFB6C1',
    borderRadius: 4,
  },
  mouth: {
    backgroundColor: '#FF69B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  mouthTeeth: {
    width: '70%',
    height: '50%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  mouthTongue: {
    width: '60%',
    height: '70%',
    backgroundColor: '#FFB6C1',
    borderRadius: 4,
  },
  heartsContainer: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    zIndex: 15,
  },
  heart: {
    position: 'absolute',
  },
  heart1: {
    top: '20%',
    left: '30%',
  },
  heart2: {
    top: '30%',
    right: '35%',
  },
  heart3: {
    bottom: '25%',
    left: '50%',
  },
  heartText: {
    fontSize: 20,
  },
  sparklesContainer: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    zIndex: 1,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: '15%',
    left: '25%',
  },
  sparkle2: {
    top: '20%',
    right: '30%',
  },
  sparkle3: {
    bottom: '25%',
    left: '55%',
  },
  sparkleText: {
    fontSize: 18,
  },
  emojiContainer: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -30,
    zIndex: 10,
  },
  emojiBubble: {
    borderRadius: 25,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  emojiText: {
    fontSize: 20,
    textAlign: 'center',
  },
  additionalEmoji: {
    position: 'absolute',
    right: -40,
    zIndex: 5,
  },
  additionalEmojiText: {
    fontSize: 28,
  },
});
