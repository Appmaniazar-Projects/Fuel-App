import { useColorScheme } from 'react-native';

export const Colors = {
  light: {
    primary: '#185FA5',
    primaryLight: '#E6F1FB',
    primaryDark: '#0D4A8C',
    secondary: '#6B7280',
    secondaryLight: '#F3F4F6',

    success: '#3B6D11',
    successLight: '#EAF3DE',
    successDark: '#2D530D',

    warning: '#854F0B',
    warningLight: '#FAEEDA',
    warningDark: '#663D08',

    error: '#A32D2D',
    errorLight: '#FCEBEB',
    errorDark: '#822323',

    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    border: '#E5E7EB',
    borderDark: '#D1D5DB',

    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',

    card: '#FFFFFF',
    cardBorder: '#E5E7EB',

    inputBg: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputBorderFocus: '#185FA5',

    tabActive: '#185FA5',
    tabInactive: '#9CA3AF',
  },
  dark: {
    primary: '#4A90D4',
    primaryLight: '#1A3A5C',
    primaryDark: '#0D4A8C',
    secondary: '#9CA3AF',
    secondaryLight: '#374151',

    success: '#4ADE36',
    successLight: '#1A2E14',
    successDark: '#3B6D11',

    warning: '#FBBF24',
    warningLight: '#422006',
    warningDark: '#854F0B',

    error: '#F87171',
    errorLight: '#450A0A',
    errorDark: '#A32D2D',

    background: '#111827',
    surface: '#1F2937',
    surfaceSecondary: '#374151',
    border: '#374151',
    borderDark: '#4B5563',

    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textInverse: '#111827',

    card: '#1F2937',
    cardBorder: '#374151',

    inputBg: '#374151',
    inputBorder: '#4B5563',
    inputBorderFocus: '#4A90D4',

    tabActive: '#4A90D4',
    tabInactive: '#6B7280',
  },
};

export type ColorScheme = typeof Colors.light;

export function useThemeColor() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  return colors;
}

export function useColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const Shadows = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const FuelTypes = {
  unleaded_93: { name: 'Unleaded 93', shortName: '93', key: 'unleaded_93' },
  unleaded_95: { name: 'Unleaded 95', shortName: '95', key: 'unleaded_95' },
  diesel_50ppm: { name: 'Diesel 50ppm', shortName: 'D50', key: 'diesel_50ppm' },
  diesel_500ppm: { name: 'Diesel 500ppm', shortName: 'D500', key: 'diesel_500ppm' },
} as const;

export const Regions = {
  gauteng: { name: 'Gauteng Inland', key: 'Gauteng Inland' },
  western_cape: { name: 'Western Cape Coastal', key: 'Western Cape Coastal' },
  kzn: { name: 'KZN Coastal', key: 'KZN Coastal' },
} as const;

export const StationBrands = {
  engen: { name: 'Engen', color: '#00A651', key: 'engen' },
  bp: { name: 'BP', color: '#00A651', key: 'bp' },
  shell: { name: 'Shell', color: '#FBCE07', key: 'shell' },
  sasol: { name: 'Sasol', color: '#E36F1E', key: 'sasol' },
  caltex: { name: 'Caltex', color: '#0066B3', key: 'caltex' },
  astron: { name: 'Astron', color: '#1E3A8A', key: 'astron' },
} as const;

export function formatPrice(cents: number): string {
  const rands = cents / 100;
  return `R${rands.toFixed(2)}`;
}

export function formatPriceChange(centsChange: number): string {
  const sign = centsChange >= 0 ? '+' : '';
  return `${sign}${centsChange}c`;
}

export function formatKmPerL(kmPerL: number | null | undefined): string {
  if (kmPerL === null || kmPerL === undefined) return '--';
  return `${kmPerL.toFixed(1)} km/L`;
}

export function formatLPer100km(lPer100km: number | null | undefined): string {
  if (lPer100km === null || lPer100km === undefined) return '--';
  return `${lPer100km.toFixed(1)} L/100km`;
}

export function calculateKmPerL(distanceKm: number, litres: number): number {
  if (litres <= 0) return 0;
  return distanceKm / litres;
}

export function calculateBenchmarkDelta(
  actualKmPerL: number,
  officialKmPerL: number
): { percentage: number; status: 'green' | 'amber' | 'red'; label: string } {
  const percentage = ((actualKmPerL - officialKmPerL) / officialKmPerL) * 100;

  if (percentage >= -5) {
    return {
      percentage,
      status: 'green',
      label: percentage >= 0 ? 'Above spec' : 'Within spec',
    };
  } else if (percentage >= -15) {
    return {
      percentage,
      status: 'amber',
      label: 'Below spec',
    };
  } else {
    return {
      percentage,
      status: 'red',
      label: 'Well below spec',
    };
  }
}
