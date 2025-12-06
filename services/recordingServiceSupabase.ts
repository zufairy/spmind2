import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { supabase, RecordingSession, SessionStickyNote, SessionParticipant } from './supabase';
import { authService } from './authService';
import { aiProcessingService, ProcessingProgress } from './aiProcessingService';

export interface Participant {
  id: string;
  name: string;
  role: string;
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



class RecordingServiceSupabase {
  private recording: Audio.Recording | null = null;
  private recordingStartTime: number = 0;
  private currentSound: Audio.Sound | null = null;

  /**
   * Clean up any existing recording objects
   */
  private async cleanupRecording(): Promise<void> {
    try {
      if (this.recording) {
        console.log('Cleaning up existing recording...');
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      
      if (this.currentSound) {
        console.log('Cleaning up existing sound...');
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
    } catch (error) {
      console.log('Error during cleanup (this is usually fine):', error);
    }
  }

  /**
   * Check if recording is currently in progress
   */
  isRecording(): boolean {
    return this.recording !== null;
  }

  /**
   * Force cleanup of all audio resources (useful for app restart scenarios)
   */
  async forceCleanup(): Promise<void> {
    console.log('Force cleaning up all audio resources...');
    try {
      // Reset audio mode to disable recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Clean up any existing objects
      await this.cleanupRecording();
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Force cleanup completed');
    } catch (error) {
      console.log('Error during force cleanup:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('🎤 Requesting microphone permissions...');
      
      // First check current status
      const { status: currentStatus } = await Audio.getPermissionsAsync();
      console.log('📊 Current permission status:', currentStatus);
      
      if (currentStatus === 'granted') {
        console.log('✅ Microphone permission already granted');
        return true;
      }
      
      // Request permission
      const { status } = await Audio.requestPermissionsAsync();
      console.log('📊 Permission request result:', status);
      
      const granted = status === 'granted';
      if (granted) {
        console.log('✅ Microphone permission granted');
      } else {
        console.log('❌ Microphone permission denied');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting audio permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<boolean> {
    try {
      // Force cleanup of any orphaned recording objects first
      await this.forceCleanup();

      console.log('Requesting audio permissions...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('Audio permission not granted');
        return false;
      }
      console.log('Audio permissions granted');

      // Reset audio mode to ensure clean state
      console.log('Setting audio mode...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      console.log('Creating audio recording with MEDIUM quality...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.MEDIUM_QUALITY
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();
      console.log('Recording started successfully');
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error instanceof Error) {
        console.error('Recording error details:', error.message);
        
        // If it's the "only one recording" error, try to clean up and retry once
        if (error.message.includes('Only one Recording object can be prepared')) {
          console.log('Attempting to clean up and retry...');
          try {
            // Force cleanup of any existing recordings
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: false,
            });
            
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Reset audio mode
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: true,
              playsInSilentModeIOS: true,
              shouldDuckAndroid: true,
              playThroughEarpieceAndroid: false,
              staysActiveInBackground: false,
            });
            
            // Try creating recording again
            const { recording } = await Audio.Recording.createAsync(
              Audio.RecordingOptionsPresets.MEDIUM_QUALITY
            );
            
            this.recording = recording;
            this.recordingStartTime = Date.now();
            console.log('Recording started successfully after cleanup');
            return true;
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
          }
        }
      }
      return false;
    }
  }

  async getSessions(): Promise<RecordingSession[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return [];
      }

      const { data, error } = await supabase
        .from('recording_sessions')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async getSessionById(id: string): Promise<RecordingSession | null> {
    try {
      // Get auth user ID directly to match RLS policy
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('❌ Not authenticated for getSessionById');
        return null;
      }

      const userId = authUser.id;

      const { data, error } = await supabase
        .from('recording_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId) // Use auth user ID
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      if (!data) {
        console.error('No session data returned for id:', id);
        return null;
      }

      // Ensure all required fields have valid values
      const validatedSession: RecordingSession = {
        ...data,
        duration: typeof data.duration === 'number' && !isNaN(data.duration) ? data.duration : 0,
        title: data.title || 'Untitled Session',
        audio_uri: data.audio_uri || '',
        transcript: data.transcript || '',
        summary: data.summary || '',
        subjects: Array.isArray(data.subjects) ? data.subjects : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      console.log('✅ Session retrieved and validated:', {
        id: validatedSession.id,
        title: validatedSession.title,
        duration: validatedSession.duration,
        hasTranscript: !!validatedSession.transcript,
        hasSummary: !!validatedSession.summary,
      });

      return validatedSession;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async getSessionStickyNotes(sessionId: string): Promise<StickyNote[]> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return [];
      }

      const { data, error } = await supabase
        .from('session_sticky_notes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching sticky notes:', error);
        return [];
      }

      return (data || []).map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        type: note.type,
        color: note.color,
        priority: note.priority,
        completed: note.completed,
        image: note.image,
        date: note.created_at,
      }));
    } catch (error) {
      console.error('Error getting sticky notes:', error);
      return [];
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const { error } = await supabase
        .from('recording_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error deleting session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  async updateSession(id: string, updates: Partial<RecordingSession>): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      // Create a copy of updates without read-only fields
      // Duration is set only during creation and should not be modified (it may be REAL/computed in DB)
      const updateableFields: any = { ...updates };
      
      // Remove read-only fields that cannot be updated
      if ('duration' in updateableFields) {
        console.warn('⚠️ Duration field is read-only and cannot be updated. It will be excluded from the update.');
        delete updateableFields.duration;
      }
      if ('id' in updateableFields) {
        delete updateableFields.id;
      }
      if ('created_at' in updateableFields) {
        delete updateableFields.created_at;
      }
      if ('updated_at' in updateableFields) {
        delete updateableFields.updated_at;
      }
      if ('user_id' in updateableFields) {
        delete updateableFields.user_id;
      }

      const { error } = await supabase
        .from('recording_sessions')
        .update(updateableFields)
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error updating session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  }

  /**
   * Generate summary from transcript and update session
   */
  private async generateSummaryFromTranscript(
    sessionId: string,
    transcript: string,
    userId: string
  ): Promise<string | null> {
    try {
      console.log('📝 Generating summary from transcript for session:', sessionId);
      
      if (!transcript || transcript.trim().length < 10) {
        console.log('⚠️ Transcript too short, skipping summary generation');
        return null;
      }

      // Import aiService dynamically to avoid circular dependencies
      const { aiService } = await import('./aiService');
      
      // Detect language
      const malayWords = ['yang', 'dan', 'atau', 'untuk', 'dalam', 'dengan', 'saya', 'awak', 'dia', 'kita'];
      const words = transcript.toLowerCase().split(/\s+/);
      const malayCount = words.filter(w => malayWords.includes(w)).length;
      const isMalay = (malayCount / words.length) > 0.1;
      const language = isMalay ? 'ms' : 'en';
      
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

Transcript: ${transcript}

Overall Summary:`;

      const response = await aiService.sendMessage(
        [{ role: 'user', content: summaryPrompt }],
        language
      );

      if (!response.success || !response.message) {
        console.error('❌ AI response failed for summary generation');
        return null;
      }

      const summary = response.message.trim();
      
      if (summary && summary.length > 0) {
        console.log('✅ Generated summary from transcript:', summary.substring(0, 100) + '...');
        
        // Update session with summary
        const { error: updateError } = await supabase
          .from('recording_sessions')
          .update({ summary: summary })
          .eq('id', sessionId)
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('❌ Error updating session with summary:', updateError);
          return null;
        }
        
        console.log('✅ Session updated with summary');
        return summary;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error generating summary from transcript:', error);
      return null;
    }
  }

  /**
   * Generate sticky notes from transcript (fallback method)
   */
  private async generateStickyNotesFromTranscript(
    sessionId: string,
    transcript: string,
    userId: string
  ): Promise<void> {
    try {
      console.log('🔄 Generating sticky notes from transcript for session:', sessionId);
      
      // Import aiService dynamically to avoid circular dependencies
      const { aiService } = await import('./aiService');
      
      const stickyNotesPrompt = `Extract ONLY important educational content from this transcript to create study-focused sticky notes.

CRITICAL RULES - NO MOCK DATA:
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
1. Title (3-5 words max, educational focus)
2. Content (1 sentence max, ≤15 words, only facts from transcript)
3. Type (choose from: exam, deadline, formula, definition, important, reminder)
4. Color (yellow, pink, green, blue, purple, orange, red)
5. Priority (high, medium, low)

Transcript: ${transcript}

Format your response as JSON array (empty [] if no educational content found):
[
  {
    "title": "Short Title",
    "content": "One sentence fact from transcript",
    "type": "formula",
    "color": "yellow",
    "priority": "high"
  }
]`;

      const response = await aiService.sendMessage(
        [{ role: 'user', content: stickyNotesPrompt }],
        'en'
      );

      if (!response.success || !response.message) {
        console.error('❌ AI response failed for transcript-based generation');
        return;
      }

      const stickyNotesData = JSON.parse(response.message);
      
      if (Array.isArray(stickyNotesData) && stickyNotesData.length > 0) {
        console.log(`✅ Generated ${stickyNotesData.length} sticky notes from transcript`);
        
        const allowedColors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
        const allowedTypes = ['task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip'];
        
        for (const noteData of stickyNotesData) {
          let validColor = noteData.color || 'yellow';
          if (!allowedColors.includes(validColor)) {
            validColor = 'yellow';
          }
          
          let validType = noteData.type || 'important';
          if (!allowedTypes.includes(validType)) {
            validType = 'important';
          }
          
          const { error: stickyNoteError } = await supabase
            .from('session_sticky_notes')
            .insert([
              {
                session_id: sessionId,
                user_id: userId,
                title: noteData.title || 'Key Point',
                content: noteData.content || 'Important information',
                type: validType,
                color: validColor,
                priority: noteData.priority || 'medium',
                completed: false,
                image: null,
              }
            ]);

          if (stickyNoteError) {
            console.error('❌ Error creating sticky note from transcript:', stickyNoteError);
          } else {
            console.log('✅ Created sticky note from transcript:', noteData.title);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error generating sticky notes from transcript:', error);
      throw error;
    }
  }

  async updateSessionStickyNote(id: string, updates: Partial<StickyNote>): Promise<boolean> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return false;
      }

      const { error } = await supabase
        .from('session_sticky_notes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error updating sticky note:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating sticky note:', error);
      return false;
    }
  }



  async stopRecording(onProgress?: (progress: ProcessingProgress) => void): Promise<RecordingSession | null> {
    if (!this.recording) {
      console.error('No active recording found');
      return null;
    }

    // Declare variables outside try block for error handling
    let audioUri: string | null = null;
    let recordingDuration: number = 0;
    let currentUser: any = null;

    try {
        const uri = this.recording.getURI();
        
        // Calculate duration BEFORE cleanup (since cleanup resets recordingStartTime to 0)
        const startTime = this.recordingStartTime;
        const currentTime = Date.now();
        let duration = currentTime - startTime;
        
        // Ensure duration is valid - if recordingStartTime was 0 or invalid, use a minimum duration
        if (duration <= 0 || !startTime || startTime === 0) {
          console.warn('⚠️ Invalid duration calculated:', {
            startTime,
            currentTime,
            calculatedDuration: duration,
            recordingStartTime: this.recordingStartTime
          });
          duration = 1000; // Minimum 1 second
        }
        
        console.log('⏱️ Duration calculation:', {
          startTime,
          currentTime,
          duration: duration + 'ms',
          durationSeconds: (duration / 1000).toFixed(2) + 's'
        });
        
        // Clean up the recording
        await this.cleanupRecording();
        this.recordingStartTime = 0;

        if (!uri) {
          throw new Error('Failed to get recording URI - audio file not saved');
        }

        // Store these values for error handling
        audioUri = uri;
        recordingDuration = duration;

        console.log('✅ Recording stopped, processing audio file:', uri);
        console.log('📁 Audio URI type:', typeof uri);
        console.log('📁 Audio URI format:', uri?.substring(0, 50) + '...');

        // Get user first - required for session creation
        // Get auth user ID directly from Supabase to ensure it matches auth.uid() for RLS policies
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          throw new Error('User not authenticated');
        }

        // Get user profile for other data, but use authUser.id for database operations
        currentUser = await authService.getCurrentUser();
        const userId = authUser.id; // Use auth user ID directly to match auth.uid() in RLS policies

        console.log('👤 User authenticated:', userId);
        console.log('👤 Auth user ID matches profile:', currentUser?.id === userId);

        // Process audio with AI to generate transcript, summary, and notes
        // This will automatically use chunking for large files (>20MB or >8 minutes)
        console.log('🎯 Starting AI processing of recorded audio...');
        console.log('📁 Audio URI:', uri);
        console.log('⏱️ Final recording duration:', duration, 'ms', `(${(duration / 1000).toFixed(2)}s)`);
        
        let aiResults: any = {
          transcript: '',
          summary: '',
          stickyNotes: []
        };

        // Try AI processing with fallback
        try {
          aiResults = await aiProcessingService.processAudio(uri, onProgress);
          console.log('✅ AI processing completed:', {
            transcriptLength: aiResults.transcript?.length || 0,
            summaryLength: aiResults.summary?.length || 0,
            stickyNotesCount: aiResults.stickyNotes?.length || 0
          });
          
          // Validate AI results - check if summary is just placeholder text
          if (aiResults.summary && (
            aiResults.summary === 'Recording session completed successfully.' ||
            aiResults.summary === 'Recording session saved successfully' ||
            aiResults.summary.trim().length < 10
          )) {
            console.log('⚠️ AI returned placeholder summary, will regenerate from transcript');
            aiResults.summary = '';
          }
        } catch (aiError) {
          console.error('⚠️ AI processing failed, will try to generate from transcript later:', aiError);
          // Don't use fallback content - we'll generate from transcript if we get one
          aiResults = {
            transcript: '',
            summary: '',
            stickyNotes: []
          };
          console.log('📝 Will attempt to generate summary and notes from transcript after session creation');
        }

        // Create recording session with AI-generated content
        // Use robust algorithm with multiple retry attempts
        let sessionData: any = null;
        
        // Prepare session data with safe defaults
        // Use authUser.id to ensure it matches auth.uid() for RLS policies
        // Ensure duration is a valid integer (milliseconds)
        const validDuration = typeof duration === 'number' && !isNaN(duration) && duration > 0 
          ? Math.floor(duration) 
          : 0;
        
        const sessionPayload = {
          user_id: userId, // Use auth user ID directly
          title: `Study Session - ${new Date().toLocaleDateString()}`,
          description: `Recording session`,
          audio_uri: uri || '',
          duration: validDuration, // Ensure it's a valid integer
          transcript: aiResults.transcript || 'Recording completed',
          summary: aiResults.summary || 'Recording session saved successfully',
          subjects: ['General Study'], // Array of strings
          tags: ['recording'], // Array of strings
        };
        
        console.log('📝 Session payload validation:', {
          duration: sessionPayload.duration,
          durationType: typeof sessionPayload.duration,
          audioUri: sessionPayload.audio_uri ? 'present' : 'missing',
          hasTranscript: !!sessionPayload.transcript,
          hasSummary: !!sessionPayload.summary,
        });
        
        console.log('📝 Creating session with payload:', {
          user_id: sessionPayload.user_id,
          title: sessionPayload.title,
          duration: sessionPayload.duration,
          transcriptLength: sessionPayload.transcript?.length || 0,
          summaryLength: sessionPayload.summary?.length || 0,
        });
        
        // Robust session creation with multiple retry attempts
        const sessionMaxRetries = 3;
        let lastError: any = null;
        
        for (let attempt = 1; attempt <= sessionMaxRetries; attempt++) {
          console.log(`🔄 Session creation attempt ${attempt}/${sessionMaxRetries}...`);
          
          try {
            // First, try insert with select - ensure all required fields are present
            console.log('📝 Inserting session with validated payload:', {
              user_id: sessionPayload.user_id,
              title: sessionPayload.title,
              audio_uri: sessionPayload.audio_uri ? 'present' : 'missing',
              duration: sessionPayload.duration,
              durationType: typeof sessionPayload.duration,
              hasTranscript: !!sessionPayload.transcript,
              hasSummary: !!sessionPayload.summary,
              subjects: sessionPayload.subjects,
              tags: sessionPayload.tags,
            });
            
            const { data: attemptData, error: attemptError } = await supabase
              .from('recording_sessions')
              .insert([sessionPayload])
              .select('*') // Select all fields to ensure we get everything back
              .single();

            console.log(`📝 Attempt ${attempt} result:`, {
              hasData: !!attemptData,
              hasError: !!attemptError,
              dataId: attemptData?.id,
              errorMessage: attemptError?.message,
              errorCode: attemptError?.code,
              errorDetails: attemptError?.details,
              fullError: attemptError ? JSON.stringify(attemptError, null, 2) : null,
            });

            if (attemptError) {
              lastError = attemptError;
              console.error(`❌ Attempt ${attempt} error:`, attemptError);
              console.error(`❌ Error code:`, attemptError.code);
              console.error(`❌ Error details:`, attemptError.details);
              console.error(`❌ Error hint:`, attemptError.hint);
              
              // If not the last attempt, wait and retry
              if (attempt < sessionMaxRetries) {
                const waitTime = attempt * 1000; // Exponential backoff
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            } else if (attemptData && attemptData.id) {
              // Success!
              sessionData = attemptData;
              console.log(`✅ Session created successfully on attempt ${attempt}:`, sessionData.id);
              break;
            } else {
              // Data is null or missing id - try querying by user_id and audio_uri as fallback
              console.warn(`⚠️ Attempt ${attempt} returned null data, trying to query by audio_uri...`);
              
              // Wait a moment for database to sync
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Try to find the session we just created - use array result instead of single
              const { data: queriedDataArray, error: queryError } = await supabase
                .from('recording_sessions')
                .select('id, user_id, title, description, audio_uri, duration, transcript, summary, subjects, tags, created_at, updated_at')
                .eq('user_id', userId) // Use auth user ID
                .eq('audio_uri', uri)
                .order('created_at', { ascending: false })
                .limit(1);
              
              console.log(`🔍 Query result:`, {
                hasData: !!queriedDataArray,
                isArray: Array.isArray(queriedDataArray),
                arrayLength: queriedDataArray?.length,
                hasError: !!queryError,
                firstItemId: queriedDataArray?.[0]?.id,
                fullData: queriedDataArray,
              });
              
              // Handle both array and single object responses
              const queriedData = Array.isArray(queriedDataArray) ? queriedDataArray[0] : queriedDataArray;
              
              if (queriedData && queriedData.id) {
                sessionData = queriedData;
                console.log(`✅ Session found via query on attempt ${attempt}:`, sessionData.id);
                break;
              } else if (queriedData && !queriedData.id) {
                console.error(`⚠️ Query returned data but missing id:`, queriedData);
                // Try to get id from a different query
                const { data: idQueryData } = await supabase
                  .from('recording_sessions')
                  .select('id')
                  .eq('user_id', userId) // Use auth user ID
                  .eq('audio_uri', uri)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single();
                
                if (idQueryData && idQueryData.id) {
                  sessionData = { ...queriedData, id: idQueryData.id };
                  console.log(`✅ Session id found via separate query:`, sessionData.id);
                  break;
                }
              }
              
              // Still no data
              lastError = { message: 'Session data is null or missing id after insert and query' };
              console.error(`❌ Attempt ${attempt} returned null data and query also failed`);
              
              if (attempt < sessionMaxRetries) {
                const waitTime = attempt * 1000;
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            }
          } catch (insertError) {
            lastError = insertError;
            console.error(`❌ Attempt ${attempt} exception:`, insertError);
            if (insertError instanceof Error) {
              console.error(`❌ Exception message:`, insertError.message);
              console.error(`❌ Exception stack:`, insertError.stack);
            }
            
            if (attempt < sessionMaxRetries) {
              const waitTime = attempt * 1000;
              console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }
        }

        // Final validation - if still no session, try one more time with minimal data
        if (!sessionData || !sessionData.id) {
          console.error('❌ All retry attempts failed, trying minimal session creation...');
          
          // Try with absolute minimal required fields
          // Ensure duration is a valid integer
          const validDuration = typeof duration === 'number' && !isNaN(duration) && duration > 0 
            ? Math.floor(duration) 
            : 0;
          
          const minimalPayload = {
            user_id: userId, // Use auth user ID
            title: `Study Session - ${new Date().toLocaleDateString()}`,
            description: 'Recording session',
            audio_uri: uri || '',
            duration: validDuration, // Ensure it's a valid integer
            transcript: '',
            summary: '',
            subjects: [], // Empty array
            tags: [], // Empty array
          };
          
          const { data: minimalData, error: minimalError } = await supabase
            .from('recording_sessions')
            .insert([minimalPayload])
            .select()
            .single();
          
          if (minimalError || !minimalData || !minimalData.id) {
            console.error('❌ Minimal session creation also failed:', minimalError);
            throw new Error(`Failed to create session after ${sessionMaxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
          }
          
          sessionData = minimalData;
          console.log('✅ Minimal session created successfully:', sessionData.id);
        }
      
      // Validate and normalize session data before returning
      const validatedSessionData: RecordingSession = {
        ...sessionData,
        duration: typeof sessionData.duration === 'number' && !isNaN(sessionData.duration) 
          ? Math.floor(sessionData.duration) 
          : 0,
        title: sessionData.title || 'Untitled Session',
        audio_uri: sessionData.audio_uri || '',
        transcript: sessionData.transcript || '',
        summary: sessionData.summary || '',
        description: sessionData.description || '',
        subjects: Array.isArray(sessionData.subjects) ? sessionData.subjects : [],
        tags: Array.isArray(sessionData.tags) ? sessionData.tags : [],
        created_at: sessionData.created_at || new Date().toISOString(),
        updated_at: sessionData.updated_at || new Date().toISOString(),
      };

      console.log('✅ Session validated successfully:', {
        id: validatedSessionData.id,
        title: validatedSessionData.title,
        duration: validatedSessionData.duration,
        durationType: typeof validatedSessionData.duration,
        hasTranscript: !!validatedSessionData.transcript,
        hasSummary: !!validatedSessionData.summary,
      });
      
      // Update sessionData to use validated version
      sessionData = validatedSessionData;

      // If we have a transcript but no summary or notes, generate them now
      const hasTranscript = sessionData.transcript && sessionData.transcript.trim().length > 10;
      const needsSummary = !sessionData.summary || 
                          sessionData.summary.trim().length < 10 || 
                          sessionData.summary === 'Recording session saved successfully' ||
                          sessionData.summary === 'Recording session completed successfully.';
      const needsNotes = !aiResults.stickyNotes || aiResults.stickyNotes.length === 0;

      if (hasTranscript && (needsSummary || needsNotes)) {
        console.log('🔄 Transcript exists but summary/notes missing, generating from transcript...');
        console.log('🔍 Needs summary:', needsSummary, 'Needs notes:', needsNotes);
        
        // Generate summary from transcript if missing
        if (needsSummary) {
          try {
            console.log('📝 Generating summary from transcript...');
            const generatedSummary = await this.generateSummaryFromTranscript(
              sessionData.id,
              sessionData.transcript,
              userId
            );
            if (generatedSummary && generatedSummary.trim().length > 10) {
              sessionData.summary = generatedSummary;
              validatedSessionData.summary = generatedSummary;
              console.log('✅ Summary generated and updated:', generatedSummary.substring(0, 50) + '...');
            } else {
              console.log('⚠️ Generated summary was too short or empty');
            }
          } catch (summaryError) {
            console.error('❌ Error generating summary from transcript:', summaryError);
          }
        }
        
        // Generate sticky notes from transcript if missing
        if (needsNotes) {
          try {
            console.log('📝 Generating sticky notes from transcript...');
            await this.generateStickyNotesFromTranscript(
              sessionData.id,
              sessionData.transcript,
              userId
            );
            // Wait a moment for database to sync, then reload notes
            await new Promise(resolve => setTimeout(resolve, 2000));
            const reloadedNotes = await this.getSessionStickyNotes(sessionData.id);
            if (reloadedNotes && reloadedNotes.length > 0) {
              aiResults.stickyNotes = reloadedNotes.map(note => ({
                title: note.title,
                content: note.content,
                type: note.type as any,
                color: note.color as any,
                priority: note.priority as any
              }));
              console.log('✅ Sticky notes generated and reloaded:', aiResults.stickyNotes.length);
            }
          } catch (notesError) {
            console.error('❌ Error generating notes from transcript:', notesError);
          }
        }
      }

      // Create sticky notes for this session - always try to create at least one
      try {
        const stickyNotesToCreate = aiResults.stickyNotes || [];
        
        // If no sticky notes from AI or transcript generation, create a default one
        if (stickyNotesToCreate.length === 0) {
          console.log('📝 No sticky notes from AI or transcript, checking if we need to generate...');
          
          // Only create default if we don't have a transcript to generate from
          if (!hasTranscript) {
            console.log('📝 No transcript available, creating default note...');
            stickyNotesToCreate.push({
              title: 'Recording Saved',
              content: 'Your recording has been saved successfully.',
              type: 'important',
              color: 'yellow',
              priority: 'medium'
            });
          } else {
            console.log('📝 Transcript available, notes should have been generated above');
          }
        }
        
        const sessionId = sessionData.id; // Get session ID once
        console.log(`📝 Creating ${stickyNotesToCreate.length} sticky notes for session ${sessionId}`);
        
        if (stickyNotesToCreate.length > 0) {
          // Insert all sticky notes at once for better performance
          // Validate and map colors to allowed values
          const allowedColors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
          const allowedTypes = ['task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip'];
          
          const stickyNotesToInsert = stickyNotesToCreate.map(noteData => {
            // Validate color - use 'yellow' as default if invalid
            let validColor = noteData.color || 'yellow';
            if (!allowedColors.includes(validColor)) {
              console.warn(`Invalid color "${validColor}", defaulting to "yellow"`);
              validColor = 'yellow';
            }
            
            // Validate type - use 'important' as default if invalid
            let validType = noteData.type || 'important';
            if (!allowedTypes.includes(validType)) {
              console.warn(`Invalid type "${validType}", defaulting to "important"`);
              validType = 'important';
            }
            
            return {
              session_id: sessionId, // Use the validated sessionId
              user_id: userId, // Use auth user ID to match auth.uid() in RLS policies
              title: noteData.title || 'Untitled Note',
              content: noteData.content || '',
              type: validType,
              color: validColor,
              priority: noteData.priority || 'medium',
              completed: false,
              image: null,
            };
          });

          console.log(`📝 Inserting ${stickyNotesToInsert.length} sticky notes with session_id: ${sessionId}`);
          console.log(`📝 First note preview:`, {
            session_id: stickyNotesToInsert[0]?.session_id,
            title: stickyNotesToInsert[0]?.title,
            type: stickyNotesToInsert[0]?.type,
            color: stickyNotesToInsert[0]?.color,
          });

          const { data: insertedNotes, error: stickyNoteError } = await supabase
            .from('session_sticky_notes')
            .insert(stickyNotesToInsert)
            .select('id, session_id, title, content, type, color, priority');

          if (stickyNoteError) {
            console.error('Error creating sticky notes:', stickyNoteError);
            // Try inserting one by one as fallback
            console.log('Trying to insert sticky notes one by one...');
            // Validate colors and types for individual insertions
            const allowedColors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
            const allowedTypes = ['task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip'];
            
            for (const noteData of stickyNotesToCreate) {
              try {
                // Validate color
                let validColor = noteData.color || 'yellow';
                if (!allowedColors.includes(validColor)) {
                  validColor = 'yellow';
                }
                
                // Validate type
                let validType = noteData.type || 'important';
                if (!allowedTypes.includes(validType)) {
                  validType = 'important';
                }
                
                console.log(`📝 Inserting individual note with session_id: ${sessionId}`);
                const { data: singleNoteData, error: singleNoteError } = await supabase
                  .from('session_sticky_notes')
                  .insert([
                    {
                      session_id: sessionId, // Use the validated sessionId
                      user_id: userId, // Use auth user ID to match auth.uid() in RLS policies
                      title: noteData.title || 'Untitled Note',
                      content: noteData.content || '',
                      type: validType,
                      color: validColor,
                      priority: noteData.priority || 'medium',
                      completed: false,
                      image: null,
                    }
                  ])
                  .select('id, session_id, title');

                if (singleNoteError) {
                  console.error('Error creating individual sticky note:', singleNoteError);
                } else {
                  console.log('✅ Created sticky note:', noteData.title);
                }
              } catch (err) {
                console.error('Error in individual note creation:', err);
              }
            }
          } else {
            console.log(`✅ Successfully created ${insertedNotes?.length || 0} sticky notes`);
          }
        } else {
          console.log('No sticky notes to create');
        }
      } catch (noteError) {
        console.error('Error creating sticky notes:', noteError);
        // If sticky notes failed but we have a transcript, try generating from transcript
        if (sessionData.transcript && sessionData.transcript.trim().length > 10) {
          console.log('🔄 Sticky notes failed, attempting to generate from transcript...');
          try {
            // Generate sticky notes from transcript as fallback
            await this.generateStickyNotesFromTranscript(
              sessionData.id,
              sessionData.transcript,
              userId
            );
          } catch (transcriptError) {
            console.error('Error generating sticky notes from transcript:', transcriptError);
            // Continue even if this fails - session is still valid
          }
        }
        // Continue even if sticky notes fail - session is still valid
      }

      console.log('✅ Recording session created successfully:', sessionData.id);
      console.log('Session data:', JSON.stringify(sessionData, null, 2));
      
      // Wait a moment for database to sync
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify the session exists with retry logic
      let verifySession = await this.getSessionById(sessionData.id);
      let retryCount = 0;
      const verifyMaxRetries = 5;
      
      while (!verifySession && retryCount < verifyMaxRetries) {
        console.log(`Session verification attempt ${retryCount + 1}/${verifyMaxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        verifySession = await this.getSessionById(sessionData.id);
        retryCount++;
      }
      
      if (!verifySession) {
        console.error('Session verification failed after multiple retries');
        // Return the validated session data anyway - it was created successfully
        // The result page will handle retrying the load
        console.log('Returning validated session data directly (verification failed but session exists)');
        return sessionData as RecordingSession;
      }
      
      // Validate the verified session as well
      const validatedVerifySession: RecordingSession = {
        ...verifySession,
        duration: typeof verifySession.duration === 'number' && !isNaN(verifySession.duration) 
          ? Math.floor(verifySession.duration) 
          : 0,
        title: verifySession.title || 'Untitled Session',
        audio_uri: verifySession.audio_uri || '',
        transcript: verifySession.transcript || '',
        summary: verifySession.summary || '',
        description: verifySession.description || '',
        subjects: Array.isArray(verifySession.subjects) ? verifySession.subjects : [],
        tags: Array.isArray(verifySession.tags) ? verifySession.tags : [],
        created_at: verifySession.created_at || new Date().toISOString(),
        updated_at: verifySession.updated_at || new Date().toISOString(),
      };
      
      console.log('✅ Session verified successfully');
      return validatedVerifySession;
    } catch (error) {
      console.error('Error stopping recording:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Instead of throwing, try to create a minimal session with just the audio
      // This ensures we can still navigate to the result page
      try {
        console.log('🔄 Attempting to create minimal session after error...');
        
        // Get auth user ID
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          console.error('❌ Not authenticated, cannot create session');
          throw error; // Re-throw if not authenticated
        }
        
        const userId = authUser.id;
        
        // Use the stored audio URI and duration from the try block
        const fallbackAudioUri = audioUri || '';
        // Ensure duration is a valid integer
        const fallbackDuration = typeof recordingDuration === 'number' && !isNaN(recordingDuration) && recordingDuration > 0
          ? Math.floor(recordingDuration)
          : 0;
        
        // Create minimal session
        const minimalSession = {
          user_id: userId,
          title: `Study Session - ${new Date().toLocaleDateString()}`,
          description: 'Recording session',
          audio_uri: fallbackAudioUri || '',
          duration: fallbackDuration, // Ensure it's a valid integer
          transcript: '', // Will be generated on result page
          summary: '',
          subjects: [], // Empty array
          tags: [], // Empty array
        };
        
        const { data: minimalData, error: minimalError } = await supabase
          .from('recording_sessions')
          .insert([minimalSession])
          .select()
          .single();
        
        if (minimalError || !minimalData) {
          console.error('❌ Failed to create minimal session:', minimalError);
          throw error; // Re-throw original error
        }
        
        console.log('✅ Created minimal session after error:', minimalData.id);
        
        // Generate sticky notes from transcript if available later
        // The result page will handle this
        
        return minimalData as RecordingSession;
      } catch (fallbackError) {
        console.error('❌ Fallback session creation also failed:', fallbackError);
        // Last resort: throw the original error
        throw error;
      }
    }
  }




}

export const recordingServiceSupabase = new RecordingServiceSupabase();
