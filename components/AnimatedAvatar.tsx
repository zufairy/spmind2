import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface AnimatedAvatarProps {
  isTalking: boolean;
  mood: 'happy' | 'thinking' | 'listening' | 'excited' | 'curious' | 'neutral' | 'surprised' | 'focused';
  isProcessing: boolean;
  size?: number;
  isRecording?: boolean;
  isListening?: boolean;
  isConsultingMode?: boolean;
}

export default function AnimatedAvatar({ 
  isTalking, 
  mood, 
  isProcessing, 
  size = 120,
  isRecording = false,
  isListening = false,
  isConsultingMode = false
}: AnimatedAvatarProps) {
  const avatarRef = useRef<Animatable.View>(null);
  const eyesRef = useRef<Animatable.View>(null);
  const mouthRef = useRef<Animatable.View>(null);
  const blushRef = useRef<Animatable.View>(null);
  const sparklesRef = useRef<Animatable.View>(null);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Get colors based on mood and state
  const getMoodColors = () => {
    if (isConsultingMode) {
      return ['#FF69B4', '#FF1493']; // Pink gradient for consulting mode
    }
    if (isRecording) {
      return ['#FF6B6B', '#FF4444']; // Red when recording
    }
    if (isListening) {
      return ['#4ECDC4', '#44A08D']; // Teal when listening
    }
    
    switch (mood) {
      case 'happy':
        return ['#FFD93D', '#FFB800'];
      case 'thinking':
        return ['#A8E6CF', '#7FCDCD'];
      case 'listening':
        return ['#FFB3BA', '#FF8BA7'];
      case 'excited':
        return ['#FF6B6B', '#FF8E53'];
      case 'curious':
        return ['#4ECDC4', '#44A08D'];
      case 'surprised':
        return ['#FFB3BA', '#FF8BA7'];
      case 'focused':
        return ['#8B5CF6', '#7C3AED'];
      case 'neutral':
      default:
        return ['#FFD93D', '#FFB800'];
    }
  };

  // Get mouth shape based on mood and talking state
  const getMouthStyle = () => {
    if (isTalking) {
      return {
        width: 28,
        height: 18,
        borderRadius: 14,
        backgroundColor: '#8B4513',
        borderWidth: 2,
        borderColor: '#654321',
      };
    }

    if (isRecording) {
      return {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#8B4513',
        borderWidth: 2,
        borderColor: '#654321',
      };
    }

    if (isListening) {
      return {
        width: 16,
        height: 14,
        borderRadius: 8,
        backgroundColor: '#8B4513',
        borderWidth: 2,
        borderColor: '#654321',
      };
    }

    switch (mood) {
      case 'happy':
        return {
          width: 32,
          height: 16,
          borderRadius: 16,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'thinking':
        return {
          width: 20,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'listening':
        return {
          width: 16,
          height: 12,
          borderRadius: 8,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'excited':
        return {
          width: 28,
          height: 20,
          borderRadius: 14,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'curious':
        return {
          width: 18,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'surprised':
        return {
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      case 'focused':
        return {
          width: 22,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
      default:
        return {
          width: 24,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#8B4513',
          borderWidth: 2,
          borderColor: '#654321',
        };
    }
  };

  // Get eye expression based on mood and state
  const getEyeStyle = () => {
    if (isRecording) {
      return {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF4444',
      };
    }

    if (isListening) {
      return {
        width: 18,
        height: 16,
        borderRadius: 9,
        backgroundColor: '#4ECDC4',
      };
    }

    switch (mood) {
      case 'happy':
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#000000',
        };
      case 'thinking':
        return {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#000000',
        };
      case 'listening':
        return {
          width: 18,
          height: 14,
          borderRadius: 9,
          backgroundColor: '#000000',
        };
      case 'excited':
        return {
          width: 20,
          height: 16,
          borderRadius: 10,
          backgroundColor: '#000000',
        };
      case 'curious':
        return {
          width: 14,
          height: 18,
          borderRadius: 7,
          backgroundColor: '#000000',
        };
      case 'surprised':
        return {
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: '#000000',
        };
      case 'focused':
        return {
          width: 16,
          height: 14,
          borderRadius: 8,
          backgroundColor: '#8B5CF6',
        };
      default:
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#000000',
        };
    }
  };

  // Enhanced animations based on state
  useEffect(() => {
    if (isTalking && avatarRef.current) {
      avatarRef.current.pulse?.();
      if (mouthRef.current) {
        mouthRef.current.pulse?.();
      }
    } else if (isRecording && avatarRef.current) {
      avatarRef.current.pulse?.();
      if (sparklesRef.current) {
        sparklesRef.current.pulse?.();
      }
    } else if (isListening && avatarRef.current) {
      avatarRef.current.pulse?.();
    } else if (avatarRef.current) {
      avatarRef.current.stopAnimation();
    }
  }, [isTalking, isRecording, isListening]);

  useEffect(() => {
    if (isProcessing && eyesRef.current) {
      eyesRef.current.pulse?.();
    } else if (eyesRef.current) {
      eyesRef.current.stopAnimation();
    }
  }, [isProcessing]);

  // Blinking animation
  useEffect(() => {
    const blink = () => {
      if (!isTalking && !isProcessing && !isRecording) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    };

    const blinkInterval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [isTalking, isProcessing, isRecording]);

  // Enhanced eye movement
  useEffect(() => {
    const moveEyes = () => {
      if (eyesRef.current && !isTalking && !isProcessing && !isRecording) {
        const randomX = Math.random() * 30 - 15;
        const randomY = Math.random() * 15 - 7.5;
        
        setEyePosition({ x: randomX, y: randomY });
        
        eyesRef.current.transitionTo({
          transform: [{ translateX: randomX }, { translateY: randomY }],
        }, 1000);
      }
    };

    const interval = setInterval(moveEyes, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [isTalking, isProcessing, isRecording]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main Avatar Circle */}
      <Animatable.View
        ref={avatarRef}
        style={[styles.avatar, { width: size, height: size }]}
      >
        <LinearGradient
          colors={getMoodColors() as [string, string]}
          style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
        >
          {/* Eyes Container */}
          <Animatable.View
            ref={eyesRef}
            style={styles.eyesContainer}
          >
            {/* Left Eye */}
            <Animatable.View
              style={[
                styles.eye, 
                getEyeStyle(),
                isBlinking && styles.eyeBlinking
              ]}
            />
            {/* Right Eye */}
            <Animatable.View
              style={[
                styles.eye, 
                getEyeStyle(),
                isBlinking && styles.eyeBlinking
              ]}
            />
          </Animatable.View>

          {/* Mouth */}
          <Animatable.View
            ref={mouthRef}
            style={[styles.mouth, getMouthStyle()]}
          />

          {/* Blush (for happy/excited moods) */}
          {(mood === 'happy' || mood === 'excited') && (
            <Animatable.View
              ref={blushRef}
              style={styles.blushContainer}
            >
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite" 
                delay={0}
                style={[styles.blush, { left: -15 }]} 
              />
              <Animatable.View 
                animation="pulse" 
                iterationCount="infinite" 
                delay={200}
                style={[styles.blush, { right: -15 }]} 
              />
            </Animatable.View>
          )}

          {/* Thinking Dots (for thinking mood) */}
          {mood === 'thinking' && (
            <View style={styles.thinkingContainer}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={0}
                style={styles.thinkingDot}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={200}
                style={styles.thinkingDot}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={400}
                style={styles.thinkingDot}
              />
            </View>
          )}

          {/* Enhanced Sparkles (for excited mood and recording) */}
          {(mood === 'excited' || isRecording) && (
            <View style={styles.sparklesContainer}>
              <Animatable.View
                animation="bounce"
                iterationCount="infinite"
                delay={0}
                style={[styles.sparkle, { top: 10, left: 20 }]}
              />
              <Animatable.View
                animation="bounce"
                iterationCount="infinite"
                delay={300}
                style={[styles.sparkle, { top: 15, right: 25 }]}
              />
              <Animatable.View
                animation="bounce"
                iterationCount="infinite"
                delay={600}
                style={[styles.sparkle, { bottom: 20, left: 30 }]}
              />
              <Animatable.View
                animation="bounce"
                iterationCount="infinite"
                delay={900}
                style={[styles.sparkle, { bottom: 15, right: 15 }]}
              />
            </View>
          )}

          {/* Listening Waves (for listening state) */}
          {isListening && (
            <View style={styles.listeningContainer}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={0}
                style={[styles.listeningWave, { left: -25 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={200}
                style={[styles.listeningWave, { right: -25 }]}
              />
            </View>
          )}

          {/* Consulting Mode Waveform */}
          {isConsultingMode && isTalking && (
            <View style={styles.waveformContainer}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={0}
                style={[styles.waveformBar, { height: 8 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={100}
                style={[styles.waveformBar, { height: 12 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={200}
                style={[styles.waveformBar, { height: 16 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={300}
                style={[styles.waveformBar, { height: 10 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={400}
                style={[styles.waveformBar, { height: 14 }]}
              />
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                delay={500}
                style={[styles.waveformBar, { height: 6 }]}
              />
            </View>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <View style={styles.recordingContainer}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                style={styles.recordingDot}
              />
            </View>
          )}
        </LinearGradient>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eyesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 60,
    marginBottom: 15,
  },
  eye: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  eyeBlinking: {
    opacity: 0.5,
  },
  mouth: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  blushContainer: {
    position: 'absolute',
    top: '60%',
    width: '100%',
    height: 20,
  },
  blush: {
    position: 'absolute',
    width: 20,
    height: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 182, 193, 0.6)',
    top: 0,
  },
  thinkingContainer: {
    position: 'absolute',
    top: -30,
    flexDirection: 'row',
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  sparklesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  listeningContainer: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listeningWave: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  recordingContainer: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  waveformContainer: {
    position: 'absolute',
    bottom: -30,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FF69B4',
    borderRadius: 2,
    minHeight: 4,
  },
});
