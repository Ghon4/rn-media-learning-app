import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { i18n } from '../i18n';

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
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: i18n.t('tabs.home'), tabBarLabel: i18n.t('tabs.home') }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNavigator}
        options={{ title: i18n.t('tabs.search'), tabBarLabel: i18n.t('tabs.search') }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStackNavigator}
        options={{ title: i18n.t('tabs.library'), tabBarLabel: i18n.t('tabs.library') }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStackNavigator}
        options={{ title: i18n.t('tabs.settings'), tabBarLabel: i18n.t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
