import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

interface LoadingSpinnerProps {
  size?: number | string;
  color?: string;
}

export function LoadingSpinner({ size = 40, color = '#00FF00' }: LoadingSpinnerProps) {
  const numericSize = typeof size === 'string' ? 40 : size;
  
  return (
    <View style={[styles.container, { width: numericSize, height: numericSize }]}>
      {/* Outer ring */}
      <Animatable.View
        animation="rotate"
        iterationCount="infinite"
        duration={1000}
        easing="linear"
        style={[styles.spinner, { width: numericSize, height: numericSize }]}
      >
        <LinearGradient
          colors={[color, 'transparent']}
          style={[styles.gradient, { width: numericSize, height: numericSize, borderRadius: numericSize / 2, borderWidth: 3 }]}
        />
      </Animatable.View>
      
      {/* Inner pulse */}
      <Animatable.View
        animation="pulse"
        iterationCount="infinite"
        duration={1500}
        style={[styles.innerPulse, { 
          width: numericSize * 0.5, 
          height: numericSize * 0.5,
          borderRadius: numericSize * 0.25,
          backgroundColor: color,
        }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinner: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  gradient: {
    borderColor: 'transparent',
  },
  innerPulse: {
    opacity: 0.3,
  },
});