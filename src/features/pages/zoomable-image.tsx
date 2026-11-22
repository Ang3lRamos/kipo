import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const maxScale = 6;

// Imagen con zoom de pellizco, arrastre y doble toque para acercar o volver al tamaño normal.
export function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinch = usePinchGesture({
    onUpdate: (event) => {
      'worklet';
      scale.value = Math.min(maxScale, Math.max(1, savedScale.value * event.scale));
    },
    onDeactivate: () => {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    },
  });

  const pan = usePanGesture({
    onUpdate: (event) => {
      'worklet';
      if (scale.value <= 1) return;
      translateX.value += event.changeX;
      translateY.value += event.changeY;
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    onActivate: () => {
      'worklet';
      const next = scale.value > 1 ? 1 : 2.5;
      scale.value = withTiming(next);
      savedScale.value = next;
      if (next === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    },
  });

  const gesture = useSimultaneousGestures(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.fill, animatedStyle]}>
        <Image source={{ uri }} style={styles.fill} contentFit="contain" cachePolicy="none" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
