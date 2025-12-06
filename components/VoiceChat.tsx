import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { aiService } from '../services/aiService';
import { voiceService } from '../services/voiceService';
import AnimatedText from './AnimatedText';

const { width } = Dimensions.get('window');

interface VoiceChatProps {
  onMessageReceived?: (message: string) => void;
  onAIResponse?: (response: string) => void;
  onAITalking?: (talking: boolean) => void;
  onAIProcessing?: (processing: boolean) => void;
}

export default function VoiceChat({ onMessageReceived, onAIResponse, onAITalking, onAIProcessing }: VoiceChatProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const pulseAnimRef = useRef<Animatable.View>(null);

  useEffect(() => {
    // Start the conversation with AI
    startConversation();
  }, []);

  const startConversation = async () => {
    setIsProcessing(true);
    if (onAIProcessing) onAIProcessing(true);
    try {
      const response = await aiService.sendMessage([]);
      if (response.success && response.message) {
        setAiResponse(response.message);
        setConversationHistory([{ role: 'assistant', content: response.message }]);
        setShowAnimatedText(true);
        
        // Generate and play speech
        await generateAndPlaySpeech(response.message);
        
        if (onAIResponse) {
          onAIResponse(response.message);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation with AI');
    } finally {
      setIsProcessing(false);
      if (onAIProcessing) onAIProcessing(false);
    }
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      // Detect language and set voice accordingly
      const language = voiceService.detectLanguage(text);
      voiceService.setLanguage(language);

      const speechResponse = await voiceService.generateSpeech(text);
      if (speechResponse.success && speechResponse.audioUrl) {
        setIsPlaying(true);
        if (onAITalking) onAITalking(true);
        await voiceService.playAudio(speechResponse.audioUrl);
        setIsPlaying(false);
        if (onAITalking) onAITalking(false);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      if (onAITalking) onAITalking(false);
    }
  };

  const handlePressIn = async () => {
    if (isProcessing) return;

    const success = await voiceService.startRecording();
    if (success) {
      setIsRecording(true);
      setCurrentMessage('');
      if (pulseAnimRef.current) {
        pulseAnimRef.current.pulse?.();
      }
    } else {
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
    }
  };

  const handlePressOut = async () => {
    if (!isRecording) return;

    setIsRecording(false);
    setIsProcessing(true);
    if (onAIProcessing) onAIProcessing(true);
    
    if (pulseAnimRef.current) {
      pulseAnimRef.current.stopAnimation();
    }

    try {
      const recordingResult = await voiceService.stopRecording();
      
      if (recordingResult.success && recordingResult.transcription) {
        const transcription = recordingResult.transcription;
        setCurrentMessage(transcription);
        
        // Add user message to conversation
        const updatedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [
          ...conversationHistory,
          { role: 'user' as const, content: transcription }
        ];
        setConversationHistory(updatedHistory);

        // Send to AI
        const aiResponse = await aiService.sendMessage(updatedHistory);
        
        if (aiResponse.success && aiResponse.message) {
          setAiResponse(aiResponse.message);
          setConversationHistory([
            ...updatedHistory,
            { role: 'assistant' as const, content: aiResponse.message }
          ]);
          setShowAnimatedText(true);

          // Generate and play speech
          await generateAndPlaySpeech(aiResponse.message);

          if (onAIResponse) {
            onAIResponse(aiResponse.message);
          }
        } else {
          Alert.alert('Error', aiResponse.error || 'Failed to get AI response');
        }
      } else {
        Alert.alert('Error', recordingResult.error || 'Failed to transcribe audio');
      }
    } catch (error) {
      console.error('Error processing recording:', error);
      Alert.alert('Error', 'Failed to process recording');
    } finally {
      setIsProcessing(false);
      if (onAIProcessing) onAIProcessing(false);
    }
  };

  const stopAudio = async () => {
    await voiceService.stopAudio();
    setIsPlaying(false);
  };

  return (
    <View style={styles.container}>
      {/* AI Response Display with Typewriter Animation */}
      {aiResponse && (
        <View style={styles.responseContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.1)']}
            style={styles.responseGradient}
          >
            <AnimatedText
              text={aiResponse}
              speed={30}
              style={styles.responseText}
              isVisible={showAnimatedText}
              onComplete={() => {}}
            />
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <ActivityIndicator size="small" color="#8B5CF6" />
                <Text style={styles.playingText}>AI is speaking...</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      )}

      {/* Current Message Display */}
      {currentMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>"{currentMessage}"</Text>
        </View>
      )}

      {/* Recording Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordingActive,
            isProcessing && styles.processing
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Animatable.View
            ref={pulseAnimRef}
            animation={isRecording ? "pulse" : undefined}
            iterationCount="infinite"
            duration={1000}
            style={styles.pulseRing}
          />
          
          {isProcessing ? (
            <ActivityIndicator size={32} color="#FFFFFF" />
          ) : isRecording ? (
            <MicOff size={32} color="#FFFFFF" />
          ) : (
            <Mic size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {/* Stop Audio Button */}
        {isPlaying && (
          <TouchableOpacity style={styles.stopButton} onPress={stopAudio}>
            <VolumeX size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        {isRecording 
          ? 'Release to stop recording' 
          : isProcessing 
            ? 'Processing...' 
            : 'Hold to record your message'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  responseContainer: {
    width: '100%',
    marginBottom: 30,
  },
  responseGradient: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  responseText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  playingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  playingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  messageContainer: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.3)',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#00FF00',
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00FF00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  recordingActive: {
    backgroundColor: '#FF4444',
    shadowColor: '#FF4444',
  },
  processing: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  stopButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#999999',
    textAlign: 'center',
  },
});
