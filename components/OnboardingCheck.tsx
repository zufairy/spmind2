import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import { StarryBackground } from './StarryBackground';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const [hasNavigated, setHasNavigated] = useState(false);
  const hasNavigatedRef = useRef(false);
  const router = useRouter();
  
  // Hooks must be called unconditionally
  const authContext = useAuth();
  const user = authContext?.user || null;

  useEffect(() => {
    // Prevent re-running if already navigated
    if (hasNavigatedRef.current) {
      return;
    }

    let forceNavigationTimeout: NodeJS.Timeout | null = null;
    let noUserTimeout: NodeJS.Timeout | null = null;
    let navigationCompleted = false;

    // Safe navigation function
    const navigateTo = (route: string) => {
      if (navigationCompleted || hasNavigatedRef.current) {
        return;
      }
      
      try {
        navigationCompleted = true;
        hasNavigatedRef.current = true;
        setHasNavigated(true);
        
        // Use setTimeout to ensure state is set before navigation
        setTimeout(() => {
          try {
            router.replace(route);
          } catch (err) {
            console.error('❌ Router navigation error:', err);
          }
        }, 0);
      } catch (err) {
        console.error('❌ Navigation setup error:', err);
        hasNavigatedRef.current = true;
        setHasNavigated(true);
      }
    };

    // ULTRA-AGGRESSIVE TIMEOUT: Force navigation within 1 second maximum
    forceNavigationTimeout = setTimeout(() => {
      if (!hasNavigatedRef.current && !navigationCompleted) {
        console.warn('⚠️ OnboardingCheck: FORCE NAVIGATION (1s timeout)');
        if (user) {
          navigateTo('/onboarding');
        } else {
          navigateTo('/auth/login');
        }
      }
    }, 1000);

    // Quick navigation logic
    const performNavigation = async () => {
      try {
        // If no user after 500ms, go to login
        noUserTimeout = setTimeout(() => {
          if (!user && !hasNavigatedRef.current && !navigationCompleted) {
            console.log('➡️ No user detected, going to login');
            navigateTo('/auth/login');
            if (forceNavigationTimeout) clearTimeout(forceNavigationTimeout);
          }
        }, 500);

        // If we have a user, quickly check onboarding status
        if (user && user.id) {
          try {
            // Super fast query with 500ms timeout
            const queryPromise = supabase
              .from('users')
              .select('onboarding_completed')
              .eq('id', user.id)
              .maybeSingle();
            
            const fastTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('timeout')), 500)
            );
            
            const result = await Promise.race([queryPromise, fastTimeout]) as any;
            
            if (noUserTimeout) clearTimeout(noUserTimeout);
            if (forceNavigationTimeout) clearTimeout(forceNavigationTimeout);
            
            if (!hasNavigatedRef.current && !navigationCompleted) {
              if (result?.data?.onboarding_completed === true) {
                console.log('✅ Onboarding completed, going to home');
                navigateTo('/(tabs)/home');
              } else {
                console.log('➡️ Needs onboarding or no profile, going to onboarding');
                navigateTo('/onboarding');
              }
            }
          } catch (error: any) {
            // Any error = go to onboarding
            if (noUserTimeout) clearTimeout(noUserTimeout);
            if (forceNavigationTimeout) clearTimeout(forceNavigationTimeout);
            
            if (!hasNavigatedRef.current && !navigationCompleted) {
              console.log('➡️ Query failed, going to onboarding');
              navigateTo('/onboarding');
            }
          }
        } else {
          // No user - will be handled by noUserTimeout
        }
      } catch (err) {
        console.error('❌ Error in performNavigation:', err);
        if (!hasNavigatedRef.current && !navigationCompleted) {
          navigateTo('/auth/login');
        }
      }
    };

    // Start navigation check
    performNavigation();

    return () => {
      if (forceNavigationTimeout) clearTimeout(forceNavigationTimeout);
      if (noUserTimeout) clearTimeout(noUserTimeout);
    };
  }, [user, router]);

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
