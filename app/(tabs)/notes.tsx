import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Image
} from 'react-native';
import { BlurView } from 'expo-blur';
import { 
  Search, 
  Plus, 
  Mic, 
  Clock, 
  Trash2, 
  BookOpen,
  Grid,
  Menu,
  ChevronDown,
  Play,
  History
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recordingServiceSupabase } from '../../services/recordingServiceSupabase';
import { RecordingSession, supabase } from '../../services/supabase';
import { notesService } from '../../services/notesService';
import { authService } from '../../services/authService';
import CreateNoteModal from '../../components/CreateNoteModal';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { StickyNote } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function NotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingSessions, setRecordingSessions] = useState<RecordingSession[]>([]);
  const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);
  const [isRealtimeUpdating, setIsRealtimeUpdating] = useState(false);
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('Personal');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // Page fade-in animation on mount (faster for better UX)
  useEffect(() => {
    Animated.timing(pageFadeAnim, {
      toValue: 1,
      duration: 150, // Reduced from 300ms for faster load
      useNativeDriver: true,
    }).start();
  }, []);

  // Dynamic sticky notes from database
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [filteredStickyNotes, setFilteredStickyNotes] = useState<StickyNote[]>([]);

  // Load sticky notes from database
  const loadStickyNotes = useCallback(async () => {
    try {
      setIsRefreshingNotes(true);
      console.log('🔄 Loading sticky notes from database...');
      
      // Try to load from session_sticky_notes table (where notes are actually stored)
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        console.log('❌ User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('session_sticky_notes')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading session sticky notes:', error);
        // Fallback to regular sticky notes
        const result = await notesService.getAllStickyNotes();
        setStickyNotes(result.stickyNotes);
        setFilteredStickyNotes(result.stickyNotes);
        return;
      }

      console.log('✅ Loaded session sticky notes:', data?.length || 0);
      
      // Convert session sticky notes to the expected format
      const convertedNotes = (data || []).map(note => ({
        id: note.id,
        note_id: note.note_id || note.id,
        user_id: note.user_id,
        title: note.title,
        description: note.content || note.description || '',
        color: note.color || 'yellow',
        type: note.type || 'task',
        completed: note.completed || false,
        tags: note.tags || [],
        position_x: note.position_x || 0,
        position_y: note.position_y || 0,
        created_at: note.created_at,
        updated_at: note.updated_at,
        session_id: note.session_id
      }));

      setStickyNotes(convertedNotes);
      setFilteredStickyNotes(convertedNotes);
      console.log('✅ Set sticky notes:', convertedNotes.length);
    } catch (error) {
      console.error('❌ Error loading sticky notes:', error);
    } finally {
      setIsRefreshingNotes(false);
    }
  }, []);

  // Load recording sessions
  const loadRecordingSessions = useCallback(async () => {
    try {
      const sessions = await recordingServiceSupabase.getSessions();
      setRecordingSessions(sessions);
    } catch (error) {
      console.error('Error loading recording sessions:', error);
    }
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredStickyNotes(stickyNotes);
    } else {
        const filtered = stickyNotes.filter(note =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.description.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredStickyNotes(filtered);
    }
  };

  // Handle note press
  const handleNotePress = (note: StickyNote) => {
    router.push(`/sticky-note-detail?id=${note.id}`);
  };

  // Handle create note
  const handleCreateNote = () => {
    setShowCreateNoteModal(true);
  };

  // Handle note created
  const handleNoteCreated = () => {
    loadStickyNotes();
    setShowCreateNoteModal(false);
  };

  // Handle delete sticky note
  const handleDeleteStickyNote = async (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = await authService.getCurrentUser();
              if (!currentUser) {
                Alert.alert('Error', 'User not authenticated');
                return;
              }

              // Delete from session_sticky_notes table
              const { error } = await supabase
                .from('session_sticky_notes')
                .delete()
                .eq('id', noteId)
                .eq('user_id', currentUser.id);

              if (error) {
                console.error('Error deleting session sticky note:', error);
                // Fallback to regular delete
                await notesService.deleteStickyNote(noteId);
              }

              loadStickyNotes();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          }
        }
      ]
    );
  };

  // Handle session press
  const handleSessionPress = (session: RecordingSession) => {
    router.push(`/recording-result?sessionId=${session.id}`);
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingSessionId(sessionId);
              await recordingServiceSupabase.deleteSession(sessionId);
              loadRecordingSessions();
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session');
            } finally {
              setDeletingSessionId(null);
            }
          }
        }
      ]
    );
  };

  // Get note color
  const getNoteColor = (color: string) => {
    const colors: { [key: string]: string } = {
      yellow: '#FFF59D',
      pink: '#F8BBD9',
      blue: '#B3E5FC',
      green: '#C8E6C9',
      orange: '#FFCC80',
      purple: '#E1BEE7',
      red: '#FFCDD2',
      teal: '#B2DFDB',
    };
    return colors[color] || colors.yellow;
  };

  // Get note type emoji
  const getNoteTypeEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      task: '📋',
      creative: '🎨',
      technical: '⚙️',
      educational: '📚',
      inspirational: '✨',
    };
    return emojis[type] || '📝';
  };

  // Load data on mount
  useEffect(() => {
    loadStickyNotes();
    loadRecordingSessions();
  }, [loadStickyNotes, loadRecordingSessions]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadStickyNotes();
      loadRecordingSessions();
    }, [loadStickyNotes, loadRecordingSessions])
  );

  // Header animation styles based on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const titleFontSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [20, 18],
    extrapolate: 'clamp',
  });

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? '#000000' : '#FFFFFF',
    },
    filterText: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    categoryTabText: {
      color: '#FFFFFF',
    },
    searchContainer: {
      backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
      borderColor: isDark ? '#333333' : '#E0E0E0',
    },
    searchInput: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    emptyTitle: {
      color: isDark ? '#FFFFFF' : '#000000',
    },
    emptySubtitle: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
    loadingText: {
      color: isDark ? '#CCCCCC' : '#666666',
    },
  };

  return (
    <Animated.View style={[styles.container, dynamicStyles.container, { opacity: pageFadeAnim }]}>
      {/* Header with Dark Background and Glassmorphism on Scroll */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Animated.View 
          style={[
            styles.headerDarkBackground,
            { opacity: headerBackgroundOpacity }
          ]} 
        />
        <Animated.View
          style={[
            styles.headerBlurOverlay,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              }),
            }
          ]}
        >
          <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={styles.headerContent}>
          <View style={styles.headerCenter}>
            <Animated.Text style={[styles.headerTitle, { fontSize: titleFontSize }]}>Notetaker</Animated.Text>
          </View>
        </Animated.View>
      </Animated.View>

      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >

        {/* Session Buttons Section */}
        <View style={styles.sessionButtonsContainer}>
          <TouchableOpacity 
            style={styles.newSessionButton}
            onPress={() => router.push('/(tabs)/record')}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.newSessionButtonText}>New</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.previousRecordingsButton}
            onPress={() => router.push('/sessions')}
          >
            <History size={20} color="#FFFFFF" />
            <Text style={styles.previousRecordingsButtonText}>My History</Text>
          </TouchableOpacity>
        </View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.filterDropdown}>
            <Text style={[styles.filterText, dynamicStyles.filterText]}>{selectedFilter}</Text>
            <ChevronDown size={16} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {['All', 'Studies', 'Work', 'Lifestyle'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryTabText,
                  dynamicStyles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive
                ]}>
                  #{category}
                  </Text>
            </TouchableOpacity>
            ))}
          </ScrollView>
          </View>

        {/* Search Box */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, dynamicStyles.searchContainer]}>
            <Search size={20} color="#CCCCCC" />
            <TextInput
              style={[styles.searchInput, dynamicStyles.searchInput]}
              placeholder="Search your notes..."
              placeholderTextColor={isDark ? "#999999" : "#CCCCCC"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          </View>
          
        {/* Notes Section */}
        <View style={styles.notesSection}>

          {/* Notes Grid */}
          <View style={styles.notesGrid}>
                     {loading ? (
             <View style={styles.loadingContainer}>
                <LoadingSpinner size={40} color="#667eea" />
               <Text style={[styles.loadingText, dynamicStyles.loadingText]}>Loading your notes...</Text>
             </View>
           ) : filteredStickyNotes && Array.isArray(filteredStickyNotes) && filteredStickyNotes.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Image 
                 source={require('../../assets/cryv2.png')}
                 style={styles.emptyImage}
                 resizeMode="contain"
               />
               <Text style={[styles.emptyTitle, dynamicStyles.emptyTitle]}>
                 {searchQuery.trim() ? 'No notes found' : 'No notes yet'}
               </Text>
               <Text style={[styles.emptySubtitle, dynamicStyles.emptySubtitle]}>
                 {searchQuery.trim() ? `No notes match "${searchQuery}"` : 'Create your first note to get started!'}
               </Text>
             </View>
           ) : (
             <View style={styles.notesContainer}>
                {filteredStickyNotes.map((note, index) => (
                         <TouchableOpacity
                           key={note.id}
                             style={[
                      styles.stickyNoteCard,
                               { backgroundColor: getNoteColor(note.color) }
                             ]}
                             onPress={() => handleNotePress(note)}
                           >
                    {/* Sticky Note Header with Pointy Edge */}
                    <View style={styles.stickyNoteHeader}>
                      <View style={styles.stickyNoteTop}>
                        <Text style={styles.stickyNoteTitle}>{note.title}</Text>
                        <View style={styles.stickyNoteCorner}>
                          <Text style={styles.stickyNoteContext}>{note.type}</Text>
                                 </View>
                               </View>
                                 </View>
                    
                    {/* Sticky Note Content */}
                    <View style={styles.stickyNoteContent}>
                      <Text style={styles.stickyNoteDescription}>
                        {note.description || 'No description available'}
                                   </Text>
                       </View>
                       
                    {/* Sticky Note Footer */}
                    <View style={styles.stickyNoteFooter}>
                      <Text style={styles.stickyNoteDate}>
                        {new Date(note.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                                     </Text>
                                   </View>
                             </TouchableOpacity>
                           ))}
                         </View>
                       )}
                     </View>
        </View>

        {/* Create Note Modal */}
        <CreateNoteModal
          visible={showCreateNoteModal}
          onClose={() => setShowCreateNoteModal(false)}
          onNoteCreated={handleNoteCreated}
        />
      </Animated.ScrollView>
    </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontFamily: 'Inter-Regular',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Oswald-Bold',
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterText: {
    fontSize: 16,
    fontFamily: 'Fredoka-Medium',
    marginRight: 8,
  },
  categoryTabs: {
    flexDirection: 'row',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#333333',
    backgroundColor: '#1A1A1A',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  categoryTabText: {
    fontSize: 14,
    fontFamily: 'Fredoka-Medium',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  categoryTabTextActive: {
    color: '#000000',
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  sessionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    marginTop: 16,
    marginBottom: 16,
    gap: 12,
  },
  sessionButtonsSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Fredoka-Regular',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 60,
    backgroundColor: '#000000',
    paddingTop: 20,
    paddingBottom: 10,
  },
  newSessionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#58CC02',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minHeight: 54,
    gap: 8,
    borderBottomWidth: 4,
    borderBottomColor: '#47A302',
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plusIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSessionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Fredoka-Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previousRecordingsButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1CB0F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
    minHeight: 54,
    borderBottomWidth: 4,
    borderBottomColor: '#1899D6',
    borderRightWidth: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previousRecordingsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Fredoka-Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notesSection: {
    paddingHorizontal: 20,
  },
  notesHeader: {
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  notesSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'Inter-Regular',
  },
  notesGrid: {
    marginBottom: 20,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stickyNoteCard: {
    width: (width - 60) / 2,
    height: 200,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  stickyNoteHeader: {
    position: 'relative',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  stickyNoteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stickyNoteTitle: {
    fontSize: 20,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  stickyNoteCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderLeftColor: 'transparent',
    borderTopWidth: 20,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  stickyNoteContext: {
    position: 'absolute',
    top: 2,
    right: 2,
    fontSize: 7,
    color: '#000000',
    fontFamily: 'Inter-Bold',
    fontWeight: 'bold',
    transform: [{ rotate: '45deg' }],
    textTransform: 'uppercase',
  },
  stickyNoteContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stickyNoteDescription: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
  },
  stickyNoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  stickyNoteDate: {
    fontSize: 10,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
  },
  stickyNoteType: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Fredoka-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Fredoka-SemiBold',
    letterSpacing: 0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Fredoka-Regular',
    fontWeight: '400',
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  // Header styles with dark background and glassmorphism
  header: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 100,
    marginBottom: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerDarkBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  headerBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 200,
    pointerEvents: 'box-none',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    zIndex: 201,
    pointerEvents: 'box-none',
  },
  headerTitle: {
    fontFamily: 'Fredoka-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },
}); 