import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { buildStationsMapHtml, type MapPrice } from './stationsMapHtml';
import type { Station } from '@/lib/stations';

interface Props {
  user: { latitude: number; longitude: number };
  stations: Station[];
  prices: MapPrice[];
  dark: boolean;
  height?: number;
}

/** Web: the same Leaflet map in an iframe (react-native-webview has no web build). */
export function StationsMap({ user, stations, prices, dark, height = 320 }: Props) {
  const html = useMemo(
    () => buildStationsMapHtml({ user, stations, prices, dark }),
    [user, stations, prices, dark]
  );
  return (
    <View style={[styles.wrap, { height }]}>
      {React.createElement('iframe', {
        srcDoc: html,
        title: 'Nearby fuel stations map',
        style: { border: 0, width: '100%', height: '100%' },
        sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
});
