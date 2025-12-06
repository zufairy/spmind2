import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, X, Sparkles, Crown } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

interface LockedFeaturePopupProps {
  visible: boolean;
  onClose: () => void;
  onGetGenius: () => void;
  featureName?: string;
}

export default function LockedFeaturePopup({
  visible,
  onClose,
  onGetGenius,
  featureName = 'This Feature',
}: LockedFeaturePopupProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animatable.View
          animation="bounceIn"
          duration={600}
          style={styles.popup}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666666" />
          </TouchableOpacity>

          {/* Lock Icon with Animation */}
          <Animatable.View
            animation={{
              0: { scale: 1, rotate: '0deg' },
              0.25: { scale: 1.1, rotate: '-10deg' },
              0.5: { scale: 1.2, rotate: '10deg' },
              0.75: { scale: 1.1, rotate: '-10deg' },
              1: { scale: 1, rotate: '0deg' },
            }}
            iterationCount="infinite"
            duration={2000}
            style={styles.lockIconContainer}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.lockIconGradient}
            >
              <Lock size={40} color="#FFFFFF" />
            </LinearGradient>
            
            {/* Sparkles */}
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              style={[styles.sparkle, styles.sparkle1]}
            >
              <Sparkles size={16} color="#FFD700" />
            </Animatable.View>
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              delay={500}
              style={[styles.sparkle, styles.sparkle2]}
            >
              <Sparkles size={12} color="#FFA500" />
            </Animatable.View>
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              duration={1500}
              delay={1000}
              style={[styles.sparkle, styles.sparkle3]}
            >
              <Sparkles size={14} color="#FFD700" />
            </Animatable.View>
          </Animatable.View>

          {/* Title */}
          <Animatable.Text
            animation="fadeInUp"
            delay={200}
            style={styles.title}
          >
            🔒 Premium Feature
          </Animatable.Text>

          {/* Description */}
          <Animatable.Text
            animation="fadeInUp"
            delay={400}
            style={styles.description}
          >
            {featureName} is exclusive to Genius+ members!
          </Animatable.Text>

          {/* Benefits List */}
          <Animatable.View
            animation="fadeInUp"
            delay={600}
            style={styles.benefitsList}
          >
            <View style={styles.benefitItem}>
              <Crown size={16} color="#FFD700" />
              <Text style={styles.benefitText}>Unlock all mini games</Text>
            </View>
            <View style={styles.benefitItem}>
              <Sparkles size={16} color="#FFD700" />
              <Text style={styles.benefitText}>Ad-free experience</Text>
            </View>
            <View style={styles.benefitItem}>
              <Crown size={16} color="#FFD700" />
              <Text style={styles.benefitText}>Priority support</Text>
            </View>
          </Animatable.View>

          {/* Get Genius+ Button */}
          <Animatable.View
            animation="fadeInUp"
            delay={800}
            style={styles.buttonContainer}
          >
            <TouchableOpacity
              style={styles.geniusButton}
              onPress={onGetGenius}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.geniusButtonGradient}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.geniusButtonText}>Get Genius+</Text>
                <Animatable.View
                  animation="pulse"
                  iterationCount="infinite"
                  duration={1000}
                >
                  <Sparkles size={18} color="#FFFFFF" />
                </Animatable.View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Maybe Later Button */}
            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    width: width - 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  lockIconContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  lockIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: -10,
    right: -10,
  },
  sparkle2: {
    bottom: -5,
    left: -5,
  },
  sparkle3: {
    top: 10,
    left: -15,
  },
  title: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  benefitText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#333333',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  geniusButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  geniusButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  geniusButtonText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  laterButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#999999',
  },
});


