import { useKnightTheme, type KnightTheme, type KnightThemeName } from '@/constants/knight-theme';
import { usePlayerProfile } from '@/constants/player-profile';
import { useAuth } from '@/lib/use-auth';
import { getTodayPuzzle } from '@/lib/daily-puzzle';
import { router } from 'expo-router';
import { useMemo, useRef, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Animated } from 'react-native';

const themes: { name: KnightThemeName; emoji: string }[] = [
  { name: 'classic', emoji: '\u265F' },
  { name: 'midnight', emoji: '\u2728' },
  { name: 'royal', emoji: '\u265A' },
  { name: 'emerald', emoji: '\u265B' },
];

export default function HomeScreen() {
  const { theme, setTheme, themeName } = useKnightTheme();
  const { playerName, stats, friends, invitations } = usePlayerProfile();
  const { user, signOut } = useAuth();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const statItems = [
    { value: stats.rating, label: 'Rating', icon: '\u265C' },
    { value: stats.puzzleScore, label: 'Puzzles', icon: '\u2658' },
    { value: stats.games, label: 'Games', icon: '\u2654' },
    { value: stats.wins, label: 'Wins', icon: '\u2655' },
  ];

  const actions: { title: string; subtitle: string; icon: string; route: '/play-ai' | '/puzzles' | '/online' | '/leaderboard'; color: string }[] = [
    { title: 'Play vs AI', subtitle: 'Challenge the engine', icon: '\u2654', route: '/play-ai', color: '#38BDF8' },
    { title: 'Tactics', subtitle: 'Sharpen your skills', icon: '\u2658', route: '/puzzles', color: '#A78BFA' },
    { title: 'Online', subtitle: 'Versus players', icon: '\u2655', route: '/online', color: '#34D399' },
    { title: 'Rankings', subtitle: 'Leaderboard', icon: '\u2656', route: '/leaderboard', color: '#FBBF24' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.shell, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.hero}>
          <Animated.View style={[styles.logoRing, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.logoGlow} />
            <Text style={styles.logoIcon}>{'\u2658'}</Text>
          </Animated.View>
          <Text style={styles.brandName}>KnightMind</Text>
          <Text style={styles.tagline}>Where strategy meets mastery</Text>
          {!user ? (
            <View style={styles.authRow}>
              <Pressable style={styles.authBtn} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.authBtnText}>Login</Text>
              </Pressable>
              <Pressable style={[styles.authBtn, styles.authBtnPrimary]} onPress={() => router.push('/(auth)/register')}>
                <Text style={[styles.authBtnText, styles.authBtnTextPrimary]}>Sign Up</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.authBtn} onPress={() => signOut()}>
              <Text style={styles.authBtnText}>Sign Out</Text>
            </Pressable>
          )}
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryBtn} onPress={() => router.push('/play-ai')}>
              <Text style={styles.primaryBtnText}>Play Now</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => router.push('/online')}>
              <Text style={styles.secondaryBtnText}>vs Players</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            {statItems.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{item.icon}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Game Modes</Text>
          <View style={styles.modesGrid}>
            {actions.map((action) => (
              <Pressable key={action.route} style={styles.modeCard} onPress={() => router.push(action.route)}>
                <View style={[styles.modeIconBox, { backgroundColor: action.color + '22' }]}>
                  <Text style={[styles.modeIcon, { color: action.color }]}>{action.icon}</Text>
                </View>
                <Text style={styles.modeTitle}>{action.title}</Text>
                <Text style={styles.modeSub}>{action.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.dailyCard} onPress={() => router.push('/puzzles')}>
          <View style={styles.dailyLeft}>
            <View style={styles.dailyIconBox}>
              <Text style={styles.dailyIcon}>{'\u2658'}</Text>
            </View>
            <View style={styles.dailyTextBlock}>
              <Text style={styles.dailyLabel}>Daily Puzzle</Text>
              <Text style={styles.dailyTitle} numberOfLines={1}>{getTodayPuzzle().title}</Text>
            </View>
          </View>
          <Text style={styles.dailyArrow}>{'\u2192'}</Text>
        </Pressable>

        <View style={styles.footerSection}>
          <Text style={styles.sectionLabel}>Theme</Text>
          <View style={styles.themeRow}>
            {themes.map((t) => (
              <Pressable
                key={t.name}
                style={[styles.themeChip, themeName === t.name && styles.themeChipActive]}
                onPress={() => setTheme(t.name)}
              >
                <Text style={styles.themeChipEmoji}>{t.emoji}</Text>
                <Text style={[styles.themeChipLabel, themeName === t.name && { color: theme.primaryText }]}>
                  {t.name.charAt(0).toUpperCase() + t.name.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>KnightMind Chess v1.0</Text>
            <Text style={styles.footerSub}>Built with precision</Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    root: {
      flexGrow: 1,
      backgroundColor: theme.page,
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 24,
      paddingBottom: 34,
    },
    shell: {
      width: '100%',
      maxWidth: 430,
      gap: 24,
    },
    hero: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 8,
      gap: 10,
    },
    logoRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.glassBg,
      borderWidth: 2,
      borderColor: theme.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    logoGlow: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: theme.primary + '15',
    },
    logoIcon: {
      fontSize: 44,
      color: theme.primary,
    },
    brandName: {
      color: theme.text,
      fontSize: 38,
      fontWeight: '900',
      letterSpacing: -1,
    },
    tagline: {
      color: theme.muted,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
      marginBottom: 6,
    },
    authRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 4,
    },
    authBtn: {
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 12,
    },
    authBtnPrimary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    authBtnText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '900',
    },
    authBtnTextPrimary: {
      color: theme.primaryText,
    },
    heroActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    primaryBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 16,
      shadowColor: theme.primary,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    primaryBtnText: {
      color: theme.primaryText,
      fontSize: 16,
      fontWeight: '900',
    },
    secondaryBtn: {
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      paddingHorizontal: 28,
      paddingVertical: 14,
      borderRadius: 16,
    },
    secondaryBtnText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
    },
    section: {
      gap: 14,
    },
    sectionLabel: {
      color: theme.muted,
      fontSize: 13,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      paddingLeft: 4,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 10,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    statIcon: {
      fontSize: 18,
      color: theme.muted,
      opacity: 0.6,
    },
    statValue: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '900',
    },
    statLabel: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    modesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    modeCard: {
      width: '48%',
      flexGrow: 1,
      flexBasis: '47%',
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 18,
      padding: 18,
      gap: 8,
    },
    modeIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    modeIcon: {
      fontSize: 24,
    },
    modeTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
    },
    modeSub: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    dailyCard: {
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 18,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dailyLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      flex: 1,
    },
    dailyIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dailyIcon: {
      fontSize: 24,
      color: theme.primary,
    },
    dailyTextBlock: {
      flex: 1,
    },
    dailyLabel: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: '900',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    dailyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
      marginTop: 3,
    },
    dailyArrow: {
      color: theme.muted,
      fontSize: 22,
      fontWeight: '900',
      marginLeft: 8,
    },
    footerSection: {
      gap: 14,
    },
    themeRow: {
      flexDirection: 'row',
      gap: 8,
    },
    themeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      backgroundColor: theme.glassBg,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 10,
      justifyContent: 'center',
    },
    themeChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    themeChipEmoji: {
      fontSize: 16,
    },
    themeChipLabel: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '800',
    },
    footer: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 4,
    },
    footerText: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '700',
    },
    footerSub: {
      color: theme.muted,
      fontSize: 10,
      fontWeight: '600',
      opacity: 0.6,
      marginTop: 2,
    },
  });
}
