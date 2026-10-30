import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useColors, FontSizes, FontWeights } from '@/lib/theme';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure router is ready
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !isReady) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace('/auth/sign-in');
    } else if (user && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/');
    }
  }, [user, loading, segments, isReady]);

  if (loading || !isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="fill-up" options={{ presentation: 'modal', title: 'Log Fill-up' }} />
          <Stack.Screen name="fill-up-history" options={{ title: 'Fill-up History' }} />
          <Stack.Screen name="price-history" options={{ title: 'Price History' }} />
          <Stack.Screen name="add-vehicle" options={{ title: 'Add Vehicle' }} />
          <Stack.Screen name="auth/sign-in" options={{ title: 'Sign In' }} />
          <Stack.Screen name="auth/sign-up" options={{ title: 'Sign Up' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </AuthGuard>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
});
