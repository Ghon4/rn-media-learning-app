import type { NavigatorScreenParams } from '@react-navigation/native';

import type { MediaType } from '../services/tmdb/types';

export type MediaDetailParams = {
  mediaType: MediaType;
  id: number;
  title?: string;
};

export type PersonDetailParams = {
  id: number | string;
  name?: string;
};

export type TvSeasonParams = {
  tvId: number | string;
  seasonNumber: number | string;
  showTitle?: string;
};

/** Shared routes used from media detail across Home, Search, and Library stacks. */
export type MediaFlowParamList = {
  MediaDetail: MediaDetailParams;
  PersonDetail: PersonDetailParams;
  TvSeason: TvSeasonParams;
};

export type HomeStackParamList = {
  Home: undefined;
  DiscoverMovies: undefined;
  DiscoverTv: undefined;
} & MediaFlowParamList;

export type SearchStackParamList = { Search: undefined } & MediaFlowParamList;

export type LibraryStackParamList = {
  Library: undefined;
  CustomLists: undefined;
} & MediaFlowParamList;

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
