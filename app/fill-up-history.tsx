import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { TrendingUp, TrendingDown, Droplet } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
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
import type { FillUp, UserVehicleWithVehicle } from '@/types/database';

interface FillUpWithVehicle extends FillUp {
  user_vehicle: UserVehicleWithVehicle;
  km_per_l?: number | null;
  benchmark?: { percentage: number; status: 'green' | 'amber' | 'red'; label: string } | null;
}

interface GroupedFillUps {
  month: string;
  fillUps: FillUpWithVehicle[];
  totalSpend: number;
}

export default function FillUpHistoryScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ vehicleId?: string }>();

  const [vehicle, setVehicle] = useState<UserVehicleWithVehicle | null>(null);
  const [groupedFillUps, setGroupedFillUps] = useState<GroupedFillUps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Get vehicle
      let vehicleId = params.vehicleId;

      if (!vehicleId) {
        const { data: defaultVehicle } = await supabase
          .from('user_vehicles')
          .select('*, vehicle:vehicles(*)')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .maybeSingle();
        vehicleId = defaultVehicle?.id;
        setVehicle(defaultVehicle as UserVehicleWithVehicle);
      } else {
        const { data: v } = await supabase
          .from('user_vehicles')
          .select('*, vehicle:vehicles(*)')
          .eq('id', vehicleId)
          .maybeSingle();
        setVehicle(v as UserVehicleWithVehicle);
      }

      if (!vehicleId) {
        setLoading(false);
        return;
      }

      // Get fill-ups
      const { data: rawFillUps, error: fillUpsError } = await supabase
        .from('fill_ups')
        .select('*, user_vehicle:user_vehicles(*, vehicle:vehicles(*))')
        .eq('user_vehicle_id', vehicleId)
        .order('logged_at', { ascending: false });

      if (fillUpsError) throw fillUpsError;

      // Calculate km/L for each fill-up
      const fillUpsWithCalculations: FillUpWithVehicle[] = (rawFillUps || []).map((f, i, arr) => {
        // Find previous fill-up (which is next in array since sorted desc)
        const prevFillUp = arr[i + 1];
        let kmPerL: number | null = null;
        let benchmark = null;

        if (prevFillUp?.odometer_km && f.odometer_km && f.litres > 0) {
          const distance = f.odometer_km - prevFillUp.odometer_km;
          if (distance > 0) {
            kmPerL = distance / f.litres;

            const v = (f.user_vehicle as UserVehicleWithVehicle)?.vehicle;
            if (v?.official_km_per_l) {
              benchmark = calculateBenchmarkDelta(kmPerL, v.official_km_per_l);
            }
          }
        }

        return { ...f, km_per_l: kmPerL, benchmark } as FillUpWithVehicle;
      });

      // Group by month
      const groups: { [month: string]: FillUpWithVehicle[] } = {};
      fillUpsWithCalculations.forEach((f) => {
        const month = new Date(f.logged_at).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'long',
        });
        if (!groups[month]) groups[month] = [];
        groups[month].push(f);
      });

      const grouped: GroupedFillUps[] = Object.entries(groups).map(([month, fillUps]) => ({
        month,
        fillUps,
        totalSpend: fillUps.reduce((sum, f) => sum + (f.litres * ((f.price_cents_per_litre ?? 0) / 100)), 0),
      }));

      setGroupedFillUps(grouped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, params.vehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <LoadingState message="Loading fill-up history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  const title = vehicle ? `${vehicle.nickname} Fill-up History` : 'Fill-up History';

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: FontWeights.semibold },
          headerShadowVisible: false,
        }}
      />

      <FlatList
        data={groupedFillUps}
        keyExtractor={(item) => item.month}
        renderItem={({ item: group }) => (
          <View style={styles.monthSection}>
            <View style={styles.monthHeader}>
              <Text style={[styles.monthTitle, { color: colors.text }]}>{group.month}</Text>
              <Text style={[styles.monthTotal, { color: colors.primary }]}>
                R{group.totalSpend.toFixed(2)} spent
              </Text>
            </View>

            {group.fillUps.map((fillUp) => {
              const fullCost = fillUp.litres * ((fillUp.price_cents_per_litre ?? 0) / 100);

              return (
                <Card key={fillUp.id} style={styles.fillUpCard}>
                  <View style={styles.fillUpRow}>
                    <View style={styles.fillUpDate}>
                      <Text style={[styles.dateDay, { color: colors.text }]}>
                        {new Date(fillUp.logged_at).getDate()}
                      </Text>
                      <Text style={[styles.dateMonth, { color: colors.textSecondary }]}>
                        {new Date(fillUp.logged_at).toLocaleDateString('en-ZA', { month: 'short' })}
                      </Text>
                    </View>

                    <View style={styles.fillUpInfo}>
                      <View style={styles.fillUpStats}>
                        <Text style={[styles.fillUpLitres, { color: colors.text }]}>
                          {fillUp.litres.toFixed(1)}L
                        </Text>
                        <Text style={[styles.fillUpCost, { color: colors.textSecondary }]}>
                          R{fullCost.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.fillUpMeta}>
                        <Text style={[styles.fillUpPrice, { color: colors.textTertiary }]}>
                          {formatPrice(fillUp.price_cents_per_litre ?? 0)}/L
                        </Text>
                        {fillUp.odometer_km && (
                          <>
                            <Text style={[styles.fillUpDivider, { color: colors.textTertiary }]}>•</Text>
                            <Text style={[styles.fillUpOdo, { color: colors.textTertiary }]}>
                              {fillUp.odometer_km.toLocaleString()} km
                            </Text>
                          </>
                        )}
                      </View>
                    </View>

                    {fillUp.km_per_l && (
                      <View style={styles.consumptionBadge}>
                        <Text style={[styles.consumptionValue, { color: colors.text }]}>
                          {formatKmPerL(fillUp.km_per_l)}
                        </Text>
                        {fillUp.benchmark && (
                          <BenchmarkBadge
                            status={fillUp.benchmark.status}
                            percentage={fillUp.benchmark.percentage}
                            label=""
                            size="small"
                          />
                        )}
                      </View>
                    )}
                  </View>

                  {fillUp.station_name && (
                    <Text style={[styles.fillUpStation, { color: colors.textSecondary }]}>
                      {fillUp.station_name}
                    </Text>
                  )}
                </Card>
              );
            })}
          </View>
        )}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Droplet size={48} color={colors.textTertiary} />}
            title="No fill-ups yet"
            message="Log your first fill-up to start tracking consumption"
            actionLabel="Log Fill-up"
            onAction={() => router.replace('/fill-up')}
          />
        }
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  monthSection: {
    marginBottom: Spacing.xl,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  monthTotal: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  fillUpCard: {
    marginBottom: Spacing.sm,
  },
  fillUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fillUpDate: {
    width: 50,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  dateMonth: {
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  fillUpInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fillUpStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  fillUpLitres: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  fillUpCost: {
    fontSize: FontSizes.md,
  },
  fillUpMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fillUpPrice: {
    fontSize: FontSizes.sm,
  },
  fillUpDivider: {
    fontSize: FontSizes.sm,
    marginHorizontal: Spacing.xs,
  },
  fillUpOdo: {
    fontSize: FontSizes.sm,
  },
  consumptionBadge: {
    alignItems: 'flex-end',
  },
  consumptionValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  fillUpStation: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    marginLeft: 50 + Spacing.md,
  },
});
