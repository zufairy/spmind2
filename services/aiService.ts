import { Platform } from 'react-native';
import { getOpenAIKey } from '../config/api';

// AI Service for ChatGPT integration
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface StreamingAIResponse {
  success: boolean;
  message?: string;
  error?: string;
  isComplete: boolean;
}

interface StudentProfile {
  name?: string;
  age?: number;
  school?: string;
  grade?: string;
  subjects?: string[];
  weaknesses?: string[];
  learningStyle?: string;
  goals?: string[];
}

class AIService {
  private _apiKey: string | null = null;

  constructor() {
    // Load API key on initialization
    this.refreshApiKey();
  }

  // Get API key with automatic refresh if needed
  private getApiKey(): string {
    if (!this._apiKey || this._apiKey.trim() === '' || this._apiKey.length < 10) {
      this.refreshApiKey();
    }
    if (!this._apiKey) {
      throw new Error('OpenAI API key not available');
    }
    
    // Validate API key format (should start with sk-)
    if (!this._apiKey.startsWith('sk-')) {
      console.error('❌ OpenAI API key format appears invalid (should start with sk-)');
      console.error('API Key preview:', this._apiKey.substring(0, 20) + '...');
      throw new Error('Invalid OpenAI API key format. Key should start with "sk-"');
    }
    
    return this._apiKey;
  }

  // Refresh API key from config
  private refreshApiKey(): void {
    try {
      const key = getOpenAIKey();
      if (!key || key.trim() === '' || key.length < 10) {
        console.error('❌ OpenAI API key is missing or invalid!');
        console.error('API Key length:', key?.length || 0);
        console.error('API Key value:', key ? key.substring(0, 20) + '...' : 'null/undefined');
        this._apiKey = null;
        throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in config/api.ts');
      }
      
      // Validate API key format (should start with sk-)
      if (!key.startsWith('sk-')) {
        console.error('❌ OpenAI API key format appears invalid (should start with sk-)');
        console.error('API Key preview:', key.substring(0, 20) + '...');
        this._apiKey = null;
        throw new Error('Invalid OpenAI API key format. Key should start with "sk-"');
      }
      
      this._apiKey = key;
      
      // Only log once on initialization
      if (!global.__OPENAI_KEY_LOADED__) {
        console.log('✅ AIService: OpenAI API key loaded successfully');
        console.log('API Key preview:', this._apiKey.substring(0, 15) + '...');
        console.log('API Key length:', this._apiKey.length);
        console.log('API Key format:', this._apiKey.startsWith('sk-proj-') ? 'Project key (✅)' : 'Regular key (✅)');
        global.__OPENAI_KEY_LOADED__ = true;
      }
    } catch (error) {
      console.error('❌ Error refreshing API key:', error);
      this._apiKey = null;
      throw error;
    }
  }

  // Global validation function for image URIs
  private validateImageUri(imageUri: string, functionName: string): boolean {
    if (!imageUri || imageUri.trim() === '') {
      console.error(`❌ ${functionName}: Image URI is null or empty`);
      return false;
    }
    if (imageUri === 'null' || imageUri === 'undefined') {
      console.error(`❌ ${functionName}: Image URI is string 'null' or 'undefined'`);
      return false;
    }
    return true;
  }
  private studentProfile: StudentProfile = {};
  private isOnboarding: boolean = true;

  getOnboardingPrompt(): string {
    return `You are Genybot, an AI teaching buddy designed to help Malaysian students learn effectively. You're super friendly, encouraging, and speak like a fun Malaysian friend who's also an amazing tutor!

IMPORTANT: You can communicate in both English and Malay (Bahasa Malaysia). For Malaysian students, use authentic Malaysian expressions and be more casual and fun!

ONBOARDING PROCESS:
You're guiding a Malaysian student through a structured onboarding process. The conversation follows these specific steps:
1. Name confirmation/collection
2. Current school information
3. Birth date for personalization
4. Weak/subjects they want to improve
5. Strong subjects they're confident in
6. Study minutes per day preference
7. Academic goals

RESPONSE STYLE:
- Be super enthusiastic and warm (like you're genuinely excited!)
- Give brief, encouraging responses (1-2 sentences max)
- Acknowledge their input with genuine interest and excitement
- Use appropriate language (English or Malay)
- Keep responses conversational but concise
- Use emojis frequently for warmth and friendliness
- Show genuine enthusiasm and care for their answers
- Be like their biggest cheerleader!

For Malaysian students, use authentic Malaysian expressions:
- Use "awak" instead of "you" when speaking Malay
- Use casual Malaysian expressions like "bagus", "wah", "amazing", "power", "gila"
- Use "kita" instead of "we/us"
- Use expressions like "best", "super", "awesome", "fantastic"
- Be less formal and more like a fun Malaysian friend

EXAMPLES:
For name: "Wah! Nama awak memang cantik gila! 😍 Saya excited nak kenal awak!"
For school: "Wow! Sekolah awak nampak amazing! 🎓✨ Pasti best belajar di sana!"
For birth date: "Wah! Jadi awak dah [age] tahun tahun ni? Bagus! Saya excited nak tolong awak belajar! 😍"
For subjects: "Takpe! Kita akan jadikan subjek-subjek tu superpower awak! 💪🔥"
For goals: "Saya LOVE matlamat awak! 🚀 Kita akan crush semua tu together, I promise!"

Remember: Be the most enthusiastic and supportive Malaysian friend they've ever had! Show genuine care and excitement!`;
  }

