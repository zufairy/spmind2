import { supabase } from './supabase';

export interface LeaderboardUser {
  id: string;
  full_name: string;
  username: string | null;
  points: number;
  avatar_url: string | null;
  region: string | null;
  state: string | null;
  country: string | null;
  rank: number;
}

export interface PointsHistoryEntry {
  id: string;
  user_id: string;
  points_earned: number;
  source: string;
  description: string | null;
  created_at: string;
}

class LeaderboardService {
  /**
   * Get leaderboard filtered by region, state, country, or global
   */
  async getLeaderboard(
    filterType: 'region' | 'state' | 'country' | 'global' = 'region',
    filterValue: string | null = null,
    limit: number = 100
  ): Promise<LeaderboardUser[]> {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', {
        p_filter_type: filterType,
        p_filter_value: filterValue,
        p_limit: limit,
      });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get leaderboard for user's own region
   */
  async getRegionalLeaderboard(userId: string, limit: number = 100): Promise<LeaderboardUser[]> {
    try {
      // First get user's region
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('region, state, country')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user location:', userError);
        // Fall back to global leaderboard
        return this.getLeaderboard('global', null, limit);
      }

      // Get leaderboard for user's region
      const region = userData.region || userData.state || userData.country;
      const filterType = userData.region ? 'region' : userData.state ? 'state' : 'country';

      return this.getLeaderboard(filterType, region, limit);
    } catch (error) {
      console.error('Exception in getRegionalLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get national leaderboard (same country)
   */
  async getNationalLeaderboard(userId: string, limit: number = 100): Promise<LeaderboardUser[]> {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('country')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return this.getLeaderboard('global', null, limit);
      }

      return this.getLeaderboard('country', userData.country || 'Malaysia', limit);
    } catch (error) {
      console.error('Exception in getNationalLeaderboard:', error);
      return [];
    }
  }

  /**
   * Get global leaderboard (all users)
   */
  async getGlobalLeaderboard(limit: number = 100): Promise<LeaderboardUser[]> {
    return this.getLeaderboard('global', null, limit);
  }

  /**
   * Add points to user
   */
  async addPoints(
    userId: string,
    points: number,
    source: string,
    sourceId?: string,
    description?: string
  ): Promise<{ newTotalPoints: number; pointsAdded: number } | null> {
    try {
      const { data, error } = await supabase.rpc('add_points_to_user', {
        p_user_id: userId,
        p_points: points,
        p_source: source,
        p_source_id: sourceId || null,
        p_description: description || null,
      });

      if (error) {
        console.error('Error adding points:', error);
        return null;
      }

      return {
        newTotalPoints: data[0]?.new_total_points || 0,
        pointsAdded: data[0]?.points_added || 0,
      };
    } catch (error) {
      console.error('Exception in addPoints:', error);
      return null;
    }
  }

  /**
   * Complete daily brain boost and earn points
   */
  async completeDailyBrainBoost(
    userId: string,
    mode: 'quiz' | 'flashcard' | 'memory' | 'speed',
    score: number,
    questionsAnswered: number,
    correctAnswers: number,
    timeSpentSeconds: number
  ): Promise<{ sessionId: string; pointsEarned: number; newTotalPoints: number } | null> {
    try {
      const { data, error } = await supabase.rpc('complete_daily_brain_boost', {
        p_user_id: userId,
        p_mode: mode,
        p_score: score,
        p_questions_answered: questionsAnswered,
        p_correct_answers: correctAnswers,
        p_time_spent_seconds: timeSpentSeconds,
      });

      if (error) {
        console.error('Error completing daily brain boost:', error);
        return null;
      }

      return {
        sessionId: data[0]?.session_id || '',
        pointsEarned: data[0]?.points_earned || 0,
        newTotalPoints: data[0]?.new_total_points || 0,
      };
    } catch (error) {
      console.error('Exception in completeDailyBrainBoost:', error);
      return null;
    }
  }

  /**
   * Complete game and earn points
   */
  async completeGame(
    userId: string,
    gameType: 'word_bomb' | 'silat_master' | 'spell_bird' | 'other',
    gameId: string,
    score: number,
    rank?: number,
    totalPlayers?: number,
    durationSeconds?: number
  ): Promise<{ scoreId: string; pointsEarned: number; newTotalPoints: number } | null> {
    try {
      const { data, error } = await supabase.rpc('complete_game', {
        p_user_id: userId,
        p_game_type: gameType,
        p_game_id: gameId,
        p_score: score,
        p_rank: rank || null,
        p_total_players: totalPlayers || null,
        p_duration_seconds: durationSeconds || null,
      });

      if (error) {
        console.error('Error completing game:', error);
        return null;
      }

      return {
        scoreId: data[0]?.score_id || '',
        pointsEarned: data[0]?.points_earned || 0,
        newTotalPoints: data[0]?.new_total_points || 0,
      };
    } catch (error) {
      console.error('Exception in completeGame:', error);
      return null;
    }
  }

  /**
   * Get user's points history
   */
  async getPointsHistory(userId: string, limit: number = 50): Promise<PointsHistoryEntry[]> {
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching points history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception in getPointsHistory:', error);
      return [];
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(
    userId: string,
    filterType: 'region' | 'state' | 'country' | 'global' = 'global'
  ): Promise<number | null> {
    try {
      const leaderboard = await this.getRegionalLeaderboard(userId, 1000);
      const userEntry = leaderboard.find(u => u.id === userId);
      return userEntry?.rank || null;
    } catch (error) {
      console.error('Exception in getUserRank:', error);
      return null;
    }
  }

  /**
   * Update user's location
   */
  async updateUserLocation(
    userId: string,
    city: string,
    state: string,
    country: string = 'Malaysia',
    region?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          city,
          state,
          country,
          region: region || state, // Default region to state if not provided
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user location:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Exception in updateUserLocation:', error);
      return false;
    }
  }
}

export const leaderboardService = new LeaderboardService();

