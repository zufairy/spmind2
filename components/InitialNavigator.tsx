import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StarryBackground } from './StarryBackground';
import { LoadingSpinner } from './LoadingSpinner';
import * as Animatable from 'react-native-animatable';

export const InitialNavigator: React.FC = () => {
  return (
    <View style={styles.container}>
      <StarryBackground />
      <View style={styles.content}>
        {/* Educational Icons Floating */}
        <View style={styles.floatingIcons}>
          <Animatable.Text 
            animation="fadeInDown" 
            delay={100}
            duration={1000}
            style={[styles.floatingIcon, { top: 100, left: 40 }]}
          >
            📖
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInDown" 
            delay={200}
            duration={1000}
            style={[styles.floatingIcon, { top: 120, right: 50 }]}
          >
            ✏️
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInUp" 
            delay={300}
            duration={1000}
            style={[styles.floatingIcon, { bottom: 200, left: 60 }]}
          >
            🧮
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeInUp" 
            delay={400}
            duration={1000}
            style={[styles.floatingIcon, { bottom: 220, right: 70 }]}
          >
            🔬
          </Animatable.Text>
        </View>

        <Animatable.View
          animation="bounceIn"
          duration={1000}
          style={styles.titleContainer}
        >
          <Animatable.Text 
            animation={{
              0: { scale: 1, opacity: 1 },
              0.5: { scale: 1.25, opacity: 0.8 },
              1: { scale: 1, opacity: 1 },
            }}
            iterationCount="infinite"
            duration={1000}
            style={styles.titleEmoji}
          >
            🧠
          </Animatable.Text>
          <Text style={styles.title}>SPMind</Text>
          <Text style={styles.subtitle}>AI-Powered Learning</Text>
        </Animatable.View>
        
        <Animatable.View
          animation="fadeInUp"
          duration={800}
          delay={400}
          style={styles.loaderContainer}
        >
          <Text style={styles.loadingText}>Initializing your journey...</Text>
          <Text style={styles.loadingSubtext}>Setting up the best learning experience</Text>
        </Animatable.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  floatingIcons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingIcon: {
    position: 'absolute',
    fontSize: 40,
    opacity: 0.3,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  titleEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 56,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#FFFFFF',
    marginTop: 28,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
});

