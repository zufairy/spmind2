import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { X, Sparkles, Copy, Share2 } from 'lucide-react-native';
import AnimatedText from './AnimatedText';

interface AIAnswerPopupProps {
  isVisible: boolean;
  onClose: () => void;
  question: string;
  answer: string;
  isLoading: boolean;
  croppedImage?: string;
}

export default function AIAnswerPopup({
  isVisible,
  onClose,
  question,
  answer,
  isLoading,
  croppedImage,
}: AIAnswerPopupProps) {
  const translateY = useSharedValue(1000);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    if (isVisible) {
      opacity.value = withSpring(1);
      translateY.value = withSpring(0, { damping: 20, stiffness: 100 });
      scale.value = withSpring(1, { damping: 20, stiffness: 100 });
    } else {
      opacity.value = withTiming(0);
      translateY.value = withTiming(1000);
      scale.value = withTiming(0.8);
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleCopyAnswer = () => {
    // Copy to clipboard functionality
    console.log('Copy answer');
  };

  const handleShareAnswer = () => {
    // Share functionality
    console.log('Share answer');
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      
      <Animated.View style={[styles.popup, popupStyle]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Sparkles size={20} color="#00FF00" />
            <Animated.Text style={styles.title}>AI Answer</Animated.Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.questionSection}>
            <Animated.Text style={styles.sectionTitle}>Question</Animated.Text>
            <View style={styles.questionContainer}>
              <Animated.Text style={styles.questionText}>{question}</Animated.Text>
            </View>
          </View>

          <View style={styles.answerSection}>
            <Animated.Text style={styles.sectionTitle}>Answer</Animated.Text>
            <View style={styles.answerContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={styles.loadingDot} />
                  <Animated.Text style={styles.loadingText}>
                    Processing your question...
                  </Animated.Text>
                </View>
              ) : (
                <AnimatedText
                  text={answer}
                  style={styles.answerText}
                  maxWordsPerChunk={30}
                />
              )}
            </View>
          </View>
        </ScrollView>

        {!isLoading && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyAnswer}
              activeOpacity={0.7}
            >
              <Copy size={16} color="#666666" />
              <Animated.Text style={styles.actionText}>Copy</Animated.Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleShareAnswer}
              activeOpacity={0.7}
            >
              <Share2 size={16} color="#666666" />
              <Animated.Text style={styles.actionText}>Share</Animated.Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  popup: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  questionSection: {
    marginBottom: 20,
  },
  answerSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  questionContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  questionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  answerContainer: {
    backgroundColor: '#F0FFF0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00FF00',
  },
  answerText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  actionText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter-Medium',
  },
});
