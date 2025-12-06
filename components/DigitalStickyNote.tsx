import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { CheckSquare, Square, Tag, Calendar, Clock } from 'lucide-react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

export interface StickyNote {
  id: string;
  title: string;
  description: string;
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple';
  type: 'task' | 'creative' | 'technical' | 'educational' | 'inspirational';
  completed?: boolean;
  tags?: string[];
  date?: string;
  time?: string;
}

interface DigitalStickyNoteProps {
  note: StickyNote;
  onToggleComplete?: (id: string) => void;
  onPress?: (note: StickyNote) => void;
  style?: any;
}

const colorMap = {
  yellow: {
    background: '#FFF9C4',
    border: '#FFD54F',
    text: '#2E2E2E',
    shadow: '#F57F17',
  },
  pink: {
    background: '#F8BBD9',
    border: '#E91E63',
    text: '#2E2E2E',
    shadow: '#C2185B',
  },
  green: {
    background: '#C8E6C9',
    border: '#4CAF50',
    text: '#2E2E2E',
    shadow: '#388E3C',
  },
  blue: {
    background: '#BBDEFB',
    border: '#2196F3',
    text: '#2E2E2E',
    shadow: '#1976D2',
  },
  purple: {
    background: '#E1BEE7',
    border: '#9C27B0',
    text: '#2E2E2E',
    shadow: '#7B1FA2',
  },
};

export default function DigitalStickyNote({ note, onToggleComplete, onPress, style }: DigitalStickyNoteProps) {
  const colors = colorMap[note.color];

  const renderInteractiveElements = () => {
    switch (note.type) {
      case 'task':
        return (
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onToggleComplete?.(note.id)}
          >
            {note.completed ? (
              <CheckSquare size={16} color={colors.text} />
            ) : (
              <Square size={16} color={colors.text} />
            )}
          </TouchableOpacity>
        );
      case 'creative':
      case 'technical':
      case 'educational':
        return (
          <View style={styles.tagsContainer}>
            {note.tags?.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.border }]}>
                <Tag size={10} color={colors.background} />
                <Text style={[styles.tagText, { color: colors.background }]}>{tag}</Text>
              </View>
            ))}
          </View>
        );
      case 'inspirational':
        return (
          <View style={styles.inspirationContainer}>
            <Text style={[styles.inspirationText, { color: colors.text }]}>✨</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      style={[styles.container, style]}
    >
      <TouchableOpacity
        style={[
          styles.stickyNote,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={() => onPress?.(note)}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {note.title}
          </Text>
          {renderInteractiveElements()}
        </View>
        
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={4}>
          {note.description}
        </Text>
        
        {(note.date || note.time) && (
          <View style={styles.metaContainer}>
            {note.date && (
              <View style={styles.metaItem}>
                <Calendar size={12} color={colors.text} />
                <Text style={[styles.metaText, { color: colors.text }]}>{note.date}</Text>
              </View>
            )}
            {note.time && (
              <View style={styles.metaItem}>
                <Clock size={12} color={colors.text} />
                <Text style={[styles.metaText, { color: colors.text }]}>{note.time}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 4,
  },
  stickyNote: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 120,
    maxWidth: (width - 60) / 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: 12,
  },
  checkbox: {
    padding: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  inspirationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspirationText: {
    fontSize: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    opacity: 0.7,
  },
});

