import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { MapPin, Navigation2, Clock, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
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

const BRAND_COLORS: { [key: string]: string } = {
  engen: '#00A651',
  bp: '#006F3B',
  shell: '#FBCE07',
  sasol: '#E36F1E',
  caltex: '#0066B3',
  astron: '#1E3A8A',
  total: '#FF0000',
  other: '#6B7280',
};

const BRAND_TAGS = ['engen', 'bp', 'shell', 'sasol', 'caltex', 'astron', 'total'];

interface Station {
  id: string;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  address: string;
  distance: number;
  open_now: boolean | null;
  rating: number | null;
}

export default function StationsScreen() {
  const colors = useColors();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Using default location.');
        // Use Johannesburg as default
        return { coords: { latitude: -26.2041, longitude: 28.0473 } };
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      return loc;
    } catch (err) {
      setLocationError('Could not get location. Using default.');
      return { coords: { latitude: -26.2041, longitude: 28.0473 } };
    }
  };

  const fetchStations = useCallback(async () => {
    try {
      setError(null);

      const loc = await requestLocation();
      const { latitude, longitude } = loc.coords;

      // Use the location-aware function first. The legacy `stations` function
      // defaults to Johannesburg when it is called without coordinates.
      const { data: nearbyData, error: nearbyError } = await supabase.functions.invoke('nearby-stations', {
        body: { latitude, longitude, radius: 5000 },
      });

      if (nearbyError || !nearbyData?.stations) {
        // Never show made-up stations: say what went wrong instead.
        throw new Error(
          nearbyData?.error ||
            'Nearby stations are unavailable right now. Check that the nearby-stations function is deployed with a Google Places API key.'
        );
      }
      setStations(nearbyData.stations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStations();
    }, [fetchStations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStations();
  }, [fetchStations]);

  const getBrandColor = (brand: string): string => {
    const b = brand.toLowerCase();
    for (const tag of BRAND_TAGS) {
      if (b.includes(tag)) return BRAND_COLORS[tag];
    }
    return BRAND_COLORS.other;
  };

  const filteredStations = selectedBrand
    ? stations.filter((s) => s.brand.toLowerCase().includes(selectedBrand.toLowerCase()))
    : stations;

  const sortedStations = [...filteredStations].sort((a, b) => a.distance - b.distance);

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

  if (error) {
    return <ErrorState message={error} onRetry={fetchStations} />;
  }

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
        <Text style={[styles.title, { color: colors.text }]}>Nearby Stations</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find fuel stations near your location
        </Text>
        {locationError && (
          <Text style={[styles.locationWarning, { color: colors.warning }]}>
            {locationError}
          </Text>
        )}
      </View>

      {/* Brand Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.brandFilter}
        contentContainerStyle={styles.brandFilterContent}
      >
        <Pressable
          style={[
            styles.brandChip,
            {
              backgroundColor: !selectedBrand ? colors.primary : colors.surfaceSecondary,
              borderColor: !selectedBrand ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setSelectedBrand(null)}
        >
          <Text style={[styles.brandChipText, { color: !selectedBrand ? colors.textInverse : colors.text }]}>
            All
          </Text>
        </Pressable>
        {BRAND_TAGS.slice(0, 6).map((brand) => (
          <Pressable
            key={brand}
            style={[
              styles.brandChip,
              {
                backgroundColor: selectedBrand === brand ? colors.primary : colors.surfaceSecondary,
                borderColor: selectedBrand === brand ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedBrand(brand)}
          >
            <Text style={[styles.brandChipText, { color: selectedBrand === brand ? colors.textInverse : colors.text }]}>
              {brand.charAt(0).toUpperCase() + brand.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Stations List */}
      {sortedStations.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyContent}>
            <MapPin size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No stations found nearby
            </Text>
          </View>
        </Card>
      ) : (
        <View style={styles.stationList}>
          {sortedStations.map((station, index) => (
            <Card key={station.id} style={styles.stationCard}>
              <View style={styles.stationRow}>
                <View style={[styles.brandDot, { backgroundColor: getBrandColor(station.brand) }]} />

                <View style={styles.stationInfo}>
                  <Text style={[styles.stationName, { color: colors.text }]}>
                    {station.name}
                  </Text>
                  <Text style={[styles.stationAddress, { color: colors.textSecondary }]}>
                    {station.address}
                  </Text>
                  <Text style={[styles.stationDistance, { color: colors.textTertiary }]}>
                    {station.distance < 1000
                      ? `${station.distance}m away`
                      : `${(station.distance / 1000).toFixed(1)}km away`}
                  </Text>
                </View>

                <View style={styles.stationStatus}>
                  {station.open_now !== null && (
                    <View
                      style={[
                        styles.openBadge,
                        { backgroundColor: station.open_now ? colors.successLight : colors.errorLight },
                      ]}
                    >
                      <Text
                        style={[
                          styles.openText,
                          { color: station.open_now ? colors.success : colors.error },
                        ]}
                      >
                        {station.open_now ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={[styles.stationActions, { borderTopColor: colors.border }]}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
                  onPress={() => openNavigation(station)}
                >
                  <Navigation2 size={18} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Navigate</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <Card style={styles.disclaimerCard}>
        <View style={styles.disclaimerContent}>
          <Clock size={20} color={colors.warning} />
          <View style={styles.disclaimerText}>
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
              Data Notice
            </Text>
            <Text style={[styles.disclaimerMessage, { color: colors.textSecondary }]}>
              Station data may not reflect real-time availability. Operating hours, prices, and fuel availability are subject to change. Always confirm directly with the station before visiting.
            </Text>
          </View>
        </View>
      </Card>
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
});
