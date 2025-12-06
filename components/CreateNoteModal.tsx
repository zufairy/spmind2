import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Tag, BookOpen } from 'lucide-react-native';
import { notesService, CreateNoteData } from '../services/notesService';
import { LoadingSpinner } from './LoadingSpinner';

interface CreateNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onNoteCreated: () => void;
}

export default function CreateNoteModal({ visible, onClose, onNoteCreated }: CreateNoteModalProps) {
  const [noteData, setNoteData] = useState<CreateNoteData>({
    title: '',
    content: '',
    type: 'general',
    color: 'yellow',
    tags: [],
    is_pinned: false,
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  const noteTypes = [
    { value: 'general', label: 'General', icon: '📝' },
    { value: 'homework', label: 'Homework', icon: '📚' },
    { value: 'study', label: 'Study', icon: '🎯' },
    { value: 'personal', label: 'Personal', icon: '💭' },
  ];

  const colors = [
    { value: 'yellow', color: '#FFF9C4' },
    { value: 'pink', color: '#F8BBD9' },
    { value: 'green', color: '#C8E6C9' },
    { value: 'blue', color: '#BBDEFB' },
    { value: 'purple', color: '#E1BEE7' },
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !noteData.tags.includes(newTag.trim())) {
      setNoteData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNoteData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleCreateNote = async () => {
    if (!noteData.title.trim() || !noteData.content.trim()) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    setLoading(true);
    try {
      const { note, error } = await notesService.createNote(noteData);
      
      if (error) {
        Alert.alert('Error', error);
      } else if (note) {
        Alert.alert('Success', 'Note created successfully!');
        onNoteCreated();
        handleClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNoteData({
      title: '',
      content: '',
      type: 'general',
      color: 'yellow',
      tags: [],
      is_pinned: false,
    });
    setNewTag('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Create New Note</Text>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleCreateNote}
              disabled={loading}
            >
              {loading ? (
                <LoadingSpinner size="small" color="#fff" />
              ) : (
                <Save size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Enter note title..."
                placeholderTextColor="#999"
                value={noteData.title}
                onChangeText={(text) => setNoteData(prev => ({ ...prev, title: text }))}
                maxLength={100}
              />
            </View>

            {/* Content Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Write your note content..."
                placeholderTextColor="#999"
                value={noteData.content}
                onChangeText={(text) => setNoteData(prev => ({ ...prev, content: text }))}
                multiline
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>

            {/* Note Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeContainer}>
                {noteTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      noteData.type === type.value && styles.typeButtonActive
                    ]}
                    onPress={() => setNoteData(prev => ({ ...prev, type: type.value as any }))}
                  >
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text style={[
                      styles.typeLabel,
                      noteData.type === type.value && styles.typeLabelActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Color</Text>
              <View style={styles.colorContainer}>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.color },
                      noteData.color === color.value && styles.colorButtonActive
                    ]}
                    onPress={() => setNoteData(prev => ({ ...prev, color: color.value as any }))}
                  >
                    {noteData.color === color.value && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tags */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add a tag..."
                  placeholderTextColor="#999"
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                  <Tag size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
              {noteData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {noteData.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity
                        style={styles.removeTagButton}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Pin Note */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.pinContainer}
                onPress={() => setNoteData(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
              >
                <BookOpen size={20} color={noteData.is_pinned ? '#667eea' : '#999'} />
                <Text style={[
                  styles.pinLabel,
                  noteData.is_pinned && styles.pinLabelActive
                ]}>
                  Pin this note
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
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
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  contentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
    height: 120,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeLabelActive: {
    color: '#fff',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#333',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  addTagButton: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  removeTagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 2,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pinLabel: {
    fontSize: 16,
    color: '#666',
  },
  pinLabelActive: {
    color: '#667eea',
    fontWeight: '600',
  },
});
