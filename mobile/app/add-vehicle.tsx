import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Search, Check, Star, X, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { CustomVehicleForm } from '@/components/CustomVehicleForm';
import {
  useColors,
  Spacing,
  FontSizes,
  FontWeights,
  BorderRadius,
} from '@/lib/theme';
import type { Vehicle } from '@/types/database';

export default function AddVehicleScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [nickname, setNickname] = useState('');
  const [preferredFuel, setPreferredFuel] = useState<string | null>(null);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    supabase
      .from('vehicles')
      .select('*')
      .order('make')
      .order('model')
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(loadError.message || 'Failed to load vehicles');
        } else {
          setAllVehicles(data || []);
          setVehicles(data || []);
        }
        setLoading(false);
      });
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setVehicles(allVehicles);
      return;
    }

    const q = query.toLowerCase();
    const filtered = allVehicles.filter(
      (v) =>
        `${v.make} ${v.model} ${v.variant ?? ''}`.toLowerCase().includes(q) ||
        // a year like "2009" matches every generation sold that year
        (/^\d{4}$/.test(q.trim()) &&
          (v.year_from ?? 0) <= Number(q) &&
          Number(q) <= (v.year_to ?? 9999))
    );
    setVehicles(filtered);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setNickname(`${vehicle.make} ${vehicle.model}`);
    setPreferredFuel(
      vehicle.fuel_type === 'diesel' ? 'diesel_50ppm' : 'unleaded_95'
    );
  };

  const handleSave = async () => {
    if (!user || !selectedVehicle || !nickname.trim()) {
      setError('Please select a vehicle and enter a nickname');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // The first vehicle is always the default, so screens that rely on a
      // default vehicle (history, fill-up) always have one.
      const { count } = await supabase
        .from('user_vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      const makeDefault = setAsDefault || !count;

      // If setting as default, remove default from others
      if (makeDefault) {
        await supabase
          .from('user_vehicles')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error: insertError } = await supabase.from('user_vehicles').insert({
        user_id: user.id,
        vehicle_id: selectedVehicle.id,
        nickname: nickname.trim(),
        selected_fuel_key: preferredFuel,
        is_default: makeDefault,
      });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const makes = [...new Set(allVehicles.map((v) => v.make))].sort();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading vehicles...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Vehicle',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: FontWeights.semibold },
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          {!selectedVehicle && (
            <View style={styles.searchSection}>
              <View
                style={[
                  styles.searchInput,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <Search size={20} color={colors.textTertiary} />
                <TextInput
                  style={[styles.searchText, { color: colors.text }]}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  placeholder="Search by make or model..."
                  placeholderTextColor={colors.textTertiary}
                />
                {!!searchQuery && (
                  <Pressable onPress={() => handleSearch('')}>
                    <X size={20} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>

              {/* Quick Make Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.makeFilter}
                contentContainerStyle={styles.makeFilterContent}
              >
                {makes.slice(0, 10).map((make) => (
                  <Pressable
                    key={make}
                    style={[
                      styles.makeChip,
                      { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    ]}
                    onPress={() => handleSearch(make)}
                  >
                    <Text style={[styles.makeChipText, { color: colors.text }]}>{make}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {vehicles.length} vehicles found
              </Text>
            </View>
          )}

          {/* Vehicle Selection List */}
          {!selectedVehicle && (
            <View style={styles.vehicleList}>
              {vehicles.slice(0, 20).map((vehicle) => (
                <Pressable
                  key={vehicle.id}
                  style={[
                    styles.vehicleItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                  onPress={() => handleSelectVehicle(vehicle)}
                >
                  <View style={styles.vehicleItemInfo}>
                    <Text
                      style={[styles.vehicleItemTitle, { color: colors.text }]}
                    >{`${vehicle.make} ${vehicle.model}`}</Text>
                    {!!vehicle.variant && (
                      <Text style={[styles.vehicleItemVariant, { color: colors.textSecondary }]}>
                        {vehicle.variant}
                      </Text>
                    )}
                    <View style={styles.vehicleItemMeta}>
                      {!!vehicle.year_from && (
                        <>
                          <Text style={[styles.vehicleItemMetaText, { color: colors.textTertiary }]}>
                            {vehicle.year_from === vehicle.year_to || !vehicle.year_to
                              ? vehicle.year_from
                              : `${vehicle.year_from}–${vehicle.year_to}`}
                          </Text>
                          <Text style={[styles.vehicleItemMetaDot, { color: colors.textTertiary }]}>
                            •
                          </Text>
                        </>
                      )}
                      <Text style={[styles.vehicleItemMetaText, { color: colors.textTertiary }]}>
                        {vehicle.fuel_type === 'diesel' ? 'Diesel' : 'Petrol'}
                      </Text>
                      <Text style={[styles.vehicleItemMetaDot, { color: colors.textTertiary }]}>
                        •
                      </Text>
                      <Text style={[styles.vehicleItemMetaText, { color: colors.textTertiary }]}>
                        {vehicle.transmission === 'manual' ? 'Manual' : 'Auto'}
                      </Text>
                      {!!vehicle.official_km_per_l && (
                        <>
                          <Text style={[styles.vehicleItemMetaDot, { color: colors.textTertiary }]}>
                            •
                          </Text>
                          <Text style={[styles.vehicleItemMetaText, { color: colors.textTertiary }]}>
                            {vehicle.official_km_per_l.toFixed(1)} km/L spec
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Check size={20} color={colors.primary} />
                </Pressable>
              ))}

              {vehicles.length > 20 && (
                <Text style={[styles.moreResults, { color: colors.textSecondary }]}>
                  Showing 20 of {vehicles.length}. Refine your search to see more.
                </Text>
              )}

              {showCustom && user ? (
                <CustomVehicleForm
                  userId={user.id}
                  initialText={searchQuery}
                  onCancel={() => setShowCustom(false)}
                  onCreated={(v) => {
                    setShowCustom(false);
                    setAllVehicles((prev) => [...prev, v]);
                    handleSelectVehicle(v);
                  }}
                />
              ) : (
                <Pressable
                  onPress={() => setShowCustom(true)}
                  style={[styles.vehicleItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.vehicleItemInfo}>
                    <Text style={[styles.vehicleItemTitle, { color: colors.text }]}>
                      My car isn&apos;t listed
                    </Text>
                    <Text style={[styles.vehicleItemVariant, { color: colors.textSecondary }]}>
                      Add any make, model and year
                    </Text>
                  </View>
                  <Plus size={20} color={colors.primary} />
                </Pressable>
              )}
            </View>
          )}

          {/* Selected Vehicle Form */}
          {selectedVehicle && (
            <View style={styles.formSection}>
              <Card style={styles.selectedCard}>
                <View style={styles.selectedHeader}>
                  <View style={styles.selectedInfo}>
                    <Text style={[styles.selectedTitle, { color: colors.text }]}>
                      {selectedVehicle.make} {selectedVehicle.model}
                    </Text>
                    {!!selectedVehicle.variant && (
                      <Text style={[styles.selectedVariant, { color: colors.textSecondary }]}>
                        {selectedVehicle.variant}
                      </Text>
                    )}
                  </View>
                  <Pressable onPress={() => setSelectedVehicle(null)}>
                    <X size={20} color={colors.textTertiary} />
                  </Pressable>
                </View>

                <View style={styles.selectedMeta}>
                  <View style={styles.selectedMetaItem}>
                    <Text style={[styles.selectedMetaLabel, { color: colors.textSecondary }]}>
                      Fuel Type
                    </Text>
                    <Text style={[styles.selectedMetaValue, { color: colors.text }]}>
                      {selectedVehicle.fuel_type === 'diesel' ? 'Diesel' : 'Petrol'}
                    </Text>
                  </View>
                  <View style={styles.selectedMetaItem}>
                    <Text style={[styles.selectedMetaLabel, { color: colors.textSecondary }]}>
                      Transmission
                    </Text>
                    <Text style={[styles.selectedMetaValue, { color: colors.text }]}>
                      {selectedVehicle.transmission === 'manual' ? 'Manual' : 'Automatic'}
                    </Text>
                  </View>
                  {!!selectedVehicle.official_km_per_l && (
                    <View style={styles.selectedMetaItem}>
                      <Text style={[styles.selectedMetaLabel, { color: colors.textSecondary }]}>
                        Official Consumption
                      </Text>
                      <Text style={[styles.selectedMetaValue, { color: colors.text }]}>
                        {selectedVehicle.official_km_per_l.toFixed(1)} km/L
                      </Text>
                    </View>
                  )}
                </View>
              </Card>

              {/* Nickname */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nickname</Text>
                <View
                  style={[
                    styles.textInput,
                    { borderColor: colors.border, backgroundColor: colors.inputBg },
                  ]}
                >
                  <TextInput
                    style={[styles.textInputText, { color: colors.text }]}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="My Toyota"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              {/* Preferred Fuel */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Preferred Fuel
                </Text>
                <View style={styles.fuelOptions}>
                  <Pressable
                    style={[
                      styles.fuelOption,
                      {
                        backgroundColor:
                          preferredFuel === 'unleaded_95' || preferredFuel === 'unleaded_93'
                            ? colors.primaryLight
                            : colors.surfaceSecondary,
                        borderColor:
                          preferredFuel === 'unleaded_95' || preferredFuel === 'unleaded_93'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setPreferredFuel('unleaded_95')}
                    disabled={selectedVehicle.fuel_type === 'diesel'}
                  >
                    <Text
                      style={[
                        styles.fuelOptionText,
                        {
                          color:
                            selectedVehicle.fuel_type === 'diesel'
                              ? colors.textTertiary
                              : preferredFuel?.includes('unleaded')
                                ? colors.primary
                                : colors.text,
                        },
                      ]}
                    >
                      Petrol (93/95)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.fuelOption,
                      {
                        backgroundColor:
                          preferredFuel === 'diesel_50ppm' || preferredFuel === 'diesel_500ppm'
                            ? colors.primaryLight
                            : colors.surfaceSecondary,
                        borderColor:
                          preferredFuel === 'diesel_50ppm' || preferredFuel === 'diesel_500ppm'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setPreferredFuel('diesel_50ppm')}
                    disabled={selectedVehicle.fuel_type === 'petrol'}
                  >
                    <Text
                      style={[
                        styles.fuelOptionText,
                        {
                          color:
                            selectedVehicle.fuel_type === 'petrol'
                              ? colors.textTertiary
                              : preferredFuel?.includes('diesel')
                                ? colors.primary
                                : colors.text,
                        },
                      ]}
                    >
                      Diesel (50/500ppm)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Set as Default */}
              <Pressable
                style={[styles.defaultToggle, { backgroundColor: colors.surfaceSecondary }]}
                onPress={() => setSetAsDefault(!setAsDefault)}
              >
                <Star
                  size={20}
                  color={setAsDefault ? colors.warning : colors.textTertiary}
                  fill={setAsDefault ? colors.warning : 'transparent'}
                />
                <Text style={[styles.defaultToggleText, { color: colors.text }]}>
                  Set as default vehicle
                </Text>
              </Pressable>

              {error && (
                <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
              )}

              <Button
                title="Add Vehicle"
                onPress={handleSave}
                loading={saving}
                disabled={!nickname.trim()}
                style={styles.saveButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: FontSizes.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  searchSection: {
    marginBottom: Spacing.lg,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  searchText: {
    flex: 1,
    fontSize: FontSizes.md,
  },
  makeFilter: {
    marginTop: Spacing.md,
  },
  makeFilterContent: {
    gap: Spacing.sm,
  },
  makeChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  makeChipText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  resultsCount: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.md,
  },
  vehicleList: {
    marginBottom: Spacing.lg,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 0.5,
    marginBottom: Spacing.sm,
  },
  vehicleItemInfo: {
    flex: 1,
  },
  vehicleItemTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  vehicleItemVariant: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  vehicleItemMeta: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  vehicleItemMetaText: {
    fontSize: FontSizes.sm,
  },
  vehicleItemMetaDot: {
    fontSize: FontSizes.sm,
    marginHorizontal: Spacing.xs,
  },
  moreResults: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  formSection: {
    marginTop: Spacing.sm,
  },
  selectedCard: {
    marginBottom: Spacing.xl,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedInfo: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  selectedVariant: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  selectedMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    gap: Spacing.xl,
  },
  selectedMetaItem: {},
  selectedMetaLabel: {
    fontSize: FontSizes.sm,
  },
  selectedMetaValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  textInputText: {
    fontSize: FontSizes.md,
  },
  fuelOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fuelOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  fuelOptionText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  defaultToggleText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  errorBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  saveButton: {},
});
