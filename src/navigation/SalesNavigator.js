import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import SalesScreen from '../screens/SalesScreen';
import AddSaleScreen from '../screens/AddSaleScreen';

const Stack = createStackNavigator();

export default function SalesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="SalesList" component={SalesScreen} />
      <Stack.Screen name="AddSale" component={AddSaleScreen} />
    </Stack.Navigator>
  );
}
