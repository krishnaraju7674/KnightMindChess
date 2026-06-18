import { useKnightTheme, type KnightTheme } from '@/constants/knight-theme';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LegalScreen() {
  const { theme } = useKnightTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.shell}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Legal</Text>
            <Text style={styles.subtitle}>Privacy, terms, and attribution</Text>
          </View>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Privacy Policy</Text>
          <Text style={styles.bodyText}>
            KnightMind Chess currently stores profile name, rating, puzzle progress, friends,
            invitations, and theme choice locally on this device using AsyncStorage.
          </Text>
          <Text style={styles.bodyText}>
            This first version does not collect payment data, contacts, precise location,
            microphone, camera, or advertising identifiers.
          </Text>
          <Text style={styles.bodyText}>
            When online multiplayer is added later, the app will need an updated privacy policy
            explaining login, server storage, matchmaking, and account deletion.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Terms</Text>
          <Text style={styles.bodyText}>
            This app is for chess learning and entertainment. Ratings, leaderboards, social
            search, and online counts in this student version are local preview features unless a
            real backend is connected.
          </Text>
          <Text style={styles.bodyText}>
            Do not copy Chess.com branding, logos, icons, wording, sounds, puzzle database, or
            board artwork. KnightMind Chess must keep its own name, design, colors, and original
            content.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Attribution</Text>
          <Text style={styles.bodyText}>
            Chess rules are powered by chess.js. The app is built with Expo, React Native, Expo
            Router, and AsyncStorage.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: KnightTheme) {
  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: theme.page,
      alignItems: 'center',
      padding: 18,
      paddingTop: 42,
      paddingBottom: 34,
    },
    shell: {
      width: '100%',
      maxWidth: 430,
      gap: 14,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 14,
    },
    title: {
      color: theme.text,
      fontSize: 30,
      fontWeight: '900',
    },
    subtitle: {
      color: theme.muted,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
    },
    backButton: {
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 11,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    backButtonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '900',
    },
    panel: {
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 15,
      gap: 8,
    },
    sectionTitle: {
      color: theme.primary,
      fontSize: 17,
      fontWeight: '900',
    },
    bodyText: {
      color: theme.muted,
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 21,
    },
  });
}