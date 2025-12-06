import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { LoadingSpinner } from './LoadingSpinner';

interface UnifiedLoadingScreenProps {
  message?: string;
  subMessage?: string;
  showProgress?: boolean;
  progress?: number;
}

const { width, height } = Dimensions.get('window');

export const UnifiedLoadingScreen: React.FC<UnifiedLoadingScreenProps> = ({
  message = 'Loading...',
  subMessage,
  showProgress = false,
  progress = 0,
}) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo/Icon Area */}
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.logoContainer}
          >
            <View style={styles.logoCircle}>
              <Image 
                source={require('../assets/images/hi.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </Animatable.View>

          {/* Loading Spinner */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={200}
            style={styles.spinnerContainer}
          >
            <LoadingSpinner size={60} color="#FFFFFF" />
          </Animatable.View>

          {/* Main Message */}
          <Animatable.Text
            animation="fadeInUp"
            duration={800}
            delay={400}
            style={styles.mainMessage}
          >
            {message}
          </Animatable.Text>

          {/* Sub Message */}
          {subMessage && (
            <Animatable.Text
              animation="fadeInUp"
              duration={800}
              delay={600}
              style={styles.subMessage}
            >
              {subMessage}
            </Animatable.Text>
          )}

          {/* Progress Bar */}
          {showProgress && (
            <Animatable.View
              animation="fadeInUp"
              duration={800}
              delay={800}
              style={styles.progressContainer}
            >
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, progress))}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            </Animatable.View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  spinnerContainer: {
    marginBottom: 30,
  },
  mainMessage: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
