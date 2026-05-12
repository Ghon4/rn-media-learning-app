import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { PersonDetailScreen } from '../features/person/PersonDetailScreen';
import { SearchScreen } from '../features/search/SearchScreen';
import { TvSeasonScreen } from '../features/seasons/TvSeasonScreen';
import { i18n } from '../i18n';

import type { SearchStackParamList } from './types';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: i18n.t('tabs.search') }}
      />
      <Stack.Screen
        name="MediaDetail"
        component={MediaDetailScreen}
        options={({ route }) => ({
          title: route.params.title ?? i18n.t('errors.loadFailed'),
        })}
      />
      <Stack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={({ route }) => ({
          title: route.params.name ?? 'Person',
        })}
      />
      <Stack.Screen
        name="TvSeason"
        component={TvSeasonScreen}
        options={({ route }) => ({
          title: i18n.t('seasons.title', {
            n: Number(route.params.seasonNumber),
          }),
        })}
      />
    </Stack.Navigator>
  );
}
