import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { AppInput } from '@/components/AppInput';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useColors, Spacing, FontSizes, FontWeights, BorderRadius } from '@/lib/theme';
import type { Vehicle } from '@/types/database';

interface Props {
  userId: string;
  initialText?: string;
  onCreated: (vehicle: Vehicle) => void;
  onCancel: () => void;
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              {
                backgroundColor: active ? colors.primary : colors.surfaceSecondary,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.segmentText, { color: active ? colors.textInverse : colors.text }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Lets a user add a car that isn't in the catalogue. Only they can see it. */
export function CustomVehicleForm({ userId, initialText, onCreated, onCancel }: Props) {
  const colors = useColors();
  const words = (initialText || '').trim().split(/\s+/);
  const [make, setMake] = useState(words.length > 1 ? words[0] : '');
  const [model, setModel] = useState(words.length > 1 ? words.slice(1).join(' ') : words[0] || '');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [transmission, setTransmission] = useState<'manual' | 'automatic'>('manual');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const yearNum = parseInt(year, 10);
    const thisYear = new Date().getFullYear();
    if (!make.trim() || !model.trim()) {
      setError('Enter the make and model.');
      return;
    }
    if (year && (isNaN(yearNum) || yearNum < 1960 || yearNum > thisYear + 1)) {
      setError(`Enter a year between 1960 and ${thisYear + 1}.`);
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from('vehicles')
      .insert({
        make: make.trim(),
        model: model.trim(),
        variant: year ? `${yearNum}` : null,
        year_from: year ? yearNum : null,
        year_to: year ? yearNum : null,
        fuel_type: fuelType,
        transmission,
        created_by: userId,
      })
      .select()
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError(insertError?.message || 'Could not add your car.');
      return;
    }
    onCreated(data as Vehicle);
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.title, { color: colors.text }]}>Add your car</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Fuel tracking works for any car. Without an official consumption figure, we just won&apos;t
        show the &quot;vs spec&quot; comparison.
      </Text>

      <AppInput label="Make" value={make} onChangeText={setMake} placeholder="e.g. Volkswagen" containerStyle={styles.field} />
      <AppInput label="Model" value={model} onChangeText={setModel} placeholder="e.g. Citi Golf 1.4i" containerStyle={styles.field} />
      <AppInput
        label="Year (optional)"
        value={year}
        onChangeText={(t) => setYear(t.replace(/[^0-9]/g, '').slice(0, 4))}
        placeholder="e.g. 2008"
        keyboardType="number-pad"
        containerStyle={styles.field}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Fuel</Text>
      <Segmented
        options={[{ value: 'petrol', label: 'Petrol' }, { value: 'diesel', label: 'Diesel' }]}
        value={fuelType}
        onChange={setFuelType}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Gearbox</Text>
      <Segmented
        options={[{ value: 'manual', label: 'Manual' }, { value: 'automatic', label: 'Automatic' }]}
        value={transmission}
        onChange={setTransmission}
      />

      {error && <Text style={[styles.error, { color: colors.error }]}>{error}</Text>}

      <View style={styles.actions}>
        <Button title="Cancel" variant="ghost" onPress={onCancel} style={styles.action} />
        <Button title="Continue" onPress={save} loading={saving} style={styles.action} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, marginTop: Spacing.md },
  title: { fontSize: FontSizes.lg, fontWeight: FontWeights.semibold },
  subtitle: { fontSize: FontSizes.sm, marginTop: Spacing.xs, marginBottom: Spacing.lg, lineHeight: 20 },
  field: { marginBottom: Spacing.md },
  label: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  segmented: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  segmentText: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium },
  error: { fontSize: FontSizes.sm, marginBottom: Spacing.md },
  actions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  action: { flex: 1 },
});
