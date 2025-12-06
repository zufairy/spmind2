import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert, TextInput, Image, ImageBackground } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Mic, BookOpen, Sparkles, MessageCircle, Volume2, MicOff, Globe, Camera, MessageSquare, Search, Heart, Play, Settings, ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import AdorableAvatar from '../../components/AdorableAvatar';
import SimpleAvatarInteraction from '../../components/SimpleAvatarInteraction';
import AvatarSoundSystem from '../../components/AvatarSoundSystem';
import AvatarCustomization from '../../components/AvatarCustomization';
import AnimatedText from '../../components/AnimatedText';
import { useTheme } from '../../contexts/ThemeContext';
import { useAvatarStore } from '../../stores/avatarStore';

import { aiService } from '../../services/aiService';
import { elevenLabsVoiceService } from '../../services/googleVoiceService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { isDark } = useTheme();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { currentEmotion, setEmotion, handleInteraction } = useAvatarStore();
  const isFocused = useIsFocused();
  const [aiGreeting] = useState("Hey there!\nHow can I help you get an A?");
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [isAITalking, setIsAITalking] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ms'>('en');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [textAnimationKey, setTextAnimationKey] = useState(0);
  const [isConsultingMode, setIsConsultingMode] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const pulseAnimRef = useRef<Animatable.View>(null);

  // Conversation will only start when play button is clicked


  useEffect(() => {
    // Set the language in voice service
    elevenLabsVoiceService.setLanguage(currentLanguage);
    // Don't auto-start conversation - wait for play button
  }, [currentLanguage]);

  const startConversation = async () => {
    setIsAIProcessing(true);
    try {
      let currentResponse = '';
      let voiceGenerated = false;
      
      const streamResponse = await aiService.sendMessageStream(
        [], 
        currentLanguage, 
        false,
        async (chunk: string, isComplete: boolean) => {
          currentResponse = chunk;
          setLastAIResponse(chunk);
          setShowAnimatedText(true);
          
          // Generate voice as soon as we have enough content
          if (!voiceGenerated && (chunk.includes('.') || chunk.includes('!') || chunk.includes('?') || chunk.length > 50)) {
            voiceGenerated = true;
            await generateAndPlaySpeech(chunk);
          }
          
          if (isComplete) {
            setConversationHistory([{ role: 'assistant' as const, content: chunk }]);
          }
        }
      );
      
      if (!streamResponse.success) {
        console.error('Streaming failed, falling back to regular response');
        const response = await aiService.sendMessage([], currentLanguage);
        if (response.success && response.message) {
          setLastAIResponse(response.message);
          setConversationHistory([{ role: 'assistant' as const, content: response.message }]);
          setShowAnimatedText(true);
          await generateAndPlaySpeech(response.message);
        } else {
          console.error('AI response error:', response.error);
          const fallbackMessage = currentLanguage === 'ms' 
            ? "Hai! Saya Tutor, rakan belajar AI anda! Bagaimana saya boleh bantu anda hari ini?"
            : "Hi! I'm Tutor, your AI study buddy! How can I help you today?";
          setLastAIResponse(fallbackMessage);
          setShowAnimatedText(true);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      const fallbackMessage = currentLanguage === 'ms' 
        ? "Hai! Saya Tutor, rakan belajar AI anda! Bagaimana saya boleh bantu anda hari ini?"
        : "Hi! I'm Tutor, your AI study buddy! How can I help you today?";
      setLastAIResponse(fallbackMessage);
      setShowAnimatedText(true);
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handlePlayButton = async () => {
    if (!hasStartedConversation) {
      setHasStartedConversation(true);
      setShowAnimatedText(true);
      await startConversation();
    }
  };

  const handleLanguageChange = async (newLanguage: 'en' | 'ms') => {
    if (newLanguage === currentLanguage) return;
    
    setCurrentLanguage(newLanguage);
    elevenLabsVoiceService.setLanguage(newLanguage);
    
    // Clear current conversation
    setConversationHistory([]);
    setUserMessage('');
    setShowAnimatedText(false);
    
    // Generate language change message
    const languageChangeMessage = newLanguage === 'ms' 
      ? "Terima kasih kerana menukar bahasa! Mari kita teruskan dalam Bahasa Malaysia. Bagaimana saya boleh bantu anda hari ini?"
      : "Thanks for changing the language! Let's continue in English. How can I help you today?";
    
    setLastAIResponse(languageChangeMessage);
    setShowAnimatedText(true);
    
    // Generate and play speech for language change
    await generateAndPlaySpeech(languageChangeMessage);
    
    // Wait for text animation to complete before asking a new question
    setTimeout(async () => {
      const followUpMessage = newLanguage === 'ms' 
        ? "Sekarang, apa yang anda ingin belajar hari ini? Saya bersedia untuk membantu anda!"
        : "Now, what would you like to learn today? I'm ready to help you!";
      
      setLastAIResponse(followUpMessage);
      setShowAnimatedText(true);
      await generateAndPlaySpeech(followUpMessage);
    }, 4000); // Wait 4 seconds for the first message to complete
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

  const generateAndPlayConsultingSpeech = async (text: string) => {
    try {
      // Use the female consultant voice ID
      const speechResponse = await elevenLabsVoiceService.generateSpeech(text, '7QwDAfHpHjPD14XYTSiq');
      if (speechResponse.success && speechResponse.audioUrl) {
        setIsAITalking(true);
        
        // Play the speech
        await elevenLabsVoiceService.playAudio(speechResponse.audioUrl);
        
        // Stop talking when speech ends
        setIsAITalking(false);
      }
    } catch (error) {
      console.error('Error generating/playing consulting speech:', error);
      setIsAITalking(false);
    }
  };

  const handleMicPressIn = async () => {
    if (isProcessing || isAIProcessing) return;
    
    setIsRecording(true);
    setUserMessage('');
    setShowAnimatedText(false);
    
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
          isConsultingMode,
          async (chunk: string, isComplete: boolean) => {
            currentResponse = chunk;
            setLastAIResponse(chunk);
            setShowAnimatedText(true);
            
            // Generate voice as soon as we have enough content (after first sentence or 50 characters)
            if (!voiceGenerated && (chunk.includes('.') || chunk.includes('!') || chunk.includes('?') || chunk.length > 50)) {
              voiceGenerated = true;
              
              // Generate and play speech with appropriate voice based on mode
              if (isConsultingMode) {
                await generateAndPlayConsultingSpeech(chunk);
              } else {
                await generateAndPlaySpeech(chunk);
              }
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
          const aiResponse = await aiService.sendMessage(updatedHistory, currentLanguage, isConsultingMode);
          
          if (aiResponse.success && aiResponse.message) {
            setLastAIResponse(aiResponse.message);
            setShowAnimatedText(true);
            setConversationHistory([...updatedHistory, { role: 'assistant' as const, content: aiResponse.message }]);
            
            if (isConsultingMode) {
              await generateAndPlayConsultingSpeech(aiResponse.message);
            } else {
              await generateAndPlaySpeech(aiResponse.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAIChat = () => {
    router.push({
      pathname: '/chat',
      params: { source: 'home' }
    });
  };


  const handleAvatarTap = () => {
    // Make avatar react to tap
    if (hasStartedConversation) {
      const tapMessage = currentLanguage === 'ms' 
        ? "Hai! Ada apa yang saya boleh bantu lagi?"
        : "Hi! What else can I help you with?";
      
      setLastAIResponse(tapMessage);
      setShowAnimatedText(true);
      generateAndPlaySpeech(tapMessage);
    }
  };

  const handleHomework = () => {
    // Navigate to search tab
    router.push('/(tabs)/search');
  };

  const handleChatPopup = () => {
    // Navigate to search page with chat tab active
    router.push('/(tabs)/search');
  };



  const handleBack = () => {
    router.push('/(tabs)/home');
  };

  const handleConsultingMode = async () => {
    const newMode = !isConsultingMode;
    setIsConsultingMode(newMode);
    
    if (newMode) {
      // Enter consulting mode
      const consultingMessage = currentLanguage === 'ms' 
        ? "Hai sayang! Saya di sini untuk berbual dengan awak. Bagaimana dengan sekolah hari ini? Ada apa yang mengganggu awak dalam pelajaran? Mari kita bercakap tentang hobi awak dan apa yang memotivasi awak untuk belajar!"
        : "Hello sweetie! I'm here to chat with you. How was school today? What's troubling you in your studies? Let's talk about your hobbies and what motivates you to learn!";
      
      setLastAIResponse(consultingMessage);
      setShowAnimatedText(true);
      
      // Generate and play speech with female consultant voice immediately
      await generateAndPlayConsultingSpeech(consultingMessage);
    } else {
      // Exit consulting mode
      const exitMessage = currentLanguage === 'ms' 
        ? "Terima kasih kerana berkongsi dengan saya! Saya harap awak berasa lebih baik sekarang. Jangan lupa, saya sentiasa di sini untuk awak!"
        : "Thank you for sharing with me! I hope you feel better now. Remember, I'm always here for you!";
      
      setLastAIResponse(exitMessage);
      setShowAnimatedText(true);
      
      // Generate and play speech with normal voice immediately
      await generateAndPlaySpeech(exitMessage);
    }
  };

  const handleVoiceNote = () => {
    // Voice recording functionality
  };

  // Update avatar emotion based on AI state
  useEffect(() => {
    if (isRecording) {
      setEmotion('listening', 0.8);
    } else if (isProcessing) {
      setEmotion('thinking', 0.7);
    } else if (isAITalking) {
      setEmotion('talking', 0.9);
    } else if (isAIProcessing) {
      setEmotion('curious', 0.6);
    } else if (isConsultingMode) {
      setEmotion('love-struck', 0.8);
    } else if (hasStartedConversation && !isAIProcessing && !isAITalking) {
      setEmotion('happy', 0.7);
    } else {
      setEmotion('neutral', 0.5);
    }
  }, [isRecording, isProcessing, isAITalking, isAIProcessing, isConsultingMode, hasStartedConversation, setEmotion]);

  // Get the text to display
  const displayText = hasStartedConversation ? (lastAIResponse || aiGreeting) : (currentLanguage === 'ms' ? 'Tekan butang play untuk mula belajar!' : 'Press the play button to start learning!');
  

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
    card: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    headerText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    iconButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    languageSwitch: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    languageText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    greetingGradient: {
      backgroundColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
    },
    actionButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    actionText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    bubble: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    },
  };

  return (
    <SimpleAvatarInteraction enableTimeBased={true}>
      <View style={[styles.container, dynamicStyles.container]}>
        <AvatarSoundSystem enableSounds={false} volume={0.7} />
        <ImageBackground 
          source={require('../../assets/images/wall.jpg')} 
          style={[styles.backgroundImage, dynamicStyles.backgroundImage]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={dynamicStyles.gradientColors}
            style={[styles.gradient, dynamicStyles.gradient]}
          >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={require('../../assets/images/Logo_Long.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <ArrowLeft size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            {/* Language Switch */}
            <View style={styles.languageSwitch}>
              <TouchableOpacity 
                style={[
                  styles.languageButton,
                  currentLanguage === 'en' && styles.languageButtonActive
                ]}
                onPress={() => handleLanguageChange('en')}
              >
                <Globe size={16} color={currentLanguage === 'en' ? '#000000' : '#FFFFFF'} />
                <Text style={[
                  styles.languageText,
                  dynamicStyles.languageText,
                  currentLanguage === 'en' && styles.languageTextActive
                ]}>
                  ENG
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.languageButton,
                  currentLanguage === 'ms' && styles.languageButtonActive
                ]}
                onPress={() => handleLanguageChange('ms')}
              >
                <Globe size={16} color={currentLanguage === 'ms' ? '#000000' : '#FFFFFF'} />
                <Text style={[
                  styles.languageText,
                  dynamicStyles.languageText,
                  currentLanguage === 'ms' && styles.languageTextActive
                ]}>
                  BM
                </Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.settingsButton}>
              <Settings size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Spline Avatar - Alternative Method */}
        {isFocused && (
          <View style={styles.avatarContainer}>
            <WebView
              startInLoadingState={false}
              cacheEnabled={true}
              cacheMode="LOAD_CACHE_ELSE_NETWORK"
              source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                  <title>Spline Viewer</title>
                  <style>
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    html, body {
                      width: 100%;
                      height: 100%;
                      background: transparent;
                      overflow: hidden;
                    }
                    #spline-container {
                      width: 100%;
                      height: 100%;
                      background: transparent;
                      position: relative;
                    }
                    spline-viewer {
                      width: 100%;
                      height: 100%;
                      background: transparent;
                      display: block;
                    }
                    
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
                  <div id="spline-container">
                    <script type="module" src="https://unpkg.com/@splinetool/viewer@1.10.57/build/spline-viewer.js"></script>
                    <spline-viewer url="https://prod.spline.design/0DRfJFSAhCeNIQT3/scene.splinecode"></spline-viewer>
                  </div>
                  
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
            style={styles.splineViewer}
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
            onLoadStart={() => {}}
            onLoadEnd={() => {}}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
            }}
          />
          
          {/* Play Button */}
          <TouchableOpacity 
            style={styles.playButton}
            onPress={handlePlayButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.playButtonGradient}
            >
              <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
        )}

        {/* User Message Display - Outside Container */}
        {userMessage && (
          <Animatable.View 
            animation="fadeInUp" 
            duration={300}
            style={styles.userMessageContainer}
            onAnimationEnd={() => {
              // Hide the message after 2 seconds with fade up animation
              setTimeout(() => {
                if (userMessage) {
                  setUserMessage('');
                }
              }, 2000);
            }}
          >
            <Text style={[styles.userMessageText, dynamicStyles.text]}>"{userMessage}"</Text>
          </Animatable.View>
        )}

        {/* AI Response with Animated Text - Outside Container */}
        <View style={styles.aiResponseContainer}>
          <AnimatedText
            text={displayText}
            speed={30}
            style={[styles.greetingText, dynamicStyles.text]}
            isVisible={showAnimatedText}
            onComplete={() => {}}
          />
        </View>

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
                    source={require('../../assets/images/mic.png')} 
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
      
      {/* Customization Modal */}
      <AvatarCustomization
        visible={showCustomization}
        onClose={() => setShowCustomization(false)}
      />
    </View>
    </SimpleAvatarInteraction>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  headerLogo: {
    width: 140,
    height: 45,
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
    marginTop: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageSwitch: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    padding: 1,
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
    gap: 4,
    minWidth: 35,
  },
  languageButtonActive: {
    backgroundColor: '#4A90E2',
    borderWidth: 1,
    borderColor: '#357ABD',
  },
  languageText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  languageTextActive: {
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  greetingCard: {
    flex: 1,
    marginBottom: 30,
  },
    greetingGradient: {
      flex: 1,
      borderRadius: 8,
      padding: 20,
      paddingTop: 10,
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
  consultingGradient: {
    backgroundColor: 'rgba(255, 182, 193, 0.1)',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bubble1: {
    width: 60,
    height: 60,
    top: '10%',
    left: '10%',
  },
  bubble2: {
    width: 40,
    height: 40,
    top: '20%',
    right: '15%',
  },
  bubble3: {
    width: 80,
    height: 80,
    bottom: '20%',
    left: '5%',
  },
  bubble4: {
    width: 50,
    height: 50,
    bottom: '10%',
    right: '10%',
  },
  avatarAndControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sideButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    position: 'relative',
    paddingBottom: 30, // Fixed space for page indicator
    backgroundColor: 'transparent',
    opacity: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  micContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  splineViewer: {
    width: 300,
    height: 350,
    backgroundColor: 'transparent',
  },
  playButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 2000,
  },
  playButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  customizeButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
  },
  customizeButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  userMessageContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'center',
  },
  userMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  aiResponseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    width: '100%',
    paddingBottom: 10, // Reduced padding for text spacing
    marginBottom: 15, // Added bottom margin for gap
    backgroundColor: 'transparent',
    marginTop: 20, // Fixed top margin to maintain position
  },
  greetingText: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    flexWrap: 'wrap',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  aiActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 105, 180, 0.8)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.9)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
  },
  aiActionText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  consultingModeActive: {
    backgroundColor: 'rgba(255, 105, 180, 1)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  consultingModeText: {
    color: '#FFFFFF',
  },
  voiceSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  voiceControls: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    position: 'relative',
    width: '100%',
    gap: 40,
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
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
  },
  micButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF69B4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 10,
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
  stickyBottomControls: {
    position: 'absolute',
    bottom: 30, // Moved 30px up from bottom
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'transparent',
    zIndex: 1000,
    gap: 25, // Increased from 10 to 25 (15px more gap)
    marginBottom: -20, // Negative margin to move higher
  },
  micButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIconButton: {
    marginBottom: 60, // Move up 2x more to align higher (was 30, now 60)
  },
  instructions: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  recentSection: {
    marginTop: 20,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#00FF00',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999999',
  },
  chatSlidingPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 0,
    zIndex: 2000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  chatPanelHeader: {
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chatPanelHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  chatPanelTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  chatPanelTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  chatPanelClose: {
    padding: 5,
  },
  chatPanelCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  chatPopupContent: {
    padding: 20,
    flex: 1,
  },
  chatMessagesContainer: {
    flex: 1,
    padding: 15,
  },
  chatMessage: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userChatMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  aiChatMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatMessageText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  userChatMessageText: {
    color: '#00FF00',
  },
  aiChatMessageText: {
    color: '#FFFFFF',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatSendButton: {
    backgroundColor: '#00FF00',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatSendButtonDisabled: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
});