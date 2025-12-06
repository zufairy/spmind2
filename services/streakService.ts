import { supabase } from './supabase';
import { Database } from '../src/types/database.types';

type UserStreak = Database['public']['Tables']['user_streaks']['Row'];
type StreakData = Pick<UserStreak, 'current_streak' | 'longest_streak' | 'total_sessions' | 'last_session_date'>;

interface StreakUpdateResult {
  current_streak: number;
  longest_streak: number;
  total_sessions: number;
  streak_activated: boolean;
  message?: string;
}

class StreakService {
  // Get user's current streak
  async getUserStreak(userId: string): Promise<StreakData | null> {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no streak exists yet, return default
        if (error.code === 'PGRST116') {
          return {
            current_streak: 0,
            longest_streak: 0,
            total_sessions: 0,
            last_session_date: null,
          };
        }
        console.error('Error fetching streak:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserStreak:', error);
      return null;
    }
  }

  // Update streak when user confirms Daily Brain Boost
  async activateStreak(userId: string): Promise<StreakUpdateResult | null> {
    try {
      const { data, error } = await supabase
        .rpc('update_user_streak', { p_user_id: userId });

      if (error) {
        console.error('Error activating streak:', error);
        return null;
      }

      // Database function returns JSON, cast to our interface
      return data as unknown as StreakUpdateResult;
    } catch (error) {
      console.error('Error in activateStreak:', error);
      return null;
    }
  }

  // Check if user can activate streak today (hasn't done it yet)
  async canActivateToday(userId: string): Promise<boolean> {
    try {
      const streak = await this.getUserStreak(userId);
      
      if (!streak || !streak.last_session_date) {
        return true; // No streak yet, can activate
      }

      const today = new Date().toISOString().split('T')[0];
      const lastSession = streak.last_session_date.split('T')[0];

      return today !== lastSession; // Can activate if not done today
    } catch (error) {
      console.error('Error checking if can activate:', error);
      return true; // Default to allowing activation
    }
  }

  // Get week visualization (for home page)
  getWeekVisualization(currentStreak: number): boolean[] {
    const daysInWeek = 7;
    const completedDays = Math.min(currentStreak, daysInWeek);
    
    return Array.from({ length: daysInWeek }, (_, i) => i < completedDays);
  }

  // Get actual dates for the current week (last 7 days including today)
  getWeekDates(): Array<{ date: number; day: string; isToday: boolean; month: string }> {
    const today = new Date();
    const weekDates = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      weekDates.push({
        date: date.getDate(),
        day: date.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue, etc.
        month: date.toLocaleDateString('en-US', { month: 'short' }), // Jan, Feb, etc.
        isToday: i === 0,
      });
    }

    return weekDates;
  }

  // Check which days in the week have sessions
  async getWeekSessionDays(userId: string, lastSessionDate: string | null): Promise<boolean[]> {
    if (!lastSessionDate) {
      return [false, false, false, false, false, false, false];
    }

    const lastSession = new Date(lastSessionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastSession.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
    
    // If last session was more than 6 days ago, show all uncompleted
    if (daysDiff > 6) {
      return [false, false, false, false, false, false, false];
    }

    // Show completed days in the week
    const weekStatus = [false, false, false, false, false, false, false];
    
    // Mark the last 7 days based on streak
    const streak = await this.getUserStreak(userId);
    if (streak) {
      const completedInWeek = Math.min(streak.current_streak, 7);
      for (let i = 0; i < completedInWeek; i++) {
        weekStatus[6 - i] = true; // Fill from right to left (most recent = rightmost)
      }
    }

    return weekStatus;
  }
}

export const streakService = new StreakService();

