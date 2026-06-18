import { useKnightTheme } from '@/constants/knight-theme';
import { useAuth } from '@/lib/use-auth';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const { theme } = useKnightTheme();
  const { signIn, loginAsGuest } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    const err = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    router.replace('/(tabs)');
  }

  return (
    <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.page }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Sign in to continue</Text>

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

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
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { color: theme.primaryText }]}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={[styles.link, { color: theme.primary }]}>Don't have an account? Register</Text>
        </Pressable>

        <Pressable onPress={() => { loginAsGuest(); router.replace('/(tabs)'); }}>
          <Text style={[styles.link, { color: theme.muted }]}>Continue as guest</Text>
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
