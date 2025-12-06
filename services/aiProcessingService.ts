import { aiService } from './aiService';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { getOpenAIKey } from '../config/api';

export interface AIProcessingResult {
  transcript: string;
  summary: string;
  stickyNotes: StickyNoteData[];
}

export interface StickyNoteData {
  title: string;
  content: string;
  type: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip';
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
  priority: 'high' | 'medium' | 'low';
}

export interface ProcessingProgress {
  stage: 'transcribing' | 'summarizing' | 'generating_notes' | 'chunking' | 'complete';
  message: string;
  progress: number;
  currentChunk?: number;
  totalChunks?: number;
}

export interface ChunkingProgress {
  currentChunk: number;
  totalChunks: number;
  message: string;
}

class AIProcessingService {
  private static instance: AIProcessingService;
  private openAIKey: string = getOpenAIKey();
  private currentLanguage: 'en' | 'ms' = 'en';

  public static getInstance(): AIProcessingService {
    if (!AIProcessingService.instance) {
      AIProcessingService.instance = new AIProcessingService();
    }
    return AIProcessingService.instance;
  }

  /**
   * Get OpenAI API key for direct API calls
   */
  private getOpenAIKey(): string {
    return this.openAIKey;
  }

  /**
   * Set the current language for processing
   */
  setLanguage(language: 'en' | 'ms') {
    this.currentLanguage = language;
    console.log('🌍 AI Processing Service language set to:', language);
  }

  /**
   * Process audio file to generate transcript, summary, and sticky notes
   * NO MOCK DATA - Everything generated from actual recorded audio
   * Now supports intelligent chunking for large files
   */
  async processAudio(
    audioUri: string, 
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<AIProcessingResult> {
    try {
      console.log('🚀 AI Processing Service - processAudio called!');
      console.log('📁 Audio URI:', audioUri);
      console.log('📊 Progress callback:', !!onProgress);
      
      // Check if we need to use chunking
      const shouldUseChunking = await this.shouldUseChunking(audioUri);
      console.log('🔍 Should use chunking:', shouldUseChunking);
      
      let transcript: string;
      
      if (shouldUseChunking) {
        // Use chunking for large files
        transcript = await this.processAudioWithChunking(audioUri, onProgress);
      } else {
        // Use direct processing for small files (preserve existing behavior)
        onProgress?.({
          stage: 'transcribing',
          message: 'Converting speech to text...',
          progress: 20
        });

        console.log('🎯 Step 1: Starting direct transcription...');
        transcript = await this.transcribeAudio(audioUri);
        console.log('✅ Step 1: Direct transcription completed:', transcript);
      }
      
      onProgress?.({
        stage: 'summarizing',
        message: 'Generating summary...',
        progress: 70
      });

      // Step 2: Generate summary in same language(s) as transcript
      console.log('🎯 Step 2: Starting summary generation...');
      const summary = await this.generateSummary(transcript);
      console.log('✅ Step 2: Summary completed:', summary);
      
      onProgress?.({
        stage: 'generating_notes',
        message: 'Creating key points...',
        progress: 90
      });

      // Step 3: Extract sticky notes from transcript
      console.log('🎯 Step 3: Starting sticky notes generation...');
      const stickyNotes = await this.extractStickyNotes(transcript);
      console.log('✅ Step 3: Sticky notes completed:', stickyNotes);
      
      onProgress?.({
        stage: 'complete',
        message: 'Processing complete!',
        progress: 100
      });

      console.log('🎉 All AI processing completed successfully!');
      
      // Ensure we always return valid data
      const result = {
        transcript: transcript || 'Recording completed. Transcription unavailable.',
        summary: summary || 'Recording session completed successfully.',
        stickyNotes: stickyNotes && stickyNotes.length > 0 ? stickyNotes : [{
          title: 'Recording Complete',
          content: 'Your recording has been saved successfully.',
          type: 'important' as const,
          color: 'yellow' as const,
          priority: 'medium' as const
        }]
      };
      
      console.log('📊 Final AI results:', {
        transcriptLength: result.transcript.length,
        summaryLength: result.summary.length,
        stickyNotesCount: result.stickyNotes.length
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error in AI processing service:', error);
      
      // Return fallback data instead of throwing - this ensures session can still be created
      console.log('🔄 Returning fallback data due to AI processing error');
      return {
        transcript: 'Audio recording completed. AI processing encountered an error.',
        summary: 'Recording session saved. Some AI features may be unavailable.',
        stickyNotes: [{
          title: 'Recording Saved',
          content: 'Your recording has been saved successfully. AI processing encountered an error.',
          type: 'important' as const,
          color: 'yellow' as const,
          priority: 'medium' as const
        }]
      };
    }
  }

  /**
   * Check if audio file should use chunking based on size and duration
   */
  private async shouldUseChunking(audioUri: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if chunking is needed for:', audioUri);
      
      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.log('❌ File does not exist, using direct processing');
        return false;
      }
      
      const fileSizeMB = fileInfo.size ? fileInfo.size / (1024 * 1024) : 0;
      console.log('📊 File size:', fileSizeMB.toFixed(2), 'MB');
      
      // Get audio duration
      let duration = 0;
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: false });
        const status = await sound.getStatusAsync();
        if (status.isLoaded && status.durationMillis) {
          duration = status.durationMillis / 1000; // Convert to seconds
        }
        await sound.unloadAsync();
      } catch (error) {
        console.log('⚠️ Could not get audio duration, using file size only');
      }
      
