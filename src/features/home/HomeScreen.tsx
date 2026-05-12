import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { i18n } from '../../i18n';
import type { HomeStackParamList } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { backdropUrl } from '../../services/tmdb/constants';
import {
  fetchNowPlayingMovies,
  fetchPopularMovies,
  fetchPopularTv,
  fetchTopRatedMovies,
  fetchTrendingMovies,
  fetchUpcomingMovies,
} from '../../services/tmdb/tmdbApi';
import { useRecentStore } from '../../store/recentStore';
import { ErrorState } from '../../shared/components/ErrorState';
import { MediaCard } from '../../shared/components/MediaCard';
import { Screen } from '../../shared/components/Screen';
import { SectionHeader } from '../../shared/components/SectionHeader';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const recentItems = useRecentStore((s) => s.items);
  const recentHydrated = useRecentStore((s) => s.hydrated);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerDiscover}>
          <Pressable
            onPress={() => navigation.navigate('DiscoverMovies')}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('discover.titleMovies')}
          >
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>
              {i18n.t('home.discoverMovies')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('DiscoverTv')}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('discover.titleTv')}
          >
            <Text style={[styles.headerBtnText, { color: colors.primary }]}>
              {i18n.t('home.discoverTv')}
            </Text>
          </Pressable>
        </View>
      ),
    });
  }, [colors.primary, navigation]);

  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'movie', 'day'],
    queryFn: fetchTrendingMovies,
  });

  const nowPlayingQuery = useQuery({
    queryKey: ['tmdb', 'nowPlaying', 1],
    queryFn: () => fetchNowPlayingMovies(1),
  });

  const upcomingQuery = useQuery({
    queryKey: ['tmdb', 'upcoming', 1],
    queryFn: () => fetchUpcomingMovies(1),
  });

  const topRatedQuery = useQuery({
    queryKey: ['tmdb', 'topRated', 1],
    queryFn: () => fetchTopRatedMovies(1),
  });

  const moviesInfinite = useInfiniteQuery({
    queryKey: ['tmdb', 'popularMovies'],
    queryFn: ({ pageParam }) => fetchPopularMovies(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });

  const tvInfinite = useInfiniteQuery({
    queryKey: ['tmdb', 'popularTv'],
    queryFn: ({ pageParam }) => fetchPopularTv(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });

  const trending = trendingQuery.data?.results ?? [];
  const movies = moviesInfinite.data?.pages.flatMap((p) => p.results) ?? [];
  const tv = tvInfinite.data?.pages.flatMap((p) => p.results) ?? [];
  const nowPlaying = nowPlayingQuery.data?.results ?? [];
  const upcoming = upcomingQuery.data?.results ?? [];
  const topRated = topRatedQuery.data?.results ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'trending', 'movie', 'day'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'popularMovies'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'popularTv'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'nowPlaying'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'upcoming'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'topRated'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const loadMoreMovies = useCallback(() => {
    if (moviesInfinite.hasNextPage && !moviesInfinite.isFetchingNextPage) {
      void moviesInfinite.fetchNextPage();
    }
  }, [moviesInfinite]);

  const loadMoreTv = useCallback(() => {
    if (tvInfinite.hasNextPage && !tvInfinite.isFetchingNextPage) {
      void tvInfinite.fetchNextPage();
    }
  }, [tvInfinite]);

  const hero = trending[0];
  const heroBackdrop = backdropUrl(hero?.backdrop_path ?? hero?.poster_path ?? undefined);

  const loadError =
    trendingQuery.isError && trending.length === 0 && movies.length === 0
      ? isAppError(trendingQuery.error)
        ? trendingQuery.error.message
        : i18n.t('errors.loadFailed')
      : null;

  if (loadError) {
    return (
      <Screen>
        <ErrorState message={loadError} onRetry={() => void trendingQuery.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        nestedScrollEnabled
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
      >
        {heroBackdrop ? (
          <View style={styles.heroWrap} accessibilityLabel={`Featured: ${hero?.title ?? ''}`}>
            <Image source={{ uri: heroBackdrop }} style={styles.heroImage} contentFit="cover" />
            <View style={styles.heroScrim} />
          </View>
        ) : null}

        {recentHydrated && recentItems.length > 0 ? (
          <>
            <SectionHeader title={i18n.t('home.recent')} />
            <FlatList
              horizontal
              nestedScrollEnabled
              data={recentItems}
              keyExtractor={(item) => `r-${item.mediaType}-${item.id}`}
              renderItem={({ item }) => (
                <MediaCard
                  title={item.title}
                  posterPath={item.posterPath}
                  subtitle={
                    item.mediaType === 'movie' ? i18n.t('library.typeMovie') : i18n.t('library.typeTv')
                  }
                  onPress={() =>
                    navigation.navigate('MediaDetail', {
                      mediaType: item.mediaType,
                      id: item.id,
                      title: item.title,
                    })
                  }
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            />
          </>
        ) : null}

        <SectionHeader title={i18n.t('home.trendingToday')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={trending}
          keyExtractor={(item) => `t-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.release_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'movie',
                  id: item.id,
                  title: item.title,
                })
              }
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          ListEmptyComponent={
            trendingQuery.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator accessibilityLabel={i18n.t('a11y.loading')} />
              </View>
            ) : null
          }
        />

        <SectionHeader title={i18n.t('home.nowPlaying')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={nowPlaying}
          keyExtractor={(item) => `np-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.release_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'movie',
                  id: item.id,
                  title: item.title,
                })
              }
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          ListEmptyComponent={
            nowPlayingQuery.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        <SectionHeader title={i18n.t('home.upcoming')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={upcoming}
          keyExtractor={(item) => `up-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.release_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'movie',
                  id: item.id,
                  title: item.title,
                })
              }
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          ListEmptyComponent={
            upcomingQuery.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        <SectionHeader title={i18n.t('home.topRated')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={topRated}
          keyExtractor={(item) => `tr-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.release_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'movie',
                  id: item.id,
                  title: item.title,
                })
              }
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          ListEmptyComponent={
            topRatedQuery.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        <SectionHeader title={i18n.t('home.popularMovies')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={movies}
          keyExtractor={(item) => `m-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.title}
              posterPath={item.poster_path}
              subtitle={item.release_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'movie',
                  id: item.id,
                  title: item.title,
                })
              }
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => loadMoreMovies()}
          ListFooterComponent={
            moviesInfinite.isFetchingNextPage ? (
              <View style={styles.footerSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          ListEmptyComponent={
            moviesInfinite.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        <SectionHeader title={i18n.t('home.popularTv')} />
        <FlatList
          horizontal
          nestedScrollEnabled
          data={tv}
          keyExtractor={(item) => `tv-${item.id}`}
          renderItem={({ item }) => (
            <MediaCard
              title={item.name}
              posterPath={item.poster_path}
              subtitle={item.first_air_date?.slice(0, 4)}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: 'tv',
                  id: item.id,
                  title: item.name,
                })
              }
            />
          )}
          onEndReachedThreshold={0.4}
          onEndReached={() => loadMoreTv()}
          ListFooterComponent={
            tvInfinite.isFetchingNextPage ? (
              <View style={styles.footerSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hListBottom}
          ListEmptyComponent={
            tvInfinite.isLoading ? (
              <View style={styles.inlineSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerDiscover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  heroWrap: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  hList: {
    paddingLeft: 16,
    paddingBottom: 8,
  },
  hListBottom: {
    paddingLeft: 16,
    paddingBottom: 24,
  },
  footerSpinner: {
    height: 200,
    justifyContent: 'center',
    paddingRight: 16,
  },
  inlineSpinner: {
    height: 200,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
