import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/context/ThemeContext';
import { getLanguageOption } from '../../src/utils/languageConfig';
import { YStack, XStack, Card, Separator, Text as TText } from 'tamagui';
import ResponsiveContainer from '../../src/components/common/ResponsiveContainer';

const SettingsScreen = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const user = useSelector((state) => state.auth.user);
  const currentLangOption = getLanguageOption(user?.preferredLanguage);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? colors.surface300 : '#f1f5f9' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <TText fontSize={18} fontWeight="700" color={colors.foreground}>{t('settings.title')}</TText>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <ResponsiveContainer>
          {/* ====== APPEARANCE ====== */}
          <YStack paddingHorizontal={20} marginTop={25}>
            <XStack alignItems="center" marginBottom={10} marginLeft={4}>
              <Ionicons name="color-palette-outline" size={20} color={colors.textSubtle} />
              <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginLeft: 6 }]}>{t('settings.appearance')}</Text>
            </XStack>
            <Card backgroundColor={colors.card} borderRadius={16} overflow="hidden" padded={false}>
              <XStack alignItems="center" justifyContent="space-between" padding={16}>
                <XStack alignItems="center">
                  <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={isDark ? '#fbbf24' : '#f59e0b'} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{isDark ? t('chat.tooltip_light_mode') : t('chat.tooltip_dark_mode')}</Text>
                </XStack>
                <Switch
                  value={isDark} onValueChange={toggleTheme}
                  trackColor={{ false: '#d1d5db', true: '#818cf8' }}
                  thumbColor={isDark ? '#6366f1' : '#f9fafb'}
                  ios_backgroundColor="#d1d5db"
                />
              </XStack>

              <Separator borderColor={colors.border} marginHorizontal={16} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(main)/language-settings')}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="language-outline" size={20} color="#3b82f6" />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.language_title')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 13, color: colors.textSubtle }}>
                    {currentLangOption ? `${currentLangOption.flag} ${currentLangOption.label}` : t('settings.disable_auto_translate')}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSubtle} />
                </View>
              </TouchableOpacity>
            </Card>
          </YStack>

          {/* ====== NOTIFICATIONS ====== */}
          <YStack paddingHorizontal={20} marginTop={25}>
            <XStack alignItems="center" marginBottom={10} marginLeft={4}>
              <Ionicons name="notifications-outline" size={20} color={colors.textSubtle} />
              <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginLeft: 6 }]}>{t('settings.notifications')}</Text>
            </XStack>
            <Card backgroundColor={colors.card} borderRadius={16} overflow="hidden" padded={false}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.message_notifications')}</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#d1d5db', true: '#818cf8' }} thumbColor="#6366f1" ios_backgroundColor="#d1d5db" />
              </View>
              <Separator borderColor={colors.border} marginHorizontal={16} />
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.sounds')}</Text>
                </View>
                <Switch value={true} trackColor={{ false: '#d1d5db', true: '#818cf8' }} thumbColor="#6366f1" ios_backgroundColor="#d1d5db" />
              </View>
            </Card>
          </YStack>

          {/* ====== DATA ====== */}
          <YStack paddingHorizontal={20} marginTop={25}>
            <XStack alignItems="center" marginBottom={10} marginLeft={4}>
              <Ionicons name="server-outline" size={20} color={colors.textSubtle} />
              <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginLeft: 6 }]}>{t('settings.data_storage')}</Text>
            </XStack>
            <Card backgroundColor={colors.card} borderRadius={16} overflow="hidden" padded={false}>
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.auto_download_images')}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSubtle} />
              </TouchableOpacity>
              <Separator borderColor={colors.border} marginHorizontal={16} />
              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="videocam-outline" size={20} color={colors.textMuted} />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.auto_download_videos')}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSubtle} />
              </TouchableOpacity>
            </Card>
          </YStack>

          {/* ====== ABOUT ====== */}
          <YStack paddingHorizontal={20} marginTop={25} marginBottom={30}>
            <XStack alignItems="center" marginBottom={10} marginLeft={4}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSubtle} />
              <Text style={[styles.sectionTitle, { color: colors.textSubtle, marginLeft: 6 }]}>{t('settings.about')}</Text>
            </XStack>
            <Card backgroundColor={colors.card} borderRadius={16} overflow="hidden" padded={false}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemLeft}>
                  <Ionicons name="logo-react" size={20} color="#61dafb" />
                  <Text style={[styles.menuItemText, { color: colors.foreground }]}>{t('settings.version')}</Text>
                </View>
                <Text style={[styles.versionText, { color: colors.textSubtle }]}>1.0.0</Text>
              </View>
            </Card>
          </YStack>
        </ResponsiveContainer>
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
  section: { paddingHorizontal: 20, marginTop: 25 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 4 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  menuCard: { borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { fontSize: 15, fontWeight: '500', marginLeft: 12 },
  menuDivider: { height: 1, marginHorizontal: 16 },
  versionText: { fontSize: 13, fontWeight: '500' },
});

export default SettingsScreen;
