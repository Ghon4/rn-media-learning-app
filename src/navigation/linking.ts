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
          Discover: 'discover',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
        },
      },
      SearchTab: {
        path: 'search',
        screens: {
          Search: '',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
        },
      },
      LibraryTab: {
        path: 'library',
        screens: {
          Library: '',
          MediaDetail: 'media/:mediaType/:id',
          PersonDetail: 'person/:id',
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
