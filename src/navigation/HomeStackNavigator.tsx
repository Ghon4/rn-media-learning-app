import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DiscoverScreen } from '../features/discover/DiscoverScreen';
import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PersonDetailScreen } from '../features/person/PersonDetailScreen';
import { i18n } from '../i18n';

import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: i18n.t('home.screenTitle') }}
      />
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{ title: i18n.t('discover.title') }}
      />
      <Stack.Screen
        name="MediaDetail"
        component={MediaDetailScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Details',
        })}
      />
      <Stack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={({ route }) => ({
          title: route.params.name ?? 'Person',
        })}
      />
    </Stack.Navigator>
  );
}
