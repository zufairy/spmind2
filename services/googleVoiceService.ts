// ElevenLabs Voice Service for STT and TTS
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { getOpenAIKey } from '../config/api';

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

interface STTResponse {
  success: boolean;
  text?: string;
  error?: string;
}

class ElevenLabsVoiceService {
  private elevenLabsApiKey: string = 'sk_19a3fceffbb586ec705c6bbed16036e557beb570e5897deb';
  private getOpenAIKey(): string {
    return getOpenAIKey();
  }
  private voiceId: string = 'qAJVXEQ6QgjOQ25KuoU8'; // User's preferred female voice ID for English
  private malayVoiceId: string = 'qAJVXEQ6QgjOQ25KuoU8'; // Use same female voice for Malay consistency
  private currentLanguage: 'en' | 'ms' = 'en';
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  setLanguage(language: 'en' | 'ms') {
    this.currentLanguage = language;
    console.log('🎤 Voice service language set to:', language);
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

      // Stop any existing recording first
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Ignore errors when stopping
        }
        this.recording = null;
      }

      // Stop any existing sound
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch (e) {
          // Ignore errors when unloading
        }
        this.sound = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Use optimized recording settings for faster processing
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

  async stopRecording(): Promise<STTResponse> {
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

      // Use OpenAI Whisper for transcription (more reliable in React Native)
      const transcription = await this.transcribeWithWhisper(uri);

      return {
        success: true,
        text: transcription || '',
      };
    } catch (error) {
      console.error('Error stopping recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async transcribeWithWhisper(audioUri: string): Promise<string | null> {
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
      formData.append('response_format', 'text');
      formData.append('temperature', '0.0'); // Faster, more deterministic
      formData.append('prompt', this.currentLanguage === 'ms' ? 'Transkripsi dalam Bahasa Malaysia' : 'Transcription in English');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getOpenAIKey()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription failed: ${response.status} - ${errorText}`);
      }

      const text = await response.text();
      return text.trim() || null;
    } catch (error) {
      console.error('Whisper transcription error:', error);
      return null;
    }
  }

  async playAudio(audioUrl: string): Promise<boolean> {
    try {
      console.log('====================================');
      console.log('🔊 PLAY AUDIO CALLED');
      // Truncate base64 audio URLs to prevent console spam
      const truncatedUrl = audioUrl.length > 100 
        ? `${audioUrl.substring(0, 50)}...[${audioUrl.length} chars]...${audioUrl.substring(audioUrl.length - 20)}`
        : audioUrl;
      console.log('Audio URL:', truncatedUrl);
      console.log('====================================');
      
      // Stop and unload any existing sound
      if (this.sound) {
        try {
          console.log('🔊 Unloading previous sound...');
          await this.sound.stopAsync();
          await this.sound.unloadAsync();
        } catch (e) {
          console.log('⚠️ Error unloading:', e);
        }
        this.sound = null;
      }

      // Configure audio mode for loudspeaker output
      console.log('🔊 Configuring audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: 1,
        interruptionModeAndroid: 1,
      });
      console.log('✅ Audio mode configured for loudspeaker');

      console.log('🔊 Creating sound object from data URI...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true,
        }
      );
      console.log('✅ Sound object created');
      
      this.sound = sound;

      // Play immediately
      await this.sound.playAsync();
      console.log('🔊 playAsync() called');
      
      // Verify it's actually playing
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        console.log('====================================');
        console.log('✅ AUDIO STATUS');
        console.log('Playing:', status.isPlaying);
        console.log('Duration:', status.durationMillis + 'ms');
        console.log('Volume:', status.volume);
        console.log('====================================');
        
        if (!status.isPlaying) {
          console.warn('⚠️ Audio not playing! Attempting to play again...');
          await this.sound.playAsync();
        }
      }
      
      return true;
    } catch (error) {
      console.error('====================================');
      console.error('❌ ERROR PLAYING AUDIO:', error);
      console.error('====================================');
      return false;
    }
  }

  async stopAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      }
      this.sound = null;
    }
  }

  async generateSpeech(
    text: string,
    voiceId?: string,
    settings?: VoiceSettings
  ): Promise<TTSResponse> {
    const defaultSettings: VoiceSettings = {
      stability: 0.1, // Even lower for maximum speed
      similarity_boost: 0.3, // Lower for speed
      style: 0,
      use_speaker_boost: false, // Disable for speed
    };

    // Use appropriate voice based on language
    const selectedVoiceId = voiceId || this.getCurrentVoiceId();

    try {
      console.log('🚀 Generating speech with turbo model...');
      const startTime = Date.now();
      
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
            model_id: 'eleven_multilingual_v2', // Use multilingual model for better Malay support
            voice_settings: settings || defaultSettings,
          }),
        }
      );
      
      const fetchTime = Date.now() - startTime;
      console.log(`⚡ API response received in ${fetchTime}ms`);
      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API error: ${response.status} - ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Convert to ArrayBuffer and create data URI (no file I/O)
      console.log('🔄 Converting response to ArrayBuffer...');
      const audioBuffer = await response.arrayBuffer();
      console.log(`✅ Got ArrayBuffer: ${audioBuffer.byteLength} bytes`);
      
      const conversionStart = Date.now();
      
      // Convert ArrayBuffer directly to base64 data URI for instant playback
      console.log('🔄 Converting to base64...');
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      console.log(`✅ Base64 length: ${base64Audio.length} characters`);
      
      const dataUri = `data:audio/mpeg;base64,${base64Audio}`;
      console.log('✅ Data URI created');
      
      const totalTime = Date.now() - startTime;
      const conversionTime = Date.now() - conversionStart;
      console.log(`⚡ Total time: ${totalTime}ms (conversion: ${conversionTime}ms)`);

      return {
        success: true,
        audioUrl: dataUri,
      };
    } catch (error) {
      console.error('Voice Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Helper function to convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper method to detect language from text
  detectLanguage(text: string): 'en' | 'ms' {
    // Comprehensive Malay word detection
    const malayWords = [
      // Common pronouns and articles
      'saya', 'awak', 'anda', 'mereka', 'kami', 'kita', 'ini', 'itu', 'ada', 'tidak',
      'ya', 'baik', 'buruk', 'besar', 'kecil', 'baru', 'lama', 'cepat', 'lambat',
      
      // Education related
      'belajar', 'mengajar', 'kerja', 'rumah', 'sekolah', 'universiti', 'guru', 'pelajar',
      'buku', 'pen', 'meja', 'kerusi', 'makan', 'minum', 'tidur', 'bangun', 'jalan', 'lari',
      
      // Question words
      'apa', 'siapa', 'mana', 'bila', 'kenapa', 'bagaimana', 'berapa', 'yang', 'untuk', 'dengan',
      'oleh', 'kepada', 'dari', 'ke', 'di', 'pada', 'dalam', 'luar', 'atas', 'bawah',
      
      // Common verbs
      'pergi', 'datang', 'buat', 'kerja', 'makan', 'minum', 'tidur', 'bangun', 'jalan', 'lari',
      'duduk', 'berdiri', 'baca', 'tulis', 'kira', 'faham', 'tahu', 'ingat', 'lupa',
      
      // Common adjectives
      'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah', 'panjang', 'pendek', 'gemuk', 'kurus',
      'cantik', 'hodoh', 'pandai', 'bodoh', 'kaya', 'miskin', 'senang', 'susah',
      
      // Common nouns
      'orang', 'lelaki', 'perempuan', 'kanak-kanak', 'budak', 'ibu', 'bapa', 'adik', 'abang',
      'kawan', 'rakan', 'guru', 'doktor', 'polis', 'pemandu', 'penjual', 'pembeli',
      
      // Time and numbers
      'hari', 'minggu', 'bulan', 'tahun', 'pagi', 'petang', 'malam', 'semalam', 'hari ini', 'esok',
      'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'lapan', 'sembilan', 'sepuluh',
      
      // Common phrases
      'terima kasih', 'sama-sama', 'selamat pagi', 'selamat petang', 'selamat malam',
      'apa khabar', 'baik', 'tidak apa-apa', 'boleh', 'tidak boleh', 'mahu', 'tidak mahu'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const malayWordCount = words.filter(word => malayWords.includes(word)).length;
    
    // If more than 15% of words are Malay, consider it Malay (lowered threshold for better detection)
    return malayWordCount / words.length > 0.15 ? 'ms' : 'en';
  }
}

export const elevenLabsVoiceService = new ElevenLabsVoiceService();
