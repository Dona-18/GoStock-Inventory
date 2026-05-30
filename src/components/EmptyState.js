import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ icon, title, subtitle }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon || 'cube-outline'} size={48} color={colors.primaryMid} />
      </View>
      <Text style={styles.title}>{title || 'Nothing here yet'}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 32,
    },
    iconWrap: {
      width: 90, height: 90, borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
    subtitle: {
      fontSize: 14, color: colors.textSecondary,
      textAlign: 'center', marginTop: 8, lineHeight: 20,
    },
  });
}
