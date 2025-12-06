export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_sessions: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          subject: string
          topic: string | null
          question: string
          ai_answer: string
          question_type: 'homework' | 'study' | 'quiz' | 'explanation' | 'practice' | 'general'
          difficulty_level: 'easy' | 'medium' | 'hard'
          syllabus_alignment: 'KSSR' | 'KSSM' | 'both'
          grade_level: string | null
          language_used: 'english' | 'malay' | 'mixed'
          response_time_ms: number | null
          user_rating: number | null
          is_helpful: boolean | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          subject: string
          topic?: string | null
          question: string
          ai_answer: string
          question_type: 'homework' | 'study' | 'quiz' | 'explanation' | 'practice' | 'general'
          difficulty_level: 'easy' | 'medium' | 'hard'
          syllabus_alignment: 'KSSR' | 'KSSM' | 'both'
          grade_level?: string | null
          language_used: 'english' | 'malay' | 'mixed'
          response_time_ms?: number | null
          user_rating?: number | null
          is_helpful?: boolean | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          subject?: string
          topic?: string | null
          question?: string
          ai_answer?: string
          question_type?: 'homework' | 'study' | 'quiz' | 'explanation' | 'practice' | 'general'
          difficulty_level?: 'easy' | 'medium' | 'hard'
          syllabus_alignment?: 'KSSR' | 'KSSM' | 'both'
          grade_level?: string | null
          language_used?: 'english' | 'malay' | 'mixed'
          response_time_ms?: number | null
          user_rating?: number | null
          is_helpful?: boolean | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "recording_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          type: 'general' | 'homework' | 'study' | 'personal'
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          tags: string[]
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          type: 'general' | 'homework' | 'study' | 'personal'
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          tags?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          type?: 'general' | 'homework' | 'study' | 'personal'
          color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          tags?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recording_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          audio_uri: string
          duration: number
          transcript: string | null
          summary: string | null
          subjects: string[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          audio_uri: string
          duration: number
          transcript?: string | null
          summary?: string | null
          subjects?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          audio_uri?: string
          duration?: number
          transcript?: string | null
          summary?: string | null
          subjects?: string[]
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recording_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_participants: {
        Row: {
          id: string
          session_id: string
          user_id: string
          participant_name: string
          participant_role: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          participant_name: string
          participant_role: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          participant_name?: string
          participant_role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "recording_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      session_sticky_notes: {
        Row: {
          id: string
          session_id: string
          user_id: string
          title: string
          content: string | null
          type: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip'
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red'
          priority: 'high' | 'medium' | 'low'
          completed: boolean
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          title: string
          content?: string | null
          type: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip'
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red'
          priority: 'high' | 'medium' | 'low'
          completed?: boolean
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          title?: string
          content?: string | null
          type?: 'task' | 'focus' | 'important' | 'todo' | 'reminder' | 'exam' | 'deadline' | 'formula' | 'definition' | 'tip'
          color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'red'
          priority?: 'high' | 'medium' | 'low'
          completed?: boolean
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_sticky_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "recording_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_sticky_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      sticky_notes: {
        Row: {
          id: string
          note_id: string | null
          user_id: string
          title: string
          description: string
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          type: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational'
          completed: boolean
          tags: string[]
          position_x: number
          position_y: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          note_id?: string | null
          user_id: string
          title: string
          description: string
          color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          type: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational'
          completed?: boolean
          tags?: string[]
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          note_id?: string | null
          user_id?: string
          title?: string
          description?: string
          color?: 'yellow' | 'pink' | 'green' | 'blue' | 'purple'
          type?: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational'
          completed?: boolean
          tags?: string[]
          position_x?: number
          position_y?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sticky_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sticky_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          subject: string
          topic: string
          level: 'KSSR' | 'KSSM'
          grade: '1' | '2' | '3' | '4' | '5' | '6' | 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'
          last_score: number | null
          total_attempts: number
          mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'master'
          last_session_id: string | null
          last_studied_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          topic: string
          level: 'KSSR' | 'KSSM'
          grade: '1' | '2' | '3' | '4' | '5' | '6' | 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'
          last_score?: number | null
          total_attempts?: number
          mastery_level?: 'beginner' | 'intermediate' | 'advanced' | 'master'
          last_session_id?: string | null
          last_studied_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          topic?: string
          level?: 'KSSR' | 'KSSM'
          grade?: '1' | '2' | '3' | '4' | '5' | '6' | 'Form 1' | 'Form 2' | 'Form 3' | 'Form 4' | 'Form 5'
          last_score?: number | null
          total_attempts?: number
          mastery_level?: 'beginner' | 'intermediate' | 'advanced' | 'master'
          last_session_id?: string | null
          last_studied_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_last_session_id_fkey"
            columns: ["last_session_id"]
            isOneToOne: false
            referencedRelation: "recording_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          total_sessions: number
          last_session_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          total_sessions?: number
          last_session_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          total_sessions?: number
          last_session_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          username: string | null
          bio: string | null
          avatar_url: string | null
          school: string
          age: number
          birth_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          school: string
          age: number
          birth_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          username?: string | null
          bio?: string | null
          avatar_url?: string | null
          school?: string
          age?: number
          birth_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_streak: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier usage
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

// Convenience type aliases for the new tables
export type UserProgress = Tables<"user_progress">
export type UserProgressInsert = TablesInsert<"user_progress">
export type UserProgressUpdate = TablesUpdate<"user_progress">

export type AISession = Tables<"ai_sessions">
export type AISessionInsert = TablesInsert<"ai_sessions">
export type AISessionUpdate = TablesUpdate<"ai_sessions">

// Existing table type aliases for backward compatibility
export type User = Tables<"users">
export type UserInsert = TablesInsert<"users">
export type UserUpdate = TablesUpdate<"users">

export type Note = Tables<"notes">
export type NoteInsert = TablesInsert<"notes">
export type NoteUpdate = TablesUpdate<"notes">

export type StickyNote = Tables<"sticky_notes">
export type StickyNoteInsert = TablesInsert<"sticky_notes">
export type StickyNoteUpdate = TablesUpdate<"sticky_notes">

export type RecordingSession = Tables<"recording_sessions">
export type RecordingSessionInsert = TablesInsert<"recording_sessions">
export type RecordingSessionUpdate = TablesUpdate<"recording_sessions">

export type SessionStickyNote = Tables<"session_sticky_notes">
export type SessionStickyNoteInsert = TablesInsert<"session_sticky_notes">
export type SessionStickyNoteUpdate = TablesUpdate<"session_sticky_notes">

export type SessionParticipant = Tables<"session_participants">
export type SessionParticipantInsert = TablesInsert<"session_participants">
export type SessionParticipantUpdate = TablesUpdate<"session_participants">
