import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import InventoryScreen from '../screens/InventoryScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';

const Stack = createStackNavigator();

export default function InventoryNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="InventoryList" component={InventoryScreen} />
      <Stack.Screen name="AddProduct" component={AddEditProductScreen} />
    </Stack.Navigator>
  );
}