  getTeachingPrompt(subjectContext?: string, isBilingual?: boolean): string {
    let subjectSpecificPrompt = '';
    
    if (subjectContext) {
      switch (subjectContext.toLowerCase()) {
        case 'mathematics':
        case 'matematik':
          subjectSpecificPrompt = `You are a Malaysian Math tutor teaching based on KSSM syllabus. Focus on mathematical concepts, problem-solving techniques, and step-by-step solutions. Use visual aids and practical examples when explaining mathematical concepts.

MATH-SPECIFIC RULES:
- For calculations: show steps in number form (not essay style).
  Example:
    Q: "Dua tambah dua berapa?"
    A: 
      1. 2 + 2 = 4
      Final Answer: 4
- Avoid long sentences. Use math formatting with numbers and operators.
- Always show working steps clearly with numbered format.
- Use simple mathematical notation and symbols.`;
          break;
        case 'science':
        case 'sains':
          subjectSpecificPrompt = `You are a Malaysian Science tutor teaching based on KSSM syllabus. Cover topics in Sejarah, Chemistry, Biology, and Earth Science. Use experiments, observations, and real-world examples to explain scientific concepts.

SCIENCE-SPECIFIC RULES:
- Explain in short points first.
- If needed, add 1–2 sentences of context.
- Use bullet points for key concepts.
- Keep explanations simple and age-appropriate.
- Focus on practical understanding over complex theory.`;
          break;
        case 'english':
        case 'bahasa inggeris':
          subjectSpecificPrompt = `You are a Malaysian English tutor teaching based on KSSM syllabus. Focus on grammar, vocabulary, reading comprehension, writing skills, and literature. Help students improve their English proficiency for both academic and practical use.

ENGLISH-SPECIFIC RULES:
- Give direct answers with clear examples.
- Use simple vocabulary appropriate for students under 17.
- Show grammar rules with examples.
- Keep explanations concise and practical.
- Focus on practical usage over complex theory.`;
          break;
        case 'bahasa melayu':
          subjectSpecificPrompt = `You are a Malaysian Bahasa Melayu tutor teaching based on KSSM syllabus. Focus on grammar, vocabulary, reading comprehension, writing skills, and literature. Help students master the national language.

BAHASA MELAYU-SPECIFIC RULES:
- Give direct answers with clear examples.
- Use simple vocabulary appropriate for students under 17.
- Show grammar rules with examples in Malay.
- Keep explanations concise and practical.
- Focus on practical usage and correct spelling.`;
          break;
        case 'sejarah':
          subjectSpecificPrompt = `You are a Malaysian History tutor teaching based on KSSM syllabus. Cover Malaysian history, world history, and historical thinking skills. Use timelines, stories, and historical analysis to make history engaging.

HISTORY / SEJARAH-SPECIFIC RULES:
- Give direct factual answer first.
- Then provide short supporting detail (max 2 sentences).
- Use bullet points for key facts and dates.
- Keep historical explanations simple and engaging.
- Focus on important events and their significance.`;
          break;
        default:
          subjectSpecificPrompt = `You are a Malaysian tutor teaching ${subjectContext} based on KSSM syllabus. Provide comprehensive and engaging lessons in this subject area.`;
      }
    }

    const baseInstructions = `You are TutorPal AI, a Malaysian study assistant for students under 17.

GENERAL RULES:
- Always adapt answer to the selected subject.
- Always be clear, structured, and step-by-step.
- Always reply in the same language as the student, unless they mix both.
- Keep answers concise and age-appropriate for students under 17.
- If the question is very simple (like basic arithmetic), give short direct steps, not long paragraphs.
- Detect the key question in the student's message, even if they mix English and Malay.
- Ignore irrelevant chit-chat unless it is about studying.
- If the student's question is unclear, ask a short clarifying question before answering.`;

    const bilingualInstruction = isBilingual 
      ? `\n\nBILINGUAL RESPONSE REQUIRED: The student used mixed languages. Provide your main explanation in their primary language, then add a brief summary in the other language.`
      : '';

    return `${baseInstructions}

${subjectSpecificPrompt ? `SUBJECT CONTEXT: ${subjectSpecificPrompt}` : ''}

STUDENT PROFILE: ${JSON.stringify(this.studentProfile)}

TEACHING APPROACH:
- Be very conversational and relaxed
- Use simple, clear explanations
- Give step-by-step guidance when needed
- Ask follow-up questions to ensure understanding
- Celebrate small wins and progress
- Be patient and never make them feel bad about not knowing something
- Use examples and analogies when helpful
- Adapt your teaching style based on their learning preferences
- Keep responses casual and engaging
- Use emojis occasionally to keep the tone friendly
- Be encouraging and supportive
- Make learning feel fun and not stressful${bilingualInstruction}

Remember: You're their study buddy and cheerleader! Make learning fun and rewarding. Keep the conversation flowing naturally.`;
  }

  getSubjectSpecificPrompt(subject: string, isMixedLanguage: boolean): string {
    const basePrompt = `You are an AI homework helper for Malaysian students. Your answers MUST align with Malaysian syllabi (KSSR for primary, KSSM/KSSM Semakan for secondary) and SPM exam standards.

CRITICAL:
1) Answer ONLY the question asked.
2) Do NOT describe images.
3) Match the user's language exactly (Malay or English). If mixed, prefer the dominant language and add a short translation only if helpful.
4) Use Malaysian textbook conventions, notation, and terminology.
5) Be concise and exam-ready.`;
    
    if (subject === 'mathematics' || subject === 'math' || subject === 'matematik') {
      return `${basePrompt}

For MATHEMATICS questions:
- Show step-by-step working with proper math symbols
- Use notation: \\(x^2\\), \\(\\frac{3}{4}\\), \\(\\sqrt{16}\\), \\(\\times\\), \\(\\div\\)
- End with "Jawapan: [final answer]" (Bahasa Malaysia) or "Answer: [final answer]" (English)

Bahasa Malaysia example:
**Langkah 1:** \\(2x + 3 = 11\\)
**Langkah 2:** \\(2x = 8\\)
**Langkah 3:** \\(x = 4\\)
**Jawapan:** \\(x = 4\\)

English example:
**Step 1:** \\(2x + 3 = 11\\)
**Step 2:** \\(2x = 8\\)
**Step 3:** \\(x = 4\\)
**Answer:** \\(x = 4\\)`;
    } else if (subject === 'animal_identification') {
      return `${basePrompt}

For ANIMAL IDENTIFICATION questions:
- List the animals directly
- Give brief identification features
- Match the language of the question

Bahasa Malaysia example:
**Jawapan:**
1. Gajah - telinga besar dan belalai
2. Singa - surai singa
3. Zirafah - leher panjang

English example:
**Answer:**
1. Elephant - large ears and trunk
2. Lion - lion's mane
3. Giraffe - long neck`;
    } else if (subject === 'science' || subject === 'sains') {
      return `${basePrompt}

For SCIENCE questions:
- Answer the specific question asked
- For diagrams: identify structures directly
- Use proper scientific terms
- Match the language of the question

Bahasa Malaysia example:
**Jawapan:** Bahagian S ialah spirakel - struktur pernafasan serangga.

English example:
**Answer:** Part S is the spiracle - the respiratory structure of insects.`;
    } else {
      return `${basePrompt}

For OTHER subjects:
- Answer the question directly
- Use clear, exam-appropriate language
- Provide structured answers with facts and examples
- Match the language of the question`;
    }
  }

