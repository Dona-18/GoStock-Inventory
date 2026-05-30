import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

export default function InventoryScreen({ navigation }) {
  const { products, deleteProduct, lowStockProducts } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleDelete = (product) => {
    Alert.alert(
      t('delete_product_title'),
      t('delete_product_confirm', { name: product.name }),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('delete'), style: 'destructive', onPress: () => deleteProduct(product.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <FadeInView style={{ flex: 1 }}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('tab_inventory')}</Text>
        {lowStockProducts.length > 0 && (
          <TouchableOpacity
            style={styles.alertBadge}
            onPress={() => navigation.navigate('Alerts')}
            activeOpacity={0.8}
          >
            <Ionicons name="warning" size={12} color="#FFF" />
            <Text style={styles.alertBadgeText}>{lowStockProducts.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search_placeholder')}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{t('items')}</Text>
        <Text style={styles.sectionCount}>
          {filtered.length === 1
            ? t('product_count_single')
            : t('product_count_plural', { count: filtered.length })}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={() => navigation.navigate('AddProduct', { product: item })}
            onDelete={() => handleDelete(item)}
            onPress={() => navigation.navigate('AddProduct', { product: item })}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title={search ? t('no_products_found') : t('no_products_yet')}
            subtitle={search ? t('search_empty_subtitle') : t('inventory_empty_subtitle')}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddProduct', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
      </FadeInView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4,
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, flex: 1 },
    alertBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.danger, borderRadius: 10,
      paddingHorizontal: 8, paddingVertical: 3, gap: 3,
    },
    alertBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
    searchWrap: {
      flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
      gap: 10, alignItems: 'center',
    },
    searchBar: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary },
    filterBtn: {
      width: 44, height: 44, borderRadius: 14,
      backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
      borderWidth: 1, borderColor: colors.border,
    },
    sectionHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, marginBottom: 6,
    },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    sectionCount: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    fab: {
      position: 'absolute', right: 20, bottom: 24,
      width: 56, height: 56, borderRadius: 18,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    },
  });
}
