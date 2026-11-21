import React from 'react';
import { YStack } from 'tamagui';
import { useResponsive } from '../../hooks/useResponsive';

export function ResponsiveContainer({
  children,
  maxWidth,
  variant = 'content',
  ...props
}) {
  const { contentMaxWidth, formMaxWidth } = useResponsive();
  const resolvedMaxWidth =
    maxWidth ?? (variant === 'form' ? formMaxWidth : contentMaxWidth);

  return (
    <YStack
      width="100%"
      maxWidth={resolvedMaxWidth}
      alignSelf="center"
      {...props}
    >
      {children}
    </YStack>
  );
}

export default ResponsiveContainer;
