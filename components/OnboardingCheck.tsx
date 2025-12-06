import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { StarryBackground } from './StarryBackground';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const [hasNavigated, setHasNavigated] = useState(false);
  const navigationDone = useRef(false);
  const router = useRouter();
  
  const authContext = useAuth();
  const user = authContext?.user || null;
  const authLoading = authContext?.loading ?? true;

  useEffect(() => {
    // Prevent multiple navigation attempts
    if (navigationDone.current) {
      console.log('✅ OnboardingCheck: Navigation already done, skipping');
      return;
    }

    const navigateTo = (route: string) => {
      if (navigationDone.current) return;
      navigationDone.current = true;
      console.log(`🚀 OnboardingCheck: Navigating to ${route}`);
      setHasNavigated(true);
      
      // Use setTimeout to ensure navigation happens after current render cycle
      setTimeout(() => {
        router.replace(route);
      }, 50);
    };

    // Force navigation after 2 seconds no matter what
    const forceTimeout = setTimeout(() => {
      if (!navigationDone.current) {
        console.warn('⚠️ Force navigating to login after timeout');
        navigateTo('/auth/login');
      }
    }, 2000);

    // If auth is still loading, wait
    if (authLoading) {
      console.log('⏳ Waiting for auth...');
      return () => clearTimeout(forceTimeout);
    }

    // Navigate based on user state
    if (!user) {
      // Check if first-time user should see intro
      AsyncStorage.getItem('hasSeenIntro')
        .then((hasSeenIntro) => {
          clearTimeout(forceTimeout);
          if (!hasSeenIntro || hasSeenIntro !== 'true') {
            console.log('👋 No user, first time - showing intro');
            navigateTo('/intro');
          } else {
            console.log('➡️ No user, returning - going to login');
            navigateTo('/auth/login');
          }
        })
        .catch(() => {
          clearTimeout(forceTimeout);
          console.log('➡️ No user, AsyncStorage error - going to login');
          navigateTo('/auth/login');
        });
    } else {
      // Check onboarding status
      supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          clearTimeout(forceTimeout);
          if (data?.onboarding_completed === true) {
            console.log('✅ Onboarding done, going to home');
            navigateTo('/(tabs)/home');
          } else {
            console.log('➡️ Needs onboarding');
            navigateTo('/onboarding');
          }
        })
        .catch(() => {
          clearTimeout(forceTimeout);
          console.log('➡️ Query failed, going to onboarding');
          navigateTo('/onboarding');
        });
    }

    return () => clearTimeout(forceTimeout);
  }, [authLoading, user]); // Removed 'router' from dependencies to prevent re-runs

  // Show loading ONLY if we haven't navigated yet
  if (!hasNavigated) {
    return (
      <View style={styles.loadingContainer}>
        <StarryBackground />
        <View style={styles.loadingContent}>
          <Animatable.Text 
            animation="pulse"
            iterationCount="infinite" 
            duration={1200}
            easing="ease-in-out"
            style={styles.loadingEmoji}
          >
            📚
          </Animatable.Text>
          <Animatable.Text 
            animation="fadeIn"
            delay={200}
            style={styles.loadingText}
          >
            Loading...
          </Animatable.Text>
        </View>
      </View>
    );
  }

  // If navigated, render children normally - router will handle navigation
  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 100,
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 0,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 8,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
