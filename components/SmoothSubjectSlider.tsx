import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  withSpring,
  Extrapolation,
} from 'react-native-reanimated';
import { Subject } from './SubjectTabs';

const { width: screenWidth } = Dimensions.get('window');

interface SmoothSubjectSliderProps {
  subjects: Subject[];
  activeIndex: number;
  onSubjectChange: (subject: Subject, index: number) => void;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function SmoothSubjectSlider({
  subjects,
  activeIndex,
  onSubjectChange,
}: SmoothSubjectSliderProps) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);

  const itemWidth = 120;
  const itemHeight = 50;

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleSubjectPress = useCallback((index: number) => {
    if (scrollRef.current) {
      const offset = index * itemWidth;
      scrollRef.current.scrollTo({ x: offset, animated: true });
      onSubjectChange(subjects[index], index);
    }
  }, [subjects, onSubjectChange]);

  const handleScrollEnd = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / itemWidth);
    if (index >= 0 && index < subjects.length) {
      onSubjectChange(subjects[index], index);
    }
  }, [subjects, onSubjectChange]);

  return (
    <View style={styles.container}>
      <AnimatedScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: (screenWidth - itemWidth) / 2 }
        ]}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={itemWidth}
        decelerationRate={0.8}
        bounces={false}
        snapToAlignment="center"
      >
        {subjects.map((subject, index) => (
          <TouchableOpacity
            key={subject.key}
            style={[
              styles.subjectItem,
              {
                width: itemWidth,
                height: itemHeight,
              },
            ]}
            onPress={() => handleSubjectPress(index)}
            activeOpacity={0.8}
          >
            <Text style={styles.subjectText}>
              {subject.name}
            </Text>
          </TouchableOpacity>
        ))}
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 30,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  subjectItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  subjectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
