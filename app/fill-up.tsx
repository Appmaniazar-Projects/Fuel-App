import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, ChevronDown, ChevronUp, Droplet, Gauge, Calculator } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { BenchmarkBadge } from '@/components/BenchmarkBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
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
import type { UserVehicleWithVehicle, FuelPrice, FillUp } from '@/types/database';

const LITRE_PRESETS = [20, 30, 40, 50, 60];
const FUEL_TYPES = [
  { key: 'unleaded_95', name: 'Unleaded 95', diesel: false },
  { key: 'unleaded_93', name: 'Unleaded 93', diesel: false },
  { key: 'diesel_50ppm', name: 'Diesel 50ppm', diesel: true },
  { key: 'diesel_500ppm', name: 'Diesel 500ppm', diesel: true },
];

export default function FillUpScreen() {
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const odometerRef = useRef<TextInput>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [vehicles, setVehicles] = useState<UserVehicleWithVehicle[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<UserVehicleWithVehicle | null>(null);
  const [fuelPrices, setFuelPrices] = useState<FuelPrice | null>(null);
  const [lastOdometer, setLastOdometer] = useState<number | null>(null);
  const [lastFillUp, setLastFillUp] = useState<FillUp | null>(null);

  // Form fields
  const [odometer, setOdometer] = useState<string>('');
  const [litres, setLitres] = useState<string>('');
  const [selectedFuel, setSelectedFuel] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [stationName, setStationName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's vehicles
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('user_vehicles')
        .select('*, vehicle:vehicles(*)')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (vehicleError) throw vehicleError;

      const vehiclesList = vehicleData as UserVehicleWithVehicle[];
      setVehicles(vehiclesList);

      // Get default/first vehicle
      const defaultVehicle = vehiclesList[0];
      setActiveVehicle(defaultVehicle || null);

      // Set selected fuel based on vehicle preference
      if (defaultVehicle?.selected_fuel_key) {
        setSelectedFuel(defaultVehicle.selected_fuel_key);
      } else if (defaultVehicle?.vehicle?.fuel_type === 'diesel') {
        setSelectedFuel('diesel_50ppm');
      } else {
        setSelectedFuel('unleaded_95');
      }

      // Get fuel prices (Gauteng Inland default)
      const { data: pricesData, error: pricesError } = await supabase
        .from('fuel_prices')
        .select('*')
        .eq('region', 'Gauteng Inland')
        .eq('is_current', true)
        .maybeSingle();

      if (pricesError) throw pricesError;
      setFuelPrices(pricesData);

      // Get last fill-up for this vehicle to show odometer hint
      if (defaultVehicle) {
        const { data: lastFillUpData, error: lastError } = await supabase
          .from('fill_ups')
          .select('*')
          .eq('user_vehicle_id', defaultVehicle.id)
          .order('logged_at', { ascending: false })
          .limit(1);

        if (!lastError && lastFillUpData?.[0]) {
          setLastOdometer(lastFillUpData[0].odometer_km);
          setLastFillUp(lastFillUpData[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  // Calculate live values
  const litresNum = parseFloat(litres) || 0;
  const odometerNum = parseInt(odometer) || 0;
  const pricePerLitre = fuelPrices && selectedFuel
    ? selectedFuel === 'unleaded_95'
      ? fuelPrices.unleaded_95
      : selectedFuel === 'unleaded_93'
        ? fuelPrices.unleaded_93
        : selectedFuel === 'diesel_50ppm'
          ? fuelPrices.diesel_50ppm
          : fuelPrices.diesel_ultra
    : 0;

  const fillUpCost = litresNum * pricePerLitre / 100;
  const distanceKm = lastOdometer && odometerNum > lastOdometer ? odometerNum - lastOdometer : null;
  const kmPerL = distanceKm && litresNum > 0 ? distanceKm / litresNum : null;

  const benchmarkInfo = kmPerL && activeVehicle?.vehicle?.official_km_per_l
    ? calculateBenchmarkDelta(kmPerL, activeVehicle.vehicle.official_km_per_l)
    : null;

  const costPerKm = distanceKm && fillUpCost > 0 ? fillUpCost / distanceKm : null;

  const handleSave = async () => {
    if (!user || !activeVehicle || !selectedFuel || litresNum <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const { error: insertError } = await supabase.from('fill_ups').insert({
        user_id: user.id,
        user_vehicle_id: activeVehicle.id,
        litres: litresNum,
        odometer_km: odometerNum > 0 ? odometerNum : null,
        fuel_key: selectedFuel,
        price_cents_per_litre: pricePerLitre,
        station_name: stationName || null,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const getFuelPrice = (key: string): number => {
    if (!fuelPrices) return 0;
    switch (key) {
      case 'unleaded_95': return fuelPrices.unleaded_95;
      case 'unleaded_93': return fuelPrices.unleaded_93;
      case 'diesel_50ppm': return fuelPrices.diesel_50ppm;
      case 'diesel_500ppm': return fuelPrices.diesel_ultra;
      default: return 0;
    }
  };

  if (loading) {
    return <LoadingState message="Loading..." />;
  }

  if (error && !activeVehicle) {
    return (
      <ErrorState
        message={error || 'No vehicle found. Add a vehicle first.'}
        onRetry={loadData}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Log Fill-up</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Active Vehicle */}
        {activeVehicle && (
          <View style={[styles.vehicleBadge, { backgroundColor: colors.primaryLight }]}>
            <Droplet size={16} color={colors.primary} />
            <Text style={[styles.vehicleBadgeText, { color: colors.primary }]}>
              {activeVehicle.nickname}
            </Text>
          </View>
        )}

        {/* Odometer Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Odometer (km)
          </Text>
          <View style={[styles.odometerInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <TextInput
              ref={odometerRef}
              style={[styles.odometerText, { color: colors.text }]}
              value={odometer}
              onChangeText={setOdometer}
              placeholder={lastOdometer ? `Last: ${lastOdometer.toLocaleString()} km` : 'Current reading'}
              placeholderTextColor={colors.textTertiary}
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
          {lastOdometer && (
            <Text style={[styles.hint, { color: colors.textTertiary }]}>
              Previous: {lastOdometer.toLocaleString()} km
            </Text>
          )}
        </View>

        {/* Litres Input */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Litres Pumped
          </Text>
          <View style={[styles.litresInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
            <TextInput
              style={[styles.litresText, { color: colors.text }]}
              value={litres}
              onChangeText={setLitres}
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Text style={[styles.litresSuffix, { color: colors.textSecondary }]}>L</Text>
          </View>

          {/* Quick-tap Presets */}
          <View style={styles.presets}>
            {LITRE_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  {
                    backgroundColor: litres === String(preset) ? colors.primary : colors.surfaceSecondary,
                    borderColor: litres === String(preset) ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setLitres(String(preset))}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: litres === String(preset) ? colors.textInverse : colors.text },
                  ]}
                >
                  {preset}L
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fuel Type Selector */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
            Fuel Type
          </Text>
          <View style={styles.fuelGrid}>
            {FUEL_TYPES.map((fuel) => {
              const price = getFuelPrice(fuel.key);
              const isSelected = selectedFuel === fuel.key;
              const isCompatible = !activeVehicle?.vehicle?.fuel_type ||
                (fuel.diesel && activeVehicle.vehicle.fuel_type === 'diesel') ||
                (!fuel.diesel && activeVehicle.vehicle.fuel_type === 'petrol');

              return (
                <TouchableOpacity
                  key={fuel.key}
                  style={[
                    styles.fuelType,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.card,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                    !isCompatible && styles.fuelTypeDisabled,
                  ]}
                  onPress={() => setSelectedFuel(fuel.key)}
                  disabled={!isCompatible}
                >
                  <Text
                    style={[
                      styles.fuelTypeName,
                      { color: isSelected ? colors.primary : colors.text },
                      !isCompatible && { color: colors.textTertiary },
                    ]}
                  >
                    {fuel.name}
                  </Text>
                  <Text
                    style={[
                      styles.fuelTypePrice,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                      !isCompatible && { color: colors.textTertiary },
                    ]}
                  >
                    {formatPrice(price)}/L
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Live Calculation Panel */}
        <Card style={[styles.calcCard as any, { backgroundColor: colors.primaryLight }]}>
          <View style={styles.calcHeader}>
            <Calculator size={20} color={colors.primary} />
            <Text style={[styles.calcTitle, { color: colors.primary }]}>
              Fill-up Summary
            </Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
              Total Cost
            </Text>
            <Text style={[styles.calcValue, { color: colors.text }]}>
              R{fillUpCost.toFixed(2)}
            </Text>
          </View>

          {kmPerL !== null && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
                Consumption (km/L)
              </Text>
              <View style={styles.calcValueWithBadge}>
                <Text style={[styles.calcValue, { color: colors.text }]}>
                  {formatKmPerL(kmPerL)}
                </Text>
                {benchmarkInfo && (
                  <BenchmarkBadge
                    status={benchmarkInfo.status}
                    percentage={benchmarkInfo.percentage}
                    label=""
                    size="small"
                    style={styles.inlineBadge}
                  />
                )}
              </View>
            </View>
          )}

          {costPerKm !== null && (
            <View style={styles.calcRow}>
              <Text style={[styles.calcLabel, { color: colors.textSecondary }]}>
                Cost per km
              </Text>
              <Text style={[styles.calcValue, { color: colors.text }]}>
                R{costPerKm.toFixed(2)}/km
              </Text>
            </View>
          )}

          {benchmarkInfo && (
            <View style={[styles.benchmarkBar, { backgroundColor: colors[benchmarkInfo.status === 'green' ? 'successLight' : benchmarkInfo.status === 'amber' ? 'warningLight' : 'errorLight'] }]}>
              <Text style={[styles.benchmarkText, { color: colors[benchmarkInfo.status === 'green' ? 'success' : benchmarkInfo.status === 'amber' ? 'warning' : 'error'] }]}>
                {benchmarkInfo.percentage >= 0 ? 'Excellent!' : benchmarkInfo.percentage >= -5 ? 'Within spec' : benchmarkInfo.percentage >= -15 ? 'Below spec' : 'Well below spec'}
                {' • '}
                {benchmarkInfo.percentage >= 0 ? '+' : ''}{benchmarkInfo.percentage.toFixed(1)}% vs manufacturer spec
              </Text>
            </View>
          )}
        </Card>

        {/* Optional Fields */}
        <TouchableOpacity
          style={styles.optionalHeader}
          onPress={() => setShowOptional(!showOptional)}
        >
          <Text style={[styles.optionalLabel, { color: colors.textSecondary }]}>
            Optional Details
          </Text>
          {showOptional ? (
            <ChevronUp size={20} color={colors.textTertiary} />
          ) : (
            <ChevronDown size={20} color={colors.textTertiary} />
          )}
        </TouchableOpacity>

        {showOptional && (
          <View style={styles.optionalFields}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Station Name (optional)
              </Text>
              <View style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                <TextInput
                  style={[styles.textInputText, { color: colors.text }]}
                  value={stationName}
                  onChangeText={setStationName}
                  placeholder="e.g., Engen Bryanston"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                Notes (optional)
              </Text>
              <View style={[styles.textInput, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
                <TextInput
                  style={[styles.textInputText, { color: colors.text }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any notes..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Button
          title="Save Fill-up"
          onPress={handleSave}
          loading={saving}
          disabled={litresNum <= 0 || !selectedFuel}
          style={styles.saveButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  vehicleBadgeText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  fieldGroup: {
    marginBottom: Spacing.xl,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.sm,
  },
  odometerInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  odometerText: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  hint: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  litresInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  litresText: {
    flex: 1,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
  litresSuffix: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
  },
  presets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  presetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  presetText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  fuelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  fuelType: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  fuelTypeDisabled: {
    opacity: 0.5,
  },
  fuelTypeName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  fuelTypePrice: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  calcCard: {
    marginBottom: Spacing.lg,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  calcTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calcLabel: {
    fontSize: FontSizes.md,
  },
  calcValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  calcValueWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inlineBadge: {
    marginLeft: Spacing.xs,
  },
  benchmarkBar: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  benchmarkText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    textAlign: 'center',
  },
  optionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  optionalLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  optionalFields: {
    marginBottom: Spacing.lg,
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
  errorBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 0.5,
  },
  saveButton: {
    // button styles applied via component
  },
});
