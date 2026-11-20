export const TRANSLATION_LANGUAGES = [
  { code: 'vie_Latn', label: 'Tiếng Việt', flag: '🇻🇳', i18nCode: 'vi' },
  { code: 'eng_Latn', label: 'English', flag: '🇬🇧', i18nCode: 'en' },
  { code: 'zho_Hans', label: '中文', flag: '🇨🇳', i18nCode: 'zh' },
  { code: 'jpn_Jpan', label: '日本語', flag: '🇯🇵', i18nCode: 'ja' },
  { code: 'kor_Hang', label: '한국어', flag: '🇰🇷', i18nCode: 'ko' },
  { code: 'fra_Latn', label: 'Français', flag: '🇫🇷', i18nCode: 'fr' },
];

export const LANGUAGE_MAP = {
  vie_Latn: 'vi',
  eng_Latn: 'en',
  zho_Hans: 'zh',
  jpn_Jpan: 'ja',
  kor_Hang: 'ko',
  fra_Latn: 'fr',
};

export const normalizePreferredLanguage = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
};

export const getLanguageOption = (code) => {
  const normalized = normalizePreferredLanguage(code);
  if (!normalized) return null;
  return TRANSLATION_LANGUAGES.find((item) => item.code === normalized) || null;
};

const VIETNAMESE_CHAR_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
const JAPANESE_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF]/;
const KOREAN_CHAR_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF]/;
const CJK_CHAR_REGEX = /[\u4E00-\u9FFF]/;
const FRENCH_ACCENT_REGEX = /[àâçéèêëîïôûùüÿœæÀÂÇÉÈÊËÎÏÔÛÙÜŸŒÆ]/;

export const detectMessageLanguage = (text, fallbackLang, targetLang) => {
  const content = typeof text === 'string' ? text.trim() : '';
  if (content) {
    if (JAPANESE_CHAR_REGEX.test(content)) return 'jpn_Jpan';
    if (KOREAN_CHAR_REGEX.test(content)) return 'kor_Hang';
    if (CJK_CHAR_REGEX.test(content)) return 'zho_Hans';
    if (VIETNAMESE_CHAR_REGEX.test(content)) return 'vie_Latn';
    if (FRENCH_ACCENT_REGEX.test(content)) return 'fra_Latn';
    if (/^[\x00-\x7F]+$/.test(content)) {
      if (fallbackLang && fallbackLang !== targetLang) return fallbackLang;
      return targetLang === 'eng_Latn' ? 'vie_Latn' : 'eng_Latn';
    }
  }
  if (fallbackLang && fallbackLang !== targetLang) return fallbackLang;
  return targetLang === 'vie_Latn' ? 'eng_Latn' : 'vie_Latn';
};
