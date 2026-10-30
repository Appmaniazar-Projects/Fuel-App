import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, ChevronRight, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import * as fillupApi from '@/lib/fillupApi';
import { Card } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import {
  useColors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
  formatPrice,
  formatPriceChange,
} from '@/lib/theme';
import type { FuelPrice } from '@/types/database';


// KZN Coastal intentionally omitted: the live scraper only distinguishes
// Gauteng vs Coastal, so there's no genuine independent KZN price feed.
// Add it back only once a real KZN-specific source exists.
const REGIONS = [
  // key = the value stored in fuel_prices.region; label = display text
  { key: 'Gauteng Inland', label: 'Gauteng (Inland)' },
  { key: 'Western Cape Coastal', label: 'Western Cape (Coastal)' },
];

const FUEL_DISPLAY = [
  { key: 'unleaded_95', name: 'Unleaded 95 Octane', dbKey: 'unleaded_95' },
  { key: 'unleaded_93', name: 'Unleaded 93 Octane', dbKey: 'unleaded_93' },
  { key: 'diesel_50ppm', name: 'Diesel 50ppm (0.005%)', dbKey: 'diesel_50ppm' },
  { key: 'diesel_500ppm', name: 'Diesel 500ppm (0.05%)', dbKey: 'diesel_500ppm' },
];

interface PriceData {
  current: FuelPrice;
  previousMonth: { [key: string]: number };
}

