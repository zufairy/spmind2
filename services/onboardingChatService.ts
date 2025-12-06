import { ChatMessage } from './aiService';
import { getOpenAIKey, isAIConfigured } from '../config/api';

interface OnboardingChatResponse {
  success: boolean;
  message?: string;
  error?: string;
  isComplete?: boolean;
}

class OnboardingChatService {
  private static instance: OnboardingChatService;
  private apiKey: string = '';

  constructor() {
    // Get API key from configuration
    this.apiKey = getOpenAIKey();
    
    if (!isAIConfigured()) {
      console.warn('⚠️ OpenAI API key not found. AI responses will not work.');
    } else {
      console.log('✅ OpenAI API key configured successfully');
    }
  }

  static getInstance(): OnboardingChatService {
    if (!OnboardingChatService.instance) {
      OnboardingChatService.instance = new OnboardingChatService();
    }
    return OnboardingChatService.instance;
  }

  /**
   * Generate instant AI response for onboarding chat
   * Uses optimized parameters for fastest response time
   */
  async generateOnboardingResponse(
    userMessage: string,
    currentStep: number,
    userName?: string,
    language: 'en' | 'ms' = 'en',
    birthDate?: string
  ): Promise<OnboardingChatResponse> {
    try {
      console.log('🤖 OnboardingChatService - Generating response for:', {
        userMessage,
        currentStep,
        userName,
        language,
        hasApiKey: !!this.apiKey,
        apiKeyPreview: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'none'
      });
      
      console.log('🤖 Language setting:', language, 'Type:', typeof language);

      if (!this.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const systemPrompt = this.getOptimizedOnboardingPrompt(currentStep, userName, language, birthDate);
      
      console.log('🤖 System prompt generated:', {
        language,
        promptLength: systemPrompt.length,
        promptPreview: systemPrompt.substring(0, 200) + '...'
      });
      
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fastest model
          messages,
          max_tokens: 150, // Short responses for speed
          temperature: 0.2, // Low temperature for consistency
          stream: false, // Non-streaming for instant complete responses
          presence_penalty: 0,
          frequency_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';

      console.log('🤖 Raw API response:', JSON.stringify(data, null, 2));
      console.log('✅ OnboardingChatService - Response received:', aiResponse);
      console.log('🤖 AI response language check:', {
        originalLanguage: language,
        responseText: aiResponse,
        isMalay: language === 'ms',
        containsEnglish: /[a-zA-Z]/.test(aiResponse),
        containsMalay: /[a-zA-Z]/.test(aiResponse) // This is a simple check
      });

      return {
        success: true,
        message: aiResponse,
        isComplete: true,
      };
    } catch (error) {
      console.error('❌ Onboarding Chat Service Error:', error);
      
      // Provide fallback response based on step
      const fallbackResponse = this.getFallbackResponse(currentStep, language, userMessage);
      
      return {
        success: true, // Return success with fallback message
        message: fallbackResponse,
        isComplete: true,
      };
    }
  }

  /**
   * Generate instant streaming response for onboarding chat
   * Provides immediate feedback with streaming updates
   */
  async generateStreamingResponse(
    userMessage: string,
    currentStep: number,
    userName?: string,
    language: 'en' | 'ms' = 'en',
    onChunk: (chunk: string, isComplete: boolean) => void
  ): Promise<OnboardingChatResponse> {
    try {
      const systemPrompt = this.getOptimizedOnboardingPrompt(currentStep, userName, language);
      
      const messages: ChatMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fastest model
          messages,
          max_tokens: 150, // Short responses for speed
          temperature: 0.2, // Low temperature for consistency
          stream: true, // Enable streaming for immediate feedback
          presence_penalty: 0,
          frequency_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      const reader = response.body.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullMessage = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onChunk(fullMessage, true);
          return {
            success: true,
            message: fullMessage,
            isComplete: true,
          };
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onChunk(fullMessage, true);
              return {
                success: true,
                message: fullMessage,
                isComplete: true,
              };
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullMessage += content;
                onChunk(fullMessage, false);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Onboarding Chat Streaming Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private getOptimizedOnboardingPrompt(currentStep: number, userName?: string, language: 'en' | 'ms' = 'en', birthDate?: string): string {
    const basePrompt = language === 'ms'
      ? `Awak adalah Genybot, kawan AI yang sangat mesra dan gembira untuk pelajar Malaysia! Bercakap macam kawan baik yang muda dan fun. Guna "awak", "kita", "bagus", "wow", "amazing". Jangan formal sangat, cakap macam kawan yang excited nak tolong awak belajar!`
      : `You are Genybot, a super friendly and enthusiastic AI assistant for Malaysian students. Speak like a fun, young friend who's excited to help. Use casual, warm language and be very encouraging.`;

    const nameGreeting = userName ? (language === 'ms' ? ` Nama pengguna: ${userName}.` : ` User's name: ${userName}.`) : '';
    
    // Calculate age if birthDate is provided
    const ageInfo = birthDate ? (() => {
      const age = this.calculateAge(birthDate);
      return language === 'ms' 
        ? ` Tarikh lahir pengguna: ${birthDate}. Umur pengguna: ${age} tahun.` 
        : ` User's birth date: ${birthDate}. User's age: ${age} years old.`;
    })() : '';

    const stepContext = this.getStepContext(currentStep, language);

    const voiceContext = language === 'ms' 
      ? 'Pengguna sedang menjawab soalan melalui suara. Berikan respons yang pendek dan mesra. PENTING: Berikan statement sahaja, jangan tanya soalan. Hanya acknowledge jawapan mereka dengan statement positif. Contoh: "Bagus!", "Terima kasih!", "Perfect!", "Amazing!". JANGAN tanya soalan tambahan.'
      : 'The user is responding to your question through voice. Give a short and friendly reply. IMPORTANT: Give statements only, do not ask questions. Just acknowledge their answer with positive statements. Examples: "Great!", "Thank you!", "Perfect!", "Amazing!". DO NOT ask additional questions.';

    return `${basePrompt}${nameGreeting}${ageInfo} ${stepContext} ${voiceContext} 

CRITICAL LANGUAGE REQUIREMENT:
${language === 'ms' 
  ? 'PENTING: Anda MESTI menjawab dalam Bahasa Malaysia sahaja. Jangan guna bahasa Inggeris langsung. Guna perkataan Melayu seperti "awak", "saya", "kita", "bagus", "terima kasih". Jawab pendek dan mesra dalam Bahasa Malaysia.' 
  : 'IMPORTANT: You MUST respond in English only. Do not use any other language. Use English words like "you", "I", "we", "great", "thank you". Keep it short and friendly in English.'}`;
  }

  private getStepContext(currentStep: number, language: 'en' | 'ms'): string {
    const contexts = language === 'ms' ? {
      0: 'Ini adalah langkah pengenalan. Berikan salam mesra dan tanya nama.',
      1: 'Ini adalah langkah nama. Berikan satu ayat statement acknowledgment yang bermakna tentang nama mereka. Contoh: "Nama yang cantik!" atau "Senang jumpa dengan awak!". Jangan tanya soalan.',
      2: 'Ini adalah langkah sekolah. Berikan satu ayat statement acknowledgment tentang sekolah mereka. Contoh: "Sekolah yang bagus!" atau "Bagus sekolah tu!". Jangan tanya soalan.',
      3: 'Ini adalah langkah tarikh lahir. KIRA umur dari tarikh lahir yang diberikan dan berikan satu ayat statement acknowledgment dengan menyebut umur mereka. Contoh: "Bagus, jadi awak dah 13 tahun ni kan. Nice!" atau "Perfect, so you\'re 15 years old. Great!". Jangan tanya soalan.',
      4: 'Ini adalah langkah subjek lemah. Berikan satu ayat statement encouragement tentang subjek yang mereka ingin perbaiki. Contoh: "Bagus awak tahu subjek mana nak fokus!" atau "Saya akan tolong awak dengan subjek tu!". Jangan tanya soalan.',
      5: 'Ini adalah langkah masa belajar. Berikan satu ayat statement acknowledgment tentang masa belajar mereka. Contoh: "Masa belajar yang sesuai!" atau "Bagus awak ada jadual belajar!". Jangan tanya soalan.',
    } : {
      0: 'This is the introduction step. Give a friendly greeting and ask for their name.',
      1: 'This is the name step. Give a meaningful one-sentence acknowledgment about their name. Example: "That\'s a beautiful name!" or "Nice to meet you!". Do not ask questions.',
      2: 'This is the school step. Give a meaningful one-sentence acknowledgment about their school. Example: "That\'s a great school!" or "Sounds like a good place to learn!". Do not ask questions.',
      3: 'This is the birth date step. CALCULATE the age from the provided birth date and give a meaningful one-sentence acknowledgment mentioning their age. Example: "Perfect, so you\'re 15 years old. Great!" or "Nice, so you\'re 13 years old now. Awesome!". Do not ask questions.',
      4: 'This is the weak subjects step. Give a meaningful one-sentence encouragement about the subjects they want to improve. Example: "Great that you know which subjects to focus on!" or "I\'ll help you with those subjects!". Do not ask questions.',
      5: 'This is the study time step. Give a meaningful one-sentence acknowledgment about their study time. Example: "That\'s a good study schedule!" or "Great that you have a learning routine!". Do not ask questions.',
    };

    return contexts[currentStep] || (language === 'ms' ? 'Ini adalah langkah onboarding.' : 'This is an onboarding step.');
  }

  private getFallbackResponse(currentStep: number, language: 'en' | 'ms' = 'en', userMessage?: string, birthDate?: string): string {
    // Try to extract name from user message for step 1
    if (currentStep === 1 && userMessage) {
      const extractedName = this.extractNameFromMessage(userMessage);
      if (extractedName) {
        return language === 'ms' 
          ? `Oh, jadi nama penuh awak ${extractedName} ya? Mari kita teruskan! 😊`
          : `Oh, so your full name is ${extractedName} ya? Let's continue! 😊`;
      }
    }

    // Calculate age for step 3 (birth date)
    if (currentStep === 3 && birthDate) {
      const age = this.calculateAge(birthDate);
      return language === 'ms'
        ? `Bagus, jadi awak dah ${age} tahun ni kan. Nice!`
        : `Perfect, so you're ${age} years old. Great!`;
    }
    
    const fallbacks = language === 'ms' ? {
      0: 'Terima kasih! Mari kita teruskan.',
      1: 'Nama yang cantik!',
      2: 'Sekolah yang bagus!',
      3: 'Umur yang sesuai untuk belajar!',
      4: 'Bagus awak tahu subjek mana nak fokus!',
      5: 'Masa belajar yang sesuai!',
    } : {
      0: 'Thank you! Let\'s continue.',
      1: 'That\'s a beautiful name!',
      2: 'That\'s a great school!',
      3: 'Perfect age for learning!',
      4: 'Great that you know which subjects to focus on!',
      5: 'That\'s a good study schedule!',
    };

    return fallbacks[currentStep] || (language === 'ms' ? 'Terima kasih banyak! 😊' : 'Thank you so much! 😊');
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private extractNameFromMessage(text: string): string | null {
    const namePatterns = [
      /nama saya (\w+)/i,
      /saya (\w+)/i,
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /i'm (\w+)/i,
      /call me (\w+)/i,
      /i'm called (\w+)/i,
      /name's (\w+)/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If no pattern matches, try to extract the first word that looks like a name
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      const skipWords = ['nama', 'saya', 'my', 'name', 'is', 'am', 'i', 'call', 'me', 'called'];
      for (const word of words) {
        if (!skipWords.includes(word.toLowerCase()) && word.length > 1) {
          return word;
        }
      }
    }
    
    return null;
  }

  private getAgeResponse(userMessage: string | undefined, language: 'en' | 'ms'): string {
    if (!userMessage) {
      return language === 'ms' ? 'Perfect! Saya faham! 😄' : 'Perfect! Got it! 😄';
    }

    try {
      // Parse the date from user message (should be in YYYY-MM-DD format)
      const birthDate = new Date(userMessage);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust age if birthday hasn't occurred this year
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;

      if (language === 'ms') {
        return `Wah! Jadi awak dah ${actualAge} tahun tahun ni? Bagus! Saya excited nak tolong awak belajar! 😍`;
      } else {
        return `Oh, so you're ${actualAge} this year? Great! I'm so excited to help you learn! 😍`;
      }
    } catch (error) {
      return language === 'ms' ? 'Perfect! Saya faham! 😄' : 'Perfect! Got it! 😄';
    }
  }
}

export const onboardingChatService = OnboardingChatService.getInstance();
