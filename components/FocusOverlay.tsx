import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Rect, Defs, Mask, Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FocusOverlayProps {
  widthPct?: number;           // 0..1, default 0.8  (80% of screen width)
  aspect?: number;             // width / height, default 4/3
  cornerRadius?: number;       // default 14
  dash?: { 
    length?: number; 
    gap?: number; 
    color?: string; 
    width?: number; 
  }; // default len 10, gap 6, white, 2px
  dimColor?: string;           // rgba(0,0,0,0.55) default
  hint?: string;               // optional helper text under box
}

export default function FocusOverlay({
  widthPct = 0.8,
  aspect = 4/1, // Changed from 3/1 to 4/1 for 200px smaller height (much wider, much shorter)
  cornerRadius = 20, // Increased from 14 to 20 for more rounded edges
  dash = { length: 8, gap: 4, color: '#FFFFFF', width: 3 }, // More frequent dashes
  dimColor = 'rgba(0, 0, 0, 0.55)',
  hint,
}: FocusOverlayProps) {
  const boxWidth = screenWidth * widthPct;
  const boxHeight = boxWidth / aspect;
  const boxX = (screenWidth - boxWidth) / 2;
  // Move the focus area higher on the screen
  const boxY = (screenHeight - boxHeight) / 2 - 120; // Moved from -80 to -120 (40px higher)

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Premium blur overlays outside focus area */}
      {/* Top blur overlay */}
      <View style={[styles.blurSection, { top: 0, left: 0, right: 0, height: boxY }]}>
        <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.darkOverlay} />
        </BlurView>
      </View>
      
      {/* Bottom blur overlay */}
      <View style={[styles.blurSection, { top: boxY + boxHeight, left: 0, right: 0, bottom: 0 }]}>
        <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.darkOverlay} />
        </BlurView>
      </View>
      
      {/* Left blur overlay */}
      <View style={[styles.blurSection, { top: boxY, left: 0, width: boxX, height: boxHeight }]}>
        <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.darkOverlay} />
        </BlurView>
      </View>
      
      {/* Right blur overlay */}
      <View style={[styles.blurSection, { top: boxY, right: 0, width: screenWidth - boxX - boxWidth, height: boxHeight }]}>
        <BlurView intensity={35} style={StyleSheet.absoluteFill} tint="dark">
          <View style={styles.darkOverlay} />
        </BlurView>
      </View>
      
      {/* SVG for the focus area border */}
      <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>        
        {/* Dashed border for focus area with rounded corners */}
        <Rect 
          x={boxX} 
          y={boxY} 
          width={boxWidth} 
          height={boxHeight} 
          rx={cornerRadius}
          ry={cornerRadius}
          fill="transparent"
          stroke={dash.color}
          strokeWidth={dash.width}
          strokeDasharray={`${dash.length} ${dash.gap}`}
          strokeLinecap="round"
        />
        
        {/* Corner indicators with better alignment */}
        <Path 
          d={`M ${boxX - 2} ${boxY + cornerRadius} L ${boxX - 2} ${boxY - 2} L ${boxX + cornerRadius} ${boxY - 2}`}
          stroke={dash.color}
          strokeWidth={dash.width * 1.5}
          strokeLinecap="round"
        />
        <Path 
          d={`M ${boxX + boxWidth - cornerRadius} ${boxY - 2} L ${boxX + boxWidth + 2} ${boxY - 2} L ${boxX + boxWidth + 2} ${boxY + cornerRadius}`}
          stroke={dash.color}
          strokeWidth={dash.width * 1.5}
          strokeLinecap="round"
        />
        <Path 
          d={`M ${boxX + boxWidth + 2} ${boxY + boxHeight - cornerRadius} L ${boxX + boxWidth + 2} ${boxY + boxHeight + 2} L ${boxX + boxWidth - cornerRadius} ${boxY + boxHeight + 2}`}
          stroke={dash.color}
          strokeWidth={dash.width * 1.5}
          strokeLinecap="round"
        />
        <Path 
          d={`M ${boxX + cornerRadius} ${boxY + boxHeight + 2} L ${boxX - 2} ${boxY + boxHeight + 2} L ${boxX - 2} ${boxY + boxHeight - cornerRadius}`}
          stroke={dash.color}
          strokeWidth={dash.width * 1.5}
          strokeLinecap="round"
        />
      </Svg>
      
      {/* Hint text */}
      {hint && (
        <View style={[styles.hintContainer, { top: boxY + boxHeight + 20 }]}>
          <Text style={styles.hintText}>{hint}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blurSection: {
    position: 'absolute',
    overflow: 'hidden',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  hintContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  hintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Chalkduster' : 'cursive',
    fontWeight: '400',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
});