import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Car, Plus, Star, Trash2, LogIn } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { confirmAction, showError } from '@/lib/confirm';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  useColors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
} from '@/lib/theme';
import type { UserVehicleWithVehicle } from '@/types/database';

export default function GarageScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<UserVehicleWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('user_vehicles')
        .select('*, vehicle:vehicles(*)')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (fetchError) throw fetchError;
      setVehicles((data as UserVehicleWithVehicle[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchVehicles();
    }, [fetchVehicles])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, [fetchVehicles]);

  const setAsDefault = async (vehicleId: string) => {
    if (!user) return;
    const { error: clearError } = await supabase
      .from('user_vehicles')
      .update({ is_default: false })
      .eq('user_id', user.id);
    const { error: defaultError } = clearError
      ? { error: clearError }
      : await supabase.from('user_vehicles').update({ is_default: true }).eq('id', vehicleId);
    if (defaultError) showError(defaultError.message || 'Could not set the default vehicle.');
    fetchVehicles();
  };

  const deleteVehicle = async (uv: UserVehicleWithVehicle) => {
    const confirmed = await confirmAction(
      `Delete ${uv.nickname}?`,
      'This also permanently deletes every fill-up logged for this vehicle.'
    );
    if (!confirmed) return;

    // The live database doesn't cascade this delete, so remove the
    // vehicle's fill-ups first or the vehicle delete is rejected.
    const { error: fillUpsError } = await supabase.from('fill_ups').delete().eq('user_vehicle_id', uv.id);
    if (fillUpsError) {
      showError(fillUpsError.message || 'Could not delete this vehicle\'s fill-ups.');
      return;
    }

    const { error: deleteError } = await supabase.from('user_vehicles').delete().eq('id', uv.id);
    if (deleteError) {
      showError(deleteError.message || 'Could not delete the vehicle.');
      return;
    }

    // Keep a default vehicle if the default one was removed
    const remaining = vehicles.filter((v) => v.id !== uv.id);
    if (uv.is_default && remaining.length > 0) {
      await supabase.from('user_vehicles').update({ is_default: true }).eq('id', remaining[0].id);
    }
    fetchVehicles();
  };

  if (loading) {
    return <LoadingState message="Loading garage..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchVehicles} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Garage',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: FontWeights.semibold },
          headerShadowVisible: false,
          headerRight: () =>
            user ? (
              <Pressable
                onPress={() => router.push('/add-vehicle')}
                style={styles.headerButton}
              >
                <Plus size={24} color={colors.primary} />
              </Pressable>
            ) : null,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {!user ? (
          <Card style={styles.card}>
            <View style={styles.authPrompt}>
              <LogIn size={32} color={colors.primary} />
              <View style={styles.authPromptText}>
                <Text style={[styles.authPromptTitle, { color: colors.text }]}>
                  Sign In to Manage Your Vehicles
                </Text>
                <Text style={[styles.authPromptMessage, { color: colors.textSecondary }]}>
                  Create an account to add your vehicles, track fill-ups, and monitor your fuel consumption
                </Text>
              </View>
            </View>
            <View style={styles.authButtons}>
              <Button
                title="Sign In"
                onPress={() => router.push('/auth/sign-in')}
                variant="primary"
                style={styles.authButton}
              />
              <Button
                title="Sign Up"
                onPress={() => router.push('/auth/sign-up')}
                variant="outline"
                style={styles.authButton}
              />
            </View>
          </Card>
        ) : vehicles.length === 0 ? (
          <Card style={styles.card}>
            <EmptyState
              icon={<Car size={48} color={colors.textTertiary} />}
              title="Your Garage is Empty"
              message="Add your first vehicle to start tracking fuel consumption"
              actionLabel="Add Vehicle"
              onAction={() => router.push('/add-vehicle')}
            />
          </Card>
        ) : (
          vehicles.map((uv) => (
            <Card key={uv.id} style={styles.card}>
              <View style={styles.vehicleHeader}>
                <View style={styles.vehicleTitleRow}>
                  <Car size={20} color={colors.primary} />
                  <Text style={[styles.vehicleNickname, { color: colors.text }]}>
                    {uv.nickname}
                  </Text>
                  {uv.is_default && (
                    <View style={[styles.defaultBadge, { backgroundColor: colors.primaryLight }]}>
                      <Star size={12} color={colors.primary} fill={colors.primary} />
                      <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>
                        Default
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.vehicleActions}>
                  {!uv.is_default && (
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => setAsDefault(uv.id)}
                    >
                      <Star size={18} color={colors.textTertiary} />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => deleteVehicle(uv)}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </Pressable>
                </View>
              </View>

              <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
                {uv.vehicle.make} {uv.vehicle.model}
                {uv.vehicle.year_from && ` (${uv.vehicle.year_from}${uv.vehicle.year_to && uv.vehicle.year_to !== uv.vehicle.year_from ? `-${uv.vehicle.year_to}` : ''})`}
              </Text>

              <View style={styles.vehicleDetails}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Transmission
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {uv.vehicle.transmission === 'manual' ? 'Manual' : 'Automatic'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Official km/L
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {uv.vehicle.official_km_per_l?.toFixed(1) || '--'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>
                    Fuel Type
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {uv.vehicle.fuel_type?.toUpperCase() || '--'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.lg,
  },
  authPrompt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authPromptText: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  authPromptTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  authPromptMessage: {
    fontSize: FontSizes.sm,
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  authButton: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  vehicleNickname: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  vehicleInfo: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  vehicleDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  signOutButton: {
    marginTop: Spacing.lg,
  },
});
