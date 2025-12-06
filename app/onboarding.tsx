import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
  Alert,
  Animated,
  SafeAreaView,
  Modal,
  Keyboard,
} from 'react-native';
import { WebView } from 'react-native-webview';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BlurView } from 'expo-blur';
// import { StarryBackground } from '../components/StarryBackground';
// import DatePicker from 'react-native-modern-datepicker';
// import moment from 'moment';
import { ArrowLeft, Send, Mic, Volume2, Sparkles, Calendar, MessageCircle, MicOff } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import TutorpalAvatar from '../components/TutorpalAvatar';
import { voiceService } from '../services/voiceService';
import { elevenLabsVoiceService } from '../services/googleVoiceService';
import { onboardingChatService } from '../services/onboardingChatService';
import { aiService } from '../services/aiService';
import { aiProcessingService } from '../services/aiProcessingService';
import DateTimePicker from '@react-native-community/datetimepicker';
import CongratulationsPopup from '../components/CongratulationsPopup';

const { width } = Dimensions.get('window');

interface Message {
  type: 'ai' | 'user';
  message: string;
  timestamp: Date;
  hasAudio?: boolean;
}

interface OnboardingStep {
  id: string;
  question: string;
  type: 'text' | 'select' | 'date' | 'multiselect';
  options?: string[];
  placeholder?: string;
  validation?: (value: string) => string | null;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'name_confirmation',
    question: "Is this your full name, or would you like to provide your complete name?",
    type: 'text',
    placeholder: 'Your Full Name',
    validation: (value: string) => {
      if (!value.trim()) return 'Please enter your name.';
      if (value.trim().length < 2) return 'Name must be at least 2 characters long.';
      return null;
    },
  },
  {
    id: 'current_school',
    question: "Great! Which school are you currently attending?",
    type: 'text',
    placeholder: 'Your School Name',
  },
  {
    id: 'birth_date',
    question: "Understood. To personalize your learning experience, could you please tell me your birth date?",
    type: 'date',
    placeholder: 'YYYY-MM-DD',
    validation: (value: string) => {
      if (!value.trim()) return 'Please select your birth date.';
      // Accept any valid date format (from date picker or manual entry)
      const birthDate = new Date(value);
      if (isNaN(birthDate.getTime())) {
        // If it's not a valid date, try parsing different formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) {
          // Only show error if it's not in any valid format
          return null; // Allow date picker format to pass through
        }
      }
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 5 || age > 100) return 'Please enter a valid birth date.';
      if (birthDate > today) return 'Birth date cannot be in the future.';
      return null;
    },
  },
  {
    id: 'weak_subjects',
    question: "Thanks! Now, let's talk about subjects. Which subjects do you find challenging or would like to improve in?",
    type: 'multiselect',
    options: ['Mathematics', 'Science', 'English', 'Bahasa Melayu', 'History', 'Physics', 'Chemistry', 'Biology', 'Add Maths'],
  },
  {
    id: 'study_minutes_per_day',
    question: "How many minutes do you typically prefer to study per day?",
    type: 'select',
    options: ['5 minutes', '15 minutes', '30 minutes'],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateProfile, refreshAuth } = useAuth();
  const [step, setStep] = useState<'language' | 'modeSelection' | 'loading' | 'chat' | 'voice'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [userResponse, setUserResponse] = useState('');
  const [onboardingData, setOnboardingData] = useState<any>({});
  const [aiTyping, setAiTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModeLoading, setIsModeLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'talking' | 'listening' | 'thoughtful'>('talking');
  const scrollViewRef = useRef<ScrollView>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const modeOpacity = useRef(new Animated.Value(1)).current;
  const contentSlide = useRef(new Animated.Value(0)).current;

  // Multi-select state
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Fade animation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Congratulations popup state
  const [showCongratulations, setShowCongratulations] = useState(false);
  
  // Input box animation state
  const inputOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Fetch user name from database and play greeting
    const initializeOnboarding = async () => {
      try {
        // Initialize audio system first
        const { Audio } = require('expo-av');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
        });
        console.log('====================================');
        console.log('✅ AUDIO SYSTEM INITIALIZED');
        console.log('Silent mode: ENABLED');
        console.log('Loudspeaker: ENABLED');
        console.log('====================================');
        
        console.log('🔄 Starting user data fetch...');
        
        // Get user data from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const userId = user?.id || session?.user?.id;
        
        console.log('👤 User ID:', userId);
        
        if (userId) {
          // Fetch user profile from database with retry logic
          console.log('📊 Fetching user profile...');
          
          let userData = null;
          let error = null;
          
          // Try to fetch user data with timeout
          try {
            const queryPromise = supabase
              .from('users')
              .select('full_name, username, email')
              .eq('id', userId)
              .single();
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 5000)
            );
            
            const result = await Promise.race([queryPromise, timeoutPromise]) as any;
            userData = result.data;
            error = result.error;
          } catch (timeoutError) {
            console.warn('⚠️ Database query timeout, using fallback');
            error = timeoutError;
          }
          
          console.log('📊 User data:', userData);
          console.log('📊 Error:', error);
            
          if (userData && !error) {
            // Try multiple name sources in order of preference
            const name = userData.full_name?.split(' ')[0] || 
                        userData.username || 
                        userData.email?.split('@')[0] || 
                        user?.full_name?.split(' ')[0] ||
                        user?.username ||
                        user?.email?.split('@')[0] || 
                        'there';
            console.log('✅ User name set to:', name);
            setUserName(name);
            
            // Play local audio file immediately
            console.log('🔊 Preparing to play local language.mp3...');
            const playLocalAudio = async () => {
              console.log('');
              console.log('========================================');
              console.log('🔊 PLAYING LOCAL AUDIO FILE');
              console.log('File: language.mp3');
              console.log('========================================');
              
              setAvatarState('talking');
              setIsPlaying(true);
              
              try {
                const { Audio } = require('expo-av');
                
                console.log('🔊 Loading language.mp3 from assets...');
                const { sound } = await Audio.Sound.createAsync(
                  require('../assets/language.mp3'),
                  { shouldPlay: true, volume: 1.0 }
                );
                
                console.log('✅ Audio loaded and playing');
                
                // Wait for audio to finish
                sound.setOnPlaybackStatusUpdate((status: any) => {
                  if (status.isLoaded) {
                    if (status.didJustFinish) {
                      console.log('✅ Audio playback finished');
                      sound.unloadAsync();
                      setAvatarState('idle');
                      setIsPlaying(false);
                    }
                  }
                });
                
              } catch (err) {
                console.error('====================================');
                console.error('❌ ERROR PLAYING LOCAL AUDIO');
                console.error('Error:', err);
                console.error('====================================');
                setAvatarState('idle');
                setIsPlaying(false);
              }
            };
            
            // Play immediately
            playLocalAudio();
          } else {
            console.log('⚠️ No userData or error occurred');
            // Fallback to context user data
            const name = user?.full_name?.split(' ')[0] || user?.username || 'there';
            console.log('✅ Fallback name set to:', name);
            setUserName(name);
            
            // Play local audio
            const playLocalAudio = async () => {
              console.log('🔊 FALLBACK - Playing local audio');
              setAvatarState('talking');
              setIsPlaying(true);
              
              try {
                const { Audio } = require('expo-av');
                const { sound } = await Audio.Sound.createAsync(
                  require('../assets/language.mp3'),
                  { shouldPlay: true, volume: 1.0 }
                );
                
                sound.setOnPlaybackStatusUpdate((status: any) => {
                  if (status.isLoaded && status.didJustFinish) {
                    sound.unloadAsync();
                    setAvatarState('idle');
                    setIsPlaying(false);
                  }
                });
              } catch (err) {
                console.error('❌ Error:', err);
                setAvatarState('idle');
                setIsPlaying(false);
              }
            };
            
            playLocalAudio();
          }
        } else {
          console.log('⚠️ No user ID found');
          // No user ID, use fallback
          const name = user?.full_name?.split(' ')[0] || user?.username || 'there';
          console.log('✅ No-user name set to:', name);
          setUserName(name);
          
          // Play local audio
          const playLocalAudio = async () => {
            console.log('🔊 NO-USER - Playing local audio');
            setAvatarState('talking');
            setIsPlaying(true);
            
            try {
              const { Audio } = require('expo-av');
              const { sound } = await Audio.Sound.createAsync(
                require('../assets/images/language.mp3'),
                { shouldPlay: true, volume: 1.0 }
              );
              
              sound.setOnPlaybackStatusUpdate((status: any) => {
                if (status.isLoaded && status.didJustFinish) {
                  sound.unloadAsync();
                  setAvatarState('idle');
                  setIsPlaying(false);
                }
              });
            } catch (err) {
              console.error('❌ Error:', err);
              setAvatarState('idle');
              setIsPlaying(false);
            }
          };
          
          playLocalAudio();
        }
      } catch (error) {
        console.error('Error initializing onboarding:', error);
        const name = user?.full_name?.split(' ')[0] || user?.username || 'there';
        setUserName(name);
      }
    };

    initializeOnboarding();
  }, []);

  const handleLanguageSelection = async (language: string) => {
    console.log('🌐 Language selected:', language);
    setSelectedLanguage(language);
    
    // Instant transition - just change content
    setStep('modeSelection');
    
    // Play local audio file immediately
    const playLanguageAudio = async () => {
      console.log('========================================');
      console.log('🔊 PLAYING LANGUAGE AUDIO');
      console.log('File:', language === 'English' ? 'english.mp3' : 'bm.mp3');
      console.log('========================================');
      
      setAvatarState('talking');
      setIsPlaying(true);
      
      try {
        const { Audio } = require('expo-av');
        
        // Select audio file based on language
        const audioFile = language === 'English' 
          ? require('../assets/english.mp3')
          : require('../assets/bm.mp3');
        
        const { sound } = await Audio.Sound.createAsync(
          audioFile,
          { shouldPlay: true, volume: 1.0 }
        );
        
        console.log('✅ Audio playing');
        
        // Auto-cleanup when finished
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('✅ Audio finished');
            sound.unloadAsync();
            setAvatarState('idle');
            setIsPlaying(false);
          }
        });
        
      } catch (err) {
        console.error('❌ Error:', err);
        setAvatarState('idle');
        setIsPlaying(false);
      }
    };
    
    // Play immediately
    playLanguageAudio();
  };

  const handleModeSelection = async (selectedMode: 'chat' | 'voice') => {
    console.log('🎯 MODE SELECTED:', selectedMode);
    
    // Show loading state
    setIsModeLoading(true);
    
    // Show loading step first
    setStep('loading');
    
    // Small delay to show loading
    setTimeout(async () => {
      // Set the mode
      setStep(selectedMode);
      setIsModeLoading(false);
      
      // Initialize the selected mode
      if (selectedMode === 'chat') {
        console.log('💬 CHAT MODE - Starting natural conversation');
        console.log('💬 Current userName:', userName);
        console.log('💬 Selected language:', selectedLanguage);
        
        // Ensure we have a user name
        const displayName = userName || 'there';
        console.log('💬 Display name:', displayName);
        
        // Use the first onboarding question in the selected language
        const firstQuestion = getLocalizedQuestion(onboardingSteps[0], selectedLanguage);
        const greeting = selectedLanguage === 'Bahasa Melayu' 
          ? `Hai ${displayName}! Saya Genybot, AI tutor awak! 👋 ${firstQuestion}`
          : `Hi ${displayName}! I'm Genybot, your AI study buddy! 👋 ${firstQuestion}`;
        
        const initialMessage: Message = {
          type: 'ai',
          message: greeting,
          timestamp: new Date(),
          hasAudio: true,
        };
        
        // Display message immediately and force re-render
        setConversationHistory([initialMessage]);
        setCurrentStep(0); // Reset step for chat mode
        
        console.log('💬 Chat mode: Natural conversation started with message:', greeting);
        
        // Force scroll to bottom after a short delay
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      } else if (selectedMode === 'voice') {
        console.log('🎤 VOICE MODE - Starting voice onboarding');
        
        // Set language for voice service
        elevenLabsVoiceService.setLanguage(selectedLanguage === 'Bahasa Melayu' ? 'ms' : 'en');
        
        // Set up voice mode conversation
        const displayName = userName || 'there';
        const firstQuestion = getLocalizedQuestion(onboardingSteps[0], selectedLanguage);
        const greeting = selectedLanguage === 'Bahasa Melayu' 
          ? `Hai ${displayName}! Saya Genybot, kawan AI awak! 👋 ${firstQuestion}`
          : `Hi ${displayName}! I'm Genybot, your AI buddy! 👋 ${firstQuestion}`;
        
        const initialMessage: Message = {
          type: 'ai',
          message: greeting,
          timestamp: new Date(),
          hasAudio: true,
        };
        
        // Set up conversation
        setConversationHistory([initialMessage]);
        setCurrentStep(0);
        
        console.log('🎤 Voice mode: Starting with question:', greeting);
        
        // Generate speech for the first question
        await generateAndPlaySpeech(greeting);
      }
    }, 800);
  };

  useEffect(() => {
    // Scroll to bottom when conversation updates
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [conversationHistory]);

  // Add keyboard event listeners for smoother input experience
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Optional: handle keyboard hide
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const generateAndPlaySpeech = async (text: string): Promise<boolean> => {
    console.log('====================================');
    console.log('🔊 GENERATE AND PLAY SPEECH');
    console.log('Text:', text);
    console.log('Language:', selectedLanguage);
    console.log('====================================');
    
    try {
      setAvatarState('talking');
      setIsPlaying(true);
      
      // Stop any existing audio first for synchronization
      await elevenLabsVoiceService.stopAudio();
      
      const startTime = Date.now();
      const langCode = selectedLanguage === 'Bahasa Melayu' ? 'ms' : 'en';
      
      console.log('🔊 Setting language to:', langCode);
      elevenLabsVoiceService.setLanguage(langCode);
      
      console.log('🔊 Calling generateSpeech...');
      const result = await elevenLabsVoiceService.generateSpeech(text);
      console.log(`⚡ Speech generation completed in ${Date.now() - startTime}ms`);
      console.log('Result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.audioUrl) {
        console.log('🔊 Audio URL received, calling playAudio...');
        const playStart = Date.now();
        const playSuccess = await elevenLabsVoiceService.playAudio(result.audioUrl);
        console.log(`✅ Playback completed in ${Date.now() - playStart}ms, success: ${playSuccess}`);
        
        if (playSuccess) {
          // Wait for audio to complete for synchronization
          // Estimate duration based on text length (average speaking rate)
          const estimatedDuration = Math.max(text.length * 50, 2000); // 50ms per character, minimum 2 seconds
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(true);
            }, estimatedDuration);
          });
        }
        return false;
      } else {
        console.error('====================================');
        console.error('❌ SPEECH GENERATION FAILED');
        console.error('Error:', result.error);
        console.error('====================================');
        return false;
      }
    } catch (error) {
      console.error('====================================');
      console.error('❌ EXCEPTION IN GENERATE AND PLAY');
      console.error('Error:', error);
      console.error('====================================');
      return false;
    } finally {
      setAvatarState('idle');
      setIsPlaying(false);
    }
  };

  const handleMicPressIn = async () => {
    if (isProcessing || isRecording) return;
    
    console.log('🎤 Mic pressed - starting recording');
    
    // Immediate visual feedback
    setIsRecording(true);
    setAvatarState('listening');
    
    try {
      // Request permissions first
      const hasPermission = await elevenLabsVoiceService.requestPermissions();
      console.log('Audio permission granted:', hasPermission);
      
      if (!hasPermission) {
        console.error('❌ Audio permission denied');
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.');
        setIsRecording(false);
        setAvatarState('idle');
        return;
      }
      
      // Start recording immediately
      const started = await elevenLabsVoiceService.startRecording();
      console.log('Recording started:', started);
      
      if (!started) {
        console.error('❌ Failed to start recording');
        Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        setIsRecording(false);
        setAvatarState('idle');
      } else {
        console.log('✅ Recording started successfully');
      }
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      Alert.alert('Recording Error', `Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRecording(false);
      setAvatarState('idle');
    }
  };

  const handleMicPressOut = async () => {
    if (!isRecording) return;
    
    console.log('🎤 Mic released - stopping recording');
    setIsRecording(false);
    setIsProcessing(true);
    setAvatarState('thoughtful');
    
    try {
      // Set language for AI processing service
      const langCode = selectedLanguage === 'Bahasa Melayu' ? 'ms' : 'en';
      aiProcessingService.setLanguage(langCode);
      
      const result = await elevenLabsVoiceService.stopRecording();
      console.log('Recording result:', JSON.stringify(result));
      
      if (result.success && result.text) {
        console.log('✓ Transcribed text:', result.text);
        const cleanText = result.text.trim();
        console.log('🎤 Voice mode - Processing transcribed text:', cleanText);
        console.log('🎤 Current step:', currentStep, 'Step data:', onboardingSteps[currentStep]);
        
        setUserResponse(cleanText);
        setIsProcessing(false);
        setAvatarState('idle');
        
        // Extract name if this is the name confirmation step
        let processedText = cleanText;
        const currentStepData = onboardingSteps[currentStep];
        
        console.log('🎤 Processing voice input:', {
          cleanText,
          currentStep,
          stepId: currentStepData.id,
          isNameStep: currentStepData.id === 'name_confirmation'
        });
        
        if (currentStepData.id === 'name_confirmation') {
          console.log('🎤 Processing name confirmation step with text:', cleanText);
          const extractedName = extractNameFromTranscription(cleanText);
          if (extractedName) {
            console.log('🎤 ✅ Successfully extracted name from transcription:', extractedName);
            processedText = extractedName;
            // Update the userName state immediately for better context
            setUserName(extractedName);
            console.log('🎤 ✅ Updated userName state to:', extractedName);
          } else {
            // If no name extracted, use the full text as the name
            console.log('🎤 ⚠️ No name pattern matched, using full text as name:', cleanText);
            processedText = cleanText;
            setUserName(cleanText);
            console.log('🎤 ⚠️ Updated userName state to full text:', cleanText);
          }
        }
        
        // Store the transcribed text in onboarding data immediately
        const stepData = {
          ...onboardingData,
          [currentStepData.id]: currentStepData.type === 'multiselect' ? selectedMultiOptions : processedText,
        };
        setOnboardingData(stepData);
        
        console.log('🎤 Stored step data:', stepData);
        
        // Wait a moment before auto-submitting to ensure state is updated
        setTimeout(() => {
          console.log('🎤 Auto-submitting voice response...');
          handleNextStep();
        }, 1000);
    } else {
        console.error('✗ Recording failed:', result.error);
        Alert.alert(
          'Transcription Failed', 
          result.error || 'Could not transcribe audio. Please try again.',
          [{ text: 'OK', onPress: () => {} }]
        );
        setIsProcessing(false);
        setAvatarState('idle');
      }
    } catch (error) {
      console.error('✗ Error processing recording:', error);
      Alert.alert(
        'Processing Error',
        `Failed to process recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK', onPress: () => {} }]
      );
      setIsProcessing(false);
      setAvatarState('idle');
    }
  };

  // Helper function to extract name from voice transcription
  const extractNameFromTranscription = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    console.log('🎤 Extracting name from text:', text);
    
    // Enhanced patterns for name introduction (both Malay and English)
    const namePatterns = [
      // Malay patterns
      /nama saya (\w+)/i,
      /saya (\w+)/i,
      /nama aku (\w+)/i,
      /aku (\w+)/i,
      /nama (\w+)/i,
      
      // English patterns
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i,
      /i'm called (\w+)/i,
      /name's (\w+)/i,
      /my name (\w+)/i,
    ];
    
    // Try to match patterns first
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const extractedName = match[1].trim();
        console.log('🎤 Pattern matched, extracted name:', extractedName);
        return extractedName;
      }
    }
    
    // If no pattern matches, try to extract the first meaningful word
    const words = text.trim().split(/\s+/);
    console.log('🎤 Words from text:', words);
    
    if (words.length >= 2) {
      // Skip common words and take the first potential name
      const skipWords = ['nama', 'saya', 'aku', 'my', 'name', 'is', 'am', 'i', 'call', 'me', 'called', 'the', 'a', 'an'];
      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, ''); // Remove punctuation
        if (!skipWords.includes(cleanWord.toLowerCase()) && cleanWord.length > 1) {
          console.log('🎤 Found potential name:', cleanWord);
          return cleanWord;
        }
      }
    }
    
    // If only one word and it's not a skip word, it might be a name
    if (words.length === 1) {
      const cleanWord = words[0].replace(/[^\w]/g, '');
      const skipWords = ['nama', 'saya', 'aku', 'my', 'name', 'hi', 'hello', 'hai'];
      if (!skipWords.includes(cleanWord.toLowerCase()) && cleanWord.length > 1) {
        console.log('🎤 Single word name:', cleanWord);
        return cleanWord;
      }
    }
    
    console.log('🎤 No name extracted from text');
    return null;
  };

  const getLocalizedQuestion = (step: OnboardingStep, language: string): string => {
    if (language === 'Bahasa Melayu') {
      const malayQuestions: { [key: string]: string } = {
        'name_confirmation': 'Bolehkah anda beritahu saya nama penuh anda?',
        'current_school': 'Bagus! Sekolah mana yang anda hadiri sekarang?',
        'birth_date': 'Baik. Untuk menyesuaikan pengalaman pembelajaran anda, bolehkah anda memberitahu saya tarikh lahir anda?',
        'weak_subjects': 'Terima kasih! Sekarang, mari kita bincang tentang subjek. Subjek mana yang anda rasa mencabar atau ingin tingkatkan?',
        'strong_subjects': 'Dan sebaliknya, subjek mana yang anda yakin atau paling gemar?',
        'study_minutes_per_day': 'Berapa minit anda biasanya suka belajar sehari?',
        'academic_goals': 'Akhirnya, apakah matlamat akademik utama anda atau apa yang anda harapkan untuk capai dengan Genius?',
      };
      return malayQuestions[step.id] || step.question;
    }
    return step.question;
  };


  const getLocalizedPlaceholder = (step: OnboardingStep, language: string): string => {
    if (language === 'Bahasa Melayu') {
      const malayPlaceholders: { [key: string]: string } = {
        'name_confirmation': 'Masukkan nama penuh anda...',
        'current_school': 'Masukkan nama sekolah anda...',
        'birth_date': 'Masukkan tarikh lahir anda...',
        'weak_subjects': 'Tulis subjek yang anda rasa susah...',
        'strong_subjects': 'Tulis subjek yang anda rasa kuat...',
        'study_minutes_per_day': 'Tulis berapa minit anda belajar...',
        'academic_goals': 'Tulis matlamat akademik anda...',
      };
      return malayPlaceholders[step.id] || 'Masukkan jawapan anda...';
    } else {
      const englishPlaceholders: { [key: string]: string } = {
        'name_confirmation': 'Enter your full name...',
        'current_school': 'Enter your school name...',
        'birth_date': 'Enter your birth date...',
        'weak_subjects': 'Write subjects you find challenging...',
        'strong_subjects': 'Write subjects you are good at...',
        'study_minutes_per_day': 'Write how many minutes you study...',
        'academic_goals': 'Write your academic goals...',
      };
      return englishPlaceholders[step.id] || 'Enter your answer...';
    }
  };

  const getLocalizedOptions = (step: OnboardingStep, language: string): string[] => {
    if (language === 'Bahasa Melayu' && step.options) {
      const malayOptions: { [key: string]: string[] } = {
        'study_minutes_per_day': ['5 minit', '15 minit', '30 minit'],
        'weak_subjects': ['Matematik', 'Sains', 'Bahasa Inggeris', 'Bahasa Melayu', 'Sejarah', 'Fizik', 'Kimia', 'Biologi', 'Matematik Tambahan'],
        'strong_subjects': ['Matematik', 'Sains', 'Bahasa Inggeris', 'Bahasa Melayu', 'Sejarah', 'Fizik', 'Kimia', 'Biologi', 'Matematik Tambahan'],
      };
      return malayOptions[step.id] || step.options;
    }
    return step.options || [];
  };

  const validateInput = (step: OnboardingStep, value: string, multiOptions?: string[]): string | null => {
    // Use step's validation function if available
    if (step.validation) {
      return step.validation(value);
    }

    // Fallback validation for steps without custom validation
    switch (step.id) {
      case 'current_school':
        if (!value.trim()) return 'Please enter your school name.';
        if (value.trim().length < 3) return 'School name must be at least 3 characters long.';
        return null;
      
      case 'academic_goals':
        if (!value.trim()) return 'Please describe your academic goals.';
        if (value.trim().length < 10) return 'Please provide more details about your academic goals (at least 10 characters).';
        return null;
      
      case 'weak_subjects':
      case 'strong_subjects':
        if (!multiOptions || multiOptions.length === 0) return 'Please select at least one subject.';
        return null;
      
      default:
        if (!value.trim()) return 'Please provide a response.';
        return null;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setSelectedDate(selectedDate);
      // Format the date as a readable string for display
      const formattedDate = selectedDate.toLocaleDateString(selectedLanguage === 'Bahasa Melayu' ? 'ms-MY' : 'en-US');
      setUserResponse(formattedDate);
      // Close the picker after selection
      setShowDatePicker(false);
    } else if (event.type === 'dismissed') {
      // Close picker if dismissed
      setShowDatePicker(false);
    }
  };

  const handleNextStep = async () => {
    const currentStepData = onboardingSteps[currentStep];
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Set submitting state to trigger fade effect
    setIsSubmitting(true);
    
    // Fade out input box
    Animated.timing(inputOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    console.log('🎤 handleNextStep called');
    console.log('🎤 Current step:', currentStep, 'Step ID:', currentStepData.id);
    console.log('🎤 User response:', userResponse);
    console.log('🎤 Mode:', step);
    
    // Validate input based on step type (skip validation for date picker)
    let validationError = null;
    if (currentStepData.id !== 'birth_date' || !selectedDate) {
      validationError = validateInput(
        currentStepData, 
        userResponse, 
        currentStepData.type === 'multiselect' ? selectedMultiOptions : undefined
      );
    }
    
    if (validationError) {
      setIsSubmitting(false); // Reset submitting state on validation error
      
      const errorMessage: Message = {
        type: 'ai',
        message: selectedLanguage === 'Bahasa Melayu' 
          ? `Maaf, ${validationError.toLowerCase()}` 
          : `Sorry, ${validationError.toLowerCase()}`,
        timestamp: new Date(),
        hasAudio: true,
      };
      setConversationHistory(prev => [...prev, errorMessage]);
      
      // In voice mode, generate speech for error message
      if (step === 'voice') {
        await generateAndPlaySpeech(errorMessage.message);
      }
      
      return;
    }

    setAiTyping(true);
    setAvatarState('thoughtful');

    // Create user message with proper formatting
    let userMessageText = userResponse;
    if (currentStepData.id === 'birth_date' && selectedDate) {
      // Show localized date format in conversation
      userMessageText = selectedDate.toLocaleDateString(selectedLanguage === 'Bahasa Melayu' ? 'ms-MY' : 'en-US');
    } else if (currentStepData.type === 'multiselect') {
      userMessageText = selectedMultiOptions.join(', ');
    }
    
    const newUserMessage: Message = {
      type: 'user',
      message: userMessageText,
      timestamp: new Date(),
    };

    const newConversation = [...conversationHistory, newUserMessage];
    setConversationHistory(newConversation);

    // Store the user's response in onboarding data
    let responseToStore = userResponse;
    let messageToShow = userResponse;
    
    if (currentStepData.id === 'birth_date' && selectedDate) {
      // Store birth date in YYYY-MM-DD format for database
      responseToStore = selectedDate.toISOString().split('T')[0];
      // Show localized format in message
      messageToShow = selectedDate.toLocaleDateString(selectedLanguage === 'Bahasa Melayu' ? 'ms-MY' : 'en-US');
    }
    
    const stepData = {
      ...onboardingData,
      [currentStepData.id]: currentStepData.type === 'multiselect' ? selectedMultiOptions : responseToStore,
    };
    setOnboardingData(stepData);
    
    console.log('📝 Stored data:', stepData);

    // Clear the input
    setUserResponse('');
    setSelectedMultiOptions([]);

    try {
      console.log('🎤 Generating AI response for message:', newUserMessage.message);
      console.log('🎤 Current step:', currentStep, 'User name:', userName, 'Language:', selectedLanguage);
      
      // Get the current name from onboarding data, user response, or initial userName
      const currentName = onboardingData.name_confirmation || onboardingData.intro || userName || newUserMessage.message || '';
      
      console.log('🤖 Generating AI response with context:', {
        userMessage: newUserMessage.message,
        currentStep,
        currentName,
        selectedLanguage,
        languageCode: selectedLanguage === 'Bahasa Melayu' ? 'ms' : 'en'
      });
      
      // Generate AI response using the onboarding chat service
      const currentBirthDate = currentStepData.id === 'birth_date' && selectedDate 
        ? selectedDate.toISOString().split('T')[0]
        : onboardingData.birth_date;
        
      const aiResponse = await onboardingChatService.generateOnboardingResponse(
        newUserMessage.message,
        currentStep,
        currentName,
        selectedLanguage === 'Bahasa Melayu' ? 'ms' : 'en',
        currentBirthDate
      );
      
      console.log('🎤 AI response received:', aiResponse);

      setAiTyping(false);
      setAvatarState('idle');

      if (aiResponse.success && aiResponse.message) {
        const aiMessage: Message = {
          type: 'ai',
          message: aiResponse.message,
          timestamp: new Date(),
          hasAudio: true,
        };

        console.log('💬 AI response:', aiResponse.message);
        setConversationHistory(prev => [...prev, aiMessage]);
        
        // In voice mode, generate speech for AI response
        if (step === 'voice') {
          await generateAndPlaySpeech(aiResponse.message);
        }

        // Move to next step after a longer delay to let user see AI response
        setTimeout(async () => {
          if (currentStep < onboardingSteps.length - 1) {
            // Move to next step
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            
            // Fade in input box for next question
            Animated.timing(inputOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();

            // Add next question in the selected language
            const nextQuestion = getLocalizedQuestion(onboardingSteps[nextStep], selectedLanguage);
            const nextQuestionMessage: Message = {
              type: 'ai',
              message: nextQuestion,
              timestamp: new Date(),
              hasAudio: true,
            };

            console.log('💬 Next question:', nextQuestion);
            setConversationHistory(prev => [...prev, nextQuestionMessage]);
            
            // In voice mode, generate speech for next question
            if (step === 'voice') {
              await generateAndPlaySpeech(nextQuestion);
            }
            
            // Scroll to bottom immediately
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollToEnd({ animated: true });
            }
          } else {
            // Complete onboarding
            console.log('✅ Onboarding complete, saving...');
            await completeOnboarding(stepData);
          }
        }, 2000); // Longer delay to let user see AI response first

      } else {
        console.error('AI response failed:', aiResponse.error);
        // Fallback response
        const fallbackMessage: Message = {
          type: 'ai',
          message: selectedLanguage === 'Bahasa Melayu' 
            ? 'Maaf, saya tidak dapat memahami. Boleh anda cuba lagi?' 
            : 'Sorry, I didn\'t understand that. Could you try again?',
          timestamp: new Date(),
          hasAudio: true,
        };
        setConversationHistory(prev => [...prev, fallbackMessage]);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setAiTyping(false);
      setAvatarState('idle');
      
      // Error fallback
      const errorMessage: Message = {
        type: 'ai',
        message: selectedLanguage === 'Bahasa Melayu' 
          ? 'Terima kasih! Mari kita teruskan perbualan.' 
          : 'Thank you! Let\'s continue our conversation.',
        timestamp: new Date(),
        hasAudio: true,
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    // Reset submitting state
    setIsSubmitting(false);
  };

  const completeOnboarding = async (data: any) => {
    console.log('🎉 Starting completeOnboarding with data:', data);
    setLoading(true);
    try {
      // Try to refresh auth first if user is null
      if (!user) {
        console.log('User not found in context, refreshing auth state...');
        await refreshAuth();
        
        // Check session directly from Supabase as a fallback
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          Alert.alert('Error', 'User not authenticated. Please log in again.');
          router.replace('/auth/login');
          return;
        }
      }

      // Get current user ID from either context or session
      const { data: { session } } = await supabase.auth.getSession();
      const userId = user?.id || session?.user?.id;

      if (!userId) {
        Alert.alert('Error', 'Unable to identify user. Please log in again.');
        router.replace('/auth/login');
        return;
      }

      // Calculate age from birth date with proper year handling
      let calculatedAge = 0;
      if (data.birth_date) {
        const birthDate = new Date(data.birth_date);
        const today = new Date();
        
        // More accurate age calculation
        calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Adjust age if birthday hasn't occurred this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        
        console.log('Birth date processing:', {
          birth_date: data.birth_date,
          birthDate: birthDate,
          today: today,
          calculatedAge: calculatedAge,
          year: birthDate.getFullYear()
        });
      }

      // Map study minutes text to integer values (in hours)
      const mapStudyMinutes = (minutesText: string) => {
        switch (minutesText) {
          case '5 minutes': return 1; // 5 minutes -> 1 hour (minimum viable)
          case '15 minutes': return 2; // 15 minutes -> 2 hours (reasonable study time)
          case '30 minutes': return 3; // 30 minutes -> 3 hours (good study session)
          default: return 2; // Default to 2 hours
        }
      };

      // Map preferred language to database constraint values
      const mapPreferredLanguage = (language: string) => {
        const lang = language?.toLowerCase() || 'english';
        switch (lang) {
          case 'bahasa melayu':
          case 'bahasa_melayu':
          case 'malay':
            return 'malay';
          case 'english':
            return 'english';
          case 'mandarin':
          case 'tamil':
          case 'mixed':
            return 'mixed';
          default:
            return 'english';
        }
      };

      // Prepare the update data
      const updateData = {
        // Map onboarding fields to correct database columns
        full_name: data.name_confirmation || data.intro || '', // Use name_confirmation instead of intro
        preferred_language: selectedLanguage === 'Bahasa Melayu' ? 'malay' : 'english', // Use selected language from orientation
        school: data.current_school || '', // Map current_school to school field
        birth_date: data.birth_date || '',
        age: calculatedAge || 0,
        weak_subjects: data.weak_subjects || [],
        study_hours_per_day: mapStudyMinutes(data.study_minutes_per_day),
        onboarding_completed: true,
        onboarding_data: data, // Store complete onboarding data as JSON
      };

      console.log('Updating user profile with data:', updateData);
      console.log('User ID:', userId);

      // Update user profile in Supabase directly to be safe
      const { data: updateResult, error: profileError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();

      if (profileError) {
        console.error('Error updating profile during onboarding:', profileError);
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        Alert.alert('Error', `Failed to save onboarding data: ${profileError.message}. Please try again.`);
        setLoading(false);
        return;
      }

      console.log('Profile updated successfully:', updateResult);

      // Refresh auth state to load updated profile
      await refreshAuth();
      
      // Show congratulations popup
      console.log('🎉 About to show congratulations popup');
      setLoading(false);
      setShowCongratulations(true);
      console.log('🎉 Congratulations popup state set to true');
      
      // Play completion voice message
      if (step === 'voice') {
        const completionMessage = selectedLanguage === 'Bahasa Melayu' 
          ? "Yay! Awak dah siapkan orientation ni! Bagus sangat!" 
          : "Yay! You completed the orientation! Great job!";
        
        // Generate and play speech for completion message
        setTimeout(async () => {
          try {
            await generateAndPlaySpeech(completionMessage);
          } catch (error) {
            console.log('Voice completion message failed:', error);
          }
        }, 1000); // Delay to let popup animation start
      }
    } catch (error: any) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred during onboarding.');
    } finally {
      setLoading(false);
    }
  };

  const handleCongratulationsComplete = () => {
    setShowCongratulations(false);
    // Navigate to home screen
    router.replace('/(tabs)/home');
  };

  const handleMultiOptionToggle = (option: string) => {
    setSelectedMultiOptions((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };


  const confirmDateSelection = () => {
    // Close picker when user confirms by pressing send button
    setShowDatePicker(false);
  };

  const playAudio = async (messageIndex: string) => {
    const index = parseInt(messageIndex);
    const message = conversationHistory[index];
    if (message && message.hasAudio) {
      await generateAndPlaySpeech(message.message);
    }
  };

  const renderInput = () => {
    const step = onboardingSteps[currentStep];
    switch (step.type) {
      case 'text':
        return (
          <Animated.View style={{ opacity: inputOpacity, flex: 1 }} pointerEvents="box-none">
            <TextInput
              style={styles.input}
              placeholder={getLocalizedPlaceholder(step, selectedLanguage)}
              placeholderTextColor="rgba(31, 41, 55, 0.5)"
              value={userResponse}
              onChangeText={setUserResponse}
              autoCapitalize={step.id === 'current_school' ? 'words' : 'sentences'}
              autoCorrect={true}
              autoFocus={false}
              editable={true}
              returnKeyType="send"
              onFocus={() => {
                // Ensure input can receive focus
              }}
              onSubmitEditing={() => {
                const currentStepData = onboardingSteps[currentStep];
                const hasValidInput = currentStepData.type === 'multiselect' 
                  ? selectedMultiOptions.length > 0 
                  : userResponse.trim();
                
                if (hasValidInput) {
                  handleNextStep();
                }
              }}
              blurOnSubmit={false}
              multiline={false}
              keyboardType="default"
              textContentType="none"
              clearButtonMode="while-editing"
              importantForAccessibility="yes"
              accessibilityLabel="Text input"
            />
          </Animated.View>
        );
      case 'select':
        const localizedOptions = getLocalizedOptions(step, selectedLanguage);
        return (
          <Animated.View style={[{ opacity: inputOpacity, flex: 1 }, styles.optionsContainer]}>
            {localizedOptions.map((option, index) => {
              const originalOption = step.options?.[index] || option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    userResponse === originalOption && styles.optionButtonActive,
                  ]}
                  onPress={() => setUserResponse(originalOption)}
                >
                  <Text style={[
                    styles.optionText,
                    userResponse === originalOption && styles.optionTextActive,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        );
      case 'date':
        return (
          <Animated.View style={[{ opacity: inputOpacity, flex: 1 }, styles.dateInputContainer]}>
            <TouchableOpacity 
              style={styles.dateInputButton}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={[
                styles.dateInputText,
                { color: userResponse ? '#111827' : '#9CA3AF' }
              ]}>
                {userResponse || step.placeholder}
              </Text>
              <Calendar size={20} color="#00FF00" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()} // Don't allow future dates
                minimumDate={new Date(1900, 0, 1)} // Reasonable minimum date
                onChange={handleDateChange}
              />
            )}
          </Animated.View>
        );
      case 'multiselect':
        const localizedMultiOptions = getLocalizedOptions(step, selectedLanguage);
        return (
          <Animated.View style={[{ opacity: inputOpacity, flex: 1 }, styles.optionsContainer]}>
            {localizedMultiOptions.map((option, index) => {
              const originalOption = step.options?.[index] || option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    selectedMultiOptions.includes(originalOption) && styles.optionButtonActive,
                    isSubmitting && styles.optionButtonSubmitting,
                  ]}
                  onPress={() => handleMultiOptionToggle(originalOption)}
                  disabled={isSubmitting}
                >
                  <Text style={[
                    styles.optionText,
                    selectedMultiOptions.includes(originalOption) && styles.optionTextActive,
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: pageFadeAnim }]}>
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0a0015', '#1a0033', '#0d001a', '#000000']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            {/* Profile Picture - Left */}
            <View style={styles.profilePicContainer}>
              <Image 
                source={require('../assets/images/square.png')}
                style={styles.profilePic}
                resizeMode="cover"
              />
            </View>
            
            {/* Center - Title */}
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Orientation Time</Text>
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Genybot</Text>
              </View>
            </View>
            
            {/* Right - Mode Switch Slider */}
            <View style={styles.switchSliderContainer}>
              {(step === 'chat' || step === 'voice') && (
                <TouchableOpacity 
                  style={styles.switchSlider}
                  onPress={() => {
                    const newStep = step === 'chat' ? 'voice' : 'chat';
                    setStep(newStep);
                    setUserResponse('');
                    setIsRecording(false);
                    setIsProcessing(false);
                    setAiTyping(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Animated.View style={[
                    styles.switchThumb,
                    step === 'voice' && styles.switchThumbRight,
                  ]}>
                    {step === 'chat' ? (
                      <MessageCircle size={16} color="#000000" />
                    ) : (
                      <Mic size={16} color="#000000" />
                    )}
                  </Animated.View>
                  <View style={styles.switchIcons}>
                    <MessageCircle size={14} color={step === 'chat' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />
                    <Mic size={14} color={step === 'voice' ? '#FFFFFF' : 'rgba(255,255,255,0.4)'} />
                  </View>
            </TouchableOpacity>
              )}
            </View>
          </View>

          {(step === 'language' || step === 'modeSelection') ? (
            // Unified Selection Screen - White Background with Vibrant Colors
            <View style={styles.selectionContainerWhite}>
              {/* Speech Bubble - Centered between header and animation */}
              <View style={styles.speechBubbleCentered}>
                <Text style={styles.speechBubbleTextVibrant} numberOfLines={4}>
                  {step === 'language' 
                    ? `Hi ${userName}, I'm Genybot, your AI tutor. What language do you prefer me to talk? 🤖`
                    : (selectedLanguage === 'Bahasa Melayu'
                      ? `There, bagaimana anda ingin melengkapkan orientasi anda?`
                      : `There, how would you like to complete your orientation?`)}
                </Text>
                <View style={styles.speechBubbleTailVibrant} />
              </View>

              {/* Lottie Animation */}
              <View style={styles.lottieContainer}>
                <LottieView
                  source={require('../assets/images/animation (2).json')}
                  style={styles.lottieViewer}
                  autoPlay
                  loop
                />
              </View>

              {/* Dynamic Content Area */}
              {step === 'language' ? (
                // Language Selection Content
                <>
                  <View style={styles.welcomeTextContainerWhite}>
                    <Text style={styles.selectionTitleVibrant}>Please select a language</Text>
                    <Text style={styles.selectionSubtitleVibrant}>
                      Choose your preferred language for onboarding
                    </Text>
                  </View>

                  <View style={styles.languageButtonsVibrant}>
                    {['English', 'Bahasa Melayu'].map((lang) => (
                      <TouchableOpacity 
                        key={lang}
                        style={styles.languageButtonVibrant}
                        onPress={() => handleLanguageSelection(lang)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.languageButtonTextVibrant}>
                          {lang === 'English' ? '🇬🇧' : '🇲🇾'} {lang}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                // Mode Selection Content
                <>
                  <View style={styles.welcomeTextContainerWhite}>
                    <Text style={styles.selectionTitleVibrant}>
                      {selectedLanguage === 'Bahasa Melayu' 
                        ? 'Selamat datang ke Genius!' 
                        : 'Welcome to Genius!'}
                    </Text>
                    <Text style={styles.selectionSubtitleVibrant}>
                      {selectedLanguage === 'Bahasa Melayu'
                        ? 'Bagaimana anda ingin melengkapkan profil anda?'
                        : 'How would you like to complete your profile?'}
                    </Text>
                  </View>

                  <View style={styles.modeButtonsVibrant}>
                    <TouchableOpacity 
                      style={styles.modeButtonVibrant}
                      onPress={() => handleModeSelection('chat')}
                      activeOpacity={0.8}
                    >
                      <MessageCircle size={32} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.modeButtonTitleVibrant}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modeButtonVibrant}
                      onPress={() => handleModeSelection('voice')}
                      activeOpacity={0.8}
                    >
                      <Mic size={32} color="#FFFFFF" strokeWidth={2} />
                      <Text style={styles.modeButtonTitleVibrant}>Voice</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ) : step === 'loading' ? (
            // Simplified Loading Page - No Heavy Animations
            <View style={styles.loadingContainer}>
              <View style={styles.loadingAvatar}>
                <TutorpalAvatar state="talking" size={120} />
              </View>
              
              <View style={styles.loadingContent}>
                <Text style={styles.loadingTitle}>
                  {selectedLanguage === 'Bahasa Melayu' 
                    ? 'Menyediakan Genybot...' 
                    : 'Preparing Genybot...'}
                </Text>
                <Text style={styles.loadingSubtitle}>
                  {selectedLanguage === 'Bahasa Melayu' 
                    ? 'Sila tunggu sebentar...' 
                    : 'Please wait a moment...'}
                </Text>
                
                <View style={styles.loadingDots}>
                  <View style={[styles.loadingDot, { backgroundColor: '#00FF00' }]} />
                  <View style={[styles.loadingDot, { backgroundColor: '#00FF00' }]} />
                  <View style={[styles.loadingDot, { backgroundColor: '#00FF00' }]} />
                </View>
              </View>
            </View>
          ) : step === 'voice' ? (
            // Voice Mode - Jom Tanya Style
            <Animated.View 
              style={[
                styles.voiceContainer, 
                { 
                  opacity: modeOpacity,
                  transform: [{ translateY: contentSlide }],
                }
              ]}
            >
              {/* Lottie Avatar */}
              <View style={styles.voiceAvatarSection}>
                <LottieView
                  source={require('../assets/images/animation (2).json')}
                  style={styles.voiceLottieViewer}
                  autoPlay
                  loop
                />
              </View>

              {/* Current Question or AI Response */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>
                  {conversationHistory.length > 0 
                    ? conversationHistory[conversationHistory.length - 1].message
                    : getLocalizedQuestion(onboardingSteps[currentStep], selectedLanguage)}
                </Text>
              </View>

              {/* Answer Input Field */}
              {(onboardingSteps[currentStep].type === 'text' || onboardingSteps[currentStep].type === 'date') && (
                <View style={styles.voiceAnswerContainer}>
                  {onboardingSteps[currentStep].id === 'birth_date' ? (
                    // Date Selector for Birth Date - Same design as chat section
                    <View style={styles.voiceDateInputContainer}>
                      <TouchableOpacity 
                        style={styles.voiceDateInputButton}
                        onPress={() => setShowDatePicker(!showDatePicker)}
                      >
                        <Text style={[
                          styles.voiceDateInputText,
                          { color: userResponse ? '#1F2937' : '#6B7280' }
                        ]}>
                          {userResponse || getLocalizedPlaceholder(onboardingSteps[currentStep], selectedLanguage)}
                        </Text>
                        <Calendar size={20} color="#7C3AED" />
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          maximumDate={new Date()}
                          minimumDate={new Date(1950, 0, 1)}
                          onChange={handleDateChange}
                        />
                      )}
                    </View>
                  ) : (
                    // Text Input for Other Questions
                    <TextInput
                      style={styles.voiceAnswerInput}
                      placeholder={getLocalizedPlaceholder(onboardingSteps[currentStep], selectedLanguage)}
                      placeholderTextColor="#6B7280"
                      value={userResponse}
                      onChangeText={setUserResponse}
                      autoCapitalize="words"
                      autoCorrect={false}
                      multiline={onboardingSteps[currentStep].type === 'text' && onboardingSteps[currentStep].id !== 'name_confirmation'}
                    />
                  )}
                  <TouchableOpacity
                    style={[styles.voiceSendButton, 
                      (onboardingSteps[currentStep].id === 'birth_date' ? false : !userResponse.trim()) && styles.voiceSendButtonDisabled
                    ]}
                    onPress={handleNextStep}
                    disabled={onboardingSteps[currentStep].id === 'birth_date' ? false : !userResponse.trim()}
                  >
                    <Text style={styles.voiceSendButtonText}>
                      {selectedLanguage === 'Bahasa Melayu' ? 'Hantar' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Voice Response Display or Options */}
              {onboardingSteps[currentStep].type === 'select' || onboardingSteps[currentStep].type === 'multiselect' ? (
                <View style={styles.voiceOptionsContainer}>
                  <View style={styles.optionsGrid}>
                    {onboardingSteps[currentStep].options?.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.voiceOptionButton,
                          (onboardingSteps[currentStep].type === 'multiselect' 
                            ? selectedMultiOptions.includes(option)
                            : userResponse === option
                          ) && styles.voiceOptionButtonActive,
                          isSubmitting && styles.voiceOptionButtonSubmitting,
                        ]}
                        onPress={() => {
                          if (onboardingSteps[currentStep].type === 'multiselect') {
                            handleMultiOptionToggle(option);
                          } else {
                            setUserResponse(option);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        <Text style={[
                          styles.voiceOptionText,
                          (onboardingSteps[currentStep].type === 'multiselect'
                            ? selectedMultiOptions.includes(option)
                            : userResponse === option
                          ) && styles.voiceOptionTextActive,
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity 
                    style={[styles.voiceSubmitButton, 
                      (onboardingSteps[currentStep].type === 'multiselect' && selectedMultiOptions.length === 0) && styles.voiceSubmitButtonDisabled
                    ]}
                    onPress={handleNextStep}
                    disabled={onboardingSteps[currentStep].type === 'multiselect' && selectedMultiOptions.length === 0}
                  >
                    <Text style={styles.voiceSubmitButtonText}>
                      {loading ? 'Saving...' : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Processing Indicator */}
              {isProcessing && (
                <View style={styles.voiceProcessingContainer}>
                  <Animatable.View 
                    animation="rotate" 
                    iterationCount="infinite" 
                    duration={1000}
                  >
                    <Sparkles size={24} color="#7C3AED" />
                  </Animatable.View>
                  <Text style={styles.voiceProcessingText}>
                    {selectedLanguage === 'Bahasa Melayu' ? 'Memproses...' : 'Processing...'}
                  </Text>
                </View>
              )}

              {/* Mic Button - Fixed at Bottom */}
              {(onboardingSteps[currentStep].type === 'text' || onboardingSteps[currentStep].type === 'date') && (
                <View style={styles.voiceMicContainerFixed}>
                  <TouchableOpacity 
                    style={[
                      styles.voiceMicButtonSmall,
                      isRecording && styles.voiceMicButtonActive,
                      isProcessing && styles.voiceMicButtonProcessing
                    ]}
                    onPressIn={handleMicPressIn}
                    onPressOut={handleMicPressOut}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                    delayPressIn={0}
                    delayPressOut={0}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {isProcessing ? (
                      <Animatable.View animation="rotate" iterationCount="infinite" duration={1000}>
                        <Sparkles size={32} color="#FFFFFF" />
                      </Animatable.View>
                    ) : isRecording ? (
                      <Animatable.View animation="pulse" iterationCount="infinite" duration={500}>
                        <MicOff size={40} color="#FFFFFF" />
                      </Animatable.View>
                    ) : (
                      <Image 
                        source={require('../assets/images/mic.png')} 
                        style={styles.voiceMicIconSmall}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                  
                  <Text style={styles.voiceInstructions}>
                    {isRecording 
                      ? 'Release to stop' 
                      : isProcessing 
                        ? 'Processing...' 
                        : 'Hold to record'
                    }
                  </Text>
                </View>
              )}

              {/* Step Progress */}
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  Step {currentStep + 1} of {onboardingSteps.length}
                </Text>
              </View>
            </Animated.View>
          ) : step === 'chat' ? (
            // Chat Mode - White Background with Vibrant Colors
            <KeyboardAvoidingView 
              style={styles.chatModeContainer}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              {/* Messages Area */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesArea}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                {conversationHistory.length === 0 ? (
                  // Fallback message if no conversation history
                  <Animatable.View
                    animation="fadeIn"
                    duration={500}
                    style={styles.messageWrapper}
                  >
                    <View style={styles.aiIcon}>
                      <Sparkles size={14} color="#00FF00" />
                    </View>
                    <View style={styles.aiBubbleGlass}>
                      <Text style={styles.aiTextGlass}>
                        {selectedLanguage === 'Bahasa Melayu' 
                          ? 'Hi! Saya Genybot, AI tutor anda! 👋 Mari kita berkenalan!'
                          : 'Hi! I\'m Genybot, your AI study buddy! 👋 Let\'s get to know each other!'}
                      </Text>
                    </View>
                  </Animatable.View>
                ) : conversationHistory.map((msg, index) => (
                  <Animatable.View
                    key={`msg-${index}-${msg.timestamp.getTime()}`}
                    animation="fadeIn"
                    duration={150}
                    delay={index * 25}
                    style={[
                      styles.messageWrapper,
                      msg.type === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
                    ]}
                  >
                    {msg.type === 'ai' && (
                      <View style={styles.aiIcon}>
                        <Sparkles size={14} color="#00FF00" />
                      </View>
                    )}
                    
                    <View style={[
                      styles.messageBubbleGlass,
                      msg.type === 'user' ? styles.userBubbleGlass : styles.aiBubbleGlass,
                    ]}>
                      <Text style={[
                        styles.messageTextGlass,
                        msg.type === 'user' ? styles.userTextGlass : styles.aiTextGlass,
                      ]}>
                        {index === 0 && msg.type === 'ai' && userName 
                          ? `Great ${userName}, ${msg.message}`
                          : msg.message}
                      </Text>
                    </View>
                  </Animatable.View>
                ))}
                
                {aiTyping && (
                  <Animatable.View 
                    animation="fadeIn" 
                    style={styles.typingWrapper}
                  >
                    <View style={styles.aiIcon}>
                      <Sparkles size={14} color="#00FF00" />
                    </View>
                    <View style={styles.typingBubbleGlass}>
                      <Animatable.View 
                        animation="pulse" 
                        iterationCount="infinite"
                        duration={1000}
                        style={styles.typingDots}
                      >
                        <View style={styles.typingDot} />
                        <View style={styles.typingDot} />
                        <View style={styles.typingDot} />
                      </Animatable.View>
                    </View>
                  </Animatable.View>
                )}
              </ScrollView>

              {/* Minimal Glass Input Area */}
              <Animatable.View 
                animation="fadeIn" 
                duration={200}
                style={styles.glassInputContainer}
              >
                <View style={styles.glassInputWrapper}>
                  {renderInput()}
                  <Animatable.View 
                    animation="fadeIn" 
                    duration={150}
                    delay={50}
                  >
                  <TouchableOpacity 
                    style={styles.glassSendButton}
                    onPress={() => {
                      const currentStepData = onboardingSteps[currentStep];
                      const hasValidInput = currentStepData.type === 'multiselect' 
                        ? selectedMultiOptions.length > 0 
                        : userResponse.trim();
                      
                      if (hasValidInput) {
                        handleNextStep();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                      {loading ? (
                        <LoadingSpinner size={16} color="#000000" />
                      ) : (
                        <Send size={16} color="#000000" strokeWidth={2} />
                      )}
                    </TouchableOpacity>
                  </Animatable.View>
                </View>
                
                {/* Progress Indicator */}
                <View style={styles.progressIndicator}>
                  <Text style={styles.progressText}>
                    {selectedLanguage === 'Bahasa Melayu' 
                      ? `Langkah ${currentStep + 1} dari ${onboardingSteps.length}`
                      : `Step ${currentStep + 1} of ${onboardingSteps.length}`
                    }
                  </Text>
                </View>
              </Animatable.View>
            </KeyboardAvoidingView>
          ) : null}
        </SafeAreaView>
      </View>
      
      {/* Congratulations Popup */}
      <CongratulationsPopup
        isVisible={showCongratulations}
        onComplete={handleCongratulationsComplete}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00FF00',
  },
  onlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#00FF00',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 12,
  },
  profilePic: {
    width: '100%',
    height: '100%',
  },
  switchSliderContainer: {
    width: 80,
    height: 40,
  },
  switchSlider: {
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  switchThumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00FF00',
    position: 'absolute',
    left: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 8,
  },
  switchThumbRight: {
    left: 44,
  },
  switchIcons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: -1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  // New White Background Chat Styles
  chatModeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  messagesArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messagesContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  messageWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  messageBubbleGlass: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  userBubbleGlass: {
    backgroundColor: '#C4F0C4',
    borderBottomRightRadius: 4,
  },
  aiBubbleGlass: {
    backgroundColor: '#F3E8FF',
    borderBottomLeftRadius: 4,
  },
  messageTextGlass: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  userTextGlass: {
    color: '#1F2937',
    fontWeight: '500',
  },
  aiTextGlass: {
    color: '#1F2937',
  },
  typingWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typingBubbleGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 4,
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  typingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    padding: 15,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666666',
  },
  // Compact Boxy Input Container Styles
  glassInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  glassInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  glassSendButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    marginLeft: 'auto',
  },
  progressIndicator: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 0,
  },
  progressText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  // Loading Page Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingAvatar: {
    marginBottom: 40,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 0,
    includeFontPadding: false,
    minHeight: 40,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    flex: 1,
  },
  optionButton: {
    backgroundColor: '#F8F7FF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  optionButtonSubmitting: {
    opacity: 0.3,
  },
  optionText: {
    color: '#111827',
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F7FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 52,
  },
  dateInputText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
    color: '#111827',
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 32,
    paddingTop: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  // Mode Selection Styles
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  // White Background Selection Container
  selectionContainerWhite: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  selectionAvatar: {
    marginBottom: 32,
    alignItems: 'center',
  },
  splineAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 260,
    width: '100%',
    position: 'relative',
    marginBottom: 10,
    marginTop: -20,
  },
  splineViewer: {
    width: 280,
    height: 260,
    backgroundColor: 'transparent',
  },
  lottieViewer: {
    width: 280,
    height: 260,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  // Centered Speech Bubble for White Background
  speechBubbleCentered: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    marginTop: 10,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 320,
  },
  speechBubbleTextVibrant: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
  },
  speechBubbleTailVibrant: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#7C3AED',
  },
  // Vibrant Styles for White Background
  welcomeTextContainerWhite: {
    marginBottom: 24,
    alignItems: 'center',
  },
  selectionTitleVibrant: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  selectionSubtitleVibrant: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  languageButtonsVibrant: {
    width: '100%',
    gap: 12,
  },
  languageButtonVibrant: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  languageButtonTextVibrant: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeButtonsVibrant: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modeButtonVibrant: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    justifyContent: 'center',
    gap: 12,
  },
  modeButtonTitleVibrant: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  speechBubbleTop: {
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -135 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    width: 270,
    maxWidth: 270,
    zIndex: 100,
  },
  welcomeTextContainer: {
    marginBottom: 20,
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: 220,
  },
  speechBubbleText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 17,
  },
  speechBubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.95)',
  },
  switchButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  selectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'center',
    gap: 10,
  },
  modeButtonTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Voice Mode Styles
  voiceContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  voiceConversationContainer: {
    maxHeight: 200,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  voiceMessageWrapper: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  voiceUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
    maxWidth: '80%',
  },
  voiceAiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: '80%',
  },
  voiceMessageText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    lineHeight: 22,
  },
  voiceUserMessageText: {
    color: '#00FF00',
  },
  voiceAiMessageText: {
    color: '#FFFFFF',
  },
  voiceAnswerContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  voiceAnswerInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    minHeight: 50,
  },
  voiceSendButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  voiceSendButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  voiceSendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#000000',
  },
  dateSelectorContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dateSelectorLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  datePicker: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
    textAlign: 'center',
  },
  voiceDateInputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  voiceDateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 52,
    width: '100%',
  },
  voiceDateInputText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
    textAlign: 'left',
  },
  voiceAvatarSection: {
    alignItems: 'center',
    marginTop: -10,
    height: 220,
    width: '100%',
  },
  voiceSplineViewer: {
    width: 260,
    height: 220,
    backgroundColor: 'transparent',
  },
  voiceLottieViewer: {
    width: 260,
    height: 220,
  },
  questionContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginVertical: 32,
  },
  questionText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 28,
  },
  voiceResponseContainer: {
    marginHorizontal: 32,
    backgroundColor: 'rgba(0, 255, 0, 0.15)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  voiceProcessingContainer: {
    marginHorizontal: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  voiceProcessingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  voiceResponseText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  voiceResponseActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    marginTop: 8,
  },
  voiceSubmitButtonSmall: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#00FF00',
    borderRadius: 8,
  },
  voiceMicContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  voiceMicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 20,
  },
  voiceMicContainerFixed: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  voiceMicButtonSmall: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FF8C42',
  },
  voiceMicIconSmall: {
    width: 100,
    height: 100,
  },
  voiceMicButtonActive: {
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
    transform: [{ scale: 1.2 }],
    borderColor: '#FF6666',
  },
  voiceMicButtonProcessing: {
    backgroundColor: '#FF8C42',
    shadowColor: '#FF8C42',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
    borderColor: '#FFA366',
  },
  micInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceMicIcon: {
    width: 60,
    height: 60,
  },
  voiceInstructions: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  voiceOptionsContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  voiceOptionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
  },
  voiceOptionButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  voiceOptionButtonSubmitting: {
    opacity: 0.3,
  },
  voiceOptionText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    textAlign: 'center',
  },
  voiceOptionTextActive: {
    color: '#000000',
  },
  voiceSubmitButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 48,
    paddingVertical: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  voiceSubmitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  voiceSubmitButtonText: {
    fontSize: 17,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  voiceEditButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  voiceEditButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
  },
  voiceAutoProcessingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  // New white transcription container
  voiceTranscriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: '80%',
    alignSelf: 'center',
  },
  voiceTranscriptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Language Selection Styles
  languageButtons: {
    width: '100%',
    gap: 16,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    backdropFilter: 'blur(20px)',
  },
  languageButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Avatar Container (used for general layout)
  avatarContainer: {
    alignItems: 'center',
  },
});