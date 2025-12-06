import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Edit3, Trash2, Share2, Bookmark } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';
import { recordingServiceSupabase } from '../services/recordingServiceSupabase';
import { supabase } from '../services/supabase';
import { authService } from '../services/authService';
import { LoadingSpinner } from '../components/LoadingSpinner';

const { width, height } = Dimensions.get('window');

interface StickyNoteDetailParams {
  id: string;
  title: string;
  content: string;
  type: string;
  color: string;
  priority: string;
  sessionId: string;
}

export default function StickyNoteDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<StickyNoteDetailParams>();
  
  const [note, setNote] = useState({
    id: params.id || '',
    title: '',
    content: '',
    type: '',
    color: 'yellow',
    priority: 'medium',
    sessionId: '',
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  // Load note data from database
  const loadNoteData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading note data for ID:', params.id);
      
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        setError('User not authenticated');
        return;
      }

      // Fetch from session_sticky_notes table
      const { data, error: fetchError } = await supabase
        .from('session_sticky_notes')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', currentUser.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching note:', fetchError);
        setError('Failed to load note');
        return;
      }

      if (!data) {
        setError('Note not found');
        return;
      }

      console.log('✅ Loaded note data:', data);
      
      // Update note state with fetched data
      const noteData = {
        id: data.id,
        title: data.title || '',
        content: data.content || data.description || '',
        type: data.type || 'task',
        color: data.color || 'yellow',
        priority: data.priority || 'medium',
        sessionId: data.session_id || '',
      };
      
      setNote(noteData);
      setEditingTitle(noteData.title);
      setEditingContent(noteData.content);
      
    } catch (error) {
      console.error('❌ Error loading note:', error);
      setError('Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  // Load note data on mount
  useEffect(() => {
    if (params.id) {
      loadNoteData();
    } else {
      setError('No note ID provided');
      setLoading(false);
    }
  }, [params.id]);

  const getNoteColor = (color: string) => {
    const colors: { [key: string]: string } = {
      yellow: '#FFF9C4',
      pink: '#F8BBD9',
      green: '#C8E6C9',
      blue: '#BBDEFB',
      purple: '#E1BEE7',
      orange: '#FFCC80',
      red: '#FFCDD2',
    };
    return colors[color] || '#FFF9C4';
  };

  const getNoteTypeEmoji = (type: string) => {
    const typeEmojis: { [key: string]: string } = {
      task: '📋',
      focus: '🎯',
      important: '⭐',
      todo: '✅',
      reminder: '⏰',
      exam: '📝',
      deadline: '⏳',
      formula: '🧮',
      definition: '📚',
      tip: '💡',
    };
    return typeEmojis[type] || '📝';
  };

  const getPriorityEmoji = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '💫';
      default: return '⭐';
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      // Save changes
      handleSave();
    } else {
      // Enter edit mode
      setIsEditing(true);
      setEditingTitle(note.title);
      setEditingContent(note.content);
    }
  };

  const handleSave = async () => {
    if (!editingTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Update the sticky note in the database
      const { error } = await supabase
        .from('session_sticky_notes')
        .update({
          title: editingTitle.trim(),
          content: editingContent.trim()
        })
        .eq('id', note.id)
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Error updating note:', error);
        Alert.alert('Error', 'Failed to update note');
        return;
      }
      
      // Update local state
      setNote(prev => ({
        ...prev,
        title: editingTitle.trim(),
        content: editingContent.trim()
      }));
      
      setIsEditing(false);
      Alert.alert('Success', 'Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

              // Delete from database
              const { error } = await supabase
                .from('session_sticky_notes')
                .delete()
                .eq('id', note.id)
                .eq('user_id', currentUser.id);

              if (error) {
                console.error('Error deleting note:', error);
                Alert.alert('Error', 'Failed to delete note');
                return;
              }

              Alert.alert('Success', 'Note deleted successfully!');
              router.back();
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share note:', note.id);
  };

  const handleSaveToNotes = () => {
    // TODO: Implement save to notes functionality
    console.log('Save to notes:', note.id);
  };

  const backgroundColor = getNoteColor(note.color);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={40} color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadNoteData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[backgroundColor, backgroundColor, backgroundColor]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Note Details</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleShare}>
              <Share2 size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton} onPress={handleSaveToNotes}>
              <Bookmark size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animatable.View animation="fadeInUp" delay={200} style={styles.noteContainer}>
            {/* Cut Corner Effect */}
            <View style={styles.cutCorner} />
            
            {/* Note Type Badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeEmoji}>{getNoteTypeEmoji(note.type)}</Text>
              <Text style={styles.typeText}>{note.type}</Text>
            </View>

            {/* Note Title */}
            {isEditing ? (
              <TextInput
                style={styles.noteTitleInput}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="Note title..."
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
              />
            ) : (
              <Text style={styles.noteTitle}>
                {note.title.includes('exam') ? '📝 ' : 
                 note.title.includes('formula') ? '🧮 ' : 
                 note.title.includes('definition') ? '📚 ' : 
                 note.title.includes('deadline') ? '⏰ ' : 
                 '📌 '}{note.title}
              </Text>
            )}

            {/* Priority Badge */}
            <View style={[styles.priorityBadge, { backgroundColor: backgroundColor }]}>
              <Text style={styles.priorityText}>
                {getPriorityEmoji(note.priority)} Priority: {note.priority}
              </Text>
            </View>

            {/* Note Content */}
            <View style={styles.contentContainer}>
              <Text style={styles.contentLabel}>Content:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.noteContentInput}
                  value={editingContent}
                  onChangeText={setEditingContent}
                  placeholder="Note content..."
                  placeholderTextColor="rgba(0, 0, 0, 0.5)"
                  multiline
                  numberOfLines={6}
                />
              ) : (
                <Text style={styles.noteContent}>
                  {note.content.split(' ').map((word, wordIndex) => {
                    // Highlight important words (dates, numbers, key terms)
                    const isImportant = /\d+/.test(word) || 
                                      /exam|test|quiz|deadline|due|important|key|formula|definition/.test(word.toLowerCase());
                    return (
                      <Text 
                        key={wordIndex} 
                        style={[
                          styles.noteWord,
                          isImportant && styles.highlightedWord
                        ]}
                      >
                        {word}{wordIndex < note.content.split(' ').length - 1 ? ' ' : ''}
                      </Text>
                    );
                  })}
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Text style={styles.editButtonText}>💾</Text>
                    <Text style={styles.editButtonText}>Save</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.cancelButton} onPress={() => {
                    setIsEditing(false);
                    setEditingTitle(note.title);
                    setEditingContent(note.content);
                  }}>
                    <Text style={styles.cancelButtonText}>❌</Text>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Edit3 size={18} color="#fff" />
                    <Text style={styles.editButtonText}>Edit Note</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  noteContainer: {
    marginTop: 30,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'solid',
    position: 'relative',
    overflow: 'hidden',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderStyle: 'solid',
  },
  typeEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Poppins-SemiBold' : 'Poppins-SemiBold',
    letterSpacing: 0.5,
  },
  noteTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    textAlign: 'center',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(0,0,0,0.3)',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  noteTitleInput: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.5,
    borderStyle: 'solid',
  },
  noteContentInput: {
    fontSize: 19,
    color: '#444',
    lineHeight: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    textAlign: 'left',
    minHeight: 120,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
    borderStyle: 'solid',
  },
  priorityBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderStyle: 'solid',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
    letterSpacing: 0.3,
  },
  contentContainer: {
    marginBottom: 30,
  },
  contentLabel: {
    fontSize: 19,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.3,
  },
  noteContent: {
    fontSize: 19,
    color: '#444',
    lineHeight: 30,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    textAlign: 'left',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'solid',
  },
  noteWord: {
    fontSize: 19,
    color: '#444',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
  },
  highlightedWord: {
    backgroundColor: 'rgba(255,255,0,0.6)',
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    textDecorationLine: 'underline',
    textDecorationColor: '#FF6B9D',
    textShadowColor: '#FF6B9D',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'solid',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.3,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B9D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'solid',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.3,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'solid',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
  },
  loadingText: {
    fontSize: 19,
    color: '#333',
    marginTop: 16,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 19,
    color: '#FF6B9D',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    borderStyle: 'solid',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive',
    letterSpacing: 0.3,
  },
  backButtonText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive',
    letterSpacing: 0.3,
  },
  cutCorner: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderRightWidth: 20,
    borderRightColor: 'transparent',
    borderTopWidth: 20,
    borderTopColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
});
