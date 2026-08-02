import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import SaleCard from '../components/SaleCard';
import EmptyState from '../components/EmptyState';
import CalendarPicker from '../components/CalendarPicker';
import { todayKey, formatDate, formatTime } from '../utils/dateHelpers';
import { formatReceiptId, downloadPDFAsync, shareInvoiceAsync } from '../utils/invoiceHelpers';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';
import InvoiceModal from '../components/InvoiceModal';

export default function SalesScreen({ navigation, route }) {
  const { sales, deleteSale, storeInfo } = useApp();
  const { colors, isDark } = useTheme();
  const { t, locale } = useLanguage();
  const { currency, exchangeRate, formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [filter, setFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [showCalendar, setShowCalendar] = useState(false);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [showInvoiceHistory, setShowInvoiceHistory] = useState(false);
  const [searchInvoice, setSearchInvoice] = useState('');

  useEffect(() => {
    if (route?.params?.openAddSale) {
      navigation.navigate('RecordSale');
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

  // Filtered invoice history list for Modal search
  const filteredInvoices = useMemo(() => {
    if (!searchInvoice.trim()) return sales;
    const q = searchInvoice.toLowerCase();
    return sales.filter((s) => {
      const receiptNo = formatReceiptId(s.saleId, s.createdAt).toLowerCase();
      const prodName = (s.productName || '').toLowerCase();
      const dateStr = formatDate(s.createdAt, locale).toLowerCase();
      return receiptNo.includes(q) || prodName.includes(q) || dateStr.includes(q);
    });
  }, [sales, searchInvoice, locale]);

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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('sales_log_title')}</Text>
        <TouchableOpacity
          style={styles.historyHeaderBtn}
          onPress={() => setShowInvoiceHistory(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Revenue Banner */}
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

      {/* Date Filter Tabs */}
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

      {/* Transactions List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.saleId}
        renderItem={({ item }) => (
          <SaleCard
            sale={item}
            onDelete={() => handleDelete(item)}
            onViewInvoice={(s) => setInvoiceSale(s)}
          />
        )}
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

      {/* FAB: New POS Sale */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('RecordSale')} activeOpacity={0.85}>
        <Ionicons name="cart" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Calendar Picker Modal */}
      <CalendarPicker
        visible={showCalendar}
        initialDate={selectedDate}
        onClose={() => setShowCalendar(false)}
        onSelect={(date) => {
          setSelectedDate(date);
          setFilter('custom');
        }}
      />
      
      {/* Thermal Invoice Receipt Modal */}
      <InvoiceModal
        visible={!!invoiceSale}
        sale={invoiceSale}
        onClose={() => setInvoiceSale(null)}
      />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* INVOICE HISTORY ALL RECEIPTS MODAL                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Modal
        visible={showInvoiceHistory}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInvoiceHistory(false)}
      >
        <SafeAreaView style={styles.historyModal} edges={['top', 'bottom']}>
          {/* History Header */}
          <View style={styles.historyModalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="receipt" size={22} color={colors.primary} />
              <Text style={styles.historyModalTitle}>{t('invoice_history_title')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowInvoiceHistory(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarRow}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_invoice_placeholder')}
              placeholderTextColor={colors.textMuted}
              value={searchInvoice}
              onChangeText={setSearchInvoice}
            />
            {searchInvoice.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInvoice('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Invoice History Cards List */}
          <FlatList
            data={filteredInvoices}
            keyExtractor={(item) => item.saleId}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30, paddingTop: 6 }}
            renderItem={({ item }) => {
              const receiptNo = formatReceiptId(item.saleId, item.createdAt);
              const formattedDate = formatDate(item.createdAt, locale);
              const formattedTime = formatTime(item.createdAt, locale);
              const isKhqr = item.paymentMethod === 'khqr';

              return (
                <TouchableOpacity
                  style={styles.invoiceHistoryCard}
                  activeOpacity={0.75}
                  onPress={() => {
                    setShowInvoiceHistory(false);
                    setInvoiceSale(item);
                  }}
                >
                  <View style={styles.invCardHeader}>
                    <View style={styles.invBadge}>
                      <Ionicons name="document-text-outline" size={14} color={colors.primary} />
                      <Text style={styles.invBadgeText}>{receiptNo}</Text>
                    </View>
                    <View style={styles.pmTag}>
                      <Ionicons
                        name={isKhqr ? 'qr-code-outline' : 'cash-outline'}
                        size={12}
                        color={colors.primary}
                      />
                      <Text style={styles.pmTagText}>
                        {isKhqr ? t('pay_method_khqr') : t('pay_method_cash')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.invTitle} numberOfLines={1}>{item.productName}</Text>

                  <View style={styles.invMetaRow}>
                    <Text style={styles.invDateText}>
                      📅 {formattedDate} · {formattedTime}
                    </Text>
                    <Text style={styles.invTotalText}>{formatCurrency(item.totalPrice)}</Text>
                  </View>

                  <View style={styles.invActionRow}>
                    <TouchableOpacity
                      style={[styles.actionPillBtn, { backgroundColor: colors.background }]}
                      onPress={() => {
                        downloadPDFAsync({
                          sale: item,
                          storeInfo,
                          currency,
                          exchangeRate,
                          locale,
                          t,
                          formatCurrency,
                        });
                      }}
                    >
                      <Ionicons name="download-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.actionPillText, { color: colors.textPrimary }]}>
                        PDF
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionPillBtn, { backgroundColor: colors.background }]}
                      onPress={() => {
                        shareInvoiceAsync({
                          sale: item,
                          storeInfo,
                          currency,
                          exchangeRate,
                          locale,
                          t,
                          formatCurrency,
                        });
                      }}
                    >
                      <Ionicons name="share-social-outline" size={14} color={colors.textPrimary} />
                      <Text style={[styles.actionPillText, { color: colors.textPrimary }]}>
                        {t('share_invoice')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 60, gap: 10 }}>
                <Ionicons name="receipt-outline" size={42} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>{t('no_invoices_found')}</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

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
    historyHeaderBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6,
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
    historyModal: { flex: 1, backgroundColor: colors.background },
    historyModalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card,
    },
    historyModalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    searchBarRow: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginVertical: 12,
      backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 44,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    invoiceHistoryCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    invCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    invBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    invBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
    pmTag: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    pmTagText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    invTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginVertical: 4 },
    invMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    invDateText: { fontSize: 12, color: colors.textMuted },
    invTotalText: { fontSize: 16, fontWeight: '900', color: colors.primary },
    invActionRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
    actionPillBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    },
    actionPillText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  });
}
