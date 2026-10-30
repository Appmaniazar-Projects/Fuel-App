import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Navigation2, Clock, Fuel, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Card } from '@/components/Card';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { StationsMap } from '@/components/StationsMap';
import { fetchNearbyStations, BRANDS, type Station } from '@/lib/stations';
import { regionForLocation, REGION_LABEL, type PriceRegion } from '@/lib/regions';
import { fetchCurrentPrices, type PriceMap } from '@/lib/currentPrices';
import {
  useColors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
  formatPrice,
} from '@/lib/theme';

// Johannesburg, used when location permission is denied
const DEFAULT_LOCATION = { latitude: -26.2041, longitude: 28.0473 };

const PRICE_ROWS: { key: keyof PriceMap; label: string }[] = [
  { key: 'unleaded_95', label: 'Petrol 95' },
  { key: 'unleaded_93', label: 'Petrol 93' },
  { key: 'diesel_50ppm', label: 'Diesel 50ppm' },
];

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function StationsScreen() {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  const [stations, setStations] = useState<Station[]>([]);
  const [userLocation, setUserLocation] = useState(DEFAULT_LOCATION);
  const [region, setRegion] = useState<PriceRegion>('inland');
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationNote, setLocationNote] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchAll = useCallback(async (force = false) => {
    let coords = DEFAULT_LOCATION;
    try {
      setError(null);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setLocationNote(null);
        } else {
          setLocationNote('Location permission denied, showing Johannesburg.');
        }
      } catch {
        setLocationNote('Could not get your location, showing Johannesburg.');
      }
      setUserLocation(coords);

      // Prices first, so the screen shows something while stations load
      const r = regionForLocation(coords.latitude, coords.longitude);
      setRegion(r);
      const current = await fetchCurrentPrices(r);
      setPrices(current.prices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load prices');
    } finally {
      setLoading(false);
    }

    try {
      setStationsLoading(true);
      setStations(await fetchNearbyStations(coords.latitude, coords.longitude, { force }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load nearby stations');
    } finally {
      setStationsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll(true);
  }, [fetchAll]);

  const brandsPresent = useMemo(
    () => Object.keys(BRANDS).filter((b) => stations.some((s) => s.brand === b)),
    [stations]
  );

  const visibleStations = useMemo(
    () => (selectedBrand ? stations.filter((s) => s.brand === selectedBrand) : stations),
    [stations, selectedBrand]
  );

  const priceRows = useMemo(
    () => PRICE_ROWS.filter((p) => prices[p.key]).map((p) => ({ ...p, cents: prices[p.key]! })),
    [prices]
  );

  const mapPrices = useMemo(
    () => priceRows.map((p) => ({ label: p.label, price: formatPrice(p.cents) })),
    [priceRows]
  );

  const openNavigation = (station: Station) => {
    const destination = `${station.latitude},${station.longitude}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    const nativeMapsUrl = Platform.select({
      ios: `maps://?daddr=${destination}`,
      android: `geo:0,0?q=${destination}(${encodeURIComponent(station.name)})`,
    });
    Linking.openURL(nativeMapsUrl || googleMapsUrl).catch(() => Linking.openURL(googleMapsUrl));
  };

  if (loading) {
    return <LoadingState message="Finding nearby stations..." />;
  }

  if (error && stations.length === 0) {
    return <ErrorState message={error} onRetry={() => fetchAll(true)} />;
  }

  const shownStations = showAll ? visibleStations : visibleStations.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Nearby Stations</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {stationsLoading
            ? 'Searching for stations near you...'
            : `${stations.length} stations within ${stations.length && stations[stations.length - 1].distance > 8000 ? '20' : '8'} km`}
        </Text>
        {locationNote && (
          <Text style={[styles.locationWarning, { color: colors.warning }]}>{locationNote}</Text>
        )}
      </View>

      {/* Prices that apply at these stations */}
      {priceRows.length > 0 && (
        <Card style={styles.pricesCard}>
          <Text style={[styles.pricesTitle, { color: colors.text }]}>
            Pump prices here ({REGION_LABEL[region]} zone)
          </Text>
          <View style={styles.pricesRow}>
            {priceRows.map((p) => (
              <View key={p.key} style={styles.priceCell}>
                <Text style={[styles.priceCellLabel, { color: colors.textSecondary }]}>{p.label}</Text>
                <Text style={[styles.priceCellValue, { color: colors.text }]}>{formatPrice(p.cents)}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.pricesNote, { color: colors.textTertiary }]}>
            Petrol is government-regulated, so every station in a zone charges the same. Diesel is a
            maximum price; some stations sell it for less.
          </Text>
        </Card>
      )}

      <StationsMap
        user={userLocation}
        stations={visibleStations}
        prices={mapPrices}
        dark={dark}
        height={300}
      />
      {stationsLoading && (
        <View style={styles.inlineLoading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.inlineLoadingText, { color: colors.textSecondary }]}>Finding stations...</Text>
        </View>
      )}

      {/* Brand filter */}
      {brandsPresent.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.brandFilter}
          contentContainerStyle={styles.brandFilterContent}
        >
          {[null, ...brandsPresent].map((b) => {
            const active = selectedBrand === b;
            return (
              <Pressable
                key={b ?? 'all'}
                onPress={() => { setSelectedBrand(b); setShowAll(false); }}
                style={[
                  styles.brandChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                {b && <View style={[styles.chipDot, { backgroundColor: BRANDS[b].color }]} />}
                <Text style={[styles.brandChipText, { color: active ? colors.textInverse : colors.text }]}>
                  {b ? BRANDS[b].label : 'All'}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {stationsLoading ? null : visibleStations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <MapPin size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No stations found nearby</Text>
          </View>
        </Card>
      ) : (
        <View style={styles.stationList}>
          {shownStations.map((station) => (
            <Card key={station.id} style={styles.stationCard}>
              <View style={styles.stationRow}>
                <View style={[styles.brandIcon, { backgroundColor: BRANDS[station.brand].color }]}>
                  <Fuel size={18} color={station.brand === 'shell' ? '#1F2937' : '#FFFFFF'} />
                </View>
                <View style={styles.stationInfo}>
                  <Text style={[styles.stationName, { color: colors.text }]}>{station.name}</Text>
                  {!!station.address && (
                    <Text style={[styles.stationAddress, { color: colors.textSecondary }]}>{station.address}</Text>
                  )}
                  <View style={styles.metaRow}>
                    <Text style={[styles.stationDistance, { color: colors.textTertiary }]}>
                      {station.brandLabel} · {formatDistance(station.distance)}
                    </Text>
                    {station.open24h && (
                      <View style={styles.metaItem}>
                        <Clock size={12} color={colors.success} />
                        <Text style={[styles.openText, { color: colors.success }]}>24 hours</Text>
                      </View>
                    )}
                  </View>
                  {priceRows.length > 0 && (
                    <Text style={[styles.stationPrices, { color: colors.text }]}>
                      {priceRows.map((p) => `${p.label} ${formatPrice(p.cents)}`).join('  ·  ')}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => openNavigation(station)}
                  style={[styles.navButton, { backgroundColor: colors.primaryLight }]}
                  accessibilityLabel={`Directions to ${station.name}`}
                >
                  <Navigation2 size={18} color={colors.primary} />
                </Pressable>
              </View>
            </Card>
          ))}
          {visibleStations.length > 5 && (
            <Pressable
              onPress={() => setShowAll((v) => !v)}
              style={[styles.viewMore, { borderColor: colors.border }]}
              accessibilityRole="button"
            >
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                {showAll ? 'Show fewer' : `View ${visibleStations.length - 5} more stations`}
              </Text>
              {showAll ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={18} color={colors.primary} />}
            </Pressable>
          )}
        </View>
      )}

      <Text style={[styles.attribution, { color: colors.textTertiary }]}>
        Station data © OpenStreetMap contributors
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
  locationWarning: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  brandFilter: {
    marginBottom: Spacing.lg,
  },
  brandFilterContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  brandChipText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  emptyCard: {
    marginBottom: Spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.md,
    marginTop: Spacing.lg,
  },
  stationList: {
    marginBottom: Spacing.lg,
  },
  stationCard: {
    marginBottom: Spacing.md,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: Spacing.md,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  stationAddress: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  stationDistance: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  stationStatus: {
    marginLeft: Spacing.md,
  },
  openBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  openText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  stationActions: {
    flexDirection: 'row',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 0.5,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  actionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  disclaimerCard: {
    marginBottom: Spacing.lg,
  },
  disclaimerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  disclaimerTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  disclaimerMessage: {
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  pricesCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  pricesTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.md,
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  priceCell: {
    flex: 1,
  },
  priceCellLabel: {
    fontSize: FontSizes.xs,
  },
  priceCellValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginTop: 2,
  },
  pricesNote: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stationPrices: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    marginTop: 6,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  attribution: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  inlineLoadingText: {
    fontSize: FontSizes.sm,
  },
  viewMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
  },
  viewMoreText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
});
