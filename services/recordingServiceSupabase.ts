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
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      const { data, error } = await supabase
        .from('recording_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }

      return data;
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

      const { error } = await supabase
        .from('recording_sessions')
        .update(updates)
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
        const duration = Date.now() - this.recordingStartTime;
        
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
        currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        console.log('👤 User authenticated:', currentUser.id);

        // Process audio with AI to generate transcript, summary, and notes
        // This will automatically use chunking for large files (>20MB or >8 minutes)
        console.log('🎯 Starting AI processing of recorded audio...');
        console.log('📁 Audio URI:', uri);
        console.log('⏱️ Recording duration:', duration, 'ms');
        
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
        } catch (aiError) {
          console.error('⚠️ AI processing failed, using fallback:', aiError);
          // Create fallback content if AI processing fails
          aiResults = {
            transcript: 'Audio recording completed. Transcription unavailable.',
            summary: 'Recording session completed successfully.',
            stickyNotes: [{
              title: 'Recording Complete',
              content: 'Your recording has been saved successfully.',
              type: 'important',
              color: 'yellow',
              priority: 'medium'
            }]
          };
          console.log('📝 Using fallback content for session');
        }

        // Create recording session with AI-generated content
        // Use robust algorithm with multiple retry attempts
        let sessionData: any = null;
        
        // Prepare session data with safe defaults
        const sessionPayload = {
          user_id: currentUser.id,
          title: `Study Session - ${new Date().toLocaleDateString()}`,
          description: `Recording session`,
          audio_uri: uri,
          duration,
          transcript: aiResults.transcript || 'Recording completed',
          summary: aiResults.summary || 'Recording session saved successfully',
          subjects: ['General Study'],
          tags: ['recording'],
        };
        
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
            // First, try insert with select
            const { data: attemptData, error: attemptError } = await supabase
              .from('recording_sessions')
              .insert([sessionPayload])
              .select()
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
                .eq('user_id', currentUser.id)
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
                  .eq('user_id', currentUser.id)
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
          const minimalPayload = {
            user_id: currentUser.id,
            title: `Study Session - ${new Date().toLocaleDateString()}`,
            description: 'Recording session',
            audio_uri: uri,
            duration: duration,
            transcript: '',
            summary: '',
            subjects: [],
            tags: [],
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
      
      console.log('✅ Session validated successfully:', {
        id: sessionData.id,
        title: sessionData.title,
        hasTranscript: !!sessionData.transcript,
        hasSummary: !!sessionData.summary,
      });

      // Create sticky notes for this session - always try to create at least one
      try {
        const stickyNotesToCreate = aiResults.stickyNotes || [];
        
        // If no sticky notes from AI, create a default one
        if (stickyNotesToCreate.length === 0) {
          console.log('📝 No sticky notes from AI, creating default note...');
          stickyNotesToCreate.push({
            title: 'Recording Saved',
            content: 'Your recording has been saved successfully.',
            type: 'important',
            color: 'yellow',
            priority: 'medium'
          });
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
              user_id: currentUser.id,
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
                      user_id: currentUser.id,
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
        // Return the session data anyway - it was created successfully
        // The result page will handle retrying the load
        console.log('Returning session data directly (verification failed but session exists)');
        return sessionData as RecordingSession;
      }
      
      console.log('✅ Session verified successfully');
      return verifySession;
    } catch (error) {
      console.error('Error stopping recording:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Don't return mock sessions - throw the error so the UI can handle it properly
      throw error;
    }
  }




}

export const recordingServiceSupabase = new RecordingServiceSupabase();
