import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  withSpring,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import SubjectTabs, { Subject } from './SubjectTabs';

const { width: screenWidth } = Dimensions.get('window');

interface SolverSubjectHeaderProps {
  subjects: Subject[];
  activeIndex?: number;
  onChange?: (subject: Subject) => void;
}

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function SolverSubjectHeader({
  subjects,
  activeIndex = 0,
  onChange,
}: SolverSubjectHeaderProps) {
  const [currentActiveIndex, setCurrentActiveIndex] = useState(activeIndex);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const activeIndexValue = useSharedValue(activeIndex);

  const itemWidth = 140; // Fixed width for header tabs
  const itemHeight = 56;

  const handleSubjectChange = useCallback((subject: Subject, index: number) => {
    setCurrentActiveIndex(index);
    activeIndexValue.value = withSpring(index, {
      stiffness: 300,
      damping: 30,
    });
    onChange?.(subject);
  }, [onChange]);

  const handleScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScrollEnd = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    const index = Math.round(contentOffset.x / itemWidth);
    if (index !== currentActiveIndex && index >= 0 && index < subjects.length) {
      setCurrentActiveIndex(index);
      activeIndexValue.value = withSpring(index, {
        stiffness: 300,
        damping: 30,
      });
      onChange?.(subjects[index]);
    }
  }, [subjects, itemWidth, onChange, currentActiveIndex]);

  const highlightStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      activeIndexValue.value,
      [0, subjects.length - 1],
      [0, (subjects.length - 1) * itemWidth],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

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
        pagingEnabled={false}
        snapToAlignment="center"
      >
        {subjects.map((subject, index) => (
          <TouchableOpacity
            key={subject.key}
            style={[
              styles.subjectTab,
              {
                width: itemWidth,
                height: itemHeight,
              },
            ]}
            onPress={() => handleSubjectChange(subject, index)}
            activeOpacity={0.8}
          >
            <Text style={styles.subjectIcon}>{subject.icon}</Text>
            <Text style={styles.subjectName}>{subject.name}</Text>
          </TouchableOpacity>
        ))}
      </AnimatedScrollView>
      
      {/* Animated highlight background */}
      <Animated.View
        style={[
          styles.highlightBackground,
          {
            width: itemWidth,
            height: itemHeight,
          },
          highlightStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 70,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 7,
  },
  subjectTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 2,
    backgroundColor: 'transparent',
    marginHorizontal: 4,
  },
  subjectIcon: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  subjectName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  highlightBackground: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1,
  },
});
