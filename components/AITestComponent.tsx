import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { onboardingChatService } from '../services/onboardingChatService';
import { isAIConfigured } from '../config/api';

export const AITestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');

  const testAIResponse = async () => {
    if (!isAIConfigured()) {
      Alert.alert('Error', 'OpenAI API key not configured');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🧪 Testing AI response...');
      
      const response = await onboardingChatService.generateOnboardingResponse(
        'Hello, my name is John',
        0, // current step
        'John',
        'en'
      );

      if (response.success && response.message) {
        setLastResponse(response.message);
        Alert.alert('Success!', `AI Response: ${response.message}`);
        console.log('✅ AI test successful:', response.message);
      } else {
        Alert.alert('Error', `AI failed: ${response.error || 'Unknown error'}`);
        console.error('❌ AI test failed:', response.error);
      }
    } catch (error) {
      Alert.alert('Error', `Test failed: ${error}`);
      console.error('❌ AI test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Response Test</Text>
      <Text style={styles.subtitle}>
        API Key Status: {isAIConfigured() ? '✅ Configured' : '❌ Not Configured'}
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={testAIResponse}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test AI Response'}
        </Text>
      </TouchableOpacity>

      {lastResponse && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>Last Response:</Text>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    margin: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#00FF00',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00FF00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  responseContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  responseLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  responseText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
});

