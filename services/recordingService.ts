import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { aiService } from './aiService';
import { getOpenAIKey } from '../config/api';

export interface Participant {
  id: string;
  name: string;
  role: string;
}

export interface RecordingSession {
  id: string;
  title: string;
  date: string;
  duration: number;
  audioUri: string;
  transcription: string;
  summary: string;
  stickyNotes: StickyNote[];
  tags: string[];
  subject: string;
  participants: Participant[];
}

export interface RecordingProgress {
  stage: 'transcribing' | 'summarizing' | 'generating_notes' | 'extracting_tags' | 'complete';
  message: string;
  progress: number; // 0-100
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  type: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip';
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
  priority: 'high' | 'medium' | 'low';
  date?: string;
  completed?: boolean;
  image?: string | null;
}

export interface RecordingSummary {
  session: RecordingSession;
  keyPoints: string[];
  actionItems: string[];
  importantNotes: string[];
  nextSteps: string[];
}

class RecordingService {
  private recording: Audio.Recording | null = null;
  private recordingStartTime: number = 0;
  private sessions: RecordingSession[] = [];
  private currentSound: Audio.Sound | null = null;

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
      console.log('Requesting audio permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Audio permission not granted');
        return false;
      }
      console.log('Audio permissions granted');

      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Creating audio recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();
      console.log('Recording started successfully');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        console.error('Recording error details:', error.message);
      }
      return false;
    }
  }

  async stopRecording(onProgress?: (progress: RecordingProgress) => void): Promise<RecordingSession | null> {
    if (!this.recording) {
      console.error('No active recording found');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      const duration = Date.now() - this.recordingStartTime;
      
      this.recording = null;
      this.recordingStartTime = 0;

      if (!uri) {
        throw new Error('Failed to get recording URI - audio file not saved');
      }

      console.log('Recording stopped, processing audio file:', uri);

      // Transcribe the audio
      onProgress?.({
        stage: 'transcribing',
        message: 'Converting speech to text...',
        progress: 20
      });
      console.log('Starting transcription...');
      const transcription = await this.transcribeAudio(uri);
      if (!transcription) {
        throw new Error('Transcription failed - no text was generated from audio');
      }
      console.log('Transcription successful, length:', transcription.length);

      // Generate AI summary
      onProgress?.({
        stage: 'summarizing',
        message: 'Generating session summary...',
        progress: 40
      });
      console.log('Generating summary...');
      const summary = await this.generateSummary(transcription);
              console.log('Summary generated:', summary.summary.substring(0, 100) + '...');
        console.log('Language detected:', summary.language_used, 'Confidence:', summary.confidence);
        console.log('Sticky notes:', summary.sticky_notes.length);

      // Convert summary sticky notes to StickyNote objects
      onProgress?.({
        stage: 'generating_notes',
        message: 'Creating key points and notes...',
        progress: 60
      });
      console.log('Processing sticky notes from summary...');
      const stickyNotes = this.convertSummaryNotesToStickyNotes(summary.sticky_notes, summary.language_used);
      console.log('Generated', stickyNotes.length, 'sticky notes');

      // Extract tags and subject
      onProgress?.({
        stage: 'extracting_tags',
        message: 'Analyzing content and extracting tags...',
        progress: 80
      });
      console.log('Extracting tags and subject...');
      const tags = await this.extractTags(transcription);
      const subject = await this.detectSubject(transcription);
      console.log('Tags:', tags, 'Subject:', subject);

      onProgress?.({
        stage: 'complete',
        message: 'Processing complete!',
        progress: 100
      });

      // Detect participants from transcript
      const participants = await this.detectParticipants(transcription);

      const session: RecordingSession = {
        id: Date.now().toString(),
        title: `Study Session - ${new Date().toLocaleDateString()}`,
        date: new Date().toISOString(),
        duration,
        audioUri: uri,
        transcription,
        summary: summary.summary,
        stickyNotes,
        tags,
        subject,
        participants,
      };

      this.sessions.push(session);
      console.log('Recording session created successfully:', session.id);
      return session;
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Provide more specific error information
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return null;
    }
  }

  private async transcribeAudio(audioUri: string): Promise<string | null> {
    // Get API key from configuration
    const openAIApiKey = getOpenAIKey();

    // Note: Whisper API automatically detects and preserves the original language
    // No language restrictions are applied to the transcription

    try {
      console.log('Starting transcription with audio URI:', audioUri);
      
      // Check if audio file exists and is accessible
      try {
        const fileInfo = await FileSystem.getInfoAsync(audioUri);
        if (!fileInfo.exists) {
          throw new Error(`Audio file not found: ${audioUri}`);
        }
        console.log('Audio file size:', fileInfo.size, 'bytes');
      } catch (fileError) {
        console.error('File system error:', fileError);
        throw new Error(`Cannot access audio file: ${fileError}`);
      }

      const formData = new FormData();
      
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      };
      
      formData.append('file', audioFile as any);
      formData.append('model', 'whisper-1');

      console.log('Sending transcription request to OpenAI...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const transcription = data.text || null;
      
      if (transcription) {
        console.log('Transcription successful, received text length:', transcription.length);
      } else {
        console.warn('Transcription returned empty text');
      }
      
      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      if (error instanceof Error) {
        console.error('Transcription error details:', error.message);
      }
      return null;
    }
  }

  private async generateSummary(transcription: string): Promise<{ summary: string; sticky_notes: string[]; language_used: string; confidence: number }> {
    try {
      // Use direct OpenAI API call to avoid language restrictions
      const openAIApiKey = getOpenAIKey();
      
      const prompt = `You are an AI note-taking assistant for students (under 17 years old). Generate a summary that is short, clear, and student-friendly.

### Language Rules:
- Step 1: Detect the dominant language from the transcript
- If English ≥ 60% → summary + bullets in English
- If Malay ≥ 60% → summary + bullets in Malay
- If neither ≥ 60% → default to English
- Step 2: Never switch language unexpectedly
- Output everything in one consistent language only

### Summary Rules:
- One short paragraph (60-300 words max)
- Preserve technical terms and named entities exactly as in transcript
- No hallucinations - must be grounded in transcript content
- Use the detected dominant language consistently

### Sticky Notes Rules:
- Keep sticky notes short and human-like, as if written by a student <17 years old
- Only include IMPORTANT info based on the audio (e.g. exam dates, common exam questions, key points in lessons)
- At least 1 sticky note, no maximum limit
- Can include simple drawings / icons / emojis to make it interactive and engaging for young students

Output JSON format:
{
  "summary": "Your summary paragraph in the detected language...",
  "sticky_notes": ["Key point 1 in same language", "Key point 2 in same language", "Key point 3 in same language"],
  "language_used": "english|malay",
  "confidence": 0.85
}

Transcript: ${transcription}

Create a student-friendly summary and sticky notes in the detected language:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an AI note-taking assistant for students under 17 years old. Create summaries and sticky notes that are short, clear, and student-friendly. Detect the dominant language from transcripts (English ≥60% or Malay ≥60%) and generate everything in that language. If neither reaches 60%, default to English. Both summary and sticky notes must be in the same language. Do NOT translate or mix languages.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.status}`);
      }

      const data = await response.json();
      const summaryText = data.choices[0]?.message?.content || 'Summary generation failed';
      
      try {
        // Try to parse JSON response
        const parsedSummary = JSON.parse(summaryText);
        if (parsedSummary.summary && parsedSummary.sticky_notes && parsedSummary.language_used && parsedSummary.confidence) {
          return {
            summary: parsedSummary.summary,
            sticky_notes: parsedSummary.sticky_notes,
            language_used: parsedSummary.language_used,
            confidence: parsedSummary.confidence
          };
        }
      } catch (parseError) {
        // Fallback to raw text if JSON parsing fails
        console.log('Summary JSON parsing failed, using raw text');
      }
      
              // Fallback: return structured data with raw text
        return {
          summary: summaryText,
          sticky_notes: [summaryText],
          language_used: 'auto-detected',
          confidence: 0.5
        };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        summary: 'Summary generation failed',
        sticky_notes: ['Error occurred during summary generation'],
        language_used: 'unknown',
        confidence: 0.0
      };
    }
  }

  // Helper methods for sticky notes
  private getNoteType(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('exam') || lowerText.includes('test') || lowerText.includes('quiz')) return 'exam';
    if (lowerText.includes('deadline') || lowerText.includes('due') || lowerText.includes('submit')) return 'deadline';
    if (lowerText.includes('formula') || lowerText.includes('equation') || lowerText.includes('=')) return 'formula';
    if (lowerText.includes('definition') || lowerText.includes('means') || lowerText.includes('is')) return 'definition';
    if (lowerText.includes('date') || lowerText.includes('when') || lowerText.includes('time')) return 'reminder';
    if (lowerText.includes('tip') || lowerText.includes('hint') || lowerText.includes('remember')) return 'tip';
    return 'important';
  }

  private getNoteColor(index: number): string {
    const colors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
    return colors[index % colors.length];
  }

  private getNotePriority(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('exam') || lowerText.includes('deadline') || lowerText.includes('due')) return 'high';
    if (lowerText.includes('formula') || lowerText.includes('definition') || lowerText.includes('important')) return 'high';
    if (lowerText.includes('tip') || lowerText.includes('hint') || lowerText.includes('remember')) return 'medium';
    return 'medium';
  }

  private async extractTags(transcription: string): Promise<string[]> {
    try {
      // Use direct OpenAI API call to avoid language restrictions
      const openAIApiKey = getOpenAIKey();
      
      const prompt = `You are an AI note-taking assistant for students (under 17 years old). Extract 3-5 relevant tags from this study session transcript.

### Language Rules:
- Do NOT translate the language
- Detect the language ratio in the transcript
- If one language is > 60%, output everything in that language
- If no language passes 60%, keep the original mixed language
- Always keep the language natural for students

Focus on subjects, topics, or themes discussed.

Transcript: ${transcription}

Tags (comma-separated):`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI note-taking assistant for students under 17 years old. Extract relevant tags from study sessions. Detect the language ratio in transcripts and output in the dominant language (>60%) or keep mixed if no language dominates. Do NOT translate - maintain the natural language style for students.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tag extraction failed: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      return responseText?.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) || [];
    } catch (error) {
      console.error('Error extracting tags:', error);
      return [];
    }
  }

  private async detectSubject(transcription: string): Promise<string> {
    try {
      // Use direct OpenAI API call to avoid language restrictions
      const openAIApiKey = getOpenAIKey();
      
      const prompt = `You are an AI note-taking assistant for students (under 17 years old). What is the main subject or topic of this study session?

### Language Rules:
- Do NOT translate the language
- Detect the language ratio in the transcript
- If one language is > 60%, output everything in that language
- If no language passes 60%, keep the original mixed language
- Always keep the language natural for students

Respond with just the subject name (e.g., "Mathematics", "Sejarah", "Chemistry", "English", "Biology").

Transcript: ${transcription}

Subject:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI note-taking assistant for students under 17 years old. Identify the main subject of study sessions. Detect the language ratio in transcripts and output in the dominant language (>60%) or keep mixed if no language dominates. Do NOT translate - maintain the natural language style for students.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Subject detection failed: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      return responseText?.trim() || 'General';
    } catch (error) {
      console.error('Error detecting subject:', error);
      return 'General';
    }
  }

  getSessions(): RecordingSession[] {
    return this.sessions;
  }

  getSessionById(id: string): RecordingSession | undefined {
    return this.sessions.find(session => session.id === id);
  }

  getSessionSummaryData(id: string): { summary: string; sticky_notes: string[]; language_used: string; confidence: number } | null {
    const session = this.getSessionById(id);
    if (!session) return null;
    
    // For now, return basic structure - in a real app, you might store this separately
    return {
      summary: session.summary,
      sticky_notes: [session.summary], // Placeholder - in real app, store bullets separately
      language_used: 'auto-detected',
      confidence: 0.8
    };
  }

  private convertSummaryNotesToStickyNotes(notes: string[], languageUsed: string): StickyNote[] {
    return notes.map((note, index) => ({
      id: `note_${Date.now()}_${index}`,
      title: note,
      content: '',
      type: this.getNoteType(note) as 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip',
      color: this.getNoteColor(index) as 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red',
      priority: this.getNotePriority(note) as 'high' | 'medium' | 'low',
      date: new Date().toISOString(),
      completed: false,
      image: null,
    }));
  }

  deleteSession(id: string): boolean {
    const index = this.sessions.findIndex(session => session.id === id);
    if (index !== -1) {
      this.sessions.splice(index, 1);
      return true;
    }
    return false;
  }

  updateSession(id: string, updates: Partial<RecordingSession>): boolean {
    const index = this.sessions.findIndex(session => session.id === id);
    if (index !== -1) {
      this.sessions[index] = { ...this.sessions[index], ...updates };
      return true;
    }
    return false;
  }

  // Play recording with dual speaker mode (main speaker + earpiece)
  async playRecording(audioUri: string): Promise<boolean> {
    try {
      console.log('Starting audio playback with dual speaker mode...');
      
      // Stop any existing playback first
      await this.stopPlayback();
      
      // Set audio mode for dual speaker output
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true, // Enable earpiece on Android
        // iOS will use the default routing which includes both speakers
      });

      // Create sound object with enhanced audio settings
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true, 
          volume: 1.0,
          // Enable audio routing to both speakers
          androidImplementation: 'MediaPlayer', // Better Android compatibility
        },
        (status) => {
          if (status.isLoaded) {
            console.log('Audio status:', status);
            // Handle when audio finishes playing
            if (status.didJustFinish) {
              console.log('Audio finished playing');
              this.currentSound = null; // Reset sound reference
            }
          }
        }
      );

      // Store sound reference for cleanup
      this.currentSound = sound;
      
      console.log('Audio playback started successfully with dual speaker mode');
      return true;
    } catch (error) {
      console.error('Error playing recording:', error);
      return false;
    }
  }

  // Stop current audio playback
  async stopPlayback(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
        console.log('Audio playback stopped');
      } catch (error) {
        console.error('Error stopping playback:', error);
      }
    }
  }

  // Get current playback status
  async getPlaybackStatus(): Promise<any> {
    if (this.currentSound) {
      try {
        return await this.currentSound.getStatusAsync();
      } catch (error) {
        console.error('Error getting playback status:', error);
      }
      return null;
    }
    return null;
  }

  // Replay the current audio (useful when audio finishes)
  async replayAudio(audioUri: string): Promise<boolean> {
    try {
      console.log('Replaying audio with dual speaker mode...');
      
      // If there's a current sound, stop it first
      if (this.currentSound) {
        await this.stopPlayback();
      }
      
      // Enable dual speaker mode before replaying
      await this.enableDualSpeakerMode();
      
      // Play the audio again
      return await this.playRecording(audioUri);
    } catch (error) {
      console.error('Error replaying audio:', error);
      return false;
    }
  }

  // Check if audio is currently playing
  isPlaying(): boolean {
    return this.currentSound !== null;
  }

  // Get the current audio duration and position
  async getAudioInfo(): Promise<{ duration: number; position: number; isPlaying: boolean } | null> {
    if (this.currentSound) {
      try {
        const status = await this.currentSound.getStatusAsync();
        if (status.isLoaded) {
          return {
            duration: status.durationMillis || 0,
            position: status.positionMillis || 0,
            isPlaying: status.isPlaying || false
          };
        }
      } catch (error) {
        console.error('Error getting audio info:', error);
      }
    }
    return null;
  }

  // Detect participants from transcript
  private async detectParticipants(transcription: string): Promise<Participant[]> {
    try {
      const openAIApiKey = getOpenAIKey();
      
      const prompt = `Analyze this transcript and identify the participants. If names are mentioned, use them. Otherwise, assign generic labels.

Rules:
- If only one speaker: label as "Teacher" or "Student"
- If multiple speakers: label as "Student 1", "Student 2", "Teacher 1", etc.
- If names are mentioned (e.g., "Ali said", "Siti asked"), use those names
- Assign roles: "Teacher", "Student", "Presenter", "Moderator"

Output JSON format:
{
  "participants": [
    { "id": "speaker1", "name": "Teacher", "role": "Teacher" },
    { "id": "speaker2", "name": "Student 1", "role": "Student" }
  ]
}

Transcript: ${transcription}

Identify participants:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an assistant that identifies participants in transcripts. Always respond with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices[0]?.message?.content || '';
        
        try {
          const parsed = JSON.parse(responseText);
          if (parsed.participants && Array.isArray(parsed.participants)) {
            return parsed.participants.map((p: any) => ({
              id: p.id || `speaker_${Date.now()}`,
              name: p.name || 'Unknown',
              role: p.role || 'Speaker'
            }));
          }
        } catch (parseError) {
          console.log('Participant detection JSON parsing failed');
        }
      }
      
      // Fallback: default participants
      return [
        { id: 'speaker1', name: 'Teacher', role: 'Teacher' },
        { id: 'speaker2', name: 'Student 1', role: 'Student' }
      ];
    } catch (error) {
      console.error('Error detecting participants:', error);
      // Fallback: default participants
      return [
        { id: 'speaker1', name: 'Teacher', role: 'Teacher' },
        { id: 'speaker2', name: 'Student 1', role: 'Student' }
      ];
    }
  }

  // Enable dual speaker mode (both main speaker and earpiece)
  async enableDualSpeakerMode(): Promise<void> {
    try {
      console.log('Enabling dual speaker mode...');
      
      // Configure audio routing for both speakers
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true, // Enable earpiece
        // iOS will automatically route to available speakers
      });

      // Force audio session to use both speakers
      if (Platform.OS === 'ios') {
        // iOS specific: Enable audio session for multiple outputs
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: true,
          // iOS will use the best available audio routing
        });
      }

      console.log('Dual speaker mode enabled successfully');
    } catch (error) {
      console.error('Error enabling dual speaker mode:', error);
    }
  }

  // Switch to main speaker only (loud)
  async enableMainSpeakerOnly(): Promise<void> {
    try {
      console.log('Enabling main speaker only mode...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Disable earpiece, use main speaker
      });

      console.log('Main speaker only mode enabled');
    } catch (error) {
      console.error('Error enabling main speaker only mode:', error);
    }
  }

  // Switch to earpiece only (quiet)
  async enableEarpieceOnly(): Promise<void> {
    try {
      console.log('Enabling earpiece only mode...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: true, // Enable earpiece only
      });

      console.log('Earpiece only mode enabled');
    } catch (error) {
      console.error('Error enabling earpiece only mode:', error);
    }
  }
}

export const recordingService = new RecordingService();
