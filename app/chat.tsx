import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, Mic, Sparkles, Volume2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Animatable from 'react-native-animatable';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  hasAudio?: boolean;
}

export default function ChatScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hi! I\'m your AI tutor. I can help you understand complex topics, solve problems step by step, and explain concepts in detail. What would you like to learn today?',
      timestamp: new Date(),
      hasAudio: true,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response (replace with actual ChatGPT API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `I understand you're asking about "${message}". Let me break this down step by step:\n\n1. First, let's identify the key concepts\n2. Then we'll work through the solution methodology\n3. Finally, I'll provide some practice examples\n\nWould you like me to explain any specific part in more detail?`,
        timestamp: new Date(),
        hasAudio: true,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const playAudio = (messageId: string) => {
    // ElevenLabs TTS integration would go here
    console.log('Playing audio for message:', messageId);
  };

  const handleBack = () => {
    if (source === 'home') {
      router.push('/(tabs)/home');
    } else {
      // Default to solver for 'solver' source or any other source
      router.push('/(tabs)/search');
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1b69', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>AI Tutor</Text>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Sparkles size={24} color="#00FF00" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, index) => (
              <Animatable.View 
                key={msg.id} 
                animation="fadeInUp" 
                delay={index * 100}
                style={[
                  styles.messageContainer,
                  msg.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer,
                ]}
              >
                {msg.type === 'ai' && (
                  <View style={styles.aiAvatar}>
                    <Sparkles size={16} color="#000000" />
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble,
                  msg.type === 'user' ? styles.userMessageBubble : styles.aiMessageBubble,
                ]}>
                  <Text style={[
                    styles.messageText,
                    msg.type === 'user' ? styles.userMessageText : styles.aiMessageText,
                  ]}>
                    {msg.content}
                  </Text>
                  
                  {msg.type === 'ai' && (
                    <View style={styles.aiActions}>
                      {msg.hasAudio && (
                        <TouchableOpacity 
                          style={styles.audioButton}
                          onPress={() => playAudio(msg.id)}
                        >
                          <Volume2 size={16} color="#00FF00" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionButton}>
                        <Copy size={16} color="#666666" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <ThumbsUp size={16} color="#666666" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <ThumbsDown size={16} color="#666666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animatable.View>
            ))}
            
            {isTyping && (
              <Animatable.View animation="fadeIn" style={styles.typingContainer}>
                <View style={styles.aiAvatar}>
                  <Sparkles size={16} color="#000000" />
                </View>
                <View style={styles.typingBubble}>
                  <Animatable.View 
                    animation="pulse" 
                    iterationCount="infinite"
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

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Ask me anything..."
                placeholderTextColor="#999999"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity style={styles.micInputButton}>
                <Mic size={20} color="#00FF00" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Send size={20} color={!message.trim() ? '#666666' : '#000000'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
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
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  messageContainer: {
    marginBottom: 20,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 15,
  },
  userMessageBubble: {
    backgroundColor: '#00FF00',
    borderBottomRightRadius: 5,
  },
  aiMessageBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 5,
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#000000',
  },
  aiMessageText: {
    color: '#FFFFFF',
  },
  aiActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    maxHeight: 100,
    minHeight: 20,
  },
  micInputButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});