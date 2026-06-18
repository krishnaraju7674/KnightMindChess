import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { usePlayerProfile } from '@/constants/player-profile';
import { useAuth } from '@/lib/use-auth';
import { useMatchmaking } from '@/lib/use-matchmaking';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function OnlineScreen() {
  const { theme } = useKnightTheme();
  const { user, signOut } = useAuth();
  const { friends, stats } = usePlayerProfile();
  const { status, match, onlineCount, joinQueue, leaveQueue } = useMatchmaking();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const countCards = [
    { value: onlineCount || 128, label: 'Online' },
    { value: status === 'searching' ? '...' : 12, label: 'In Queue' },
    { value: 34 + stats.games, label: 'Matches' },
    { value: Math.min(friends.length, 3), label: 'Friends' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.shell}>
        <View style={styles.glassCard}>
          <Text style={styles.eyebrow}>Multiplayer</Text>
          <Text style={styles.title}>Online Arena</Text>
          <Text style={styles.subtitle}>
            {user ? `Logged in as ${user.email}` : 'Sign in to play online'}
          </Text>
        </View>

        <View style={styles.countGrid}>
          {countCards.map(c => (
            <View key={c.label} style={styles.countCard}>
              <Text style={styles.countValue}>{c.value}</Text>
              <Text style={styles.countLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.panelTitle}>Matchmaking</Text>
          {status === 'searching' ? (
            <View style={styles.searchingBox}>
              <Text style={styles.searchingText}>Searching for opponent...</Text>
              <Pressable style={[styles.matchButton, { backgroundColor: theme.danger }]} onPress={leaveQueue}>
                <Text style={styles.matchButtonText}>Cancel</Text>
              </Pressable>
            </View>
          ) : status === 'found' && match ? (
            <View style={styles.searchingBox}>
              <Text style={styles.searchingText}>Match found! Starting game...</Text>
            </View>
          ) : (
            <View style={styles.modeList}>
              <Pressable style={styles.modeButton} onPress={() => user ? joinQueue(300) : null} disabled={!user}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Quick Match (5m)</Text>
                  <Text style={styles.modeSubtitle}>Find a similar rated opponent</Text>
                </View>
                {!user && <Text style={[styles.modeBadge, { backgroundColor: theme.border, color: theme.muted }]}>Sign in</Text>}
              </Pressable>
              <Pressable style={styles.modeButton} onPress={() => user ? joinQueue(180) : null} disabled={!user}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Ranked (3m)</Text>
                  <Text style={styles.modeSubtitle}>Rating changes after result</Text>
                </View>
                {!user && <Text style={[styles.modeBadge, { backgroundColor: theme.border, color: theme.muted }]}>Sign in</Text>}
              </Pressable>
              <Pressable style={styles.modeButton} disabled>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>Invite Friend</Text>
                  <Text style={styles.modeSubtitle}>Play with friends</Text>
                </View>
                <Text style={[styles.modeBadge, { backgroundColor: theme.primary, color: theme.primaryText }]}>Soon</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.panelTitle}>Account</Text>
          {user ? (
            <Pressable style={[styles.matchButton, { backgroundColor: theme.danger }]} onPress={signOut}>
              <Text style={styles.matchButtonText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Text style={styles.planText}>Sign in from Profile to play online matches.</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    page: { flexGrow: 1, backgroundColor: theme.page, alignItems: 'center', padding: 18, paddingTop: 42, paddingBottom: 34 },
    shell: { width: '100%', maxWidth: 430, gap: 16 },
    glassCard: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 18, padding: 18, gap: 10 },
    eyebrow: { color: theme.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
    title: { color: theme.text, fontSize: 28, fontWeight: '900' },
    subtitle: { color: theme.muted, fontSize: 14, fontWeight: '700', lineHeight: 20 },
    countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    countCard: { flexGrow: 1, flexBasis: '47%', backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, alignItems: 'center' },
    countValue: { color: theme.primary, fontSize: 30, fontWeight: '900' },
    countLabel: { color: theme.muted, fontSize: 12, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
    panelTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
    modeList: { gap: 10 },
    modeButton: { backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center' },
    modeTitle: { color: theme.text, fontSize: 16, fontWeight: '900' },
    modeSubtitle: { color: theme.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
    modeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '900', overflow: 'hidden' },
    searchingBox: { alignItems: 'center', gap: 12, paddingVertical: 8 },
    searchingText: { color: theme.primary, fontSize: 16, fontWeight: '900', textAlign: 'center' },
    matchButton: { borderRadius: 12, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
    matchButtonText: { color: theme.text, fontSize: 15, fontWeight: '900' },
    planText: { color: theme.muted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  });
}
