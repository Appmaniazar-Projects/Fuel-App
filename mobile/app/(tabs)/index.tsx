import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, History, Car, TrendingUp, MapPin, ChevronRight, Star, Fuel, LogIn } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { BenchmarkBadge } from '@/components/BenchmarkBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import {
  useColors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
  formatPrice,
  formatKmPerL,
  calculateBenchmarkDelta,
} from '@/lib/theme';
import type { FuelPrice, UserVehicleWithVehicle, FillUp } from '@/types/database';

interface HomeData {
  fuelPrices: FuelPrice | null;
  userVehicles: UserVehicleWithVehicle[];
  lastFillUp: (FillUp & { user_vehicle: UserVehicleWithVehicle }) | null;
  lastKmPerL: number | null;
  benchmarkInfo: { percentage: number; status: 'green' | 'amber' | 'red'; label: string } | null;
}

export default function HomeScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion] = useState('Gauteng Inland');

  const fetchData = useCallback(async () => {
  try {
    setError(null);

    if (!supabase) {
      throw new Error('Supabase client is not initialized — check your environment variables');
    }

    // Fetch current fuel prices (public)
    const { data: prices, error: pricesError } = await supabase
      .from('fuel_prices')
      .select('*')
      .eq('region', selectedRegion)
      .eq('is_current', true)
      .maybeSingle();

    if (pricesError) throw pricesError;

    let userVehicles: UserVehicleWithVehicle[] = [];
    let lastFillUp = null;
    let lastKmPerL: number | null = null;
    let benchmarkInfo = null;

    if (user) {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('user_vehicles')
          .select('*, vehicle:vehicles(*)')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false });

        if (vehiclesError) throw vehiclesError;
        userVehicles = (vehicles as UserVehicleWithVehicle[]) || [];

        // Get last fill-up
        if (userVehicles.length > 0) {
          const { data: fillUps, error: fillUpsError } = await supabase
            .from('fill_ups')
            .select('*, user_vehicle:user_vehicles(*, vehicle:vehicles(*))')
            .eq('user_vehicle_id', userVehicles[0].id)
            .order('logged_at', { ascending: false })
            .limit(2);

          if (fillUpsError) throw fillUpsError;
          lastFillUp = fillUps?.[0];

          // Calculate km/L if we have 2 fill-ups with odometer readings
          if (fillUps && fillUps.length >= 2) {
            const current = fillUps[0];
            const prev = fillUps[1];
            if (current.odometer_km && prev.odometer_km && current.litres > 0) {
              const distance = current.odometer_km - prev.odometer_km;
              if (distance > 0) {
                lastKmPerL = distance / current.litres;
                const spec = userVehicles[0].vehicle?.official_km_per_l;
                if (spec) {
                  benchmarkInfo = calculateBenchmarkDelta(lastKmPerL, spec);
                }
              }
            }
          }
        }
      }

      setData({
        fuelPrices: prices,
        userVehicles,
        lastFillUp,
        lastKmPerL,
        benchmarkInfo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedRegion]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const defaultVehicle = data?.userVehicles?.[0];
  const lastKmPerL = data?.lastKmPerL;
  const benchmarkInfo = data?.benchmarkInfo;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          {user ? `Good ${getGreeting()}` : 'FuelWise'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {user ? 'Track your fuel consumption' : 'South African Fuel Companion'}
        </Text>
      </View>

      {/* Auth Prompt (only for non-authenticated users) */}
      {!user && (
        <Card style={styles.card}>
          <View style={styles.authPrompt}>
            <LogIn size={32} color={colors.primary} />
            <View style={styles.authPromptText}>
              <Text style={[styles.authPromptTitle, { color: colors.text }]}>
                Track Your Fill-ups
              </Text>
              <Text style={[styles.authPromptMessage, { color: colors.textSecondary }]}>
                Sign in to log fill-ups, track consumption, and compare against your vehicle&apos;s spec
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
      )}

      {/* Quick Actions for authenticated users */}
      {user && (
        <Button
          title="Log Fill-up"
          onPress={() => router.push('/fill-up')}
          icon={<Plus size={20} color={colors.textInverse} />}
          style={styles.fabButton}
        />
      )}

      {/* Fuel Prices Tile */}
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Fuel size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Today&apos;s Fuel Prices
            </Text>
          </View>
          <Pressable onPress={() => router.push('/prices')}>
            <ChevronRight size={20} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={[styles.regionBadge, { color: colors.textSecondary }]}>
          {selectedRegion}
        </Text>

        <View style={styles.priceGrid}>
          <View style={styles.priceItem}>
            <Text style={[styles.fuelLabel, { color: colors.textSecondary }]}>
              Unleaded 95
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {data?.fuelPrices ? formatPrice(data.fuelPrices.unleaded_95) : '--'}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.fuelLabel, { color: colors.textSecondary }]}>
              Unleaded 93
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {data?.fuelPrices ? formatPrice(data.fuelPrices.unleaded_93) : '--'}
            </Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={[styles.fuelLabel, { color: colors.textSecondary }]}>
              Diesel 50ppm
            </Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              {data?.fuelPrices ? formatPrice(data.fuelPrices.diesel_50ppm) : '--'}
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.priceHistoryLink, { borderTopColor: colors.border }]}
          onPress={() => router.push('/price-history')}
        >
          <TrendingUp size={18} color={colors.primary} />
          <Text style={[styles.priceHistoryText, { color: colors.primary }]}>
            View price history
          </Text>
          <ChevronRight size={18} color={colors.primary} />
        </Pressable>
      </Card>

      {/* Active Vehicle Card (for authenticated users with vehicles) */}
      {user && defaultVehicle && (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Car size={20} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {defaultVehicle.nickname}
              </Text>
              {defaultVehicle.is_default && (
                <Star size={16} color={colors.warning} fill={colors.warning} />
              )}
            </View>
            <Pressable onPress={() => router.push('/garage')}>
              <ChevronRight size={20} color={colors.textTertiary} />
            </Pressable>
          </View>

          <Text style={[styles.vehicleInfo, { color: colors.textSecondary }]}>
            {defaultVehicle.vehicle.make} {defaultVehicle.vehicle.model}
            {' • '}
            {defaultVehicle.vehicle.transmission === 'manual' ? 'Manual' : 'Auto'}
          </Text>

          <View style={styles.vehicleStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                Last km/L
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {lastKmPerL ? formatKmPerL(lastKmPerL) : '--'}
              </Text>
            </View>

            {benchmarkInfo && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                  vs Spec
                </Text>
                <BenchmarkBadge
                  status={benchmarkInfo.status}
                  percentage={benchmarkInfo.percentage}
                  label={benchmarkInfo.label}
                  size="small"
                />
              </View>
            )}
          </View>

          <View style={[styles.quickActions, { borderTopColor: colors.border }]}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/fill-up-history')}
            >
              <History size={18} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>
                Fill-up History
              </Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/garage')}
            >
              <Car size={18} color={colors.primary} />
              <Text style={[styles.quickActionText, { color: colors.primary }]}>
                My Garage
              </Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* No Vehicle Card (for authenticated users without vehicles) */}
      {user && !defaultVehicle && (
        <Card style={styles.card}>
          <EmptyState
            icon={<Car size={48} color={colors.textTertiary} />}
            title="No vehicles yet"
            message="Add your first vehicle to start tracking fuel consumption"
            actionLabel="Add Vehicle"
            onAction={() => router.push('/add-vehicle')}
          />
        </Card>
      )}

      {/* Nearby Stations Link */}
      <Pressable
        style={[styles.stationsLink, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/stations')}
      >
        <View style={styles.stationsLinkLeft}>
          <MapPin size={24} color={colors.primary} />
          <View>
            <Text style={[styles.stationsLinkTitle, { color: colors.text }]}>
              Nearby Stations
            </Text>
            <Text style={[styles.stationsLinkSubtitle, { color: colors.textSecondary }]}>
              Find fuel stations near you
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
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
  fabButton: {
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  regionBadge: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  fuelLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  priceHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.xs,
  },
  priceHistoryText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  vehicleInfo: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.lg,
  },
  vehicleStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
    borderTopWidth: 1,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  stationsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    marginBottom: Spacing.lg,
  },
  stationsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stationsLinkTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  stationsLinkSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
});
