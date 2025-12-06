import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAvatarStore } from '../stores/avatarStore';

const { width: screenWidth } = Dimensions.get('window');

interface AvatarCustomizationProps {
  visible: boolean;
  onClose: () => void;
}

export default function AvatarCustomization({ visible, onClose }: AvatarCustomizationProps) {
  const {
    personality,
    size,
    hairColor,
    eyeColor,
    skinTone,
    accessories,
    updatePersonality,
    setHairColor,
    setEyeColor,
    setSkinTone,
    setAccessories,
  } = useAvatarStore();

  const [activeTab, setActiveTab] = useState<'personality' | 'appearance' | 'accessories'>('personality');

  const hairColors = [
    '#FFD700', '#FFA500', '#FF8C00', '#8B4513', '#A0522D',
    '#CD853F', '#DDA0DD', '#FF69B4', '#87CEEB', '#98FB98',
  ];

  const eyeColors = [
    '#4169E1', '#0000CD', '#8A2BE2', '#FF1493', '#FF6347',
    '#32CD32', '#FFD700', '#FFA500', '#DDA0DD', '#87CEEB',
  ];

  const skinTones = [
    '#FFE4B5', '#F5DEB3', '#DEB887', '#D2B48C', '#BC9A6A',
    '#CD853F', '#D2691E', '#A0522D', '#8B4513', '#654321',
  ];

  const accessoryOptions = [
    { id: 'bow', emoji: '🎀', name: 'Bow' },
    { id: 'hat', emoji: '🎩', name: 'Hat' },
    { id: 'glasses', emoji: '🤓', name: 'Glasses' },
    { id: 'wings', emoji: '👼', name: 'Wings' },
    { id: 'crown', emoji: '👑', name: 'Crown' },
    { id: 'flower', emoji: '🌸', name: 'Flower' },
  ];

  const personalityTraits = [
    { key: 'shyness', name: 'Shyness', description: 'How shy or outgoing the avatar is' },
    { key: 'energy', name: 'Energy', description: 'How energetic or calm the avatar is' },
    { key: 'playfulness', name: 'Playfulness', description: 'How playful or serious the avatar is' },
    { key: 'curiosity', name: 'Curiosity', description: 'How curious or uninterested the avatar is' },
    { key: 'affection', name: 'Affection', description: 'How affectionate or distant the avatar is' },
  ] as const;

  const renderPersonalityTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Personality Traits</Text>
      <Text style={styles.sectionDescription}>
        Adjust your avatar's personality to match your preferences
      </Text>
      
      {personalityTraits.map((trait) => (
        <View key={trait.key} style={styles.traitContainer}>
          <View style={styles.traitHeader}>
            <Text style={styles.traitName}>{trait.name}</Text>
            <Text style={styles.traitValue}>
              {Math.round(personality[trait.key] * 100)}%
            </Text>
          </View>
          <Text style={styles.traitDescription}>{trait.description}</Text>
          
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={styles.sliderTrack}
              onPress={(event) => {
                const { locationX } = event.nativeEvent;
                const percentage = Math.max(0, Math.min(1, locationX / 300));
                updatePersonality(trait.key, percentage);
              }}
            >
              <View style={styles.sliderTrackBackground} />
              <View
                style={[
                  styles.sliderTrackFill,
                  { width: `${personality[trait.key] * 100}%` },
                ]}
              />
              <View
                style={[
                  styles.sliderThumb,
                  { left: `${personality[trait.key] * 100}%` },
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderAppearanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      
      {/* Hair Color */}
      <View style={styles.colorSection}>
        <Text style={styles.colorSectionTitle}>Hair Color</Text>
        <View style={styles.colorGrid}>
          {hairColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                hairColor === color && styles.selectedColor,
              ]}
              onPress={() => setHairColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Eye Color */}
      <View style={styles.colorSection}>
        <Text style={styles.colorSectionTitle}>Eye Color</Text>
        <View style={styles.colorGrid}>
          {eyeColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                eyeColor === color && styles.selectedColor,
              ]}
              onPress={() => setEyeColor(color)}
            />
          ))}
        </View>
      </View>

      {/* Skin Tone */}
      <View style={styles.colorSection}>
        <Text style={styles.colorSectionTitle}>Skin Tone</Text>
        <View style={styles.colorGrid}>
          {skinTones.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                skinTone === color && styles.selectedColor,
              ]}
              onPress={() => setSkinTone(color)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderAccessoriesTab = () => (
    <ScrollView style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Accessories</Text>
      <Text style={styles.sectionDescription}>
        Add cute accessories to your avatar
      </Text>
      
      <View style={styles.accessoriesGrid}>
        {accessoryOptions.map((accessory) => {
          const isSelected = accessories.includes(accessory.id);
          return (
            <TouchableOpacity
              key={accessory.id}
              style={[
                styles.accessoryOption,
                isSelected && styles.selectedAccessory,
              ]}
              onPress={() => {
                const newAccessories = isSelected
                  ? accessories.filter(id => id !== accessory.id)
                  : [...accessories, accessory.id];
                setAccessories(newAccessories);
              }}
            >
              <Text style={styles.accessoryEmoji}>{accessory.emoji}</Text>
              <Text style={styles.accessoryName}>{accessory.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <LinearGradient
        colors={['#FFE4E1', '#FFB6C1', '#FFC0CB']}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Customize Your Avatar</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'personality' && styles.activeTab]}
            onPress={() => setActiveTab('personality')}
          >
            <Text style={[styles.tabText, activeTab === 'personality' && styles.activeTabText]}>
              Personality
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'appearance' && styles.activeTab]}
            onPress={() => setActiveTab('appearance')}
          >
            <Text style={[styles.tabText, activeTab === 'appearance' && styles.activeTabText]}>
              Appearance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'accessories' && styles.activeTab]}
            onPress={() => setActiveTab('accessories')}
          >
            <Text style={[styles.tabText, activeTab === 'accessories' && styles.activeTabText]}>
              Accessories
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'personality' && renderPersonalityTab()}
          {activeTab === 'appearance' && renderAppearanceTab()}
          {activeTab === 'accessories' && renderAccessoriesTab()}
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 20,
  },
  traitContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  traitValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  traitDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 15,
    lineHeight: 16,
  },
  sliderContainer: {
    height: 30,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  sliderTrackBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  sliderTrackFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    marginLeft: -9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  colorSection: {
    marginBottom: 30,
  },
  colorSectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedColor: {
    borderColor: '#FFFFFF',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  accessoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  accessoryOption: {
    width: (screenWidth - 70) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedAccessory: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: '#FFFFFF',
  },
  accessoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  accessoryName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
