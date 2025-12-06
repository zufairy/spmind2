import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface QuestionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  text: string;
}

interface QuestionDetectionOverlayProps {
  detectedQuestions: QuestionBox[];
  selectedQuestion: QuestionBox | null;
  onQuestionSelect: (question: QuestionBox) => void;
  isProcessing: boolean;
}

export default function QuestionDetectionOverlay({
  detectedQuestions,
  selectedQuestion,
  onQuestionSelect,
  isProcessing,
}: QuestionDetectionOverlayProps) {
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (isProcessing) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withSpring(1.1, { damping: 2, stiffness: 80 }),
          withSpring(1, { damping: 2, stiffness: 80 })
        ),
        -1,
        true
      );
    } else {
      pulseAnimation.value = withSpring(1);
    }
  }, [isProcessing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  return (
    <View style={styles.overlay}>
      {detectedQuestions.map((question) => {
        const isSelected = selectedQuestion?.id === question.id;
        
        return (
          <Animated.View
            key={question.id}
            style={[
              styles.questionBox,
              {
                left: question.x * screenWidth,
                top: question.y * screenHeight,
                width: question.width * screenWidth,
                height: question.height * screenHeight,
                borderColor: isSelected ? '#00FF00' : '#FF6B6B',
                borderWidth: isSelected ? 3 : 2,
              },
              isSelected && animatedStyle,
            ]}
          >
            <View style={styles.cornerIndicator} />
            <View style={[styles.cornerIndicator, styles.topRight]} />
            <View style={[styles.cornerIndicator, styles.bottomLeft]} />
            <View style={[styles.cornerIndicator, styles.bottomRight]} />
            
            {isSelected && (
              <View style={styles.confidenceBadge}>
                <Animated.Text style={styles.confidenceText}>
                  {Math.round(question.confidence * 100)}%
                </Animated.Text>
              </View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  questionBox: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  cornerIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00FF00',
    top: -2,
    left: -2,
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    top: 'auto',
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    top: 'auto',
    bottom: -2,
    right: -2,
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  confidenceBadge: {
    position: 'absolute',
    top: -30,
    right: -10,
    backgroundColor: '#00FF00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
