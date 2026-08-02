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
              <Ionicons name="document-text-outline" size={18} color="#000000" />
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
          {/* Ticket Receipt Card with Notches */}
          <View style={styles.receiptCard}>
            <View style={styles.notchLeft} />
            <View style={styles.notchRight} />

            {/* Black Top Banner Accent */}
            <View style={styles.topAccentBar} />

            {/* Store Branding Header */}
            <View style={styles.storeHeader}>
              <Text style={styles.storeName}>{storeName}</Text>
              {storePhone ? (
                <Text style={styles.storeMeta}>📞 {storePhone}</Text>
              ) : null}
              {storeAddress ? (
                <Text style={styles.storeMeta}>📍 {storeAddress}</Text>
              ) : null}
            </View>

            <View style={styles.dividerLine} />

            {/* Meta Grid Information */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('receipt_no')}</Text>
                <Text style={styles.receiptNoCode}>{receiptNo}</Text>
              </View>
              <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.metaLabel}>{t('invoice_date')}</Text>
                <Text style={styles.metaValue}>{formattedDate} {formattedTime}</Text>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('pay_method_label')}</Text>
                <Text style={styles.metaValueBold}>
                  {sale.paymentMethod === 'khqr' ? t('pay_method_khqr') : t('pay_method_cash')}
                </Text>
              </View>
              <View style={[styles.metaItem, { alignItems: 'flex-end' }]}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.statusPaidText}>✓ {t('invoice_status_paid')}</Text>
              </View>
            </View>

            <View style={styles.dividerLine} />

            {/* Item Table matching User Template */}
            <View style={styles.tableContainer}>
              {/* Black Table Header Row */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.thBox, { flex: 2.2, alignItems: 'center' }]}>
                  <Text style={styles.thText}>{t('tbl_name_of_items')}</Text>
                </View>
                <View style={[styles.thBox, { flex: 1, alignItems: 'center' }]}>
                  <Text style={styles.thText}>{t('tbl_quantity')}</Text>
                </View>
                <View style={[styles.thBox, { flex: 1.3, alignItems: 'center' }]}>
                  <Text style={styles.thText}>{t('tbl_price_per_unit')}</Text>
                </View>
                <View style={[styles.thBox, { flex: 1.3, alignItems: 'center' }]}>
                  <Text style={styles.thText}>{t('tbl_total_price')}</Text>
                </View>
              </View>

              {/* Table Rows */}
              {itemsList.map((item, idx) => (
                <View key={idx} style={styles.tableBodyRow}>
                  <View style={{ flex: 2.2 }}>
                    <Text style={styles.itemNameText}>{item.productName}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.itemQtyText}>{item.quantity}</Text>
                  </View>
                  <View style={{ flex: 1.3, alignItems: 'flex-end' }}>
                    <Text style={styles.itemUnitPriceText}>{formatCurrency(item.unitPrice)}</Text>
                  </View>
                  <View style={{ flex: 1.3, alignItems: 'flex-end' }}>
                    <Text style={styles.itemTotalPriceText}>{formatCurrency(item.totalPrice)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.dividerLine} />

            {/* Price Summary Breakdown (Right-Aligned) */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tbl_subtotal')}</Text>
                <Text style={styles.summaryVal}>{mainTotal}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tbl_tax')}</Text>
                <Text style={styles.summaryVal}>$0.00</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 6 }]}>
                <Text style={styles.grandTotalLabel}>{t('tbl_grand_total')}</Text>
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
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#FFF" />
                <Text style={styles.downloadPdfText}>{t('download_pdf')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { flex: 1 }]}
              onPress={handlePrint}
              disabled={activeAction !== null}
            >
              {activeAction === 'print' ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={16} color="#000000" />
                  <Text style={styles.secondaryBtnText}>{t('print_invoice')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn, { flex: 1 }]}
              onPress={handleShare}
              disabled={activeAction !== null}
            >
              {activeAction === 'share' ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Ionicons name="share-social-outline" size={16} color="#000000" />
                  <Text style={styles.secondaryBtnText}>{t('share_invoice')}</Text>
                </>
              )}
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
      backgroundColor: '#F3F4F6',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#000000',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 30,
    },
    receiptCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 4,
    },
    notchLeft: {
      position: 'absolute',
      left: -12,
      top: '48%',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      zIndex: 10,
    },
    notchRight: {
      position: 'absolute',
      right: -12,
      top: '48%',
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      zIndex: 10,
    },
    topAccentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 5,
      backgroundColor: '#000000',
    },
    storeHeader: {
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 14,
    },
    storeName: {
      fontSize: 22,
      fontWeight: '900',
      color: '#000000',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    storeMeta: {
      fontSize: 12,
      color: '#4B5563',
      marginTop: 2,
    },
    dividerLine: {
      height: 1,
      backgroundColor: '#E5E7EB',
      marginVertical: 12,
    },
    metaGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    metaItem: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 11,
      color: '#6B7280',
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    receiptNoCode: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
      marginTop: 2,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    metaValue: {
      fontSize: 12,
      fontWeight: '700',
      color: '#000000',
      marginTop: 2,
    },
    metaValueBold: {
      fontSize: 12,
      fontWeight: '800',
      color: '#000000',
      marginTop: 2,
    },
    statusPaidText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#000000',
      marginTop: 2,
    },
    tableContainer: {
      marginTop: 8,
      marginBottom: 8,
    },
    tableHeaderRow: {
      flexDirection: 'row',
      gap: 4,
      marginBottom: 8,
    },
    thBox: {
      backgroundColor: '#000000',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 4,
      justifyContent: 'center',
    },
    thText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    tableBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    itemNameText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#000000',
    },
    itemQtyText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#111827',
    },
    itemUnitPriceText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#111827',
    },
    itemTotalPriceText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
    },
    summaryContainer: {
      width: '70%',
      alignSelf: 'flex-end',
      paddingTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    summaryLabel: {
      fontSize: 13,
      color: '#4B5563',
      fontWeight: '500',
    },
    summaryVal: {
      fontSize: 13,
      fontWeight: '600',
      color: '#000000',
    },
    summaryValBold: {
      fontSize: 13,
      fontWeight: '800',
      color: '#000000',
    },
    grandTotalLabel: {
      fontSize: 15,
      fontWeight: '900',
      color: '#000000',
    },
    grandTotalVal: {
      fontSize: 17,
      fontWeight: '900',
      color: '#000000',
    },
    altTotalText: {
      fontSize: 12,
      color: '#4B5563',
      textAlign: 'right',
      marginTop: 4,
      fontWeight: '600',
    },
    receiptFooter: {
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    footerNote: {
      fontSize: 12,
      fontStyle: 'italic',
      color: '#000000',
      fontWeight: '600',
      textAlign: 'center',
    },
    appTagline: {
      fontSize: 10,
      color: '#6B7280',
      marginTop: 4,
    },
    barcodeBox: {
      marginTop: 10,
    },
    barcodeText: {
      fontSize: 13,
      fontWeight: 'bold',
      letterSpacing: 4,
      color: '#000000',
    },
    actionsFooter: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
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
      backgroundColor: '#000000',
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
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    secondaryBtnText: {
      color: '#000000',
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
      color: '#4B5563',
    },
  });
}
