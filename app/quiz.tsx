import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, ImageBackground, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Globe, Settings, Play, Clock, Trophy, Star, CheckCircle, XCircle, ArrowLeft, Camera, MessageSquare, Mic, MicOff, Sparkles } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';
import { getQuestionsBySubject, getSubjectDisplayName, Question } from '../data/quizQuestions';
import { aiService } from '../services/aiService';
import { elevenLabsVoiceService } from '../services/googleVoiceService';

const { width } = Dimensions.get('window');

interface QuizState {
  currentQuestion: number;
  score: number;
  timeLeft: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  showResult: boolean;
  isQuizComplete: boolean;
}

export default function QuizScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const selectedSubject = (params.subject as string) || 'maths';
  
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ms'>('en');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    score: 0,
    timeLeft: 30,
    selectedAnswer: null,
    isAnswered: false,
    showResult: false,
    isQuizComplete: false
  });
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Bottom controls states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);

  // Load questions based on selected subject
  useEffect(() => {
    const subjectQuestions = getQuestionsBySubject(selectedSubject, 3);
    setQuestions(subjectQuestions);
    if (subjectQuestions.length > 0) {
      setQuizState(prev => ({
        ...prev,
        timeLeft: subjectQuestions[0].timeLimit
      }));
    }
  }, [selectedSubject]);

  // Set language in voice service when it changes
  useEffect(() => {
    elevenLabsVoiceService.setLanguage(currentLanguage);
  }, [currentLanguage]);

  const currentQuestion = questions[quizState.currentQuestion];

  useEffect(() => {
    if (isQuizStarted && !quizState.isAnswered && quizState.timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setQuizState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (quizState.timeLeft === 0 && !quizState.isAnswered) {
      handleTimeUp();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [quizState.timeLeft, isQuizStarted, quizState.isAnswered]);

  const handleLanguageChange = (newLanguage: 'en' | 'ms') => {
    setCurrentLanguage(newLanguage);
  };

  const handleBackToHome = () => {
    router.back();
  };

  const handleHomework = () => {
    router.push('/homework-helper');
  };

  const handleChatPopup = () => {
    router.push('/chat');
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      // Use the specified voice ID for better audio quality
      const speechResponse = await elevenLabsVoiceService.generateSpeech(text, 'Wc6X61hTD7yucJMheuLN');
      if (speechResponse.success && speechResponse.audioUrl) {
        setIsAITalking(true);
        
        // Play the speech
        await elevenLabsVoiceService.playAudio(speechResponse.audioUrl);
        
        // Stop talking when speech ends
        setIsAITalking(false);
      }
    } catch (error) {
      console.error('Error generating/playing speech:', error);
      setIsAITalking(false);
    }
  };

  const handleMicPressIn = async () => {
    if (isProcessing || isAIProcessing) return;
    
    setIsRecording(true);
    setUserMessage('');
    
    try {
      await elevenLabsVoiceService.startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
    }
  };

  const handleMicPressOut = async () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      const recordingResult = await elevenLabsVoiceService.stopRecording();
      
      if (recordingResult.success && recordingResult.text) {
        const userText = recordingResult.text;
        setUserMessage(userText);
        
        // Add user message to conversation history
        const updatedHistory = [...conversationHistory, { role: 'user' as const, content: userText }];
        setConversationHistory(updatedHistory);
        
        // Use streaming for immediate response
        let currentResponse = '';
        let voiceGenerated = false;
        
        const streamResponse = await aiService.sendMessageStream(
          updatedHistory, 
          currentLanguage, 
          false,
          async (chunk: string, isComplete: boolean) => {
            currentResponse = chunk;
            setLastAIResponse(chunk);
            
            // Generate voice as soon as we have enough content (after first sentence or 50 characters)
            if (!voiceGenerated && (chunk.includes('.') || chunk.includes('!') || chunk.includes('?') || chunk.length > 50)) {
              voiceGenerated = true;
              await generateAndPlaySpeech(chunk);
            }
            
            if (isComplete) {
              // Add AI response to conversation history
              setConversationHistory([...updatedHistory, { role: 'assistant' as const, content: chunk }]);
            }
          }
        );
        
        if (!streamResponse.success) {
          console.error('Streaming failed, falling back to regular response');
          // Fallback to regular response
          const aiResponse = await aiService.sendMessage(updatedHistory, currentLanguage);
          
          if (aiResponse.success && aiResponse.message) {
            setLastAIResponse(aiResponse.message);
            setConversationHistory([...updatedHistory, { role: 'assistant' as const, content: aiResponse.message }]);
            await generateAndPlaySpeech(aiResponse.message);
          }
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startQuiz = () => {
    setIsQuizStarted(true);
    setQuizState(prev => ({
      ...prev,
      timeLeft: currentQuestion.timeLimit
    }));
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (quizState.isAnswered) return;

    setQuizState(prev => ({
      ...prev,
      selectedAnswer: answerIndex,
      isAnswered: true,
      showResult: true
    }));

    // Check if answer is correct
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    if (isCorrect) {
      setQuizState(prev => ({
        ...prev,
        score: prev.score + currentQuestion.points
      }));
    }

    // Show result for 3 seconds then move to next question
    setTimeout(() => {
      if (quizState.currentQuestion < questions.length - 1) {
        nextQuestion();
      } else {
        completeQuiz();
      }
    }, 3000);
  };

  const handleTimeUp = () => {
    setQuizState(prev => ({
      ...prev,
      isAnswered: true,
      showResult: true
    }));

    setTimeout(() => {
      if (quizState.currentQuestion < questions.length - 1) {
        nextQuestion();
      } else {
        completeQuiz();
      }
    }, 3000);
  };

  const nextQuestion = () => {
    setQuizState(prev => ({
      ...prev,
      currentQuestion: prev.currentQuestion + 1,
      timeLeft: questions[prev.currentQuestion + 1]?.timeLimit || 30,
      selectedAnswer: null,
      isAnswered: false,
      showResult: false
    }));
  };

  const completeQuiz = () => {
    setQuizState(prev => ({
      ...prev,
      isQuizComplete: true
    }));
    setShowLeaderboard(true);
  };

  const resetQuiz = () => {
    setQuizState({
      currentQuestion: 0,
      score: 0,
      timeLeft: 30,
      selectedAnswer: null,
      isAnswered: false,
      showResult: false,
      isQuizComplete: false
    });
    setIsQuizStarted(false);
    setShowLeaderboard(false);
  };

  const getOptionColor = (index: number) => {
    if (!quizState.showResult) {
      return ['#4A90E2', '#357ABD']; // Default blue
    }

    if (index === currentQuestion.correctAnswer) {
      return ['#4CAF50', '#2E7D32']; // Green for correct
    }

    if (index === quizState.selectedAnswer && index !== currentQuestion.correctAnswer) {
      return ['#F44336', '#D32F2F']; // Red for wrong
    }

    return ['#9E9E9E', '#757575']; // Gray for unselected
  };

  const getOptionIcon = (index: number) => {
    if (!quizState.showResult) return null;

    if (index === currentQuestion.correctAnswer) {
      return <CheckCircle size={24} color="#FFFFFF" />;
    }

    if (index === quizState.selectedAnswer && index !== currentQuestion.correctAnswer) {
      return <XCircle size={24} color="#FFFFFF" />;
    }

    return null;
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    backgroundImage: {
      backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
    },
    gradient: {
      backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
    gradientColors: isDark 
      ? ['rgba(20, 20, 20, 0.9)', 'rgba(30, 30, 30, 0.8)', 'rgba(25, 25, 25, 0.85)', 'rgba(20, 20, 20, 0.9)']
      : ['rgba(20, 20, 20, 0.9)', 'rgba(30, 30, 30, 0.8)', 'rgba(25, 25, 25, 0.85)', 'rgba(20, 20, 20, 0.9)'],
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    headerText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    languageText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Header with Background Image - Same as Community */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/bg.jpg')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <BlurView intensity={10} style={styles.headerBlurOverlay} />
        <View style={styles.headerContent}>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Memory Stretch - {getSubjectDisplayName(selectedSubject, currentLanguage)}
            </Text>
            <Text style={styles.headerSubtitle}>
              {questions.length} questions • {currentLanguage === 'ms' ? 'Tahap' : 'Level'}: {questions[0]?.level || 'KSSR'}
            </Text>
          </View>
        </View>
      </View>

      <ImageBackground 
        source={require('../assets/images/wall.jpg')} 
        style={[styles.backgroundImage, dynamicStyles.backgroundImage]}
        resizeMode="cover"
      >
        <LinearGradient
          colors={dynamicStyles.gradientColors}
          style={[styles.gradient, dynamicStyles.gradient]}
        >

          {/* User Message Display */}
          {userMessage && (
            <Animatable.View 
              animation="fadeIn" 
              style={styles.userMessageContainer}
              onAnimationEnd={() => {
                setTimeout(() => {
                  if (userMessage) {
                    setUserMessage('');
                  }
                }, 2000);
              }}
            >
              <Text style={styles.userMessageText}>"{userMessage}"</Text>
            </Animatable.View>
          )}

          {/* Quiz Content */}
          <ScrollView style={styles.quizContent} showsVerticalScrollIndicator={false}>
            {!isQuizStarted ? (
              // Quiz Start Screen
              <Animatable.View animation="fadeInUp" style={styles.startContainer}>
                <View style={styles.quizHeader}>
                  <Trophy size={60} color="#FFD700" />
                  <Text style={[styles.quizTitle, dynamicStyles.text]}>
{currentLanguage === 'ms' ? `Kuiz ${getSubjectDisplayName(selectedSubject, 'ms')}` : `${getSubjectDisplayName(selectedSubject, 'en')} Quiz`}
                  </Text>
                  <Text style={[styles.quizSubtitle, dynamicStyles.text]}>
                    {currentLanguage === 'ms' 
                      ? 'Bersedia untuk cabaran? Mari kita mula!' 
                      : 'Ready for a challenge? Let\'s begin!'
                    }
                  </Text>
                </View>

                <View style={styles.quizInfo}>
                  <View style={styles.infoCard}>
                    <Clock size={24} color="#4A90E2" />
                    <Text style={[styles.infoText, dynamicStyles.text]}>
                      {currentLanguage === 'ms' ? '3 Soalan' : '3 Questions'}
                    </Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Star size={24} color="#FFD700" />
                    <Text style={[styles.infoText, dynamicStyles.text]}>
                      {currentLanguage === 'ms' ? '300 Mata' : '300 Points'}
                    </Text>
                  </View>
                  <View style={styles.infoCard}>
                    <Trophy size={24} color="#4CAF50" />
                    <Text style={[styles.infoText, dynamicStyles.text]}>
                      {currentLanguage === 'ms' ? 'Sijil' : 'Certificate'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.startButtonGradient}
                  >
                    <Play size={24} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>
                      {currentLanguage === 'ms' ? 'Mula Kuiz' : 'Start Quiz'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animatable.View>
            ) : !showLeaderboard ? (
              // Quiz Question Screen
              <Animatable.View animation="fadeInUp" style={styles.questionContainer}>
                {/* Question Header */}
                <View style={styles.questionHeader}>
                  <View style={styles.questionInfo}>
                    <Text style={[styles.questionNumber, dynamicStyles.text]}>
                      {currentLanguage === 'ms' ? 'Soalan' : 'Question'} {quizState.currentQuestion + 1}/3
                    </Text>
                    <View style={styles.scoreContainer}>
                      <Star size={20} color="#FFD700" />
                      <Text style={[styles.scoreText, dynamicStyles.text]}>{quizState.score}</Text>
                    </View>
                  </View>
                  
                  {/* Timer */}
                  <View style={styles.timerContainer}>
                    <Clock size={24} color="#FF6B6B" />
                    <Text style={[styles.timerText, { color: quizState.timeLeft <= 10 ? '#FF6B6B' : '#FFFFFF' }]}>
                      {quizState.timeLeft}s
                    </Text>
                  </View>
                </View>

                {/* Question */}
                <View style={styles.questionCard}>
                  <Text style={[styles.questionText, dynamicStyles.text]}>
                    {currentQuestion.question}
                  </Text>
                </View>

                {/* Answer Options */}
                <View style={styles.optionsContainer}>
                  {currentQuestion.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.optionButton}
                      onPress={() => handleAnswerSelect(index)}
                      disabled={quizState.isAnswered}
                    >
                      <LinearGradient
                        colors={getOptionColor(index)}
                        style={styles.optionGradient}
                      >
                        <View style={styles.optionContent}>
                          <View style={styles.optionLeft}>
                            <View style={styles.optionLetter}>
                              <Text style={styles.optionLetterText}>
                                {String.fromCharCode(65 + index)}
                              </Text>
                            </View>
                            <Text style={styles.optionText}>{option}</Text>
                          </View>
                          {getOptionIcon(index)}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${((quizState.currentQuestion + 1) / questions.length) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.progressText, dynamicStyles.text]}>
                    {quizState.currentQuestion + 1} / {questions.length}
                  </Text>
                </View>
              </Animatable.View>
            ) : (
              // Quiz Results Screen
              <Animatable.View animation="fadeInUp" style={styles.resultsContainer}>
                <View style={styles.resultsHeader}>
                  <Trophy size={80} color="#FFD700" />
                  <Text style={[styles.resultsTitle, dynamicStyles.text]}>
                    {currentLanguage === 'ms' ? 'Tahniah!' : 'Congratulations!'}
                  </Text>
                  <Text style={[styles.resultsSubtitle, dynamicStyles.text]}>
                    {currentLanguage === 'ms' 
                      ? 'Anda telah menamatkan kuiz!' 
                      : 'You have completed the quiz!'
                    }
                  </Text>
                </View>

                <View style={styles.scoreCard}>
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.scoreCardGradient}
                  >
                    <Text style={styles.scoreLabel}>
                      {currentLanguage === 'ms' ? 'Jumlah Mata' : 'Total Score'}
                    </Text>
                    <Text style={styles.finalScore}>{quizState.score}</Text>
                    <Text style={styles.scoreOutOf}>
                      {currentLanguage === 'ms' ? 'dari 300 mata' : 'out of 300 points'}
                    </Text>
                  </LinearGradient>
                </View>

                <View style={styles.resultsActions}>
                  <TouchableOpacity style={styles.backToHomeButton} onPress={handleBackToHome}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.backToHomeButtonGradient}
                    >
                      <ArrowLeft size={20} color="#FFFFFF" />
                      <Text style={styles.backToHomeButtonText}>
                        {currentLanguage === 'ms' ? 'Kembali ke Rumah' : 'Back to Home'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
                    <LinearGradient
                      colors={['#4CAF50', '#2E7D32']}
                      style={styles.retryButtonGradient}
                    >
                      <Play size={20} color="#FFFFFF" />
                      <Text style={styles.retryButtonText}>
                        {currentLanguage === 'ms' ? 'Cuba Lagi' : 'Try Again'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </Animatable.View>
            )}
          </ScrollView>

          {/* Sticky Bottom Controls */}
          <View style={styles.stickyBottomControls}>
            {/* Camera Button - Left */}
            <TouchableOpacity style={styles.sideIconButton} onPress={handleHomework}>
              <Camera size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Mic Button - Center */}
            <View style={styles.micButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.micButtonOverlay,
                  isRecording && styles.recordingActive,
                  isProcessing && styles.processing
                ]} 
                onPressIn={handleMicPressIn}
                onPressOut={handleMicPressOut}
                disabled={isProcessing || isAIProcessing}
                activeOpacity={0.8}
              >
                <View style={styles.micInner}>
                  {isProcessing ? (
                    <Animatable.View animation="rotate" iterationCount="infinite" duration={1000}>
                      <Sparkles size={40} color="#FFFFFF" />
                    </Animatable.View>
                  ) : isRecording ? (
                    <MicOff size={40} color="#FFFFFF" />
                  ) : (
                    <Image 
                      source={require('../assets/images/mic.png')} 
                      style={styles.micIcon}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Instructions - Below Mic */}
              <Text style={styles.instructions}>
                {isRecording 
                  ? 'Release to stop recording' 
                  : isProcessing 
                    ? 'Processing...' 
                    : 'Hold to record your message'
                }
              </Text>
            </View>
            
            {/* Chat Button - Right */}
            <TouchableOpacity style={styles.sideIconButton} onPress={handleChatPopup}>
              <MessageSquare size={20} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>

        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Header styles - Same as Community page
  header: {
    position: 'relative',
    overflow: 'hidden',
    height: 80,
    zIndex: 100,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    zIndex: 2,
    pointerEvents: 'none',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 200,
    pointerEvents: 'box-none',
    height: '100%',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    // Premium drop shadow style
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    // Additional shadow for depth
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  quizContent: {
    flex: 1,
  },
  startContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  quizHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  quizTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  quizSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  quizInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 80,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionContainer: {
    paddingVertical: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  questionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  optionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionGradient: {
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  scoreCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  scoreCardGradient: {
    padding: 40,
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  finalScore: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreOutOf: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  resultsActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    width: '100%',
  },
  backToHomeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backToHomeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Sticky Bottom Controls
  stickyBottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    zIndex: 1000,
    gap: 25,
    marginBottom: -20,
  },
  micButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonOverlay: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
    zIndex: 1000,
  },
  micIcon: {
    width: 100,
    height: 100,
  },
  recordingActive: {
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
  },
  processing: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
  },
  micInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideIconButton: {
    marginBottom: 60,
  },
  instructions: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  // AI Response and User Message Display
  userMessageContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});
