import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
// Card sizing to achieve consistent 2-column layout with even gap
const GRID_HORIZONTAL_PADDING = 0; // no outer padding
const GRID_COLUMN_GAP = 0; // no horizontal gap
const CARD_SIZE = width / 2; // square, two columns edge-to-edge

interface StickyNoteCardProps {
  title?: string;
  content: string;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: any;
}

// 1. Glass Sticky Note
export const GlassStickyNote: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(glow.value, [0, 1], [0.1, 0.3], Extrapolation.CLAMP),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    glow.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    glow.value = withTiming(0, { duration: 200 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.glassCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="rgba(255, 255, 255, 0.2)" />
              <Stop offset="0.5" stopColor="rgba(255, 255, 255, 0.1)" />
              <Stop offset="1" stopColor="rgba(255, 255, 255, 0.05)" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={16} fill="url(#glassGradient)" />
        </Svg>
        
        <View style={styles.glassContent}>
          <Text style={styles.glassTitle}>{title}</Text>
          <Text style={styles.glassText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 2. Leather-bound Note
export const LeatherBoundNote: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.leatherCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="leatherGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#8B4513" />
              <Stop offset="0.5" stopColor="#A0522D" />
              <Stop offset="1" stopColor="#654321" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={16} fill="url(#leatherGradient)" />
          
          {/* Stitching effect */}
          <Path
            d="M 10 20 Q 50 15 90 20 M 10 40 Q 50 35 90 40 M 10 60 Q 50 55 90 60"
            stroke="#DAA520"
            strokeWidth="2"
            fill="none"
            strokeDasharray="3,3"
          />
        </Svg>
        
        <View style={styles.leatherContent}>
          <Text style={styles.leatherTitle}>{title}</Text>
          <Text style={styles.leatherText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 3. Neon Glow Board
export const NeonGlowBoard: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowColor: '#00FFFF',
    shadowOpacity: interpolate(glow.value, [0, 1], [0.2, 0.6], Extrapolation.CLAMP),
    shadowRadius: interpolate(glow.value, [0, 1], [8, 16], Extrapolation.CLAMP),
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    glow.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    glow.value = withTiming(0, { duration: 300 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.neonCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#1a1a1a" />
              <Stop offset="1" stopColor="#2d2d2d" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx={16} fill="url(#neonGradient)" />
          
          {/* Neon border (percentage-based, no calc) */}
          <Rect x="1%" y="1%" width="98%" height="98%" rx={14} stroke="#00FFFF" strokeWidth={2} fill="none" />
        </Svg>
        
        <View style={styles.neonContent}>
          <Text style={styles.neonTitle}>{title}</Text>
          <Text style={styles.neonText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 4. Origami Paper Card
export const OrigamiPaperCard: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
    rotate.value = withSpring(1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    rotate.value = withSpring(0);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.origamiCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="origamiGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFE4E1" />
              <Stop offset="0.5" stopColor="#FFF0F5" />
              <Stop offset="1" stopColor="#F0F8FF" />
            </LinearGradient>
          </Defs>
          
          {/* Main paper */}
          <Rect width="100%" height="100%" rx={16} fill="url(#origamiGradient)" />
          
          {/* Folded corner effect */}
          <Path
            d="M 80 20 L 100 20 L 100 40 L 80 20"
            fill="#E6E6FA"
            opacity="0.8"
          />
          
          {/* Shadow layers for depth (percentage-based) */}
          <Rect x="4%" y="4%" width="92%" height="92%" rx={12} fill="rgba(0,0,0,0.05)" />
        </Svg>
        
        <View style={styles.origamiContent}>
          <Text style={styles.origamiTitle}>{title}</Text>
          <Text style={styles.origamiText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 5. Pixel Post-it
export const PixelPostIt: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.pixelCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="pixelGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFD700" />
              <Stop offset="1" stopColor="#FFA500" />
            </LinearGradient>
          </Defs>
          
          {/* Main card */}
          <Rect width="100%" height="100%" rx={8} fill="url(#pixelGradient)" />
          
          {/* Pixel border */}
          <G stroke="#FF8C00" strokeWidth="2" fill="none">
            <Path d="M 0 0 L 100 0 M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" />
            <Path d="M 0 0 L 0 100 M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100" />
          </G>
          
          {/* Torn corner */}
          <Path
            d="M 85 15 L 95 15 L 95 25 L 85 15"
            fill="#FF6347"
            opacity="0.8"
          />
        </Svg>
        
        <View style={styles.pixelContent}>
          <Text style={styles.pixelTitle}>{title}</Text>
          <Text style={styles.pixelText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 6. Nature Leaf Card
export const NatureLeafCard: React.FC<StickyNoteCardProps> = ({ 
  title, 
  content, 
  onPress, 
  onLongPress, 
  style 
}) => {
  const scale = useSharedValue(1);
  const float = useSharedValue(0);

  React.useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: interpolate(float.value, [0, 1], [0, -3], Extrapolation.CLAMP) }
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.card, style]}
    >
      <Animated.View style={[styles.natureCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="natureGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#90EE90" />
              <Stop offset="0.5" stopColor="#98FB98" />
              <Stop offset="1" stopColor="#ADFF2F" />
            </LinearGradient>
          </Defs>
          
          {/* Background */}
          <Rect width="100%" height="100%" rx={16} fill="url(#natureGradient)" />
          
          {/* Leaf overlay */}
          <Path
            d="M 20 30 Q 40 20 60 30 Q 80 40 60 50 Q 40 60 20 50 Q 10 40 20 30"
            fill="rgba(34, 139, 34, 0.3)"
          />
          
          {/* Wooden pushpin */}
          <Circle cx="85" cy="20" r="8" fill="#8B4513" />
          <Circle cx="85" cy="20" r="3" fill="#654321" />
        </Svg>
        
        <View style={styles.natureContent}>
          <Text style={styles.natureTitle}>{title}</Text>
          <Text style={styles.natureText}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ====== New set matching reference visuals ======
// 1) Parchment Scroll Card
export const ParchmentScrollCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onIn = () => { scale.value = withSpring(0.97); };
  const onOut = () => { scale.value = withSpring(1); };
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={0.9} style={[styles.cardTall, style]}>
      <Animated.View style={[styles.parchmentCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="parchGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#F6E7C1" />
              <Stop offset="1" stopColor="#EAD7A1" />
            </LinearGradient>
          </Defs>
          {/* main parchment (percentage-based) */}
          <Rect x="3%" y="6%" width="94%" height="88%" rx={16} fill="url(#parchGrad)" />
          {/* scroll ends */}
          <G opacity="0.9">
            <Path d="M8 18 q10 -10 20 0 v8 q-10 10 -20 0 z" fill="#DFC996" />
            <Path d="M92 18 q-10 -10 -20 0 v8 q10 10 20 0 z" fill="#DFC996" />
          </G>
          {/* edge burn */}
          <Rect x="3%" y="6%" width="94%" height="88%" rx={16} stroke="#C8AE78" strokeWidth={2} fill="none" />
        </Svg>
        <View style={styles.parchmentContent}>
          <Text style={styles.parchmentText} numberOfLines={4}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 2) Yellow Block Note with leaf
export const YellowBlockNoteCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const onIn = () => { scale.value = withSpring(0.96); };
  const onOut = () => { scale.value = withSpring(1); };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={0.9} style={[styles.card, style]}>
      <Animated.View style={[styles.yellowBlockCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Rect width="100%" height="100%" rx="16" fill="#FFD84D" />
          {/* little pine/leaf */}
          <Path d="M88 10 q6 6 0 12 q-6 -6 0 -12" fill="#2E7D32" opacity="0.9" />
          <Path d="M94 14 q6 6 0 12 q-6 -6 0 -12" fill="#388E3C" opacity="0.9" />
        </Svg>
        <View style={styles.yellowBlockContent}>
          <Text style={styles.yellowBlockText} numberOfLines={4}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 3) Blue pinned note with pin + signature
export const BluePinnedNoteCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={() => (scale.value = withSpring(0.97))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={0.9} style={[styles.card, style]}>
      <Animated.View style={[styles.bluePinnedCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Rect width="100%" height="100%" rx="16" fill="#7BA4E6" />
          {/* pin */}
          <G>
            <Circle cx="18" cy="16" r="8" fill="#D87B44" />
            <Rect x="16" y="22" width="4" height="10" fill="#795548" />
          </G>
          {/* signature */}
          <Path d="M20 72 q20 -6 32 4 q8 6 18 -4" stroke="#1E3A8A" strokeWidth="2" fill="none" opacity="0.6" />
        </Svg>
        <View style={styles.bluePinnedContent}>
          <Text style={styles.bluePinnedText} numberOfLines={4}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 4) Caution cyan with diamond icon
export const CautionNoteCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={() => (scale.value = withSpring(0.97))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={0.9} style={[styles.card, style]}>
      <Animated.View style={[styles.cautionCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Rect width="100%" height="100%" rx="16" fill="#6FD3E8" />
          <G>
            <Path d="M56 10 l10 10 l-10 10 l-10 -10 z" fill="#FFC107" stroke="#FF8F00" strokeWidth="2" />
            <Rect x="55" y="16" width="2" height="6" fill="#333" />
            <Rect x="55" y="24" width="2" height="2" fill="#333" />
          </G>
        </Svg>
        <View style={styles.cautionContent}>
          <Text style={styles.cautionText} numberOfLines={4}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 5) Taped handwritten note (mint with tape + smiley)
export const TapedHandwrittenNoteCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={() => (scale.value = withSpring(0.97))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={0.9} style={[styles.cardTall, style]}>
      <Animated.View style={[styles.tapedCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Rect width="100%" height="100%" rx="16" fill="#CFF6D2" />
          {/* tape */}
          <Rect x="22" y="-6" width="56" height="20" rx="3" fill="#FFF9C4" opacity="0.9" />
          {/* red smiley */}
          <G>
            <Circle cx="88" cy="20" r="10" stroke="#E53935" strokeWidth="3" fill="none" />
            <Circle cx="84" cy="18" r="1.8" fill="#E53935" />
            <Circle cx="92" cy="18" r="1.8" fill="#E53935" />
            <Path d="M82 22 q6 6 12 0" stroke="#E53935" strokeWidth="3" fill="none" />
          </G>
        </Svg>
        <View style={styles.tapedContent}>
          <Text style={styles.tapedText} numberOfLines={4}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// 6) Spiral notebook with pen
export const SpiralNotebookCard: React.FC<StickyNoteCardProps> = ({ content, onPress, onLongPress, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} onPressIn={() => (scale.value = withSpring(0.97))} onPressOut={() => (scale.value = withSpring(1))} activeOpacity={0.9} style={[styles.cardTall, style]}>
      <Animated.View style={[styles.notebookCard, animatedStyle]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          <Rect width="100%" height="100%" rx="16" fill="#E8D1A6" />
          {/* spiral holes */}
          <G>
            <Circle cx="10" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="20" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="30" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="40" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="50" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="60" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="70" cy="10" r="3" fill="#B0B0B0" />
            <Circle cx="80" cy="10" r="3" fill="#B0B0B0" />
          </G>
          {/* pen nib */}
          <Path d="M88 70 l8 8 l-16 4 z" fill="#374151" opacity="0.8" />
        </Svg>
        <View style={styles.notebookContent}>
          <Text style={styles.notebookText} numberOfLines={5}>{content}</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE, // square
    marginBottom: 5,
  },
  cardTall: {
    width: CARD_SIZE,
    height: CARD_SIZE, // square variant
    marginBottom: 5,
  },
  
  // Glass Sticky Note
  glassCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glassContent: {
    flex: 1,
    justifyContent: 'center',
  },
  glassTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  glassText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Leather-bound Note
  leatherCard: {
    flex: 1,
    backgroundColor: '#654321',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#DAA520',
  },
  leatherContent: {
    flex: 1,
    justifyContent: 'center',
  },
  leatherTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFD700',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  leatherText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#F5DEB3',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Neon Glow Board
  neonCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 22,
    padding: 16,
    borderWidth: 3,
    borderColor: '#00FFFF',
    shadowColor: '#00FFFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  neonContent: {
    flex: 1,
    justifyContent: 'center',
  },
  neonTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#00FFFF',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: '#00FFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  neonText: {
    fontSize: 14,
    fontFamily: 'Caveat-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  
  // Origami Paper Card
  origamiCard: {
    flex: 1,
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#FFB6C1',
  },
  origamiContent: {
    flex: 1,
    justifyContent: 'center',
  },
  origamiTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FF1493',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 20, 147, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  origamiText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#8B4513',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Pixel Post-it
  pixelCard: {
    flex: 1,
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FF6347',
  },
  pixelContent: {
    flex: 1,
    justifyContent: 'center',
  },
  pixelTitle: {
    fontSize: 19,
    fontFamily: 'Inter-Bold',
    color: '#8B0000',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(139, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pixelText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#654321',
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Nature Leaf Card
  natureCard: {
    flex: 1,
    backgroundColor: '#32CD32',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#228B22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#228B22',
  },
  natureContent: {
    flex: 1,
    justifyContent: 'center',
  },
  natureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#006400',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 100, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  natureText: {
    fontSize: 14,
    fontFamily: 'Caveat-Regular',
    color: '#004D00',
    textAlign: 'center',
    lineHeight: 18,
  },
  // New themed styles
  parchmentCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  parchmentContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 8 },
  parchmentText: { fontSize: 18, fontFamily: 'Georgia', color: '#3A2F1B', textAlign: 'left', lineHeight: 22 },

  yellowBlockCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  yellowBlockContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  yellowBlockText: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', color: '#2b2b2b', textAlign: 'left', lineHeight: 20 },

  bluePinnedCard: { flex: 1, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  bluePinnedContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  bluePinnedText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#0B1220', textAlign: 'left', lineHeight: 20 },

  cautionCard: { flex: 1, borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  cautionContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  cautionText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#0B2B33', textAlign: 'left', lineHeight: 20 },

  tapedCard: { flex: 1, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  tapedContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  tapedText: { fontSize: 18, fontFamily: 'PatrickHand_400Regular', color: '#1C1C1C', textAlign: 'left', lineHeight: 22 },

  notebookCard: { flex: 1, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  notebookContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 10 },
  notebookText: { fontSize: 15, fontFamily: 'Inter-Regular', color: '#2b2b2b', lineHeight: 20 },
});
