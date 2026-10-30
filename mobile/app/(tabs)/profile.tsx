import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LogOut, MapPin, Car, History, TrendingUp, ChevronRight, Check, Info } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHomeRegion } from '@/lib/useHomeRegion';
import { type PriceRegion } from '@/lib/regions';
import { showError } from '@/lib/confirm';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { BrandMark } from '@/components/BrandMark';
import { useColors, Spacing, FontSizes, FontWeights } from '@/lib/theme';

interface Stats {
  vehicles: number;
  fillUps: number;
  litres: number;
  spentRands: number;
}

const REGION_OPTIONS: { value: PriceRegion; title: string; detail: string }[] = [
  { value: 'coastal', title: 'Coastal', detail: 'Western Cape, Eastern Cape and KZN coast' },
  { value: 'inland', title: 'Inland', detail: 'Gauteng and the rest of the interior' },
];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { region, setRegion } = useHomeRegion();
  const [stats, setStats] = useState<Stats | null>(null);
  const [savingRegion, setSavingRegion] = useState<PriceRegion | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      Promise.all([
        supabase.from('user_vehicles').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('fill_ups').select('litres, price_cents_per_litre').eq('user_id', user.id),
      ]).then(([vehiclesRes, fillUpsRes]) => {
        const rows = fillUpsRes.data || [];
        setStats({
          vehicles: vehiclesRes.count || 0,
          fillUps: rows.length,
          litres: rows.reduce((sum, r) => sum + Number(r.litres || 0), 0),
          spentRands: rows.reduce((sum, r) => sum + (Number(r.litres || 0) * (r.price_cents_per_litre || 0)) / 100, 0),
        });
      });
    }, [user])
  );

  const chooseRegion = async (next: PriceRegion) => {
    if (next === region) return;
    setSavingRegion(next);
    try {
      await setRegion(next);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Could not save your region.');
    } finally {
      setSavingRegion(null);
    }
  };

  if (!user) return null;

  const email = user.email || '';
  const memberSince = new Date(user.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  const links = [
    { icon: Car, label: 'My Garage', onPress: () => router.push('/garage') },
    { icon: History, label: 'Fill-up History', onPress: () => router.push('/fill-up-history') },
    { icon: TrendingUp, label: 'Price History', onPress: () => router.push('/price-history') },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text style={styles.avatarText}>{(email[0] || '?').toUpperCase()}</Text>
        </View>
        <Text style={styles.email} numberOfLines={1}>{email}</Text>
        <Text style={styles.memberSince}>Member since {memberSince}</Text>
      </View>

      {/* Stats */}
      <Card style={styles.statsCard}>
        {stats ? (
          <View style={styles.statsRow}>
            {[
              { label: 'Vehicles', value: String(stats.vehicles) },
              { label: 'Fill-ups', value: String(stats.fillUps) },
              { label: 'Litres', value: stats.litres.toFixed(0) },
              { label: 'Spent', value: `R${Math.round(stats.spentRands).toLocaleString('en-ZA')}` },
            ].map((s) => (
              <View key={s.label} style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Card>

      {/* Home region */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HOME REGION</Text>
      <Card style={styles.card}>
        {REGION_OPTIONS.map((opt, i) => {
          const active = opt.value === region;
          return (
            <Pressable
              key={opt.value}
              onPress={() => chooseRegion(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.optionRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
            >
              <MapPin size={20} color={active ? colors.primary : colors.textTertiary} />
              <View style={styles.optionText}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>{opt.title}</Text>
                <Text style={[styles.optionDetail, { color: colors.textSecondary }]}>{opt.detail}</Text>
              </View>
              {savingRegion === opt.value ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                active && <Check size={20} color={colors.primary} />
              )}
            </Pressable>
          );
        })}
      </Card>
      <View style={styles.note}>
        <Info size={14} color={colors.textTertiary} />
        <Text style={[styles.noteText, { color: colors.textTertiary }]}>
          Used for your dashboard prices and to cost your fill-ups.
        </Text>
      </View>

      {/* Shortcuts */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SHORTCUTS</Text>
      <Card style={styles.card}>
        {links.map(({ icon: Icon, label, onPress }, i) => (
          <Pressable
            key={label}
            onPress={onPress}
            style={[styles.optionRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
          >
            <Icon size={20} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.text }]}>{label}</Text>
            <ChevronRight size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </Card>

      <Button
        title="Sign Out"
        onPress={signOut}
        variant="outline"
        icon={<LogOut size={18} color={colors.textSecondary} />}
        style={styles.signOut}
      />

      <View style={styles.footer}>
        <BrandMark size={28} />
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          FuelWise · Prices from FIASA · Station data © OpenStreetMap
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: Spacing.xxxl },
  hero: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#FFFFFF', fontSize: 30, fontWeight: FontWeights.bold },
  email: { color: '#FFFFFF', fontSize: FontSizes.lg, fontWeight: FontWeights.semibold, marginTop: Spacing.md },
  memberSince: { color: 'rgba(255,255,255,0.8)', fontSize: FontSizes.sm, marginTop: 2 },
  statsCard: { marginHorizontal: Spacing.lg, marginTop: -32, padding: Spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  statLabel: { fontSize: FontSizes.xs, marginTop: 2 },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.lg + 4,
  },
  card: { marginHorizontal: Spacing.lg, paddingVertical: 0, paddingHorizontal: Spacing.lg },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  optionText: { flex: 1 },
  optionTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.medium },
  optionDetail: { fontSize: FontSizes.xs, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: Spacing.lg + 4, marginTop: Spacing.sm },
  noteText: { fontSize: FontSizes.xs, flex: 1 },
  linkText: { flex: 1, fontSize: FontSizes.md },
  signOut: { marginHorizontal: Spacing.lg, marginTop: Spacing.xl },
  footer: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  footerText: { fontSize: FontSizes.xs, textAlign: 'center' },
});
