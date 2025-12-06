import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper function to reset the intro screen status
 * Use this during development to test the intro flow again
 */
export const resetIntroStatus = async () => {
  try {
    await AsyncStorage.removeItem('hasSeenIntro');
    console.log('✅ Intro status reset. Restart the app to see the intro again.');
    return { success: true };
  } catch (error) {
    console.error('❌ Error resetting intro status:', error);
    return { success: false, error };
  }
};

/**
 * Check if user has seen the intro
 */
export const checkIntroStatus = async () => {
  try {
    const hasSeenIntro = await AsyncStorage.getItem('hasSeenIntro');
    console.log('📱 Intro status:', hasSeenIntro ? 'Seen' : 'Not seen');
    return hasSeenIntro === 'true';
  } catch (error) {
    console.error('❌ Error checking intro status:', error);
    return false;
  }
};




