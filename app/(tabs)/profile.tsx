import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { usePlayerProfile } from '@/constants/player-profile';
import { useAuth } from '@/lib/use-auth';
import { achievements as achievementDefs } from '@/lib/achievements';
import { router } from 'expo-router';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Animated } from 'react-native';

export default function ProfileScreen() {
  const { theme } = useKnightTheme();
  const { user, signOut } = useAuth();
  const { playerName: savedName, savePlayerName, stats, resetStats, players, invitations, friends, sendFriendRequest, acceptInvitation, rejectInvitation } = usePlayerProfile();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [playerName, setPlayerName] = useState(savedName);
  const [searchText, setSearchText] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(searchText.trim().toLowerCase()));

  const statGrid = [
    { value: stats.rating, label: 'Rating' },
    { value: stats.games, label: 'Games' },
    { value: stats.wins, label: 'Wins' },
    { value: stats.losses, label: 'Losses' },
    { value: stats.draws, label: 'Draws' },
    { value: stats.puzzlesSolved, label: 'Puzzles' },
    { value: stats.puzzleScore, label: 'Score' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Animated.View style={[styles.shell, { opacity: fadeAnim }]}>
        <View style={styles.glassCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{savedName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text style={styles.title}>{savedName}</Text>
          <Text style={styles.subtitle}>{user ? user.email : 'Offline player'}</Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.page, color: theme.text, borderColor: theme.border }]}
            value={playerName} onChangeText={setPlayerName}
            placeholder="Enter your name" placeholderTextColor={theme.muted}
          />
          <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => savePlayerName(playerName)}>
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            {statGrid.map(s => (
              <View key={s.label} style={styles.statBox}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Achievements ({stats.achievements.length}/{achievementDefs.length})</Text>
          <Text style={{ color: theme.muted, fontSize: 13, fontWeight: '700' }}>Streak: {stats.streak} days</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {achievementDefs.map(a => {
              const unlocked = stats.achievements.includes(a.id);
              return (
                <View key={a.id} style={{ backgroundColor: unlocked ? theme.primary : theme.panelAlt, borderRadius: 10, padding: 8, alignItems: 'center', opacity: unlocked ? 1 : 0.4, minWidth: 50 }}>
                  <Text style={{ fontSize: 20 }}>{a.emoji}</Text>
                  <Text style={{ color: unlocked ? theme.primaryText : theme.muted, fontSize: 9, fontWeight: '900', marginTop: 2, textAlign: 'center' }}>{a.title}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Social</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.page, color: theme.text, borderColor: theme.border }]}
            value={searchText} onChangeText={setSearchText}
            placeholder="Search players" placeholderTextColor={theme.muted}
          />
          {filteredPlayers.length === 0 ? (
            <Text style={styles.emptyText}>No players found.</Text>
          ) : (
            filteredPlayers.map(p => (
              <View key={p.id} style={styles.socialRow}>
                <View style={[styles.smallAvatar, { backgroundColor: theme.secondary }]}>
                  <Text style={[styles.smallAvatarText, { color: theme.secondaryText }]}>{p.name.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.socialName}>{p.name}</Text>
                  <Text style={styles.socialMeta}>Rating {p.rating}</Text>
                </View>
                <Pressable
                  style={[styles.addButton, { backgroundColor: theme.primary }, p.status !== 'available' && { backgroundColor: theme.border }]}
                  onPress={() => sendFriendRequest(p.id)}
                  disabled={p.status !== 'available'}
                >
                  <Text style={[styles.addButtonText, { color: theme.primaryText }]}>
                    {p.status === 'requested' ? 'Sent' : p.status === 'friend' ? 'Friend' : 'Add'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {invitations.length > 0 && (
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Invitations ({invitations.length})</Text>
            {invitations.map(inv => (
              <View key={inv.id} style={[styles.socialRow, { flexDirection: 'column', gap: 10 }]}>
                <View style={{ width: '100%' }}>
                  <Text style={styles.socialName}>{inv.name}</Text>
                  <Text style={styles.socialMeta}>Rating {inv.rating}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                  <Pressable style={[styles.button, { flex: 1, backgroundColor: theme.primary }]} onPress={() => acceptInvitation(inv.id)}>
                    <Text style={[styles.buttonText, { color: theme.primaryText }]}>Accept</Text>
                  </Pressable>
                  <Pressable style={[styles.button, { flex: 1, backgroundColor: theme.danger }]} onPress={() => rejectInvitation(inv.id)}>
                    <Text style={styles.buttonText}>Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {friends.length > 0 && (
          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
            {friends.map(f => (
              <View key={f.id} style={styles.socialRow}>
                <View style={[styles.smallAvatar, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.smallAvatarText, { color: theme.primaryText }]}>{f.name.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.socialName}>{f.name}</Text>
                  <Text style={styles.socialMeta}>Rating {f.rating}</Text>
                </View>
                <Text style={[styles.friendBadge, { color: theme.primary }]}>Friend</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.glassCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user ? (
            <Pressable style={[styles.button, { backgroundColor: theme.danger }]} onPress={signOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.buttonText, { color: theme.primaryText }]}>Sign In / Register</Text>
            </Pressable>
          )}
        </View>

        <Pressable style={[styles.button, { backgroundColor: theme.danger }]} onPress={resetStats}>
          <Text style={styles.buttonText}>Reset All Stats</Text>
        </Pressable>

        <Pressable style={[styles.button, { backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border }]} onPress={() => router.push('/legal')}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Privacy, Terms & Attribution</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    page: { flexGrow: 1, backgroundColor: theme.page, alignItems: 'center', padding: 18, paddingBottom: 34 },
    shell: { width: '100%', maxWidth: 430, gap: 14 },
    glassCard: { backgroundColor: theme.glassBg, borderWidth: 1, borderColor: theme.glassBorder, borderRadius: 20, padding: 18, gap: 10 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
    avatarText: { color: theme.primaryText, fontSize: 36, fontWeight: '900' },
    title: { color: theme.text, fontSize: 24, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: theme.muted, fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: -6 },
    sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '700' },
    button: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    buttonText: { color: theme.text, fontSize: 15, fontWeight: '900' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statBox: { flexGrow: 1, flexBasis: '30%', backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 12, alignItems: 'center' },
    statValue: { color: theme.text, fontSize: 22, fontWeight: '900' },
    statLabel: { color: theme.muted, fontSize: 11, fontWeight: '800', marginTop: 2, textTransform: 'uppercase' },
    socialRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panelAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 12, gap: 10 },
    smallAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    smallAvatarText: { fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
    socialName: { color: theme.text, fontSize: 15, fontWeight: '900' },
    socialMeta: { color: theme.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
    addButton: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
    addButtonText: { fontSize: 12, fontWeight: '900' },
    friendBadge: { fontSize: 12, fontWeight: '900' },
    emptyText: { color: theme.muted, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  });
}
