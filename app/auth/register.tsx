import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, User, ArrowLeft, Lock, X, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { supabase } from '../../services/supabase';
import { testDatabaseConnection } from '../../services/databaseTest';
import { testSupabaseConnection } from '../../services/testSupabaseConnection';
import { StarryBackground } from '../../components/StarryBackground';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1); // Step 1: email & password, Step 2: name & username
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
  });
  const [checking, setChecking] = useState({
    username: false,
    email: false,
  });
  const [available, setAvailable] = useState({
    username: false,
    email: false,
  });
  const [passwordValid, setPasswordValid] = useState(false);
  
  const usernameTimeout = useRef<NodeJS.Timeout | null>(null);
  const emailTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const loginTextOpacity = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 50 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(-100),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Check username availability - simplified and faster
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setAvailable(prev => ({ ...prev, username: false }));
      setErrors(prev => ({ ...prev, username: username.length > 0 && username.length < 3 ? 'Username must be at least 3 characters' : '' }));
      setChecking(prev => ({ ...prev, username: false }));
      return;
    }

    setChecking(prev => ({ ...prev, username: true }));
    
    try {
      // Direct RPC call - no connection test to speed things up
      const { data: exists, error } = await supabase
        .rpc('check_username_exists', { username_to_check: username })
        .timeout(2000); // 2 second timeout for faster failure

      if (error) {
        // Simplified error handling - just allow to proceed
        // Database constraints will catch duplicates on registration
        console.warn('⚠️ Username check error, allowing to proceed:', error.message);
        setErrors(prev => ({ ...prev, username: '' }));
        setAvailable(prev => ({ ...prev, username: true }));
        setChecking(prev => ({ ...prev, username: false }));
        return;
      }

      if (exists) {
        // Username exists
        console.log('❌ Username already exists');
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
        setAvailable(prev => ({ ...prev, username: false }));
      } else {
        // Username is available
        console.log('✅ Username is available');
        setErrors(prev => ({ ...prev, username: '' }));
        setAvailable(prev => ({ ...prev, username: true }));
      }
    } catch (error: any) {
      // Graceful fallback - allow to proceed (will be validated on registration)
      // Silently fail - don't log to prevent console spam
      setErrors(prev => ({ ...prev, username: '' }));
      setAvailable(prev => ({ ...prev, username: true }));
      setChecking(prev => ({ ...prev, username: false }));
      // Don't throw - just allow to proceed
    }
  };

  // Check email availability - simplified and faster
  const checkEmailAvailability = async (email: string) => {
    if (!email || !email.includes('@')) {
      setAvailable(prev => ({ ...prev, email: false }));
      setErrors(prev => ({ ...prev, email: email.length > 0 && !email.includes('@') ? 'Please enter a valid email' : '' }));
      setChecking(prev => ({ ...prev, email: false }));
      return;
    }

    setChecking(prev => ({ ...prev, email: true }));
    
    try {
      // Direct RPC call - no connection test to speed things up
      const { data: exists, error } = await supabase
        .rpc('check_email_exists', { email_to_check: email })
        .timeout(2000); // 2 second timeout for faster failure

      if (error) {
        // Simplified error handling - just allow to proceed
        // Database constraints will catch duplicates on registration
        console.warn('⚠️ Email check error, allowing to proceed:', error.message);
        setErrors(prev => ({ ...prev, email: '' }));
        setAvailable(prev => ({ ...prev, email: true }));
        setChecking(prev => ({ ...prev, email: false }));
        return;
      }

      if (error) {
        // Simplified error handling - just allow to proceed
        // Database constraints will catch duplicates on registration
        console.warn('⚠️ Email check error, allowing to proceed:', error.message);
        setErrors(prev => ({ ...prev, email: '' }));
        setAvailable(prev => ({ ...prev, email: true }));
        setChecking(prev => ({ ...prev, email: false }));
        return;
      }

      if (exists) {
        // Email exists
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        setAvailable(prev => ({ ...prev, email: false }));
      } else {
        // Email is available
        setErrors(prev => ({ ...prev, email: '' }));
        setAvailable(prev => ({ ...prev, email: true }));
      }
    } catch (error: any) {
      // Graceful fallback - allow to proceed
      // Database constraints will catch duplicates on registration
      // Silently fail - don't log to prevent console spam
      setErrors(prev => ({ ...prev, email: '' }));
      setAvailable(prev => ({ ...prev, email: true }));
      setChecking(prev => ({ ...prev, email: false }));
      // Don't throw - just allow to proceed
    }
  };

  // Debounced username check
  const handleUsernameChange = (text: string) => {
    setCredentials(prev => ({ ...prev, username: text }));
    setAvailable(prev => ({ ...prev, username: false }));
    setErrors(prev => ({ ...prev, username: '' }));
    
    // Clear previous timeout
    if (usernameTimeout.current) {
      clearTimeout(usernameTimeout.current);
    }
    
    // Set new timeout - reduced to 150ms for instant feel
    if (text.length >= 3) {
      usernameTimeout.current = setTimeout(() => {
        checkUsernameAvailability(text);
      }, 150); // Wait 150ms after user stops typing (near-instant response)
    }
  };

  // Debounced email check
  const handleEmailChange = (text: string) => {
    setCredentials(prev => ({ ...prev, email: text }));
    setAvailable(prev => ({ ...prev, email: false }));
    setErrors(prev => ({ ...prev, email: '' }));
    
    // Clear previous timeout
    if (emailTimeout.current) {
      clearTimeout(emailTimeout.current);
    }
    
    // Set new timeout - reduced to 150ms for instant feel
    if (text.includes('@') && text.includes('.')) {
      emailTimeout.current = setTimeout(() => {
        checkEmailAvailability(text);
      }, 150); // Wait 150ms after user stops typing (near-instant response)
    }
  };

  // Password validation
  const handlePasswordChange = (text: string) => {
    setCredentials(prev => ({ ...prev, password: text }));
    // Check if password meets requirements (min 6 characters)
    setPasswordValid(text.length >= 6);
  };

  // Test Supabase connection on mount (silent - no blocking alerts)
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        const supabaseTest = await testSupabaseConnection();
        if (supabaseTest.urlReachable) {
          console.log('✅ Supabase connection OK');
        } else {
          console.warn('📴 Cannot reach Supabase - device may be offline');
        }
      } catch (error) {
        console.warn('📴 Connection test skipped - offline');
      }
    };
    testConnection();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
      if (emailTimeout.current) clearTimeout(emailTimeout.current);
    };
  }, []);

  // Slide up animations on mount
  useEffect(() => {
    // Staggered slide-up animations
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

  const handleGoogleSignup = async () => {
    Alert.alert('Google Sign Up', 'Google sign up feature coming soon!');
    // TODO: Implement Google OAuth
  };

  const handleContinueToStep2 = async () => {
    // Validate step 1
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please fill in email and password');
      return;
    }

    if (!credentials.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (credentials.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // If still checking email, wait for it to complete
    if (checking.email) {
      Alert.alert('Please wait', 'Checking email availability...');
      return;
    }

    // If email validation hasn't run yet, trigger it now
    if (!available.email && !errors.email && credentials.email.includes('@')) {
      await checkEmailAvailability(credentials.email);
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check email availability after validation
    if (errors.email) {
      Alert.alert('Error', errors.email);
      return;
    }

    if (!available.email && credentials.email.includes('@')) {
      Alert.alert('Error', 'Please wait for email validation to complete');
      return;
    }

    // Animate transition to step 2
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(loginTextOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(2);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleRegister = async () => {
    // Validation for step 2
    if (!credentials.full_name || !credentials.username) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (credentials.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    // Check if username or email has errors
    if (errors.username || errors.email) {
      const errorMessages = [];
      if (errors.username) errorMessages.push(errors.username);
      if (errors.email) errorMessages.push(errors.email);
      Alert.alert('Error', errorMessages.join('\n'));
      return;
    }

    // Don't block registration if checks are still running
    // Database will validate duplicates anyway
    if (checking.username || checking.email) {
      // Clear checking state and proceed
      setChecking(prev => ({ username: false, email: false }));
    }

    // Skip availability checks - database will validate duplicates on registration
    // This prevents registration from failing due to check errors
    // Only show errors if they were already detected from real-time checks
    if (errors.username) {
      Alert.alert('Error', errors.username);
      return;
    }

    if (errors.email) {
      Alert.alert('Error', errors.email);
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Register: Starting registration...');
      
      // Add timeout to prevent endless loading
      const registrationPromise = register({
        email: credentials.email,
        password: credentials.password,
        full_name: credentials.full_name,
        username: credentials.username,
        school: '', // Will be collected in onboarding
        age: 0, // Will be calculated in onboarding
        birth_date: '', // Will be collected in onboarding
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Registration timeout. Please check your internet connection and try again.')), 30000)
      );
      
      const { user, error } = await Promise.race([registrationPromise, timeoutPromise]) as any;
      
      if (error) {
        console.error('❌ Register: Registration error:', error);
        setLoading(false);
        
        // Check for specific error types
        const errorMsg = error.toLowerCase();
        
        if (errorMsg.includes('email') && (errorMsg.includes('already') || errorMsg.includes('exists') || errorMsg.includes('taken'))) {
          setErrors({ ...errors, email: 'Email already exists' });
          Alert.alert('Registration Failed', 'Email already exists. Please use a different email or sign in.');
        } else if (errorMsg.includes('username') && (errorMsg.includes('already') || errorMsg.includes('exists') || errorMsg.includes('taken'))) {
          setErrors({ ...errors, username: 'Username already exists' });
          Alert.alert('Registration Failed', 'Username already exists. Please choose a different username.');
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
          // Generic duplicate error - check which field
          if (errorMsg.includes('email')) {
            setErrors({ ...errors, email: 'Email already exists' });
            Alert.alert('Registration Failed', 'Email already exists.');
          } else if (errorMsg.includes('username')) {
            setErrors({ ...errors, username: 'Username already exists' });
            Alert.alert('Registration Failed', 'Username already exists.');
          } else {
            Alert.alert('Registration Failed', error);
          }
        } else if (errorMsg.includes('timeout')) {
          Alert.alert('Registration Timeout', error);
        } else {
          Alert.alert('Registration Failed', error);
        }
        return;
      }
      
      if (user) {
        console.log('✅ Register: Registration successful, user:', user.id);
        // Show success modal with confetti
        setShowSuccessModal(true);
        
        // Animate modal
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
        
        // Animate confetti
        confettiAnims.forEach((anim, i) => {
          const randomX = Math.random() * 400 - 200;
          const randomRotate = Math.random() * 720;
          const delay = Math.random() * 300;
          
          Animated.parallel([
            Animated.timing(anim.x, {
              toValue: randomX,
              duration: 2000,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: 800,
              duration: 2000,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: randomRotate,
              duration: 2000,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 2000,
              delay: delay + 1000,
              useNativeDriver: true,
            }),
          ]).start();
        });
        
        // Redirect to onboarding after celebration
        setTimeout(() => {
          setLoading(false);
          router.replace('/onboarding');
        }, 2500);
      } else {
        console.warn('⚠️ Register: No user returned from registration');
        setLoading(false);
        Alert.alert('Registration Failed', 'Unable to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Register: Registration exception:', error);
      setLoading(false);
      
      const errorMsg = error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('email') && (errorMsg.includes('already') || errorMsg.includes('exists'))) {
        setErrors({ ...errors, email: 'Email already exists' });
        Alert.alert('Registration Failed', 'Email already exists. Please use a different email or sign in.');
      } else if (errorMsg.includes('username') && (errorMsg.includes('already') || errorMsg.includes('exists'))) {
        setErrors({ ...errors, username: 'Username already exists' });
        Alert.alert('Registration Failed', 'Username already exists. Please choose a different username.');
      } else if (errorMsg.includes('timeout')) {
        Alert.alert('Registration Timeout', error.message || 'Registration took too long. Please check your internet connection and try again.');
      } else {
        Alert.alert('Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
      }
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
          {/* Logo */}
          <Animated.View 
            style={[
              styles.logoSection,
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
              style={styles.logoImage}
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
            <Text style={styles.welcomeTitle}>Become a SPMind</Text>
            <Text style={styles.welcomeSubtitle}>
              {step === 1 ? 'Start your learning journey today' : 'Complete your profile'}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View 
            style={[
              styles.formContainer,
              {
                opacity: Animated.multiply(fadeAnim, formAnim),
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {step === 1 ? (
              <>
                {/* Step 1: Email & Password */}
                {/* Email Field */}
                <View>
                  <View style={[
                    styles.inputContainer, 
                    errors.email && styles.inputContainerError,
                    available.email && styles.inputContainerSuccess
                  ]}>
                    <Mail size={18} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={credentials.email}
                      onChangeText={handleEmailChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {checking.email && (
                      <ActivityIndicator size="small" color="#999" style={styles.checkingIcon} />
                    )}
                    {!checking.email && errors.email && (
                      <X size={18} color="#FF4444" style={styles.errorIcon} />
                    )}
                    {!checking.email && available.email && !errors.email && (
                      <Check size={18} color="#00FF00" style={styles.successIcon} />
                    )}
                  </View>
                  {errors.email && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.email}</Text>
                    </View>
                  )}
                </View>

                {/* Password Field */}
                <View style={[
                  styles.inputContainer,
                  passwordValid && credentials.password.length > 0 && styles.inputContainerSuccess
                ]}>
                  <Lock size={18} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={credentials.password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {passwordValid && credentials.password.length > 0 && (
                    <Check size={18} color="#00FF00" style={styles.successIcon} />
                  )}
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleContinueToStep2}
                >
                  <Text style={styles.registerButtonText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign Up Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignup}
                  activeOpacity={0.8}
                >
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
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Step 2: Full Name & Username */}
                {/* Name Field */}
                <View style={styles.inputContainer}>
                  <User size={18} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={credentials.full_name}
                    onChangeText={(text) => setCredentials({ ...credentials, full_name: text })}
                    autoCapitalize="words"
                  />
                </View>

                {/* Username Field */}
                <View>
                  <View style={[
                    styles.inputContainer, 
                    errors.username && styles.inputContainerError,
                    available.username && styles.inputContainerSuccess
                  ]}>
                    <User size={18} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Username"
                      placeholderTextColor="rgba(255, 255, 255, 0.3)"
                      value={credentials.username}
                      onChangeText={handleUsernameChange}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {checking.username && (
                      <ActivityIndicator size="small" color="#999" style={styles.checkingIcon} />
                    )}
                    {!checking.username && errors.username && (
                      <X size={18} color="#FF4444" style={styles.errorIcon} />
                    )}
                    {!checking.username && available.username && !errors.username && (
                      <Check size={18} color="#00FF00" style={styles.successIcon} />
                    )}
                  </View>
                  {errors.username && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.username}</Text>
                    </View>
                  )}
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size={20} color="#fff" />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    Animated.parallel([
                      Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                      }),
                    ]).start(() => {
                      setStep(1);
                      slideAnim.setValue(50);
                      Animated.parallel([
                        Animated.timing(fadeAnim, {
                          toValue: 1,
                          duration: 300,
                          useNativeDriver: true,
                        }),
                        Animated.spring(slideAnim, {
                          toValue: 0,
                          tension: 50,
                          friction: 8,
                          useNativeDriver: true,
                        }),
                        Animated.timing(loginTextOpacity, {
                          toValue: 1,
                          duration: 300,
                          useNativeDriver: true,
                        }),
                      ]).start();
                    });
                  }}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Login Link */}
            {step === 1 && (
              <Animated.View style={{ opacity: loginTextOpacity }}>
                <TouchableOpacity 
                  style={styles.loginContainer}
                  onPress={() => router.push('/auth/login')}
                >
                  <Text style={styles.loginText}>
                    Already have an account? <Text style={styles.loginLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </View>
      
      {/* Success Modal with Confetti */}
      <Modal visible={showSuccessModal} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <StarryBackground />
          
          {/* Confetti */}
          {confettiAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: '50%',
                  backgroundColor: ['#FF6B35', '#FFD700', '#00FF00', '#3B82F6', '#FF1493'][i % 5],
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}
          
          {/* Success Card */}
          <Animated.View
            style={[
              styles.successCard,
              { transform: [{ scale: modalScale }] },
            ]}
          >
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>Congratulations!</Text>
            <Text style={styles.successMessage}>
              Welcome to SPMind!{'\n'}
              Your account has been created successfully.
            </Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>Let's start your journey! 🚀</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoImage: {
    width: 180,
    height: 60,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainerError: {
    borderColor: '#FF4444',
    borderWidth: 1.5,
    marginBottom: 4,
  },
  inputContainerSuccess: {
    borderColor: '#00FF00',
    borderWidth: 2,
    backgroundColor: 'rgba(0, 255, 0, 0.05)',
  },
  inputIcon: {
    marginRight: 10,
  },
  errorIcon: {
    marginLeft: 10,
  },
  successIcon: {
    marginLeft: 10,
  },
  checkingIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  errorContainer: {
    marginBottom: 12,
    marginTop: -8,
    paddingHorizontal: 14,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#FF4444',
  },
  registerButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 6,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 15,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
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
    height: 56,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 220, 224, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  loginContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 8,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    color: '#FF6600',
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  confetti: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    minWidth: 320,
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  successBadgeText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});