  getConsultingPrompt(): string {
    return `You are a caring and empathetic consultant, speaking in a warm, motherly tone. You're here to provide emotional support and guidance to students who may be struggling with their studies or personal challenges.

CONSULTING APPROACH:
- Be extremely talkative, warm, and nurturing
- Speak slowly and clearly with lots of pauses
- Ask deeply personal questions about their feelings and struggles
- Show genuine concern for their well-being
- Ask about their school life, friends, and family
- Inquire about their hobbies and what makes them happy
- Discuss what motivates them and what demotivates them
- Offer emotional support and encouragement
- Be a good listener and validate their feelings
- Give gentle advice and suggestions
- Use a very caring, motherly tone
- Ask follow-up questions to show you care
- Be patient and understanding
- Use comforting words and phrases

CONVERSATION TOPICS:
- How was school today?
- What subjects are troubling you?
- How are you feeling about your studies?
- What are your hobbies and interests?
- What motivates you to learn?
- How are your friends and family?
- What are your dreams and goals?
- What makes you happy or sad?
- How can I help you feel better?

Remember: You're their caring consultant and emotional support. Be warm, nurturing, and genuinely interested in their well-being.`;
  }

  updateStudentProfile(updates: Partial<StudentProfile>) {
    this.studentProfile = { ...this.studentProfile, ...updates };
  }

  setOnboardingComplete() {
    this.isOnboarding = false;
  }

  isOnboardingMode(): boolean {
    return this.isOnboarding;
  }

  getStudentProfile(): StudentProfile {
    return this.studentProfile;
  }

