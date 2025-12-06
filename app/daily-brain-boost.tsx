import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Mic, StopCircle, Volume2, VolumeX, Zap, ChevronLeft, MicOff, Sparkles, Send, MessageSquare, Camera, CheckCircle, XCircle } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { elevenLabsVoiceService } from '../services/googleVoiceService';
import { aiService } from '../services/aiService';
import { WebView } from 'react-native-webview';
import { streakService } from '../services/streakService';
import { brainBoostHistoryService } from '../services/brainBoostHistoryService';

// Mode types for the session
type SessionMode = 'learning' | 'teaching' | 'quiz';

export default function DailyBrainBoostScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get selected subject from params
  const selectedSubject = (params.subject as string) || 'english';
  
  const [showTimeCheckModal, setShowTimeCheckModal] = useState(true); // Start visible immediately
  const [userConfirmed, setUserConfirmed] = useState(false); // Track if user pressed confirm button
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ms'>('en');
  
  // Mode management
  const [currentMode, setCurrentMode] = useState<SessionMode>('learning');
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  
  // Calculate total session time dynamically (Learning: 3min + Teaching: 7min + Quiz: 5min = 15min)
  const TOTAL_SESSION_TIME = (3 * 60) + (7 * 60) + (5 * 60); // 15 minutes total
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(TOTAL_SESSION_TIME);
  const [modeTimeRemaining, setModeTimeRemaining] = useState(3 * 60); // Learning: 3 min, Teaching: 7 min, Quiz: 5 min
  const [showModeTransition, setShowModeTransition] = useState(false);
  
  // Input mode management
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [textMessage, setTextMessage] = useState('');
  
  // Quiz mode state
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string>('');
  
  // Session tracking for history (subjects and subtopics learned)
  const [sessionTopics, setSessionTopics] = useState<Array<{
    subject: string;
    subtopics: string[];
    quizScore: number; // Number of correct answers out of 5
  }>>([]);
  const [currentTopicQuizScore, setCurrentTopicQuizScore] = useState(0); // Track score for current topic's 5 questions
  const [quizQuestionCount, setQuizQuestionCount] = useState(0); // Track which question number (1-5)
  
  const pulseAnimRef = useRef<Animatable.View>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const recordingStartTime = useRef<number>(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const conversationScrollRef = useRef<ScrollView>(null);

  // Page fade-in animation (faster for better UX)
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Faster fade-in (was 300ms)
      useNativeDriver: true,
    }).start();
    
    // Modal is now shown immediately (no delay needed)
    // Timer will NOT start until user presses "Yes, Let's Go!" button
  }, []);

  // Set language in voice service (defer until after modal is confirmed)
  useEffect(() => {
    if (!showTimeCheckModal) {
      elevenLabsVoiceService.setLanguage(currentLanguage);
    }
  }, [currentLanguage, showTimeCheckModal]);

  // Auto-scroll conversation to bottom when new messages arrive
  useEffect(() => {
    if (conversationHistory.length > 0) {
      // Scroll multiple times to ensure it reaches the bottom
      setTimeout(() => {
        conversationScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
      setTimeout(() => {
        conversationScrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
      setTimeout(() => {
        conversationScrollRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [conversationHistory]);

  // Get subject display name
  const getSubjectDisplayName = () => {
    const subjectNames: { [key: string]: { en: string; ms: string; icon: string } } = {
      english: { en: 'English', ms: 'Bahasa Inggeris', icon: '🇬🇧' },
      bahasa: { en: 'Bahasa Malaysia', ms: 'Bahasa Malaysia', icon: '🇲🇾' },
      maths: { en: 'Mathematics', ms: 'Matematik', icon: '🔢' },
      science: { en: 'Science', ms: 'Sains', icon: '🔬' },
      sejarah: { en: 'History', ms: 'Sejarah', icon: '📚' },
    };
    
    const subject = subjectNames[selectedSubject] || subjectNames['english'];
    return {
      name: currentLanguage === 'en' ? subject.en : subject.ms,
      icon: subject.icon
    };
  };

  // Determine appropriate syllabus based on user age
  const getSyllabusInfo = () => {
    const userAge = (user as any)?.age || 0;
    
    if (userAge <= 12) {
      return {
        syllabus: 'KSSR',
        fullName: 'Kurikulum Standard Sekolah Rendah',
        level: 'Primary School',
        ageRange: '7-12'
      };
    } else if (userAge >= 13 && userAge <= 17) {
      return {
        syllabus: 'KSSM',
        fullName: 'Kurikulum Standard Sekolah Menengah',
        level: 'Secondary School',
        ageRange: '13-17'
      };
    } else {
      // Age > 17, can access both
      return {
        syllabus: 'KSSR & KSSM',
        fullName: 'Both KSSR and KSSM curricula',
        level: 'All Levels',
        ageRange: 'All ages'
      };
    }
  };

  // Timer management - ONLY runs after user confirms and session starts
  useEffect(() => {
    // Timer countdown only begins after startSession() is called (after confirm button)
    if (hasStarted && sessionStartTime > 0) {
      timerInterval.current = setInterval(() => {
        setTotalTimeRemaining((prev) => {
          if (prev <= 1) {
            // Session ended
            endSession('time_up');
            return 0;
          }
          return prev - 1;
        });

        setModeTimeRemaining((prev) => {
          if (prev <= 1) {
            // Mode time up, transition to next mode
            transitionToNextMode();
            return 5 * 60; // Reset to 5 minutes for next mode
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    }
  }, [hasStarted, sessionStartTime, currentMode]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get mode info
  const getModeInfo = (mode: SessionMode) => {
    switch (mode) {
      case 'learning':
        return {
          title: currentLanguage === 'ms' ? '📚 Mod Pembelajaran' : '📚 Learning Mode',
          description: currentLanguage === 'ms' 
            ? 'Beritahu saya apa yang anda belajar hari ini di sekolah'
            : 'Tell me what you learned today at school',
          color: '#4A90E2',
        };
      case 'teaching':
        return {
          title: currentLanguage === 'ms' ? '🎯 Mod Pengajaran & Kuiz' : '🎯 Teaching & Quiz Mode',
          description: currentLanguage === 'ms'
            ? 'Belajar 3 subtopik, kemudian kuiz 5 soalan!'
            : "Learn 3 subtopics, then quiz with 5 questions!",
          color: '#F59E0B',
        };
      case 'quiz':
        return {
          title: currentLanguage === 'ms' ? '🏆 Mod Kuiz' : '🏆 Quiz Mode',
          description: currentLanguage === 'ms'
            ? 'Masa untuk menguji pengetahuan anda!'
            : "Time to test your knowledge!",
          color: '#10B981',
        };
    }
  };

  // Generate AI greeting based on mode and user info
  const getInitialPrompt = (mode: SessionMode = 'learning') => {
    const userName = user?.full_name || 'Student';
    const weakSubjects = (user as any)?.weak_subjects || [];
    const strongSubjects = (user as any)?.strong_subjects || [];
    const syllabusInfo = getSyllabusInfo();
    const userAge = (user as any)?.age || 0;

    switch (mode) {
      case 'learning':
    return currentLanguage === 'ms'
          ? `Hai ${userName}! Selamat datang ke Daily Brain Boost! Hari ini kita ada 15 minit bersama. Mari kita mulakan dengan Mode Pembelajaran. Saya nak belajar tentang hari sekolah anda! Jadi, macam mana sekolah anda hari ini? Cerita semuanya dengan saya!`
          : `Hi ${userName}! Welcome to Daily Brain Boost! We have 15 minutes together today. Let's start with Learning Mode. I want to learn about your school day! So, how was school today? Tell me everything!`;
      
      case 'teaching':
        return currentLanguage === 'ms'
          ? `Baik ${userName}! Sekarang Mode Pengajaran & Kuiz - 12 minit! Saya akan ajar anda 3 subtopik untuk setiap subjek yang anda belajar tadi, kemudian kuiz 5 soalan untuk setiap topik! Kita akan ulang proses ini untuk semua subjek. Setiap kali lebih sukar supaya anda improve! Mari kita mulakan dengan topik pertama!`
          : `Alright ${userName}! Now Teaching & Quiz Mode - 12 minutes! I'll teach you 3 subtopics for each subject you learned today, then quiz you with 5 questions per topic! We'll repeat this process for all subjects. Each round gets harder so you can improve! Let's start with the first topic!`;
      
      case 'quiz':
        // Don't include question in initial prompt - we'll request it separately
        return currentLanguage === 'ms'
          ? `Hebat ${userName}! Sekarang Mode Kuiz! Saya akan tanya soalan tentang apa yang saya ajar dalam Mode Pengajaran tadi. Pilih jawapan A, B, C, atau D yang betul. Mari kita mulakan!`
          : `Great ${userName}! Now it's Quiz Mode! I'll ask questions about what I taught you in Teaching Mode. Select the correct answer A, B, C, or D. Let's go!`;
    }
  };

  // Auto-start session ONLY after user confirms time check modal
  useEffect(() => {
    if (!showTimeCheckModal && !hasStarted && userConfirmed) {
      // User pressed "Yes, Let's Go!" button AND modal is closed
      // Delay session start so modal can close smoothly first
      setTimeout(() => {
        startSession(); // This starts the timer
      }, 300); // Start after modal close animation completes
    }
  }, [showTimeCheckModal, userConfirmed]);

  // Get time allocation for each mode
  const getModeTime = (mode: SessionMode): number => {
    switch (mode) {
      case 'learning': return 3 * 60;   // 3 minutes
      case 'teaching': return 12 * 60;  // 12 minutes (combined teaching + quiz)
      case 'quiz': return 12 * 60;      // Same as teaching (not used separately anymore)
    }
  };

  // Transition to next mode
  const transitionToNextMode = async () => {
    let nextMode: SessionMode;
    
    if (currentMode === 'learning') {
      nextMode = 'teaching'; // Teaching mode now includes quiz
    } else {
      // Already in teaching mode (which includes quiz), end session
      endSession('completed');
      return;
    }

    // Show transition modal
    setShowModeTransition(true);
    setCurrentMode(nextMode);
    setModeTimeRemaining(getModeTime(nextMode)); // Set appropriate time for next mode

    // Generate transition prompt (non-blocking)
    try {
      const transitionPrompt = getInitialPrompt(nextMode);
      
      // Generate speech in background (non-blocking)
      generateAndPlaySpeech(transitionPrompt).catch(error => {
        console.error('Error generating transition speech:', error);
      });
      
      setConversationHistory((prev) => [
        ...prev,
        { role: 'assistant', content: transitionPrompt }
      ]);

      // Hide transition modal after 3 seconds
      setTimeout(() => {
        setShowModeTransition(false);
      }, 3000);
    } catch (error) {
      console.error('Error transitioning mode:', error);
      setShowModeTransition(false);
    }
  };

  // Request next quiz question from AI
  const requestQuizQuestion = async () => {
    setIsProcessing(true);
    
    try {
      const userName = user?.full_name || 'Student';
      const weakSubjects = (user as any)?.weak_subjects || [];
      const userAge = (user as any)?.age || 0;
      const syllabusInfo = getSyllabusInfo();
      
      const systemContext = `You are in QUIZ MODE for Malaysian ${syllabusInfo.syllabus} curriculum (age ${userAge}).

CRITICAL RULES:
1. Generate ONLY EDUCATIONAL questions from ${syllabusInfo.syllabus} curriculum
2. Questions must be about ACADEMIC subjects: Math, Science, English, Bahasa Melayu, etc.
3. NO chitchat, NO personal questions, NO general knowledge
4. Questions should test what was taught in Teaching Mode

REQUIRED FORMAT - EXACT:

QUESTION: [Educational question from curriculum]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]

${userAge <= 12 ? `KSSR PRIMARY EXAMPLES:
QUESTION: What is 10 - 3?
A) 5
B) 6
C) 7
D) 8

QUESTION: Complete: 1/2 + 1/2 = ?
A) 1/4
B) 1
C) 2
D) 1/3` : `KSSM SECONDARY EXAMPLES:
QUESTION: Solve: 3x + 6 = 15
A) x = 2
B) x = 3
C) x = 4
D) x = 5

QUESTION: What is the formula for area of a circle?
A) πr²
B) 2πr
C) πd
D) r²`}

FOCUS ON:
- ${weakSubjects.join(', ')} (their weak subjects)
- Topics taught in Teaching Mode
- ${syllabusInfo.syllabus} curriculum content
- Academic concepts appropriate for age ${userAge}

BANNED:
❌ "How are you?"
❌ "What's your favorite color?"
❌ Any non-educational questions

Generate ONE educational question NOW in the exact format above!`;

      const updatedHistory = [
        { role: 'system' as const, content: systemContext },
        ...conversationHistory,
        { role: 'user' as const, content: 'Ask me a quiz question now.' }
      ];
      
      const response = await aiService.sendMessage(updatedHistory, currentLanguage);
      if (response.success && response.message) {
        setConversationHistory([
          ...conversationHistory,
          { role: 'assistant', content: response.message }
        ]);
        
        // Parse the question
        parseQuizQuestion(response.message);
      }
    } catch (error) {
      console.error('Error requesting quiz question:', error);
      Alert.alert('Error', 'Failed to load quiz question');
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual mode skip
  // End session
  const endSession = async (reason: 'time_up' | 'completed' | 'manual') => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    // Save session data to brain boost history
    console.log('📊 Session Topics at end:', sessionTopics);
    console.log('💾 Attempting to save brain boost history for user:', user?.id);
    
    if (user?.id && sessionTopics.length > 0) {
      try {
        console.log('✅ Starting to save session data...');
        // Calculate total quiz stats from all topics
        const totalQuestions = sessionTopics.length * 5; // 5 questions per topic
        const totalCorrect = sessionTopics.reduce((sum, topic) => sum + topic.quizScore, 0);
        const scorePercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        
        // Calculate session duration in seconds
        const durationSeconds = sessionStartTime > 0 ? Math.floor((Date.now() - sessionStartTime) / 1000) : 900; // 15 min default
        
        // Save each topic as a separate session OR save as one combined session
        // Let's save as one combined session with all topics
        const allSubjects = [...new Set(sessionTopics.map(t => t.subject))];
        const allSubtopics = sessionTopics.flatMap(t => t.subtopics);
        
        const result = await brainBoostHistoryService.recordSession(
          user.id,
          'practice', // Mode type for daily brain boost
          allSubjects.join(', '), // Comma-separated subjects
          allSubtopics, // Array of all subtopics
          durationSeconds,
          totalQuestions,
          totalCorrect,
          scorePercentage,
          'medium'
        );
        
        if (result) {
          console.log('✅ Brain boost session saved successfully!', result);
          console.log('📈 Points earned:', result.pointsEarned);
        } else {
          console.log('⚠️ Failed to save session - no result returned');
        }
      } catch (error) {
        console.error('❌ Error saving brain boost session:', error);
      }
    } else {
      console.log('⚠️ Session NOT saved because:');
      console.log('  - User ID:', user?.id || 'MISSING');
      console.log('  - Topics learned:', sessionTopics.length);
      if (sessionTopics.length === 0) {
        console.log('  ⚠️ No topics were tracked! AI needs to announce "TOPIC:" and "SUBTOPICS:" at start of each teaching cycle');
      }
    }

    const message = reason === 'time_up'
      ? (currentLanguage === 'ms' 
        ? 'Masa tamat! Terima kasih kerana sesi hari ini. Jumpa lagi esok!' 
        : 'Time\'s up! Thank you for today\'s session. See you tomorrow!')
      : (currentLanguage === 'ms'
        ? 'Tahniah! Anda telah selesaikan semua mod. Kerja yang bagus!'
        : 'Congratulations! You\'ve completed all modes. Great work!');

    Alert.alert(
      currentLanguage === 'ms' ? 'Sesi Tamat' : 'Session Ended',
      message,
      [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]
    );
  };

  const startSession = () => {
    // This function is called ONLY after user presses "Yes, Let's Go!" button
    // Timer countdown begins here
    setHasStarted(true); // Enables timer interval
    setSessionStartTime(Date.now()); // Records session start time (timer begins!)
    setCurrentMode('learning');
    setTotalTimeRemaining(15 * 60); // Total: 3 min learning + 12 min teaching/quiz
    setModeTimeRemaining(3 * 60); // Start with 3 minutes for Learning Mode

    // Generate and play speech in background (non-blocking for instant UI)
    setIsProcessing(true);
    const initialPrompt = getInitialPrompt('learning');
    
    // Run speech generation in background
    generateAndPlaySpeech(initialPrompt)
      .then(() => {
        // Add to conversation history after speech is generated
        setConversationHistory([{ role: 'assistant', content: initialPrompt }]);
      })
      .catch((error) => {
        console.error('Error starting session:', error);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const handleMicPressIn = async () => {
    try {
      if (pulseAnimRef.current) {
        pulseAnimRef.current.pulse(800);
      }

      const success = await elevenLabsVoiceService.startRecording();
      if (!success) {
        Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
        setIsRecording(false);
      } else {
        setIsRecording(true);
        recordingStartTime.current = Date.now(); // Track when recording started
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleMicPressOut = async () => {
    if (!isRecording) return;
    
    // Check minimum recording duration (at least 1 second)
    const recordingDuration = Date.now() - recordingStartTime.current;
    if (recordingDuration < 1000) {
      Alert.alert(
        currentLanguage === 'ms' ? 'Terlalu Pendek' : 'Too Short',
        currentLanguage === 'ms' 
          ? 'Sila tahan butang untuk sekurang-kurangnya 1 saat untuk merakam.'
          : 'Please hold the button for at least 1 second to record.',
        [{ text: 'OK' }]
      );
      setIsRecording(false);
      // Stop the recording
      try {
        await elevenLabsVoiceService.stopRecording();
      } catch (e) {
        // Ignore error
      }
      return;
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    
    try {
      const recordingResult = await elevenLabsVoiceService.stopRecording();
      
      if (recordingResult.success && recordingResult.text) {
        const userText = recordingResult.text;
        setUserMessage(userText);
        
        // Add user message to conversation history with personalized context
        const userName = user?.full_name || 'Student';
        const weakSubjects = (user as any)?.weak_subjects || [];
        const strongSubjects = (user as any)?.strong_subjects || [];
        const userAge = (user as any)?.age || 0;
        const syllabusInfo = getSyllabusInfo();
        
        // Age-specific syllabus guidance
        let syllabusGuidance = '';
        if (userAge <= 12) {
          syllabusGuidance = `This student is ${userAge} years old (Primary School) and should ONLY learn KSSR (Kurikulum Standard Sekolah Rendah) content. Topics should be appropriate for Year ${Math.min(6, Math.max(1, userAge - 6))} level.`;
        } else if (userAge >= 13 && userAge <= 17) {
          syllabusGuidance = `This student is ${userAge} years old (Secondary School) and should ONLY learn KSSM (Kurikulum Standard Sekolah Menengah) content. Topics should be appropriate for Form ${Math.min(5, Math.max(1, userAge - 12))} level.`;
        } else {
          syllabusGuidance = `This student is ${userAge} years old and can access BOTH KSSR and KSSM content. They may be a teacher, parent, or older learner helping younger students.`;
        }
        
        // Mode-specific context
        let modeContext = '';
        switch (currentMode) {
          case 'learning':
            modeContext = `You are in LEARNING MODE (3 minutes). This mode is for YOU (the AI) to LEARN about ${userName}'s school day. You are gathering information to guide what to teach in the next mode.

YOUR TASK - INFORMATION GATHERING:
1. Learn what happened at their school today
2. Discover what subjects they studied
3. Find out what topics were covered in each subject
4. Understand which topics they found easy/difficult
5. Note any confusion or struggles
6. Learn about their daily school life
7. Take mental notes - this information guides Teaching Mode

CONVERSATION APPROACH:
- "How was school today? Tell me everything!"
- "What subjects did you have?"
- "What did you learn in [subject] class?"
- "How did you find that topic?"
- "Was anything confusing or difficult?"
- "What else happened in class?"
- Be friendly, curious, and encouraging
- Keep it conversational like chatting with a friend

IMPORTANT - YOU ARE LEARNING ABOUT THEM:
- This mode is about gathering information FOR YOU
- Listen carefully and remember what they say
- Don't teach deeply yet - that's for Teaching Mode
- Your notes guide what to teach next
- Acknowledge briefly but focus on discovery

WHAT YOU'RE GATHERING FOR TEACHING MODE:
✓ What subjects they studied today
✓ What topics were covered
✓ Which topics need teaching/reinforcement
✓ What confused them
✓ Their weak subjects (from profile: ${weakSubjects.join(', ')})

FOCUS: Learn about their ${syllabusInfo.syllabus} school day. This information guides the next mode.`;
            break;
          case 'teaching':
            modeContext = `You are in COMBINED TEACHING & QUIZ MODE (12 minutes). This mode integrates teaching with immediate testing!

🔄 **REPEATING CYCLE STRUCTURE:**

For EACH topic/subject (repeat until time runs out):

**PHASE 1: TEACH 3 SUBTOPICS (2-3 minutes)**
→ Pick a main topic from what they learned in Learning Mode
→ Break it into 3 related subtopics that cover the WHOLE chapter
→ Teach each subtopic completely (45-60 sec each)
→ Use Malaysian examples, fun facts, memory tricks
→ Example - If topic is "Fractions":
  • Subtopic 1: Understanding numerator and denominator
  • Subtopic 2: Adding fractions with same denominator
  • Subtopic 3: Adding fractions with different denominators

TEACHING STRUCTURE FOR EACH SUBTOPIC:
• Clear explanation (30 sec)
• Malaysian example (15 sec)
• Memory trick or fun fact (15 sec)

**PHASE 2: CHECK UNDERSTANDING (30 seconds)**
→ After finishing all 3 subtopics, say: "I just taught you 3 parts of [topic]. Do you understand all 3 subtopics?"
→ WAIT for student to respond YES or NO
→ Track their understanding

**PHASE 3A: If Student Says YES/UNDERSTANDS**
→ Say: "Perfect! Let's test your knowledge with 5 questions!"
→ Immediately go to PHASE 4 (quiz)

**PHASE 3B: If Student Says NO/DOESN'T UNDERSTAND**
→ Ask: "Which subtopic don't you understand? Part 1, 2, or 3?"
→ WAIT for their response
→ Re-explain that specific subtopic with different approach:
  • Use simpler language
  • Different examples (more relatable)
  • Step-by-step breakdown
  • Visual analogy
→ Ask again: "Clear now? Ready for the quiz?"
→ If YES → Go to quiz
→ If NO → Say "Let's try the quiz anyway, it will help!" → Go to quiz

**PHASE 4: 5-QUESTION QUIZ (2 minutes)**
CRITICAL: Generate 5 DIFFERENT questions! Each question MUST be UNIQUE and test different aspects!

PROGRESSIVE DIFFICULTY (MUST FOLLOW):
→ Question 1 (EASY): Basic recall from Subtopic 1
→ Question 2 (EASY): Simple application from Subtopic 2  
→ Question 3 (MEDIUM): Application from Subtopic 3
→ Question 4 (MEDIUM): Combining 2 subtopics
→ Question 5 (HARD): Complex problem using all 3 subtopics

QUIZ FORMAT - EXACTLY:
QUESTION 1: [Easy question about Subtopic 1]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]

CRITICAL RULES:
✅ Each question MUST be DIFFERENT - no repeating!
✅ Use the question number (QUESTION 1, QUESTION 2, etc.)
✅ Test different concepts from the 3 subtopics
✅ Make answers vary (not always A!)
✅ Progressive difficulty: Question 1 = easiest, Question 5 = hardest

→ Student selects A, B, C, or D
→ Provide immediate feedback:
  • If CORRECT: "Correct! ✓ [1 sentence why]"
  • If WRONG: "The answer is [LETTER]. [1 sentence explanation linking back to subtopic taught]"
→ NO DELAY - Ask next question immediately
→ After ALL 5 QUESTIONS complete → Go to PHASE 5

**PHASE 5: EVALUATE & DECIDE (30 seconds)**
After 5 questions, you MUST:
1. Count how many the student got correct (track internally)
2. If student got 0-2 correct (FAILED):
   → Say: "You got [X]/5. Let's review [topic] again to help you understand better!"
   → Go back to PHASE 1 and RE-TEACH the same topic with different approach
   → Use simpler explanations and more examples
3. If student got 3-5 correct (PASSED):
   → Say: "Great job! You got [X]/5 on [topic]! Now let's move to [next topic]!"
   → Pick next main topic from Learning Mode data
   → INCREASE difficulty level
   → Go to PHASE 1 with NEW topic
   → Repeat entire cycle: PHASE 1 → 2 → 3 → 4 → 5

**PROGRESSIVE DIFFICULTY SYSTEM:**
Cycle 1 (Basic): Foundation concepts, simple examples
Cycle 2 (Intermediate): Deeper explanations, multiple steps
Cycle 3 (Advanced): Connections between concepts, reasoning
Cycle 4+ (Expert): Critical thinking, application, problem-solving

**TOPICS PRIORITY (What to teach):**
1. Topics mentioned in Learning Mode (their school day)
2. Weak subjects: ${weakSubjects.join(', ')}
3. Related topics that build on previous cycles
4. Challenge topics for mastery

**MALAYSIAN EXAMPLES:**
- RM money (fractions, decimals, percentages)
- Nasi lemak, kuih (chemistry, measurements)
- Pasar, kedai (economics, calculations)
- Malaysian nature (science, biology)
- Local culture (history, language)

**CYCLE TIMING (12 minutes total):**
Cycle 1: 0-4 min (Teach 2min + Check 0.5min + Quiz 1.5min)
Cycle 2: 4-8 min (Teach 2min + Check 0.5min + Quiz 1.5min)
Cycle 3: 8-12 min (Teach 2min + Check 0.5min + Quiz 1.5min)
= 3 complete teaching+quiz cycles in 12 minutes

**CONVERSATION FLOW EXAMPLE:**

[Start Cycle 1 - Easy]
"Let's learn Fractions! Subtopic 1: Numerator and denominator..."
[Teaches 3 subtopics - 2 minutes]
"I just taught you 3 parts of fractions. Do you understand all 3?"
Student: "Yes"
"Perfect! Let's test with 5 questions! QUESTION: What is 1/2 + 1/4? A) 1/6 B) 2/4 C) 3/4 D) 1/8"
Student: "C"
"Correct! ✓ You remembered! Next question: QUESTION: ..."
[5 questions complete]

[Start Cycle 2 - Medium]  
"Excellent! Now let's tackle Decimals - this is harder! Subtopic 1: Place value..."
[Repeat entire process]

[Start Cycle 3 - Hard]
"You're doing great! Now Percentages - expert level! Subtopic 1: Converting fractions to percentages..."
[Repeat entire process]

CRITICAL RULES:
✅ Always teach 3 subtopics before quiz
✅ Always check understanding before quiz
✅ Always 5 questions per quiz
✅ Always increase difficulty each cycle
✅ Track what topics and subtopics are taught (for history)

**TRACKING FOR HISTORY:**
At the start of each teaching cycle, announce:
"TOPIC: [Main Subject/Topic Name]"
"SUBTOPICS: [Subtopic 1], [Subtopic 2], [Subtopic 3]"

This helps the system track what was taught for the session summary!

Example:
"TOPIC: Fractions"
"SUBTOPICS: Numerator and Denominator, Adding Same Denominators, Adding Different Denominators"
[Then teach normally...]

FOCUS: Teach complete chapters → Check understanding → Quiz immediately → Repeat with progressive difficulty!`;
            break;
          case 'quiz':
            // Quiz mode is now merged with teaching mode
            // This case kept for compatibility but uses same context as teaching
            modeContext = modeContext; // Use teaching mode context (which includes quiz)
            break;
        }
        
        const contextPrompt = `You are a Malaysian education AI tutor helping ${userName} with their Daily Brain Boost session.

STUDENT PROFILE:
- Age: ${userAge} years old
- Syllabus: ${syllabusInfo.syllabus} (${syllabusInfo.fullName})
- Level: ${syllabusInfo.level}
- Selected Subject: ${getSubjectDisplayName().name} (Focus on this subject)
- Weak subjects: ${weakSubjects.join(', ') || 'None specified'}
- Strong subjects: ${strongSubjects.join(', ') || 'None specified'}

${syllabusGuidance}

CURRENT MODE: ${modeContext}
FOCUS: Give priority to ${getSubjectDisplayName().name} content and examples

CRITICAL RULES:
1. ${userAge <= 12 ? 'ONLY teach KSSR (Primary) content' : userAge <= 17 ? 'ONLY teach KSSM (Secondary) content' : 'Can teach both KSSR and KSSM content'}
2. Use Malaysian educational context and examples (e.g., Malaysian culture, local references, Malaysian currency)
3. Keep content age-appropriate for ${userAge} years old
4. Be encouraging and culturally sensitive
5. Provide concise responses (2-3 sentences maximum)
6. If asked about topics outside the appropriate syllabus, politely redirect: "That topic is for ${userAge <= 12 ? 'secondary school (KSSM)' : 'primary school (KSSR)'}. Let's focus on your ${syllabusInfo.syllabus} content instead!"
7. Use real Malaysian school examples (e.g., "In your school...", "Like in Malaysian textbooks...")

FORMATTING RULES - SPEAK NATURALLY:
❌ NO markdown (**bold**, *italic*, etc.)
❌ NO section headers ("PRACTICE:", "MEMORY TRICK:", "English Writing: Essay")
❌ NO bullet points or structured lists
❌ NO special characters (**, __, ##, --, etc.)
✅ Just speak in plain, natural conversational sentences
✅ Like talking to a student face-to-face
✅ Natural flow, no formatting

BAD: "**Practice**: Try this... **Memory Trick**: Remember..."
GOOD: "Now try this problem. Here's a cool trick to remember it..."

Language: Respond in ${currentLanguage === 'ms' ? 'Bahasa Melayu' : 'English'}`;


        const updatedHistory = [
          { role: 'system' as const, content: contextPrompt },
          ...conversationHistory,
          { role: 'user' as const, content: userText }
        ];
        
        // Try streaming, fallback to regular if it fails
        try {
          let currentResponse = '';
          let voiceGenerated = false;
          
          const streamResponse = await aiService.sendMessageStream(
            updatedHistory, 
            currentLanguage, 
            false,
            async (chunk: string, isComplete: boolean) => {
              currentResponse = chunk;
              
              // Generate voice as soon as we have enough content (non-blocking)
              if (!voiceGenerated && (chunk.includes('.') || chunk.includes('!') || chunk.includes('?') || chunk.length > 50)) {
                voiceGenerated = true;
                generateAndPlaySpeech(chunk).catch(error => {
                  console.error('Error generating speech:', error);
                });
              }
              
              if (isComplete) {
                // Parse topic tracking if in teaching mode
                if (currentMode === 'teaching') {
                  const topicData = parseTopicTracking(chunk);
                  if (topicData) {
                    currentCycleRef.current = topicData;
                    setCurrentTopicQuizScore(0); // Reset quiz score for new topic
                    setQuizQuestionCount(0); // Reset question counter for new topic
                  }
                }
                
                // Check if this is a quiz question (don't add to conversation if it is)
                // Handle both "QUESTION:" and "QUESTION 1:", "QUESTION 2:", etc.
                const hasQuestion = /QUESTION\s*\d*:/i.test(chunk);
                const hasOptions = /[A-D]\)/m.test(chunk);
                const isQuizQuestion = hasQuestion && hasOptions;
                
                console.log('🔍 Quiz detection:', { hasQuestion, hasOptions, isQuizQuestion, chunkPreview: chunk.substring(0, 100) });
                
                if (isQuizQuestion) {
                  // Parse and display as quiz only (no conversation message)
                  console.log('✅ Detected quiz question, parsing...');
                  parseQuizQuestion(chunk);
                } else {
                  // Regular conversation - add to history
                  setConversationHistory([
                    ...conversationHistory,
                    { role: 'user', content: userText },
                    { role: 'assistant', content: chunk }
                  ]);
                }
              }
            }
          );
          
          if (!streamResponse.success) {
            throw new Error('Streaming failed, using fallback');
          }
        } catch (streamError) {
          console.log('ℹ️ Using non-streaming mode (this is normal)');
          // Fallback to regular response
          const response = await aiService.sendMessage(updatedHistory, currentLanguage);
          if (response.success && response.message) {
            // Parse topic tracking if in teaching mode
            if (currentMode === 'teaching') {
              const topicData = parseTopicTracking(response.message);
              if (topicData) {
                currentCycleRef.current = topicData;
                setCurrentTopicQuizScore(0); // Reset quiz score for new topic
                setQuizQuestionCount(0); // Reset question counter for new topic
              }
            }
            
            // Check if this is a quiz question (don't add to conversation if it is)
            // Handle both "QUESTION:" and "QUESTION 1:", "QUESTION 2:", etc.
            const hasQuestion = /QUESTION\s*\d*:/i.test(response.message);
            const hasOptions = /[A-D]\)/m.test(response.message);
            const isQuizQuestion = hasQuestion && hasOptions;
            
            console.log('🔍 Quiz detection (non-stream):', { hasQuestion, hasOptions, isQuizQuestion, messagePreview: response.message.substring(0, 100) });
            
            if (isQuizQuestion) {
              // Parse and display as quiz only (no conversation message)
              console.log('✅ Detected quiz question, parsing...');
              parseQuizQuestion(response.message);
            } else {
              // Regular conversation - add to history
              setConversationHistory([
                ...conversationHistory,
                { role: 'user', content: userText },
                { role: 'assistant', content: response.message }
              ]);
            }
            
            // Generate speech in background (non-blocking)
            generateAndPlaySpeech(response.message).catch(error => {
              console.error('Error generating speech:', error);
            });
          }
        }
      } else {
        Alert.alert('Error', recordingResult.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      setIsPlaying(true);
      
      // Generate speech audio
      const speechResponse = await elevenLabsVoiceService.generateSpeech(text, 'Wc6X61hTD7yucJMheuLN');
      
      if (speechResponse.success && speechResponse.audioUrl) {
        // Play the generated audio
        await elevenLabsVoiceService.playAudio(speechResponse.audioUrl);
      } else {
        console.error('Speech generation failed:', speechResponse.error);
      }
    } catch (error) {
      console.error('Error generating/playing speech:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const stopAudio = async () => {
    await elevenLabsVoiceService.stopAudio();
    setIsPlaying(false);
  };

  // Parse topic tracking from AI response
  const parseTopicTracking = (aiResponse: string) => {
    // Look for "TOPIC: [subject]" and "SUBTOPICS: [sub1], [sub2], [sub3]"
    const topicMatch = aiResponse.match(/TOPIC:\s*(.+)/i);
    const subtopicsMatch = aiResponse.match(/SUBTOPICS:\s*(.+)/i);
    
    if (topicMatch && subtopicsMatch) {
      const subject = topicMatch[1].trim();
      const subtopics = subtopicsMatch[1].split(',').map(s => s.trim());
      
      console.log('📚 New topic detected:', { subject, subtopics });
      
      // Don't add yet - wait until quiz is complete
      // Store temporarily for when quiz finishes
      return { subject, subtopics };
    }
    
    return null;
  };
  
  // Temp storage for current teaching cycle
  const currentCycleRef = useRef<{ subject: string; subtopics: string[] } | null>(null);

  // Parse quiz question from AI response
  const parseQuizQuestion = (aiResponse: string) => {
    console.log('📋 Parsing quiz from response:', aiResponse);
    
    const lines = aiResponse.split('\n').map(l => l.trim()).filter(l => l);
    
    let question = '';
    const options: string[] = [];
    
    for (const line of lines) {
      // Handle "QUESTION:", "QUESTION 1:", "QUESTION 2:", etc.
      if (/QUESTION\s*\d*:/i.test(line)) {
        // Extract question text after "QUESTION:" or "QUESTION 1:", etc.
        const questionMatch = line.match(/QUESTION\s*\d*:\s*(.+)/i);
        if (questionMatch && questionMatch[1]) {
          question = questionMatch[1].trim();
        }
      } else if (line.match(/^[A-D]\)/) || line.match(/^[A-D]\s/)) {
        // Handle both "A) text" and "A text" formats
        const optionText = line.replace(/^[A-D]\)\s*/, '').replace(/^[A-D]\s+/, '').trim();
        if (optionText) {
          options.push(optionText);
        }
      }
    }
    
    console.log('📋 Parsed quiz result:', { question, options, optionsLength: options.length, fullResponse: aiResponse });
    
    if (question && options.length === 4) {
      // New question found - increment counter
      setQuizQuestionCount(prev => {
        const newCount = prev + 1;
        console.log(`📝 Quiz question ${newCount}/5`);
        return newCount;
      });
      
      setCurrentQuizQuestion(question);
      setQuizOptions(options);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setIsAnswered(false);
      setShowQuizResult(false);
      setQuizFeedback('');
    } else {
      console.log('No more quiz questions found. Quiz cycle complete!');
      
      // Quiz cycle ended - check if we completed 5 questions
      if (quizQuestionCount === 5) {
        console.log('✅ 5 questions completed! Saving topic and clearing quiz UI...');
        
        // Save topic to session history
        if (currentCycleRef.current) {
          const topicData = {
            subject: currentCycleRef.current.subject,
            subtopics: currentCycleRef.current.subtopics,
            quizScore: currentTopicQuizScore
          };
          
          setSessionTopics(prev => {
            const updated = [...prev, topicData];
            console.log('💾 Saved topic to session:', topicData);
            console.log('📊 Final score:', currentTopicQuizScore, '/5');
            console.log('📊 Total topics learned:', updated.length);
            return updated;
          });
          
          // Reset for next cycle
          currentCycleRef.current = null;
          setQuizQuestionCount(0);
          setCurrentTopicQuizScore(0);
        }
        
        // Clear quiz UI to show AI's evaluation message
        setCurrentQuizQuestion('');
        setQuizOptions([]);
        setQuizFeedback('');
        setShowQuizResult(false);
      } else if (quizQuestionCount >= 3) {
        // Fallback for partial quiz completion (shouldn't happen but just in case)
        console.log('⚠️ Quiz ended early at', quizQuestionCount, 'questions');
        setCurrentQuizQuestion('');
        setQuizOptions([]);
      }
    }
  };

  // Parse correct answer from AI feedback
  const parseCorrectAnswer = (feedback: string, userSelectedIndex: number): number | null => {
    console.log('Parsing feedback:', feedback);
    console.log('User selected index:', userSelectedIndex);
    
    // Check if answer was correct (user's selection was right)
    if (feedback.toLowerCase().includes('correct!') || 
        feedback.includes('✓') || 
        feedback.toLowerCase().includes('yes!') ||
        feedback.toLowerCase().includes('perfect!') ||
        feedback.toLowerCase().includes('excellent!') ||
        feedback.toLowerCase().includes('that\'s right')) {
      console.log('Answer was CORRECT! Selected index:', userSelectedIndex);
      return userSelectedIndex;
    }
    
    // Answer was wrong, find the correct one
    // Look for patterns: "answer is A" or "The answer is B" or "correct answer is C"
    const patterns = [
      /answer is ([A-D])/i,
      /correct answer is ([A-D])/i,
      /the answer is ([A-D])/i,
      /should be ([A-D])/i,
      /it'?s ([A-D])/i,
      /actually ([A-D])/i,
    ];
    
    for (const pattern of patterns) {
      const match = feedback.match(pattern);
      if (match) {
        const letter = match[1].toUpperCase();
        const correctIdx = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        console.log('Answer was WRONG. Correct answer is:', letter, '(Index:', correctIdx, ')');
        return correctIdx;
      }
    }
    
    console.log('Could not determine correct answer from feedback');
    return null;
  };

  // Handle quiz answer selection
  const handleQuizAnswer = async (answerIndex: number) => {
    if (isAnswered || isProcessing) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setIsProcessing(true);
    
    const answerLetter = String.fromCharCode(65 + answerIndex); // 0->A, 1->B, etc
    const userText = `${answerLetter}) ${quizOptions[answerIndex]}`;
    setUserMessage(userText);
    
    try {
      // Send answer to AI for evaluation
      const userName = user?.full_name || 'Student';
      const weakSubjects = (user as any)?.weak_subjects || [];
      const strongSubjects = (user as any)?.strong_subjects || [];
      const userAge = (user as any)?.age || 0;
      const syllabusInfo = getSyllabusInfo();
      
      const contextPrompt = `Evaluate this ${syllabusInfo.syllabus} quiz answer. Student selected: ${answerLetter}
This is QUESTION ${quizQuestionCount}/5 in the current quiz cycle.
Current score before this question: ${currentTopicQuizScore}/5

STRICT RESPONSE FORMAT:

If student is CORRECT:
"Correct! ✓ [explanation]"

If student is WRONG (YOU MUST SAY "The answer is X"):
"The answer is [CORRECT LETTER]. [explanation]"

EXAMPLES:
Right: "Correct! ✓ H2O is water."
Wrong: "The answer is B. Water is H2O, not CO2."
Wrong: "The answer is A. 1/2 of RM20 is RM10."

CRITICAL: When wrong, you MUST start with "The answer is [A/B/C/D]."

${quizQuestionCount < 5 ? `
Then ask NEXT QUESTION (Question ${quizQuestionCount + 1}/5):

PROGRESSIVE DIFFICULTY:
${quizQuestionCount + 1 === 1 ? '- Question 1: EASY - Basic recall' : 
  quizQuestionCount + 1 === 2 ? '- Question 2: EASY - Simple application' : 
  quizQuestionCount + 1 === 3 ? '- Question 3: MEDIUM - Application' : 
  quizQuestionCount + 1 === 4 ? '- Question 4: MEDIUM - Combining concepts' : 
  '- Question 5: HARD - Complex problem'}

QUESTION ${quizQuestionCount + 1}: [${quizQuestionCount + 1 === 1 ? 'Easy' : quizQuestionCount + 1 === 5 ? 'Hard' : 'Medium'} question from ${syllabusInfo.syllabus}]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]

CRITICAL: 
✅ Make this question DIFFERENT from previous questions!
✅ Test a different aspect of the topic!
✅ Vary the correct answer (not always A!)
` : `
QUIZ COMPLETE! This was the last question (5/5).

Calculate final score and decide next action:
- If final score is 0-2/5: Re-teach the same topic with different approach
- If final score is 3-5/5: Move to new topic from Learning Mode

Respond with evaluation and next action.
`}`;


      const updatedHistory = [
        { role: 'system' as const, content: contextPrompt },
        ...conversationHistory,
        { role: 'user' as const, content: `My answer: ${answerLetter}` }
      ];
      
      const response = await aiService.sendMessage(updatedHistory, currentLanguage);
      if (response.success && response.message) {
        const aiMessage = response.message;
        
        // Extract just the feedback part (before the next QUESTION: or QUESTION 1:, etc.)
        const feedbackText = aiMessage.split(/QUESTION\s*\d*:/i)[0].trim();
        setQuizFeedback(feedbackText);
        
        // Parse correct answer from AI feedback (pass the selected index)
        const correctIdx = parseCorrectAnswer(aiMessage, answerIndex);
        console.log('Setting correct answer to:', correctIdx);
        if (correctIdx !== null) {
          setCorrectAnswer(correctIdx);
          
          // Track quiz score - if user got it right, increment score
          if (correctIdx === answerIndex) {
            const newScore = currentTopicQuizScore + 1;
            setCurrentTopicQuizScore(newScore);
            console.log('✅ Correct answer! Quiz score now:', newScore, '/5');
          } else {
            console.log('❌ Wrong answer. Quiz score remains:', currentTopicQuizScore);
          }
        }
        
        // Show result immediately
        setShowQuizResult(true);
        
        // DON'T add quiz feedback to conversation history - it should only show in the quiz UI
        // The feedback and next question are handled within the quiz interface
        
        // Play feedback in background (non-blocking)
        generateAndPlaySpeech(aiMessage).catch(error => {
          console.error('Error generating speech:', error);
        });
        
        // After 3 seconds, parse next question
        setTimeout(() => {
          setShowQuizResult(false);
          parseQuizQuestion(aiMessage);
        }, 3000);
      }
    } catch (error) {
      console.error('Error processing quiz answer:', error);
      Alert.alert('Error', 'Failed to process answer');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get option color based on quiz state
  const getOptionColor = (index: number): [string, string] => {
    console.log('getOptionColor called for index:', index, 'showQuizResult:', showQuizResult, 'isAnswered:', isAnswered, 'correctAnswer:', correctAnswer, 'selectedAnswer:', selectedAnswer);
    
    if (!showQuizResult || !isAnswered) {
      return ['#4A90E2', '#357ABD']; // Default blue before answering
    }
    
    // Show correct answer in green (always)
    if (correctAnswer !== null && index === correctAnswer) {
      console.log('Showing GREEN for correct answer at index:', index);
      return ['#4CAF50', '#2E7D32']; // Green for correct answer
    }
    
    // Show selected wrong answer in red
    if (index === selectedAnswer && index !== correctAnswer) {
      console.log('Showing RED for wrong answer at index:', index);
      return ['#F44336', '#D32F2F']; // Red for wrong selected
    }
    
    console.log('Showing GRAY for index:', index);
    return ['#9E9E9E', '#757575']; // Gray for unselected
  };

  // Get option icon based on quiz state
  const getOptionIcon = (index: number) => {
    if (!showQuizResult || !isAnswered) return null;

    // Checkmark for correct answer
    if (correctAnswer !== null && index === correctAnswer) {
      return <CheckCircle size={24} color="#FFFFFF" />;
    }

    // X mark for wrong selected answer
    if (index === selectedAnswer && selectedAnswer !== correctAnswer) {
      return <XCircle size={24} color="#FFFFFF" />;
    }

    return null;
  };

  const handleTextSend = async () => {
    if (!textMessage.trim()) return;
    
    const userText = textMessage.trim();
    setTextMessage(''); // Clear input
    setUserMessage(userText);
    setIsProcessing(true);
    
    try {
      // Add user message to conversation history with personalized context
      const userName = user?.full_name || 'Student';
      const weakSubjects = (user as any)?.weak_subjects || [];
      const strongSubjects = (user as any)?.strong_subjects || [];
      const userAge = (user as any)?.age || 0;
      const syllabusInfo = getSyllabusInfo();
      
      // Age-specific syllabus guidance
      let syllabusGuidance = '';
      if (userAge <= 12) {
        syllabusGuidance = `This student is ${userAge} years old (Primary School) and should ONLY learn KSSR (Kurikulum Standard Sekolah Rendah) content. Topics should be appropriate for Year ${Math.min(6, Math.max(1, userAge - 6))} level.`;
      } else if (userAge >= 13 && userAge <= 17) {
        syllabusGuidance = `This student is ${userAge} years old (Secondary School) and should ONLY learn KSSM (Kurikulum Standard Sekolah Menengah) content. Topics should be appropriate for Form ${Math.min(5, Math.max(1, userAge - 12))} level.`;
      } else {
        syllabusGuidance = `This student is ${userAge} years old and can access BOTH KSSR and KSSM content. They may be a teacher, parent, or older learner helping younger students.`;
      }
      
      // Mode-specific context (same as voice)
      let modeContext = '';
      switch (currentMode) {
        case 'learning':
          modeContext = `You are in LEARNING MODE (3 minutes). This mode is for YOU (the AI) to LEARN about ${userName}'s school day. You are gathering information to guide what to teach in the next mode.

YOUR TASK - INFORMATION GATHERING:
1. Learn what happened at their school today
2. Discover what subjects they studied
3. Find out what topics were covered in each subject
4. Understand which topics they found easy/difficult
5. Note any confusion or struggles
6. Learn about their daily school life
7. Take mental notes - this information guides Teaching Mode

CONVERSATION APPROACH:
- "How was school today? Tell me everything!"
- "What subjects did you have?"
- "What did you learn in [subject] class?"
- "How did you find that topic?"
- "Was anything confusing or difficult?"
- "What else happened in class?"
- Be friendly, curious, and encouraging
- Keep it conversational like chatting with a friend

IMPORTANT - YOU ARE LEARNING ABOUT THEM:
- This mode is about gathering information FOR YOU
- Listen carefully and remember what they say
- Don't teach deeply yet - that's for Teaching Mode
- Your notes guide what to teach next
- Acknowledge briefly but focus on discovery

WHAT YOU'RE GATHERING FOR TEACHING MODE:
✓ What subjects they studied today
✓ What topics were covered
✓ Which topics need teaching/reinforcement
✓ What confused them
✓ Their weak subjects (from profile: ${weakSubjects.join(', ')})

FOCUS: Learn about their ${syllabusInfo.syllabus} school day. This information guides the next mode.`;
          break;
        case 'teaching':
          modeContext = `You are in TEACHING MODE (7 minutes). After gathering information in Learning Mode, now TEACH NON-STOP! Make learning easy and fun.

TEACHING STRUCTURE:
PART 1 - Teach What They Learned Today (3-4 min)
- Based on what you learned in Learning Mode, teach the subjects they studied TODAY
- Expand on topics they mentioned
- Clarify anything they found confusing
- Make it deeper and clearer than what they got in class

PART 2 - Teach Their Weak Subjects (3-4 min)
- Now focus on their weak subjects: ${weakSubjects.join(', ')}
- Recap important concepts from their weak areas
- Reinforce fundamentals they struggle with

TEACHING STYLE - NON-STOP TEACHING:
✓ Keep teaching continuously - don't stop!
✓ Move from topic to topic smoothly
✓ Use FUN FACTS to make concepts memorable
✓ Use EASY examples (Malaysian context: RM, food, daily life)
✓ Break down complex topics into SIMPLE steps
✓ Use analogies students can relate to
✓ Give MEMORY TRICKS for easy recall
✓ Check understanding frequently: "Got it?", "Make sense?", "Clear?"
✓ If unclear, re-explain differently
✓ Make it EASY and FUN to learn

FUN FACTS FOR MEMORIZATION:
- "Fun fact: [interesting tidbit that helps remember]"
- "Here's a cool trick: [memory aid]"
- "Easy way to remember: [mnemonic]"
- "Think of it this way: [simple analogy]"
- "In Malaysia, you see this when [local example]"

TEACHING TECHNIQUES:
1. **Real-World Malaysian Examples**
   - RM money: "RM20 × 1/2 = RM10"
   - Food: "Salt in your nasi lemak is NaCl"
   - Daily: "Shopping trolley is F=ma"

2. **Simple Analogies**
   - "Ionic bonds are like giving your phone away"
   - "Fractions are like cutting kuih into pieces"
   - "Atoms are like tiny LEGO blocks"

3. **Fun Memory Tricks**
   - "Ionic = I own it (transfer), Covalent = We share it"
   - "PEMDAS: Please Excuse My Dear Aunt Sally"
   - "ROY G BIV for rainbow colors"

4. **Step-by-Step**
   - Break complex → Step 1 → Step 2 → Step 3 → Done!
   - Build understanding progressively
   - Check at each step

5. **Check Understanding**
   - "Does this make sense?"
   - "Got it?"
   - "Want me to explain differently?"
   - "Can you tell me what you understand?"

IMPORTANT:
- Teach CONTINUOUSLY - don't wait, keep going!
- Make it EASY - use simple language
- Make it MEMORABLE - use fun facts
- Make it RELEVANT - use Malaysian examples
- Keep responses 2-3 sentences, then move to next point

FOCUS: Teach ${syllabusInfo.syllabus} topics from today + weak subjects. Make learning FUN and EASY!`;
          break;
          case 'quiz':
            modeContext = `You are in QUIZ MODE (5 minutes). Generate EDUCATIONAL MULTIPLE CHOICE questions from ${syllabusInfo.syllabus} curriculum ONLY.

CRITICAL - EDUCATIONAL QUESTIONS ONLY:
- NO chitchat or general knowledge questions
- ONLY ask questions from Malaysian ${syllabusInfo.syllabus} curriculum
- Questions must be about ACADEMIC subjects: Mathematics, Science, English, Bahasa Melayu, History, etc.
- Based on what you taught in Teaching Mode
- Match student's age (${userAge} years old) and curriculum level
- NO personal questions, NO "how are you", NO casual conversation

REQUIRED FORMAT - FOLLOW EXACTLY:

QUESTION: [Educational question from ${syllabusInfo.syllabus} curriculum]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]

EXAMPLES OF CORRECT EDUCATIONAL QUESTIONS:

${userAge <= 12 ? `KSSR Primary Level Examples:
QUESTION: What is 5 + 3?
A) 6
B) 7
C) 8
D) 9

QUESTION: How many legs does a cat have?
A) 2
B) 4
C) 6
D) 8

QUESTION: What do plants need to grow?
A) Only water
B) Only sunlight
C) Water and sunlight
D) Nothing` : `KSSM Secondary Level Examples:
QUESTION: What is the chemical formula for water?
A) H2O
B) CO2
C) NaCl
D) O2

