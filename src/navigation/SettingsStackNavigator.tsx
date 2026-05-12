import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../features/settings/AboutScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { i18n } from '../i18n';

import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: i18n.t('tabs.settings') }}
      />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: i18n.t('settings.about') }} />
    </Stack.Navigator>
  );
}
