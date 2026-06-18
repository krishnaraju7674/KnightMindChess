import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { usePlayerProfile } from '@/constants/player-profile';
import { useMemo, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View, Animated } from 'react-native';

const basePlayers = [
  { id: 'l1', name: 'Sneha Queen', rating: 1120, wins: 38 },
  { id: 'l2', name: 'Meera Mate', rating: 1040, wins: 31 },
  { id: 'l3', name: 'Arjun Tactics', rating: 920, wins: 18 },
  { id: 'l4', name: 'Dev Knight', rating: 860, wins: 14 },
  { id: 'l5', name: 'Ravi Rook', rating: 780, wins: 8 },
];

export default function LeaderboardScreen() {
  const { theme } = useKnightTheme();
  const { playerName, stats, friends } = usePlayerProfile();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const rows = useMemo(() => [
    ...basePlayers,
    ...friends.map(f => ({ id: f.id, name: f.name, rating: f.rating, wins: 0 })),
    { id: 'you', name: `${playerName} (You)`, rating: stats.rating, wins: stats.wins },
  ].sort((a, b) => b.rating - a.rating), [friends, playerName, stats.rating, stats.wins]);

  const yourRank = rows.findIndex(r => r.id === 'you') + 1;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Animated.View style={[styles.shell, { opacity: fadeAnim }]}>
        <View style={styles.glassCard}>
          <Text style={styles.title}>Rankings</Text>
          <Text style={styles.subtitle}>Top players</Text>
        </View>

        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Your Rank</Text>
          <Text style={styles.summaryValue}>#{yourRank}</Text>
          <Text style={styles.summaryMeta}>
            {stats.rating} rating {stats.wins} wins {stats.puzzlesSolved} puzzles
          </Text>
        </View>

        <View style={styles.boardPanel}>
          {rows.map((row, i) => {
            const isYou = row.id === 'you';
            return (
              <View key={row.id} style={[styles.row, isYou && styles.youRow]}>
                <View style={[styles.rankBadge, isYou && styles.youRankBadge]}>
                  <Text style={[styles.rankText, isYou && styles.youRankText]}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, isYou && styles.youText]}>{row.name}</Text>
                  <Text style={styles.meta}>Wins {row.wins}</Text>
                </View>
                <Text style={[styles.rating, isYou && styles.youText]}>{row.rating}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    page: { flexGrow: 1, backgroundColor: theme.page, alignItems: 'center', padding: 16, paddingBottom: 34 },
    shell: { width: '100%', maxWidth: 430, gap: 14 },
    glassCard: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 18, padding: 18, paddingTop: 28 },
    title: { color: theme.text, fontSize: 28, fontWeight: '900' },
    subtitle: { color: theme.muted, fontSize: 14, fontWeight: '800', marginTop: 4 },
    summaryPanel: { backgroundColor: theme.primary, borderRadius: 18, padding: 18 },
    summaryLabel: { color: theme.primaryText, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    summaryValue: { color: theme.primaryText, fontSize: 42, fontWeight: '900', marginTop: 4 },
    summaryMeta: { color: theme.primaryText, fontSize: 14, fontWeight: '800', marginTop: 2 },
    boardPanel: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 20, padding: 12, gap: 8 },
    row: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, gap: 12 },
    youRow: { backgroundColor: theme.secondary, borderColor: theme.secondary },
    rankBadge: { backgroundColor: theme.page, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
    youRankBadge: { backgroundColor: 'rgba(0,0,0,0.15)' },
    rankText: { color: theme.primary, fontSize: 15, fontWeight: '900' },
    youRankText: { color: theme.secondaryText },
    name: { color: theme.text, fontSize: 15, fontWeight: '900' },
    meta: { color: theme.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
    rating: { color: theme.text, fontSize: 18, fontWeight: '900' },
    youText: { color: theme.secondaryText },
  });
}
