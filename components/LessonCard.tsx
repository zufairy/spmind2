import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Badge from './Badge';
import ProgressBar from './ProgressBar';
import { Lesson } from '../types/lesson';

export default function LessonCard({ data }: { data: Lesson }) {
  const [flipped, setFlipped] = useState(false);
  const rotate = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotate.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotate.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0
  }));

  const toggle = () => {
    setFlipped(v => !v);
    rotate.value = withSpring(flipped ? 0 : 1, { damping: 14, stiffness: 160 });
  };

  const statusColor =
    data.status === 'Completed' ? '#22c55e' :
    data.status === 'In Progress' ? '#fde047' : '#60a5fa';

  const priorityColor =
    data.priority === 'High' ? '#fca5a5' :
    data.priority === 'Medium' ? '#fdba74' : '#86efac';

  return (
    <Pressable onPress={toggle} style={{ flex: 1 }}>
      {/* FRONT */}
      <Animated.View style={[{ flex: 1 }, frontStyle]}>
        <LinearGradient
          colors={['#D4FF00', '#A3E635']}
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1, 
            borderRadius: 24, 
            padding: 16,
            shadowColor: '#000', 
            shadowOpacity: 0.2, 
            shadowRadius: 12, 
            elevation: 6
          }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Badge text={data.status} color={statusColor} />
            <Badge text={data.priority} color={priorityColor} />
          </View>

          <View style={{ marginTop: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 24 }}>{data.emoji}</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#0a0a0a', flex: 1 }}>
                {data.title}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#0b0f19', fontWeight: '600' }}>
              {data.subject}
            </Text>
            <Text style={{ fontSize: 14, color: '#0b0f19' }} numberOfLines={3}>
              {data.summary}
            </Text>
          </View>

          <View style={{ marginTop: 'auto', gap: 8 }}>
            <Text style={{ color: '#0b0f19', fontWeight: '700' }}>Lesson progress</Text>
            <ProgressBar value={data.progress} />
            <Text style={{ alignSelf: 'flex-end', color: '#0b0f19', fontWeight: '700' }}>
              {data.progress}%
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* BACK */}
      <Animated.View style={[{ flex: 1 }, backStyle]}>
        <LinearGradient 
          colors={['#111827', '#0b1220']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, borderRadius: 24, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 24 }}>{data.emoji}</Text>
            <Text style={{ color: '#e5e7eb', fontSize: 18, fontWeight: '800' }}>
              Notes & Actions
            </Text>
          </View>
          <Text style={{ color: '#cbd5e1', lineHeight: 20, fontSize: 14 }}>
            {data.details || 'No notes available — tap to return.'}
          </Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}
