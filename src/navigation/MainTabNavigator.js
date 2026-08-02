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
import AddSaleScreen from '../screens/AddSaleScreen';
import SalesScreen from '../screens/SalesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────
// Floating centre POS Sale button
// ─────────────────────────────────────────────
function RecordSaleTabButton({ children, onPress, accessibilityState }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.saleBtnOuter}
    >
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
        <Ionicons name="cart" size={26} color="#FFFFFF" />
      </View>
      <Text style={[styles.saleBtnLabel, { color: focused ? colors.primary : colors.tabBarInactive }]}>
        {t('tab_record_sale')}
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
            Home:      focused ? 'home'         : 'home-outline',
            Inventory: focused ? 'cube'         : 'cube-outline',
            SalesLog:  focused ? 'receipt'      : 'receipt-outline',
            Reports:   focused ? 'bar-chart'    : 'bar-chart-outline',
            Settings:  focused ? 'settings'     : 'settings-outline',
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

      {/* ── Centre Floating POS Button ── */}
      <Tab.Screen
        name="RecordSale"
        component={AddSaleScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <RecordSaleTabButton {...props} />,
        }}
      />

      {/* ── Separate Sales Log Tab ── */}
      <Tab.Screen
        name="SalesLog"
        component={SalesScreen}
        options={{ tabBarLabel: t('tab_sales_log') }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: t('tab_settings') }}
      />
    </Tab.Navigator>
  );
}

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
  saleBtnOuter: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
  },
  saleBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 18,
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
