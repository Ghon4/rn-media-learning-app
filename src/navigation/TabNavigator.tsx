import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeStackNavigator } from './HomeStackNavigator';
import { LibraryStackNavigator } from './LibraryStackNavigator';
import { SearchStackNavigator } from './SearchStackNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const map: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
            HomeTab: 'home',
            SearchTab: 'search',
            LibraryTab: 'bookmark',
            SettingsTab: 'settings',
          };
          const name = map[route.name as keyof RootTabParamList];
          return <Ionicons name={name} size={size} color={color} accessibilityLabel={route.name} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={SearchStackNavigator} options={{ title: 'Search' }} />
      <Tab.Screen name="LibraryTab" component={LibraryStackNavigator} options={{ title: 'Library' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
