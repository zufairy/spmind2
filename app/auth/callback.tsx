import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.replace('/auth/login');
          return;
        }

        if (session?.user) {
          // User is authenticated, redirect to home
          router.replace('/(tabs)/home');
        } else {
          // No session, redirect to login
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/auth/login');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <View style={styles.container}>
      <LoadingSpinner size={40} color="#3B82F6" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    fontFamily: 'Inter-Regular',
  },
});





