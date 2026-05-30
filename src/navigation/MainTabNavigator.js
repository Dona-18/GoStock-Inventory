import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

import DashboardScreen from '../screens/DashboardScreen';
import InventoryNavigator from './InventoryNavigator';
import SalesNavigator from './SalesNavigator';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────
// Floating centre Sale button
// ─────────────────────────────────────────────
function SaleTabButton({ children, onPress, accessibilityState }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const focused = accessibilityState?.selected;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.saleBtnOuter}
    >
      {/* Floating rounded-square button */}
      <View
        style={[
          styles.saleBtnInner,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
          focused && styles.saleBtnFocused,
        ]}
      >
        {children}
      </View>
      {/* Sale label sits below the button */}
      <Text style={[styles.saleBtnLabel, { color: focused ? colors.primary : colors.tabBarInactive }]}>
        {t('tab_sales')}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// Main navigator
// ─────────────────────────────────────────────
export default function MainTabNavigator() {
  const { lowStockProducts } = useApp();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 84 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Home:      focused ? 'home'      : 'home-outline',
            Inventory: focused ? 'cube'      : 'cube-outline',
            Reports:   focused ? 'bar-chart' : 'bar-chart-outline',
            Settings:  focused ? 'settings'  : 'settings-outline',
          };
          const iconName = icons[route.name] || 'ellipse-outline';

          return (
            <View style={styles.tabIconWrap}>
              <Ionicons name={iconName} size={22} color={color} />
              {route.name === 'Inventory' && lowStockProducts.length > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.tabBadgeText}>
                    {lowStockProducts.length > 9 ? '9+' : lowStockProducts.length}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{ tabBarLabel: t('tab_home') }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryNavigator}
        options={{ tabBarLabel: t('tab_inventory') }}
      />

      {/* ── Centre FAB: Sales ── */}
      <Tab.Screen
        name="Sales"
        component={SalesNavigator}
        options={{
          tabBarLabel: () => null,   // label handled inside SaleTabButton
          tabBarButton: (props) => <SaleTabButton {...props} />,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'bag-handle' : 'bag-handle-outline'}
              size={26}
              color="#FFFFFF"
            />
          ),
        }}
      />

      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ tabBarLabel: t('tab_reports') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tab_settings') }}
      />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  tabIconWrap: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  // Floating Sale button
  saleBtnOuter: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  saleBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 18,          // rounded square — matches screenshot
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  saleBtnFocused: {
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  saleBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 5,
  },
});
