import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Calendar, Clock, Users, FileText, MoreVertical, Trash2, Play } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { recordingServiceSupabase } from '../services/recordingServiceSupabase';
import { RecordingSession, supabase } from '../services/supabase';
import { authService } from '../services/authService';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface SessionWithNotes extends RecordingSession {
  notesCount: number;
  attendees?: string[];
}

export default function SessionsPage() {
  const { isDark } = useTheme();
  const [sessions, setSessions] = useState<SessionWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const isAuth = await authService.isAuthenticated();
      if (!isAuth) {
        router.replace('/auth/login');
        return;
      }

      // Load recording sessions
      const recordingSessions = await recordingServiceSupabase.getSessions();
      
      if (recordingSessions && Array.isArray(recordingSessions)) {
        // Load notes count for each session
        const sessionsWithNotes = await Promise.all(
          recordingSessions.map(async (session) => {
            try {
              const notes = await recordingServiceSupabase.getSessionStickyNotes(session.id);
              return {
                ...session,
                notesCount: notes ? notes.length : 0,
                attendees: ['You'], // Default attendee, can be expanded later
              };
            } catch (error) {
              console.error(`Error loading notes for session ${session.id}:`, error);
              return {
                ...session,
                notesCount: 0,
                attendees: ['You'],
              };
            }
          })
        );

        // Sort by creation date (newest first)
        const sortedSessions = sessionsWithNotes.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setSessions(sortedSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionPress = (session: SessionWithNotes) => {
    router.push(`/recording-result?sessionId=${session.id}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This will permanently delete the session, all its sticky notes, and summary. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingSessionId(sessionId);
            
            try {
              const success = await recordingServiceSupabase.deleteSession(sessionId);
              
              if (success) {
                // Remove from local state
                setSessions(prev => prev.filter(session => session.id !== sessionId));
                Alert.alert('Success', 'Session deleted successfully!');
              } else {
                Alert.alert('Error', 'Failed to delete session. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session. Please try again.');
            } finally {
              setDeletingSessionId(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (durationMs: number) => {
    const minutes = Math.floor(durationMs / 1000 / 60);
    const seconds = Math.floor((durationMs / 1000) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <View style={[styles.container, !isDark && styles.containerLight]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000000" : "#FFFFFF"} />
        {isDark ? (
          <LinearGradient
            colors={['#000000', '#1a1a1a', '#000000']}
            style={styles.gradient}
          >
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading sessions...</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.gradient, styles.gradientLight]}>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, styles.loadingTextLight]}>Loading sessions...</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, !isDark && styles.containerLight]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#000000" : "#FFFFFF"} />
      {isDark ? (
        <LinearGradient
          colors={['#000000', '#1a1a1a', '#000000']}
          style={styles.gradient}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Study Sessions</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Stats Bar */}
        <Animatable.View animation="fadeInDown" delay={100} style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessions.length}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {sessions.reduce((total, session) => total + session.notesCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Notes Generated</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.round(sessions.reduce((total, session) => total + session.duration, 0) / 1000 / 60)}
            </Text>
            <Text style={styles.statLabel}>Minutes Recorded</Text>
          </View>
        </Animatable.View>

        {/* Sessions List */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sessions.length === 0 ? (
            <Animatable.View animation="fadeInUp" delay={200} style={styles.emptyContainer}>
              <Image 
                source={require('../assets/cryv2.png')} 
                style={styles.emptyIcon}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>No Sessions Yet</Text>
              <Text style={styles.emptySubtitle}>
                Start recording to see your study sessions here
              </Text>
            </Animatable.View>
          ) : (
            sessions.map((session, index) => (
              <Animatable.View
                key={session.id}
                animation="fadeInUp"
                delay={200 + index * 100}
                style={styles.sessionCard}
              >
                <TouchableOpacity
                  style={styles.sessionContent}
                  onPress={() => handleSessionPress(session)}
                  activeOpacity={0.7}
                >
                  {/* Session Header */}
                  <View style={styles.sessionHeader}>
                    <View style={styles.sessionTitleContainer}>
                      <Text style={styles.sessionTitle}>{session.title}</Text>
                      <Text style={styles.sessionDate}>{formatDate(session.created_at)}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.sessionActionButton,
                        deletingSessionId === session.id && styles.sessionActionButtonLoading
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session.id);
                      }}
                      disabled={deletingSessionId === session.id}
                    >
                      {deletingSessionId === session.id ? (
                        <Text style={styles.loadingSpinner}>⏳</Text>
                      ) : (
                        <Trash2 size={16} color="#FF6B9D" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Session Summary */}
                  {session.summary && (
                    <Text style={styles.sessionSummary}>
                      {truncateText(session.summary, 120)}
                    </Text>
                  )}

                  {/* Session Stats */}
                  <View style={styles.sessionStats}>
                    <View style={styles.statBadge}>
                      <Clock size={14} color="#8B5CF6" />
                      <Text style={styles.statBadgeText}>{formatDuration(session.duration)}</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <FileText size={14} color="#10B981" />
                      <Text style={styles.statBadgeText}>{session.notesCount} notes</Text>
                    </View>
                    <View style={styles.statBadge}>
                      <Users size={14} color="#F59E0B" />
                      <Text style={styles.statBadgeText}>{session.attendees?.length || 1} attendee</Text>
                    </View>
                  </View>

                  {/* Session Footer */}
                  <View style={styles.sessionFooter}>
                    <View style={styles.sessionTags}>
                      {session.subjects?.map((subject, idx) => (
                        <View key={idx} style={styles.subjectTag}>
                          <Text style={styles.subjectTagText}>{subject}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.playButton}>
                      <Play size={16} color="#8B5CF6" />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animatable.View>
            ))
          )}
        </ScrollView>
        </LinearGradient>
      ) : (
        <View style={[styles.gradient, styles.gradientLight]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, styles.backButtonLight]} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, styles.headerTitleLight]}>Study Sessions</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Stats Bar */}
          <Animatable.View animation="fadeInDown" delay={100} style={[styles.statsContainer, styles.statsContainerLight]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberLight]}>{sessions.length}</Text>
              <Text style={[styles.statLabel, styles.statLabelLight]}>Total Sessions</Text>
            </View>
            <View style={[styles.statDivider, styles.statDividerLight]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberLight]}>
                {sessions.reduce((total, session) => total + session.notesCount, 0)}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelLight]}>Notes Generated</Text>
            </View>
            <View style={[styles.statDivider, styles.statDividerLight]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statNumberLight]}>
                {Math.round(sessions.reduce((total, session) => total + session.duration, 0) / 1000 / 60)}
              </Text>
              <Text style={[styles.statLabel, styles.statLabelLight]}>Minutes Recorded</Text>
            </View>
          </Animatable.View>

          {/* Sessions List */}
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {sessions.length === 0 ? (
              <Animatable.View animation="fadeInUp" delay={200} style={styles.emptyContainer}>
                <Image 
                  source={require('../assets/cryv2.png')} 
                  style={styles.emptyIcon}
                  resizeMode="contain"
                />
                <Text style={[styles.emptyTitle, styles.emptyTitleLight]}>No Sessions Yet</Text>
                <Text style={[styles.emptySubtitle, styles.emptySubtitleLight]}>
                  Start recording to see your study sessions here
                </Text>
              </Animatable.View>
            ) : (
              sessions.map((session, index) => (
                <Animatable.View
                  key={session.id}
                  animation="fadeInUp"
                  delay={200 + index * 100}
                  style={[styles.sessionCard, styles.sessionCardLight]}
                >
                  <TouchableOpacity
                    style={styles.sessionContent}
                    onPress={() => handleSessionPress(session)}
                    activeOpacity={0.7}
                  >
                    {/* Session Header */}
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionTitleContainer}>
                        <Text style={[styles.sessionTitle, styles.sessionTitleLight]}>{session.title}</Text>
                        <Text style={[styles.sessionDate, styles.sessionDateLight]}>{formatDate(session.created_at)}</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.sessionActionButton,
                          styles.sessionActionButtonLight,
                          deletingSessionId === session.id && styles.sessionActionButtonLoading
                        ]}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        disabled={deletingSessionId === session.id}
                      >
                        {deletingSessionId === session.id ? (
                          <Text style={styles.loadingSpinner}>⏳</Text>
                        ) : (
                          <Trash2 size={16} color="#FF6B9D" />
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Session Summary */}
                    {session.summary && (
                      <Text style={[styles.sessionSummary, styles.sessionSummaryLight]}>
                        {truncateText(session.summary, 120)}
                      </Text>
                    )}

                    {/* Session Stats */}
                    <View style={styles.sessionStats}>
                      <View style={[styles.statBadge, styles.statBadgeLight]}>
                        <Clock size={14} color="#8B5CF6" />
                        <Text style={[styles.statBadgeText, styles.statBadgeTextLight]}>{formatDuration(session.duration)}</Text>
                      </View>
                      <View style={[styles.statBadge, styles.statBadgeLight]}>
                        <FileText size={14} color="#10B981" />
                        <Text style={[styles.statBadgeText, styles.statBadgeTextLight]}>{session.notesCount} notes</Text>
                      </View>
                      <View style={[styles.statBadge, styles.statBadgeLight]}>
                        <Users size={14} color="#F59E0B" />
                        <Text style={[styles.statBadgeText, styles.statBadgeTextLight]}>{session.attendees?.length || 1} attendee</Text>
                      </View>
                    </View>

                    {/* Session Footer */}
                    <View style={styles.sessionFooter}>
                      <View style={styles.sessionTags}>
                        {session.subjects?.map((subject, idx) => (
                          <View key={idx} style={styles.subjectTag}>
                            <Text style={styles.subjectTagText}>{subject}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.playButton}>
                        <Play size={16} color="#8B5CF6" />
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animatable.View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  sessionContent: {
    padding: 20,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sessionActionButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  sessionActionButtonLoading: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    borderColor: 'rgba(255, 193, 7, 0.5)',
  },
  loadingSpinner: {
    fontSize: 16,
    color: '#FFC107',
  },
  sessionSummary: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 16,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  statBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTags: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  subjectTag: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  subjectTagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#8B5CF6',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyIcon: {
    width: 192,
    height: 192,
  },
  // Light mode styles
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  gradientLight: {
    backgroundColor: '#FFFFFF',
  },
  backButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  headerTitleLight: {
    color: '#000000',
  },
  statsContainerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statNumberLight: {
    color: '#000000',
  },
  statLabelLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  statDividerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  sessionCardLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sessionTitleLight: {
    color: '#000000',
  },
  sessionDateLight: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  sessionActionButtonLight: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderColor: 'rgba(255, 107, 157, 0.3)',
  },
  sessionSummaryLight: {
    color: 'rgba(0, 0, 0, 0.8)',
  },
  statBadgeLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statBadgeTextLight: {
    color: 'rgba(0, 0, 0, 0.9)',
  },
  emptyTitleLight: {
    color: '#000000',
  },
  emptySubtitleLight: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  loadingTextLight: {
    color: 'rgba(0, 0, 0, 0.8)',
  },
});

