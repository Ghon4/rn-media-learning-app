import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from 'react-error-boundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LocalePreferenceProvider } from './src/context/LocalePreferenceContext';
import { ThemePreferenceProvider, useThemePreference } from './src/context/ThemePreferenceContext';
import { TrailerPreferenceProvider } from './src/context/TrailerPreferenceContext';
import { linking } from './src/navigation/linking';
import { TabNavigator } from './src/navigation/TabNavigator';
import { queryClient } from './src/query/queryClient';
import { AppErrorFallback } from './src/shared/components/AppErrorFallback';
import { OfflineBanner } from './src/shared/components/OfflineBanner';
import { ListsRehydrate } from './src/store/ListsRehydrate';
import { RecentRehydrate } from './src/store/RecentRehydrate';
import { WatchlistRehydrate } from './src/store/WatchlistRehydrate';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NavigationRoot() {
  const { navigationTheme, resolvedScheme } = useThemePreference();
  return (
    <NavigationContainer theme={navigationTheme} linking={linking}>
      <WatchlistRehydrate />
      <RecentRehydrate />
      <ListsRehydrate />
      <ErrorBoundary FallbackComponent={AppErrorFallback}>
        <OfflineBanner />
        <TabNavigator />
        <StatusBar style={resolvedScheme === 'dark' ? 'light' : 'dark'} />
      </ErrorBoundary>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocalePreferenceProvider>
          <ThemePreferenceProvider>
            <TrailerPreferenceProvider>
              <QueryClientProvider client={queryClient}>
                <NavigationRoot />
              </QueryClientProvider>
            </TrailerPreferenceProvider>
          </ThemePreferenceProvider>
        </LocalePreferenceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
