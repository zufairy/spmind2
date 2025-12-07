// API Configuration
export const API_CONFIG = {
  OPENAI_API_KEY: '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',
  
  // OpenAI API Configuration
  OPENAI: {
    BASE_URL: 'https://api.openai.com/v1',
    MODEL: 'gpt-4o-mini', // Fastest model
    MAX_TOKENS: 150,
    TEMPERATURE: 0.2,
    TIMEOUT: 30000, // 30 seconds
  },
  
  // Service Status
  SERVICES: {
    AI_RESPONSES_ENABLED: true,
    VOICE_ENABLED: true,
    STREAMING_ENABLED: true,
  }
};

// Helper function to get API key with fallbacks
export const getOpenAIKey = (): string => {
  // Try environment variables first, then fallback to config
  const envKey = process.env.OPENAI_API_KEY || process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  const configKey = API_CONFIG.OPENAI_API_KEY;
  
  const key = envKey || configKey;
  
  // Validate the key
  if (!key || key.trim() === '' || key.length < 10) {
    console.error('❌ getOpenAIKey: Invalid or missing API key');
    console.error('ENV OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'exists' : 'not set');
    console.error('ENV EXPO_PUBLIC_OPENAI_API_KEY:', process.env.EXPO_PUBLIC_OPENAI_API_KEY ? 'exists' : 'not set');
    console.error('CONFIG OPENAI_API_KEY:', configKey ? 'exists (' + configKey.length + ' chars)' : 'not set');
    return '';
  }
  
  // Only log on first load or in debug mode
  if (!global.__OPENAI_KEY_LOADED__) {
    console.log('✅ getOpenAIKey: API key loaded successfully');
    console.log('API Key source:', envKey ? 'environment variable' : 'config file');
    console.log('API Key preview:', key.substring(0, 10) + '...');
    global.__OPENAI_KEY_LOADED__ = true;
  }
  
  return key;
};

// Helper function to check if AI is configured
export const isAIConfigured = (): boolean => {
  const key = getOpenAIKey();
  return !!key && key.length > 10;
};

