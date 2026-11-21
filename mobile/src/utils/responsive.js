export const TABLET_MIN_SHORT_SIDE = 600;
export const WIDE_MIN_WIDTH = 700;

/**
 * Tính toán các thông số responsive thuần từ kích thước cửa sổ hiện tại.
 */
export function computeResponsiveMetrics(width, height) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 375;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 812;

  const shortSide = Math.min(safeWidth, safeHeight);
  const longSide = Math.max(safeWidth, safeHeight);
  const isLandscape = safeWidth > safeHeight;
  const isTablet = shortSide >= TABLET_MIN_SHORT_SIDE;
  const isWide = safeWidth >= WIDE_MIN_WIDTH;
  const isCompactHeight = isLandscape && !isTablet;

  const contentMaxWidth = isTablet ? 760 : isWide ? 640 : safeWidth;
  const formMaxWidth = isTablet || isWide ? 480 : safeWidth;
  const modalMaxWidth = Math.min(
    safeWidth * 0.92,
    isTablet ? 520 : isLandscape ? 480 : safeWidth * 0.92
  );

  const mediaColumns =
    safeWidth >= 1000 ? 6 : safeWidth >= 768 ? 5 : safeWidth >= 560 ? 4 : 3;
  const contactColumns = isWide ? 2 : 1;
  const callGridColumns = isTablet || isLandscape ? (safeWidth >= 900 ? 4 : 3) : 2;
  const emojiColumns = safeWidth >= 768 ? 12 : isLandscape ? 10 : 8;
  const stickerColumns = safeWidth >= 768 ? 6 : isLandscape ? 5 : 4;
  const gifColumns = safeWidth >= 768 ? 4 : isLandscape ? 3 : 2;

  const tabBarMaxWidth = isTablet ? 520 : isWide ? 500 : safeWidth - 32;
  const tabBarWidth = Math.min(safeWidth - 32, tabBarMaxWidth);

  return {
    width: safeWidth,
    height: safeHeight,
    shortSide,
    longSide,
    isLandscape,
    isTablet,
    isWide,
    isCompactHeight,
    contentMaxWidth,
    formMaxWidth,
    modalMaxWidth,
    mediaColumns,
    contactColumns,
    callGridColumns,
    emojiColumns,
    stickerColumns,
    gifColumns,
    tabBarWidth,
  };
}
