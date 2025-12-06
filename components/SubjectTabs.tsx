import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export interface Subject {
  key: string;
  name: string;
  color: string;
  icon: string;
}

interface SubjectTabsProps {
  subjects: Subject[];
  initialIndex?: number;
  onChange?: (subject: Subject, index: number) => void;
  size?: 'sm' | 'md' | 'lg';
  stickyCenter?: boolean;
  showAll?: boolean;
  style?: any;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function SubjectTabs({
  subjects,
  initialIndex = 0,
  onChange,
  size = 'md',
  stickyCenter = true,
  showAll = true,
  style,
}: SubjectTabsProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleNextSubject = useCallback(() => {
    const nextIndex = (currentIndex + 1) % subjects.length;
    setCurrentIndex(nextIndex);
    onChange?.(subjects[nextIndex], nextIndex);
  }, [currentIndex, subjects, onChange]);

  const handlePrevSubject = useCallback(() => {
    const prevIndex = currentIndex === 0 ? subjects.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onChange?.(subjects[prevIndex], prevIndex);
  }, [currentIndex, subjects, onChange]);

  const handleSubjectPress = useCallback((index: number) => {
    setCurrentIndex(index);
    onChange?.(subjects[index], index);
  }, [subjects, onChange]);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.subjectDisplay}>
        <Text style={styles.subjectText}>
          {subjects[currentIndex].name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 60,
  },
  subjectDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
  },
});
