import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';
import InvoiceModal from '../components/InvoiceModal';

export default function AddSaleScreen({ navigation }) {
  const { products, recordSale } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { currency, exchangeRate, formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cart, setCart] = useState([]); // [{ productId, productName, quantity, unitPrice, stockQuantity, imageUri }]
  const [searchProduct, setSearchProduct] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'khqr'
  const [toastMessage, setToastMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createdSale, setCreatedSale] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // Automatically clear toast message after 2 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return products;
    const q = searchProduct.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchProduct]);

  const addToCart = (product) => {
    if (!product || product.stockQuantity <= 0) {
      Alert.alert(t('error'), t('error_stock_item', { name: product.name, count: 0 }));
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          Alert.alert(t('error'), t('error_stock_item', { name: product.name, count: product.stockQuantity }));
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          stockQuantity: product.stockQuantity,
          imageUri: product.imageUri,
        },
      ];
    });

    setToastMessage(t('toast_added_to_cart', { name: product.name }));
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stockQuantity) {
              Alert.alert(t('error'), t('error_stock_item', { name: item.productName, count: item.stockQuantity }));
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((sum, i) => sum + i.quantity, 0);
  }, [cart]);

  const isUSD = currency === 'USD';
  const rate = exchangeRate || 4000;
  let altTotal = '';
  if (isUSD) {
    const rielVal = Math.round(cartTotal * rate);
    altTotal = `${rielVal.toLocaleString()} ៛`;
  } else {
    const usdVal = (cartTotal / (rate || 1)).toFixed(2);
    altTotal = `$${usdVal}`;
  }

  const handleSave = async () => {
    if (cart.length === 0) {
      Alert.alert(t('missing_product_title'), t('error_empty_cart'));
      return;
    }
    setIsSaving(true);
    try {
      const result = await recordSale({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
      });
      if (result.success) {
        setCreatedSale(result.sale);
        setShowInvoice(true);
      } else {
        Alert.alert(t('cannot_record_sale'), result.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FadeInView style={{ flex: 1 }}>
          {/* Top POS Header */}
          <View style={styles.header}>
            <View style={styles.posBadge}>
              <Ionicons name="cart" size={20} color="#FFFFFF" />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>GoStock POS</Text>
              <Text style={styles.headerSubtitle}>Point of Sale Terminal</Text>
            </View>
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('SalesLog')}
            >
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* User-Friendly Toast Feedback Bar */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* Search input */}
          <View style={styles.searchBarRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search_placeholder')}
                placeholderTextColor={colors.textMuted}
                value={searchProduct}
                onChangeText={setSearchProduct}
              />
              {searchProduct.length > 0 && (
                <TouchableOpacity onPress={() => setSearchProduct('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Single Integrated Scroll View (Products Catalog + Cart + Bill Summary) */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 1: CATALOG PRODUCTS GRID                              */}
            {/* ───────────────────────────────────────────────────────────── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('pos_view_products')}</Text>
              <Text style={styles.sectionCountText}>({filteredProducts.length})</Text>
            </View>

            <View style={styles.productsGrid}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyGridBox}>
                  <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
                  <Text style={styles.emptyGridText}>{t('no_products_found')}</Text>
                </View>
              ) : (
                filteredProducts.map((item) => {
                  const inCart = cart.find((i) => i.productId === item.id);
                  const inCartQty = inCart ? inCart.quantity : 0;
                  const isOut = item.stockQuantity <= 0;
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= (item.minThreshold || 5);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridCard,
                        inCartQty > 0 && styles.gridCardInCart,
                        isOut && styles.gridCardDisabled,
                      ]}
                      onPress={() => addToCart(item)}
                      disabled={isOut}
                      activeOpacity={0.8}
                    >
                      {inCartQty > 0 && (
                        <View style={styles.gridCardBadge}>
                          <Text style={styles.gridCardBadgeText}>{inCartQty}</Text>
                        </View>
                      )}

                      {item.imageUri ? (
                        <Image source={{ uri: item.imageUri }} style={styles.gridImage} />
                      ) : (
                        <View style={[styles.gridAvatar, { backgroundColor: colors.primaryLight }]}>
                          <Text style={styles.gridAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                        </View>
                      )}

                      <Text style={styles.gridTitle} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.gridPrice}>{formatCurrency(item.price)}</Text>

                      <View style={styles.gridFooterRow}>
                        {isOut ? (
                          <Text style={styles.outOfStockTag}>{t('out_of_stock_tag')}</Text>
                        ) : (
                          <Text style={[styles.gridStock, isLow && { color: colors.warning }]}>
                            {t('in_stock_label', { count: item.stockQuantity })}
                          </Text>
                        )}
                        <View style={styles.plusCircle}>
                          <Ionicons name="add" size={16} color="#FFFFFF" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* ───────────────────────────────────────────────────────────── */}
            {/* SECTION 2: CART ITEMS LIST                                    */}
            {/* ───────────────────────────────────────────────────────────── */}
            <View style={[styles.posCartHeaderRow, { marginTop: 18 }]}>
              <Text style={styles.posCartHeaderTitle}>Products</Text>
              <View style={styles.redPillBadge}>
                <Text style={styles.redPillBadgeText}>{totalUnits}</Text>
              </View>
              {cart.length > 0 && (
                <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => setCart([])}>
                  <Text style={styles.clearCartText}>{t('clear_cart')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyCartBox}>
                <Ionicons name="cart-outline" size={32} color={colors.textMuted} />
                <Text style={styles.emptyCartTitle}>{t('empty_cart_title')}</Text>
                <Text style={styles.emptyCartSubtitle}>{t('empty_cart_subtitle')}</Text>
              </View>
            ) : (
              <View>
                {/* Item List Cards */}
                {cart.map((item) => {
                  const codeTag = `[${String(item.productId).slice(-6)}]`;
                  return (
                    <View key={item.productId} style={styles.posItemCard}>
                      <View style={styles.posImageSquare}>
                        {item.imageUri ? (
                          <Image source={{ uri: item.imageUri }} style={styles.posSquareImg} />
                        ) : (
                          <Ionicons name="cube-outline" size={22} color="#38BDF8" />
                        )}
                      </View>

                      <View style={styles.posItemDetails}>
                        <Text style={styles.posItemTitle} numberOfLines={1}>
                          {item.productName} <Text style={styles.posCodeTag}>{codeTag}</Text>
                        </Text>
                        <Text style={styles.posItemPrice}>{formatCurrency(item.unitPrice)}</Text>
                      </View>

                      <View style={styles.posStepperRow}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateCartQty(item.productId, -1)}
                        >
                          <Ionicons name="remove" size={14} color="#38BDF8" />
                        </TouchableOpacity>
                        <Text style={styles.stepperQtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() => updateCartQty(item.productId, 1)}
                        >
                          <Ionicons name="add" size={14} color="#38BDF8" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* ───────────────────────────────────────────────────────────── */}
                {/* BILL SUMMARY CARD                                             */}
                {/* ───────────────────────────────────────────────────────────── */}
                <View style={styles.billSummaryCard}>
                  <Text style={styles.billSummaryTitle}>Bill Summary</Text>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Total Items:</Text>
                    <Text style={styles.billValue}>{cart.length}({totalUnits})</Text>
                  </View>

                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Total Amount:</Text>
                    <Text style={styles.billValue}>{formatCurrency(cartTotal)}</Text>
                  </View>

                  <View style={styles.billDivider} />

                  <View style={[styles.billRow, { marginTop: 4 }]}>
                    <Text style={styles.grandTotalText}>Grand Total</Text>
                    <Text style={styles.grandTotalValText}>{formatCurrency(cartTotal)}</Text>
                  </View>
                </View>

                {/* ───────────────────────────────────────────────────────────── */}
                {/* PAYMENT METHOD SECTION                                        */}
                {/* ───────────────────────────────────────────────────────────── */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.paymentSectionLabel}>{t('pay_method_label')}</Text>
                  <View style={styles.paymentChipsRow}>
                    <TouchableOpacity
                      style={[
                        styles.paymentOptionCard,
                        paymentMethod === 'cash' && styles.paymentOptionCardActive,
                      ]}
                      onPress={() => setPaymentMethod('cash')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={18}
                        color={paymentMethod === 'cash' ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'cash' && styles.paymentOptionTextActive,
                        ]}
                      >
                        {t('pay_method_cash')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.paymentOptionCard,
                        paymentMethod === 'khqr' && styles.paymentOptionCardActive,
                      ]}
                      onPress={() => setPaymentMethod('khqr')}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="qr-code-outline"
                        size={18}
                        color={paymentMethod === 'khqr' ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'khqr' && styles.paymentOptionTextActive,
                        ]}
                      >
                        {t('pay_method_khqr')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Quick Checkout Bar */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>{t('total_amount')}</Text>
                <Text style={styles.unitsSummary}>
                  {t('total_items_qty', { items: cart.length, qty: totalUnits })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.totalValue}>{formatCurrency(cartTotal)}</Text>
                {altTotal && cartTotal > 0 ? (
                  <Text style={styles.altTotalVal}>({altTotal})</Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, (isSaving || cart.length === 0) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving || cart.length === 0}
            >
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={styles.saveBtnText}>
                {isSaving ? t('recording') : t('checkout_btn', { total: formatCurrency(cartTotal) })}
              </Text>
            </TouchableOpacity>
          </View>
        </FadeInView>
      </KeyboardAvoidingView>

      {/* Invoice Modal after Sale */}
      <InvoiceModal
        visible={showInvoice}
        sale={createdSale}
        onClose={() => {
          setShowInvoice(false);
          setCart([]);
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    posBadge: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 12, position: 'relative',
    },
    onlineDot: {
      position: 'absolute', top: -2, right: -2,
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: colors.success, borderWidth: 1.5, borderColor: colors.card,
    },
    headerTextGroup: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
    headerSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
    historyBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    },
    toastBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.success, paddingHorizontal: 16, paddingVertical: 10,
      marginHorizontal: 16, marginTop: 10, borderRadius: 12,
    },
    toastText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    searchBarRow: {
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
    },
    searchInputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 42,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    mainScroll: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
    sectionHeaderRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 8,
    },
    sectionTitle: {
      fontSize: 15, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    sectionCountText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    productsGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    },
    gridCard: {
      width: '31.3%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    gridCardInCart: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    gridCardDisabled: {
      opacity: 0.5,
    },
    gridCardBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 3,
      zIndex: 2,
    },
    gridCardBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
    gridImage: { width: '100%', height: 48, borderRadius: 8, marginBottom: 4, resizeMode: 'cover' },
    gridAvatar: {
      width: '100%', height: 48, borderRadius: 8,
      justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    gridAvatarText: { color: colors.primary, fontWeight: '900', fontSize: 14 },
    gridTitle: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
    gridPrice: { fontSize: 12, fontWeight: '900', color: colors.primary, marginTop: 1 },
    gridFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 4,
    },
    gridStock: { fontSize: 9, color: colors.textMuted, fontWeight: '600' },
    outOfStockTag: { fontSize: 9, color: colors.danger, fontWeight: '800' },
    plusCircle: {
      width: 20,
      height: 20,
      borderRadius: 6,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyGridBox: { width: '100%', alignItems: 'center', paddingVertical: 20, gap: 4 },
    emptyGridText: { fontSize: 12, color: colors.textMuted },
    posCartHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    posCartHeaderTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    redPillBadge: {
      backgroundColor: '#EF4444',
      borderRadius: 12,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    redPillBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
    },
    clearCartText: { fontSize: 12, fontWeight: '700', color: colors.danger },
    emptyCartBox: {
      alignItems: 'center',
      paddingVertical: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    emptyCartTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 4 },
    emptyCartSubtitle: { fontSize: 12, color: colors.textMuted },
    posItemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    posImageSquare: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#E0F2FE',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      overflow: 'hidden',
    },
    posSquareImg: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    posItemDetails: {
      flex: 1,
      marginRight: 8,
    },
    posItemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    posCodeTag: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
    },
    posItemPrice: {
      fontSize: 13,
      fontWeight: '800',
      color: '#6366F1',
      marginTop: 2,
    },
    posStepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepperBtn: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: '#E0F2FE',
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepperQtyText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      minWidth: 14,
      textAlign: 'center',
    },
    billSummaryCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    billSummaryTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    billRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    billLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    billValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    billDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 8,
    },
    grandTotalText: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    grandTotalValText: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    paymentSectionLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
    },
    paymentChipsRow: {
      flexDirection: 'row',
      gap: 10,
    },
    paymentOptionCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    paymentOptionCardActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    paymentOptionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    paymentOptionTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    footer: {
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24,
      backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    totalLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
    unitsSummary: { fontSize: 11, color: colors.primary, fontWeight: '700', marginTop: 1 },
    totalValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
    altTotalVal: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', marginTop: 1 },
    saveBtn: {
      height: 50, backgroundColor: colors.primary, borderRadius: 16,
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  });
}
