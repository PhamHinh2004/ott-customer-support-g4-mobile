import { describe, expect, it } from 'vitest';
import { computeResponsiveMetrics } from './responsive';

describe('computeResponsiveMetrics', () => {
  it('detects portrait phone dimensions correctly', () => {
    const m = computeResponsiveMetrics(390, 844);
    expect(m.isLandscape).toBe(false);
    expect(m.isTablet).toBe(false);
    expect(m.isWide).toBe(false);
    expect(m.isCompactHeight).toBe(false);
    expect(m.mediaColumns).toBe(3);
    expect(m.contactColumns).toBe(1);
    expect(m.callGridColumns).toBe(2);
    expect(m.tabBarWidth).toBe(358);
  });

  it('detects landscape phone dimensions and adapts grid/tab bar without misidentifying as tablet', () => {
    const m = computeResponsiveMetrics(844, 390);
    expect(m.isLandscape).toBe(true);
    expect(m.isTablet).toBe(false);
    expect(m.isWide).toBe(true);
    expect(m.isCompactHeight).toBe(true);
    expect(m.formMaxWidth).toBe(480);
    expect(m.mediaColumns).toBe(5);
    expect(m.contactColumns).toBe(2);
    expect(m.callGridColumns).toBe(3);
    expect(m.emojiColumns).toBe(12);
    expect(m.tabBarWidth).toBe(500);
  });

  it('detects portrait tablet / iPad dimensions', () => {
    const m = computeResponsiveMetrics(768, 1024);
    expect(m.isLandscape).toBe(false);
    expect(m.isTablet).toBe(true);
    expect(m.isWide).toBe(true);
    expect(m.contentMaxWidth).toBe(760);
    expect(m.formMaxWidth).toBe(480);
    expect(m.modalMaxWidth).toBe(520);
    expect(m.mediaColumns).toBe(5);
    expect(m.contactColumns).toBe(2);
    expect(m.tabBarWidth).toBe(520);
  });

  it('detects landscape iPad Pro dimensions', () => {
    const m = computeResponsiveMetrics(1366, 1024);
    expect(m.isLandscape).toBe(true);
    expect(m.isTablet).toBe(true);
    expect(m.isWide).toBe(true);
    expect(m.mediaColumns).toBe(6);
    expect(m.callGridColumns).toBe(4);
    expect(m.tabBarWidth).toBe(520);
  });
});
