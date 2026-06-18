import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { useKnightTheme } from '@/constants/knight-theme';

const { width, height } = Dimensions.get('window');

export function GradientBg() {
  const { theme } = useKnightTheme();
  const anim1 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim1, { toValue: 1, duration: 6000, useNativeDriver: false }),
        Animated.timing(anim1, { toValue: 0, duration: 6000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const bgColor = anim1.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.gradientStart, theme.gradientEnd],
  });

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.3 }]}
      pointerEvents="none"
    />
  );
}
