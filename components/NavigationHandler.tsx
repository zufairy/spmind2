import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NavigationHandler: React.FC = () => {
  const router = useRouter();
  const segments = useSegments();
  const { user, loading: authLoading } = useAuth();
  const [hasNavigated, setHasNavigated] = useState(false);
  const [introChecked, setIntroChecked] = useState(false);

  useEffect(() => {
    const handleInitialNavigation = async () => {
      console.log('🧭 NavigationHandler: Checking navigation...', { 
        authLoading, 
        hasUser: !!user,
        hasNavigated,
        introChecked,
        currentSegments: segments 
      });

      // Don't navigate if still loading
      if (authLoading) {
        console.log('⏳ NavigationHandler: Auth still loading');
        return;
      }

      // Prevent multiple navigations
      if (hasNavigated) {
        console.log('✅ NavigationHandler: Already navigated');
        return;
      }

      // If user is authenticated, let OnboardingCheck handle the onboarding logic
      if (user) {
        console.log('👤 NavigationHandler: User authenticated, letting OnboardingCheck handle navigation');
        setHasNavigated(true);
        return;
      }

      // If user is not authenticated, check if they've seen the intro
      // Check if user has seen intro
      const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
      setIntroChecked(true);

      if (!hasSeenIntro || hasSeenIntro === null) {
        console.log('👋 NavigationHandler: First time user, showing intro');
        router.replace('/intro');
        setHasNavigated(true);
      } else {
        console.log('🔒 NavigationHandler: Returning user, going to login');
        router.replace('/auth/login');
        setHasNavigated(true);
      }
    };

    // Small delay to ensure smooth transition
    const timer = setTimeout(handleInitialNavigation, 100);
    
    return () => clearTimeout(timer);
  }, [user, authLoading, router, hasNavigated, segments, introChecked]);

  // This component doesn't render anything - it just handles navigation
  return null;
};
