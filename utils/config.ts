// Configuration file for API keys and environment variables
export const config = {
  // OpenAI API Key for ChatGPT and Whisper transcription
  openAI: {
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || null,
  },
  
  // ElevenLabs API Key for text-to-speech
  elevenLabs: {
    apiKey: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || null,
  },
  
  // Voice settings
  voice: {
    defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - English
    malayVoiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - Malay
  },
  
  // App settings
  app: {
    name: 'TutorPal',
    version: '1.0.0',
  },
};

// Helper function to check if API keys are configured
export const isConfigured = () => {
  return {
    openAI: !!config.openAI.apiKey,
    elevenLabs: !!config.elevenLabs.apiKey,
  };
};

// Helper function to get missing API keys
export const getMissingKeys = () => {
  const missing = [];
  if (!config.openAI.apiKey) missing.push('EXPO_PUBLIC_OPENAI_API_KEY');
  if (!config.elevenLabs.apiKey) missing.push('EXPO_PUBLIC_ELEVENLABS_API_KEY');
  return missing;
};
