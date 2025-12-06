import { supabase } from './supabase';

export interface BrainBoostSession {
  id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  mode: 'quiz' | 'flashcard' | 'memory' | 'speed' | 'practice';
  subject: string | null;
  topics: string[] | null;
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  points_earned: number;
  streak_day: number;
  created_at: string;
}

export interface BrainBoostStats {
  total_sessions: number;
  total_time_minutes: number;
  average_score: number;
  perfect_scores: number;
  current_streak: number;
  total_points_earned: number;
  favorite_subject: string;
  total_questions_answered: number;
}

class BrainBoostHistoryService {
  /**
   * Create a new brain boost session
   */
  async createSession(
    userId: string,
    mode: 'quiz' | 'flashcard' | 'memory' | 'speed' | 'practice',
    subject?: string,
    topics?: string[],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_brain_boost_session', {
        p_user_id: userId,
        p_mode: mode,
        p_subject: subject || null,
        p_topics: topics || null,
        p_difficulty: difficulty,
      });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Exception in createSession:', error);
      return null;
    }
  }

  /**
   * Complete a brain boost session
   */
  async completeSession(
    sessionId: string,
    durationSeconds: number,
    totalQuestions: number,
    correctAnswers: number,
    scorePercentage: number
  ): Promise<{ pointsEarned: number } | null> {
    try {
      const { data, error } = await supabase.rpc('complete_brain_boost_session', {
        p_session_id: sessionId,
        p_duration_seconds: durationSeconds,
        p_total_questions: totalQuestions,
        p_correct_answers: correctAnswers,
        p_score_percentage: scorePercentage,
      });

      if (error) {
        console.error('Error completing session:', error);
        return null;
      }

      return {
        pointsEarned: data[0]?.points_earned || 0,
      };
    } catch (error) {
      console.error('Exception in completeSession:', error);
      return null;
    }
  }

  /**
   * Record a brain boost session (simplified - all in one call)
   */
  async recordSession(
    userId: string,
    mode: 'quiz' | 'flashcard' | 'memory' | 'speed' | 'practice',
    subject: string,
    topics: string[],
    durationSeconds: number,
    totalQuestions: number,
    correctAnswers: number,
    scorePercentage: number,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<{ sessionId: string; pointsEarned: number } | null> {
    try {
      // Calculate points
      let pointsEarned = scorePercentage;
      if (scorePercentage === 100) {
        pointsEarned += 50; // Perfect bonus
      } else if (scorePercentage >= 90) {
        pointsEarned += 25;
      } else if (scorePercentage >= 80) {
        pointsEarned += 10;
      }

      // Get current streak
      const { data: recentSessions } = await supabase
        .from('brain_boost_history')
        .select('streak_day')
        .eq('user_id', userId)
        .gte('session_date', new Date(Date.now() - 86400000).toISOString().split('T')[0])
        .order('streak_day', { ascending: false })
        .limit(1);

      const streakDay = (recentSessions && recentSessions[0]?.streak_day || 0) + 1;

      // Insert session record
      const { data, error } = await supabase
        .from('brain_boost_history')
        .insert({
          user_id: userId,
          mode,
          subject,
          topics,
          duration_seconds: durationSeconds,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          wrong_answers: totalQuestions - correctAnswers,
          score_percentage: scorePercentage,
          difficulty_level: difficulty,
          points_earned: pointsEarned,
          streak_day: streakDay,
          completed: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording session:', error);
        return null;
      }

      // Update user points
      await supabase
        .from('users')
        .update({ points: supabase.sql`points + ${pointsEarned}` })
        .eq('id', userId);

      return {
        sessionId: data.id,
        pointsEarned,
      };
    } catch (error) {
      console.error('Exception in recordSession:', error);
      return null;
    }
  }

  /**
   * Get user's brain boost history
   */
  async getHistory(userId: string, limit: number = 50): Promise<BrainBoostSession[]> {
    try {
      const { data, error } = await supabase
        .from('brain_boost_history')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true)
        .order('session_date', { ascending: false })
        .order('session_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getHistory:', error);
      return [];
    }
  }

  /**
   * Get user's brain boost statistics
   */
  async getStats(userId: string): Promise<BrainBoostStats | null> {
    try {
      const { data, error } = await supabase
        .from('brain_boost_history')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', true);

      if (error || !data || data.length === 0) {
        return null;
      }

      // Calculate stats
      const totalSessions = data.length;
      const totalTime = data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const avgScore = data.reduce((sum, s) => sum + (s.score_percentage || 0), 0) / totalSessions;
      const perfectScores = data.filter(s => s.score_percentage === 100).length;
      const totalPoints = data.reduce((sum, s) => sum + (s.points_earned || 0), 0);
      const totalQuestions = data.reduce((sum, s) => sum + (s.total_questions || 0), 0);
      
      // Get favorite subject
      const subjectCounts: { [key: string]: number } = {};
      data.forEach(s => {
        if (s.subject) {
          subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + 1;
        }
      });
      const favoriteSubject = Object.keys(subjectCounts).sort((a, b) => 
        subjectCounts[b] - subjectCounts[a]
      )[0] || 'N/A';
      
      // Get current streak
      const currentStreak = Math.max(...data.map(s => s.streak_day || 0));

      return {
        total_sessions: totalSessions,
        total_time_minutes: totalTime,
        average_score: Math.round(avgScore * 10) / 10,
        perfect_scores: perfectScores,
        current_streak: currentStreak,
        total_points_earned: totalPoints,
        favorite_subject: favoriteSubject,
        total_questions_answered: totalQuestions,
      };
    } catch (error) {
      console.error('Exception in getStats:', error);
      return null;
    }
  }
}

export const brainBoostHistoryService = new BrainBoostHistoryService();

