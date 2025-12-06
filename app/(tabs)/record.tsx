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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function RecordPage() {
  const insets = useSafeAreaInsets();
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
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  
  const timeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptionInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationRefs = useRef<Animatable.View[]>([]);
  const audioLevelAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const blinkAnimation = useRef(new Animated.Value(1)).current;

  // Check mic permissions on mount and when page is focused
  useEffect(() => {
    checkMicPermissions();
  }, []);

  const checkMicPermissions = async () => {
    try {
      const hasPermission = await recordingServiceSupabase.requestPermissions();
      setHasMicPermission(hasPermission);
      
      if (!hasPermission) {
        console.log('⚠️ Microphone permission not granted');
      } else {
        console.log('✅ Microphone permission granted');
      }
    } catch (error) {
      console.error('Error checking mic permissions:', error);
      setHasMicPermission(false);
    }
  };

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

  // Blinking animation for live indicator
  useEffect(() => {
    if (isRecording) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnimation, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      blinkAnimation.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      // Check and request permissions first
      if (hasMicPermission === false) {
        const permissionGranted = await recordingServiceSupabase.requestPermissions();
        setHasMicPermission(permissionGranted);
        
        if (!permissionGranted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please grant microphone permission to record audio. You can enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Request Again', onPress: checkMicPermissions }
            ]
          );
          return;
        }
      }

      // Start audio recording
      console.log('🎤 Starting recording...');
      const success = await recordingServiceSupabase.startRecording();
      
      if (!success) {
        // Try requesting permission again if recording failed
        console.log('🔄 Recording failed, checking permissions again...');
        const permissionGranted = await recordingServiceSupabase.requestPermissions();
        setHasMicPermission(permissionGranted);
        
        if (!permissionGranted) {
          Alert.alert(
            'Microphone Permission Required',
            'Please grant microphone permission to record audio. You can enable it in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Request Again', onPress: checkMicPermissions }
            ]
          );
          return;
        }
        
        // Try recording again after permission is granted
        const retrySuccess = await recordingServiceSupabase.startRecording();
        if (!retrySuccess) {
          Alert.alert('Error', 'Failed to start recording. Please check microphone permissions and try again.');
          return;
        }
      }

      // Start real-time transcription simulation
      setRealtimeTranscript('');
      setSpeechError(null);
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startRecordingTimer();
      
      console.log('✅ Recording started successfully');
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
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

    let sessionId: string | null = null;
    
    try {
      const session = await recordingServiceSupabase.stopRecording((progress) => {
        setProcessingProgress({
          stage: progress.stage,
          message: progress.message,
          progress: progress.progress
        });
      });
      
      if (session && session.id) {
        sessionId = session.id;
        console.log('✅ Recording completed successfully, session:', sessionId);
      } else {
        console.warn('⚠️ Session not returned, but continuing to result page...');
        // Try to get the most recent session for this user
        try {
          const sessions = await recordingServiceSupabase.getSessions();
          if (sessions && sessions.length > 0) {
            sessionId = sessions[0].id;
            console.log('✅ Using most recent session:', sessionId);
          }
        } catch (sessionError) {
          console.error('Error fetching recent session:', sessionError);
        }
      }
    } catch (error) {
      console.error('Recording error details:', error);
      // Don't show alert - just log the error
      
      // Try to get the most recent session even if there was an error
      try {
        const sessions = await recordingServiceSupabase.getSessions();
        if (sessions && sessions.length > 0) {
          sessionId = sessions[0].id;
          console.log('✅ Using most recent session after error:', sessionId);
        }
      } catch (sessionError) {
        console.error('Error fetching recent session after error:', sessionError);
      }
    } finally {
      setIsProcessing(false);
      setProcessingProgress(null);
      
      // Always navigate to result page, even if there was an error
      // The result page will handle generating sticky notes from transcript
      if (sessionId) {
        console.log('Navigating to recording result with session ID:', sessionId);
        router.push({
          pathname: '/recording-result',
          params: { sessionId: sessionId }
        });
      } else {
        // If we don't have a session ID, still try to navigate
        // The result page will handle the error gracefully
        console.log('No session ID, but navigating anyway - result page will handle it');
        router.push({
          pathname: '/recording-result',
          params: { sessionId: 'new' }
        });
      }
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
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header with Black Background */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerLogo}>Notetaker</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      <View style={styles.content}>
        {/* AI Feature Indicator */}
        <View style={styles.aiIndicator}>
          <View style={styles.aiButton}>
            <Text style={styles.aiText}>Powered by AI</Text>
          </View>
        </View>

        {/* Session Title */}
        <Text style={styles.title}>
          {isProcessing ? 'Processing Recording...' : isRecording ? 'Recording in progress' : 'Ready to record'}
        </Text>

        {/* Recording Time with Live Indicator */}
        <View style={styles.timeContainer}>
          {isRecording && (
            <Animated.View 
              style={[
                styles.liveIndicator,
                { opacity: blinkAnimation }
              ]}
            />
          )}
          <Text style={styles.time}>{formatTime(recordingTime)}</Text>
        </View>

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
                  backgroundColor: isRecording ? '#FF9500' : '#E0E0E0',
                }
              ]}
            />
          ))}
        </View>

        {/* Central Recording Area */}
        <View style={styles.recordingArea}>
          <Image 
            source={require('../../assets/images/sound.png')} 
            style={styles.micImage}
            resizeMode="contain"
          />
        </View>
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
          style={[styles.controlButton, styles.languageButton, (language === 'BM' || language === 'BI') && styles.activeLanguageButton]}
          onPress={() => setLanguage(language === 'BM' ? 'BI' : 'BM')}
        >
          <Text style={[styles.controlButtonText, (language === 'BM' || language === 'BI') && styles.activeLanguageText]}>{language}</Text>
        </TouchableOpacity>

        {/* Main Control Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
          <TouchableOpacity
            style={[styles.mainControlButton, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            <LinearGradient
              colors={['#FF9500', '#FFB84D']}
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
  content: {
    flex: 1,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 100,
    backgroundColor: '#000000',
  },
  headerContent: {
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
  headerLeft: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  headerCenter: {
    flex: 1,
    zIndex: 201,
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  headerRight: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLogo: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.3,
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
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 12,
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  time: {
    fontSize: 64,
    fontWeight: '300',
    color: '#333333',
    textAlign: 'center',
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
    minHeight: 200,
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
  languageButton: {
    backgroundColor: '#F5F5F5',
  },
  controlButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '500',
  },
  activeLanguageButton: {
    backgroundColor: '#FF9500',
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
