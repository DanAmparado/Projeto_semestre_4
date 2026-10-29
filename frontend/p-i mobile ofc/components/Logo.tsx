import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { colors } from '../theme';

export default function Logo({ size = 120, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size * 0.8} viewBox="0 0 200 160">
        <Path
          d="M60 20 C90 -5 130 5 140 35 C170 30 195 55 180 85 C195 115 165 140 130 135 C110 155 70 150 60 125 C30 130 5 100 20 75 C5 45 30 20 60 20 Z"
          fill={colors.primary}
        />
        <SvgText x="100" y="98" fontSize="74" fontWeight="bold" fill="#fff" textAnchor="middle">
          No
        </SvgText>
      </Svg>
      {showName && (
        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: size * 0.14, marginTop: 4 }}>
          NOSSO SANGUE
        </Text>
      )}
    </View>
  );
}
