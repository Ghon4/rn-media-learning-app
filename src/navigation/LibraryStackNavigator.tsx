import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CustomListsScreen } from '../features/library/CustomListsScreen';
import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { PersonDetailScreen } from '../features/person/PersonDetailScreen';
import { TvSeasonScreen } from '../features/seasons/TvSeasonScreen';
import { i18n } from '../i18n';

import type { LibraryStackParamList } from './types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: i18n.t('library.title') }}
      />
      <Stack.Screen
        name="CustomLists"
        component={CustomListsScreen}
        options={{ title: i18n.t('lists.title') }}
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
