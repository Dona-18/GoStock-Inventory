import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

export default function SplashScreen({ navigation }) {
  const { t } = useLanguage();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.7);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="cube" size={56} color="#FFFFFF" />
        </View>
        <Text style={styles.appName}>GOSTOCK</Text>
        <Text style={styles.tagline}>ស្តុកអ្នកជំនួញ · Smart Inventory</Text>
      </Animated.View>

      <Animated.Text style={[styles.version, { opacity: fadeAnim }]}>
        {t('settings_app_version', { version: '1.0.0' }).split('·')[0].trim()}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blobTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -80,
    right: -80,
  },
  blobBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -60,
    left: -60,
  },
  logoWrap: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
