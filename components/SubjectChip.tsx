import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Video as LucideIcon } from 'lucide-react-native';

interface SubjectChipProps {
  name: string;
  icon: typeof LucideIcon;
  isActive: boolean;
  onPress: () => void;
  color?: string;
}

export function SubjectChip({ name, icon: Icon, isActive, onPress, color = '#00FF00' }: SubjectChipProps) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && [styles.activeChip, { backgroundColor: color }],
      ]}
      onPress={onPress}
    >
      <Icon size={16} color={isActive ? '#000000' : color} />
      <Text
        style={[
          styles.chipText,
          isActive && styles.activeChipText,
        ]}
      >
        {name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeChip: {
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  activeChipText: {
    color: '#000000',
  },
});