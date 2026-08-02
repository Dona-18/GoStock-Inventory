import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import { formatDate, formatTime } from '../utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function SaleCard({ sale, onDelete, onViewInvoice }) {
  const { colors } = useTheme();
  const { locale } = useLanguage();
  const { formatCurrency } = useCurrency();
  const { products } = useApp();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const firstProductId = sale.productId || (Array.isArray(sale.items) && sale.items[0]?.productId);
  const product = products.find((p) => p.id === firstProductId);
  const imageUri = sale.imageUri || (Array.isArray(sale.items) && sale.items[0]?.imageUri) || product?.imageUri;

  const isMulti = Array.isArray(sale.items) && sale.items.length > 1;
  const itemCount = isMulti ? sale.items.length : 1;

  const displayTitle = Array.isArray(sale.items) && sale.items.length > 0
    ? sale.items.map((i) => `${i.productName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ')
    : (sale.productName && !sale.productName.includes('+')
        ? (sale.quantity > 1 ? `${sale.productName} x${sale.quantity}` : sale.productName)
        : sale.productName);

  const avatarColors = [
    '#4C6EF5', '#7950F2', '#F76707', '#2F9E44', '#1971C2', '#C2255C',
  ];
  const avatarBg = avatarColors[(displayTitle || 'P').charCodeAt(0) % avatarColors.length];
  const initials = isMulti ? '🛒' : (displayTitle || 'P').slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onViewInvoice ? () => onViewInvoice(sale) : undefined}
      activeOpacity={onViewInvoice ? 0.75 : 1}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.avatar} />
      ) : isMulti ? (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="cart" size={20} color="#FFFFFF" />
        </View>
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.productName} numberOfLines={1}>{displayTitle}</Text>
        <Text style={styles.meta}>
          {isMulti
            ? `${itemCount} items · ${sale.quantity} units total`
            : `${sale.quantity} × ${formatCurrency(sale.unitPrice)}`}
        </Text>
        <Text style={styles.time}>
          {formatDate(sale.createdAt, locale)} · {formatTime(sale.createdAt, locale)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.total}>{formatCurrency(sale.totalPrice)}</Text>
        <View style={styles.actionRow}>
          {onViewInvoice && (
            <TouchableOpacity
              style={styles.receiptBtn}
              onPress={() => onViewInvoice(sale)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="receipt-outline" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginHorizontal: 16,
      marginVertical: 5,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    avatar: {
      width: 44, height: 44, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    info: { flex: 1 },
    productName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    time: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    total: { fontSize: 15, fontWeight: '800', color: colors.primary },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    receiptBtn: {
      backgroundColor: colors.primaryLight,
      borderRadius: 6, padding: 4,
    },
    deleteBtn: {
      backgroundColor: colors.dangerLight,
      borderRadius: 6, padding: 4,
    },
  });
}
