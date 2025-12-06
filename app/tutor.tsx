import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image, ImageBackground, Alert, TextInput, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, MessageSquare, Mic, MicOff, Sparkles } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useTheme } from '../contexts/ThemeContext';
import { aiService } from '../services/aiService';

const { width } = Dimensions.get('window');

export default function TutorScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isAITalking, setIsAITalking] = useState(false);
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  
  const chatRef = useRef<ScrollView>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;

  // Page fade-in animation on mount
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsProcessing(true);
    setIsAIProcessing(true);

    try {
      const updatedHistory = [...chatMessages, userMessage].map(msg => ({
        role: msg.isUser ? 'user' as const : 'assistant' as const,
        content: msg.text,
      }));

      const aiResponse = await aiService.sendMessage(updatedHistory, 'en', false);
      
      if (aiResponse.success && aiResponse.message) {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.message,
          isUser: false,
          timestamp: new Date(),
        };

        setChatMessages(prev => [...prev, aiMessage]);
        setLastAIResponse(aiResponse.message);
        setShowAnimatedText(true);
      } else {
        Alert.alert('Error', 'Failed to get response from AI tutor');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsAIProcessing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    headerTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    chatInput: {
      backgroundColor: isDark ? '#1F1F1F' : '#F3F4F6',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    messageText: {
      color: '#000000',
    },
    aiMessageText: {
      color: '#000000',
    },
  };

  return (
    <Animatable.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      {/* Header with Background Image */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/bg.jpg')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <BlurView intensity={10} style={styles.headerBlurOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Tutor</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={chatRef}
        style={styles.chatContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}
      >
        {/* SPMind Welcome Interface */}
        {chatMessages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Image 
              source={require('../assets/images/hi.png')} 
              style={styles.hiImage}
              resizeMode="contain"
            />
            <Text style={styles.greeting}>Hi I'm SPMind</Text>
            <Text style={styles.quote}>Ask anything, I have all the answers.</Text>
            
            <View style={styles.presetButtonsContainer}>
              <View style={styles.presetButtonsRow}>
                <TouchableOpacity 
                  style={styles.presetButton}
                  onPress={() => handleSendMessage('Bila tarikh merdeka?')}
                >
                  <Text style={styles.presetButtonText}>Bila tarikh merdeka?</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.presetButton}
                  onPress={() => handleSendMessage('Apa formula newton?')}
                >
                  <Text style={styles.presetButtonText}>Apa formula newton?</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.presetButtonsRow}>
                <TouchableOpacity 
                  style={[styles.presetButton, styles.presetButtonWide]}
                  onPress={() => handleSendMessage('Reign in english')}
                >
                  <Text style={styles.presetButtonText}>Reign in english</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.presetButton, styles.presetButtonSmall]}
                  onPress={() => handleSendMessage('Fotosintesis tu apa')}
                >
                  <Text style={styles.presetButtonText}>Fotosintesis tu apa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {chatMessages.map((message, index) => (
          <Animatable.View
            key={message.id}
            animation={message.isUser ? "fadeInRight" : "fadeInLeft"}
            duration={300}
            delay={index * 100}
            style={[
              styles.messageContainer,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble
            ]}>
              <Text style={[
                styles.messageText,
                message.isUser ? dynamicStyles.messageText : dynamicStyles.aiMessageText
              ]}>
                {message.text}
              </Text>
            </View>
          </Animatable.View>
        ))}
        
        {(isProcessing || isAIProcessing) && (
          <View style={styles.loadingContainer}>
            <Animatable.View
              animation="pulse"
              iterationCount="infinite"
              style={styles.loadingDots}
            >
              <Sparkles size={20} color="#3B82F6" />
            </Animatable.View>
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.chatInput, 
              dynamicStyles.chatInput,
            ]}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Ask me anything..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
            multiline
            maxLength={500}
            editable={!isProcessing}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: chatInput.trim() ? 1 : 0.5 }]}
            onPress={() => handleSendMessage(chatInput)}
            disabled={!chatInput.trim() || isProcessing}
          >
            <MessageSquare size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
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
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 300,
    padding: 8,
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
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  hiImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  quote: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginBottom: 30,
    textAlign: 'center',
  },
  presetButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
    maxWidth: '45%',
  },
  presetButtonWide: {
    maxWidth: '60%',
  },
  presetButtonSmall: {
    maxWidth: '35%',
  },
  presetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userBubble: {
    backgroundColor: '#3B82F6',
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#3B82F6',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
