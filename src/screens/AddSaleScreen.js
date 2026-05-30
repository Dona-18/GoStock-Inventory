import React, { useState, useMemo } from 'react';
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
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatters';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function AddSaleScreen({ navigation }) {
  const { products, recordSale } = useApp();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [isSaving, setIsSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return products;
    const q = searchProduct.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, searchProduct]);

  const qty = parseInt(quantity, 10);
  const totalPrice = selectedProduct && !isNaN(qty) && qty > 0
    ? selectedProduct.price * qty : 0;

  const handleSave = async () => {
    if (!selectedProduct) { Alert.alert(t('missing_product_title'), t('missing_product_msg')); return; }
    if (!quantity || isNaN(qty) || qty <= 0) { Alert.alert(t('invalid_qty_title'), t('invalid_qty_msg')); return; }
    setIsSaving(true);
    try {
      const result = await recordSale({ productId: selectedProduct.id, quantity: qty });
      if (result.success) {
        Alert.alert(
          t('sale_recorded_title'),
          t('sale_recorded_msg', { qty, name: selectedProduct.name, total: formatCurrency(totalPrice) }),
          [
            { text: t('ok'), onPress: () => navigation.goBack() },
          ]
        );
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('record_sale_btn')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>{t('field_select_product')}</Text>
          <TouchableOpacity style={styles.productSelector} onPress={() => setShowPicker(true)}>
            {selectedProduct ? (
              <View style={styles.selectedProduct}>
                {selectedProduct.imageUri ? (
                  <Image source={{ uri: selectedProduct.imageUri }} style={[styles.productAvatar, { backgroundColor: colors.card }]} />
                ) : (
                  <View style={[styles.productAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.productAvatarText}>{selectedProduct.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{selectedProduct.name}</Text>
                  <Text style={styles.productStock}>
                    {t('picker_in_stock', {
                      count: selectedProduct.stockQuantity,
                      price: formatCurrency(selectedProduct.price),
                    })}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.placeholderRow}>
                <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                <Text style={styles.placeholder}>{t('tap_to_select_product')}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 20 }]}>{t('field_qty')}</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => {
              const n = Math.max(1, (parseInt(quantity, 10) || 1) - 1);
              setQuantity(n.toString());
            }}>
              <Ionicons name="remove" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.qtyInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity style={styles.qtyBtn} onPress={() => {
              const max = selectedProduct?.stockQuantity ?? 999;
              const n = Math.min(max, (parseInt(quantity, 10) || 0) + 1);
              setQuantity(n.toString());
            }}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {selectedProduct && (
            <Text style={styles.stockHint}>{t('max_available', { count: selectedProduct.stockQuantity })}</Text>
          )}

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>{t('total_amount')}</Text>
            <Text
              style={styles.totalValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}
            >
              {formatCurrency(totalPrice)}
            </Text>
          </View>

          {selectedProduct && selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold && (
            <View style={styles.warnBox}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.warnText}>
                {t('low_stock_warning_qty', { count: selectedProduct.stockQuantity })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{isSaving ? t('recording') : t('confirm_sale_btn')}</Text>
          </TouchableOpacity>
        </View>
        </FadeInView>
      </KeyboardAvoidingView>

      {/* Product Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPicker(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('picker_select_product')}</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder={t('search')}
              placeholderTextColor={colors.textMuted}
              value={searchProduct}
              onChangeText={setSearchProduct}
            />
          </View>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.pickerItem, selectedProduct?.id === item.id && styles.pickerItemActive]}
                onPress={() => { setSelectedProduct(item); setShowPicker(false); setSearchProduct(''); }}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={[styles.pickerAvatar, { backgroundColor: colors.card }]} />
                ) : (
                  <View style={[styles.pickerAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.pickerAvatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.pickerInfo}>
                  <Text style={styles.pickerName}>{item.name}</Text>
                  <Text style={styles.pickerMeta}>
                    {t('picker_in_stock', {
                      count: item.stockQuantity,
                      price: formatCurrency(item.price),
                    })}
                  </Text>
                </View>
                {selectedProduct?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <Text style={{ color: colors.textMuted }}>{t('no_products_modal')}</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.textPrimary },
    content: { flex: 1, padding: 20 },
    label: {
      fontSize: 13, fontWeight: '600', color: colors.textSecondary,
      marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    productSelector: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 16,
      padding: 14, borderWidth: 1.5, borderColor: colors.border,
      justifyContent: 'space-between',
    },
    selectedProduct: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    productAvatar: {
      width: 40, height: 40, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    productAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    productStock: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    placeholderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    placeholder: { fontSize: 14, color: colors.textMuted },
    quantityRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 16,
      borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden',
    },
    qtyBtn: {
      width: 56, height: 56, justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.primaryLight,
    },
    qtyInput: { flex: 1, height: 56, fontSize: 22, fontWeight: '800', color: colors.textPrimary },
    stockHint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
    totalBox: {
      marginTop: 24, backgroundColor: colors.primaryLight,
      borderRadius: 16, padding: 20, alignItems: 'center',
      overflow: 'hidden',
    },
    totalLabel: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 4 },
    totalValue: { fontSize: 36, fontWeight: '900', color: colors.primary, width: '100%', textAlign: 'center' },
    warnBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.warningLight, borderRadius: 12, padding: 12, marginTop: 12,
      borderWidth: 1, borderColor: 'rgba(255, 159, 67, 0.18)',
    },
    warnText: { fontSize: 13, color: colors.warning, fontWeight: '600' },
    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 24,
      backgroundColor: 'transparent',
    },
    saveBtn: {
      height: 54,
      backgroundColor: colors.primary,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    modal: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    modalSearch: {
      flexDirection: 'row', alignItems: 'center',
      margin: 16, backgroundColor: colors.card, borderRadius: 12, padding: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    modalSearchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    pickerItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.card,
    },
    pickerItemActive: { backgroundColor: colors.primaryLight },
    pickerAvatar: {
      width: 40, height: 40, borderRadius: 10,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    pickerAvatarText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    pickerInfo: { flex: 1 },
    pickerName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    pickerMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  });
}
