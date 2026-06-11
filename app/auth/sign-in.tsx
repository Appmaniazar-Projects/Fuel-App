import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Droplet } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { AppInput } from '@/components/AppInput';
import { Button } from '@/components/Button';
import { useColors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/lib/theme';

export default function SignInScreen() {
  const colors = useColors();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setLoading(false);
      if (result.error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (result.error.message.includes('Email not confirmed')) {
        setError('Please confirm your email first');
      } else {
        setError(result.error.message);
      }
    } else {
      // Success - navigation will be handled by AuthGuard in _layout.tsx
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
            <Droplet size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to continue tracking your fuel
          </Text>
        </View>

        <View style={styles.form}>
          <AppInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Mail size={20} color={colors.textTertiary} />}
          />

          <AppInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.textTertiary} />}
          />

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/auth/sign-up')}>
            <Text style={[styles.link, { color: colors.primary }]}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  button: {
    marginTop: Spacing.lg,
  },
  errorBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.md,
  },
  link: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
