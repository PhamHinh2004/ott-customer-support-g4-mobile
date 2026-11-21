import React from 'react';
import { Button as TamaguiButton, Spinner, Text, XStack } from 'tamagui';

const VARIANT_STYLES = {
  primary: {
    bg: '#6366f1',
    color: '#ffffff',
    borderColor: 'transparent',
  },
  light: {
    bg: '#ffffff',
    color: '#0c0714',
    borderColor: 'transparent',
  },
  secondary: {
    bg: 'background-hover',
    color: 'color',
    borderColor: 'border-color',
  },
  danger: {
    bg: '#ef4444',
    color: '#ffffff',
    borderColor: 'transparent',
  },
  outline: {
    bg: 'transparent',
    color: '#6366f1',
    borderColor: '#6366f1',
  },
};

export function AppButton({
  title,
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon = null,
  height = 52,
  borderRadius = 18,
  textStyle,
  ...props
}) {
  const palette = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const isDisabled = disabled || loading;

  return (
    <TamaguiButton
      height={height}
      borderRadius={borderRadius}
      backgroundColor={palette.bg}
      borderWidth={palette.borderColor !== 'transparent' ? 1 : 0}
      borderColor={palette.borderColor}
      opacity={isDisabled ? 0.55 : 'press:0.85'}
      scale="press:0.98"
      disabled={isDisabled}
      transition="quick"
      alignItems="center"
      justifyContent="center"
      paddingHorizontal="4"
      {...props}
    >
      {loading ? (
        <Spinner size="small" color={palette.color} />
      ) : children ? (
        children
      ) : (
        <XStack alignItems="center" justifyContent="center" gap="2">
          {icon}
          <Text
            color={palette.color}
            fontWeight="800"
            fontSize={15}
            letterSpacing={0.5}
            style={textStyle}
          >
            {title}
          </Text>
        </XStack>
      )}
    </TamaguiButton>
  );
}

export default AppButton;

