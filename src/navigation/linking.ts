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
          MediaDetail: 'media/:mediaType/:id',
        },
      },
      SearchTab: {
        path: 'search',
        screens: {
          Search: '',
        },
      },
      LibraryTab: {
        path: 'library',
        screens: {
          Library: '',
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
