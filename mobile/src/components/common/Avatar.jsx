import React from 'react';
import { Avatar as TamaguiAvatar, Text, View } from 'tamagui';

export function AppAvatar({
  uri,
  name = 'U',
  size = 48,
  isOnline = false,
  borderColor = '#ffffff',
}) {
  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';
  const dotSize = Math.max(10, Math.round(size * 0.24));

  return (
    <View position="relative" width={size} height={size}>
      <TamaguiAvatar circular size={size}>
        {uri ? <TamaguiAvatar.Image source={{ uri }} /> : null}
        <TamaguiAvatar.Fallback
          backgroundColor="#6366f1"
          alignItems="center"
          justifyContent="center"
        >
          <Text color="#ffffff" fontWeight="800" fontSize={Math.round(size * 0.4)}>
            {initial}
          </Text>
        </TamaguiAvatar.Fallback>
      </TamaguiAvatar>

      {isOnline ? (
        <View
          position="absolute"
          right={0}
          bottom={0}
          width={dotSize}
          height={dotSize}
          borderRadius={dotSize / 2}
          backgroundColor="#10b981"
          borderWidth={2}
          borderColor={borderColor}
        />
      ) : null}
    </View>
  );
}

export default AppAvatar;

