import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemePreferenceProvider, useThemePreference } from './src/context/ThemePreferenceContext';
import { WatchlistProvider } from './src/context/WatchlistContext';
import { linking } from './src/navigation/linking';
import { TabNavigator } from './src/navigation/TabNavigator';

function NavigationRoot() {
  const { navigationTheme, resolvedScheme } = useThemePreference();
  return (
    <NavigationContainer theme={navigationTheme} linking={linking}>
      <TabNavigator />
      <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemePreferenceProvider>
          <WatchlistProvider>
            <NavigationRoot />
          </WatchlistProvider>
        </ThemePreferenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
