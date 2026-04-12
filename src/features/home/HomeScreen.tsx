import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { isAppError } from '../../services/api/errors';
import { backdropUrl } from '../../services/tmdb/constants';
import {
  fetchPopularMovies,
  fetchPopularTv,
  fetchTrendingMovies,
} from '../../services/tmdb/tmdbApi';
import type { MovieListItem, TvListItem } from '../../services/tmdb/types';
import { ErrorState } from '../../shared/components/ErrorState';
import { MediaCard } from '../../shared/components/MediaCard';
import { Screen } from '../../shared/components/Screen';
import { SectionHeader } from '../../shared/components/SectionHeader';

import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trending, setTrending] = useState<MovieListItem[]>([]);

  const [movies, setMovies] = useState<MovieListItem[]>([]);
  const [moviePage, setMoviePage] = useState(1);
  const [movieTotalPages, setMovieTotalPages] = useState(1);
  const [movieLoadingMore, setMovieLoadingMore] = useState(false);

  const [tv, setTv] = useState<TvListItem[]>([]);
  const [tvPage, setTvPage] = useState(1);
  const [tvTotalPages, setTvTotalPages] = useState(1);
  const [tvLoadingMore, setTvLoadingMore] = useState(false);

  const loadInitial = useCallback(async () => {
    setError(null);
    try {
      const [t, m, tvp] = await Promise.all([
        fetchTrendingMovies(),
        fetchPopularMovies(1),
        fetchPopularTv(1),
      ]);
      setTrending(t.results);
      setMovies(m.results);
      setMoviePage(1);
      setMovieTotalPages(m.total_pages);
      setTv(tvp.results);
      setTvPage(1);
      setTvTotalPages(tvp.total_pages);
    } catch (e) {
      const msg = isAppError(e) ? e.message : 'Something went wrong';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const loadMoreMovies = useCallback(async () => {
    if (movieLoadingMore || moviePage >= movieTotalPages) return;
    setMovieLoadingMore(true);
    try {
      const next = moviePage + 1;
      const data = await fetchPopularMovies(next);
      setMovies((prev) => [...prev, ...data.results]);
      setMoviePage(next);
      setMovieTotalPages(data.total_pages);
    } catch {
      /* ignore pagination errors */
    } finally {
      setMovieLoadingMore(false);
    }
  }, [movieLoadingMore, moviePage, movieTotalPages]);

  const loadMoreTv = useCallback(async () => {
    if (tvLoadingMore || tvPage >= tvTotalPages) return;
    setTvLoadingMore(true);
    try {
      const next = tvPage + 1;
      const data = await fetchPopularTv(next);
      setTv((prev) => [...prev, ...data.results]);
      setTvPage(next);
      setTvTotalPages(data.total_pages);
    } catch {
      /* ignore */
    } finally {
      setTvLoadingMore(false);
    }
  }, [tvLoadingMore, tvPage, tvTotalPages]);

  const hero = trending[0];
  const heroBackdrop = backdropUrl(hero?.backdrop_path ?? hero?.poster_path ?? undefined);

  if (error && trending.length === 0 && movies.length === 0) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void loadInitial()} />
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
          onEndReached={() => void loadMoreMovies()}
          ListFooterComponent={
            movieLoadingMore ? (
              <View style={styles.footerSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
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
          onEndReached={() => void loadMoreTv()}
          ListFooterComponent={
            tvLoadingMore ? (
              <View style={styles.footerSpinner}>
                <ActivityIndicator />
              </View>
            ) : null
          }
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hListBottom}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
});
