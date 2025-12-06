import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NavigationHandler: React.FC = () => {
  // DISABLED: Navigation is now handled by OnboardingCheck component
  // This component is kept for backwards compatibility but does nothing
  // to prevent conflicts with OnboardingCheck's navigation logic
  
  console.log('🧭 NavigationHandler: Disabled (navigation handled by OnboardingCheck)');
  
  // This component doesn't render anything - navigation is handled by OnboardingCheck
  return null;
};
