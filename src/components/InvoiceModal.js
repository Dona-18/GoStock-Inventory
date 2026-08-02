import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatTime } from '../utils/dateHelpers';
import {
  formatReceiptId,
  printInvoiceAsync,
  downloadPDFAsync,
  shareInvoiceAsync,
} from '../utils/invoiceHelpers';

export default function InvoiceModal({ visible, sale, onClose }) {
  const { colors } = useTheme();
  const { t, locale } = useLanguage();
  const { currency, exchangeRate, formatCurrency } = useCurrency();
  const { storeInfo } = useApp();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeAction, setActiveAction] = useState(null); // 'pdf' | 'print' | 'share' | null

  if (!sale) return null;

  const receiptNo = formatReceiptId(sale.saleId, sale.createdAt);
  const formattedDate = formatDate(sale.createdAt, locale);
  const formattedTime = formatTime(sale.createdAt, locale);

  const storeName = storeInfo?.name || t('default_store_name');
  const storePhone = storeInfo?.phone || t('default_store_phone');
  const storeAddress = storeInfo?.address || t('default_store_address');
  const storeNote = storeInfo?.note || t('default_store_note');

  const mainTotal = formatCurrency(sale.totalPrice);
  const itemsList = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items
    : [{ productId: sale.productId, productName: sale.productName, quantity: sale.quantity, unitPrice: sale.unitPrice, totalPrice: sale.totalPrice }];

  const isUSD = currency === 'USD';
  const rate = exchangeRate || 4000;
  let altTotal = '';
  if (isUSD) {
    const rielVal = Math.round(sale.totalPrice * rate);
    altTotal = `${rielVal.toLocaleString()} ៛`;
  } else {
    const usdVal = (sale.totalPrice / (rate || 1)).toFixed(2);
    altTotal = `$${usdVal}`;
  }

  const helperOptions = {
    sale,
    storeInfo,
    currency,
    exchangeRate,
    locale,
    t,
    formatCurrency,
  };

  const handleDownloadPDF = async () => {
    setActiveAction('pdf');
    try {
      await downloadPDFAsync(helperOptions);
    } catch (e) {
      console.warn('Download PDF error:', e);
    } finally {
      setActiveAction(null);
    }
  };

  const handlePrint = async () => {
    setActiveAction('print');
    try {
      await printInvoiceAsync(helperOptions);
    } catch (e) {
      console.warn('Print error:', e);
    } finally {
      setActiveAction(null);
    }
  };

  const handleShare = async () => {
    setActiveAction('share');
    try {
      await shareInvoiceAsync(helperOptions);
    } catch (e) {
      console.warn('Share error:', e);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top Navigation Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.headerTitle}>{t('invoice_title')}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Printable Ticket Receipt Card with Notches */}
          <View style={styles.receiptCard}>
            <View style={styles.notchLeft} />
            <View style={styles.notchRight} />

            {/* Gradient Top Banner Accent */}
            <View style={styles.topAccentBar} />

            {/* Store Branding Header */}
            <View style={styles.storeHeader}>
              <View style={styles.storeLogoBadge}>
                <Ionicons name="storefront" size={26} color="#FFFFFF" />
              </View>
              <Text style={styles.storeName}>{storeName}</Text>
              {storePhone ? (
                <Text style={styles.storeMeta}>📞 {storePhone}</Text>
              ) : null}
              {storeAddress ? (
                <Text style={styles.storeMeta}>📍 {storeAddress}</Text>
              ) : null}
            </View>

            <View style={styles.dashedLine} />

            {/* Meta Grid Information */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('receipt_no')}</Text>
                <Text style={styles.receiptNoCode}>{receiptNo}</Text>
              </View>
              <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.metaLabel}>{t('invoice_date')}</Text>
                <Text style={styles.metaValue}>{formattedDate}</Text>
                <Text style={styles.metaSubValue}>{formattedTime}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('pay_method_label')}</Text>
                <View style={styles.methodBadge}>
                  <Ionicons
                    name={sale.paymentMethod === 'khqr' ? 'qr-code-outline' : 'cash-outline'}
                    size={12}
                    color={colors.primary}
                  />
                  <Text style={styles.methodBadgeText}>
                    {sale.paymentMethod === 'khqr' ? t('pay_method_khqr') : t('pay_method_cash')}
                  </Text>
                </View>
              </View>
              <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.metaLabel}>Status</Text>
                <View style={styles.statusPaidBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#166534" />
                  <Text style={styles.statusPaidText}>{t('invoice_status_paid')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.dashedLine} />

            {/* Item Details */}
            <Text style={styles.sectionHeader}>{t('invoice_item')} ({itemsList.length})</Text>
            <View style={styles.itemCard}>
              {itemsList.map((item, idx) => (
                <View key={idx}>
                  <View style={styles.itemRow}>
                    <View style={styles.itemMainInfo}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemQtyPrice}>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotalVal}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                  {idx < itemsList.length - 1 && (
                    <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: 8 }} />
                  )}
                </View>
              ))}
            </View>

            {/* Price Summary Box */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('invoice_subtotal')}</Text>
                <Text style={styles.summaryVal}>{mainTotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax / VAT (0%)</Text>
                <Text style={[styles.summaryVal, { color: colors.success }]}>$0.00</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={[styles.summaryRow, { marginTop: 4 }]}>
                <Text style={styles.grandTotalLabel}>{t('invoice_total')}</Text>
                <Text style={styles.grandTotalVal}>{mainTotal}</Text>
              </View>
              {altTotal ? (
                <Text style={styles.altTotalText}>
                  ({t('invoice_dual_curr')}: {altTotal})
                </Text>
              ) : null}
            </View>

            {/* Receipt Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.footerNote}>{storeNote}</Text>
              <Text style={styles.appTagline}>GoStock POS Inventory — Digital Receipt</Text>
              <View style={styles.barcodeBox}>
                <Text style={styles.barcodeText}>||||| | |||| ||| |||| | |||</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Actions Footer */}
        <View style={styles.actionsFooter}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.downloadPdfBtn]}
            onPress={handleDownloadPDF}
            disabled={activeAction !== null}
          >
            {activeAction === 'pdf' ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.downloadPdfText}>{t('download_pdf')}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { flex: 1 }]}
              onPress={handlePrint}
              disabled={activeAction !== null}
            >
              {activeAction === 'print' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name="print-outline" size={18} color={colors.primary} />
              )}
              <Text style={styles.secondaryBtnText}>{t('print_invoice')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { flex: 1 }]}
              onPress={handleShare}
              disabled={activeAction !== null}
            >
              {activeAction === 'share' ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Ionicons name="share-social-outline" size={18} color={colors.primary} />
              )}
              <Text style={styles.secondaryBtnText}>{t('share_invoice')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>{t('done')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
      alignItems: 'center',
    },
    receiptCard: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: 22,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
      position: 'relative',
      overflow: 'hidden',
    },
    topAccentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 5,
      backgroundColor: colors.primary,
    },
    notchLeft: {
      position: 'absolute',
      left: -12,
      top: '42%',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 2,
    },
    notchRight: {
      position: 'absolute',
      right: -12,
      top: '42%',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 2,
    },
    storeHeader: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 14,
    },
    storeLogoBadge: {
      width: 52,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    storeName: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.textPrimary,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    storeMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      textAlign: 'center',
    },
    dashedLine: {
      height: 1,
      borderWidth: 0.8,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginVertical: 14,
    },
    metaGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 4,
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    receiptNoCode: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    metaValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 2,
    },
    metaSubValue: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    methodBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    methodBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    statusPaidBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginTop: 4,
    },
    statusPaidText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#166534',
    },
    sectionHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    itemCard: {
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    itemMainInfo: {
      flex: 1,
      marginRight: 12,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    itemQtyPrice: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
    },
    itemTotalVal: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primary,
    },
    summaryBox: {
      backgroundColor: colors.primaryLight,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(59, 130, 246, 0.15)',
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 2,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    summaryVal: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summaryDivider: {
      height: 1,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      marginVertical: 8,
    },
    grandTotalLabel: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.primary,
    },
    grandTotalVal: {
      fontSize: 22,
      fontWeight: '900',
      color: colors.primary,
    },
    altTotalText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
      fontWeight: '600',
    },
    receiptFooter: {
      alignItems: 'center',
      marginTop: 18,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    footerNote: {
      fontSize: 12,
      fontStyle: 'italic',
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 18,
    },
    appTagline: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 4,
    },
    barcodeBox: {
      marginTop: 10,
    },
    barcodeText: {
      fontSize: 13,
      fontWeight: 'bold',
      letterSpacing: 4,
      color: colors.textMuted,
    },
    actionsFooter: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 10,
    },
    actionBtn: {
      height: 48,
      borderRadius: 14,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    downloadPdfBtn: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    downloadPdfText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    secondaryBtnRow: {
      flexDirection: 'row',
      gap: 10,
    },
    secondaryBtn: {
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    secondaryBtnText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '700',
    },
    doneBtn: {
      height: 38,
      justifyContent: 'center',
      alignItems: 'center',
    },
    doneBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });
}
