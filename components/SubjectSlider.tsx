import React, { useMemo, useRef, useState, useEffect } from "react";
import { Dimensions, StyleSheet, Text, View, Platform } from "react-native";
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

const { width: W } = Dimensions.get("window");
const GAP = 14;

export type Subject = { key: string; name: string; color: string; icon: string };

type Props = {
  subjects: Subject[];
  initialIndex?: number;
  activeIndex?: number; // Add controlled activeIndex prop
  onChange?: (s: Subject, i: number) => void;
  // UI hooks
  onTheme?: (color: string) => void; // e.g., color the shutter
};

export default function SubjectSlider({
  subjects,
  initialIndex = 0,
  onChange,
  onTheme,
  activeIndex = initialIndex, // Add controlled activeIndex prop
}: Props) {
  // measured widths + offsets
  const [w, setW] = useState<number[]>(Array(subjects.length).fill(0));
  const [padStart, setPadStart] = useState(0);
  const [padEnd, setPadEnd] = useState(0);
  const [offsets, setOffsets] = useState<number[] | null>(null);

  const x = useSharedValue(0);
  const listRef = useAnimatedRef<Animated.FlatList<Subject>>();
  const [active, setActive] = useState(initialIndex);

  // Sync active state with controlled activeIndex
  useEffect(() => {
    if (activeIndex !== active && activeIndex >= 0 && activeIndex < subjects.length) {
      setActive(activeIndex);
      // Scroll to the new active index
      if (offsets && listRef.current) {
        requestAnimationFrame(() => {
          listRef.current?.scrollToOffset({ offset: offsets[activeIndex], animated: true });
          x.value = offsets[activeIndex];
        });
      }
    }
  }, [activeIndex, active, subjects.length, offsets, listRef, x]);

  // compute offsets when widths known
  const maybeCompute = (widths: number[]) => {
    if (widths.some(v => v === 0)) return;
    const _padStart = (W - widths[0]) / 2;
    const _padEnd   = (W - widths[widths.length - 1]) / 2;
    const offs: number[] = [];
    let prefix = 0;
    for (let i = 0; i < widths.length; i++) {
      const center = _padStart + prefix + widths[i] / 2;
      offs.push(center - W / 2);
      prefix += widths[i] + GAP;
    }
    setPadStart(_padStart);
    setPadEnd(_padEnd);
    setOffsets(offs);
    // jump to initial index
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: offs[initialIndex], animated: false });
      x.value = offs[initialIndex];
    });
  };

  const onMeasure = (i: number, width: number) => {
    setW(prev => {
      const next = prev.slice();
      next[i] = Math.round(width);
      if (next.every(v => v > 0)) maybeCompute(next);
      return next;
    });
  };

  // color interpolation across offsets
  const colors = subjects.map(s => s.color);
  const colorVal = useDerivedValue(() => {
    if (!offsets) return colors[active];
    return interpolateColor(x.value, offsets, colors);
  });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { x.value = e.contentOffset.x; },
    onMomentumEnd: (e) => {
      if (!offsets) return;
      const sx = e.contentOffset.x;
      // find nearest
      let best = 0, bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < offsets.length; i++) {
        const d = Math.abs(offsets[i] - sx);
        if (d < bestDist) { best = i; bestDist = d; }
      }
      // align perfectly if off a little
      if (Math.abs(offsets[best] - sx) > 0.5) {
        // snap to the exact center
        // @ts-ignore
        listRef.current?.scrollToOffset({ offset: offsets[best], animated: true });
      }
      if (best !== active) {
        runOnJS(setActive)(best);
        if (onChange) runOnJS(onChange)(subjects[best], best);
      }
      if (onTheme) runOnJS(onTheme)(colors[best]);
    },
  });



  const renderItem = ({ item, index }: { item: Subject; index: number }) => {
    return (
      <View
        onLayout={(e) => onMeasure(index, e.nativeEvent.layout.width)}
        style={{ marginRight: GAP }}
      >
        <Animated.View style={[styles.pill]}>
          <Text numberOfLines={1} style={styles.pillText}>{item.name}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <Animated.FlatList
        ref={listRef}
        data={subjects}
        keyExtractor={(s) => s.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        // we'll snap manually via offsets + momentumEnd correction
        snapToOffsets={offsets || undefined}
        snapToAlignment="start"
        contentContainerStyle={{ paddingLeft: padStart, paddingRight: padEnd }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
  },
  pill: {
    minWidth: 96,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // transparent background
  },
  pillText: {
    color: "#ffffff",
    fontSize: 16,
    letterSpacing: 0.3,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
