import { supabase } from './supabase';
import { AISession, AISessionInsert, UserProgress, UserProgressInsert } from '../src/types/database.types';

// Types for function parameters
export interface LogAISessionParams {
  user_id: string;
  session_id?: string | null;
  subject: string;
  topic?: string | null;
  question: string;
  ai_answer: string;
  question_type: 'homework' | 'study' | 'quiz' | 'explanation' | 'practice' | 'general';
  difficulty_level: 'easy' | 'medium' | 'hard';
  syllabus_alignment: 'KSSR' | 'KSSM' | 'both';
  grade_level?: string | null;
  language_used: 'english' | 'malay' | 'mixed';
  response_time_ms?: number | null;
  user_rating?: number | null;
  is_helpful?: boolean | null;
  tags?: string[];
}

export interface UpdateUserProgressParams {
  user_id: string;
  subject: string;
  topic: string;
  last_score: number;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'master';
  last_session_id?: string | null;
}

// Error handling type
export interface ServiceError {
  success: false;
  error: string;
  code?: string;
}

export interface ServiceSuccess<T> {
  success: true;
  data: T;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceError;

/**
 * Log an AI session interaction
 */
export async function logAISession(params: LogAISessionParams): Promise<ServiceResult<AISession>> {
  try {
    const aiSessionData: AISessionInsert = {
      user_id: params.user_id,
      session_id: params.session_id || null,
      subject: params.subject,
      topic: params.topic || null,
      question: params.question,
      ai_answer: params.ai_answer,
      question_type: params.question_type,
      difficulty_level: params.difficulty_level,
      syllabus_alignment: params.syllabus_alignment,
      grade_level: params.grade_level || null,
      language_used: params.language_used,
      response_time_ms: params.response_time_ms || null,
      user_rating: params.user_rating || null,
      is_helpful: params.is_helpful || null,
      tags: params.tags || [],
    };

    const { data, error } = await supabase
      .from('ai_sessions')
      .insert(aiSessionData)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to log AI session: ${error.message}`,
        code: error.code,
      };
    }

    return {
      success: true,
      data: data as AISession,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error logging AI session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get user progress for a specific subject and topic
 */
export async function getUserProgress(
  userId: string,
  subject: string,
  topic: string
): Promise<ServiceResult<UserProgress | null>> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .eq('topic', topic)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user hasn't studied this topic yet
        return {
          success: true,
          data: null,
        };
      }
      return {
        success: false,
        error: `Failed to fetch user progress: ${error.message}`,
        code: error.code,
      };
    }

    return {
      success: true,
      data: data as UserProgress,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error fetching user progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update user progress - creates new entry or updates existing one
 */
export async function updateUserProgress(params: UpdateUserProgressParams): Promise<ServiceResult<UserProgress>> {
  try {
    // First, check if progress entry exists
    const existingProgress = await getUserProgress(params.user_id, params.subject, params.topic);
    
    if (!existingProgress.success) {
      return existingProgress;
    }

    if (existingProgress.data) {
      // Update existing entry
      const { data, error } = await supabase
        .from('user_progress')
        .update({
          last_score: params.last_score,
          total_attempts: existingProgress.data.total_attempts + 1,
          mastery_level: params.mastery_level,
          last_session_id: params.last_session_id || null,
          last_studied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.data.id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to update user progress: ${error.message}`,
          code: error.code,
        };
      }

      return {
        success: true,
        data: data as UserProgress,
      };
    } else {
      // Create new entry
      const newProgressData: UserProgressInsert = {
        user_id: params.user_id,
        subject: params.subject,
        topic: params.topic,
        level: params.syllabus_alignment === 'KSSR' ? 'KSSR' : 'KSSM', // Infer from syllabus alignment
        grade: 'Form 1', // Default grade - should be passed as parameter in real implementation
        last_score: params.last_score,
        total_attempts: 1,
        mastery_level: params.mastery_level,
        last_session_id: params.last_session_id || null,
        last_studied_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_progress')
        .insert(newProgressData)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: `Failed to create user progress: ${error.message}`,
          code: error.code,
        };
      }

      return {
        success: true,
        data: data as UserProgress,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error updating user progress: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get the latest AI session for a user
 */
export async function getLastAISession(userId: string): Promise<ServiceResult<AISession | null>> {
  try {
    const { data, error } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user has no AI sessions
        return {
          success: true,
          data: null,
        };
      }
      return {
        success: false,
        error: `Failed to fetch last AI session: ${error.message}`,
        code: error.code,
      };
    }

    return {
      success: true,
      data: data as AISession,
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error fetching last AI session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get all AI sessions for a user with optional filtering
 */
export async function getUserAISessions(
  userId: string,
  options?: {
    subject?: string;
    question_type?: string;
    limit?: number;
    offset?: number;
  }
): Promise<ServiceResult<AISession[]>> {
  try {
    let query = supabase
      .from('ai_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.subject) {
      query = query.eq('subject', options.subject);
    }

    if (options?.question_type) {
      query = query.eq('question_type', options.question_type);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: `Failed to fetch user AI sessions: ${error.message}`,
        code: error.code,
      };
    }

    return {
      success: true,
      data: data as AISession[],
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error fetching user AI sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get user progress summary for all subjects
 */
export async function getUserProgressSummary(userId: string): Promise<ServiceResult<UserProgress[]>> {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_studied_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Failed to fetch user progress summary: ${error.message}`,
        code: error.code,
      };
    }

    return {
      success: true,
      data: data as UserProgress[],
    };
  } catch (error) {
    return {
      success: false,
      error: `Unexpected error fetching user progress summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
