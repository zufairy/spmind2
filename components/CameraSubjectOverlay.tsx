import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Image,
} from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Camera as CameraIcon, Image as ImageIcon, Zap } from 'lucide-react-native';
import SubjectSlider, { Subject } from './SubjectSlider';
import FocusOverlay from './FocusOverlay';

const { width: screenWidth } = Dimensions.get('window');

interface CameraSubjectOverlayProps {
  subjects: Subject[];
  onSubjectChange?: (subject: Subject) => void;
  onCapture?: (subject: Subject) => void;
  onOpenPhoto?: () => void;
  onToggleTorch?: () => void;
  torchEnabled?: boolean;
  titleMode?: 'pill' | 'chip';
  focusRect?: { 
    widthPct?: number; 
    aspect?: number; 
    cornerRadius?: number; 
  };
  hideSubjects?: boolean;
}

export default function CameraSubjectOverlay({
  subjects,
  onSubjectChange,
  onCapture,
  onOpenPhoto,
  onToggleTorch,
  torchEnabled = false,
  titleMode = 'pill',
  focusRect = { widthPct: 0.8, aspect: 3/1, cornerRadius: 14 },
  hideSubjects = false,
}: CameraSubjectOverlayProps) {
  const [activeSubject, setActiveSubject] = useState(subjects[0]);
  const [themeColor, setThemeColor] = useState(subjects[0].color);
  const [activeIndex, setActiveIndex] = useState(0);

  // PanResponder for swipe anywhere functionality
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only handle if it's a horizontal swipe and not too fast (to avoid interfering with FlatList)
      const { dx, dy, vx } = gestureState;
      return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10 && Math.abs(vx) < 2;
    },
    onPanResponderGrant: () => {
      // Prevent FlatList from scrolling
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const threshold = 50;
      
      if (Math.abs(dx) > threshold) {
        if (dx > 0 && activeIndex > 0) {
          // Swipe right - go to previous subject
          const prevIndex = activeIndex - 1;
          const prevSubject = subjects[prevIndex];
          setActiveIndex(prevIndex);
          setActiveSubject(prevSubject);
          onSubjectChange?.(prevSubject);
        } else if (dx < 0 && activeIndex < subjects.length - 1) {
          // Swipe left - go to next subject
          const nextIndex = activeIndex + 1;
          const nextSubject = subjects[nextIndex];
          setActiveIndex(nextIndex);
          setActiveSubject(nextSubject);
          onSubjectChange?.(nextSubject);
        }
      }
    },
  });

  const handleSubjectChange = useCallback((subject: Subject, index: number) => {
    setActiveSubject(subject);
    setActiveIndex(index);
    onSubjectChange?.(subject);
  }, [onSubjectChange]);

  const handleThemeChange = useCallback((color: string) => {
    setThemeColor(color);
  }, []);

  const handleCapture = useCallback(() => {
    onCapture?.(activeSubject);
  }, [activeSubject, onCapture]);

  const shutterStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: themeColor,
      shadowColor: themeColor,
    };
  });

    return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Logo at top middle */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Focus Overlay */}
      <FocusOverlay 
        widthPct={focusRect.widthPct}
        aspect={focusRect.aspect}
        cornerRadius={focusRect.cornerRadius}
        dash={{ length: 20, gap: 10, color: '#FFFFFF', width: 4 }}
        hint="Align the question inside the box"
      />

      {/* Subject Slider positioned above camera button */}
      {!hideSubjects && (
        <View style={styles.subjectSliderContainer}>
          <SubjectSlider
            subjects={subjects}
            initialIndex={0}
            activeIndex={activeIndex}
            onChange={handleSubjectChange}
            onTheme={handleThemeChange}
          />
        </View>
      )}

      {/* Shutter button with side controls */}
      <View style={styles.shutterContainer}>
        {/* Photo button - left of camera */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onOpenPhoto}
          activeOpacity={0.8}
        >
          <ImageIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Main shutter button */}
        <Animated.View style={[styles.shutterButton, shutterStyle]}>
          <TouchableOpacity
            style={styles.shutterTouchable}
            onPress={handleCapture}
            activeOpacity={0.8}
          >
            <Image 
              source={require('../assets/images/snap.png')} 
              style={styles.shutterImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Torch button - right of camera */}
        <TouchableOpacity
          style={styles.sideButton}
          onPress={onToggleTorch}
          activeOpacity={0.8}
        >
          <Zap size={20} color={torchEnabled ? "#FFD700" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  subjectSliderContainer: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },

  shutterContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },


  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  shutterImage: {
    width: 100,
    height: 100,
    zIndex: 10,
  },
  shutterTouchable: {
    width: 120,
    height: 120,
    borderRadius: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
});
