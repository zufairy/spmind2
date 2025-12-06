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
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
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

        console.log('Recording stopped, processing audio file:', uri);
        console.log('Audio URI type:', typeof uri);
        console.log('Audio URI format:', uri?.substring(0, 50) + '...');

        // Save to Supabase
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated');
        }

        // Process audio with AI to generate transcript, summary, and notes
        // This will automatically use chunking for large files (>20MB or >8 minutes)
        console.log('🎯 Starting AI processing of recorded audio...');
        console.log('📁 Audio URI:', uri);
        console.log('⏱️ Recording duration:', duration, 'ms');
        
        const aiResults = await aiProcessingService.processAudio(uri, onProgress);

        // Create recording session with AI-generated content
        const { data: sessionData, error: sessionError } = await supabase
          .from('recording_sessions')
          .insert([
            {
              user_id: currentUser.id,
              title: `Study Session - ${new Date().toLocaleDateString()}`,
              description: `Recording session`,
              audio_uri: uri,
              duration,
              transcript: aiResults.transcript,
              summary: aiResults.summary,
              subjects: ['General Study'],
              tags: ['recording'],
            }
          ])
          .select()
          .single();

      if (sessionError) {
        console.error('Error creating recording session:', sessionError);
        console.error('Error details:', JSON.stringify(sessionError));
        
        // If database insertion fails, return a mock session so recording can still work
        console.log('Database insertion failed, returning mock session');
        
        // Create sticky notes for mock session too
        try {
          for (const noteData of aiResults.stickyNotes) {
            const { data: stickyNote, error: stickyNoteError } = await supabase
              .from('session_sticky_notes')
              .insert([
                {
                  session_id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
                  user_id: currentUser.id,
                  title: noteData.title,
                  content: noteData.content,
                  type: noteData.type,
                  color: noteData.color,
                  priority: noteData.priority,
                  completed: false,
                  image: null,
                }
              ])
              .select()
              .single();

            if (stickyNoteError) {
              console.error('Error creating sticky note in mock session:', stickyNoteError);
            } else {
              console.log('✅ Created sticky note in mock session:', stickyNote);
            }
          }
        } catch (noteError) {
          console.error('Error creating sticky notes in mock session:', noteError);
        }
        
        const mockSession = {
          id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
          user_id: currentUser.id,
          title: `Study Session - ${new Date().toLocaleDateString()}`,
          description: `Recording session`,
          audio_uri: uri,
          duration,
          transcript: aiResults.transcript,
          summary: aiResults.summary,
          subjects: ['General Study'],
          tags: ['recording'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as RecordingSession;
        
        console.log('Returning mock session:', mockSession);
        return mockSession;
      }

      // Create sticky notes for this session
      try {
        for (const noteData of aiResults.stickyNotes) {
          // Insert directly into session_sticky_notes table
          const { data: stickyNote, error: stickyNoteError } = await supabase
            .from('session_sticky_notes')
            .insert([
              {
                session_id: sessionData.id,
                user_id: currentUser.id,
                title: noteData.title,
                content: noteData.content,
                type: noteData.type,
                color: noteData.color,
                priority: noteData.priority,
                completed: false,
                image: null,
              }
            ])
            .select()
            .single();

          if (stickyNoteError) {
            console.error('Error creating sticky note:', stickyNoteError);
            throw stickyNoteError;
          }
          
          console.log('✅ Created sticky note:', stickyNote);
        }
        console.log('Sticky notes created successfully');
      } catch (noteError) {
        console.error('Error creating sticky notes:', noteError);
        // Continue even if sticky notes fail
      }

      console.log('Recording session created successfully:', sessionData.id);
      console.log('Session data:', sessionData);
      return sessionData;
    } catch (error) {
      console.error('Error stopping recording:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // Even if there's an error, try to return a mock session so recording can work
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          // Process audio with AI even for mock session
          // This will automatically use chunking for large files (>20MB or >8 minutes)
          console.log('🎯 Starting AI processing for fallback session...');
          const aiResults = await aiProcessingService.processAudio(audioUri || 'unknown', onProgress);
          
          // Create sticky notes for mock session too
          try {
            for (const noteData of aiResults.stickyNotes) {
              const { data: stickyNote, error: stickyNoteError } = await supabase
                .from('session_sticky_notes')
                .insert([
                  {
                    session_id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
                    user_id: currentUser.id,
                    title: noteData.title,
                    content: noteData.content,
                    type: noteData.type,
                    color: noteData.color,
                    priority: noteData.priority,
                    completed: false,
                    image: null,
                  }
                ])
                .select()
                .single();

              if (stickyNoteError) {
                console.error('Error creating sticky note in fallback:', stickyNoteError);
              } else {
                console.log('✅ Created sticky note in fallback:', stickyNote);
              }
            }
          } catch (noteError) {
            console.error('Error creating sticky notes in fallback:', noteError);
          }
          
          const mockSession = {
            id: `00000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
            user_id: currentUser.id,
            title: `Study Session - ${new Date().toLocaleDateString()}`,
            description: `Recording session`,
            audio_uri: audioUri || 'unknown',
            duration: recordingDuration,
            transcript: aiResults.transcript,
            summary: aiResults.summary,
            subjects: ['General Study'],
            tags: ['recording'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as RecordingSession;
          
          console.log('Returning mock session after error:', mockSession);
          return mockSession;
        }
      } catch (fallbackError) {
        console.error('Fallback session creation also failed:', fallbackError);
      }
      
      return null;
    }
  }




}

export const recordingServiceSupabase = new RecordingServiceSupabase();
