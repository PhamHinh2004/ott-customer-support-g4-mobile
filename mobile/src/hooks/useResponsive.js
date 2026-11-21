import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  TABLET_MIN_SHORT_SIDE,
  WIDE_MIN_WIDTH,
  computeResponsiveMetrics,
} from '../utils/responsive';

export { TABLET_MIN_SHORT_SIDE, WIDE_MIN_WIDTH, computeResponsiveMetrics };

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => computeResponsiveMetrics(width, height),
    [width, height]
  );
}

export default useResponsive;
