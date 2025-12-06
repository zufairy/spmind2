import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  FileText,
  Clock,
  Calendar,
  Share,
  Copy,
} from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { recordingServiceSupabase } from '../services/recordingServiceSupabase';
import { RecordingSession } from '../services/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';
import * as Clipboard from 'expo-clipboard';

export default function TranscriptScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Load session details
      const sessionData = await recordingServiceSupabase.getSessionById(sessionId as string);
      if (sessionData) {
        setSession(sessionData);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscript = async () => {
    if (!session?.transcript) return;
    
    try {
      await Clipboard.setStringAsync(session.transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying transcript:', error);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={48} color="#FF6B9D" />
        <Text style={styles.loadingText}>Loading transcript...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
            <FileText size={24} color="#FF6B9D" />
            <Text style={styles.title}>Full Transcript</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.copyButton, copied && styles.copyButtonActive]}
            onPress={handleCopyTranscript}
          >
            <Copy size={20} color={copied ? "#4ECDC4" : "#FF6B9D"} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Session Info */}
          <Animatable.View animation="fadeInUp" delay={100} style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#FF6B9D" />
              <Text style={styles.infoText}>Duration: {formatDuration(session.duration)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Calendar size={16} color="#FF6B9D" />
              <Text style={styles.infoText}>{formatDate(session.created_at)}</Text>
            </View>
            <View style={styles.infoRow}>
              <FileText size={16} color="#FF6B9D" />
              <Text style={styles.infoText}>Title: {session.title}</Text>
            </View>
          </Animatable.View>

          {/* Transcript Content */}
          <Animatable.View animation="fadeInUp" delay={200} style={styles.transcriptSection}>
            <View style={styles.transcriptHeader}>
              <FileText size={24} color="#FF6B9D" />
              <Text style={styles.transcriptTitle}>Your Recording Transcript</Text>
            </View>
            
            <View style={styles.transcriptContainer}>
              <Text style={styles.transcriptText}>
                {session.transcript || 'No transcript available yet. Processing...'}
              </Text>
            </View>
            
            {copied && (
              <Animatable.View animation="fadeIn" style={styles.copiedMessage}>
                <Text style={styles.copiedText}>✅ Transcript copied to clipboard!</Text>
              </Animatable.View>
            )}
          </Animatable.View>

          {/* Action Buttons */}
          <Animatable.View animation="fadeInUp" delay={300} style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyTranscript}
            >
              <Copy size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Copy Transcript</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Back to Recording</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  copyButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    borderRadius: 8,
  },
  copyButtonActive: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 157, 0.2)',
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
  transcriptSection: {
    marginBottom: 32,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },

  transcriptTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transcriptText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'left',
  },
  copiedMessage: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'center',
  },
  copiedText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B9D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#FF6B9D',
    fontSize: 16,
    fontWeight: '600',
  },
});
