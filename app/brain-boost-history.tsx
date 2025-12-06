import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Brain, 
  Clock, 
  Target, 
  Trophy,
  TrendingUp,
  Calendar,
  Zap,
  Award,
  BookOpen,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

interface BrainBoostSession {
  id: string;
  session_date: string;
  session_time: string;
  duration_minutes: number;
  mode: string;
  subject: string;
  topics: string[];
  score_percentage: number;
  total_questions: number;
  correct_answers: number;
  points_earned: number;
  streak_day: number;
  created_at: string;
}

interface BrainBoostStats {
  total_sessions: number;
  total_time_minutes: number;
  average_score: number;
  perfect_scores: number;
  current_streak: number;
  total_points_earned: number;
  favorite_subject: string;
  total_questions_answered: number;
}

export default function BrainBoostHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<BrainBoostSession[]>([]);
  const [stats, setStats] = useState<BrainBoostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Fetch data
    if (user?.id) {
      fetchHistory();
      fetchStats();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('brain_boost_history')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', true)
        .order('session_date', { ascending: false })
        .order('session_time', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching history:', error);
        setSessions([]);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Exception fetching history:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get aggregated stats
      const { data, error } = await supabase
        .from('brain_boost_history')
        .select('*')
        .eq('user_id', user?.id)
        .eq('completed', true);

      if (error || !data || data.length === 0) {
        setStats(null);
        return;
      }

      // Calculate stats from data
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
      const favoriteSubject = Object.keys(subjectCounts).sort((a, b) => subjectCounts[b] - subjectCounts[a])[0] || 'N/A';
      
      // Get current streak
      const currentStreak = Math.max(...data.map(s => s.streak_day || 0));

      setStats({
        total_sessions: totalSessions,
        total_time_minutes: totalTime,
        average_score: Math.round(avgScore * 10) / 10,
        perfect_scores: perfectScores,
        current_streak: currentStreak,
        total_points_earned: totalPoints,
        favorite_subject: favoriteSubject,
        total_questions_answered: totalQuestions,
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
      setStats(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'quiz': return '📝';
      case 'flashcard': return '🎴';
      case 'memory': return '🧠';
      case 'speed': return '⚡';
      default: return '📚';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#00FF00';
    if (score >= 70) return '#FFD700';
    if (score >= 50) return '#FFA500';
    return '#FF6B6B';
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('../assets/images/bg.jpg')}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        <View style={styles.headerBlurOverlay} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Brain Boost History</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        {stats && (
          <Animatable.View animation="fadeInUp" delay={200}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#4ECDC4' }]}>
                  <Brain size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.total_sessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FFD700' }]}>
                  <Trophy size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.average_score}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#FF6B6B' }]}>
                  <Zap size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.current_streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#9B59B6' }]}>
                  <Clock size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.statNumber}>{stats.total_time_minutes}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
            </View>
          </Animatable.View>
        )}

        {/* Summary Card */}
        {stats && (
          <Animatable.View animation="fadeInUp" delay={300} style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Progress</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>🎯 Perfect Scores:</Text>
              <Text style={styles.summaryValue}>{stats.perfect_scores}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>⭐ Total Points:</Text>
              <Text style={styles.summaryValue}>{stats.total_points_earned}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>📚 Favorite Subject:</Text>
              <Text style={styles.summaryValue}>{stats.favorite_subject}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>❓ Questions Answered:</Text>
              <Text style={styles.summaryValue}>{stats.total_questions_answered}</Text>
            </View>
          </Animatable.View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Loading your history...</Text>
          </View>
        )}

        {/* Sessions List */}
        {!loading && sessions.length === 0 && (
          <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
            <Brain size={64} color="#666666" />
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyText}>Start a Daily Brain Boost to see your history here!</Text>
          </Animatable.View>
        )}

        {!loading && sessions.length > 0 && (
          <View style={styles.sessionsList}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.map((session, index) => (
              <Animatable.View
                key={session.id}
                animation="fadeInUp"
                delay={400 + (index * 50)}
                style={styles.sessionCard}
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionLeft}>
                    <Text style={styles.sessionMode}>{getModeIcon(session.mode)} {session.mode.toUpperCase()}</Text>
                    <Text style={styles.sessionDate}>
                      {formatDate(session.session_date)} • {formatTime(session.session_time)}
                    </Text>
                  </View>
                  <View style={[styles.scorebadge, { backgroundColor: getScoreColor(session.score_percentage) }]}>
                    <Text style={styles.scoreBadgeText}>{session.score_percentage}%</Text>
                  </View>
                </View>

                <View style={styles.sessionContent}>
                  {/* Subject */}
                  {session.subject && (
                    <View style={styles.sessionRow}>
                      <BookOpen size={16} color="#999999" />
                      <Text style={styles.sessionDetail}>{session.subject}</Text>
                    </View>
                  )}

                  {/* Topics */}
                  {session.topics && session.topics.length > 0 && (
                    <View style={styles.topicsContainer}>
                      {session.topics.map((topic, idx) => (
                        <View key={idx} style={styles.topicChip}>
                          <Text style={styles.topicText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Metrics Row */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metric}>
                      <Clock size={14} color="#999999" />
                      <Text style={styles.metricText}>{session.duration_minutes} min</Text>
                    </View>
                    <View style={styles.metric}>
                      <Target size={14} color="#999999" />
                      <Text style={styles.metricText}>{session.correct_answers}/{session.total_questions}</Text>
                    </View>
                    <View style={styles.metric}>
                      <Trophy size={14} color="#FFD700" />
                      <Text style={styles.metricText}>+{session.points_earned} pts</Text>
                    </View>
                    {session.streak_day > 1 && (
                      <View style={styles.metric}>
                        <Zap size={14} color="#FF8C00" />
                        <Text style={styles.metricText}>Day {session.streak_day}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animatable.View>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    height: 100,
    zIndex: 100,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    position: 'relative',
    zIndex: 200,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  summaryCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sessionsList: {
    marginBottom: 20,
  },
  sessionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionLeft: {
    flex: 1,
  },
  sessionMode: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#999999',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  scoreBadgeText: {
    fontSize: 16,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
  },
  sessionContent: {
    gap: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#CCCCCC',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  topicChip: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  topicText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#FFD700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#AAAAAA',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#CCCCCC',
    marginTop: 16,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'SpaceGrotesk-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

