import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AboutScreen } from '../features/settings/AboutScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';

import type { SettingsStackParamList } from './types';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
    </Stack.Navigator>
  );
}
