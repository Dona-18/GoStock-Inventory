import React, { useMemo, useState, useRef } from 'react';
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
import EmptyState from '../components/EmptyState';
import { lastNDaysKeys } from '../utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function ReportsScreen() {
  const { sales, products } = useApp();
  const scrollViewRef = useRef(null);
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const { formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [period, setPeriod] = useState(7);

  const stats = useMemo(() => {
    const keys = lastNDaysKeys(period);
    const periodSales = sales.filter((s) => keys.some((k) => s.createdAt.startsWith(k)));
    const totalRevenue = periodSales.reduce((sum, s) => sum + s.totalPrice, 0);
    const totalUnits = periodSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalTransactions = periodSales.length;

    const dailyMap = {};
    keys.forEach((k) => (dailyMap[k] = 0));
    periodSales.forEach((s) => {
      const day = s.createdAt.split('T')[0];
      if (dailyMap[day] !== undefined) dailyMap[day] += s.totalPrice;
    });
    const dailyRevenue = keys.map((k) => ({ date: k, revenue: dailyMap[k] })).reverse();

    const productMap = {};
    periodSales.forEach((s) => {
      if (!productMap[s.productId]) productMap[s.productId] = { name: s.productName, qty: 0, revenue: 0 };
      productMap[s.productId].qty += s.quantity;
      productMap[s.productId].revenue += s.totalPrice;
    });
    const bestSellers = Object.entries(productMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const maxRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
    return { totalRevenue, totalUnits, totalTransactions, dailyRevenue, bestSellers, maxRevenue };
  }, [sales, period]);

  const allTimeRevenue = useMemo(() => sales.reduce((sum, s) => sum + s.totalPrice, 0), [sales]);

  if (sales.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <FadeInView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('reports_title')}</Text>
          </View>
          <EmptyState
            icon="bar-chart-outline"
            title={t('reports_empty_title')}
            subtitle={t('reports_empty_subtitle')}
          />
        </FadeInView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('reports_title')}</Text>
          <View style={styles.periodPicker}>
            {[7, 30].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                  {locale === 'km' ? `${p}ថ្ងៃ` : `${p}d`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.allTimeBanner}>
          <View style={styles.allTimeLeft}>
            <Text style={styles.allTimeLabel}>{t('all_time_revenue_label')}</Text>
            <Text
              style={styles.allTimeValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.45}
            >
              {formatCurrency(allTimeRevenue)}
            </Text>
          </View>
          <View style={styles.allTimeRight}>
            <Text style={styles.allTimeSales} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {sales.length}
            </Text>
            <Text style={styles.allTimeSalesLabel}>{t('all_time_sales_label')}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('period_days', { count: period })}</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'cash-outline', value: formatCurrency(stats.totalRevenue), label: t('revenue_metric'), color: colors.success, bg: colors.successLight },
            { icon: 'bag-handle-outline', value: stats.totalUnits.toString(), label: t('units_sold_label'), color: colors.primary, bg: colors.primaryLight },
            { icon: 'receipt-outline', value: stats.totalTransactions.toString(), label: t('transactions_metric'), color: colors.purple, bg: colors.purpleLight },
            {
              icon: 'trending-up-outline',
              value: stats.totalTransactions > 0 ? formatCurrency(stats.totalRevenue / stats.totalTransactions) : formatCurrency(0),
              label: t('avg_sale_label'), color: colors.warning, bg: colors.warningLight,
            },
          ].map((item) => (
            <View key={item.label} style={styles.statBox}>
              <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {item.value}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('daily_revenue_label')}</Text>
        <View style={styles.chartCard}>
          {period === 30 ? (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 10 }}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }}
            >
              <View style={[styles.barChart, { justifyContent: 'flex-start' }]}>
                {stats.dailyRevenue.map((day) => {
                  const height = stats.maxRevenue > 0 ? Math.max(4, (day.revenue / stats.maxRevenue) * 100) : 4;
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  const hasRevenue = day.revenue > 0;
                  return (
                    <View key={day.date} style={[styles.barGroup, { width: 44 }]}>
                      {/* Amount label above bar */}
                      <Text
                        style={[
                          styles.barAmount,
                          isToday && { color: colors.primary, fontWeight: '700' },
                          !hasRevenue && { opacity: 0 },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {hasRevenue ? formatCurrency(day.revenue) : '0'}
                      </Text>
                      <View style={[styles.barBg, { width: 22 }]}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              height: `${height}%`,
                              backgroundColor: isToday ? colors.primary : colors.primaryMid,
                            },
                          ]}
                        />
                      </View>
                      {/* Date label */}
                      <Text style={[styles.barDate, isToday && styles.barDateToday]}>
                        {day.date.slice(8)}
                      </Text>
                      {/* Today indicator dot */}
                      {isToday ? (
                        <View style={styles.todayDot} />
                      ) : (
                        <View style={styles.todayDotPlaceholder} />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={[styles.barChart, { justifyContent: 'space-around' }]}>
              {stats.dailyRevenue.map((day) => {
                const height = stats.maxRevenue > 0 ? Math.max(4, (day.revenue / stats.maxRevenue) * 100) : 4;
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const hasRevenue = day.revenue > 0;
                return (
                  <View key={day.date} style={[styles.barGroup, { width: 44 }]}>
                    {/* Amount label above bar */}
                    <Text
                      style={[
                        styles.barAmount,
                        isToday && { color: colors.primary, fontWeight: '700' },
                        !hasRevenue && { opacity: 0 },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {hasRevenue ? formatCurrency(day.revenue) : '0'}
                    </Text>
                    <View style={[styles.barBg, { width: 22 }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${height}%`,
                            backgroundColor: isToday ? colors.primary : colors.primaryMid,
                          },
                        ]}
                      />
                    </View>
                    {/* Date label */}
                    <Text style={[styles.barDate, isToday && styles.barDateToday]}>
                      {day.date.slice(8)}
                    </Text>
                    {/* Today indicator dot */}
                    {isToday ? (
                      <View style={styles.todayDot} />
                    ) : (
                      <View style={styles.todayDotPlaceholder} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {stats.bestSellers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('top_products_label')}</Text>
            {stats.bestSellers.map((item, idx) => {
              const avatarColors = ['#4C6EF5', '#7950F2', '#F76707', '#2F9E44', '#1971C2', '#C2255C'];
              const avatarBg = avatarColors[(item.name || 'P').charCodeAt(0) % avatarColors.length];
              const initials = (item.name || 'P').slice(0, 2).toUpperCase();

              const product = products.find((p) => p.id === item.id);
              const imageUri = product?.imageUri;

              return (
                <View key={item.id} style={styles.bestSellerRow}>
                  <View style={[styles.rankBadge, idx === 0 && styles.rankGold]}>
                    <Text style={[styles.rankText, idx === 0 && { color: '#FFF' }]}>#{idx + 1}</Text>
                  </View>

                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.bestSellerAvatar} />
                  ) : (
                    <View style={[styles.bestSellerAvatar, { backgroundColor: avatarBg }]}>
                      <Text style={styles.bestSellerAvatarText}>{initials}</Text>
                    </View>
                  )}

                  <View style={styles.bestSellerInfo}>
                    <Text style={styles.bestSellerName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.bestSellerMeta}>{t('units_sold_count', { count: item.qty })}</Text>
                  </View>
                  <Text style={styles.bestSellerRevenue}>{formatCurrency(item.revenue)}</Text>
                </View>
              );
            })}
          </>
        )}
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 110 },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
    },
    headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.textPrimary },
    periodPicker: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 10, padding: 3 },
    periodBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
    periodBtnActive: { backgroundColor: colors.primary },
    periodText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    periodTextActive: { color: '#FFF' },
    allTimeBanner: {
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: colors.primary, borderRadius: 18, padding: 18,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    allTimeLeft: { flex: 1, marginRight: 12, overflow: 'hidden' },
    allTimeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginBottom: 4 },
    allTimeValue: { fontSize: 26, fontWeight: '900', color: '#FFF' },
    allTimeRight: { alignItems: 'flex-end', minWidth: 56 },
    allTimeSales: { fontSize: 30, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
    allTimeSalesLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    sectionTitle: {
      fontSize: 16, fontWeight: '700', color: colors.textPrimary,
      paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 11 },
    statBox: {
      width: '47%', margin: '1.5%', backgroundColor: colors.card,
      borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    chartCard: {
      marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
      borderWidth: 1, borderColor: colors.border,
    },
    barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 160, justifyContent: 'space-around' },
    barGroup: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
    barAmount: {
      fontSize: 9, color: colors.textMuted, marginBottom: 3,
      textAlign: 'center', width: '100%', paddingHorizontal: 1,
    },
    barBg: {
      width: '60%', height: 100, justifyContent: 'flex-end',
      backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden',
    },
    barFill: { width: '100%', borderRadius: 6 },
    barDate: { fontSize: 9, color: colors.textMuted, marginTop: 4 },
    barDateToday: { color: colors.primary, fontWeight: '800' },
    todayDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 4,
      elevation: 4,
    },
    todayDotPlaceholder: { width: 6, height: 6, marginTop: 3 },
    bestSellerRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 6, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    rankBadge: {
      width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    rankGold: { backgroundColor: '#FFA500' },
    rankText: { fontSize: 13, fontWeight: '800', color: colors.primary },
    bestSellerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    bestSellerAvatarText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    bestSellerInfo: { flex: 1 },
    bestSellerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    bestSellerMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    bestSellerRevenue: { fontSize: 15, fontWeight: '800', color: colors.primary },
  });
}
