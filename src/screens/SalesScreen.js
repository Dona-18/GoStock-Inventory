import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import SaleCard from '../components/SaleCard';
import EmptyState from '../components/EmptyState';
import CalendarPicker from '../components/CalendarPicker';
import { todayKey, formatDate } from '../utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function SalesScreen({ navigation, route }) {
  const { sales, deleteSale } = useApp();
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const { formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [filter, setFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (route?.params?.openAddSale) {
      navigation.navigate('AddSale');
    }
  }, [route?.params?.openAddSale]);

  const filtered = useMemo(() => {
    if (filter === 'today') {
      const today = todayKey();
      return sales.filter((s) => s.createdAt.startsWith(today));
    }
    if (filter === 'custom') {
      return sales.filter((s) => s.createdAt.startsWith(selectedDate));
    }
    return sales;
  }, [sales, filter, selectedDate]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, s) => sum + s.totalPrice, 0),
    [filtered]
  );

  const handleDelete = (sale) => {
    Alert.alert(
      t('undo_sale_title'),
      t('undo_sale_confirm', { name: sale.productName }),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('remove'), style: 'destructive', onPress: () => deleteSale(sale.saleId) },
      ]
    );
  };

  const formatDateCompact = (dateStr, lang) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const targetLocale = lang === 'km' ? 'km-KH' : 'en-US';
    try {
      return d.toLocaleDateString(targetLocale, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('sales_log_title')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddSale')}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerLeft}>
          <Text style={styles.bannerLabel} numberOfLines={1}>
            {filter === 'today'
              ? t('today_revenue')
              : filter === 'custom'
              ? t('revenue_on_date', { date: formatDate(selectedDate, locale) })
              : t('total_revenue_label')}
          </Text>
          <Text
            style={styles.bannerValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {formatCurrency(totalRevenue)}
          </Text>
        </View>
        <View style={styles.bannerRight}>
          <Text style={styles.bannerCount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {filtered.length}
          </Text>
          <Text style={styles.bannerCountLabel}>{t('transactions_count')}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {[
          { key: 'today', label: t('tab_today') },
          { key: 'custom', label: filter === 'custom' ? formatDateCompact(selectedDate, locale) : t('tab_custom_date') },
          { key: 'all', label: t('tab_all_time') },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => {
              if (tab.key === 'custom') {
                setShowCalendar(true);
              } else {
                setFilter(tab.key);
              }
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {tab.key === 'custom' && (
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={filter === tab.key ? '#FFF' : colors.textSecondary}
                />
              )}
              <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.saleId}
        renderItem={({ item }) => <SaleCard sale={item} onDelete={() => handleDelete(item)} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title={t('no_sales_yet')}
            subtitle={
              filter === 'today'
                ? t('no_sales_today')
                : filter === 'custom'
                ? t('no_sales_today')
                : t('no_sales_yet')
            }
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddSale')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <CalendarPicker
        visible={showCalendar}
        initialDate={selectedDate}
        onClose={() => setShowCalendar(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          setFilter('custom');
        }}
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
    addBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    },
    banner: {
      marginHorizontal: 16, marginBottom: 12,
      backgroundColor: colors.primary, borderRadius: 18, padding: 18,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    bannerLeft: { flex: 1, marginRight: 12, overflow: 'hidden' },
    bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginBottom: 2 },
    bannerValue: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
    bannerRight: { alignItems: 'flex-end', minWidth: 56 },
    bannerCount: { fontSize: 30, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
    bannerCountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    tabs: {
      flexDirection: 'row', marginHorizontal: 16,
      backgroundColor: colors.card, borderRadius: 12, padding: 4, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    tabTextActive: { color: '#FFF' },
    fab: {
      position: 'absolute', right: 20, bottom: 24,
      width: 56, height: 56, borderRadius: 18,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    },
  });
}
