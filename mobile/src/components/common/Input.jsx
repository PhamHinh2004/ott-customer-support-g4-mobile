import React, { useState } from 'react';
import { Input as TamaguiInput, Text, XStack, YStack } from 'tamagui';

export function AppInput({
  label,
  error,
  leftIcon,
  rightElement,
  containerProps,
  wrapperProps,
  labelProps,
  darkSurface = false,
  ...inputProps
}) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? '#ef4444'
    : focused
      ? 'rgba(99, 102, 241, 0.7)'
      : darkSurface
        ? 'rgba(255, 255, 255, 0.1)'
        : 'border-color';

  const backgroundColor = darkSurface
    ? focused
      ? 'rgba(22, 15, 38, 0.55)'
      : 'rgba(22, 15, 38, 0.32)'
    : 'background';

  return (
    <YStack gap="2" {...containerProps}>
      {label ? (
        <Text
          fontSize={12}
          fontWeight="700"
          color={darkSurface ? '#94a3b8' : 'color'}
          textTransform="uppercase"
          letterSpacing={1}
          marginLeft="1"
          {...labelProps}
        >
          {label}
        </Text>
      ) : null}

      <XStack
        alignItems="center"
        height={54}
        paddingHorizontal="3-5"
        borderRadius={16}
        borderWidth={1}
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        gap="2-5"
        {...wrapperProps}
      >
        {leftIcon}
        <TamaguiInput
          flex={1}
          unstyled
          borderWidth={0}
          borderRadius={0}
          paddingHorizontal={0}
          paddingVertical={0}
          backgroundColor="transparent"
          fontSize={15}
          color={darkSurface ? '#f8fafc' : 'color'}
          placeholderTextColor={darkSurface ? '#64748b' : 'placeholder-color'}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />
        {rightElement}
      </XStack>

      {error ? (
        <Text fontSize={12} fontWeight="600" color="#ef4444" marginLeft="1">
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}

export default AppInput;

