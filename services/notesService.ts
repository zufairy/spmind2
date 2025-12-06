import { supabase, Note, StickyNote } from './supabase';
import { authService } from './authService';

export interface CreateNoteData {
  title: string;
  content: string;
  type: 'general' | 'homework' | 'study' | 'personal';
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
  tags: string[];
  is_pinned: boolean;
}

export interface CreateStickyNoteData {
  note_id: string;
  title: string;
  description: string;
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
  type: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational';
  tags: string[];
  position_x: number;
  position_y: number;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  type?: 'general' | 'homework' | 'study' | 'personal';
  color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
  tags?: string[];
  is_pinned?: boolean;
}

export interface UpdateStickyNoteData {
  title?: string;
  description?: string;
  color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
  type?: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational';
  tags?: string[];
  completed?: boolean;
  position_x?: number;
  position_y?: number;
}

class NotesService {
  async createNote(noteData: CreateNoteData): Promise<{ note: Note | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { note: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: currentUser.id,
            ...noteData,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { note: data, error: null };
    } catch (error: any) {
      return { note: null, error: error.message || 'Failed to create note' };
    }
  }

  async getNotes(): Promise<{ notes: Note[]; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { notes: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { notes: data || [], error: null };
    } catch (error: any) {
      return { notes: [], error: error.message || 'Failed to fetch notes' };
    }
  }

  async getNoteById(noteId: string): Promise<{ note: Note | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { note: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('user_id', currentUser.id)
        .single();

      if (error) throw error;
      return { note: data, error: null };
    } catch (error: any) {
      return { note: null, error: error.message || 'Failed to fetch note' };
    }
  }

  async updateNote(noteId: string, updates: UpdateNoteData): Promise<{ note: Note | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { note: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', noteId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      return { note: data, error: null };
    } catch (error: any) {
      return { note: null, error: error.message || 'Failed to update note' };
    }
  }

  async deleteNote(noteId: string): Promise<{ error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { error: 'User not authenticated' };
      }

      // Delete associated sticky notes first
      await supabase
        .from('sticky_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', currentUser.id);

      // Delete the note
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete note' };
    }
  }

  async searchNotes(query: string): Promise<{ notes: Note[]; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { notes: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { notes: data || [], error: null };
    } catch (error: any) {
      return { notes: [], error: error.message || 'Failed to search notes' };
    }
  }

  // Sticky Notes Methods
  async createStickyNote(stickyData: CreateStickyNoteData): Promise<{ stickyNote: StickyNote | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { stickyNote: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .insert([
          {
            user_id: currentUser.id,
            ...stickyData,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { stickyNote: data, error: null };
    } catch (error: any) {
      return { stickyNote: null, error: error.message || 'Failed to create sticky note' };
    }
  }

  async getStickyNotesByNoteId(noteId: string): Promise<{ stickyNotes: StickyNote[]; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { stickyNotes: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { stickyNotes: data || [], error: null };
    } catch (error: any) {
      return { stickyNotes: [], error: error.message || 'Failed to fetch sticky notes' };
    }
  }

  async getAllStickyNotes(): Promise<{ stickyNotes: StickyNote[]; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { stickyNotes: [], error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { stickyNotes: data || [], error: null };
    } catch (error: any) {
      return { stickyNotes: [], error: error.message || 'Failed to fetch sticky notes' };
    }
  }

  async updateStickyNote(stickyNoteId: string, updates: UpdateStickyNoteData): Promise<{ stickyNote: StickyNote | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { stickyNote: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('sticky_notes')
        .update(updates)
        .eq('id', stickyNoteId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      return { stickyNote: data, error: null };
    } catch (error: any) {
      return { stickyNote: null, error: error.message || 'Failed to update sticky note' };
    }
  }

  async deleteStickyNote(stickyNoteId: string): Promise<{ error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('sticky_notes')
        .delete()
        .eq('id', stickyNoteId)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete sticky note' };
    }
  }

  async toggleStickyNoteComplete(stickyNoteId: string): Promise<{ stickyNote: StickyNote | null; error: string | null }> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        return { stickyNote: null, error: 'User not authenticated' };
      }

      // Get current sticky note to toggle the completed status
      const { data: currentData, error: fetchError } = await supabase
        .from('sticky_notes')
        .select('completed')
        .eq('id', stickyNoteId)
        .eq('user_id', currentUser.id)
        .single();

      if (fetchError) throw fetchError;

      const newCompletedStatus = !currentData.completed;

      const { data, error } = await supabase
        .from('sticky_notes')
        .update({ completed: newCompletedStatus })
        .eq('id', stickyNoteId)
        .eq('user_id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      return { stickyNote: data, error: null };
    } catch (error: any) {
      return { stickyNote: null, error: error.message || 'Failed to toggle sticky note' };
    }
  }
}

export const notesService = new NotesService();
