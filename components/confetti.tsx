import { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];

type Particle = {
  x: Animated.Value; y: Animated.Value; rot: Animated.Value;
  color: string; size: number;
};

export function Confetti({ active }: { active: boolean }) {
  const particles = useRef<Particle[]>([]).current;

  useEffect(() => {
    if (!active) { particles.forEach(p => { p.x.removeAllListeners(); p.y.removeAllListeners(); p.rot.removeAllListeners(); }); particles.length = 0; return; }

    for (let i = 0; i < 30; i++) {
      const p: Particle = {
        x: new Animated.Value(Math.random() * width),
        y: new Animated.Value(-30),
        rot: new Animated.Value(0),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
      };
      particles.push(p);
      Animated.parallel([
        Animated.timing(p.y, { toValue: height + 50, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(p.x, { toValue: p.x._value + (Math.random() - 0.5) * 200, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
        Animated.timing(p.rot, { toValue: Math.random() * 720, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
      ]).start();
    }
    return () => { particles.forEach(p => { p.x.removeAllListeners(); p.y.removeAllListeners(); p.rot.removeAllListeners(); }); particles.length = 0; };
  }, [active]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[{
            position: 'absolute', width: p.size, height: p.size * 0.6,
            backgroundColor: p.color, borderRadius: 2,
            transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: p.rot.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }],
          }]}
        />
      ))}
    </View>
  );
}
