import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = [
  { key: 'General',     icon: 'grid-outline' },
  { key: 'Food & Drink',icon: 'fast-food-outline' },
  { key: 'Snacks',      icon: 'pizza-outline' },
  { key: 'Electronics', icon: 'hardware-chip-outline' },
  { key: 'Clothing',    icon: 'shirt-outline' },
  { key: 'Household',   icon: 'home-outline' },
  { key: 'Other',       icon: 'ellipsis-horizontal-circle-outline' },
];

// ─────────────────────────────────────────────
// Field component (defined outside to keep stable ref)
// ─────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  error,
  prefix,
  icon,
  hint,
  fieldName,
  focusedField,
  setFocusedField,
  styles,
  colors,
}) {
  const isFocused = focusedField === fieldName;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          isFocused && styles.inputRowFocused,
          error && styles.inputError,
        ]}
      >
        {icon && (
          <View style={[styles.inputIcon, { backgroundColor: isFocused ? colors.primaryLight : colors.background }]}>
            <Ionicons
              name={icon}
              size={17}
              color={isFocused ? colors.primary : colors.textMuted}
            />
          </View>
        )}
        {prefix ? (
          <Text style={[styles.prefix, isFocused && { color: colors.primary }]}>{prefix}</Text>
        ) : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setFocusedField(fieldName)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// Stepper for stock quantity
// ─────────────────────────────────────────────
function Stepper({ label, value, onChange, min = 0, styles, colors, hint, error }) {
  const num = parseInt(value, 10) || 0;
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={[styles.stepBtn, num <= min && styles.stepBtnDisabled]}
          onPress={() => num > min && onChange(String(num - 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="remove" size={20} color={num <= min ? colors.textMuted : colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.stepperInput}
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          textAlign="center"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={() => onChange(String(num + 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {hint && !error ? <Text style={styles.hintText}>{hint}</Text> : null}
    </View>
  );
}

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────
function SectionHeader({ icon, title, styles, colors }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={15} color={colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function AddEditProductScreen({ navigation, route }) {
  const { addProduct, updateProduct } = useApp();
  const { colors, isDark } = useTheme();
  const { t, tCategory } = useLanguage();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const editProduct = route.params?.product;
  const isEdit = !!editProduct;

  const [name, setName] = useState(editProduct?.name || '');
  const [category, setCategory] = useState(editProduct?.category || 'General');
  const [price, setPrice] = useState(editProduct?.price?.toString() || '');
  const [stock, setStock] = useState(editProduct?.stockQuantity?.toString() || '');
  const [threshold, setThreshold] = useState(editProduct?.lowStockThreshold?.toString() || '5');
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [imageUri, setImageUri] = useState(editProduct?.imageUri || null);

  // Progress: count filled required fields (name, price, stock)
  const filledCount = [name.trim(), price, stock].filter(Boolean).length;
  const progress = filledCount / 3;

  const pickImage = async (useCamera = false) => {
    try {
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('error'), useCamera ? t('permission_denied_camera') : t('permission_denied_gallery'));
        return;
      }
      const pickerResult = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.75 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 0.8 });
      if (!pickerResult.canceled && pickerResult.assets?.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(t('error'), 'Could not select image.');
    }
  };

  const handleImageAction = () => {
    Alert.alert(
      t('image_source_title'), '',
      [
        { text: t('image_source_camera'), onPress: () => pickImage(true) },
        { text: t('image_source_gallery'), onPress: () => pickImage(false) },
        imageUri ? { text: t('remove_image_btn'), style: 'destructive', onPress: () => setImageUri(null) } : null,
        { text: t('cancel'), style: 'cancel' },
      ].filter(Boolean)
    );
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = t('error_name_required');
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) e.price = t('error_price_invalid');
    if (!stock || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) e.stock = t('error_stock_negative');
    if (threshold && (isNaN(parseInt(threshold, 10)) || parseInt(threshold, 10) < 0)) e.threshold = t('error_threshold_negative');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      if (isEdit) {
        await updateProduct(editProduct.id, { name, category, price, stockQuantity: stock, lowStockThreshold: threshold, imageUri });
      } else {
        await addProduct({ name, category, price, stockQuantity: stock, lowStockThreshold: threshold, imageUri });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('error'), t('error_save_product'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FadeInView style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEdit ? t('edit_product_title') : t('add_product_title')}
          </Text>
          <TouchableOpacity
            style={[styles.headerSaveBtn, isSaving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Photo Picker ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarWrap} onPress={handleImageAction} activeOpacity={0.85}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={30} color={colors.textMuted} />
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={13} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoLabel}>{t('field_product_image')}</Text>
            <Text style={styles.photoHint}>
              {imageUri ? t('change_image_btn') : t('add_image_btn')}
            </Text>
          </View>

          {/* ── Section: Basic Info ── */}
          <View style={styles.card}>

            <Field
              label={t('field_product_name')}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Coca Cola 330ml"
              error={errors.name}
              fieldName="name"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              styles={styles}
              colors={colors}
            />

            {/* Category picker */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>{t('field_category')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catChip, category === cat.key && styles.catChipActive]}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={category === cat.key ? '#FFF' : colors.primary}
                    />
                    <Text style={[styles.catChipText, category === cat.key && styles.catChipTextActive]}>
                      {tCategory(cat.key)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* ── Section: Pricing & Stock ── */}
          <View style={styles.card}>

            <Field
              label={t('field_unit_price')}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="0.00"
              error={errors.price}
              prefix="$"
              fieldName="price"
              focusedField={focusedField}
              setFocusedField={setFocusedField}
              styles={styles}
              colors={colors}
            />

            {/* Two-column row: Stock + Alert Threshold */}
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Stepper
                  label={t('field_stock_qty')}
                  value={stock}
                  onChange={setStock}
                  min={0}
                  styles={styles}
                  colors={colors}
                  error={errors.stock}
                />
              </View>
              <View style={styles.colDivider} />
              <View style={{ flex: 1 }}>
                <Stepper
                  label={t('field_low_stock_threshold')}
                  value={threshold}
                  onChange={setThreshold}
                  min={0}
                  styles={styles}
                  colors={colors}
                  error={errors.threshold}
                  hint={null}
                />
              </View>
            </View>

            {/* Threshold hint */}
            <View style={styles.thresholdHintBox}>
              <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
              <Text style={styles.thresholdHintText}>{t('threshold_hint')}</Text>
            </View>
          </View>

        </ScrollView>

        {/* ── Footer Save Button ── */}
        <View style={styles.footer}>
          {/* Completion indicator pills */}
          {!isEdit && (
            <View style={styles.completionRow}>
              {['name', 'price', 'stock'].map((f, i) => {
                const vals = [name.trim(), price, stock];
                const done = Boolean(vals[i]);
                return (
                  <View
                    key={f}
                    style={[styles.completionPill, done && styles.completionPillDone]}
                  />
                );
              })}
              <Text style={styles.completionText}>
                {filledCount}/3 {filledCount === 3 ? '✓' : ''}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.88}
          >
            <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>
              {isSaving ? t('saving') : isEdit ? t('save_changes') : t('add_product_title')}
            </Text>
          </TouchableOpacity>
        </View>
        </FadeInView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
function createStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
      gap: 12,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.card,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    headerTitle: {
      flex: 1, fontSize: 17, fontWeight: '700', color: colors.textPrimary,
    },
    headerSaveBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },

    // Scroll form
    form: { padding: 16, paddingBottom: 24, gap: 14 },

    // Photo section
    photoSection: {
      alignItems: 'center', paddingVertical: 12,
    },
    avatarWrap: {
      width: 100, height: 100, borderRadius: 24,
      overflow: 'visible', position: 'relative',
    },
    avatarImg: {
      width: 100, height: 100, borderRadius: 24,
      borderWidth: 2.5, borderColor: colors.primary,
    },
    avatarPlaceholder: {
      width: 100, height: 100, borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
      justifyContent: 'center', alignItems: 'center',
    },
    cameraBadge: {
      position: 'absolute', bottom: -4, right: -4,
      width: 28, height: 28, borderRadius: 9,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 2, borderColor: colors.background,
    },
    photoLabel: {
      marginTop: 10, fontSize: 12, fontWeight: '600',
      color: colors.textMuted,
    },
    photoHint: {
      marginTop: 3, fontSize: 13, fontWeight: '600', color: colors.primary,
    },

    // Card sections
    card: {
      backgroundColor: colors.card,
      borderRadius: 18, padding: 18,
      borderWidth: 1, borderColor: colors.border,
      gap: 4,
    },

    // Fields
    fieldWrap: { marginBottom: 16 },
    label: {
      fontSize: 13, fontWeight: '600', color: colors.textSecondary,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
      paddingHorizontal: 14, overflow: 'hidden',
      height: 50,
    },
    inputRowFocused: {
      borderColor: colors.primary,
    },
    inputError: { borderColor: colors.danger },
    prefix: {
      fontSize: 16, fontWeight: '700', color: colors.textSecondary,
      marginRight: 6,
    },
    input: { flex: 1, fontSize: 15, color: colors.textPrimary },
    errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    errorText: { fontSize: 12, color: colors.danger, fontWeight: '500' },
    hintText: { fontSize: 11, color: colors.textMuted, marginTop: 5 },

    // Category chips
    categoryScroll: { paddingVertical: 2, gap: 8 },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
      backgroundColor: colors.primaryLight,
      borderWidth: 1.5, borderColor: colors.border,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catChipText: { fontSize: 12, fontWeight: '600', color: colors.primary },
    catChipTextActive: { color: '#FFF' },

    // Stepper
    stepperRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
      overflow: 'hidden',
    },
    stepBtn: {
      width: 44, height: 44,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: colors.primaryLight,
    },
    stepBtnDisabled: { opacity: 0.4 },
    stepperInput: {
      flex: 1, height: 44, fontSize: 18,
      fontWeight: '800', color: colors.textPrimary,
      textAlign: 'center',
    },

    // Two-column layout
    twoCol: { flexDirection: 'row', gap: 0 },
    colDivider: { width: 12 },

    // Threshold hint
    thresholdHintBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 6,
      backgroundColor: colors.primaryLight,
      borderRadius: 10, padding: 10, marginTop: 4,
    },
    thresholdHintText: {
      flex: 1, fontSize: 12, color: colors.primary,
      fontWeight: '500', lineHeight: 17,
    },

    // Footer
    footer: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 20,
      backgroundColor: 'transparent',  // transparent instead of solid background
      gap: 10,
    },
    completionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    completionPill: {
      flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border,
    },
    completionPillDone: { backgroundColor: colors.success },
    completionText: {
      fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginLeft: 4,
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
  });
}
