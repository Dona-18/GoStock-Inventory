import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function AlertsScreen({ navigation }) {
  const { lowStockProducts } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const getSeverity = (product) => {
    if (product.stockQuantity === 0) return 'out';
    if (product.stockQuantity <= Math.ceil(product.lowStockThreshold / 2)) return 'critical';
    return 'low';
  };

  const severityConfig = {
    out: { color: colors.danger, bg: colors.dangerLight, labelKey: 'alert_severity_out', icon: 'close-circle' },
    critical: { color: colors.danger, bg: colors.dangerLight, labelKey: 'alert_severity_critical', icon: 'warning' },
    low: { color: colors.warning, bg: colors.warningLight, labelKey: 'alert_severity_low', icon: 'alert-circle' },
  };

  const renderItem = ({ item }) => {
    const sev = getSeverity(item);
    const cfg = severityConfig[sev];
    const pct = item.lowStockThreshold > 0
      ? Math.min(100, Math.round((item.stockQuantity / item.lowStockThreshold) * 100))
      : 0;

    return (
      <View style={styles.card}>
        <View style={[styles.severityBar, { backgroundColor: cfg.color }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{t(cfg.labelKey)}</Text>
            </View>
          </View>

          <View style={styles.stockInfo}>
            <View style={styles.stockNumbers}>
              <Text style={styles.stockCurrent}>{item.stockQuantity}</Text>
              <Text style={styles.stockSeparator}> / </Text>
              <Text style={styles.stockThreshold}>{t('alert_threshold', { count: item.lowStockThreshold })}</Text>
            </View>
            <Text style={styles.stockLabel}>{t('units_remaining')}</Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: cfg.color }]} />
          </View>

          <TouchableOpacity
            style={styles.restockBtn}
            onPress={() => navigation.navigate('Inventory', {
              screen: 'AddProduct',
              params: { product: item },
            })}
          >
            <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.restockText}>{t('restock_btn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>
        <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('stock_alerts_title')}</Text>
        {lowStockProducts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{lowStockProducts.length}</Text>
          </View>
        )}
      </View>

      {lowStockProducts.length > 0 && (
        <View style={styles.summaryBanner}>
          <Ionicons name="warning" size={18} color={colors.warning} />
          <Text style={styles.summaryText}>
            {lowStockProducts.length === 1
              ? t('banner_need_restocking_single')
              : t('banner_need_restocking', { count: lowStockProducts.length })}
          </Text>
        </View>
      )}

      <FlatList
        data={lowStockProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title={t('alerts_empty_title')}
            subtitle={t('alerts_empty_subtitle')}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 8 }}
      />
      </FadeInView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
    },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.textPrimary },
    countBadge: {
      backgroundColor: colors.danger, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
    },
    countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    summaryBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 16, marginBottom: 12,
      backgroundColor: colors.warningLight, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: 'rgba(255, 159, 67, 0.18)',
      borderLeftWidth: 3, borderLeftColor: colors.warning,
    },
    summaryText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    card: {
      flexDirection: 'row', marginHorizontal: 16, marginVertical: 6,
      backgroundColor: colors.card, borderRadius: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, overflow: 'hidden',
    },
    severityBar: { width: 5 },
    cardContent: { flex: 1, padding: 14 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconWrap: {
      width: 40, height: 40, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    productCategory: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },
    stockInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
    stockNumbers: { flexDirection: 'row', alignItems: 'baseline' },
    stockCurrent: { fontSize: 28, fontWeight: '900', color: colors.textPrimary },
    stockSeparator: { fontSize: 16, color: colors.textMuted },
    stockThreshold: { fontSize: 13, color: colors.textSecondary },
    stockLabel: { fontSize: 12, color: colors.textMuted },
    progressBg: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, marginBottom: 12 },
    progressFill: { height: 6, borderRadius: 3 },
    restockBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    },
    restockText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  });
}
