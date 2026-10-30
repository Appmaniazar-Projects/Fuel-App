import React, { useMemo } from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { buildStationsMapHtml, type MapPrice } from './stationsMapHtml';
import type { Station } from '@/lib/stations';

interface Props {
  user: { latitude: number; longitude: number };
  stations: Station[];
  prices: MapPrice[];
  dark: boolean;
  height?: number;
}

/** Native (iOS/Android): Leaflet map in a WebView. */
export function StationsMap({ user, stations, prices, dark, height = 320 }: Props) {
  const html = useMemo(
    () => buildStationsMapHtml({ user, stations, prices, dark }),
    [user, stations, prices, dark]
  );
  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.map}
        // Open "Directions" links in the maps app / browser, not inside the map
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith('http') && !req.url.includes('tile.openstreetmap') && !req.url.includes('unpkg.com')) {
            Linking.openURL(req.url);
            return false;
          }
          return true;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
});
