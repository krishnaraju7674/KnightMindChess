import { View, Text, StyleSheet } from 'react-native';
import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';

const pieceSymbols: Record<string, string> = {
  wp: '\u2659', wn: '\u2658', wb: '\u2657', wr: '\u2656', wq: '\u2655', wk: '\u2654',
  bp: '\u265F', bn: '\u265E', bb: '\u265D', br: '\u265C', bq: '\u265B', bk: '\u265A',
};

export function ChessPiece({
  pieceKey,
  isWhite,
  size,
  theme,
  symbol,
}: {
  pieceKey: string;
  isWhite: boolean;
  size: number;
  theme: KnightTheme;
  symbol?: string;
}) {
  const discSize = size * 0.88;
  const innerSize = discSize * 0.78;
  const char = symbol ?? pieceSymbols[pieceKey] ?? '?';

  const lightGradient = ['#FEFCF5', '#F5F0E8', '#E8E0D0'];
  const darkGradient = ['#3A3A3A', '#2A2A2A', '#1A1A1A'];

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View
        style={[
          styles.discBase,
          {
            width: discSize,
            height: discSize,
            borderRadius: discSize / 2,
            backgroundColor: isWhite ? '#D4C8B0' : '#111',
            borderWidth: isWhite ? 1 : 2,
            borderColor: isWhite ? '#B8A890' : '#444',
            shadowColor: '#000',
            shadowOpacity: isWhite ? 0.25 : 0.45,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 5 },
            elevation: 12,
          },
        ]}
      >
        <View
          style={[
            styles.discSurface,
            {
              width: discSize - 2,
              height: discSize - 2,
              borderRadius: (discSize - 2) / 2,
              backgroundColor: isWhite ? lightGradient[0] : darkGradient[0],
              top: 1,
            },
          ]}
        />

        <View
          style={[
            styles.innerRing,
            {
              width: innerSize + 6,
              height: innerSize + 6,
              borderRadius: (innerSize + 6) / 2,
              backgroundColor: isWhite ? '#E8E0D0' : '#333',
            },
          ]}
        />

        <View
          style={[
            styles.innerDisc,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: isWhite ? '#FEFCF5' : '#222',
            },
          ]}
        />

        <View
          style={[
            styles.glossHighlight,
            {
              width: discSize * 0.65,
              height: discSize * 0.28,
              borderRadius: discSize * 0.2,
              top: discSize * 0.08,
              backgroundColor: isWhite
                ? 'rgba(255,255,255,0.7)'
                : 'rgba(255,255,255,0.06)',
            },
          ]}
        />

        <View
          style={[
            styles.bottomShade,
            {
              width: discSize * 0.7,
              height: discSize * 0.15,
              borderRadius: discSize * 0.1,
              bottom: discSize * 0.05,
              backgroundColor: isWhite
                ? 'rgba(0,0,0,0.04)'
                : 'rgba(0,0,0,0.25)',
            },
          ]}
        />

        <Text
          style={[
            styles.symbolText,
            {
              fontSize: discSize * 0.7,
              lineHeight: discSize * 0.72,
              color: isWhite ? '#1A1A1A' : '#F0F0F0',
              textShadowColor: isWhite
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(0,0,0,0.8)',
              textShadowOffset: { width: 0, height: isWhite ? 1 : 1 },
              textShadowRadius: isWhite ? 2 : 4,
            },
          ]}
        >
          {char}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  discBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  discSurface: {
    position: 'absolute',
  },
  innerRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDisc: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glossHighlight: {
    position: 'absolute',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  bottomShade: {
    position: 'absolute',
  },
  symbolText: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    zIndex: 2,
  },
});
