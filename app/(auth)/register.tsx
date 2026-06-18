import { useKnightTheme } from '@/constants/knight-theme';
import { useAuth } from '@/lib/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const { theme } = useKnightTheme();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError(null);
    const err = await signUp(email, password, username);
    setLoading(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)');
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.page }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Join the chess community</Text>

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <TextInput
          style={[styles.input, { backgroundColor: theme.panelAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="Username"
          placeholderTextColor={theme.muted}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.panelAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="Email"
          placeholderTextColor={theme.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: theme.panelAlt, color: theme.text, borderColor: theme.border }]}
          placeholder="Password"
          placeholderTextColor={theme.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>
            {loading ? 'Creating...' : 'Create Account'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={[styles.link, { color: theme.primary }]}>Already have an account? Sign in</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, gap: 16 },
  title: { fontSize: 32, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
  error: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 16, fontWeight: '700' },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { fontSize: 16, fontWeight: '900' },
  link: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
