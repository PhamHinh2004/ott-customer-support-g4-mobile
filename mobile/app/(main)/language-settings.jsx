import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import axiosClient from '../../src/api/axiosClient';
import { updateUser } from '../../src/store/authSlice';
import {
  TRANSLATION_LANGUAGES,
  LANGUAGE_MAP,
  normalizePreferredLanguage,
} from '../../src/utils/languageConfig';

const LanguageSettingsScreen = () => {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  const [selectedLanguage, setSelectedLanguage] = useState(
    normalizePreferredLanguage(user?.preferredLanguage)
  );
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchLanguageSettings = useCallback(async () => {
    setFetching(true);
    try {
      const res = await axiosClient.get('/settings/language');
      const rawLang = res?.data?.preferredLanguage ?? res?.preferredLanguage;
      const normalized = normalizePreferredLanguage(rawLang);

      setSelectedLanguage(normalized);
      dispatch(updateUser({ preferredLanguage: normalized }));
    } catch (err) {
      if (err?.response?.status !== 401) {
        console.error('Failed to fetch language settings', err);
      }
      setSelectedLanguage(normalizePreferredLanguage(user?.preferredLanguage));
    } finally {
      setFetching(false);
    }
  }, [dispatch, user?.preferredLanguage]);

  useFocusEffect(
    useCallback(() => {
      fetchLanguageSettings();
    }, [fetchLanguageSettings])
  );

  const handleUpdateLanguage = async (code) => {
    if (loading) return;
    const previousLanguage = selectedLanguage;
    setSelectedLanguage(code);
    setLoading(true);
    try {
      await axiosClient.put('/settings/language', { preferredLanguage: code });
      dispatch(updateUser({ preferredLanguage: code }));

      const i18nCode = LANGUAGE_MAP[code] || 'en';
      i18n.changeLanguage(i18nCode);
    } catch (error) {
      setSelectedLanguage(previousLanguage);
      console.error('Failed to update language', error);
      if (error?.response?.status !== 401) {
        Alert.alert(
          t('common.error') || 'Lỗi',
          error?.response?.data?.message || error?.message || 'Không thể cập nhật ngôn ngữ dịch.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTranslation = async () => {
    if (loading) return;
    const previousLanguage = selectedLanguage;
    setSelectedLanguage(null);
    setLoading(true);
    try {
      await axiosClient.put('/settings/language', { preferredLanguage: null });
      dispatch(updateUser({ preferredLanguage: null }));
    } catch (error) {
      setSelectedLanguage(previousLanguage);
      console.error('Failed to disable translation', error);
      if (error?.response?.status !== 401) {
        Alert.alert(
          t('common.error') || 'Lỗi',
          error?.response?.data?.message || error?.message || 'Không thể tắt tự động dịch.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surface300 : '#f1f5f9' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('settings.language_title')}
        </Text>
        <View style={{ width: 42, alignItems: 'center', justifyContent: 'center' }}>
          {(loading || fetching) && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={[styles.hintText, { color: colors.textSubtle }]}>
            {t('settings.auto_translate_msg')}
          </Text>

          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {/* Disable translation option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDisableTranslation}
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.surface300 : '#f1f5f9' }]}>
                  <Text style={{ fontSize: 18 }}>🚫</Text>
                </View>
                <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                  {t('settings.disable_auto_translate')}
                </Text>
              </View>
              {!selectedLanguage && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            {/* Language list */}
            {TRANSLATION_LANGUAGES.map((lang, index) => (
              <React.Fragment key={lang.code}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleUpdateLanguage(lang.code)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.surface300 : '#f1f5f9' }]}>
                      <Text style={{ fontSize: 18 }}>{lang.flag}</Text>
                    </View>
                    <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                      {lang.label}
                    </Text>
                  </View>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
                {index < TRANSLATION_LANGUAGES.length - 1 && (
                  <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  section: { paddingHorizontal: 20, marginTop: 20 },
  hintText: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  menuCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 30 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  menuItemText: { fontSize: 16, fontWeight: '500' },
  menuDivider: { height: 1, marginHorizontal: 16 },
});

export default LanguageSettingsScreen;
