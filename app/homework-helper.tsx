import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, BookOpen, Lightbulb, CheckCircle, Clock, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { aiService } from '../services/aiService';

// Optional math view import with fallback
let MathView: any = null;
try {
  // Try default export first
  const mathViewModule = require('react-native-math-view');
  MathView = mathViewModule.default || mathViewModule.MathView || mathViewModule;
} catch (e) {
  console.warn('react-native-math-view not available, using fallback:', e);
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SolutionStep {
  id: number;
  title: string;
  description: string;
  type: 'step' | 'tip' | 'explanation';
  katex?: string;
  subject?: string;
}

interface SolutionExplanation {
  type: 'explanation';
  content: string;
  subject: string;
}

type ProcessingState = 'extracting' | 'solving' | 'completed' | 'error';

export default function HomeworkHelper() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Start as false for immediate display
  const [isProcessing, setIsProcessing] = useState(false); // Track AI processing state
  const [solution, setSolution] = useState<SolutionStep[]>([]);
  const [explanation, setExplanation] = useState<SolutionExplanation | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [imageUri, setImageUri] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [processingState, setProcessingState] = useState<ProcessingState>('extracting');
  const [extractedQuestion, setExtractedQuestion] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [detectedSubject, setDetectedSubject] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [syllabusAlignment, setSyllabusAlignment] = useState<boolean>(true);
  const [syllabusNote, setSyllabusNote] = useState<string>('');
  const [processingType, setProcessingType] = useState<'text' | 'visual' | 'hybrid'>('text');
  const [sliderValue, setSliderValue] = useState<number>(0.5); // Default to Balanced (0.5)
  const sliderAnimValue = useRef(new Animated.Value(0.5)).current;
  const [imageHeight, setImageHeight] = useState<number>(220); // Dynamic image height
  const [isGeneratingDetail, setIsGeneratingDetail] = useState(false);
  const [detailedExplanation, setDetailedExplanation] = useState<string>('');
  const sliderWidthRef = useRef<number>(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Helper function to determine if a question is a calculation
  const isCalculationQuestion = (question: string, subject: string): boolean => {
    if (!question) return false;
    
    const lowerQuestion = question.toLowerCase();
    
    // Check for mathematical calculation keywords
    const calculationKeywords = [
      // English
      'calculate', 'solve', 'find', 'compute', 'work out', 'figure out',
      'equation', 'formula', 'algebra', 'geometry', 'trigonometry', 'calculus',
      'plus', 'minus', 'multiply', 'divide', 'add', 'subtract', 'times',
      'equals', 'result', 'answer', 'sum', 'difference', 'product', 'quotient',
      // Malay
      'kira', 'hitung', 'cari', 'selesaikan', 'tambah', 'tolak', 'darab', 'bahagi',
      'persamaan', 'formula', 'algebra', 'geometri', 'trigonometri', 'kalkulus',
      'sama dengan', 'hasil', 'jawapan', 'jumlah', 'beza', 'hasil darab', 'hasil bahagi',
      // Mathematical symbols
      '=', '+', '-', '×', '÷', 'x²', '√', 'π', '∞'
    ];
    
    // Check if question contains calculation keywords
    const hasCalculationKeywords = calculationKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );
    
    // Check for mathematical expressions (numbers with operators)
    const hasMathExpressions = /[\d\s+\-×÷=()]+/.test(question);
    
    // Check for step-by-step process indicators
    const hasStepIndicators = lowerQuestion.includes('step') || 
                             lowerQuestion.includes('langkah') ||
                             lowerQuestion.includes('working') ||
                             lowerQuestion.includes('jalan kerja');
    
    // Only return true for actual mathematical calculations
    return (hasCalculationKeywords && hasMathExpressions) || 
           (subject === 'mathematics' || subject === 'math' || subject === 'matematik');
  };

  // Helper function to render math expressions
  const renderMathExpression = (text: string) => {
    // Extract LaTeX expressions from text
    const latexRegex = /\\\(([^)]+)\\\)/g;
    const parts = text.split(latexRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a LaTeX expression
        if (MathView) {
          return (
            <MathView
              key={index}
              math={part}
              style={styles.mathExpression}
            />
          );
        } else {
          // Fallback: render as plain text with formatting
          return (
            <Text key={index} style={[styles.stepDescription, styles.mathFallback]}>
              {part}
            </Text>
          );
        }
      } else {
        // This is regular text
        return <Text key={index} style={styles.stepDescription}>{part}</Text>;
      }
    });
  };

  // Helper function to parse bold markdown (**text**) and render as actual bold
  const parseBoldText = (text: string, baseStyle: any) => {
    if (!text) return null;
    
    // Split by **text** pattern
    const parts = text.split(/\*\*(.*?)\*\*/g);
    
    return (
      <Text style={baseStyle}>
        {parts.map((part, index) => {
          // Odd indices are bold content
          if (index % 2 === 1) {
            return (
              <Text key={index} style={{ fontWeight: '700', fontFamily: 'SpaceGrotesk-Bold' }}>
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  useEffect(() => {
    // Get parameters from navigation
    if (params.imageUri) {
      const uri = params.imageUri as string;
      console.log('📸 Homework Helper received image URI:', uri);
      setImageUri(uri);
      
      // Get image dimensions to set dynamic height
      Image.getSize(uri, (width, height) => {
        // Calculate aspect ratio and set appropriate height
        const aspectRatio = width / height;
        const containerWidth = screenWidth - 56; // Account for padding
        const calculatedHeight = containerWidth / aspectRatio;
        // Set height with min/max constraints
        const finalHeight = Math.max(180, Math.min(400, calculatedHeight));
        setImageHeight(finalHeight);
      }, (error) => {
        console.log('Error getting image size:', error);
        // Keep default height on error
      });
      
      // Start AI processing immediately with Detailed level (always generate full answer)
      processImageWithDetailLevel(uri, 'detailed');
    } else {
      console.error('❌ No image URI received in params');
    }
    
    if (params.subject) {
      setSubject(params.subject as string);
    }

    // Trigger animation immediately when image loads
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const processImageWithDetailLevel = async (imageUriParam: string, detailLevelOverride: 'simple' | 'balanced' | 'detailed', retryCount = 0) => {
    try {
      const currentImageUri = imageUriParam || imageUri;
      
      setIsProcessing(true);
      setProcessingState('extracting');
      setError('');
      
      if (!currentImageUri || currentImageUri.trim() === '') {
        console.log('ERROR: No imageUri available for processing');
        setError('No image provided for processing');
        setProcessingState('error');
        setIsProcessing(false);
        return;
      }
      
      // Use provided detail level
      const detailLevel = detailLevelOverride;
      
      // Use new NDJSON streaming approach for instant response
      await aiService.sendMessageWithImageNDJSON(
        currentImageUri,
        detailLevel,
        (ndjsonObj: any) => {
          if (ndjsonObj.type === 'meta') {
            setExtractedQuestion(ndjsonObj.recognized_question);
            setDetectedSubject(ndjsonObj.detected_subject);
            setDetectedLanguage(ndjsonObj.language);
            setProcessingType(ndjsonObj.processing_type || 'text');
            setProcessingState('solving');
          } else if (ndjsonObj.type === 'step') {
            // Convert NDJSON step to SolutionStep format
            const solutionStep: SolutionStep = {
              id: ndjsonObj.index,
              title: `Step ${ndjsonObj.index}`,
              description: ndjsonObj.content || 'No content available',
              type: 'step',
              katex: ndjsonObj.katex,
              subject: detectedSubject
            };
            setSolution(prev => {
              const newSolution = [...prev, solutionStep];
              // Auto-scroll to bottom when new step arrives
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
              return newSolution;
            });
          } else if (ndjsonObj.type === 'explanation') {
            console.log('Explanation object received:', ndjsonObj);
            const solutionExplanation: SolutionExplanation = {
              type: 'explanation',
              content: ndjsonObj.content || 'No content available',
              subject: ndjsonObj.subject || detectedSubject
            };
            setExplanation(solutionExplanation);
            // Auto-scroll to bottom when explanation arrives
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } else if (ndjsonObj.type === 'final') {
            setSyllabusAlignment(ndjsonObj.syllabus_alignment);
            setSyllabusNote(ndjsonObj.syllabus_note);
            setProcessingState('completed');
            setIsProcessing(false);
          }
        },
        () => {
          setProcessingState('completed');
          setIsProcessing(false);
        },
        (error: string) => {
          console.error('NDJSON streaming error:', error);
          
        // If it's an image format error and we haven't retried yet, try once more
        if (retryCount < 1 && (error.includes('unsupported image') || error.includes('Invalid MIME type') || error.includes('Image format not supported'))) {
          setTimeout(() => processImageWithDetailLevel(currentImageUri, detailLevel, retryCount + 1), 1000);
          return;
        }
          
          // Show a more helpful error message
          if (error.includes('Image format not supported')) {
            setError('The image format is not supported. Please try taking a clearer photo or use a different image.');
          } else {
            setError('Sorry, I couldn\'t solve this question. Please try again or ask in chat.');
          }
          setProcessingState('error');
          setIsProcessing(false);
        }
      );
      
    } catch (error: any) {
      console.error('Error processing image:', error);
      
    // If it's an image format error and we haven't retried yet, try once more
    if (retryCount < 1 && (error?.message?.includes('unsupported image') || error?.message?.includes('Invalid MIME type') || error?.message?.includes('Image format not supported'))) {
      const currentDetailLevel = detailLevelOverride;
      setTimeout(() => processImageWithDetailLevel(imageUriParam || imageUri, currentDetailLevel, retryCount + 1), 1000);
      return;
    }
      
      setError('Sorry, I couldn\'t solve this question. Please try again or ask in chat.');
      setProcessingState('error');
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setSolution([]);
    setExplanation(null);
    setError('');
    // Don't clear extractedQuestion - keep the recognized question
    const detailLevel = sliderValue < 0.33 ? 'simple' : sliderValue < 0.66 ? 'balanced' : 'detailed';
    processImageWithDetailLevel(imageUri, detailLevel, 0);
  };

  const testAIService = async () => {
    try {
      const testQuestion = "What is 2 + 2?";
      const result = await aiService.testSolutionGeneration(testQuestion);
      
      // Create a test step
      const testStep: any = {
        id: 1,
        title: 'Solution',
        description: result,
        type: 'step' as const,
        katex: null,
        subject: detectedSubject
      };
      setSolution([testStep]);
      setProcessingState('completed');
      setIsProcessing(false);
    } catch (error: any) {
      console.error('AI Service Test Error:', error);
      setError('AI Service test failed: ' + (error?.message ?? 'Unknown error'));
    }
  };

  const generateNonStreamingSolution = async (question: string) => {
    try {
      const response = await aiService.sendMessageWithImage(
        `Solve this question step by step: ${question}`,
        imageUri
      );
      
      // Parse the response into steps
      const steps = parseSolutionIntoSteps(response);
      setSolution(steps);
      setProcessingState('completed');
      setIsLoading(false);
    } catch (error: any) {
      console.error('Non-streaming solution failed:', error);
      setError('Sorry, I couldn\'t solve this question. Please try again or ask in chat.');
      setProcessingState('error');
      setIsLoading(false);
    }
  };

  const parseSolutionIntoSteps = (response: string): SolutionStep[] => {
    // Simple parsing - in a real app, you'd want more sophisticated parsing
    const lines = response.split('\n').filter(line => line.trim());
    const steps: SolutionStep[] = [];
    let stepId = 1;

    lines.forEach((line, index) => {
      if (line.match(/^\d+\./)) {
        // Numbered step
        steps.push({
          id: stepId++,
          title: line.replace(/^\d+\.\s*/, ''),
          description: lines[index + 1] || 'Follow this step carefully.',
          type: 'step'
        });
      } else if (line.toLowerCase().includes('tip') || line.toLowerCase().includes('hint')) {
        // Tip
        steps.push({
          id: stepId++,
          title: 'Helpful Tip',
          description: line,
          type: 'tip'
        });
      } else if (line.toLowerCase().includes('explain') || line.toLowerCase().includes('understand')) {
        // Explanation
        steps.push({
          id: stepId++,
          title: 'Understanding',
          description: line,
          type: 'explanation'
        });
      }
    });

    return steps.length > 0 ? steps : [
      {
        id: 1,
        title: 'Solution',
        description: response,
        type: 'step'
      }
    ];
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Lightbulb size={20} color="#FFD700" />;
      case 'explanation':
        return <BookOpen size={20} color="#4CAF50" />;
      default:
        return <CheckCircle size={20} color="#2196F3" />;
    }
  };

  const getStepColor = (type: string): [string, string] => {
    switch (type) {
      case 'tip':
        return ['#FFD700', '#FFA000'];
      case 'explanation':
        return ['#4CAF50', '#2E7D32'];
      default:
        return ['#2196F3', '#1976D2'];
    }
  };

  const getLoadingText = () => {
    switch (processingState) {
      case 'extracting':
        return processingType === 'visual' ? 'Analyzing visual question...' : 'Extracting question...';
      case 'solving':
        return processingType === 'visual' ? 'Analyzing image...' : 'Generating solution...';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Processing...';
    }
  };

  const getLoadingSubtext = () => {
    switch (processingState) {
      case 'extracting':
        return processingType === 'visual' 
          ? 'Examining image content and visual elements' 
          : processingType === 'hybrid'
          ? 'Reading text and analyzing visual elements'
          : 'Reading text from your image';
      case 'solving':
        return processingType === 'visual' 
          ? 'Providing comprehensive visual analysis' 
          : processingType === 'hybrid'
          ? 'Combining text and visual analysis'
          : 'Creating step-by-step solution';
      case 'error':
        return 'Please try again';
      default:
        return 'Please wait';
    }
  };

  // Ensure slider defaults to balanced immediately
  useEffect(() => {
    // Force slider to balanced position on mount - both state and animation
    setSliderValue(0.5);
    sliderAnimValue.setValue(0.5);
  }, []);
  
  // Keep slider at balanced on layout measurement
  useEffect(() => {
    if (sliderWidthRef.current > 0) {
      // Ensure animation value matches state
      if (Math.abs(sliderValue - 0.5) < 0.01) {
        sliderAnimValue.setValue(0.5);
      }
    }
  }, [sliderWidthRef.current]);

  // Compose answer text based on slider detail level - filters the detailed answer
  const composeAnswerText = (value: number, explanationText: string, stepsArr: SolutionStep[]) => {
    const hasSteps = stepsArr && stepsArr.length > 0;
    
    if (!hasSteps && explanationText) {
      if (value < 0.33) {
        // Simple: Extract key points and final answer only
        const lines = explanationText.split('\n').filter(l => l.trim());
        const sentences = explanationText.split(/[.!?]+/).filter(s => s.trim());
        
        // Find answer line or take first 2 sentences
        const answerLine = lines.find(l => /^(Jawapan|Answer|Final|Conclusion)\s*:/i.test(l));
        if (answerLine) return answerLine;
        
        // Take only first 2 sentences for simplicity
        return sentences.slice(0, 2).join('. ') + '.';
      } else if (value < 0.66) {
        // Balanced: Show about 50% of content with key points
        const lines = explanationText.split('\n').filter(l => l.trim());
        const sentences = explanationText.split(/[.!?]+/).filter(s => s.trim());
        
        // Take first half of sentences plus answer if present
        const halfLength = Math.ceil(sentences.length / 2);
        const answerLine = lines.find(l => /^(Jawapan|Answer|Final|Conclusion)\s*:/i.test(l));
        const mainContent = sentences.slice(0, halfLength).join('. ') + '.';
        
        return answerLine ? mainContent + '\n\n' + answerLine : mainContent;
      }
      // Detailed: full explanation (unchanged)
      return explanationText;
    }
    
    if (hasSteps) {
      if (value < 0.33) {
        // Simple: Show only first step and final answer
        const firstStep = stepsArr[0]?.description || '';
        const lastStep = stepsArr[stepsArr.length - 1]?.description || '';
        return `**Summary:**\n\n${firstStep}\n\n**Answer:** ${lastStep}`;
      } else if (value < 0.66) {
        // Balanced: Show first 3-4 steps (about 50% for typical 6-8 step solutions)
        const halfSteps = Math.min(4, Math.ceil(stepsArr.length / 2));
        return stepsArr.slice(0, halfSteps).map((s, i) => `**Step ${i + 1}:** ${s.description}`).join('\n\n');
      }
      // Detailed: all steps
      return stepsArr.map((s, i) => `**Step ${i + 1}:** ${s.description}`).join('\n\n');
    }
    
    return explanationText || '';
  };

  // Trigger detailed generation (local mock expansion for UX)
  const triggerDetailedGeneration = async () => {
    if (isGeneratingDetail || detailedExplanation) return;
    try {
      setIsGeneratingDetail(true);
      const base = (explanation?.content || solution.map(s => s.description).join('\n')) || '';
      const expanded = base + '\n\nPenerangan mendalam (SPM):\n- Konsep asas diterangkan secara menyeluruh.\n- Contoh tambahan dan tip peperiksaan ringkas disertakan.';
      setTimeout(() => {
        setDetailedExplanation(expanded);
        setIsGeneratingDetail(false);
      }, 800);
    } catch (e) {
      setIsGeneratingDetail(false);
    }
  };

    return (
      <View style={styles.container}>
        {/* Header with Background Image (match solver page) */}
        <View style={styles.headerWithBg}>
          <Image 
            source={require('../assets/images/bg.jpg')}
            style={styles.headerBackground}
            resizeMode="cover"
          />
          <View style={styles.headerBlurOverlay} />
          <View style={styles.headerContentRow}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
              <ArrowLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitleDark}>Homework Helper</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section - No Container */}
        {imageUri && (
          <Animated.View
            style={[
              styles.questionSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {imageUri && imageUri.trim() !== '' ? (
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.questionImageDirect, { height: imageHeight }]}
                  resizeMode="contain"
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
            ) : (
              <View style={[styles.questionImageDirect, styles.placeholderImage, { height: imageHeight }]}>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Recognized Question - hidden as requested */}
        {false && extractedQuestion && (
          <Animatable.View animation="fadeInUp" style={styles.questionContainer}>
            <Text style={styles.questionTitle}>Recognized Question</Text>
            <Text style={styles.questionText}>{extractedQuestion}</Text>
          </Animatable.View>
        )}

        {/* Immediate Placeholder - Show while AI processes in background */}
        {imageUri && isProcessing && !extractedQuestion && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.statusText}>{getLoadingText()}</Text>
            <Text style={styles.statusSubtext}>{getLoadingSubtext()}</Text>
            </View>
        )}

        {/* Processing Status - Show while generating solution */}
        {isProcessing && extractedQuestion && solution.length === 0 && explanation === null && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.statusText}>{getLoadingText()}</Text>
            <Text style={styles.statusSubtext}>{getLoadingSubtext()}</Text>
          </View>
        )}

        {/* Solving Status */}
        {processingState === 'solving' && (
          <Animatable.View animation="pulse" iterationCount="infinite" duration={1200} style={styles.statusContainer}>
            <Animatable.View animation="fadeIn" duration={400} delay={0}>
              <ActivityIndicator size="large" color="#667eea" />
            </Animatable.View>
            <Animatable.Text animation="fadeInUp" duration={400} delay={150} style={styles.statusText}>{getLoadingText()}</Animatable.Text>
            <Animatable.Text animation="fadeInUp" duration={400} delay={300} style={styles.statusSubtext}>{getLoadingSubtext()}</Animatable.Text>
          </Animatable.View>
        )}

        {/* Error State */}
        {processingState === 'error' && (
          <Animatable.View animation="fadeInUp" style={styles.errorContainer}>
            <AlertCircle size={48} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* Test AI Service Button - Temporary for debugging */}
        {!isProcessing && solution.length === 0 && !explanation && (
          <Animatable.View animation="fadeInUp" delay={200} style={styles.testContainer}>
            <TouchableOpacity style={styles.testButton} onPress={testAIService}>
              <Text style={styles.testButtonText}>Test AI Service</Text>
            </TouchableOpacity>
          </Animatable.View>
        )}

        {/* Slider for explanation detail */}
        {(explanation || solution.length > 0) && (
            <View style={styles.sliderContainer}>
              <View 
                style={styles.sliderInnerContainer}
                onLayout={(e) => { 
                  const trackWidth = e.nativeEvent.layout.width;
                  sliderWidthRef.current = trackWidth - 18; // Account for smaller thumb size
                }}
              >
                <View style={styles.sliderTrack}
                onStartShouldSetResponder={() => true}
                onResponderGrant={(e) => {
                  if (sliderWidthRef.current <= 0) return;
                  const x = Math.max(0, Math.min(e.nativeEvent.locationX - 9, sliderWidthRef.current));
                  const value = x / sliderWidthRef.current;
                  
                  // Instant snap on touch
                  sliderAnimValue.setValue(value);
                  setSliderValue(value);
                }}
                onResponderMove={(e) => {
                  if (sliderWidthRef.current <= 0) return;
                  const x = Math.max(0, Math.min(e.nativeEvent.locationX - 9, sliderWidthRef.current));
                  let value = x / sliderWidthRef.current;
                  
                  // Smart snapping: snap when crossing halfway point
                  let snappedValue = value;
                  if (value < 0.17) {
                    snappedValue = 0; // Snap to Simple
                  } else if (value >= 0.17 && value < 0.33) {
                    snappedValue = value < 0.25 ? 0 : 0.5; // Snap when crossing 0.25
                  } else if (value >= 0.33 && value < 0.67) {
                    snappedValue = 0.5; // Stay at Balanced
                  } else if (value >= 0.67 && value < 0.83) {
                    snappedValue = value < 0.75 ? 0.5 : 1; // Snap when crossing 0.75
                  } else {
                    snappedValue = 1; // Snap to Detailed
                  }
                  
                  // Instant response - no animation delay
                  sliderAnimValue.setValue(snappedValue);
                  setSliderValue(snappedValue);
                }}
                onResponderRelease={() => {
                  // Final snap to nearest position
                  let snappedValue = sliderValue;
                  if (sliderValue < 0.33) snappedValue = 0;
                  else if (sliderValue < 0.67) snappedValue = 0.5;
                  else snappedValue = 1;
                  
                  // Quick spring for final position
                  Animated.spring(sliderAnimValue, {
                    toValue: snappedValue,
                    useNativeDriver: false,
                    friction: 8,
                    tension: 200,
                    velocity: 10,
                  }).start();
                  
                  setSliderValue(snappedValue);
                  
                  // No need to re-process - just update display filtering
                  // The answer is already generated in full detail
                }}
              >
                <Animated.View style={[styles.sliderFill, { 
                  width: sliderWidthRef.current > 0 ? sliderAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [9, sliderWidthRef.current + 9],
                  }) : 9,
                }]} />
                <Animated.View style={[styles.sliderThumb, { 
                  left: sliderWidthRef.current > 0 ? sliderAnimValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, sliderWidthRef.current],
                  }) : 0,
                }]}>
                  <ChevronLeft size={10} color="#FFFFFF" strokeWidth={3} />
                  <ChevronRight size={10} color="#FFFFFF" strokeWidth={3} />
                </Animated.View>
              </View>
              <View style={styles.sliderLabelsRow}>
                <Text style={[styles.sliderLabel, sliderValue < 0.25 && styles.sliderLabelActive]}>Simple</Text>
                <Text style={[styles.sliderLabel, sliderValue >= 0.25 && sliderValue < 0.75 && styles.sliderLabelActive]}>Balanced</Text>
                <Text style={[styles.sliderLabel, sliderValue >= 0.75 && styles.sliderLabelActive]}>Detailed</Text>
              </View>
              </View>
            </View>
        )}

        {/* Unified Answer Container */}
        {(explanation || solution.length > 0) && (
          <View style={styles.solutionContainer}>
            <Animatable.View animation="fadeInUp" delay={300}>
              <Text style={styles.solutionTitle}>Answer</Text>
              <Text style={styles.solutionSubtitle}>Optimized to Malaysian KSSR/KSSM • SPM context</Text>
            </Animatable.View>

            <Animatable.View animation="fadeInUp" delay={500} style={styles.explanationContainerDark}>
              {parseBoldText(
                composeAnswerText(sliderValue, explanation?.content || '', solution),
                styles.explanationTextDark
              )}
            </Animatable.View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerWithBg: {
    position: 'relative',
    overflow: 'hidden',
    height: 95,
    zIndex: 100,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 2,
    pointerEvents: 'none',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 200,
    pointerEvents: 'box-none',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  loadingContent: {
    flex: 1,
    padding: 20,
  },
  loadingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingSteps: {
    marginTop: 40,
    width: '100%',
  },
  loadingStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingStepText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
  },
  loadingSubtext: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    marginTop: 8,
  },
  headerDark: {
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleDark: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  headerSubtitleDark: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  content: {
    flex: 1,
    paddingTop: 0,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  questionSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  questionSectionTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  imageCardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imageContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  imageFrameDashed: {
    margin: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.8)'
  },
  imageInnerPadding: {
    padding: 10,
    borderRadius: 12,
  },
  questionImage: {
    width: '100%',
    borderRadius: 16,
  },
  questionImageDirect: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  imageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  solutionContainer: {
    padding: 20,
    flex: 1,
  },
  solutionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  solutionSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Math Steps - Natural Display
  stepContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  stepGradient: {
    padding: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    opacity: 0.9,
    marginBottom: 4,
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  stepDescription: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.95,
  },
  stepContent: {
    marginTop: 12,
    paddingLeft: 4,
  },
  mathExpression: {
    fontSize: 18,
    color: '#FFFFFF',
    marginVertical: 6,
    lineHeight: 26,
  },
  mathFallback: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginVertical: 4,
    fontSize: 15,
    color: '#FFFFFF',
  },
  // Non-Math Explanation - Single Comprehensive Section
  explanationContainerDark: {
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  explanationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  explanationTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 28,
  },
  // Explanation - Natural Display
  explanationTextDark: {
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 24,
  },
  sliderContainer: {
    paddingHorizontal: 80,
    marginTop: 0,
    marginBottom: 12,
  },
  sliderInnerContainer: {
    width: '100%',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  sliderThumb: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF8C00',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#FF8C00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 6,
    top: -6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: -2,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  sliderLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    opacity: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  sliderLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    opacity: 1,
  },
  testContainer: {
    margin: 20,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: '#0B0B0B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0B0B0B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center'
  },
  segmentActive: {
    backgroundColor: '#111827',
    borderColor: 'rgba(255,255,255,0.18)'
  },
  segmentText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  segmentTextActive: {
    color: '#FFFFFF'
  },
  questionContainer: {
    margin: 20,
    padding: 16,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
