import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, ArrowLeft, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { supabase } from '../../services/supabase';
import { StarryBackground } from '../../components/StarryBackground';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Can be username or email
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your username or email');
      return;
    }

    setLoading(true);
    try {
      let emailToReset = identifier;

      // Check if input is a username (doesn't contain @)
      if (!identifier.includes('@')) {
        console.log('🔍 Looking up email for username:', identifier);
        
        // Look up the email associated with this username using RPC function
        const { data, error } = await supabase
          .rpc('get_email_by_username', { username_lookup: identifier.toLowerCase() });

        if (error || !data) {
          console.error('Error looking up username:', error);
          // Don't reveal if username exists or not - show generic message
          Alert.alert(
            'Check Your Email',
            'If an account exists with this username or email, a password reset link has been sent. Please check your inbox and follow the instructions.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
          setLoading(false);
          return;
        }

        emailToReset = data;
        console.log('✅ Found email for username:', emailToReset);
      }

      // Validate email before sending
      if (!emailToReset || !emailToReset.includes('@')) {
        console.error('Invalid email address:', emailToReset);
        // Show generic message without revealing the issue
        Alert.alert(
          'Check Your Email',
          'If an account exists with this username or email, a password reset link has been sent. Please check your inbox and follow the instructions.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Send password reset email
      console.log('📧 Attempting to send reset email to:', emailToReset);
      
      try {
        const { error } = await authService.resetPassword(emailToReset);
        
        if (error) {
          // Log error for debugging but don't show to user
          console.error('Reset password error:', error);
          
          // Check if it's an invalid email format error
          if (error.code === 'email_address_invalid') {
            console.warn('Email address rejected by Supabase:', emailToReset);
            console.warn('User may need to update their email to a valid format');
          }
        } else {
          console.log('✅ Reset email sent successfully');
        }
      } catch (err) {
        console.error('Exception sending reset email:', err);
      }
      
      // Always show success message (don't reveal if account exists or if email is invalid)
      Alert.alert(
        'Check Your Email',
        'If an account exists with this username or email, a password reset link has been sent. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      // Show generic message for security - don't reveal if account exists
      Alert.alert(
        'Check Your Email',
        'If an account exists with this username or email, a password reset link has been sent. Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.darkBackground}>
        <StarryBackground />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Hero Image */}
          <View style={styles.heroSection}>
            <Image 
              source={require('../../assets/images/Logo_Long.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your username or email and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <User size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={[styles.resetButton, loading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size={20} color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backToLoginText}>
                Remember your password? <Text style={styles.signInText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkBackground: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroImage: {
    width: 200,
    height: 200,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
  },
  backToLoginButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToLoginText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  signInText: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});

