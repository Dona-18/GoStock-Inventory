import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
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

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'cart'
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

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
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

          {/* Segment View Switcher (Products vs Cart) */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'products' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('products')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={activeTab === 'products' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.segmentText, activeTab === 'products' && styles.segmentTextActive]}>
                {t('pos_view_products')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'cart' && styles.segmentBtnActive]}
              onPress={() => setActiveTab('cart')}
            >
              <Ionicons
                name="cart-outline"
                size={16}
                color={activeTab === 'cart' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.segmentText, activeTab === 'cart' && styles.segmentTextActive]}>
                {t('pos_view_cart', { count: totalUnits })}
              </Text>
              {cart.length > 0 && (
                <View style={styles.tabBadgeNum}>
                  <Text style={styles.tabBadgeNumText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 1: PRODUCTS CATALOG VIEW                                  */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <View style={{ flex: 1 }}>
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

              {/* Product Grid */}
              <FlatList
                data={filteredProducts}
                numColumns={2}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.gridContent}
                columnWrapperStyle={{ gap: 12 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const inCart = cart.find((i) => i.productId === item.id);
                  const inCartQty = inCart ? inCart.quantity : 0;
                  const isOut = item.stockQuantity <= 0;
                  const isLow = item.stockQuantity <= item.lowStockThreshold;

                  return (
                    <TouchableOpacity
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
                }}
                ListEmptyComponent={
                  <View style={styles.emptyGridBox}>
                    <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
                    <Text style={styles.emptyGridText}>{t('no_products_found')}</Text>
                  </View>
                }
              />
            </View>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* TAB 2: CART ITEM LIST VIEW                                    */}
          {/* ───────────────────────────────────────────────────────────── */}
          {activeTab === 'cart' && (
            <View style={styles.cartContainer}>
              <View style={styles.cartHeader}>
                <Text style={styles.cartTitle}>{t('cart_title')}</Text>
                {cart.length > 0 && (
                  <TouchableOpacity onPress={() => setCart([])}>
                    <Text style={styles.clearCartText}>{t('clear_cart')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {cart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <View style={styles.emptyCartIcon}>
                    <Ionicons name="cart-outline" size={40} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyCartTitle}>{t('empty_cart_title')}</Text>
                  <Text style={styles.emptyCartSubtitle}>{t('empty_cart_subtitle')}</Text>
                  <TouchableOpacity
                    style={styles.browseProductsBtn}
                    onPress={() => setActiveTab('products')}
                  >
                    <Ionicons name="grid-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.browseProductsBtnText}>{t('pos_view_products')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={cart}
                  keyExtractor={(item) => item.productId}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  renderItem={({ item }) => {
                    const avatarColors = ['#4C6EF5', '#7950F2', '#F76707', '#2F9E44', '#1971C2'];
                    const avatarBg = avatarColors[(item.productName || 'P').charCodeAt(0) % avatarColors.length];

                    return (
                      <View style={styles.cartItemCard}>
                        {item.imageUri ? (
                          <Image source={{ uri: item.imageUri }} style={styles.itemAvatar} />
                        ) : (
                          <View style={[styles.itemAvatar, { backgroundColor: avatarBg }]}>
                            <Text style={styles.itemAvatarText}>{item.productName.slice(0, 2).toUpperCase()}</Text>
                          </View>
                        )}

                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName} numberOfLines={1}>{item.productName}</Text>
                          <Text style={styles.itemMeta}>
                            {formatCurrency(item.unitPrice)} · Max {item.stockQuantity}
                          </Text>
                        </View>

                        <View style={styles.qtyBox}>
                          <TouchableOpacity
                            style={styles.qtyActionBtn}
                            onPress={() => updateCartQty(item.productId, -1)}
                          >
                            <Ionicons name="remove" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyActionBtn}
                            onPress={() => updateCartQty(item.productId, 1)}
                          >
                            <Ionicons name="add" size={16} color={colors.primary} />
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.itemSubtotal}>
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </Text>

                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() => removeFromCart(item.productId)}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              )}
            </View>
          )}

          {/* Sticky Bottom Quick Checkout Bar */}
          <View style={styles.footer}>
            {/* Quick Payment Method Chips */}
            <View style={styles.paymentMethodRow}>
              {[
                { key: 'cash', label: t('pay_method_cash') },
                { key: 'khqr', label: t('pay_method_khqr') },
              ].map((pm) => (
                <TouchableOpacity
                  key={pm.key}
                  style={[styles.pmChip, paymentMethod === pm.key && styles.pmChipActive]}
                  onPress={() => setPaymentMethod(pm.key)}
                >
                  <Text style={[styles.pmChipText, paymentMethod === pm.key && styles.pmChipTextActive]}>
                    {pm.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
          navigation.navigate('SalesLog');
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
    segmentContainer: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 10,
      marginBottom: 6,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
      position: 'relative',
    },
    segmentBtnActive: {
      backgroundColor: colors.primaryLight,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.primary,
      fontWeight: '800',
    },
    tabBadgeNum: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    tabBadgeNumText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },
    searchBarRow: {
      paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6,
    },
    searchInputWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14, paddingHorizontal: 14, height: 42,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    gridContent: { padding: 16, paddingBottom: 20 },
    gridCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      position: 'relative',
      marginHorizontal: 0,
      marginBottom: 12,
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
      top: 8,
      right: 8,
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
      zIndex: 2,
    },
    gridCardBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    gridImage: { width: '100%', height: 75, borderRadius: 10, marginBottom: 8, resizeMode: 'cover' },
    gridAvatar: {
      width: '100%', height: 75, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    gridAvatarText: { color: colors.primary, fontWeight: '900', fontSize: 18 },
    gridTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
    gridPrice: { fontSize: 14, fontWeight: '900', color: colors.primary, marginTop: 2 },
    gridFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    gridStock: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    outOfStockTag: { fontSize: 10, color: colors.danger, fontWeight: '800' },
    plusCircle: {
      width: 26,
      height: 26,
      borderRadius: 8,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyGridBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyGridText: { fontSize: 14, color: colors.textMuted },
    cartContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
    cartHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 10,
    },
    cartTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.5 },
    clearCartText: { fontSize: 12, fontWeight: '700', color: colors.danger },
    emptyCartBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
    emptyCartIcon: {
      width: 64, height: 64, borderRadius: 18,
      backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center',
      marginBottom: 10, borderWidth: 1, borderColor: colors.border,
    },
    emptyCartTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
    emptyCartSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
    browseProductsBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.primary, borderRadius: 12,
      paddingHorizontal: 18, paddingVertical: 10, marginTop: 16,
    },
    browseProductsBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    cartItemCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 16, padding: 12, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    itemAvatar: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    itemAvatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    itemInfo: { flex: 1, marginRight: 8 },
    itemName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    qtyBox: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, marginRight: 8,
    },
    qtyActionBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    qtyText: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, paddingHorizontal: 4 },
    itemSubtotal: { fontSize: 14, fontWeight: '800', color: colors.primary, marginRight: 8 },
    removeBtn: { padding: 4 },
    footer: {
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24,
      backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    },
    paymentMethodRow: {
      flexDirection: 'row', gap: 8, marginBottom: 10,
    },
    pmChip: {
      flex: 1, paddingVertical: 6, borderRadius: 10,
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    pmChipActive: {
      backgroundColor: colors.primaryLight, borderColor: colors.primary,
    },
    pmChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
    pmChipTextActive: { color: colors.primary, fontWeight: '800' },
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
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  });
}
