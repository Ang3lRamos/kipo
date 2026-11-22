import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useTheme } from '../theme-provider';

type Props = { size: number; progress: SharedValue<number> };

// Dos "z" que suben 16 px y se desvanecen en 3 s, desfasadas 1,5 s.
export function KipoZzz({ size, progress }: Props) {
  const theme = useTheme();
  const unit = size / 200;
  const color = theme.mascot.dark;

  const styleFor = (offset: number) => {
    'worklet';
    const p = (progress.value + offset) % 1;
    const opacity = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
    return { opacity, transform: [{ translateY: -16 * unit * p }] };
  };

  const first = useAnimatedStyle(() => styleFor(0));
  const second = useAnimatedStyle(() => styleFor(0.5));
  const font = { fontFamily: theme.font.heading, color };

  return (
    <>
      <Animated.Text
        style={[styles.z, font, { fontSize: 22 * unit, left: 148 * unit, top: 44 * unit }, first]}
      >
        z
      </Animated.Text>
      <Animated.Text
        style={[styles.z, font, { fontSize: 16 * unit, left: 164 * unit, top: 30 * unit }, second]}
      >
        z
      </Animated.Text>
    </>
  );
}

const styles = StyleSheet.create({
  z: { position: 'absolute' },
});
