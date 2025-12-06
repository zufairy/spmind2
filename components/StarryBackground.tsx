import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  delay: number;
}

export const StarryBackground: React.FC = () => {
  const colors = ['#FFFFFF', '#A8C5FF', '#FFA8FF', '#FFA8C5', '#C5A8FF'];
  
  const stars: Star[] = Array.from({ length: 200 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 0.5,
    opacity: Math.random() * 0.8 + 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2000,
  }));

  return (
    <View style={styles.container}>
      {/* Galaxy gradient background */}
      <LinearGradient
        colors={['#0a0015', '#1a0033', '#0d001a', '#000000']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Nebula clouds */}
      <View style={styles.nebula1} />
      <View style={styles.nebula2} />
      <View style={styles.nebula3} />
      
      {/* Stars */}
      {stars.map((star) => (
        <TwinklingStar key={star.id} star={star} />
      ))}
    </View>
  );
};

const TwinklingStar: React.FC<{ star: Star }> = ({ star }) => {
  const opacity = useRef(new Animated.Value(star.opacity)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    let twinkleTimeout: NodeJS.Timeout | null = null;
    let floatTimeout: NodeJS.Timeout | null = null;
    let floatAnimation: Animated.CompositeAnimation | null = null;

    const twinkle = () => {
      if (!isMounted.current) return;
      
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.random() * 0.5 + 0.2,
          duration: Math.random() * 2000 + 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: Math.random() * 0.8 + 0.2,
          duration: Math.random() * 2000 + 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (isMounted.current) {
          twinkle();
        }
      });
    };

    const float = () => {
      if (!isMounted.current) return;
      
      floatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -10,
            duration: Math.random() * 3000 + 2000,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 10,
            duration: Math.random() * 3000 + 2000,
            useNativeDriver: true,
          }),
        ])
      );
      floatAnimation.start();
    };

    // Start twinkling and floating after delays
    twinkleTimeout = setTimeout(twinkle, star.delay);
    floatTimeout = setTimeout(float, star.delay / 2);

    // CLEANUP - Stop all animations when component unmounts
    return () => {
      isMounted.current = false;
      if (twinkleTimeout) clearTimeout(twinkleTimeout);
      if (floatTimeout) clearTimeout(floatTimeout);
      if (floatAnimation) floatAnimation.stop();
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: star.x,
          top: star.y,
          width: star.size,
          height: star.size,
          opacity: opacity,
          backgroundColor: star.color,
          transform: [{ translateY }],
          shadowColor: star.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: star.size * 2,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  star: {
    position: 'absolute',
    borderRadius: 50,
    elevation: 5,
  },
  nebula1: {
    position: 'absolute',
    width: width * 0.6,
    height: height * 0.4,
    top: height * 0.1,
    left: width * 0.2,
    backgroundColor: 'rgba(138, 43, 226, 0.08)',
    borderRadius: 200,
    transform: [{ rotate: '45deg' }],
  },
  nebula2: {
    position: 'absolute',
    width: width * 0.5,
    height: height * 0.3,
    top: height * 0.5,
    right: width * 0.1,
    backgroundColor: 'rgba(75, 0, 130, 0.06)',
    borderRadius: 150,
    transform: [{ rotate: '-30deg' }],
  },
  nebula3: {
    position: 'absolute',
    width: width * 0.4,
    height: height * 0.25,
    bottom: height * 0.2,
    left: width * 0.1,
    backgroundColor: 'rgba(138, 43, 226, 0.05)',
    borderRadius: 120,
    transform: [{ rotate: '15deg' }],
  },
});

