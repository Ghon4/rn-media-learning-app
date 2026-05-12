import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DiscoverMoviesScreen } from '../features/discover/DiscoverMoviesScreen';
import { DiscoverTvScreen } from '../features/discover/DiscoverTvScreen';
import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PersonDetailScreen } from '../features/person/PersonDetailScreen';
import { TvSeasonScreen } from '../features/seasons/TvSeasonScreen';
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
        name="DiscoverMovies"
        component={DiscoverMoviesScreen}
        options={{ title: i18n.t('discover.titleMovies') }}
      />
      <Stack.Screen
        name="DiscoverTv"
        component={DiscoverTvScreen}
        options={{ title: i18n.t('discover.titleTv') }}
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
