import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { OnboardingCheck } from '../components/OnboardingCheck';

// Global error handler for null URL issues
const originalFetch = global.fetch;
global.fetch = function(url, options) {
  if (url === null || url === undefined) {
    console.error('❌ GLOBAL FETCH ERROR: Attempted to fetch with null/undefined URL');
    console.error('Stack trace:', new Error().stack);
    console.error('URL value:', url);
    console.error('Options:', options);
    throw new Error('Cannot fetch with null or undefined URL');
  }
  return originalFetch.call(this, url, options);
};

// Global error handler for Image component
const originalImage = require('react-native').Image;
if (originalImage) {
  const originalGetSize = originalImage.getSize;
  const originalPrefetch = originalImage.prefetch;
  
  originalImage.getSize = function(uri, success, failure) {
    if (!uri || uri === null || uri === undefined) {
      console.error('❌ IMAGE GETSIZE ERROR: Attempted to get size with null/undefined URI');
      console.error('URI value:', uri);
      if (failure) failure(new Error('Cannot get size with null or undefined URI'));
      return;
    }
    return originalGetSize.call(this, uri, success, failure);
  };
  
  originalImage.prefetch = function(uri) {
    if (!uri || uri === null || uri === undefined) {
      console.error('❌ IMAGE PREFETCH ERROR: Attempted to prefetch with null/undefined URI');
      console.error('URI value:', uri);
      return Promise.reject(new Error('Cannot prefetch with null or undefined URI'));
    }
    return originalPrefetch.call(this, uri);
  };
}
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
// OnboardingProvider removed - onboarding is now handled by OnboardingCheck component
// which checks the database onboarding_completed field after authentication
import { MultiplayerProvider } from '../contexts/MultiplayerContext';
import { InitialNavigator } from '../components/InitialNavigator';
import { NavigationHandler } from '../components/NavigationHandler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync();

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
      staleTime: 1000 * 60 * 5,  // Data fresh for 5 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus (mobile doesn't need this)
      refetchOnReconnect: true,    // Refetch when internet reconnects
      retry: 2,                     // Retry failed queries 2 times
      retryDelay: 1000,            // Wait 1 second between retries
    },
  },
});

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <NavigationHandler />
      <Stack 
        screenOptions={{ headerShown: false }}
        initialRouteName="(tabs)"
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="quiz" options={{ presentation: 'modal', gestureEnabled: true }} />
        <Stack.Screen name="tutor" options={{ presentation: 'modal', gestureEnabled: true }} />
        <Stack.Screen name="avatar" options={{ presentation: 'modal', gestureEnabled: true }} />
      </Stack>
    </>
  );
}

function AppWithNavigation() {
  const { user, loading: authLoading } = useAuth();
  const [forceReady, setForceReady] = React.useState(false);
  const [appStartTime] = React.useState(Date.now());

  // Safety timeout to prevent infinite loading and ensure minimum splash screen duration
  React.useEffect(() => {
    // Skip if already ready
    if (forceReady) {
      return;
    }

    console.log('🚀 AppWithNavigation: Auth loading state:', { authLoading, hasUser: !!user });
    
    const elapsed = Date.now() - appStartTime;
    const minSplashDuration = 1500; // 1.5 seconds minimum splash screen
    
    // Single timeout instead of interval to prevent spam
    const timeout = setTimeout(() => {
      if (!forceReady) {
        console.log('✅ AppWithNavigation: App ready');
        setForceReady(true);
      }
    }, Math.max(0, minSplashDuration - elapsed)); // Wait remaining time

    return () => {
      clearTimeout(timeout);
    };
  }, [authLoading, forceReady, appStartTime]);

  // Show loading screen ONLY during auth loading (removed forceReady check)
  if (authLoading && !forceReady) {
    console.log('⏳ AppWithNavigation: Showing loading screen');
    return <InitialNavigator />;
  }

  // Always show AppContent - navigation will be handled by the Stack navigator
  // based on the current route state
  console.log('✅ AppWithNavigation: Rendering app content');
  return <AppContent />;
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'SpaceGrotesk-Regular': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <MultiplayerProvider>
            <OnboardingCheck>
              <AppWithNavigation />
            </OnboardingCheck>
            <StatusBar style="auto" />
          </MultiplayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
