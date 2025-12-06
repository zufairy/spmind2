import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, MicOff, Play, Pause, Square, ArrowLeft, Search, Bell, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { recordingServiceSupabase } from '../../services/recordingServiceSupabase';
import { ProcessingProgress } from '../../services/aiProcessingService';

const { width, height } = Dimensions.get('window');

export default function RecordPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
  const [realtimeTranscript, setRealtimeTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'BM' | 'BI'>('BM');
  
  const timeInterval = useRef<NodeJS.Timeout | null>(null);
  const transcriptionInterval = useRef<NodeJS.Timeout | null>(null);
  const animationRefs = useRef<Animatable.View[]>([]);
  const audioLevelAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Timer for recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timeInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
    }

    return () => {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  // Audio level animation
  useEffect(() => {
    if (isRecording) {
      const animateAudioLevel = () => {
        const randomLevel = Math.random() * 100;
        setAudioLevel(randomLevel);
        
        Animated.timing(audioLevelAnimation, {
          toValue: randomLevel,
          duration: 100,
          useNativeDriver: false,
        }).start();

        if (isRecording) {
          setTimeout(animateAudioLevel, 100);
        }
      };
      animateAudioLevel();
    } else {
      setAudioLevel(0);
      Animated.timing(audioLevelAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isRecording]);

  // Pulsing animation for mic button
  useEffect(() => {
    if (isRecording) {
      const createPulseAnimation = () => {
        return Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]);
      };

      const startPulse = () => {
        createPulseAnimation().start(() => {
          if (isRecording) {
            startPulse();
          }
        });
      };

      startPulse();
    } else {
      Animated.timing(pulseAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Start audio recording
      const success = await recordingServiceSupabase.startRecording();
      if (!success) {
        Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
        return;
      }

      // Start real-time transcription simulation
      setRealtimeTranscript('');
      setSpeechError(null);
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startRecordingTimer();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const startRecordingTimer = () => {
    timeInterval.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    setProcessingProgress({
      stage: 'transcribing',
      message: 'Preparing to process your recording...',
      progress: 0
    });
    
    // Stop transcription simulation
    setIsListening(false);
    
    if (timeInterval.current) {
      clearInterval(timeInterval.current);
      timeInterval.current = null;
    }
    
    if (transcriptionInterval.current) {
      clearInterval(transcriptionInterval.current);
      transcriptionInterval.current = null;
    }
    
    setRecordingTime(0);

    try {
      const session = await recordingServiceSupabase.stopRecording((progress) => {
        setProcessingProgress({
          stage: progress.stage,
          message: progress.message,
          progress: progress.progress
        });
      });
      
      if (session) {
        console.log('Recording completed successfully, session:', session);
        
        setIsProcessing(false);
        setProcessingProgress(null);
        
        // Navigate to recording result page
        console.log('Navigating to recording result with session ID:', session.id);
        router.push(`/recording-result?sessionId=${session.id}`);
      } else {
        setIsProcessing(false);
        setProcessingProgress(null);
        Alert.alert(
          'Recording Processing Failed', 
          'The recording could not be processed. Please try recording again with clear speech and good audio quality.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      setIsProcessing(false);
      setProcessingProgress(null);
      
      let errorMessage = 'An unexpected error occurred while processing the recording.';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert(
        'Recording Error', 
        errorMessage + '\n\nPlease try again or check your internet connection.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleBack = () => {
    router.push('/(tabs)/notes');
  };

  // Real-time transcription simulation (Expo Go compatible)
  useEffect(() => {
    if (isRecording && !isPaused) {
      // Start real-time transcription simulation
      startRealtimeTranscription();
    } else {
      // Stop transcription when recording stops
      if (transcriptionInterval.current) {
        clearInterval(transcriptionInterval.current);
        transcriptionInterval.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timeInterval.current) {
        clearInterval(timeInterval.current);
      }
      if (transcriptionInterval.current) {
        clearInterval(transcriptionInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  const startRealtimeTranscription = () => {
    setIsListening(true);
    setSpeechError(null);
    
    // Simulate real-time transcription with realistic text patterns
    const transcriptionPhrases = [
      "I'm recording my thoughts",
      "This is a voice note",
      "Let me capture this idea",
      "I want to remember this",
      "This is important information",
      "I'm taking notes",
      "Recording my session",
      "Capturing my voice",
      "This is my recording",
      "Voice memo in progress"
    ];
    
    let currentPhraseIndex = 0;
    let currentText = '';
    
    transcriptionInterval.current = setInterval(() => {
      if (currentPhraseIndex < transcriptionPhrases.length) {
        const phrase = transcriptionPhrases[currentPhraseIndex];
        
        // Simulate word-by-word appearance
        const words = phrase.split(' ');
        let wordIndex = 0;
        
        const wordInterval = setInterval(() => {
          if (wordIndex < words.length) {
            currentText += (currentText ? ' ' : '') + words[wordIndex];
            setRealtimeTranscript(currentText);
            wordIndex++;
          } else {
            clearInterval(wordInterval);
            currentPhraseIndex++;
            
            // Add a pause between phrases
            setTimeout(() => {
              if (currentPhraseIndex < transcriptionPhrases.length) {
                currentText += ' ';
                setRealtimeTranscript(currentText);
              }
            }, 1000);
          }
        }, 300); // Each word appears every 300ms
      } else {
        // Reset and start over
        currentPhraseIndex = 0;
        currentText = '';
      }
    }, 5000); // New phrase every 5 seconds
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header with Background Image */}
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/bg.jpg')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <View style={styles.headerBlurOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.navButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.navCenter}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.navSpacer} />
        </View>
      </View>

      {/* AI Feature Indicator */}
      <View style={styles.aiIndicator}>
        <View style={styles.aiButton}>
          <Text style={styles.aiText}>Powered by AI</Text>
        </View>
      </View>

      {/* Session Title */}
      <Text style={styles.title}>
        {isProcessing ? 'Processing Recording...' : 'Session is recording'}
      </Text>

      {/* Recording Time */}
      <Text style={styles.time}>{formatTime(recordingTime)}</Text>

      {/* Audio Visualizer */}
      <View style={styles.visualizerContainer}>
        {Array.from({ length: 20 }, (_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.visualizerBar,
              {
                height: isRecording 
                  ? audioLevelAnimation.interpolate({
                      inputRange: [0, 100],
                      outputRange: [4, 40],
                      extrapolate: 'clamp',
                    })
                  : 4,
                backgroundColor: isRecording ? '#4A90E2' : '#E0E0E0',
              }
            ]}
          />
        ))}
      </View>

      {/* Central Recording Area */}
      <View style={styles.recordingArea}>
        <Image 
          source={require('../../assets/images/loud.png')} 
          style={styles.micImage}
          resizeMode="contain"
        />
      </View>

      {/* Real-time Transcription - Hidden temporarily */}
      {false && isRecording && (
        <View style={styles.transcriptionContainer}>
          <View style={styles.transcriptionHeader}>
            <Text style={styles.transcriptionLabel}>Live Transcription:</Text>
            {isListening && (
              <View style={styles.listeningIndicator}>
                <View style={styles.listeningDot} />
                <Text style={styles.listeningText}>Listening...</Text>
              </View>
            )}
          </View>
          <Text style={styles.transcriptionText}>
            {realtimeTranscript || 'Start speaking to see real-time transcription...'}
          </Text>
          {speechError && (
            <Text style={styles.errorText}>Error: {speechError}</Text>
          )}
        </View>
      )}

      {/* Processing Progress */}
      {isProcessing && processingProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${processingProgress.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {processingProgress.stage} - {processingProgress.progress}%
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Language Button */}
        <TouchableOpacity 
          style={[styles.controlButton, language === 'BI' && styles.activeLanguageButton]}
          onPress={() => setLanguage(language === 'BM' ? 'BI' : 'BM')}
        >
          <Text style={[styles.controlButtonText, language === 'BI' && styles.activeLanguageText]}>{language}</Text>
        </TouchableOpacity>

        {/* Main Control Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
          <TouchableOpacity
            style={[styles.mainControlButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={isRecording ? ['#FF6B6B', '#FF8E8E'] : ['#4A90E2', '#6BB6FF']}
              style={styles.mainControlGradient}
            >
              {isProcessing ? (
                <Text style={styles.processingText}>⏳</Text>
              ) : isRecording ? (
                <Square size={32} color="#FFFFFF" />
              ) : (
                <Mic size={32} color="#FFFFFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {}}
        >
          <ChevronRight size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(2px)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    height: '100%',
    position: 'relative',
    zIndex: 10,
  },
  navButton: {
    padding: 8,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  navSpacer: {
    width: 40,
  },
  aiIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  aiButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  aiText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#999999',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 34,
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 30,
  },
  visualizerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 50,
    marginBottom: 40,
    gap: 3,
  },
  visualizerBar: {
    width: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    minHeight: 4,
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  micImage: {
    width: 280,
    height: 280,
  },
  transcriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxHeight: 100,
  },
  transcriptionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  transcriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
    paddingTop: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '500',
  },
  activeLanguageButton: {
    backgroundColor: '#4A90E2',
  },
  activeLanguageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mainControlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.4,
  },
  mainControlGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A90E2',
    marginRight: 6,
  },
  listeningText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
