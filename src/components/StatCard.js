import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function StatCard({ title, value, icon, iconColor, bgColor, subtitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor || colors.primaryLight }]}>
        <Ionicons name={icon} size={22} color={iconColor || colors.primary} />
      </View>
      <Text
        style={styles.value}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
      >
        {value}
      </Text>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      alignItems: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
      margin: 5,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 42, height: 42, borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    },
    value: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, paddingLeft: 4 },
    title: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '500', paddingLeft: 4 },
    subtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2, paddingLeft: 4 },
  });
}
