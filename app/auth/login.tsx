import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LoginCredentials, authService } from '../../services/authService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { StarryBackground } from '../../components/StarryBackground';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle, resendConfirmationEmail } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  
  // Slide up animations on mount
  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(logoAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(formAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user, error } = await loginWithGoogle();
      
      if (error) {
        Alert.alert('Google Login Failed', error);
      } else if (user) {
        // Navigate to main app
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during Google login');
    } finally {
      setLoading(false);
    }
  };

    const handleLogin = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic validation
    if (!credentials.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (credentials.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 LoginScreen: Attempting login...');
      const { user, error } = await login(credentials.email, credentials.password);
      
      if (error) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Login failed. Please try again.';
        console.error('❌ LoginScreen: Login failed:', errorMessage);
        
        // Show user-friendly error message
        Alert.alert('Login Failed', errorMessage);
      } else if (user) {
        console.log('✅ LoginScreen: Login successful, navigating to home...');
        // Navigate to main app
        router.replace('/(tabs)/home');
      } else {
        console.warn('⚠️ LoginScreen: No user returned, no error');
        Alert.alert('Login Failed', 'Unable to complete login. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ LoginScreen: Exception during login:', error);
      const errorMessage = error?.message || 'An unexpected error occurred. Please check your internet connection and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.darkBackground} pointerEvents="box-none">
        <StarryBackground />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {/* Hero Image */}
          <Animated.View 
            style={[
              styles.heroSection,
              {
                opacity: logoAnim,
                transform: [{
                  translateY: logoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                }],
              }
            ]}
          >
            <Image 
              source={require('../../assets/images/Logo_Long.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Welcome Text */}
          <Animated.View 
            style={[
              styles.welcomeSection,
              {
                opacity: titleAnim,
                transform: [{
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.welcomeTitle}>Let's Get Started</Text>
            <Text style={styles.welcomeSubtitle}>
              #1 AI Powered Tutor
            </Text>
          </Animated.View>

          {/* Login Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: formAnim,
                transform: [{
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              }
            ]}
          >
            <View style={styles.inputContainer}>
              <Mail size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={credentials.email}
                onChangeText={(text) =>
                  setCredentials({ ...credentials, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={true}
                returnKeyType="next"
                blurOnSubmit={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={credentials.password}
                onChangeText={(text) =>
                  setCredentials({ ...credentials, password: text })
                }
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={true}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={20} color="rgba(255, 255, 255, 0.4)" />
                ) : (
                  <Eye size={20} color="rgba(255, 255, 255, 0.4)" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size={20} color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={[styles.googleButton, loading && styles.googleButtonDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <LoadingSpinner size={20} color="#000" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <View style={styles.googleIconWrapper}>
                      <View style={styles.googleIconCircle}>
                        <View style={[styles.googleIconSegment, styles.googleIconBlue]} />
                        <View style={[styles.googleIconSegment, styles.googleIconRed]} />
                        <View style={[styles.googleIconSegment, styles.googleIconYellow]} />
                        <View style={[styles.googleIconSegment, styles.googleIconGreen]} />
                        <View style={styles.googleIconCenter} />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.registerButtonText}>
                Don't have an account? <Text style={styles.signUpText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
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
    paddingTop: 80,
    paddingBottom: 40,
    position: 'relative',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  heroImage: {
    width: 180,
    height: 60,
    marginBottom: 0,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: -20,
  },
  welcomeTitle: {
    fontSize: 38,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  formContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 48,
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
    padding: 0,
    margin: 0,
  },
  eyeButton: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  loginButton: {
    backgroundColor: '#FF6600',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 52,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 220, 224, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  googleIconWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8EAED',
  },
  googleIconSegment: {
    position: 'absolute',
  },
  googleIconBlue: {
    backgroundColor: '#4285F4',
    top: 0,
    left: 0,
    width: 10,
    height: 10,
    borderTopLeftRadius: 9,
  },
  googleIconRed: {
    backgroundColor: '#EA4335',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderTopRightRadius: 9,
  },
  googleIconYellow: {
    backgroundColor: '#FBBC04',
    bottom: 0,
    left: 0,
    width: 10,
    height: 10,
    borderBottomLeftRadius: 9,
  },
  googleIconGreen: {
    backgroundColor: '#34A853',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderBottomRightRadius: 9,
  },
  googleIconCenter: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
    top: 5.5,
    left: 5.5,
  },
  googleButtonText: {
    color: '#3C4043',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  registerButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: -12,
  },
  registerButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  signUpText: {
    color: '#FF6600',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
});
