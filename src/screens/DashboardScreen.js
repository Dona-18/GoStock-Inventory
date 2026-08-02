import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import StatCard from '../components/StatCard';
import { todayKey, formatTime } from '../utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';
import InvoiceModal from '../components/InvoiceModal';

export default function DashboardScreen({ navigation }) {
  const { products, sales, lowStockProducts } = useApp();
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const { formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState(null);

  const todayStats = useMemo(() => {
    const today = todayKey();
    const todaySales = sales.filter((s) => s.createdAt.startsWith(today));
    const revenue = todaySales.reduce((sum, s) => sum + s.totalPrice, 0);
    const unitsSold = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    return { revenue, unitsSold, count: todaySales.length, todaySales };
  }, [sales]);

  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('greeting')}</Text>
            <Text style={styles.subGreeting}>{t('sub_greeting')}</Text>
          </View>
          <View style={styles.logoMini}>
            <Ionicons name="cube" size={22} color={colors.primary} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            title={t('today_revenue')}
            value={formatCurrency(todayStats.revenue)}
            icon="cash-outline"
            iconColor={colors.success}
            bgColor={colors.successLight}
          />
          <StatCard
            title={t('units_sold_label')}
            value={todayStats.unitsSold.toString()}
            icon="bag-handle-outline"
            iconColor={colors.primary}
            bgColor={colors.primaryLight}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title={t('total_products_label')}
            value={products.length.toString()}
            icon="cube-outline"
            iconColor={colors.purple}
            bgColor={colors.purpleLight}
          />
          <StatCard
            title={t('low_stock_alerts_label')}
            value={lowStockProducts.length.toString()}
            icon="warning-outline"
            iconColor={colors.danger}
            bgColor={colors.dangerLight}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('RecordSale')}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>{t('record_sale_btn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.purple }]}
            onPress={() => navigation.navigate('Inventory', { screen: 'AddProduct', params: {} })}
          >
            <Ionicons name="cube-outline" size={22} color="#FFF" />
            <Text style={styles.actionBtnText}>{t('add_product_btn')}</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Warning */}
        {lowStockProducts.length > 0 && (
          <View style={styles.alertBox}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={18} color={colors.warning} />
              <Text style={styles.alertTitle}>{t('low_stock_warning')}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Alerts')}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>{t('view_all')}</Text>
              </TouchableOpacity>
            </View>
            {lowStockProducts.slice(0, 3).map((p) => (
              <View key={p.id} style={styles.alertItem}>
                <View style={styles.alertDot} />
                <Text style={styles.alertItemName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.alertItemStock}>{t('units_left', { count: p.stockQuantity })}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>{t('recent_sales')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SalesLog')} style={styles.viewAllPressable}>
            <Text style={styles.viewAllLink}>{t('view_all')}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyRecentText}>{t('no_sales_recorded')}</Text>
          </View>
        ) : (
          <View style={styles.recentCard}>
            {recentSales.map((sale, index) => {
              const avatarColors = ['#4C6EF5', '#7950F2', '#F76707', '#2F9E44', '#1971C2', '#C2255C'];
              const avatarBg = avatarColors[(sale.productName || 'P').charCodeAt(0) % avatarColors.length];
              const initials = (sale.productName || 'P').slice(0, 2).toUpperCase();

              const firstProductId = sale.productId || (Array.isArray(sale.items) && sale.items[0]?.productId);
              const product = products.find((p) => p.id === firstProductId);
              const imageUri = sale.imageUri || (Array.isArray(sale.items) && sale.items[0]?.imageUri) || product?.imageUri;

              return (
                <View key={sale.saleId}>
                  <TouchableOpacity
                    style={styles.recentItem}
                    onPress={() => setSelectedInvoiceSale(sale)}
                    activeOpacity={0.7}
                  >
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.avatarMini} />
                    ) : (
                      <View style={[styles.avatarMini, { backgroundColor: avatarBg }]}>
                        <Text style={styles.avatarMiniText}>{initials}</Text>
                      </View>
                    )}
                    <View style={styles.recentLeft}>
                      <Text style={styles.recentProduct} numberOfLines={1}>{sale.productName}</Text>
                      <Text style={styles.recentMeta}>
                        {t('units_sold_meta', { count: sale.quantity, time: formatTime(sale.createdAt, locale) })}
                      </Text>
                    </View>
                    <Text style={styles.recentAmount}>+{formatCurrency(sale.totalPrice)}</Text>
                  </TouchableOpacity>
                  {index < recentSales.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}
        </ScrollView>

        <InvoiceModal
          visible={!!selectedInvoiceSale}
          sale={selectedInvoiceSale}
          onClose={() => setSelectedInvoiceSale(null)}
        />
      </FadeInView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 110 },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    greeting: { fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    subGreeting: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    logoMini: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center', alignItems: 'center',
    },
    statsRow: { flexDirection: 'row', paddingHorizontal: 11, marginTop: 4 },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, marginTop: 20, marginBottom: 8,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    viewAllPressable: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    viewAllLink: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    sectionTitle: {
      fontSize: 16, fontWeight: '700', color: colors.textPrimary,
      paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
    },
    quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14,
    },
    actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    alertBox: {
      marginHorizontal: 20, marginTop: 20,
      backgroundColor: colors.warningLight, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: 'rgba(255, 159, 67, 0.18)',
      borderLeftWidth: 4, borderLeftColor: colors.warning,
    },
    alertHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
    },
    alertTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    viewAllBtn: {
      paddingHorizontal: 8, paddingVertical: 3,
      backgroundColor: colors.warning, borderRadius: 8,
    },
    viewAllText: { fontSize: 12, color: '#FFFFFF', fontWeight: '700' },
    alertItem: {
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4,
    },
    alertDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
    alertItemName: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    alertItemStock: { fontSize: 12, color: colors.danger, fontWeight: '700' },
    recentCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginHorizontal: 20,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    avatarMini: {
      width: 38,
      height: 38,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarMiniText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
    recentLeft: {
      flex: 1,
      marginLeft: 12,
    },
    recentProduct: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    recentMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    recentAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.success,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginLeft: 66,
    },
    emptyRecent: { alignItems: 'center', paddingVertical: 30, gap: 8 },
    emptyRecentText: { fontSize: 14, color: colors.textMuted },
  });
}
