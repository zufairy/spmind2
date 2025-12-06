import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { aiService } from '../services/aiService';
import {
  ChevronLeft,
  FileText,
  BookOpen,
  Lightbulb,
  Clock,
  Calendar,
  Tag,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Play,
  Pause,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { recordingServiceSupabase } from '../services/recordingServiceSupabase';
import { RecordingSession, SessionStickyNote, supabase } from '../services/supabase';
import { notesService } from '../services/notesService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProcessingProgress } from '../services/aiProcessingService';

const { width, height } = Dimensions.get('window');

export default function RecordingResultScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [stickyNotes, setStickyNotes] = useState<SessionStickyNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Chunking progress state
  const [chunkingProgress, setChunkingProgress] = useState<{
    currentChunk: number;
    totalChunks: number;
    message: string;
  } | null>(null);
  
  // Session title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Sticky note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [editingNoteContent, setEditingNoteContent] = useState('');
  

  


  // Audio playback states
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  // Generate sticky notes from transcript (independent of page loading)
  const generateStickyNotesFromTranscript = async (
    sessionId: string, 
    transcript: string, 
    userId: string
  ) => {
    try {
      console.log('🔄 Generating sticky notes from transcript for session:', sessionId);
      console.log('🔄 Transcript length:', transcript.length);
      
      // Get auth user ID to match RLS policy
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('❌ Not authenticated for sticky note generation');
        return;
      }
      
      const authUserId = authUser.id;
      
      // Create the prompt for sticky notes generation
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

      // Generate sticky notes using AI
      const response = await aiService.sendMessage(
        [{ role: 'user', content: stickyNotesPrompt }],
        'en'
      );

      console.log('🔄 AI Response received:', response.success);

      if (!response.success || !response.message) {
        console.error('❌ AI response failed');
        return;
      }

      // Parse the JSON response
      try {
        const stickyNotesData = JSON.parse(response.message);
        
        if (Array.isArray(stickyNotesData) && stickyNotesData.length > 0) {
          console.log(`✅ Generated ${stickyNotesData.length} sticky notes from transcript`);
          
          // Validate colors, types, and priorities according to database schema
          const allowedColors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
          const allowedTypes = ['task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip'];
          const allowedPriorities = ['high', 'medium', 'low'];
          
          // Save the new sticky notes directly to session_sticky_notes table
          let successCount = 0;
          for (const noteData of stickyNotesData) {
            try {
              // Validate and sanitize color
              let validColor: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red' = 'yellow';
              const colorInput = (noteData.color || 'yellow').toLowerCase().trim();
              if (allowedColors.includes(colorInput)) {
                validColor = colorInput as typeof validColor;
              } else {
                console.warn(`⚠️ Invalid color "${noteData.color}", defaulting to "yellow"`);
              }
              
              // Validate and sanitize type
              let validType: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip' = 'important';
              const typeInput = (noteData.type || 'important').toLowerCase().trim();
              if (allowedTypes.includes(typeInput)) {
                validType = typeInput as typeof validType;
              } else {
                console.warn(`⚠️ Invalid type "${noteData.type}", defaulting to "important"`);
              }
              
              // Validate and sanitize priority
              let validPriority: 'high' | 'medium' | 'low' = 'medium';
              const priorityInput = (noteData.priority || 'medium').toLowerCase().trim();
              if (allowedPriorities.includes(priorityInput)) {
                validPriority = priorityInput as typeof validPriority;
              } else {
                console.warn(`⚠️ Invalid priority "${noteData.priority}", defaulting to "medium"`);
              }
              
              // Truncate title to 255 characters (database constraint)
              const rawTitle = noteData.title || 'Key Point';
              const validTitle = rawTitle.length > 255 ? rawTitle.substring(0, 252) + '...' : rawTitle;
              
              // Sanitize content (can be null)
              const validContent: string | null = noteData.content && noteData.content.trim() ? noteData.content.trim() : null;
              
              // Ensure session_id and user_id are valid UUIDs
              if (!sessionId || typeof sessionId !== 'string') {
                console.error('❌ Invalid session_id:', sessionId);
                continue;
              }
              
              if (!authUserId || typeof authUserId !== 'string') {
                console.error('❌ Invalid user_id:', authUserId);
                continue;
              }
              
              console.log(`📝 Inserting sticky note:`, {
                session_id: sessionId,
                user_id: authUserId,
                title: validTitle.substring(0, 50) + '...',
                type: validType,
                color: validColor,
                priority: validPriority
              });
              
              const { data: stickyNote, error: stickyNoteError } = await supabase
                .from('session_sticky_notes')
                .insert([
                  {
                    session_id: sessionId,
                    user_id: authUserId,
                    title: validTitle,
                    content: validContent,
                    type: validType,
                    color: validColor,
                    priority: validPriority,
                    completed: false,
                    image: null,
                  }
                ] as any)
                .select()
                .single();

              if (stickyNoteError) {
                console.error('❌ Error creating sticky note:', {
                  error: stickyNoteError,
                  message: stickyNoteError.message,
                  details: stickyNoteError.details,
                  hint: stickyNoteError.hint,
                  code: stickyNoteError.code
                });
                // Continue with other notes even if one fails
              } else if (stickyNote && 'id' in stickyNote && 'title' in stickyNote) {
                successCount++;
                console.log('✅ Created sticky note:', (stickyNote as any).id, (stickyNote as any).title);
              }
            } catch (err) {
              console.error('❌ Exception creating sticky note:', err);
              // Continue with other notes
            }
          }
          
          console.log(`✅ Successfully created ${successCount} out of ${stickyNotesData.length} sticky notes`);
          
          // Reload the sticky notes after generation
          console.log('🔄 Reloading sticky notes after generation...');
          const updatedNotes = await recordingServiceSupabase.getSessionStickyNotes(sessionId);
          if (updatedNotes && updatedNotes.length > 0) {
            const sessionNotes: SessionStickyNote[] = updatedNotes.map(note => ({
              id: note.id,
              session_id: sessionId,
              user_id: userId,
              title: note.title,
              content: note.content || null,
              type: note.type,
              color: note.color,
              priority: note.priority,
              completed: note.completed || false,
              image: note.image || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));
            setStickyNotes(sessionNotes);
            console.log('✅ Updated sticky notes in UI:', sessionNotes.length);
          }
        } else {
          console.log('ℹ️ No educational content found in transcript to create sticky notes');
        }
      } catch (parseError) {
        console.error('❌ Error parsing AI response:', parseError);
      }
    } catch (error) {
      console.error('❌ Error generating sticky notes from transcript:', error);
      // Don't throw - this is a background operation
    }
  };

  const loadSessionData = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      // Ensure sessionId is a valid string
      const validSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;
      if (!validSessionId || typeof validSessionId !== 'string' || validSessionId.trim() === '') {
        console.error('❌ Invalid session ID:', sessionId);
        throw new Error('Invalid session ID provided');
      }
      
      console.log('🔍 Loading session with ID:', validSessionId);
      
      // Load session details with aggressive retry logic
      let sessionData = await recordingServiceSupabase.getSessionById(validSessionId);
      let attempts = 0;
      const maxAttempts = 10; // More attempts for reliability
      
      // Keep retrying until we find the session or exhaust attempts
      while (!sessionData && attempts < maxAttempts) {
        attempts++;
        console.log(`Loading session attempt ${attempts}/${maxAttempts}...`);
        
        // Exponential backoff: 1s, 2s, 3s, 4s, 5s...
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        sessionData = await recordingServiceSupabase.getSessionById(validSessionId);
        
        if (sessionData) {
          console.log('✅ Session found on attempt', attempts);
          break;
        }
      }
      
      if (!sessionData) {
        // Last resort: try querying directly from Supabase
        console.log('Attempting direct Supabase query as fallback...');
        try {
          const sessionIdStr = Array.isArray(sessionId) ? sessionId[0] : sessionId;
          const { data: directData, error: directError } = await supabase
            .from('recording_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
          
          if (!directError && directData && typeof directData === 'object' && 'id' in directData) {
            console.log('✅ Found session via direct query');
            sessionData = directData as unknown as RecordingSession;
          }
        } catch (directQueryError) {
          console.error('Direct query also failed:', directQueryError);
        }
      }
      
      if (!sessionData) {
        throw new Error(`Session not found after ${maxAttempts} attempts. The session may still be processing.`);
      }
      
      // CRITICAL: Validate session has id before proceeding
      if (!sessionData.id) {
        console.error('❌ CRITICAL ERROR: Session data missing id!', sessionData);
        throw new Error('Session data is invalid - missing session ID');
      }
      
      console.log('✅ Session loaded:', sessionData.id);
      console.log('✅ Session summary:', sessionData.summary ? 'present' : 'missing');
      console.log('✅ Session transcript:', sessionData.transcript ? 'present' : 'missing');
      setSession(sessionData);
      setEditingTitle(sessionData.title || '');

      // Check if summary is missing or empty, regenerate if needed
      const needsSummary = !sessionData.summary || 
                           typeof sessionData.summary !== 'string' || 
                           sessionData.summary.trim().length === 0 ||
                           sessionData.summary === 'Recording session saved successfully';
      
      if (needsSummary && sessionData.transcript && sessionData.transcript.trim().length > 10) {
        console.log('🔄 Summary missing or empty, regenerating from transcript...');
        // Generate summary in background
        (async () => {
          try {
            const { aiService } = await import('../services/aiService');
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

Transcript: ${sessionData.transcript}

Overall Summary:`;
            
            const response = await aiService.sendMessage(
              [{ role: 'user', content: summaryPrompt }],
              'en'
            );
            
            if (response.success && response.message && sessionData.id) {
              const summary = response.message.trim();
              if (summary && summary.length > 10) {
                const updateSuccess = await recordingServiceSupabase.updateSession(sessionData.id, { summary });
                if (updateSuccess) {
                  // Reload session to get fresh data from database
                  const updatedSession = await recordingServiceSupabase.getSessionById(sessionData.id);
                  if (updatedSession && updatedSession.id) {
                    setSession(updatedSession);
                    console.log('✅ Summary regenerated and session reloaded with summary');
                  } else {
                    // Fallback: update local state if reload fails
                    setSession(prev => prev && prev.id ? { ...prev, summary } : null);
                    console.log('✅ Summary regenerated, using local state update');
                  }
                } else {
                  console.error('❌ Failed to save summary to database');
                }
              }
            }
          } catch (error) {
            console.error('❌ Error regenerating summary:', error);
          }
        })();
      }

      // Load sticky notes for this session with retry
      let notes = await recordingServiceSupabase.getSessionStickyNotes(validSessionId);
      
      // Retry loading notes multiple times if not found
      let noteAttempts = 0;
      const maxNoteAttempts = 5;
      while ((!notes || notes.length === 0) && noteAttempts < maxNoteAttempts) {
        noteAttempts++;
        console.log(`Loading sticky notes attempt ${noteAttempts}/${maxNoteAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * noteAttempts));
        notes = await recordingServiceSupabase.getSessionStickyNotes(validSessionId);
        
        if (notes && notes.length > 0) {
          console.log('✅ Sticky notes found on attempt', noteAttempts);
          break;
        }
      }
      
      console.log('🔍 Loaded sticky notes from database:', notes);
      console.log('🔍 Notes length:', notes?.length || 0);
      
      if (notes && notes.length > 0) {
        // Convert StickyNote to SessionStickyNote format
        const sessionNotes: SessionStickyNote[] = notes.map(note => ({
          id: note.id,
          session_id: validSessionId,
          user_id: sessionData?.user_id || '',
          title: note.title,
          content: note.content || null,
          type: note.type,
          color: note.color,
          priority: note.priority,
          completed: note.completed || false,
          image: note.image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        console.log('🔍 Converted session notes:', sessionNotes);
        setStickyNotes(sessionNotes);
      } else {
        console.log('🔍 No sticky notes found in database - generating from transcript...');
        setStickyNotes([]);
        
        // Auto-generate sticky notes from transcript if available
        if (sessionData?.transcript && sessionData.transcript.trim().length > 10 && sessionData.id) {
          console.log('🔄 Auto-generating sticky notes from transcript...');
          // Generate sticky notes in the background without blocking UI
          generateStickyNotesFromTranscript(sessionData.id, sessionData.transcript, sessionData.user_id)
            .catch(error => {
              console.error('Error auto-generating sticky notes:', error);
              // Don't show error to user - just log it
            });
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recording session data';
      
      // Even if loading fails, try to generate sticky notes if we have session data
      if (session && session.id) {
        console.log('🔄 Session exists but loading failed, attempting to generate sticky notes from transcript...');
        if (session.transcript && session.transcript.trim().length > 10) {
          generateStickyNotesFromTranscript(session.id, session.transcript, session.user_id)
            .catch(err => console.error('Error generating sticky notes after load error:', err));
        }
      }
      
      // Show error but keep loading state active for auto-retry
      Alert.alert(
        'Loading Session', 
        errorMessage + '\n\nRetrying automatically...',
        [
          {
            text: 'Retry Now',
            onPress: () => loadSessionData(0)
          },
          {
            text: 'Wait',
            style: 'default',
            onPress: () => {
              // Auto-retry after 3 seconds
              setTimeout(() => loadSessionData(0), 3000);
            }
          }
        ]
      );
      
      // Auto-retry after 5 seconds
      setTimeout(() => {
        console.log('Auto-retrying session load...');
        loadSessionData(0);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Session title editing functions
  const handleEditTitle = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (!session || !editingTitle.trim()) return;
    
    try {
      // Update the session title in the database
      const success = await recordingServiceSupabase.updateSession(session.id, { 
        title: editingTitle.trim() 
      });
      
      if (success) {
        // Update local state
        setSession(prev => prev ? { ...prev, title: editingTitle.trim() } : null);
        setIsEditingTitle(false);
        Alert.alert('Success', 'Session title updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update session title');
      }
    } catch (error) {
      console.error('Error updating session title:', error);
      Alert.alert('Error', 'Failed to update session title');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditingTitle(session?.title || '');
  };

  const handleToggleNoteComplete = async (noteId: string) => {
    try {
      const updatedNotes = stickyNotes.map(note =>
        note.id === noteId ? { ...note, completed: !note.completed } : note
      );
      setStickyNotes(updatedNotes);

      // Update in database
      await recordingServiceSupabase.updateSessionStickyNote(noteId, {
        completed: !stickyNotes.find(n => n.id === noteId)?.completed
      });
    } catch (error) {
      console.error('Error updating note:', error);
      // Revert on error
      loadSessionData();
    }
  };



  const handleDeleteStickyNote = async (noteId: string) => {
    // Validate note ID before proceeding
    if (!noteId || noteId.trim() === '' || noteId === 'undefined') {
      console.error('Error: Note ID is undefined, empty, or invalid:', noteId);
      Alert.alert('Error', 'Cannot delete note: Note ID is missing');
      return;
    }

    Alert.alert(
      'Delete Sticky Note',
      'Are you sure you want to delete this sticky note? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Validate note ID again before deletion
              if (!noteId || noteId.trim() === '' || noteId === 'undefined') {
                console.error('Error: Note ID is undefined, empty, or invalid during deletion:', noteId);
                Alert.alert('Error', 'Cannot delete note: Note ID is missing');
                return;
              }

              // Delete directly from session_sticky_notes table
              const { error } = await supabase
                .from('session_sticky_notes')
                .delete()
                .eq('id', noteId as any);

              if (error) {
                console.error('Error deleting sticky note:', error);
                throw error;
              }

              // Update local state
              setStickyNotes(prev => prev.filter(note => note.id !== noteId));
              Alert.alert('Success', 'Sticky note deleted successfully!');
            } catch (error) {
              console.error('Error deleting sticky note:', error);
              Alert.alert('Error', 'Failed to delete sticky note');
            }
          },
        },
      ]
    );
  };

  const handleViewStickyNote = (note: SessionStickyNote) => {
    // Navigate to the sticky note detail page
    router.push({
      pathname: '/sticky-note-detail',
      params: {
        id: note.id,
        title: note.title,
        content: note.content,
        type: note.type,
        color: note.color,
        priority: note.priority,
        sessionId: sessionId as string,
      }
    });
  };

  const handleEditStickyNote = (note: SessionStickyNote) => {
    setEditingNoteId(note.id);
    setEditingNoteTitle(note.title);
    setEditingNoteContent(note.content || '');
  };

  const handleSaveStickyNote = async () => {
    if (!editingNoteId || !editingNoteTitle.trim()) return;
    
    try {
      // Update the sticky note in the database
      const success = await recordingServiceSupabase.updateSessionStickyNote(editingNoteId, {
        title: editingNoteTitle.trim(),
        content: editingNoteContent.trim()
      });
      
      if (success) {
        // Update local state
        setStickyNotes(prev => 
          prev.map(note => 
            note.id === editingNoteId 
              ? { ...note, title: editingNoteTitle.trim(), content: editingNoteContent.trim() }
              : note
          )
        );
        
        // Reset editing state
        setEditingNoteId(null);
        setEditingNoteTitle('');
        setEditingNoteContent('');
        
        Alert.alert('Success', 'Sticky note updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update sticky note');
      }
    } catch (error) {
      console.error('Error updating sticky note:', error);
      Alert.alert('Error', 'Failed to update sticky note');
    }
  };

  const handleCancelStickyNoteEdit = () => {
    setEditingNoteId(null);
    setEditingNoteTitle('');
    setEditingNoteContent('');
  };

  // Handle priority toggle for sticky notes
  const handleTogglePriority = async (noteId: string, currentPriority: string) => {
    try {
      // Define priority cycle: low -> medium -> high -> low
      const priorityCycle: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      const currentIndex = priorityCycle.indexOf(currentPriority as 'low' | 'medium' | 'high');
      const newPriority = priorityCycle[(currentIndex + 1) % priorityCycle.length] as 'low' | 'medium' | 'high';
      
      // Update in database
      const success = await recordingServiceSupabase.updateSessionStickyNote(noteId, {
        priority: newPriority
      });
      
      if (success) {
        // Update local state
        setStickyNotes(prev => 
          prev.map(note => 
            note.id === noteId ? { ...note, priority: newPriority } : note
          )
        );
        console.log(`✅ Priority updated to: ${newPriority}`);
      } else {
        console.error('❌ Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
      Alert.alert('Error', 'Failed to update priority');
    }
  };

  // Handle note type change for sticky notes
  const handleChangeNoteType = async (noteId: string, currentType: string) => {
    try {
      // Define available types
      const availableTypes: ('task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip')[] = ['exam', 'deadline', 'formula', 'definition', 'important', 'reminder', 'task', 'focus', 'todo', 'tip'];
      const currentIndex = availableTypes.indexOf(currentType as any);
      const newType = availableTypes[(currentIndex + 1) % availableTypes.length] as 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip';
      
      // Update in database
      const success = await recordingServiceSupabase.updateSessionStickyNote(noteId, {
        type: newType
      });
      
      if (success) {
        // Update local state
        setStickyNotes(prev => 
          prev.map(note => 
            note.id === noteId ? { ...note, type: newType } : note
          )
        );
        console.log(`✅ Note type updated to: ${newType}`);
      } else {
        console.error('❌ Failed to update note type');
      }
    } catch (error) {
      console.error('Error updating note type:', error);
      Alert.alert('Error', 'Failed to update note type');
    }
  };

  const handleRegenerateStickyNotes = async () => {
    if (!session) return;
    
    try {
      console.log('🔄 Regenerating sticky notes for session:', session.id);
      setLoading(true);
      
      // Check if we have a transcript
      if (!session.transcript || session.transcript.trim().length === 0) {
        Alert.alert('Error', 'No transcript available. Please ensure the recording was processed completely.');
        return;
      }
      
      // Check if transcript has meaningful content
      if (session.transcript.trim().length < 10) {
        Alert.alert('Error', 'Transcript is too short. Please ensure the recording contains clear speech.');
        return;
      }
      
      console.log('🔄 Session ID:', session.id);
      console.log('🔄 User ID:', session.user_id);
      console.log('🔄 Transcript length:', session.transcript.length);
      console.log('🔄 Transcript preview:', session.transcript.substring(0, 200) + '...');
      console.log('🔄 Using transcript:', session.transcript);
      
      // Check if there are already sticky notes for this session
      const { data: existingNotes, error: checkError } = await supabase
        .from('session_sticky_notes')
        .select('*')
        .eq('session_id', session.id as any);
      
      if (checkError) {
        console.error('🔄 Error checking existing notes:', checkError);
      } else {
        console.log('🔄 Existing notes in database:', existingNotes);
      }
      
      // Use the AI service directly
      
      // Create the prompt for sticky notes generation
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
4. Color (yellow, pink, green, blue, purple)
5. Priority (high, medium, low)

Transcript: ${session.transcript}

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

      // Generate sticky notes using AI
      const response = await aiService.sendMessage(
        [{ role: 'user', content: stickyNotesPrompt }],
        'en'
      );

      console.log('🔄 AI Response:', response);

      if (!response.success || !response.message) {
        throw new Error('AI response failed');
      }

      // Parse the JSON response
      try {
        const stickyNotesData = JSON.parse(response.message);
        
        if (Array.isArray(stickyNotesData) && stickyNotesData.length > 0) {
          // Validate colors, types, and priorities according to database schema
          const allowedColors = ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'red'];
          const allowedTypes = ['task', 'focus', 'important', 'todo', 'reminder', 'exam', 'deadline', 'formula', 'definition', 'tip'];
          const allowedPriorities = ['high', 'medium', 'low'];
          
          // Save the new sticky notes directly to session_sticky_notes table
          let successCount = 0;
          for (const noteData of stickyNotesData) {
            try {
              // Validate and sanitize color
              let validColor: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red' = 'yellow';
              const colorInput = (noteData.color || 'yellow').toLowerCase().trim();
              if (allowedColors.includes(colorInput)) {
                validColor = colorInput as typeof validColor;
              } else {
                console.warn(`⚠️ Invalid color "${noteData.color}", defaulting to "yellow"`);
              }
              
              // Validate and sanitize type
              let validType: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip' = 'important';
              const typeInput = (noteData.type || 'important').toLowerCase().trim();
              if (allowedTypes.includes(typeInput)) {
                validType = typeInput as typeof validType;
              } else {
                console.warn(`⚠️ Invalid type "${noteData.type}", defaulting to "important"`);
              }
              
              // Validate and sanitize priority
              let validPriority: 'high' | 'medium' | 'low' = 'medium';
              const priorityInput = (noteData.priority || 'medium').toLowerCase().trim();
              if (allowedPriorities.includes(priorityInput)) {
                validPriority = priorityInput as typeof validPriority;
              } else {
                console.warn(`⚠️ Invalid priority "${noteData.priority}", defaulting to "medium"`);
              }
              
              // Truncate title to 255 characters (database constraint)
              const rawTitle = noteData.title || 'Key Point';
              const validTitle = rawTitle.length > 255 ? rawTitle.substring(0, 252) + '...' : rawTitle;
              
              // Sanitize content (can be null)
              const validContent: string | null = noteData.content && noteData.content.trim() ? noteData.content.trim() : null;
              
              // Ensure session_id and user_id are valid
              if (!session.id || typeof session.id !== 'string') {
                console.error('❌ Invalid session_id:', session.id);
                continue;
              }
              
              if (!session.user_id || typeof session.user_id !== 'string') {
                console.error('❌ Invalid user_id:', session.user_id);
                continue;
              }
              
              console.log(`📝 Inserting sticky note:`, {
                session_id: session.id,
                user_id: session.user_id,
                title: validTitle.substring(0, 50) + '...',
                type: validType,
                color: validColor,
                priority: validPriority
              });
              
              const { data: stickyNote, error: stickyNoteError } = await supabase
                .from('session_sticky_notes')
                .insert([
                  {
                    session_id: session.id,
                    user_id: session.user_id,
                    title: validTitle,
                    content: validContent,
                    type: validType,
                    color: validColor,
                    priority: validPriority,
                    completed: false,
                    image: null,
                  }
                ] as any)
                .select()
                .single();

              if (stickyNoteError) {
                console.error('❌ Error creating sticky note:', {
                  error: stickyNoteError,
                  message: stickyNoteError.message,
                  details: stickyNoteError.details,
                  hint: stickyNoteError.hint,
                  code: stickyNoteError.code
                });
                // Continue with other notes instead of throwing
                continue;
              }
              
              if (stickyNote && 'id' in stickyNote && 'title' in stickyNote) {
                successCount++;
                console.log('✅ Created sticky note:', (stickyNote as any).id, (stickyNote as any).title);
              }
            } catch (err) {
              console.error('❌ Exception creating sticky note:', err);
              // Continue with other notes
            }
          }
          
          console.log(`✅ Successfully created ${successCount} out of ${stickyNotesData.length} sticky notes`);
          
          if (successCount === 0) {
            throw new Error('Failed to create any sticky notes');
          }
          
          // Reload the data
          await loadSessionData();
          Alert.alert('Success', 'Sticky notes generated successfully!');
        } else {
          Alert.alert('Info', 'No educational content found in the transcript to create sticky notes.');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        Alert.alert('Error', 'Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error regenerating sticky notes:', error);
      Alert.alert('Error', 'Failed to generate sticky notes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (stickyNote: SessionStickyNote) => {
    try {
      // Map the color to a compatible type for notes
      const colorMap: { [key: string]: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' } = {
        yellow: 'yellow',
        pink: 'pink',
        green: 'green',
        blue: 'blue',
        purple: 'purple',
        orange: 'yellow', // Map orange to yellow
        red: 'pink', // Map red to pink
      };

      const noteData = {
        title: stickyNote.title,
        content: stickyNote.content || '',
        type: 'study' as const,
        color: colorMap[stickyNote.color] || 'yellow',
        tags: [],
        is_pinned: false,
      };

      const { note, error } = await notesService.createNote(noteData);
      if (error) {
        Alert.alert('Error', error);
      } else {
        Alert.alert('Success', 'Note saved to your collection!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const formatDuration = (duration: number | null | undefined) => {
    if (!duration || isNaN(duration) || duration <= 0) {
      return '0:00';
    }
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  // Audio playback functions
  const loadAudio = async () => {
    if (!session?.audio_uri) return;

    try {
      // Unload any existing sound
      if (sound) {
        await sound.unloadAsync();
      }

      // Create new sound object with volume boost for loudspeaker
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: session.audio_uri },
        { 
          shouldPlay: false,
          volume: 1.0, // Maximum volume
          rate: 1.0, // Normal playback speed
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
    } catch (error) {
      console.error('Error loading audio:', error);
      Alert.alert('Error', 'Failed to load audio file');
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
      }
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Error toggling playback:', error);
      Alert.alert('Error', 'Failed to control audio playback');
    }
  };



  // Load audio when session changes
  useEffect(() => {
    if (session?.audio_uri) {
      loadAudio();
    }

    // Cleanup function
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [session?.audio_uri]);

  // Configure audio for loudspeaker playback
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false, // This ensures loudspeaker usage
        });
      } catch (error) {
        console.error('Error configuring audio mode:', error);
      }
    };

    configureAudio();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={48} color="#667eea" />
        <Text style={styles.loadingText}>Loading recording result...</Text>
        
        {/* Show chunking progress if available */}
        {chunkingProgress && (
          <View style={styles.chunkingProgressContainer}>
            <Text style={styles.chunkingProgressText}>
              {chunkingProgress.message}
            </Text>
            <View style={styles.chunkingProgressBar}>
              <View 
                style={[
                  styles.chunkingProgressFill, 
                  { 
                    width: `${(chunkingProgress.currentChunk / chunkingProgress.totalChunks) * 100}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.chunkingProgressDetails}>
              Chunk {chunkingProgress.currentChunk} of {chunkingProgress.totalChunks}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (!session && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <Text style={styles.errorSubtext}>
          The session may still be processing. Please wait or try again.
        </Text>
        <View style={styles.errorButtons}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              loadSessionData(0);
            }}
          >
            <Text style={styles.retryButtonText}>Retry Loading</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Show loading if we don't have session yet or session is invalid
  if (!session || !session.id) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={48} color="#667eea" />
        <Text style={styles.loadingText}>Loading session...</Text>
        <Text style={styles.loadingSubtext}>
          {!session 
            ? 'This may take a few moments while we process your recording.'
            : 'Session data is loading, please wait...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d1b69', '#1a1a1a']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            {isEditingTitle ? (
              <View style={styles.titleEditContainer}>
                <TextInput
                  style={styles.titleInput}
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  placeholder="Enter session title..."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  autoFocus
                />
                <View style={styles.titleEditActions}>
                  <TouchableOpacity
                    style={styles.titleSaveButton}
                    onPress={handleSaveTitle}
                  >
                    <Text style={styles.titleSaveButtonText}>💾</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.titleCancelButton}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.titleCancelButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.titleDisplayContainer}>
                <Text style={styles.title}>{session.title}</Text>
                <TouchableOpacity
                  style={styles.titleEditButton}
                  onPress={handleEditTitle}
                >
                  <Text style={styles.titleEditButtonText}>✏️</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Session Info */}
          <Animatable.View animation="fadeInUp" delay={100} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#667eea" />
              <Text style={styles.infoText}>
                Duration: {formatDuration(session?.duration || 0)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={16} color="#667eea" />
              <Text style={styles.infoText}>
                {formatDate(session?.created_at || new Date().toISOString())}
              </Text>
            </View>
          </Animatable.View>

          {/* Audio Player Section */}
          {session.audio_uri && (
            <Animatable.View animation="fadeInUp" delay={150} style={styles.audioSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.audioIcon}>🎵</Text>
                  <Text style={styles.sectionTitle}>Listen to Your Recording</Text>
                </View>
              </View>
              
                            <View style={styles.audioPlayerContainer}>
                <View style={styles.audioControlsRow}>
                  {/* Left: Play Button */}
                  <TouchableOpacity
                    style={[styles.playButton, isPlaying && styles.playButtonActive]}
                    onPress={togglePlayback}
                    disabled={!sound}
                  >
                    {isPlaying ? (
                      <Pause size={28} color="#fff" />
                    ) : (
                      <Play size={28} color="#fff" />
                    )}
                  </TouchableOpacity>
                  
                  {/* Center: Tap to Play Text */}
                  <View style={styles.audioCenterText}>
                    <Text style={styles.audioStatus}>
                      {!sound ? '🔄 Loading...' : isPlaying ? '🎶 Playing' : '⏸️ Paused'}
                    </Text>
                    <Text style={styles.audioHint}>Tap to {isPlaying ? 'pause' : 'play'}</Text>
                  </View>
                  
                  {/* Right: Transcript Icon Button */}
                  <TouchableOpacity
                    style={styles.transcriptIconButton}
                    onPress={() => {
                      if (session?.id) {
                        router.push(`/transcript?sessionId=${session.id}`);
                      }
                    }}
                    disabled={!session?.id}
                  >
                    <FileText size={20} color={session?.id ? "#4ECDC4" : "#666"} />
                  </TouchableOpacity>
                </View>
                
              </View>
            </Animatable.View>
          )}



          {/* Summary Section */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BookOpen size={24} color="#4ECDC4" />
                <Text style={styles.sectionTitle}>✨ Smart Summary</Text>
              </View>
            </View>
            
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryIcon}>🧠</Text>
                <Text style={styles.summarySubtitle}>AI understands you said:</Text>
              </View>
              <Text style={styles.summaryText}>
                {session?.summary && typeof session.summary === 'string' && session.summary.trim() 
                  ? session.summary 
                  : 'No summary available yet. Processing...'}
              </Text>
              
              {/* Show chunking info if this was a long recording */}
              {session?.duration && session.duration > 480000 && ( // 8 minutes in milliseconds
                <View style={styles.chunkingInfoContainer}>
                  <Text style={styles.chunkingInfoIcon}>🔀</Text>
                  <Text style={styles.chunkingInfoText}>
                    This long recording was processed using intelligent chunking for optimal results
                  </Text>
                </View>
              )}
            </View>
          </Animatable.View>

          {/* Sticky Notes Section */}
          <Animatable.View animation="fadeInUp" delay={300} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Lightbulb size={24} color="#FFD93D" />
                <Text style={styles.sectionTitle}>💡 Important Notes</Text>
              </View>
            </View>
            
            {stickyNotes.length === 0 ? (
              <View style={styles.noNotesContainer}>
                <Text style={styles.noNotesIcon}>🤔</Text>
                <Text style={styles.noNotesText}>No important notes found yet</Text>
                <Text style={styles.noNotesHint}>Sticky notes are automatically generated when you stop recording. If none appeared, try regenerating them.</Text>
                <TouchableOpacity
                  style={[styles.regenerateButton, loading && styles.regenerateButtonDisabled]}
                  onPress={handleRegenerateStickyNotes}
                  disabled={loading}
                >
                  <Text style={styles.regenerateButtonText}>
                    {loading ? '⏳ Regenerating...' : '🔄 Regenerate Sticky Notes'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.notesGrid}>
                {stickyNotes.map((note, index) => (
                  <TouchableOpacity
                    key={note.id}
                    onPress={() => handleViewStickyNote(note)}
                    style={styles.noteWrapper}
                    activeOpacity={0.7}
                  >
                    <Animatable.View 
                      animation="fadeInUp" 
                      delay={index * 100}
                      useNativeDriver={true}
                      style={[
                        styles.noteCard, 
                        { 
                          backgroundColor: getNoteColor(note.color),
                          transform: [
                            { rotate: `${(index % 3 - 1) * 2}deg` },
                            { scale: 0.98 + (index % 3) * 0.01 }
                          ]
                        }
                      ]}
                    >
                      {/* Subtle pattern overlay for texture */}
                      <View style={styles.patternOverlay} />
                      
                      {/* Tear effect at top */}
                      <View style={styles.tearEffect} />
                      
                      <View style={styles.noteHeader}>
                        <TouchableOpacity
                          style={styles.noteTypeBadge}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleChangeNoteType(note.id, note.type);
                          }}
                        >
                          <Text style={styles.noteTypeEmoji}>{getNoteTypeEmoji(note.type)}</Text>
                          <Text style={styles.noteTypeText}>{note.type}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteStickyNote(note.id);
                          }}
                        >
                          <Trash2 size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={styles.noteTitle}>
                        {note.title.includes('exam') ? '📝 ' : 
                         note.title.includes('formula') ? '🧮 ' : 
                         note.title.includes('definition') ? '📚 ' : 
                         note.title.includes('deadline') ? '⏰ ' : 
                         '📌 '}{note.title}
                      </Text>
                      
                      {/* Tap indicator */}
                      <Text style={styles.tapIndicator}>👆 Tap to read more</Text>
                      
                      {note.content && note.content.trim() && (() => {
                        const contentText = note.content!;
                        const words = contentText.split(' ');
                        return (
                          <Text style={styles.noteContent} numberOfLines={3}>
                            {words.map((word, wordIndex) => {
                              // Highlight important words (dates, numbers, key terms)
                              const isImportant = /\d+/.test(word) || 
                                                /exam|test|quiz|deadline|due|important|key|formula|definition/.test(word.toLowerCase());
                              return (
                                <Text 
                                  key={wordIndex} 
                                  style={[
                                    styles.noteWord,
                                    isImportant && styles.highlightedWord
                                  ]}
                                >
                                  {word}{wordIndex < words.length - 1 ? ' ' : ''}
                                </Text>
                              );
                            })}
                          </Text>
                        );
                      })()}
                      
                      <View style={styles.noteFooter}>
                        <TouchableOpacity
                          style={styles.priorityBadge}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleTogglePriority(note.id, note.priority);
                          }}
                        >
                          <Text style={styles.priorityText}>
                            {note.priority === 'high' ? '🔥' : note.priority === 'medium' ? '⚡' : '💫'} {note.priority}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </Animatable.View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Animatable.View>
        </ScrollView>


          
      </LinearGradient>
    </View>
  );
}

const getNoteColor = (color: string) => {
  const colors: { [key: string]: string } = {
    yellow: '#FFF9C4',
    pink: '#F8BBD9',
    green: '#C8E6C9',
    blue: '#BBDEFB',
    purple: '#E1BEE7',
    orange: '#FFCC80',
    red: '#FFCDD2',
  };
  return colors[color] || '#FFF9C4';
};

const getNoteTypeColor = (type: string) => {
  const typeColors: { [key: string]: string } = {
    task: 'rgba(255, 107, 157, 0.2)',
    focus: 'rgba(78, 205, 196, 0.2)',
    important: 'rgba(255, 217, 61, 0.2)',
    todo: 'rgba(255, 107, 157, 0.2)',
    reminder: 'rgba(78, 205, 196, 0.2)',
    exam: 'rgba(255, 107, 157, 0.2)',
    deadline: 'rgba(255, 107, 157, 0.2)',
    formula: 'rgba(78, 205, 196, 0.2)',
    definition: 'rgba(255, 217, 61, 0.2)',
    tip: 'rgba(78, 205, 196, 0.2)',
  };
  return typeColors[type] || 'rgba(102, 126, 234, 0.2)';
};

const getNoteTypeEmoji = (type: string) => {
  const typeEmojis: { [key: string]: string } = {
    task: '📋',
    focus: '🎯',
    important: '⭐',
    todo: '✅',
    reminder: '⏰',
    exam: '📝',
    deadline: '⏳',
    formula: '🧮',
    definition: '📚',
    tip: '💡',
  };
  return typeEmojis[type] || '📝';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  chunkingProgressContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chunkingProgressText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  chunkingProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  chunkingProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  chunkingProgressDetails: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  titleDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleEditButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleEditButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  titleEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
  },
  titleEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleSaveButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.4)',
  },
  titleSaveButtonText: {
    fontSize: 16,
    color: '#00FF00',
  },
  titleCancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  titleCancelButtonText: {
    fontSize: 16,
    color: '#FF0000',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },

  audioSection: {
    marginBottom: 32,
  },
  audioPlayerContainer: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.2)',
    alignItems: 'center',
    gap: 16,
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  audioIcon: {
    fontSize: 28,
  },
  playButton: {
    backgroundColor: '#FF6B9D',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonActive: {
    backgroundColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
  },
  audioCenterText: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  audioStatus: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  audioHint: {
    color: '#FF6B9D',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    opacity: 0.8,
  },
  transcriptIconButton: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },

  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryContainer: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    fontSize: 24,
  },
  summarySubtitle: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  chunkingInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  chunkingInfoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  chunkingInfoText: {
    color: '#4ECDC4',
    fontSize: 14,
    flex: 1,
    fontStyle: 'italic',
  },

  noNotesContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  noNotesIcon: {
    fontSize: 48,
  },
  noNotesText: {
    color: '#999',
    fontSize: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noNotesHint: {
    color: '#667eea',
    fontSize: 14,
    textAlign: 'center',
  },
  regenerateButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 16,
    borderWidth: 2,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  regenerateButtonDisabled: {
    backgroundColor: '#ccc',
    borderColor: '#ccc',
  },
  notesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  noteWrapper: {
    width: '48%', // Two columns with gap
    marginBottom: 12,
    // Interactive shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    opacity: 0.05,
    // Subtle dot pattern
    backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
    backgroundSize: '8px 8px',
  },
  tearEffect: {
    position: 'absolute',
    top: -2,
    left: '50%',
    width: 20,
    height: 4,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    transform: [{ translateX: -10 }],
  },
  noteCard: {
    aspectRatio: 1, // Make it square
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.15)',
    // Paper texture effect
    backgroundColor: 'rgba(255,255,255,0.95)',
    // Sticky note effect
    borderStyle: 'solid',
    borderTopWidth: 3,
    borderTopColor: 'rgba(0,0,0,0.2)',
    // Interactive hover effect
    transform: [{ scale: 1 }],
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editNoteButton: {
    padding: 4,
    backgroundColor: 'rgba(78, 205, 196, 0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  editNoteButtonText: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  noteTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    // Fun shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noteTypeEmoji: {
    fontSize: 14,
    marginRight: 4,
    // Fun glow effect
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    textAlign: 'center',
    // Handwritten underline effect
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(0,0,0,0.3)',
    // Fun shadow effect
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tapIndicator: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  deleteButton: {
    padding: 4,
    // Fun hover effect
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  noteContent: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'cursive',
    textAlign: 'left',
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    // Fun handwritten effect
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  noteEditMode: {
    flex: 1,
    gap: 8,
  },
  noteTitleInput: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
  },
  noteContentInput: {
    fontSize: 13,
    color: '#444',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    textAlign: 'left',
    minHeight: 60,
  },
  noteEditActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  noteSaveButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 0, 0.4)',
  },
  noteSaveButtonText: {
    fontSize: 16,
    color: '#00FF00',
  },
  noteCancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.4)',
  },
  noteCancelButtonText: {
    fontSize: 16,
    color: '#FF0000',
  },
  noteWord: {
    fontSize: 13,
    color: '#444',
    fontFamily: Platform.OS === 'ios' ? 'Bradley Hand' : 'cursive',
  },
  highlightedWord: {
    backgroundColor: 'rgba(255,255,0,0.6)',
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 3,
    textDecorationLine: 'underline',
    textDecorationColor: '#FF6B9D',
    // Fun glow effect
    textShadowColor: '#FF6B9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  priorityBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    // Fun shadow effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Marker Felt' : 'monospace',
    // Fun glow effect
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  noteType: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    // Fun shadow effect
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  noteTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
    // Fun glow effect
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },

  backButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
