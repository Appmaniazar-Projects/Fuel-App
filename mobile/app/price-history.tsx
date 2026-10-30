import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect, Stack } from 'expo-router';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
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
} from '@/lib/theme';
import type { FuelHistory } from '@/types/database';

// Months are stored as 'YYYY-MM' (live DB) or 'YYYY-MM-01' (older rows).
function monthDate(month: string): Date {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

// Keep the most recent 12 months, oldest first, one row per month.
function lastTwelveMonths(rows: FuelHistory[]): FuelHistory[] {
  const byMonth = new Map<string, FuelHistory>();
  for (const row of rows) byMonth.set(row.month.slice(0, 7), row);
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, row]) => row);
}

const FUEL_TYPES = [
  { key: 'unleaded_95', name: 'Unleaded 95', color: '#185FA5' },
  { key: 'unleaded_93', name: 'Unleaded 93', color: '#10B981' },
  { key: 'diesel_50ppm', name: 'Diesel 50ppm', color: '#F59E0B' },
  { key: 'diesel_500ppm', name: 'Diesel 500ppm', color: '#EF4444' },
];

export default function PriceHistoryScreen() {
  const colors = useColors();
  const [selectedFuel, setSelectedFuel] = useState('unleaded_95');
  const [history, setHistory] = useState<FuelHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      try {
        const apiData = await fillupApi.getHistory({ fuel_key: selectedFuel });
        if (apiData?.success && apiData?.data?.records) {
          // Map records to expected FuelHistory shape if necessary
          setHistory(lastTwelveMonths(apiData.data.records || []));
          return;
        }
      } catch (err) {
        // fall back to Supabase local DB query
      }

      const { data, error: fetchError } = await supabase
        .from('fuel_history')
        .select('*')
        .eq('fuel_key', selectedFuel)
        .order('month', { ascending: false })
        .limit(24);

      if (fetchError) throw fetchError;
      setHistory(lastTwelveMonths(data || []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [selectedFuel]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return <LoadingState message="Loading price history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />;
  }

  if (history.length === 0) {
    return (
      <ErrorState
        message="No price history yet for this fuel. History builds up each month as prices are updated."
        onRetry={fetchData}
      />
    );
  }

  // Calculate chart values
  const prices = history.map((h) => h.price_cents);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const oldestPrice = history[0]?.price_cents || 0;
  const newestPrice = history[history.length - 1]?.price_cents || 0;
  const yearChange = newestPrice - oldestPrice;
  const yearChangePercent = oldestPrice > 0 ? ((yearChange / oldestPrice) * 100) : 0;

  const currentFuel = FUEL_TYPES.find((f) => f.key === selectedFuel)!;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Price History',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: FontWeights.semibold },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Fuel Type Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fuelSelector}
        >
          {FUEL_TYPES.map((fuel) => (
            <Pressable
              key={fuel.key}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedFuel === fuel.key }}
              style={[
                styles.fuelTab,
                {
                  backgroundColor: selectedFuel === fuel.key ? colors.primary : colors.surfaceSecondary,
                  borderColor: selectedFuel === fuel.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedFuel(fuel.key)}
            >
              <View style={[styles.fuelDot, { backgroundColor: fuel.color }]} />
              <Text
                style={[
                  styles.fuelTabText,
                  { color: selectedFuel === fuel.key ? colors.textInverse : colors.text },
                ]}
              >
                {fuel.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Current Price Card */}
        <Card style={styles.currentCard}>
          <View style={styles.currentRow}>
            <View>
              <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>Current Price</Text>
              <Text style={[styles.currentPrice, { color: colors.text }]}>
                R{(newestPrice / 100).toFixed(2)}<Text style={[styles.currentUnit, { color: colors.textSecondary }]}>/L</Text>
              </Text>
            </View>

            <View style={[styles.yearChange, { backgroundColor: yearChange >= 0 ? colors.errorLight : colors.successLight }]}>
              {yearChange >= 0
                ? <TrendingUp size={18} color={colors.error} />
                : <TrendingDown size={18} color={colors.success} />}
              <Text
                style={[
                  styles.yearChangeText,
                  { color: yearChange >= 0 ? colors.error : colors.success },
                ]}
              >
                {yearChange >= 0 ? '+' : ''}{yearChangePercent.toFixed(1)}% since{' '}
                {monthDate(history[0].month).toLocaleDateString('en-ZA', { month: 'short', year: 'numeric' })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Simple Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            12-Month Price Trend (Gauteng Inland)
          </Text>

          <View style={styles.chart}>
            {history.map((h, i) => {
              const barHeight = ((h.price_cents - minPrice) / priceRange) * 120 + 20;
              const isCurrent = i === history.length - 1;

              return (
                <View key={h.month} style={styles.barColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isCurrent ? currentFuel.color : currentFuel.color + '60',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        },
                      ]}
                    />
                    {isCurrent && <View style={[styles.currentDot, { backgroundColor: currentFuel.color }]} />}
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textTertiary }]}>
                    {monthDate(h.month).toLocaleDateString('en-ZA', { month: 'short' })}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.chartLegend}>
            <View style={styles.legendRow}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Low</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                R{(minPrice / 100).toFixed(2)}
              </Text>
            </View>
            <View style={styles.legendRow}>
              <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>High</Text>
              <Text style={[styles.legendValue, { color: colors.text }]}>
                R{(maxPrice / 100).toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Monthly Data */}
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>Monthly Prices</Text>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary }]}>Month</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary }]}>Price/L</Text>
          </View>
          {history
            .slice()
            .reverse()
            .map((h) => (
              <View
                key={h.month}
                style={[styles.tableRow, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.tableCell, { color: colors.text }]}>
                  {monthDate(h.month).toLocaleDateString('en-ZA', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>
                  R{(h.price_cents / 100).toFixed(2)}
                </Text>
              </View>
            ))}
        </Card>
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
    paddingBottom: Spacing.xxl,
  },
  fuelSelector: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  fuelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  fuelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fuelTabText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  currentCard: {
    marginBottom: Spacing.lg,
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: FontSizes.sm,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.bold,
  },
  currentUnit: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.normal,
  },
  yearChange: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  yearChangeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  chartCard: {
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.lg,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: Spacing.md,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 16,
  },
  currentDot: {
    position: 'absolute',
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendLabel: {
    fontSize: FontSizes.sm,
  },
  legendValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  tableCard: {
    marginBottom: Spacing.lg,
  },
  tableTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0.5,
  },
  tableHeaderCell: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
  },
  tableCell: {
    fontSize: FontSizes.md,
  },
});
