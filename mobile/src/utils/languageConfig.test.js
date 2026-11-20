import { describe, expect, it } from 'vitest';
import {
  detectMessageLanguage,
  getLanguageOption,
  normalizePreferredLanguage,
} from './languageConfig';

describe('languageConfig helpers', () => {
  it('normalizes empty and null-like preferredLanguage values to null', () => {
    expect(normalizePreferredLanguage('')).toBeNull();
    expect(normalizePreferredLanguage('   ')).toBeNull();
    expect(normalizePreferredLanguage('null')).toBeNull();
    expect(normalizePreferredLanguage(undefined)).toBeNull();
    expect(normalizePreferredLanguage('eng_Latn')).toBe('eng_Latn');
  });

  it('finds matching language metadata option', () => {
    expect(getLanguageOption('vie_Latn')?.label).toBe('Tiếng Việt');
    expect(getLanguageOption('')).toBeNull();
  });

  it('detects source language distinct from target when message language is missing or mismatched', () => {
    expect(detectMessageLanguage('Hello, how are you?', 'vie_Latn', 'vie_Latn')).toBe('eng_Latn');
    expect(detectMessageLanguage('Xin chào bạn khỏe không?', 'vie_Latn', 'eng_Latn')).toBe('vie_Latn');
    expect(detectMessageLanguage('こんにちは', null, 'vie_Latn')).toBe('jpn_Jpan');
    expect(detectMessageLanguage('안녕하세요', null, 'vie_Latn')).toBe('kor_Hang');
  });
});