export default function PricesScreen() {
  const colors = useColors();
  const router = useRouter();

  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0].key);
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
     setLoading(true);
      setError(null);

      // Try FillUp API backend first
      try {
        const regionParam = selectedRegion.toLowerCase().includes('coastal') ? 'coastal' : 'inland';
        const apiData = await fillupApi.getCurrent({ region: regionParam });

        if (apiData?.success && apiData?.data) {
          const fuels = apiData.data.fuels || [];

          const currentObj: any = {
            effective_date: apiData.data.effective_date,
            data_source: apiData.data._meta?.data_source || 'DMRE',
          };

          fuels.forEach((f: any) => {
            currentObj[f.key] = f.price_cents ?? f.price ?? null;
          });

          // The API already computes prev/change/direction per fuel — read
          // that directly rather than a `history` field the API never returns.
          let previousMonth: { [key: string]: number } = {};
          fuels.forEach((f: any) => {
            if (typeof f.prev === 'number') previousMonth[f.key] = f.prev;
          });

          setData({ current: currentObj, previousMonth });
          return;
        }
      } catch (err) {
        // ignore and fall back to supabase/local DB
      }

      // Fallback to direct database query
      const { data: current, error: currentError } = await supabase
        .from('fuel_prices')
        .select('*')
        .eq('region', selectedRegion)
        .eq('is_current', true)
        .maybeSingle();

      if (currentError) throw currentError;
      if (!current) throw new Error('No current prices found');

      // Get previous month's prices from fuel_history
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthKey = lastMonth.toISOString().slice(0, 10).replace(/-\d\d$/, '-01');

      const { data: history, error: historyError } = await supabase
        .from('fuel_history')
        .select('*')
        .eq('month', monthKey);

      if (historyError) throw historyError;

      const previousMonth: { [key: string]: number } = {};
      history?.forEach((h) => {
        previousMonth[h.fuel_key] = h.price_cents;
      });

      setData({ current, previousMonth });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRegion]);

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
    return <LoadingState message="Loading fuel prices..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (!data?.current) {                         // <-- add this guard
  return <ErrorState message="No pricing data available" onRetry={fetchData} />;
}

 const getPrice = (dbKey: string, priceData?: FuelPrice | null): number => {
  return (priceData?.[dbKey as keyof FuelPrice] as number) ?? 0;
};

  const getChange = (fuelKey: string, currentPrice: number): { change: number; direction: 'up' | 'down' | 'same' } => {
    const previous = data?.previousMonth[fuelKey];
    if (!previous) return { change: 0, direction: 'same' };

    const change = currentPrice - previous;
    return {
      change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Fuel Prices</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Current regulated prices
        </Text>
      </View>

      {/* Region Selector */}
      <View style={styles.regionSelector}>
        {REGIONS.map((region) => (
          <Pressable
            key={region.key}
            style={[
              styles.regionButton,
              {
                backgroundColor: selectedRegion === region.key ? colors.primary : colors.surfaceSecondary,
                borderColor: selectedRegion === region.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedRegion(region.key)}
          >
            <Text
              style={[
                styles.regionButtonText,
                { color: selectedRegion === region.key ? colors.textInverse : colors.text },
              ]}
            >
              {region.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Effective Date */}
      <View style={styles.dateInfo}>
        <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
          Effective from{' '}
        </Text>
        <Text style={[styles.dateValue, { color: colors.text }]}>
          {new Date(data?.current.effective_date || '').toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Price Cards */}
      <View style={styles.priceList}>
        {FUEL_DISPLAY.map((fuel) => {
          const currentPrice = getPrice(fuel.dbKey, data?.current as FuelPrice);
          // Not every fuel is sold in every region (e.g. no 93 octane at the coast)
          if (!currentPrice) return null;
          const { change, direction } = getChange(fuel.key, currentPrice);

          return (
            <Card key={fuel.key} style={styles.priceCard}>
              <View style={styles.priceCardContent}>
                <View style={styles.priceInfo}>
                  <Text style={[styles.fuelName, { color: colors.text }]}>
                    {fuel.name}
                  </Text>
                  <Text style={[styles.priceValue, { color: colors.text }]}>
                    {formatPrice(currentPrice)}
                    <Text style={[styles.priceUnit, { color: colors.textSecondary }]}> /L</Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.changeBadge,
                    {
                      backgroundColor:
                        direction === 'up' ? colors.errorLight :
                        direction === 'down' ? colors.successLight :
                        colors.surfaceSecondary,
                    },
                  ]}
                >
                  {direction === 'up' && <TrendingUp size={14} color={colors.error} />}
                  {direction === 'down' && <TrendingDown size={14} color={colors.success} />}
                  {direction === 'same' && <Minus size={14} color={colors.textTertiary} />}
                  <Text
                    style={[
                      styles.changeText,
                      {
                        color:
                          direction === 'up' ? colors.error :
                          direction === 'down' ? colors.success :
                          colors.textTertiary,
                      },
                    ]}
                  >
                    {direction === 'same' ? 'No change' : formatPriceChange(change)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Data Source */}
      <View style={[styles.sourceCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={styles.sourceRow}>
          <Text style={[styles.sourceLabel, { color: colors.textSecondary }]}>Source</Text>
          <Text style={[styles.sourceValue, { color: colors.text }]}>
            {(data?.current as FuelPrice)?.data_source || 'DMRE'}
          </Text>
        </View>
        <Text style={[styles.sourceNote, { color: colors.textTertiary }]}>
          Prices are regulated by the Department of Mineral Resources and Energy (DMRE) in South Africa
        </Text>
      </View>

      {/* Price History Link */}
      <Pressable
        style={[styles.historyLink, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/price-history')}
      >
        <View style={styles.historyLinkLeft}>
          <TrendingUp size={24} color={colors.primary} />
          <View>
            <Text style={[styles.historyLinkTitle, { color: colors.text }]}>
              Price History
            </Text>
            <Text style={[styles.historyLinkSubtitle, { color: colors.textSecondary }]}>
              View 12-month price trends
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </Pressable>

      {/* Footer */}
      <Text style={[styles.footer, { color: colors.textTertiary }]}>
        Prices are updated monthly on the first Wednesday by DMRE
      </Text>
    </ScrollView>
  );
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
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  regionSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  regionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  regionButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  dateInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  dateLabel: {
    fontSize: FontSizes.sm,
  },
  dateValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  priceList: {
    marginBottom: Spacing.lg,
  },
  priceCard: {
    marginBottom: Spacing.sm,
  },
  priceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInfo: {
    flex: 1,
  },
  fuelName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  priceValue: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  priceUnit: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.normal,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  changeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  sourceCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    marginBottom: Spacing.lg,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sourceLabel: {
    fontSize: FontSizes.sm,
  },
  sourceValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  sourceNote: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    marginBottom: Spacing.lg,
  },
  historyLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  historyLinkTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  historyLinkSubtitle: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  footer: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
});
