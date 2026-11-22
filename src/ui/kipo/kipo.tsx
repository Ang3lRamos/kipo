import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useEffect, useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme-provider';
import type { MascotColors } from '../themes';

import { KipoBody } from './kipo-body';
import { KipoEyes, KipoRing, KipoShadow } from './kipo-parts';
import { simpleBelow, viewBox, type KipoMood } from './kipo-types';
import { useKipoMotion } from './use-kipo-motion';
import { KipoZzz } from './kipo-zzz';

type Props = {
  mood: KipoMood;
  size: number;
  colors?: MascotColors; // por defecto, la paleta del tema
  animated?: boolean;
  // Al cambiar, Kipo da un saltito con vibración leve (por ejemplo, al despertar).
  bounceKey?: number;
  style?: ViewStyle;
};

// Puntos de giro en porcentaje del viewBox: argolla en (100, 48) y ojos a la altura y = 112.
const ringOrigin = `50% ${(48 / viewBox.height) * 100}%`;
const eyesOrigin = `50% ${(112 / viewBox.height) * 100}%`;

export function Kipo({ mood, size, colors, animated = true, bounceKey = 0, style }: Props) {
  const theme = useTheme();
  const palette = colors ?? theme.mascot;
  const idPrefix = `k${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const simple = size < simpleBelow;
  const unit = size / viewBox.width; // píxeles por unidad del viewBox
  const { float, ring, blink, look, zzz, reduced } = useKipoMotion(mood, animated);
  const bounce = useSharedValue(1);
  const lift = (mood === 'dormido' ? 2 : 6) * unit;

  useEffect(() => {
    if (bounceKey === 0) return;
    void impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
    if (reduced) return;
    bounce.value = withSequence(
      withTiming(1.08, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );
  }, [bounceKey, reduced, bounce]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift * float.value }, { scale: bounce.value }],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - 0.15 * float.value }],
    opacity: 1 - 0.3 * float.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${ring.value}deg` }] }));
  const eyesStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: look.value * unit }, { scaleY: blink.value }],
  }));

  const box = { width: size, height: size * (viewBox.height / viewBox.width) };
  return (
    <View
      style={[box, style]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <Animated.View style={[StyleSheet.absoluteFill, shadowStyle]}>
        <KipoShadow idPrefix={idPrefix} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, floatStyle]}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { transformOrigin: ringOrigin }, ringStyle]}
        >
          <KipoRing idPrefix={idPrefix} />
        </Animated.View>
        <View style={StyleSheet.absoluteFill}>
          <KipoBody colors={palette} mood={mood} simple={simple} idPrefix={idPrefix} />
        </View>
        <Animated.View
          style={[StyleSheet.absoluteFill, { transformOrigin: eyesOrigin }, eyesStyle]}
        >
          <KipoEyes mood={mood} simple={simple} />
        </Animated.View>
        {mood === 'dormido' ? <KipoZzz size={size} progress={zzz} /> : null}
      </Animated.View>
    </View>
  );
}
