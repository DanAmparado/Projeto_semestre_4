import React from 'react';
import { Image, View } from 'react-native';

const full = require('../../assets/images/logo.png');
const icon = require('../../assets/images/logo-icon.png');

export default function Logo({ size = 120, showName = true }: { size?: number; showName?: boolean }) {
  const src = showName ? full : icon;
  const { width, height } = Image.resolveAssetSource(src);

  return (
    <View style={{ alignItems: 'center' }}>
      <Image source={src} style={{ width: size, height: size * (height / width) }} resizeMode="contain" />
    </View>
  );
}