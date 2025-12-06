import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  hasSeenOnboarding: boolean | null;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [hasSeenOnboarding, setHasSeenOnboardingState] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      setHasSeenOnboardingState(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasSeenOnboardingState(false);
    } finally {
      setLoading(false);
    }
  };

  const setHasSeenOnboarding = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', value.toString());
      setHasSeenOnboardingState(value);
    } catch (error) {
      console.error('Error setting onboarding status:', error);
    }
  };

  const value: OnboardingContextType = {
    hasSeenOnboarding,
    setHasSeenOnboarding,
    loading,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
