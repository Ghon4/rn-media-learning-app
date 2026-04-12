import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MediaType } from '../services/tmdb/types';

export type MediaDetailParams = {
  mediaType: MediaType;
  id: number;
  title?: string;
};

export type HomeStackParamList = {
  Home: undefined;
  MediaDetail: MediaDetailParams;
};

export type SearchStackParamList = {
  Search: undefined;
  MediaDetail: MediaDetailParams;
};

export type LibraryStackParamList = {
  Library: undefined;
  MediaDetail: MediaDetailParams;
};

export type SettingsStackParamList = {
  Settings: undefined;
  About: undefined;
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
  LibraryTab: NavigatorScreenParams<LibraryStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
