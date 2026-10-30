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

export default function SignUpScreen() {
  const colors = useColors();
  const { signUp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signUp(email.trim(), password);

    if (result.error) {
      setLoading(false);
      if (result.error.message.includes('already registered')) {
        setError('An account with this email already exists');
      } else {
        setError(result.error.message);
      }
    } else if (result.needsConfirmation) {
      setLoading(false);
      setNotice(`We've sent a confirmation link to ${email.trim()}. Open it, then sign in.`);
    } else {
      // Signed in straight away: AuthGuard redirects to the home screen
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
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start tracking your fuel consumption
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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.textTertiary} />}
          />

          <AppInput
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            leftIcon={<Lock size={20} color={colors.textTertiary} />}
          />

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {notice && (
            <View style={[styles.errorBox, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.errorText, { color: colors.success }]}>{notice}</Text>
            </View>
          )}

          <Button
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/auth/sign-in')}>
            <Text style={[styles.link, { color: colors.primary }]}>Sign In</Text>
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
