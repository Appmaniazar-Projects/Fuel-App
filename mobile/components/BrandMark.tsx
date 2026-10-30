import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Rect, Path, G } from 'react-native-svg';

const DROP = 'M50 12 C50 12 22 44 22 63 A28 28 0 0 0 78 63 C78 44 50 12 50 12 Z';

/**
 * FuelWise logo: a fuel droplet with a rising price line on a blue tile.
 * Same artwork as the app icon and favicon (see assets/images).
 */
export function BrandMark({ size = 40, tile = true }: { size?: number; tile?: boolean }) {
  const scale = tile ? 0.82 : 1;
  const offset = 50 - 50 * scale;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="FuelWise">
      {tile && (
        <>
          <Defs>
            <LinearGradient id="fwTile" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#2E86DE" />
              <Stop offset="1" stopColor="#0D4A8C" />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" rx="22" fill="url(#fwTile)" />
        </>
      )}
      <G transform={`translate(${offset} ${offset + 1}) scale(${scale})`}>
        <Path d={DROP} fill={tile ? '#FFFFFF' : '#185FA5'} />
        <Path
          d="M35 68 L45 58 L53 64 L65 51 M57 50 L66 50 L66 59"
          fill="none"
          stroke={tile ? '#185FA5' : '#FFFFFF'}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
}
