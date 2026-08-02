import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function SettingsScreen() {
  const { clearAllData, products, sales, storeInfo, updateStoreInfo } = useApp();
  const { colors, isDark, mode, setThemeMode } = useTheme();
  const { t, locale, setLanguage } = useLanguage();
  const { currency, setCurrency, exchangeRate, setExchangeRate } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Local draft for the exchange rate text input so it feels snappy
  const [rateDraft, setRateDraft] = useState(String(exchangeRate));

  // Local draft for store profile
  const [nameDraft, setNameDraft] = useState(storeInfo?.name || '');
  const [phoneDraft, setPhoneDraft] = useState(storeInfo?.phone || '');
  const [addressDraft, setAddressDraft] = useState(storeInfo?.address || '');
  const [noteDraft, setNoteDraft] = useState(storeInfo?.note || '');

  const handleClearData = () => {
    Alert.alert(
      t('clear_data_alert_title'),
      t('clear_data_alert_confirm', { products: products.length, sales: sales.length }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert(t('clear_data_done_title'), t('clear_data_done_msg'));
          },
        },
      ]
    );
  };

  const SettingRow = ({ icon, iconBg, title, subtitle, right, onPress, danger }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg || colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: colors.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right || (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );

  // Theme mode options
  const themeModes = [
    { key: 'light', label: t('theme_chip_light'), icon: 'sunny-outline' },
    { key: 'dark', label: t('theme_chip_dark'), icon: 'moon-outline' },
    { key: 'system', label: t('theme_chip_system'), icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>

        {/* App Info */}
        <View style={styles.appCard}>
          <View style={styles.appIconWrap}>
            <Ionicons name="cube" size={32} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.appName}>GoStock</Text>
            <Text style={styles.appVersion}>
              {t('settings_app_version', { version: '1.0.0' })}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>{t('section_appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: isDark ? '#1E2456' : '#EEF2FF' }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('setting_theme')}</Text>
              <Text style={styles.rowSubtitle}>
                {mode === 'system' ? t('theme_system_desc') : mode === 'dark' ? t('theme_dark_desc') : t('theme_light_desc')}
              </Text>
            </View>
          </View>
          {/* Theme mode chips */}
          <View style={styles.themeChipsRow}>
            {themeModes.map((tMode) => (
              <TouchableOpacity
                key={tMode.key}
                style={[styles.themeChip, mode === tMode.key && styles.themeChipActive]}
                onPress={() => setThemeMode(tMode.key)}
              >
                <Ionicons
                  name={tMode.icon}
                  size={16}
                  color={mode === tMode.key ? '#FFF' : colors.textSecondary}
                />
                <Text style={[styles.themeChipText, mode === tMode.key && styles.themeChipTextActive]}>
                  {tMode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Summary */}
        <Text style={styles.sectionLabel}>{t('section_data_summary')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="cube-outline"
            title={t('setting_total_products')}
            subtitle={t('setting_total_products_desc')}
            right={<Text style={styles.badge}>{products.length}</Text>}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="receipt-outline"
            title={t('setting_total_sales')}
            subtitle={t('setting_total_sales_desc')}
            right={<Text style={styles.badge}>{sales.length}</Text>}
          />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t('section_preferences')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('setting_language')}</Text>
              <Text style={styles.rowSubtitle}>{t('setting_language_desc')}</Text>
            </View>
          </View>
          {/* Language Selector chips switcher */}
          <View style={styles.themeChipsRow}>
            {[
              { key: 'km', label: '🇰🇭 ភាសាខ្មែរ' },
              { key: 'en', label: '🇺🇸 English' },
            ].map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[styles.themeChip, locale === lang.key && styles.themeChipActive]}
                onPress={() => setLanguage(lang.key)}
              >
                <Text style={[styles.themeChipText, locale === lang.key && styles.themeChipTextActive]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="cash-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{t('setting_currency')}</Text>
              <Text style={styles.rowSubtitle}>
                {currency === 'USD' ? t('currency_usd_desc') : t('currency_riel_desc')}
              </Text>
            </View>
          </View>
          <View style={styles.themeChipsRow}>
            {[
              { key: 'USD', label: '🇺🇸 USD ($)' },
              { key: 'KHR', label: '🇰🇭 KHR (៛)' },
            ].map((cur) => (
              <TouchableOpacity
                key={cur.key}
                style={[styles.themeChip, currency === cur.key && styles.themeChipActive]}
                onPress={() => setCurrency(cur.key)}
              >
                <Text style={[styles.themeChipText, currency === cur.key && styles.themeChipTextActive]}>
                  {cur.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Exchange Rate Input — shown only when KHR is active */}
          {currency === 'KHR' && (
            <View style={styles.exchangeRateBox}>
              <View style={styles.exchangeRateHeader}>
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.exchangeRateLabel}>{t('exchange_rate_label')}</Text>
              </View>
              <Text style={styles.exchangeRateHint}>{t('exchange_rate_hint')}</Text>
              <TextInput
                style={[styles.exchangeRateInput, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                value={rateDraft}
                onChangeText={setRateDraft}
                onBlur={() => {
                  const parsed = parseFloat(rateDraft);
                  if (!isNaN(parsed) && parsed > 0) {
                    setExchangeRate(parsed);
                  } else {
                    // Revert draft to current valid rate if input is bad
                    setRateDraft(String(exchangeRate));
                  }
                }}
                keyboardType="numeric"
                placeholder={t('exchange_rate_placeholder')}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
              <Text style={styles.exchangeRateLive}>
                1 USD = {Number.isFinite(parseFloat(rateDraft) ) && parseFloat(rateDraft) > 0 ? Math.round(parseFloat(rateDraft)).toLocaleString() : Math.round(exchangeRate).toLocaleString()} ៛
              </Text>
            </View>
          )}
        </View>

        {/* Store Profile & Receipt */}
        <Text style={styles.sectionLabel}>{t('section_store_info')}</Text>
        <View style={styles.card}>
          <View style={{ padding: 16 }}>
            <Text style={styles.inputLabel}>{t('store_name_label')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={nameDraft}
              onChangeText={setNameDraft}
              onBlur={() => updateStoreInfo({ name: nameDraft })}
              placeholder={t('default_store_name')}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('store_phone_label')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={phoneDraft}
              onChangeText={setPhoneDraft}
              onBlur={() => updateStoreInfo({ phone: phoneDraft })}
              placeholder={t('default_store_phone')}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('store_address_label')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={addressDraft}
              onChangeText={setAddressDraft}
              onBlur={() => updateStoreInfo({ address: addressDraft })}
              placeholder={t('default_store_address')}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>{t('store_note_label')}</Text>
            <TextInput
              style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
              value={noteDraft}
              onChangeText={setNoteDraft}
              onBlur={() => updateStoreInfo({ note: noteDraft })}
              placeholder={t('default_store_note')}
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>{t('section_data_mgmt')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="trash-outline"
            iconBg={colors.dangerLight}
            title={t('setting_clear_data')}
            subtitle={t('setting_clear_data_desc')}
            onPress={handleClearData}
            danger
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('footer_tagline')}
          </Text>
        </View>
      </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    headerTitle: {
      fontSize: 24, fontWeight: '800', color: colors.textPrimary,
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    },
    appCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      marginHorizontal: 16, marginBottom: 20,
      backgroundColor: colors.primary, borderRadius: 16, padding: 16,
    },
    appIconWrap: {
      width: 54, height: 54, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center', alignItems: 'center',
    },
    appName: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    appVersion: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      paddingHorizontal: 20, marginBottom: 8,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    card: {
      marginHorizontal: 16, marginBottom: 20, backgroundColor: colors.card,
      borderRadius: 16, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
      borderWidth: 1, borderColor: colors.border,
    },
    row: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
    },
    rowIcon: {
      width: 38, height: 38, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    rowSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
    divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 66 },
    badge: {
      fontSize: 14, fontWeight: '700', color: colors.primary,
      backgroundColor: colors.primaryLight, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 3,
    },
    comingSoon: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic' },
    // Theme chips
    themeChipsRow: {
      flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14,
    },
    themeChip: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 5, paddingVertical: 9, borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1.5, borderColor: colors.border,
    },
    themeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    themeChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    themeChipTextActive: { color: '#FFF' },
    footer: { alignItems: 'center', paddingTop: 30, paddingBottom: 110 },
    footerText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
    // Exchange rate section
    exchangeRateBox: {
      marginHorizontal: 16, marginTop: 2, marginBottom: 14,
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
      borderTopWidth: 1, borderTopColor: colors.borderLight,
    },
    exchangeRateHeader: {
      flexDirection: 'row', alignItems: 'center', marginBottom: 4,
    },
    exchangeRateLabel: {
      fontSize: 13, fontWeight: '700', color: colors.textPrimary,
    },
    exchangeRateHint: {
      fontSize: 11, color: colors.textMuted, marginBottom: 10, lineHeight: 16,
    },
    exchangeRateInput: {
      height: 44, borderWidth: 1.5, borderRadius: 10,
      paddingHorizontal: 14, fontSize: 15, fontWeight: '600',
    },
    exchangeRateLive: {
      marginTop: 8, fontSize: 12, color: colors.primary, fontWeight: '700', textAlign: 'right',
    },
    inputLabel: {
      fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 4,
    },
    input: {
      height: 42, borderWidth: 1.5, borderRadius: 10,
      paddingHorizontal: 12, fontSize: 14, fontWeight: '500',
    },
  });
}
