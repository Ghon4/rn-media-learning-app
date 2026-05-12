import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import type { RootTabParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootTabParamList> = {
  prefixes: [prefix, 'rnmedia://'],
  config: {
    screens: {
      HomeTab: {
        path: 'home',
        screens: {
          Home: '',
          DiscoverMovies: 'discover',
          DiscoverTv: 'discover/tv',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
          TvSeason: 'tv/:tvId/season/:seasonNumber',
        },
      },
      SearchTab: {
        path: 'search',
        screens: {
          Search: '',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
          TvSeason: 'tv/:tvId/season/:seasonNumber',
        },
      },
      LibraryTab: {
        path: 'library',
        screens: {
          Library: '',
          CustomLists: 'lists',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
          TvSeason: 'tv/:tvId/season/:seasonNumber',
        },
      },
      SettingsTab: {
        path: 'settings',
        screens: {
          Settings: '',
          About: 'about',
        },
      },
    },
  },
};
