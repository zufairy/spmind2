// Voice Service for ElevenLabs integration
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

interface RecordingResponse {
  success: boolean;
  audioUri?: string;
  transcription?: string;
  error?: string;
}

class VoiceService {
  private elevenLabsApiKey: string | null = null;
  private openAIApiKey: string | null = null;
  private voiceId: string = 'EXAVITQu4vr4xnSDxMaL'; // Default voice ID - Bella
  private malayVoiceId: string = 'pNInz6obpgDQGcFmaJgB'; // Adam - good for Malay
  private currentLanguage: 'en' | 'ms' = 'en';
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  constructor() {
    // In production, this would come from environment variables
    this.elevenLabsApiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || null;
    this.openAIApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || null;
  }

  setLanguage(language: 'en' | 'ms') {
    this.currentLanguage = language;
  }

  getCurrentVoiceId(): string {
    return this.currentLanguage === 'ms' ? this.malayVoiceId : this.voiceId;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Audio permission not granted');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<RecordingResponse> {
    if (!this.recording) {
      return {
        success: false,
        error: 'No active recording',
      };
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      if (!uri) {
        return {
          success: false,
          error: 'Failed to get recording URI',
        };
      }

      // Transcribe the audio
      const transcription = await this.transcribeAudio(uri);

      return {
        success: true,
        audioUri: uri,
        transcription: transcription || '',
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async transcribeAudio(audioUri: string): Promise<string | null> {
    if (!this.openAIApiKey) {
      console.error('OpenAI API key not configured for transcription');
      return null;
    }

    try {
      // Create form data
      const formData = new FormData();
      
      // Read the audio file
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      };
      
      formData.append('file', audioFile as any);
      formData.append('model', 'whisper-1');
      formData.append('language', this.currentLanguage === 'ms' ? 'ms' : 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openAIApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.text || null;
    } catch (error) {
      console.error('Transcription error:', error);
      return null;
    }
  }

  async playAudio(audioUrl: string): Promise<boolean> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      this.sound = sound;

      await this.sound.playAsync();
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }

  async stopAudio(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async generateSpeech(
    text: string,
    voiceId?: string,
    settings?: VoiceSettings
  ): Promise<TTSResponse> {
    if (!this.elevenLabsApiKey) {
      return {
        success: false,
        error: 'ElevenLabs API key not configured',
      };
    }

    const defaultSettings: VoiceSettings = {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true,
    };

    // Use appropriate voice based on language
    const selectedVoiceId = voiceId || this.getCurrentVoiceId();

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2', // Use multilingual model for Malay support
            voice_settings: settings || defaultSettings,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const audioBlob = await response.blob();
      
      // Validate audio blob before creating URL
      if (!audioBlob || audioBlob.size === 0) {
        console.error('❌ VoiceService: Invalid audio blob received');
        throw new Error('Invalid audio blob received');
      }
      
      console.log('🔍 VoiceService: Creating object URL for audio blob');
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        success: true,
        audioUrl,
      };
    } catch (error) {
      console.error('Voice Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getVoices(): Promise<any[]> {
    if (!this.elevenLabsApiKey) {
      return [];
    }

    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.elevenLabsApiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }

  // Helper method to detect language from text
  detectLanguage(text: string): 'en' | 'ms' {
    // Simple Malay word detection
    const malayWords = [
      'saya', 'awak', 'anda', 'mereka', 'kami', 'kita', 'ini', 'itu', 'ada', 'tidak',
      'ya', 'tidak', 'baik', 'buruk', 'besar', 'kecil', 'baru', 'lama', 'cepat', 'lambat',
      'belajar', 'mengajar', 'kerja', 'rumah', 'sekolah', 'universiti', 'guru', 'pelajar',
      'buku', 'pen', 'meja', 'kerusi', 'makan', 'minum', 'tidur', 'bangun', 'jalan', 'lari'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const malayWordCount = words.filter(word => malayWords.includes(word)).length;
    
    // If more than 30% of words are Malay, consider it Malay
    return malayWordCount / words.length > 0.3 ? 'ms' : 'en';
  }
}

export const voiceService = new VoiceService();