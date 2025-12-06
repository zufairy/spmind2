import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Bookmark, Tag, Clock, ChevronRight } from 'lucide-react-native';
import { StickyNote } from '../services/recordingService';

const { width } = Dimensions.get('window');

interface EnhancedStickyNoteProps {
  note: StickyNote;
  isSaved: boolean;
  onToggleComplete: (noteId: string) => void;
  onToggleSave: (noteId: string) => void;
  onPress?: (note: StickyNote) => void;
}

export default function EnhancedStickyNote({
  note,
  isSaved,
  onToggleComplete,
  onToggleSave,
  onPress
}: EnhancedStickyNoteProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return '#999999';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return '📋';
      case 'focus': return '🎯';
      case 'important': return '⭐';
      case 'todo': return '✅';
      case 'reminder': return '⏰';
      case 'concept': return '💡';
      default: return '📝';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.stickyNote,
        {
          backgroundColor: note.color === 'yellow' ? '#FFF9C4' : 
                         note.color === 'pink' ? '#F8BBD9' :
                         note.color === 'green' ? '#C8E6C9' :
                         note.color === 'blue' ? '#BBDEFB' : '#E1BEE7',
          borderColor: note.color === 'yellow' ? '#FFD54F' :
                      note.color === 'pink' ? '#E91E63' :
                      note.color === 'green' ? '#4CAF50' :
                      note.color === 'blue' ? '#2196F3' : '#9C27B0',
        }
      ]}
      onPress={() => onPress?.(note)}
      activeOpacity={0.7}
    >
      {/* Header with type icon and actions */}
      <View style={styles.noteHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{getTypeIcon(note.type)}</Text>
          <Text style={styles.noteType}>{note.type}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => onToggleSave(note.id)}
          >
            <Bookmark 
              size={16} 
              color={isSaved ? '#00FF00' : '#2E2E2E'} 
              fill={isSaved ? '#00FF00' : 'none'}
            />
          </TouchableOpacity>
          <ChevronRight size={16} color="#2E2E2E" style={{ opacity: 0.6 }} />
        </View>
      </View>

      {/* Title */}
      <Text style={styles.noteTitle} numberOfLines={2}>
        {note.title}
      </Text>
      
      {/* Content */}
      <Text style={styles.noteContent} numberOfLines={4}>
        {note.content}
      </Text>
      
      {/* Tap hint */}
      <View style={styles.tapHint}>
        <Text style={styles.tapHintText}>Tap to view details</Text>
      </View>
      
      {/* Footer with priority and date */}
      <View style={styles.noteFooter}>
        <View style={styles.priorityContainer}>
          <View 
            style={[
              styles.priorityDot, 
              { backgroundColor: getPriorityColor(note.priority) }
            ]} 
          />
          <Text style={styles.priorityText}>{note.priority}</Text>
        </View>
        
        {note.date && (
          <View style={styles.dateContainer}>
            <Clock size={12} color="#2E2E2E" />
            <Text style={styles.dateText}>
              {new Date(note.date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Completion overlay */}
      {note.completed && (
        <View style={styles.completionOverlay}>
          <Text style={styles.completionText}>✓ Completed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  stickyNote: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    minHeight: 160,
    position: 'relative',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeIcon: {
    fontSize: 16,
  },
  noteType: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#2E2E2E',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    padding: 2,
  },
  tapHint: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  tapHintText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#2E2E2E',
    opacity: 0.6,
    fontStyle: 'italic',
  },

  noteTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2E2E2E',
    marginBottom: 8,
    lineHeight: 18,
  },
  noteContent: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#2E2E2E',
    lineHeight: 16,
    marginBottom: 12,
    opacity: 0.9,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#2E2E2E',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#2E2E2E',
    opacity: 0.7,
  },
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completionText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
});