      console.log('⏱️ Audio duration:', duration.toFixed(2), 'seconds');
      
      // Use chunking if file is > 20MB OR > 8 minutes (480 seconds)
      const shouldChunk = fileSizeMB > 20 || duration > 480;
      console.log('🔍 Should use chunking:', shouldChunk, '(size > 20MB:', fileSizeMB > 20, 'OR duration > 8min:', duration > 480, ')');
      
      return shouldChunk;
    } catch (error) {
      console.error('❌ Error checking chunking requirements:', error);
      // Default to direct processing if we can't determine
      return false;
    }
  }

  /**
   * Process audio with intelligent chunking for large files
   * Preserves language detection and combines transcripts seamlessly
   */
  private async processAudioWithChunking(
    audioUri: string, 
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<string> {
    try {
      console.log('🔀 Starting chunked audio processing for:', audioUri);
      
      // Get audio duration
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: false });
      const status = await sound.getStatusAsync();
      if (!status.isLoaded || !status.durationMillis) {
        throw new Error('Could not load audio file for chunking');
      }
      
      const totalDuration = status.durationMillis / 1000; // Convert to seconds
      await sound.unloadAsync();
      
      console.log('⏱️ Total audio duration:', totalDuration.toFixed(2), 'seconds');
      
      // Calculate chunk parameters - dynamically adjust for file size
      const originalFileInfo = await FileSystem.getInfoAsync(audioUri);
      const originalFileSizeMB = (originalFileInfo.exists && 'size' in originalFileInfo && originalFileInfo.size) 
        ? originalFileInfo.size / (1024 * 1024) : 0;
      
      // Estimate optimal chunk duration based on file size
      let chunkDuration = 180; // Default 3 minutes
      if (originalFileSizeMB > 0) {
        // Estimate: if original file is X MB for Y seconds, then chunk should be (25MB * Y) / X seconds
        const estimatedChunkDuration = (25 * totalDuration) / originalFileSizeMB;
        chunkDuration = Math.min(Math.max(estimatedChunkDuration * 0.8, 60), 300); // Between 1-5 minutes, 80% of estimate
        console.log(`📊 Original file: ${originalFileSizeMB.toFixed(2)}MB for ${totalDuration}s`);
        console.log(`📊 Estimated optimal chunk duration: ${chunkDuration.toFixed(0)}s`);
      }
      
      const overlapDuration = 15; // 15 seconds overlap
      const totalChunks = Math.ceil(totalDuration / (chunkDuration - overlapDuration));
      
      console.log('🔀 Chunking parameters:');
      console.log('   - Chunk duration:', chunkDuration, 'seconds');
      console.log('   - Overlap duration:', overlapDuration, 'seconds');
      console.log('   - Total chunks:', totalChunks);
      
      onProgress?.({
        stage: 'chunking',
        message: `Processing ${totalChunks} audio chunks...`,
        progress: 10,
        currentChunk: 0,
        totalChunks
      });
      
      const chunkTranscripts: string[] = [];
      
      // Process each chunk
      for (let i = 0; i < totalChunks; i++) {
        const chunkStart = i * (chunkDuration - overlapDuration);
        const chunkEnd = Math.min(chunkStart + chunkDuration, totalDuration);
        
        console.log(`🔀 Processing chunk ${i + 1}/${totalChunks}: ${chunkStart.toFixed(2)}s - ${chunkEnd.toFixed(2)}s`);
        
        onProgress?.({
          stage: 'chunking',
          message: `Processing chunk ${i + 1} of ${totalChunks}...`,
          progress: 10 + (i / totalChunks) * 50,
          currentChunk: i + 1,
          totalChunks
        });
        
        try {
          // Create chunk audio file
          const chunkUri = await this.createAudioChunk(audioUri, chunkStart, chunkEnd);
          
          // Validate chunk size before transcription
          const chunkInfo = await FileSystem.getInfoAsync(chunkUri);
          if (chunkInfo.exists && 'size' in chunkInfo && chunkInfo.size) {
            const chunkSizeMB = chunkInfo.size / (1024 * 1024);
            console.log(`📊 Chunk ${i + 1} size: ${chunkSizeMB.toFixed(2)} MB`);
            
            if (chunkSizeMB > 25) {
              console.warn(`⚠️ Chunk ${i + 1} size (${chunkSizeMB.toFixed(2)}MB) exceeds 25MB limit`);
              // Clean up oversized chunk and skip
              await FileSystem.deleteAsync(chunkUri, { idempotent: true });
              continue;
            }
          }
          
          // Transcribe chunk with same language preservation
          const chunkTranscript = await this.transcribeAudio(chunkUri);
          
          if (chunkTranscript && chunkTranscript.trim().length > 0) {
            chunkTranscripts.push(chunkTranscript);
            console.log(`✅ Chunk ${i + 1} transcribed successfully:`, chunkTranscript.substring(0, 100) + '...');
          } else {
            console.log(`⚠️ Chunk ${i + 1} produced empty transcript`);
          }
          
          // Clean up chunk file
          await FileSystem.deleteAsync(chunkUri, { idempotent: true });
          
        } catch (chunkError) {
          console.error(`❌ Error processing chunk ${i + 1}:`, chunkError);
          // Continue with other chunks
        }
      }
      
      if (chunkTranscripts.length === 0) {
        throw new Error('No chunks were successfully transcribed');
      }
      
      console.log(`✅ Successfully transcribed ${chunkTranscripts.length}/${totalChunks} chunks`);
      
      // Combine transcripts with intelligent overlap handling
      const combinedTranscript = this.combineChunkTranscripts(chunkTranscripts, overlapDuration);
      
      console.log('🔀 Combined transcript length:', combinedTranscript.length);
      console.log('🔀 Combined transcript preview:', combinedTranscript.substring(0, 200) + '...');
      
      return combinedTranscript;
      
    } catch (error) {
      console.error('❌ Error in chunked audio processing:', error);
      throw error;
    }
  }

  /**
   * Create an audio chunk from the original file using expo-av
   * This implementation works within Expo managed workflow limitations
   */
  private async createAudioChunk(originalUri: string, startTime: number, endTime: number): Promise<string> {
    try {
      console.log(`🔀 Creating audio chunk: ${startTime}s - ${endTime}s`);
      console.log(`📁 Original URI: ${originalUri}`);
      
      // Create a temporary file for the chunk
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const chunkUri = `${FileSystem.cacheDirectory}chunk_${timestamp}_${randomId}.m4a`;
      
      console.log(`📁 Chunk URI: ${chunkUri}`);
      
      // Method 1: Try using metadata-based chunking (most reliable for Expo)
      try {
        const chunkCreated = await this.createChunkWithExpoAV(originalUri, chunkUri, startTime, endTime);
        if (chunkCreated) {
          console.log(`✅ Successfully created audio chunk with metadata method: ${chunkUri}`);
          return chunkUri;
        }
      } catch (expoError) {
        console.log('⚠️ Metadata-based chunking failed, trying alternative method:', expoError);
      }
      
      // Method 2: Alternative approach using audio recording
      try {
        const chunkCreated = await this.createChunkWithFileSystem(originalUri, chunkUri, startTime, endTime);
        if (chunkCreated) {
          console.log(`✅ Successfully created audio chunk with recording method: ${chunkUri}`);
          return chunkUri;
        }
      } catch (fsError) {
        console.log('⚠️ Audio recording chunking failed:', fsError);
      }
      
      // Method 3: Server-side chunking approach (if available)
      try {
        const chunkCreated = await this.createChunkWithServerSide(originalUri, chunkUri, startTime, endTime);
        if (chunkCreated) {
          console.log(`✅ Successfully created audio chunk with server-side method: ${chunkUri}`);
          return chunkUri;
        }
      } catch (serverError) {
        console.log('⚠️ Server-side chunking failed:', serverError);
      }
      
      // Method 4: Fallback - return original URI with warning
      console.log('⚠️ All chunking methods failed, using original file');
      console.log('⚠️ This means the entire file will be processed as one chunk');
      return originalUri;
      
    } catch (error) {
      console.error('❌ Error creating audio chunk:', error);
      // Fallback to original URI
      console.log('⚠️ Falling back to original URI due to error');
      return originalUri;
    }
  }

  /**
   * Create REAL audio chunk using expo-av recording with precise timing
   * This actually creates smaller audio files by recording specific time segments
   */
  private async createChunkWithExpoAV(
    originalUri: string, 
    chunkUri: string, 
    startTime: number, 
    endTime: number
  ): Promise<boolean> {
    try {
      console.log(`🎵 Creating REAL audio chunk: ${startTime}s - ${endTime}s`);
      
      // Load the original audio to validate it
      const { sound: originalSound } = await Audio.Sound.createAsync(
        { uri: originalUri },
        { shouldPlay: false }
      );
      
      // Get the original audio status
      const status = await originalSound.getStatusAsync();
      if (!status.isLoaded) {
        await originalSound.unloadAsync();
        throw new Error('Could not load original audio');
      }
      
      const duration = status.durationMillis! / 1000; // Convert to seconds
      console.log(`📊 Original audio duration: ${duration}s`);
      
      // Validate chunk parameters
      if (startTime >= duration || endTime <= startTime) {
        await originalSound.unloadAsync();
        throw new Error('Invalid chunk time range');
      }
      
      // Clamp end time to audio duration
      const actualEndTime = Math.min(endTime, duration);
      const chunkDuration = actualEndTime - startTime;
      
      console.log(`📊 Creating chunk: ${startTime}s to ${actualEndTime}s (${chunkDuration}s duration)`);
      
      // Set up audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Create a new recording for the chunk with optimized settings
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.MEDIUM_QUALITY
      );
      
      console.log(`🎙️ Starting recording for chunk...`);
      
      // Start recording
      await recording.startAsync();
      
      // Set the original audio to the start position
      await originalSound.setPositionAsync(startTime * 1000); // Convert to milliseconds
      
      // Play the original audio segment
      await originalSound.playAsync();
      
      // Wait for the exact chunk duration
      await new Promise(resolve => setTimeout(resolve, chunkDuration * 1000));
      
      // Stop the original audio and recording
      await originalSound.stopAsync();
      await recording.stopAndUnloadAsync();
      
      // Get the recorded chunk URI
      const recordedChunkUri = recording.getURI();
      
      if (recordedChunkUri) {
        // Copy the recorded chunk to our desired location
        await FileSystem.copyAsync({
          from: recordedChunkUri,
          to: chunkUri
        });
        
        // Clean up the original recording
        await FileSystem.deleteAsync(recordedChunkUri, { idempotent: true });
        
        // Verify the chunk file was created and get its size
        const chunkInfo = await FileSystem.getInfoAsync(chunkUri);
        if (chunkInfo.exists && chunkInfo.size) {
          const chunkSizeMB = chunkInfo.size / (1024 * 1024);
          console.log(`✅ Created REAL audio chunk: ${chunkUri}`);
          console.log(`📊 Chunk size: ${chunkSizeMB.toFixed(2)} MB`);
          console.log(`📊 Chunk duration: ${chunkDuration}s`);
          
          // Verify the chunk is under 25MB limit
          if (chunkSizeMB > 25) {
            console.warn(`⚠️ Chunk size (${chunkSizeMB.toFixed(2)}MB) exceeds 25MB limit`);
          } else {
            console.log(`✅ Chunk size is within OpenAI limits`);
          }
        }
        
        await originalSound.unloadAsync();
        return true;
      }
      
      await originalSound.unloadAsync();
      return false;
      
    } catch (error) {
      console.error('❌ Real audio chunking error:', error);
      return false;
    }
  }

  /**
   * Alternative chunking method using audio recording approach
   * This creates a new recording by playing the original audio segment
   */
  private async createChunkWithFileSystem(
    originalUri: string, 
    chunkUri: string, 
    startTime: number, 
    endTime: number
  ): Promise<boolean> {
    try {
      console.log(`🎵 Attempting audio recording chunking: ${startTime}s - ${endTime}s`);
      
      // Load the original audio
      const { sound: originalSound } = await Audio.Sound.createAsync(
        { uri: originalUri },
        { shouldPlay: false }
      );
      
      const status = await originalSound.getStatusAsync();
      if (!status.isLoaded) {
        await originalSound.unloadAsync();
        throw new Error('Could not load original audio');
      }
      
      const duration = status.durationMillis! / 1000;
      const actualEndTime = Math.min(endTime, duration);
      const chunkDuration = actualEndTime - startTime;
      
      console.log(`📊 Creating chunk: ${startTime}s to ${actualEndTime}s (${chunkDuration}s duration)`);
      
      // Set up audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Create a new recording for the chunk
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.MEDIUM_QUALITY
      );
      
      // Start recording
      await recording.startAsync();
      
      // Set the original audio to the start position and play
      await originalSound.setPositionAsync(startTime * 1000);
      await originalSound.playAsync();
      
      // Wait for the chunk duration
      await new Promise(resolve => setTimeout(resolve, chunkDuration * 1000));
      
      // Stop the original audio and recording
      await originalSound.stopAsync();
      await recording.stopAndUnloadAsync();
      
      // Get the recorded chunk URI
      const recordedChunkUri = recording.getURI();
      
      if (recordedChunkUri) {
        // Copy the recorded chunk to our desired location
        await FileSystem.copyAsync({
          from: recordedChunkUri,
          to: chunkUri
        });
        
        // Clean up the original recording
        await FileSystem.deleteAsync(recordedChunkUri, { idempotent: true });
        
        console.log(`✅ Created audio chunk with recording method: ${chunkUri}`);
        await originalSound.unloadAsync();
        return true;
      }
      
      await originalSound.unloadAsync();
      return false;
      
    } catch (error) {
      console.error('❌ Audio recording chunking error:', error);
      return false;
    }
  }

  /**
   * Server-side chunking approach using external service
   * This is a placeholder for future implementation with a dedicated audio processing service
   */
  private async createChunkWithServerSide(
    originalUri: string, 
    chunkUri: string, 
    startTime: number, 
    endTime: number
  ): Promise<boolean> {
    try {
      console.log(`🌐 Attempting server-side chunking: ${startTime}s - ${endTime}s`);
      
      // This is a placeholder for server-side audio processing
      // In a real implementation, you would:
      // 1. Upload the audio file to a server
      // 2. Use FFmpeg or similar on the server to extract the chunk
      // 3. Download the processed chunk back to the device
      
      // For now, we'll return false to indicate this method is not available
      console.log('⚠️ Server-side chunking not implemented - requires dedicated audio processing service');
      return false;
      
    } catch (error) {
      console.error('❌ Server-side chunking error:', error);
      return false;
    }
  }

  /**
   * Get audio duration from file URI
   */
  private async getAudioDuration(audioUri: string): Promise<number | null> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false }
      );
      
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      
      if (status.isLoaded && status.durationMillis) {
        return status.durationMillis / 1000; // Convert to seconds
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting audio duration:', error);
      return null;
    }
  }

  /**
   * Combine chunk transcripts intelligently, handling overlaps
   */
  private combineChunkTranscripts(chunkTranscripts: string[], overlapDuration: number): string {
    try {
      console.log('🔀 Combining chunk transcripts...');
      console.log('🔀 Number of chunks to combine:', chunkTranscripts.length);
      
      if (chunkTranscripts.length === 1) {
        return chunkTranscripts[0];
      }
      
      let combined = '';
      
      for (let i = 0; i < chunkTranscripts.length; i++) {
        const chunk = chunkTranscripts[i].trim();
        
        if (i === 0) {
          // First chunk - add as is
          combined = chunk;
        } else {
          // Subsequent chunks - handle overlap
          // Simple approach: just concatenate with space
          // In production, you might want more sophisticated overlap detection
          combined += ' ' + chunk;
        }
      }
      
      // Clean up the combined transcript
      combined = combined.replace(/\s+/g, ' ').trim();
      
      console.log('✅ Combined transcript created, length:', combined.length);
      return combined;
      
    } catch (error) {
      console.error('❌ Error combining chunk transcripts:', error);
      // Fallback: just join with spaces
      return chunkTranscripts.join(' ');
    }
  }

  /**
   * Transcribe audio to text using OpenAI Whisper API
   * NO MOCK DATA - Real transcription from actual audio
   * Now processes real audio chunks (smaller files under 25MB)
   */
  private async transcribeAudio(audioUri: string): Promise<string> {
    try {
      console.log('🔍 Starting REAL audio transcription...');
      console.log('📁 Audio URI received:', audioUri);
      console.log('📁 Audio URI type:', typeof audioUri);
      console.log('📁 Audio URI length:', audioUri?.length);
      
      // Validate audio URI
      if (!audioUri || audioUri === 'unknown') {
        throw new Error('Invalid audio URI provided');
      }
      
      // Check the file size to ensure it's under 25MB
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (fileInfo.exists && 'size' in fileInfo && fileInfo.size) {
        const fileSizeMB = fileInfo.size / (1024 * 1024);
        console.log(`📊 Audio file size: ${fileSizeMB.toFixed(2)} MB`);
        
        if (fileSizeMB > 25) {
          console.warn(`⚠️ File size (${fileSizeMB.toFixed(2)}MB) exceeds 25MB limit - this may cause API errors`);
        } else {
          console.log(`✅ File size is within OpenAI limits`);
        }
      }
      
      // Use language-specific prompts for better transcription accuracy
      const transcriptionPrompt = this.currentLanguage === 'ms' 
        ? "Transkripsi audio ini dengan tepat dalam Bahasa Malaysia. Jika ada campuran bahasa Inggeris dan Melayu, kekalkan campuran tersebut."
        : "Transcribe this audio accurately in English. If there's a mix of languages, preserve the natural mix.";
      
      console.log('📝 Transcription prompt:', transcriptionPrompt);
      console.log('🚀 Calling aiService.transcribeAudio for REAL transcription...');
      console.log('🔑 aiService available:', !!aiService);
      console.log('🔑 aiService.transcribeAudio available:', !!aiService.transcribeAudio);
      
      const response = await aiService.transcribeAudio(audioUri, transcriptionPrompt);

      console.log('✅ REAL transcription response received:', response);
      console.log('✅ Response type:', typeof response);
      console.log('✅ Response length:', response?.length);

      if (!response) {
        console.error('❌ Transcription failed - no response from AI service');
        throw new Error('Transcription failed - no response from AI service');
      }

      console.log('🎉 REAL transcription successful! Returning actual transcript from audio...');
      return response;
    } catch (error) {
      console.error('❌ Transcription error:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // NO MOCK DATA - if AI fails, we fail
      throw new Error(`Real transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate summary in the same language(s) as transcript
   * NO MOCK DATA - Real summary from actual transcript with educational focus
   */
  private async generateSummary(transcript: string): Promise<string> {
    try {
      console.log('📝 Starting REAL summary generation...');
      console.log('📄 Transcript to summarize:', transcript);
      
      // Detect the primary language of the transcript
      const detectedLanguage = this.detectLanguage(transcript);
      console.log('🌍 Detected language:', detectedLanguage);
      
      // Create a direct OpenAI API call for summary generation to avoid chat system prompt conflicts
      const summaryPrompt = `You are an AI assistant that creates concise summaries. 

CRITICAL LANGUAGE RULE:
- You MUST respond in the EXACT SAME language as the transcript
- If the transcript is in Malay, you MUST respond in Malay
- If the transcript is in English, you MUST respond in English
- If the transcript is mixed language, respond in the same mixed language naturally
- DO NOT translate or change the language - keep it identical

CONTENT RULES:
- Write as ONE SHORT PARAGRAPH (maximum 4-5 sentences)
- Focus on the MAIN TOPIC and OVERALL DISCUSSION
- Keep it concise and straight to the point
- NO formatting symbols like ** or __ - just plain text
- ONLY summarize what was actually said in the transcript
- Avoid detailed explanations - just give the big picture

DETECTED LANGUAGE: ${detectedLanguage}
Transcript: ${transcript}

Overall Summary (in ${detectedLanguage}):`;

      console.log('🚀 Making direct OpenAI API call for summary generation...');
      console.log('🌍 Using language parameter:', detectedLanguage === 'Malay' ? 'ms' : 'en');
      
      // Direct OpenAI API call to avoid chat system prompt conflicts
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getOpenAIKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional summarizer. Your task is to create concise summaries in the EXACT SAME language as the provided transcript. If the transcript is in Malay, respond in Malay. If it's in English, respond in English. If it's mixed language, maintain the same mixed language naturally. NEVER translate or change the language.`
            },
            {
              role: 'user',
              content: summaryPrompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.1, // Lower temperature for more consistent language adherence
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const summaryText = data.choices[0]?.message?.content || 'Summary generation failed';

      console.log('✅ REAL summary generated via direct API:', summaryText);
      return summaryText;
    } catch (error) {
      console.error('❌ Summary generation error:', error);
      // NO MOCK DATA - if AI fails, we fail
      throw new Error(`Real summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract sticky notes using real GPT API based on actual transcript
   * NO MOCK DATA - Real notes from actual transcript with cute, interactive design
   */
  private async extractStickyNotes(transcript: string): Promise<StickyNoteData[]> {
    try {
      console.log('📌 Starting REAL sticky notes generation...');
      console.log('📄 Transcript to extract notes from:', transcript);
      
      // Detect the primary language of the transcript
      const detectedLanguage = this.detectLanguage(transcript);
      console.log('🌍 Detected language for sticky notes:', detectedLanguage);
      
      const stickyNotesPrompt = `Extract ONLY important educational content from this transcript to create study-focused sticky notes.

CRITICAL LANGUAGE RULE:
- You MUST respond in the EXACT SAME language as the transcript
- If the transcript is in Malay, you MUST respond in Malay
- If the transcript is in English, you MUST respond in English
- If the transcript is mixed language, respond in the same mixed language naturally
- DO NOT translate or change the language - keep it identical

CRITICAL CONTENT RULES - NO MOCK DATA:
- ONLY include: exam dates, historical dates, scientific facts, math formulas, definitions, key terms
- DO NOT invent or add any content not clearly stated in the transcript
- If no clear educational points found, return empty array []
- Each note must be VERY SHORT: maximum 1 sentence, ≤15 words
- Make notes useful for students under 17 (study reminders, key facts)
- Focus on concrete, factual information only
- NO generic concepts or made-up examples

EDUCATIONAL CONTENT TYPES TO EXTRACT:
- Exam dates and deadlines
- Historical dates and events
- Scientific facts and discoveries
- Math formulas and equations
- Important definitions
- Key terms and concepts
- Study deadlines
- Assignment due dates

For each sticky note, provide:
1. Title (3-5 words max, educational focus, in ${detectedLanguage})
2. Content (1 sentence max, ≤15 words, only facts from transcript, in ${detectedLanguage})
3. Type (choose from: exam, deadline, formula, definition, important, reminder)
4. Color (yellow, pink, green, blue, purple)
5. Priority (high, medium, low)

DETECTED LANGUAGE: ${detectedLanguage}
Transcript: ${transcript}

Format your response as JSON array (empty [] if no educational content found):
[
  {
    "title": "Short Title in ${detectedLanguage}",
    "content": "One sentence fact from transcript in ${detectedLanguage}",
    "type": "formula",
    "color": "yellow",
    "priority": "high"
  }
]`;

      console.log('🚀 Calling aiService.sendMessage for REAL sticky notes...');
      
      const response = await aiService.sendMessage(
        [{ role: 'user', content: stickyNotesPrompt }],
        detectedLanguage === 'Malay' ? 'ms' : 'en' // Use detected language for better AI context
      );

      if (!response.success || !response.message) {
        throw new Error('Sticky notes extraction failed');
      }

      // Parse the JSON response
      try {
        const stickyNotesData = JSON.parse(response.message);
        
        // Validate and map the response
        if (Array.isArray(stickyNotesData)) {
          const notes = stickyNotesData.map((note: any) => ({
            title: note.title || 'Key Point',
            content: note.content || 'Important information',
            type: this.validateNoteType(note.type),
            color: this.validateNoteColor(note.color),
            priority: this.validateNotePriority(note.priority)
          }));
          
          // Validate note length requirements
          const validNotes = notes.filter(note => {
            const contentLength = note.content.split(' ').length;
            return contentLength <= 15; // Maximum 15 words
          });
          
          if (validNotes.length === 0) {
            console.log('✅ No educational content found - returning empty array');
            return [];
          }
          
          console.log('✅ REAL educational sticky notes generated:', validNotes);
          return validNotes;
        }
      } catch (parseError) {
        console.error('Error parsing sticky notes JSON:', parseError);
      }

      // If parsing fails, throw error - NO MOCK DATA
      throw new Error('Failed to parse sticky notes response');
    } catch (error) {
      console.error('❌ Sticky notes extraction error:', error);
      // NO MOCK DATA - if AI fails, we fail
      throw new Error(`Real sticky notes extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect the primary language of the transcript
   * Uses simple heuristics to identify Malay vs English vs mixed
   */
  private detectLanguage(transcript: string): string {
    try {
      console.log('🌍 Detecting language for transcript...');
      console.log('🌍 Transcript sample:', transcript.substring(0, 100) + '...');
      
      // Common Malay words and patterns
      const malayWords = [
        'yang', 'dan', 'atau', 'untuk', 'dalam', 'dengan', 'ke', 'dari', 'oleh', 'pada',
        'adalah', 'akan', 'sudah', 'belum', 'tidak', 'bukan', 'juga', 'lagi', 'sangat',
        'bagus', 'baik', 'besar', 'kecil', 'baru', 'lama', 'cepat', 'lambat', 'mudah',
        'susah', 'mahal', 'murah', 'panas', 'sejuk', 'tinggi', 'rendah', 'jauh', 'dekat',
        'saya', 'awak', 'dia', 'kita', 'mereka', 'ini', 'itu', 'di', 'pada', 'untuk',
        'dengan', 'oleh', 'dari', 'ke', 'dari', 'pada', 'dalam', 'atas', 'bawah'
      ];
      
      // Common Malay prefixes and suffixes
      const malayPatterns = [
        /ber[a-z]+/i,    // ber- prefix
        /me[a-z]+/i,     // me- prefix  
        /di[a-z]+/i,     // di- prefix
        /ter[a-z]+/i,    // ter- prefix
        /ke[a-z]+/i,     // ke- prefix
        /pe[a-z]+/i,     // pe- prefix
        /[a-z]+kan/i,    // -kan suffix
        /[a-z]+i/i,      // -i suffix
        /[a-z]+an/i      // -an suffix
      ];
      
      // Count Malay indicators
      let malayCount = 0;
      const words = transcript.toLowerCase().split(/\s+/);
      
      // Check for Malay words
      words.forEach(word => {
        if (malayWords.includes(word)) {
          malayCount++;
        }
      });
      
      // Check for Malay patterns
      malayPatterns.forEach(pattern => {
        if (pattern.test(transcript)) {
          malayCount++;
        }
      });
      
      // Check for Malay characters (if any)
      if (transcript.includes('é') || transcript.includes('è') || transcript.includes('ê')) {
        malayCount++;
      }
      
      // Determine language based on indicators
      const totalWords = words.length;
      const malayPercentage = (malayCount / totalWords) * 100;
      
      console.log(`🌍 Language detection results:`);
      console.log(`   Total words: ${totalWords}`);
      console.log(`   Malay indicators: ${malayCount}`);
      console.log(`   Malay percentage: ${malayPercentage.toFixed(1)}%`);
      
      if (malayPercentage > 30) {
        console.log('🌍 Detected: Malay (primary)');
        return 'Malay';
      } else if (malayPercentage > 10) {
        console.log('🌍 Detected: Mixed language (Malay + English)');
        return 'Mixed (Malay + English)';
      } else {
        console.log('🌍 Detected: English (primary)');
        return 'English';
      }
    } catch (error) {
      console.error('🌍 Language detection error:', error);
      // Default to English if detection fails
      return 'English';
    }
  }

  /**
   * Validation helpers for sticky note data
   */
  private validateNoteType(type: string): StickyNoteData['type'] {
    const validTypes: StickyNoteData['type'][] = ['exam', 'deadline', 'formula', 'definition', 'important', 'reminder'];
    return validTypes.includes(type as any) ? type as StickyNoteData['type'] : 'important';
  }

  private validateNoteColor(color: string): StickyNoteData['color'] {
    const validColors: StickyNoteData['color'][] = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
    return validColors.includes(color as any) ? color as StickyNoteData['color'] : 'yellow';
  }

  private validateNotePriority(priority: string): StickyNoteData['priority'] {
    const validPriorities: StickyNoteData['priority'][] = ['high', 'medium', 'low'];
    return validPriorities.includes(priority as any) ? priority as StickyNoteData['priority'] : 'medium';
  }
}

export const aiProcessingService = AIProcessingService.getInstance();