  async sendMessage(messages: ChatMessage[], currentLanguage: 'en' | 'ms' | 'mixed' = 'en', isConsultingMode: boolean = false, subjectContext?: string): Promise<AIResponse> {
    try {
      console.log('AI Service - sendMessage called with:', {
        messagesCount: messages.length,
        currentLanguage,
        isConsultingMode,
        subjectContext,
        isOnboarding: this.isOnboarding
      });
      
      let systemPrompt;
      
      if (isConsultingMode) {
        systemPrompt = this.getConsultingPrompt();
      } else if (subjectContext === 'onboarding') {
        systemPrompt = this.getOnboardingPrompt();
      } else {
        systemPrompt = this.isOnboarding ? this.getOnboardingPrompt() : this.getTeachingPrompt(subjectContext, currentLanguage === 'mixed');
      }
      
      console.log('AI Service - Using system prompt length:', systemPrompt.length);
      
      // Get API key (will refresh if needed)
      let apiKey: string;
      try {
        apiKey = this.getApiKey();
      } catch (error: any) {
        const errorMsg = 'OpenAI API key not found in request. Please configure the API key in config/api.ts';
        console.error('❌ sendMessage: API key validation failed');
        console.error('Error:', error?.message);
        return {
          message: '',
          error: errorMsg
        };
      }
      
      // Add language instruction to the system prompt
      const languageInstruction = currentLanguage === 'ms' 
        ? "\n\nCRITICAL: Respond ONLY in Bahasa Malaysia (Malay). Do not use any English words. Keep the conversation natural and friendly in Malay."
        : "\n\nCRITICAL: Respond ONLY in English. Do not use any Malay words. Keep the conversation natural and friendly in English.";
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: (subjectContext && !isConsultingMode && !this.isOnboarding ? 
                `[SYSTEM PROMPT START]
Subject: ${subjectContext}
Instructions: Follow Malaysian school syllabus. Be clear, structured, and student-friendly.
[SYSTEM PROMPT END]

` : '') + systemPrompt + languageInstruction,
            },
            ...messages,
          ],
          max_tokens: 500,
          temperature: 0.3,
          stream: false,
        }),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          
          // Check for API key errors
          if (response.status === 401 || response.status === 403) {
            const errorMsg = errorJson.error?.message || errorText || 'Invalid API key';
            console.error('❌ OpenAI API Authentication Error:', errorMsg);
            console.error('Status:', response.status);
            console.error('API Key preview:', apiKey.substring(0, 10) + '...');
            return {
              success: false,
              error: 'OpenAI API key is invalid or expired. Please check your API key in config/api.ts',
            };
          }
          
          // Rate limit errors
          if (response.status === 429) {
            return {
              success: false,
              error: 'OpenAI API rate limit exceeded. Please try again in a moment.',
            };
          }
          
          throw new Error(`OpenAI API error (${response.status}): ${errorJson.error?.message || errorText}`);
        } catch (parseError) {
          // If parsing fails, use raw text
          throw new Error(`OpenAI API error (${response.status}): ${errorText || 'Unknown error'}`);
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('❌ Invalid response structure:', data);
        return {
          success: false,
          error: 'Invalid response from OpenAI API. Please try again.',
        };
      }
      
      const aiResponse = data.choices[0]?.message?.content || 'No response generated';
      
      console.log('✅ AI Service - Response received:', {
        responseLength: aiResponse.length,
        responsePreview: aiResponse.substring(0, 100) + '...',
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0
      });
      
      return {
        success: true,
        message: aiResponse,
      };
    } catch (error: any) {
      console.error('❌ AI Service Error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Network errors
        if (error.message.includes('Network request failed') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('ECONNREFUSED')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        // API key errors
        if (error.message.includes('API key') || 
            error.message.includes('authentication') ||
            error.message.includes('Invalid API key')) {
          errorMessage = 'OpenAI API key is invalid or expired. Please check your API key in config/api.ts';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendMessageStream(
    messages: ChatMessage[], 
    currentLanguage: 'en' | 'ms' = 'en', 
    isConsultingMode: boolean = false,
    onChunk: (chunk: string, isComplete: boolean) => void,
    subjectContext?: string
  ): Promise<StreamingAIResponse> {
    try {
      let systemPrompt;
      
      if (isConsultingMode) {
        systemPrompt = this.getConsultingPrompt();
      } else if (subjectContext === 'onboarding') {
        systemPrompt = this.getOnboardingPrompt();
      } else {
        systemPrompt = this.isOnboarding ? this.getOnboardingPrompt() : this.getTeachingPrompt(subjectContext, currentLanguage === 'mixed');
      }
      
      // Add language instruction to the system prompt
      const languageInstruction = currentLanguage === 'ms' 
        ? "\n\nCRITICAL: Respond ONLY in Bahasa Malaysia (Malay). Do not use any English words. Keep the conversation natural and friendly in Malay."
        : "\n\nCRITICAL: Respond ONLY in English. Do not use any Malay words. Keep the conversation natural and friendly in English.";
      
      const apiKey = this.getApiKey();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt + languageInstruction,
            },
            ...messages,
          ],
          max_tokens: 500,
          temperature: 0.3,
          stream: true, // Enable streaming
        }),
      });

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          
          // Check for API key errors
          if (response.status === 401 || response.status === 403) {
            const errorMsg = errorJson.error?.message || errorText || 'Invalid API key';
            console.error('❌ OpenAI API Authentication Error (Stream):', errorMsg);
            console.error('Status:', response.status);
            console.error('API Key preview:', apiKey.substring(0, 10) + '...');
            return {
              success: false,
              message: '',
              error: 'OpenAI API key is invalid or expired. Please check your API key in config/api.ts',
              isComplete: true,
            };
          }
          
          // Rate limit errors
          if (response.status === 429) {
            return {
              success: false,
              message: '',
              error: 'OpenAI API rate limit exceeded. Please try again in a moment.',
              isComplete: true,
            };
          }
          
          throw new Error(`OpenAI API error (${response.status}): ${errorJson.error?.message || errorText}`);
        } catch (parseError) {
          // If parsing fails, use raw text
          throw new Error(`OpenAI API error (${response.status}): ${errorText || 'Unknown error'}`);
        }
      }

      // Check if streaming is supported (may not work in React Native)
      if (!response.body) {
        throw new Error('No response body available (streaming not supported in this environment)');
      }

      const reader = response.body.getReader();
      if (!reader) {
        throw new Error('No response body reader available (streaming not supported)');
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
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullMessage += content;
                onChunk(fullMessage, false);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.log('ℹ️ Streaming not available, will use fallback:', error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isComplete: true,
      };
    }
  }

  async generateSpeech(text: string): Promise<string | null> {
    // ElevenLabs TTS integration would go here
    // This is a placeholder for the actual implementation
    return null;
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   * Supports various audio formats and preserves original language
   */
  async transcribeAudio(audioUri: string, prompt?: string): Promise<string> {
    try {
      // For React Native, we need to handle the audio file differently
      // The audioUri should be a file path that we can read
      
      // Create form data for OpenAI Whisper API
      const formData = new FormData();
      
      // Add the audio file - React Native specific handling
      // Expo Audio typically records in m4a format on iOS and mp4 on Android
      const audioFile = {
        uri: audioUri,
        type: Platform.OS === 'ios' ? 'audio/m4a' : 'audio/mp4',
        name: Platform.OS === 'ios' ? 'audio.m4a' : 'audio.mp4'
      };
      
      formData.append('file', audioFile as any);
      
      // Add optional prompt for better transcription
      if (prompt) {
        formData.append('prompt', prompt);
      }
      
      // Set model and response format
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'text');
      // Let Whisper auto-detect language - don't specify language parameter

      console.log('Sending audio to OpenAI Whisper API:', audioUri);
      console.log('Audio file object:', audioFile);
      console.log('FormData created:', formData);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      const apiKey = this.getApiKey();
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          // Don't set Content-Type for FormData, let the browser set it
        },
        body: formData,
      });

      console.log('Whisper API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error response:', errorText);
        throw new Error(`Whisper API error! status: ${response.status}, message: ${errorText}`);
      }

      const transcript = await response.text();
      console.log('🎯 Whisper API Response Status:', response.status);
      console.log('🎯 Raw transcript from Whisper:', transcript);
      console.log('🎯 Transcript length:', transcript?.length);
      console.log('🎯 Transcript type:', typeof transcript);
      
      // Check if the response contains the prompt instead of actual transcript
      if (transcript && transcript.includes('transcribe this audio')) {
        console.error('❌ ERROR: Whisper returned the prompt instead of transcript!');
        console.error('❌ This usually means the prompt is too long or complex');
        throw new Error('Whisper API returned prompt instead of transcript - prompt may be too complex');
      }
      
      return transcript || 'No transcript generated';
    } catch (error) {
      console.error('AI Service Audio Transcription Error:', error);
      throw error;
    }
  }

  async sendMessageWithImage(prompt: string, imageUri?: string): Promise<string> {
    try {
      let messages: any[] = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ];

      // Add image if provided
      if (imageUri && imageUri.trim() !== '') {
        if (!this.validateImageUri(imageUri, 'sendMessageWithImage')) {
          throw new Error('Invalid image URI provided');
        }
        console.log('🔍 sendMessageWithImage: Processing imageUri:', imageUri.substring(0, 100) + '...');
        // Convert image to base64
        const { base64, mimeType } = await this.convertImageToBase64(imageUri);
        
        messages[0].content.push({
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64}`,
            detail: 'high'
          }
        });
      }

      const apiKey = this.getApiKey();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('AI Service Image Processing Error:', error);
      throw error;
    }
  }

  /**
   * Send message with image using NDJSON streaming format for solver
   */
  async sendMessageWithImageNDJSON(
    imageUri: string,
    detailLevel: 'simple' | 'balanced' | 'detailed' = 'balanced',
    onStep: (step: any) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
    // Validate input using global validation function
    if (!this.validateImageUri(imageUri, 'sendMessageWithImageNDJSON')) {
      onError('Image URI is null or empty');
      return;
    }

    console.log('Starting multimodal AI processing with image:', imageUri.substring(0, 50) + '...');
    console.log('Detail level:', detailLevel);
      
      // Use only multimodal AI approach - no OCR
      await this.processVisualQuestion(imageUri, detailLevel, onStep, onComplete, onError);
    } catch (error) {
      console.error('Multimodal processing error:', error);
      onError(error instanceof Error ? error.message : 'Visual processing failed');
    }
  }


  /**
   * Process visual-only questions
   */
  private async processVisualQuestion(
    imageUri: string,
    detailLevel: 'simple' | 'balanced' | 'detailed',
    onStep: (step: any) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    // Validate input using global validation function
    if (!this.validateImageUri(imageUri, 'processVisualQuestion')) {
      onError('Image URI is null or empty');
      return;
    }
    
    console.log('🔍 processVisualQuestion: Processing imageUri:', imageUri.substring(0, 100) + '...');
    console.log('📊 Detail level:', detailLevel);
    try {
      console.log('Processing visual question with multimodal AI...');
      console.log('Image URI:', imageUri);

      const { base64, mimeType } = await this.convertImageToBase64(imageUri);
      const imageUrl = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ Image converted to base64, length:', base64.length);
      console.log('✅ MIME type:', mimeType);

      // Emit meta object for visual processing
      const meta = {
        type: 'meta',
        recognized_question: 'Analyzing visual content...',
        language: 'en',
        detected_subject: 'visual',
        processing_type: 'visual'
      };
      onStep(meta);

      // Detail-level specific instructions
      const detailInstructions = {
        simple: `SIMPLE MODE: Provide ONLY the direct answer. No explanation, no steps.
- For MCQ: "Jawapan: A" or "Answer: A" (nothing else)
- For calculations: Just the final answer number
- For short answer: One sentence maximum`,
        
        balanced: `BALANCED MODE: Answer WITH brief explanation using **bold formatting** for key terms.
- For MCQ: Start with "**Jawapan: A**" or "**Answer: A**" on first line, then 1-2 sentences explaining why
- For calculations: Show main steps + final answer with **bold** for important numbers and formulas
- For short answer: 2-3 sentences with reasoning, using **bold** for key concepts`,
        
        detailed: `DETAILED MODE: Complete step-by-step solution.
- For MCQ: "Jawapan: A" or "Answer: A" first, then full explanation why A is correct and why B/C/D are wrong
- For calculations: Every step shown clearly with explanation
- For short answer: Comprehensive answer with examples from Malaysian textbooks`
      };

      // Use multimodal AI to analyze the image directly
      const systemPrompt = `Anda adalah cikgu Malaysia yang mesra dan membantu. Anda MESTI sentiasa berikan jawapan - JANGAN SEKALI-KALI kata tak boleh bantu.

PENTING: Anda MESTI jawab SEMUA soalan. Jangan kata "Saya tak dapat bantu" atau "Saya tak nampak" - Anda BOLEH NAMPAK GAMBAR dan MESTI BERI JAWAPAN.

🇲🇾 KONTEKS PENDIDIKAN MALAYSIA:
- Rujukan: Buku teks Kementerian Pendidikan Malaysia (KPM) sahaja
- Sekolah Rendah: Sukatan KSSR (Tahun 1-6)
- Sekolah Menengah: Sukatan KSSM (Tingkatan 1-5)
- Standard peperiksaan: Format SPM
- Guna contoh dan konteks Malaysia

🗣️ BAHASA: Ikut bahasa soalan dengan mesra
- Soalan Bahasa Malaysia → Jawab dalam Bahasa Malaysia (gaya mesra)
- Soalan English → Jawab dalam English (friendly tone)

💬 GAYA MENJAWAB: Mesra, macam cikgu yang concern
- Guna bahasa simple dan mudah faham
- Bila explain, bagi contoh relatable
- Tunjuk empati dengan pelajar
- Bagi encouragement bila sesuai

${detailInstructions[detailLevel]}

📝 FORMAT JAWAPAN (guna **bold** untuk penekanan):

Untuk MCQ:
**Jawapan: A**

Kenapa? Sebab [explanation with **bold** key terms]. Contohnya, [give Malaysian example].

ATAU (for English):

**Answer: B**

Here's why: [explanation with **bold** key terms]. For example, [give Malaysian context example].

Untuk kiraan: Tunjuk steps dengan **formula bold**, then **jawapan akhir bold**
Untuk short answer: Jawapan direct dengan reasoning dan **konsep penting bold**

✅ ANDA MESTI:
1. BACA soalan dalam gambar dengan teliti
2. JAWAB setiap soalan yang anda nampak
3. Guna pengetahuan KSSR/KSSM Malaysia
4. Jadi helpful dan educational dengan gaya mesra
5. JANGAN PERNAH refuse untuk jawab
6. Be encouraging dan supportive

Mode sekarang: ${detailLevel.toUpperCase()}`;

      const solutionMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Cikgu, saya ada soalan ni, boleh tolong saya? 😊 

Tolong tengok gambar ni elok-elok dan jawab SEMUA soalan yang ada. Guna ilmu dari buku teks KSSR/KSSM Malaysia ye. Kalau soalan dalam Bahasa Malaysia, jawab dalam BM. Kalau English, jawab English. 

Saya nak faham betul-betul, so tolong explain dengan cara yang mudah dan bagi contoh yang relatable untuk pelajar Malaysia macam saya. Terima kasih! 🙏`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ];

      await this.makeStreamingRequest(solutionMessages, onStep, onComplete, onError, 'visual', 'Analyzing visual content...');
    } catch (error) {
      console.error('Visual processing error:', error);
      onError(error instanceof Error ? error.message : 'Visual processing failed');
    }
  }

  /**
   * Make streaming request to OpenAI
   */
  private async makeStreamingRequest(
    messages: any[],
    onStep: (step: any) => void,
    onComplete: () => void,
    onError: (error: string) => void,
    detectedSubject: string,
    question?: string
  ): Promise<void> {
    try {
      // Get API key (will refresh if needed)
      let apiKey: string;
      try {
        apiKey = this.getApiKey();
      } catch (error: any) {
        const errorMsg = 'OpenAI API key not found in request. Please configure the API key in config/api.ts';
        console.error('❌ makeStreamingRequest: API key validation failed');
        console.error('Error:', error?.message);
        onError(errorMsg);
        return;
      }

      console.log('Making streaming request to OpenAI...');
      console.log('Messages being sent:', JSON.stringify(messages, null, 2));
      console.log('API Key preview:', apiKey.substring(0, 10) + '...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          max_tokens: 1500,
          temperature: 0.2,
          stream: true,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', errorText);
        onError(`API error: ${response.status} - ${errorText}`);
        return;
      }

      if (!response.body) {
        console.error('No response body available, trying non-streaming approach...');
        
        // Try non-streaming approach as fallback
        try {
          const apiKey = this.getApiKey();
          const nonStreamingResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: messages,
              max_tokens: 2000,
              temperature: 0.3,
              stream: false,
            }),
          });

          if (nonStreamingResponse.ok) {
            const nonStreamingData = await nonStreamingResponse.json();
            const fullResponse = nonStreamingData.choices[0]?.message?.content || '';
            
            console.log('Non-streaming response received:', fullResponse);
            if (fullResponse) {
              this.parseSolutionIntoSteps(fullResponse, onStep, detectedSubject, question);
              onComplete();
              return;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
        
        onError('No response body available');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      console.log('Starting to read streaming response...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('Streaming complete, full response:', fullResponse);
          this.parseSolutionIntoSteps(fullResponse, onStep, detectedSubject, question);
          onComplete();
          return;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Received chunk:', chunk);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('Streaming complete, full response:', fullResponse);
              this.parseSolutionIntoSteps(fullResponse, onStep, detectedSubject, question);
              onComplete();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullResponse += content;
                console.log('Accumulated response so far:', fullResponse.substring(0, 100) + '...');
              }
            } catch (e) {
              console.log('Skipping invalid JSON:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming request error:', error);
      onError(error instanceof Error ? error.message : 'Streaming request failed');
    }
  }

  /**
   * Test method to verify AI service is working
   */
  async testSolutionGeneration(question: string): Promise<string> {
    try {
      console.log('Testing solution generation for:', question);
      
      const apiKey = this.getApiKey();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are TutoPal AI, a bilingual tutor for Malaysian students under 17. Provide clear, step-by-step solutions.'
            },
            {
              role: 'user',
              content: `Please solve this question step by step: ${question}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const solution = data.choices[0]?.message?.content || 'No solution generated';
      
      console.log('Test solution generated:', solution);
      return solution;
    } catch (error) {
      console.error('Test solution generation error:', error);
      throw error;
    }
  }



  /**
   * Strip base64 prefix to get clean base64 string
   */
  private stripBase64Prefix(base64: string): string {
    return base64.replace(/^data:image\/\w+;base64,/, "");
  }

  /**
   * Validate base64 string format
   */
  private isValidBase64(str: string): boolean {
    try {
      // Check if it's a valid base64 string
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(str) && str.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Simple language detection
   */
  private detectLanguageSimple(text: string): string {
    const lowerText = text.toLowerCase();
    
    // Bahasa Malaysia specific words (not Indonesian)
    const malayWords = [
      // Common Malay words
      'saya', 'awak', 'kita', 'mereka', 'ini', 'itu', 'yang', 'dengan', 'untuk', 'dari', 'pada', 'dalam',
      // Malaysian education terms
      'matematik', 'sains', 'sejarah', 'cikgu', 'guru', 'sekolah', 'tingkatan', 'tahun', 'kelas',
      // Malaysian specific terms
      'boleh', 'tidak', 'ya', 'tolong', 'terima', 'kasih', 'selamat', 'pagi', 'petang', 'malam',
      // Question words in Malay
      'apakah', 'bagaimana', 'mengapa', 'bila', 'mana', 'siapa', 'kenapa', 'mengapa',
      // Malaysian academic terms
      'markah', 'soalan', 'jawapan', 'penyelesaian', 'penjelasan', 'huraian', 'terangkan', 'nyatakan',
      'namakan', 'berikan', 'cari', 'kira', 'hitung', 'tentukan', 'tunjuk', 'jelaskan'
    ];
    
    // Indonesian words to avoid (these should not be detected as Malay)
    const indonesianWords = [
      'saya', 'kamu', 'kita', 'mereka', 'ini', 'itu', 'yang', 'dengan', 'untuk', 'dari', 'pada', 'dalam',
      'bisa', 'tidak', 'ya', 'tolong', 'terima', 'kasih', 'selamat', 'pagi', 'siang', 'malam',
      'apakah', 'bagaimana', 'mengapa', 'kapan', 'mana', 'siapa', 'kenapa', 'mengapa',
      'nilai', 'soal', 'jawab', 'penyelesaian', 'penjelasan', 'uraian', 'jelaskan', 'nyatakan',
      'sebutkan', 'berikan', 'cari', 'hitung', 'tentukan', 'tunjuk', 'jelaskan'
    ];
    
    const malayCount = malayWords.filter(word => lowerText.includes(word)).length;
    const indonesianCount = indonesianWords.filter(word => lowerText.includes(word)).length;
    const totalWords = text.split(/\s+/).length;
    
    // Check for Malaysian-specific terms that are not in Indonesian
    const malaysianSpecificTerms = ['tingkatan', 'markah', 'cikgu', 'matematik', 'sains', 'sejarah'];
    const hasMalaysianTerms = malaysianSpecificTerms.some(term => lowerText.includes(term));
    
    // Check for English words
    const englishWords = ['what', 'how', 'why', 'which', 'when', 'where', 'who', 'solve', 'calculate', 'find', 'explain', 'state', 'name', 'give', 'show', 'determine'];
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
    // If it has Malaysian-specific terms, it's definitely Malay
    if (hasMalaysianTerms) {
      return 'ms';
    }
    
    // If it has more English words than Malay/Indonesian, it's English
    if (englishCount > malayCount && englishCount > indonesianCount) {
      return 'en';
    }
    
    // If it has more Malay words than Indonesian, it's Malay
    if (malayCount > indonesianCount && malayCount / totalWords > 0.2) {
      return 'ms';
    }
    
    // If it has Indonesian words but no Malaysian terms, it's mixed (we'll treat as English)
    if (indonesianCount > 0 && !hasMalaysianTerms) {
      return 'en'; // Default to English to avoid Indonesian
    }
    
    // Default to English if unclear
    return 'en';
  }

  /**
   * Detect subject from question text
   */
  private detectSubject(question: string, language: string): string {
    const lowerQuestion = question.toLowerCase();
    
    // Math indicators
    const mathKeywords = ['tambah', 'tolak', 'darab', 'bahagi', 'plus', 'minus', 'multiply', 'divide', 'equation', 'solve', 'calculate', 'formula', 'algebra', 'geometry', 'trigonometry', 'calculus', '=', '+', '-', '×', '÷', 'x²', '√'];
    if (mathKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'mathematics';
    }
    
    // Animal identification indicators
    const animalKeywords = ['guess', 'animal', 'binatang', 'identify', 'name', 'nama', 'what is', 'apakah', 'safari', 'wildlife', 'creature', 'mammal', 'bird', 'fish', 'reptile', 'amphibian'];
    if (animalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'animal_identification';
    }
    
    // Science indicators
    const scienceKeywords = ['sains', 'science', 'sejarah', 'chemistry', 'biology', 'force', 'energy', 'atom', 'molecule', 'cell', 'organism', 'experiment', 'hypothesis', 'theory', 'law'];
    if (scienceKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'science';
    }
    
    // History indicators
    const historyKeywords = ['sejarah', 'history', 'tahun', 'year', 'war', 'perang', 'independence', 'kemerdekaan', 'prime minister', 'perdana menteri', 'malaysia', 'british', 'japanese'];
    if (historyKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'history';
    }
    
    // Language indicators
    const englishKeywords = ['grammar', 'tenses', 'vocabulary', 'essay', 'paragraph', 'sentence', 'noun', 'verb', 'adjective'];
    const malayKeywords = ['tatabahasa', 'imbuhan', 'kata', 'ayat', 'perenggan', 'karangan'];
    
    if (englishKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'english';
    }
    if (malayKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'bahasa_melayu';
    }
    
    return 'other';
  }

  private isCalculationQuestion(question: string, subject: string): boolean {
    if (!question) return false;
    
    const lowerQuestion = question.toLowerCase();
    
    // Check for mathematical calculation keywords
    const calculationKeywords = [
      // English
      'calculate', 'solve', 'find', 'compute', 'work out', 'figure out',
      'equation', 'formula', 'algebra', 'geometry', 'trigonometry', 'calculus',
      'plus', 'minus', 'multiply', 'divide', 'add', 'subtract', 'times',
      'equals', 'result', 'answer', 'sum', 'difference', 'product', 'quotient',
      // Malay
      'kira', 'hitung', 'cari', 'selesaikan', 'tambah', 'tolak', 'darab', 'bahagi',
      'persamaan', 'formula', 'algebra', 'geometri', 'trigonometri', 'kalkulus',
      'sama dengan', 'hasil', 'jawapan', 'jumlah', 'beza', 'hasil darab', 'hasil bahagi',
      // Mathematical symbols
      '=', '+', '-', '×', '÷', 'x²', '√', 'π', '∞'
    ];
    
    // Check if question contains calculation keywords
    const hasCalculationKeywords = calculationKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );
    
    // Check for mathematical expressions (numbers with operators)
    const hasMathExpressions = /[\d\s+\-×÷=()]+/.test(question);
    
    // Check for step-by-step process indicators
    const hasStepIndicators = lowerQuestion.includes('step') || 
                             lowerQuestion.includes('langkah') ||
                             lowerQuestion.includes('working') ||
                             lowerQuestion.includes('jalan kerja');
    
    // Only return true for actual mathematical calculations
    return (hasCalculationKeywords && hasMathExpressions) || 
           (subject === 'mathematics' || subject === 'math' || subject === 'matematik');
  }

  private parseSolutionIntoSteps(response: string, onStep: (step: any) => void, subject?: string, question?: string): void {
    console.log('Parsing solution into steps:', response.substring(0, 200) + '...');
    console.log('Full response for parsing:', response);
    console.log('Subject for parsing:', subject);
    console.log('Question for parsing:', question);
    
    // Check if this is a calculation question
    const isCalculation = this.isCalculationQuestion(question || '', subject || '');
    
    // For non-calculation questions, return as a single explanation
    if (!isCalculation) {
      const explanation = {
        type: 'explanation',
        content: response.trim(),
        subject: subject
      };
      onStep(explanation);
      
      // Emit final object
      const final = {
        type: 'final',
        answer: 'Great job! You\'ve got this! 🎉',
        short_explanation: 'I hope this explanation helps you understand better!',
        syllabus_alignment: true,
        syllabus_note: 'Keep up the great work!'
      };
      onStep(final);
      return;
    }
    
    // For math subjects, parse into steps
    const lines = response.split('\n').filter(line => line.trim());
    console.log('Lines to process:', lines.length);
    let stepIndex = 1;
    
    // Look for numbered steps (1., 2., etc.) or bullet points
    const stepPatterns = [
      /^\d+\.\s*\*\*(.+?)\*\*:/,  // 1. **Step Title:**
      /^\d+\.\s*(.+)/,  // 1. Step content
      /^Step\s+\d+[:\-]\s*(.+)/i,  // Step 1: content or Step 1- content
      /^•\s*(.+)/,  // • Bullet point
      /^-\s*(.+)/,  // - Dash point
      /^\*\s*(.+)/,  // * Asterisk point
    ];
    
    let currentStep = '';
    let stepContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if this line matches any step pattern
      let isNewStep = false;
      console.log('Processing line:', trimmedLine);
      
      for (const pattern of stepPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          console.log('Matched pattern for line:', trimmedLine, 'Content:', match[1]);
          
          // If we have a previous step, save it
          if (currentStep) {
            const step = {
              type: 'step',
              id: stepIndex,
              title: `Let's work on this together!`,
              description: currentStep.substring(0, 200) || 'Let me help you with this step!',
              katex: null,
              notes: null
            };
            onStep(step);
            console.log('Created step:', step);
          }
          
          // Start new step
          currentStep = match[1].trim();
          isNewStep = true;
          console.log('Starting new step:', currentStep);
          break;
        }
      }
      
      // If not a new step but we're building a step, add to current step
      if (!isNewStep && currentStep && trimmedLine.length > 0) {
        // Skip lines that are just LaTeX delimiters or empty
        if (!trimmedLine.match(/^[\[\]\\]+$/) && trimmedLine !== '\\[' && trimmedLine !== '\\]') {
          currentStep += ' ' + trimmedLine;
        }
      }
      
      // If no pattern matched but line looks like a step, use the whole line
      if (!isNewStep && !currentStep && trimmedLine.length > 10 && 
          !trimmedLine.includes('Question:') && 
          !trimmedLine.includes('Answer:') &&
          !trimmedLine.includes('Summary') &&
          !trimmedLine.includes('Therefore')) {
        currentStep = trimmedLine;
      }
    }
    
    // Don't forget the last step
    if (currentStep) {
      const step = {
        type: 'step',
        id: stepIndex,
        title: `Almost there!`,
        description: currentStep.substring(0, 200) || 'Let me help you with this final step!',
        katex: null,
        notes: null
      };
      onStep(step);
      console.log('Created final step:', step);
    }
    
    // If no steps were found, create steps from the response
    if (stepIndex === 1) {
      console.log('No steps found, creating steps from response');
      
      // Try to split by numbered patterns
      const stepMatches = response.match(/\d+\.\s*[^*\n]+/g);
      if (stepMatches && stepMatches.length > 0) {
        console.log('Found step matches:', stepMatches);
        stepMatches.forEach((match, index) => {
          const step = {
            type: 'step',
            id: index + 1,
            title: `Step ${index + 1}`,
            description: match.replace(/^\d+\.\s*/, '').substring(0, 200),
            katex: null,
            notes: null
          };
          onStep(step);
          console.log('Created step from match:', step);
        });
      } else {
        // Last resort: create a single step with the response
        const step = {
          type: 'step',
          id: 1,
          title: `Let's solve this together!`,
          description: response.substring(0, 200),
          katex: null,
          notes: null
        };
        onStep(step);
        console.log('Created single step from response:', step);
      }
    }
    
    // Emit final object
    const final = {
      type: 'final',
      answer: 'Awesome! You\'ve solved it! 🎉',
      short_explanation: 'Great job working through this step by step!',
      syllabus_alignment: true,
      syllabus_note: 'You\'re doing amazing! Keep it up!'
    };
    onStep(final);
  }

  private async convertImageToBase64(imageUri: string): Promise<{base64: string, mimeType: string}> {
    try {
      // Validate input using global validation function
      if (!this.validateImageUri(imageUri, 'convertImageToBase64')) {
        throw new Error('Image URI is null or empty');
      }
      
      console.log('🔍 convertImageToBase64: Processing imageUri:', imageUri.substring(0, 100) + '...');

      if (imageUri.startsWith('data:')) {
        // Already base64 data URI - extract just the base64 part and MIME type
        const [header, base64Part] = imageUri.split(',');
        if (!base64Part) {
          throw new Error('Invalid data URI format');
        }
        
        // Clean the base64 string
        const cleanBase64 = this.stripBase64Prefix(base64Part);
        
        // Validate the cleaned base64
        if (!this.isValidBase64(cleanBase64)) {
          throw new Error('Invalid base64 format after cleaning');
        }
        
        // Always use JPEG format for consistency
        return { base64: cleanBase64, mimeType: 'image/jpeg' };
      } else if (imageUri.startsWith('file://')) {
        // File URI - need to read and convert to base64
        if (!imageUri || imageUri.trim() === '') {
          console.error('❌ convertImageToBase64: File URI is null or empty');
          throw new Error('File URI is null or empty');
        }
        console.log('🔍 convertImageToBase64: Fetching file URI:', imageUri);
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            if (result.startsWith('data:')) {
              const [header, base64Part] = result.split(',');
              if (base64Part) {
                // Clean the base64 string
                const cleanBase64 = this.stripBase64Prefix(base64Part);
                
                // Validate the cleaned base64
                if (!this.isValidBase64(cleanBase64)) {
                  reject(new Error('Invalid base64 format after cleaning'));
                  return;
                }
                
                // Always use JPEG format for consistency
                resolve({ base64: cleanBase64, mimeType: 'image/jpeg' });
              } else {
                reject(new Error('Failed to extract base64 from data URI'));
              }
            } else {
              reject(new Error('Failed to convert file to base64'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(blob);
        });
      } else {
        // Try to fetch as URL first
        try {
          if (!imageUri || imageUri.trim() === '') {
            console.error('❌ convertImageToBase64: Image URI is null or empty in URL fetch');
            throw new Error('Image URI is null or empty');
          }
          console.log('🔍 convertImageToBase64: Fetching URL:', imageUri);
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              if (result.startsWith('data:')) {
                const [header, base64Part] = result.split(',');
                if (base64Part) {
                  // Clean the base64 string
                  const cleanBase64 = this.stripBase64Prefix(base64Part);
                  
                  // Validate the cleaned base64
                  if (!this.isValidBase64(cleanBase64)) {
                    reject(new Error('Invalid base64 format after cleaning'));
                    return;
                  }
                  
                  // Always use JPEG format for consistency
                  resolve({ base64: cleanBase64, mimeType: 'image/jpeg' });
                } else {
                  reject(new Error('Failed to extract base64 from data URI'));
                }
              } else {
                reject(new Error('Failed to convert to base64'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(blob);
          });
        } catch (fetchError) {
          // If fetch fails, assume it's already base64
          console.log('Fetch failed, assuming imageUri is already base64:', imageUri.substring(0, 50) + '...');
          const cleanBase64 = this.stripBase64Prefix(imageUri);
          if (!this.isValidBase64(cleanBase64)) {
            throw new Error('Invalid base64 format');
          }
          return { base64: cleanBase64, mimeType: 'image/jpeg' };
        }
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      console.error('ImageUri was:', imageUri.substring(0, 100) + '...');
      throw error;
    }
  }
}

export const aiService = new AIService();