QUESTION: What is the value of x in: 2x + 4 = 10?
A) 2
B) 3
C) 4
D) 5

QUESTION: What type of bond is NaCl?
A) Ionic
B) Covalent
C) Metallic
D) Hydrogen`}

STRICT SUBJECT AREAS (${syllabusInfo.syllabus}):
- Mathematics/Matematik
- Science/Sains
- English Language
- Bahasa Melayu
- History/Sejarah
- ${userAge > 12 ? 'Chemistry, Physics, Biology, Additional Mathematics' : 'Basic calculations, simple science, language basics'}

WHAT TO QUIZ ON:
- Educational topics from Teaching Mode
- ${weakSubjects.join(', ')} concepts
- ${syllabusInfo.syllabus} curriculum content
- Academic concepts, formulas, definitions

BANNED TOPICS (DO NOT ASK):
❌ Personal questions ("How are you?", "What's your name?")
❌ General knowledge ("Who is the president?", "What color is the sky?")
❌ Chitchat or conversation
❌ Non-academic topics

QUIZ FLOW:
1. Ask EDUCATIONAL question in the format above
2. Wait for A, B, C, or D selection
3. Respond with: "Correct! ✓ [explanation]" or "Not quite. Answer is [letter]. [explanation]"
4. Immediately ask NEXT EDUCATIONAL question

FEEDBACK FORMAT:
Keep it SHORT (1 sentence), then ask next question!

CRITICAL: Every question MUST be from ${syllabusInfo.syllabus} curriculum and educational!`;
            break;
      }
      
      const contextPrompt = `You are a Malaysian education AI tutor helping ${userName} with their Daily Brain Boost session.

STUDENT PROFILE:
- Age: ${userAge} years old
- Syllabus: ${syllabusInfo.syllabus} (${syllabusInfo.fullName})
- Level: ${syllabusInfo.level}
- Selected Subject: ${getSubjectDisplayName().name} (Focus on this subject)
- Weak subjects: ${weakSubjects.join(', ') || 'None specified'}
- Strong subjects: ${strongSubjects.join(', ') || 'None specified'}

${syllabusGuidance}

CURRENT MODE: ${modeContext}
FOCUS: Give priority to ${getSubjectDisplayName().name} content and examples

CRITICAL RULES:
1. ${userAge <= 12 ? 'ONLY teach KSSR (Primary) content' : userAge <= 17 ? 'ONLY teach KSSM (Secondary) content' : 'Can teach both KSSR and KSSM content'}
2. Use Malaysian educational context and examples (e.g., Malaysian culture, local references, Malaysian currency)
3. Keep content age-appropriate for ${userAge} years old
4. Be encouraging and culturally sensitive
5. Provide concise responses (2-3 sentences maximum)
6. If asked about topics outside the appropriate syllabus, politely redirect: "That topic is for ${userAge <= 12 ? 'secondary school (KSSM)' : 'primary school (KSSR)'}. Let's focus on your ${syllabusInfo.syllabus} content instead!"
7. Use real Malaysian school examples (e.g., "In your school...", "Like in Malaysian textbooks...")

FORMATTING RULES - SPEAK NATURALLY:
❌ NO markdown (**bold**, *italic*, etc.)
❌ NO section headers ("PRACTICE:", "MEMORY TRICK:", "English Writing: Essay")
❌ NO bullet points or structured lists
❌ NO special characters (**, __, ##, --, etc.)
✅ Just speak in plain, natural conversational sentences
✅ Like talking to a student face-to-face
✅ Natural flow, no formatting

BAD: "**Practice**: Try this... **Memory Trick**: Remember..."
GOOD: "Now try this problem. Here's a cool trick to remember it..."

Language: Respond in ${currentLanguage === 'ms' ? 'Bahasa Melayu' : 'English'}`;

      const updatedHistory = [
        { role: 'system' as const, content: contextPrompt },
        ...conversationHistory,
        { role: 'user' as const, content: userText }
      ];
      
      // Try streaming, fallback to regular if it fails
      try {
        let currentResponse = '';
        let voiceGenerated = false;
        
        const streamResponse = await aiService.sendMessageStream(
          updatedHistory, 
          currentLanguage, 
          false,
          async (chunk: string, isComplete: boolean) => {
            currentResponse = chunk;
            
            // Generate voice as soon as we have enough content (non-blocking)
            if (!voiceGenerated && (chunk.includes('.') || chunk.includes('!') || chunk.includes('?') || chunk.length > 50)) {
              voiceGenerated = true;
              generateAndPlaySpeech(chunk).catch(error => {
                console.error('Error generating speech:', error);
              });
            }
            
            if (isComplete) {
              // Check if this is a quiz question (don't add to conversation if it is)
              // Handle both "QUESTION:" and "QUESTION 1:", "QUESTION 2:", etc.
              const hasQuestion = /QUESTION\s*\d*:/i.test(chunk);
              const hasOptions = /[A-D]\)/m.test(chunk);
              const isQuizQuestion = hasQuestion && hasOptions;
              
              console.log('🔍 Quiz detection (text):', { hasQuestion, hasOptions, isQuizQuestion, chunkPreview: chunk.substring(0, 100) });
              
              if (isQuizQuestion) {
                // Parse and display as quiz only (no conversation message)
                console.log('✅ Detected quiz question, parsing...');
                parseQuizQuestion(chunk);
              } else {
                // Regular conversation - add to history
                setConversationHistory([
                  ...conversationHistory,
                  { role: 'user', content: userText },
                  { role: 'assistant', content: chunk }
                ]);
              }
            }
          }
        );
        
        if (!streamResponse.success) {
          throw new Error('Streaming failed, using fallback');
        }
      } catch (streamError) {
        console.log('ℹ️ Using non-streaming mode (this is normal)');
        // Fallback to regular response
        const response = await aiService.sendMessage(updatedHistory, currentLanguage);
        if (response.success && response.message) {
          // Check if this is a quiz question (don't add to conversation if it is)
          // Handle both "QUESTION:" and "QUESTION 1:", "QUESTION 2:", etc.
          const hasQuestion = /QUESTION\s*\d*:/i.test(response.message);
          const hasOptions = /[A-D]\)/m.test(response.message);
          const isQuizQuestion = hasQuestion && hasOptions;
          
          console.log('🔍 Quiz detection (text non-stream):', { hasQuestion, hasOptions, isQuizQuestion, messagePreview: response.message.substring(0, 100) });
          
          if (isQuizQuestion) {
            // Parse and display as quiz only (no conversation message)
            console.log('✅ Detected quiz question, parsing...');
            parseQuizQuestion(response.message);
          } else {
            // Regular conversation - add to history
            setConversationHistory([
              ...conversationHistory,
              { role: 'user', content: userText },
              { role: 'assistant', content: response.message }
            ]);
          }
          
          // Generate speech in background (non-blocking)
          generateAndPlaySpeech(response.message).catch(error => {
            console.error('Error generating speech:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error processing text message:', error);
      Alert.alert('Error', 'Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    text: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Time Check Modal */}
        <Modal
          visible={showTimeCheckModal}
          animationType="none"
          transparent={true}
          onRequestClose={() => {
            setShowTimeCheckModal(false);
            router.back();
          }}
        >
          <View style={styles.timeCheckOverlay}>
            <Animatable.View animation="zoomIn" duration={200} style={styles.timeCheckModal}>
              <View style={styles.timeCheckIcon}>
                <Zap size={50} color="#FFD700" />
              </View>
              <Text style={styles.timeCheckTitle}>
                {currentLanguage === 'ms' ? '⏰ Ada Masa?' : '⏰ Got Time?'}
              </Text>
              <Text style={styles.timeCheckMessage}>
                {currentLanguage === 'ms'
                  ? `Sesi ini mengambil masa kira-kira ${Math.ceil(TOTAL_SESSION_TIME / 60)} minit. Adakah anda bebas sekarang?`
                  : `This session takes about ${Math.ceil(TOTAL_SESSION_TIME / 60)} minutes. Are you free right now?`}
              </Text>
              
              <View style={styles.timeCheckButtons}>
                <TouchableOpacity
                  style={styles.timeCheckButtonYes}
                  onPress={() => {
                    // Mark that user confirmed - this allows timer to start
                    setUserConfirmed(true);
                    // Close modal immediately for instant response
                    setShowTimeCheckModal(false);
                    
                    // Activate streak in background (non-blocking)
                    if (user?.id) {
                      streakService.activateStreak(user.id).then(streakResult => {
                        if (streakResult && streakResult.streak_activated) {
                          console.log('Streak activated!', streakResult);
                          // Show streak notification after modal closes (better UX)
                          if (streakResult.current_streak > 1) {
                            setTimeout(() => {
                              Alert.alert(
                                '🔥',
                                currentLanguage === 'ms'
                                  ? `Streak ${streakResult.current_streak} hari! Teruskan!`
                                  : `${streakResult.current_streak} day streak! Keep it up!`,
                                [{ text: 'OK' }],
                                { cancelable: true }
                              );
                            }, 500); // Small delay so modal closes first
                          }
                        } else if (streakResult && !streakResult.streak_activated) {
                          console.log('Already completed today');
                        }
                      }).catch(error => {
                        console.error('Error activating streak:', error);
                      });
                    }
                  }}
                >
                  <Text style={styles.timeCheckButtonYesText}>
                    {currentLanguage === 'ms' ? '✓ Ya, Jom!' : '✓ Yes, Let\'s Go!'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.timeCheckButtonNo}
                  onPress={() => {
                    setShowTimeCheckModal(false);
                    router.back();
                  }}
                >
                  <Text style={styles.timeCheckButtonNoText}>
                    {currentLanguage === 'ms' ? '✕ Nanti' : '✕ Maybe Later'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </View>
        </Modal>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              endSession('manual');
            }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>🧠 Daily Brain Boost</Text>
            <Text style={styles.headerSubject}>{getSubjectDisplayName().icon} {getSubjectDisplayName().name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.languageButton, currentLanguage === 'en' && styles.languageButtonActive]}
              onPress={() => setCurrentLanguage('en')}
            >
              <Text style={styles.languageButtonText}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, currentLanguage === 'ms' && styles.languageButtonActive]}
              onPress={() => setCurrentLanguage('ms')}
            >
              <Text style={styles.languageButtonText}>MS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer and Mode Display */}
        {hasStarted && (
          <View style={styles.timerContainer}>
            <View style={styles.timerSection}>
              <Text style={styles.timerLabel}>
                {currentLanguage === 'ms' ? 'Masa Keseluruhan' : 'Total Time'}
              </Text>
              <Text style={styles.timerValue}>{formatTime(totalTimeRemaining)}</Text>
            </View>
            
            <View style={[styles.modeIndicator, { backgroundColor: getModeInfo(currentMode).color }]}>
              <Text style={styles.modeTitle}>{getModeInfo(currentMode).title}</Text>
              <Text style={styles.modeTimer}>{formatTime(modeTimeRemaining)}</Text>
            </View>
          </View>
        )}

        {/* Mode Transition Modal */}
        <Modal
          visible={showModeTransition}
          animationType="fade"
          transparent={true}
        >
          <View style={styles.modeTransitionOverlay}>
            <Animatable.View animation="bounceIn" style={styles.modeTransitionModal}>
              <View style={[styles.modeTransitionIcon, { backgroundColor: getModeInfo(currentMode).color }]}>
                <Zap size={50} color="#FFFFFF" />
              </View>
              <Text style={styles.modeTransitionTitle}>
                {getModeInfo(currentMode).title}
              </Text>
              <Text style={styles.modeTransitionDescription}>
                {getModeInfo(currentMode).description}
              </Text>
            </Animatable.View>
          </View>
        </Modal>

        {/* Main Content */}
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
            {/* AI Avatar - 3D Spline Brain */}
            <Animatable.View animation="fadeIn" style={styles.aiAvatarContainer}>
              {/* Spline 3D Brain - Circle */}
              <View style={styles.splineContainer}>
                <WebView
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                        <style>
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          html, body { width: 100%; height: 100%; background: transparent; overflow: hidden; }
                          spline-viewer { width: 100%; height: 100%; background: transparent; display: block; }
                          
                          /* Hide Spline watermark */
                          #logo, .logo, [class*="logo"], [id*="logo"],
                          a[href*="spline"], a[target="_blank"],
                          div[style*="position: absolute"][style*="bottom"],
                          div[style*="position: fixed"][style*="bottom"] {
                            display: none !important;
                            opacity: 0 !important;
                            visibility: hidden !important;
                            pointer-events: none !important;
                          }
                        </style>
                      </head>
                      <body>
                        <script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.57/build/spline-viewer.js"></script>
                        <spline-viewer url="https://prod.spline.design/0DRfJFSAhCeNIQT3/scene.splinecode"></spline-viewer>
                        
                        <script>
                          // Remove watermark after load
                          window.addEventListener('load', function() {
                            setTimeout(function() {
                              const viewer = document.querySelector('spline-viewer');
                              if (viewer && viewer.shadowRoot) {
                                const style = document.createElement('style');
                                style.textContent = \`
                                  #logo, .logo, [class*="logo"], [id*="logo"],
                                  a, a[href*="spline"],
                                  div[style*="position: absolute"][style*="bottom"],
                                  div[style*="position: fixed"][style*="bottom"] {
                                    display: none !important;
                                    opacity: 0 !important;
                                    visibility: hidden !important;
                                  }
                                \`;
                                try {
                                  viewer.shadowRoot.appendChild(style);
                                } catch(e) {
                                  console.log('Could not hide watermark:', e);
                                }
                              }
                            }, 500);
                          });
                        </script>
                      </body>
                      </html>
                    `
                  }}
                  style={styles.splineWebView}
                  androidLayerType="hardware"
                  cacheEnabled={true}
                  cacheMode="LOAD_CACHE_ELSE_NETWORK"
                  onMemoryWarning={() => console.log('Spline WebView memory warning')}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={false}
                  scalesPageToFit={false}
                  backgroundColor="transparent"
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  mixedContentMode="compatibility"
                  renderToHardwareTextureAndroid={true}
                  androidHardwareAccelerationDisabled={false}
                  originWhitelist={['*']}
                  onLoadStart={() => console.log('Spline loading...')}
                  onLoadEnd={() => console.log('Spline loaded!')}
                  onError={(syntheticEvent) => {
                    console.log('Spline error:', syntheticEvent.nativeEvent);
                  }}
                />
              </View>
            </Animatable.View>

            {/* Conversation Display - Hidden during quiz */}
            {!currentQuizQuestion && (
              <ScrollView 
                ref={conversationScrollRef}
                style={styles.conversationScroll}
                contentContainerStyle={styles.conversationContent}
              >
                {conversationHistory.map((msg, index) => (
                  <Animatable.View
                    key={index}
                    animation="fadeInUp"
                    style={[
                      styles.messageContainer,
                      msg.role === 'user' ? styles.userMessage : styles.aiMessage
                    ]}
                  >
                    <Text style={styles.messageText}>{msg.content}</Text>
                  </Animatable.View>
                ))}
                
                {/* Show processing indicator */}
                {isProcessing && (
                  <Animatable.View animation="fadeIn" style={styles.processingContainer}>
                    <Animatable.View 
                      animation="pulse" 
                      iterationCount="infinite"
                      style={styles.processingDot}
                    />
                    <Text style={styles.processingText}>
                      {currentLanguage === 'ms' ? 'AI sedang berfikir...' : 'AI is thinking...'}
                    </Text>
                  </Animatable.View>
                )}
              </ScrollView>
            )}

            {/* Input Controls - Voice, Text, or Quiz */}
            {currentQuizQuestion ? (
              // Quiz Active - Full Screen Quiz (works in both teaching and quiz modes)
              <Animatable.View animation="fadeInUp" style={styles.quizFullContainer}>
                <ScrollView 
                  style={styles.quizScrollView}
                  contentContainerStyle={styles.quizScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Quiz Header */}
                  <View style={styles.quizHeader}>
                    <Text style={styles.quizHeaderText}>
                      {currentLanguage === 'ms' ? '🎯 Kuiz' : '🎯 Quiz Time'}
                    </Text>
                    <Text style={styles.quizHeaderSubtext}>
                      {currentLanguage === 'ms' ? `Soalan ${quizQuestionCount}/5` : `Question ${quizQuestionCount}/5`}
                    </Text>
                  </View>

                  {/* Question Card */}
                  <View style={styles.quizQuestionCard}>
                    <Text style={styles.quizQuestionText}>{currentQuizQuestion}</Text>
                  </View>

                  {/* Answer Options A, B, C, D */}
                  <View style={styles.quizOptionsContainer}>
                    {quizOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.quizOptionButton}
                        onPress={() => handleQuizAnswer(index)}
                        disabled={isAnswered || isProcessing}
                      >
                        <LinearGradient
                          colors={getOptionColor(index)}
                          style={styles.quizOptionGradient}
                        >
                          <View style={styles.quizOptionContent}>
                            <View style={styles.quizOptionLeft}>
                              <View style={styles.quizOptionLetter}>
                                <Text style={styles.quizOptionLetterText}>
                                  {String.fromCharCode(65 + index)}
                                </Text>
                              </View>
                              <Text style={styles.quizOptionText}>{option}</Text>
                            </View>
                            {getOptionIcon(index)}
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Feedback Display */}
                  {quizFeedback && showQuizResult && (
                    <Animatable.View animation="fadeIn" style={styles.quizFeedbackContainer}>
                      <Text style={styles.quizFeedbackText}>{quizFeedback}</Text>
                    </Animatable.View>
                  )}

                  {/* Processing Indicator */}
                  {isProcessing && (
                    <View style={styles.quizProcessing}>
                      <Animatable.View animation="rotate" iterationCount="infinite" duration={1000}>
                        <Sparkles size={24} color="#FFD700" />
                      </Animatable.View>
                      <Text style={styles.quizProcessingText}>
                        {currentLanguage === 'ms' ? 'Menyemak jawapan...' : 'Checking answer...'}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </Animatable.View>
            ) : inputMode === 'voice' ? (
              // Voice Mode - Jom Tanya Style
              <View style={styles.stickyBottomControls}>
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
                    disabled={isProcessing}
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
                      ? (currentLanguage === 'ms' ? 'Lepaskan untuk berhenti' : 'Release to stop recording')
                      : isProcessing 
                    ? (currentLanguage === 'ms' ? 'Memproses...' : 'Processing...')
                        : (currentLanguage === 'ms' ? 'Tahan untuk rakam' : 'Hold to record your message')
                    }
                </Text>
              </View>
                
                {/* Text Mode Toggle Button - Right (Absolute) */}
                <TouchableOpacity 
                  style={styles.textToggleButton} 
                  onPress={() => setInputMode('text')}
                >
                  <MessageSquare size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              // Text Mode - Typing Input
              <View style={styles.textInputContainer}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={currentLanguage === 'ms' ? 'Taip mesej anda...' : 'Type your message...'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={textMessage}
                    onChangeText={setTextMessage}
                    multiline
                    maxLength={500}
                    editable={!isProcessing}
                  />
                  <TouchableOpacity 
                    style={styles.micInputButton}
                    onPress={() => setInputMode('voice')}
                  >
                    <Mic size={20} color="#FFD700" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={handleTextSend}
                  disabled={!textMessage.trim() || isProcessing}
                  activeOpacity={!textMessage.trim() ? 1 : 0.7}
                >
                  {isProcessing ? (
                    <Animatable.View animation="rotate" iterationCount="infinite" duration={1000}>
                      <Sparkles size={20} color="#FFFFFF" />
                    </Animatable.View>
                  ) : (
                    <Send size={20} color="#FFFFFF" opacity={!textMessage.trim() ? 0.4 : 1} />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  headerSubject: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#A0AEC0',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageButtonActive: {
    backgroundColor: '#FFD700',
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brainIcon: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  selectionContainer: {
    gap: 20,
  },
  sessionCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  sessionGradient: {
    padding: 30,
    alignItems: 'center',
  },
  sessionIcon: {
    marginBottom: 15,
  },
  sessionTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  sessionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiAvatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  splineContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  splineWebView: {
    width: 150,
    height: 150,
    backgroundColor: 'transparent',
  },
  aiAvatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    overflow: 'hidden',
  },
  talkingIndicator: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  talkingIndicatorLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  conversationScroll: {
    flex: 1,
  },
  conversationContent: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  // Sticky Bottom Controls - Jom Tanya Style
  stickyBottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    marginBottom: 10,
    position: 'relative',
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
  micIcon: {
    width: 100,
    height: 100,
  },
  sideIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  textToggleButton: {
    position: 'absolute',
    right: 20,
    bottom: 45,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  // Text Input Mode Styles
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 8,
  },
  micInputButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  // Quiz Mode Styles
  quizFullContainer: {
    flex: 1,
    width: '100%',
  },
  quizScrollView: {
    flex: 1,
  },
  quizScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quizHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  quizHeaderText: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  quizHeaderSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quizContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  quizQuestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  quizQuestionText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    lineHeight: 26,
    textAlign: 'center',
  },
  quizOptionsContainer: {
    gap: 12,
  },
  quizOptionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  quizOptionGradient: {
    padding: 16,
  },
  quizOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  quizOptionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizOptionLetterText: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  quizOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    flex: 1,
  },
  quizFeedbackContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  quizFeedbackText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  quizProcessing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  quizProcessingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
  },
  quizLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  quizLoadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
    marginTop: 15,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  processingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  processingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Time Check Modal styles
  timeCheckOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCheckModal: {
    width: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  timeCheckIcon: {
    marginBottom: 20,
  },
  timeCheckTitle: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeCheckMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  timeCheckButtons: {
    width: '100%',
    gap: 12,
  },
  timeCheckButtonYes: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeCheckButtonYesText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  timeCheckButtonNo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  timeCheckButtonNoText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Syllabus Indicator styles
  syllabusIndicator: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
    alignSelf: 'center',
  },
  syllabusValue: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
  },
  // Timer and Mode styles
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
    gap: 15,
  },
  timerSection: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  modeIndicator: {
    flex: 2,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 14,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modeTimer: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  // Mode Transition Modal styles
  modeTransitionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTransitionModal: {
    width: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  modeTransitionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modeTransitionTitle: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  modeTransitionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
});

