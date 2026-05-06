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
  fetchPopularMovies,
  fetchPopularTv,
  fetchTrendingMovies,
} from '../../services/tmdb/tmdbApi';
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Discover')}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('home.discover')}
        >
          <Text style={[styles.headerBtnText, { color: colors.primary }]}>{i18n.t('home.discover')}</Text>
        </Pressable>
      ),
    });
  }, [colors.primary, navigation]);

  const trendingQuery = useQuery({
    queryKey: ['tmdb', 'trending', 'movie', 'day'],
    queryFn: fetchTrendingMovies,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'trending', 'movie', 'day'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'popularMovies'] }),
        queryClient.invalidateQueries({ queryKey: ['tmdb', 'popularTv'] }),
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
        : 'Something went wrong'
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

        <SectionHeader title="Trending today" />
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
                <ActivityIndicator />
              </View>
            ) : null
          }
        />

        <SectionHeader title="Popular movies" />
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

        <SectionHeader title="Popular TV" />
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
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtnText: {
    fontSize: 16,
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
