import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, useCurrency } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProductCard({ product, onEdit, onDelete, onPress }) {
  const { colors } = useTheme();
  const { t, tCategory } = useLanguage();
  const { formatCurrency } = useCurrency();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const isLowStock = product.stockQuantity <= product.lowStockThreshold;
  const stockColor = isLowStock ? colors.danger : colors.textSecondary;

  const avatarColors = [
    '#4C6EF5', '#7950F2', '#F76707', '#2F9E44', '#1971C2', '#C2255C',
  ];
  const avatarBg = avatarColors[product.name.charCodeAt(0) % avatarColors.length];
  const initials = product.name.slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {product.imageUri ? (
        <Image source={{ uri: product.imageUri }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{tCategory(product.category)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.stockRow}>
          {isLowStock ? (
            <Ionicons name="warning" size={12} color={colors.danger} style={{ marginRight: 3 }} />
          ) : null}
          <Text style={[styles.stockText, { color: stockColor }]}>
            {t('in_stock_label', { count: product.stockQuantity })}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={onEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash" size={14} color={colors.danger} />
          </TouchableOpacity>
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
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
    info: { flex: 1, justifyContent: 'center' },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flexShrink: 1,
    },
    categoryBadge: {
      backgroundColor: colors.primaryLight,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    categoryText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
    stockRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    stockText: { fontSize: 12, fontWeight: '500' },
    right: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
    price: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    actions: { flexDirection: 'row', gap: 6, marginTop: 6 },
    actionBtn: {
      width: 30, height: 30, borderRadius: 8,
      justifyContent: 'center', alignItems: 'center',
    },
    editBtn: { backgroundColor: colors.primaryLight },
    deleteBtn: { backgroundColor: colors.dangerLight },
  });
}
