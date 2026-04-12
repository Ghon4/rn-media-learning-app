import { RouteProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useWatchlist } from '../../context/WatchlistContext';
import type { HomeStackParamList } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { backdropUrl, posterUrl } from '../../services/tmdb/constants';
import {
  fetchMovieDetail,
  fetchMovieVideos,
  fetchSimilarMovies,
  fetchSimilarTv,
  fetchTvDetail,
  fetchTvVideos,
} from '../../services/tmdb/tmdbApi';
import type { MediaType, MovieListItem, TvListItem } from '../../services/tmdb/types';
import { ErrorState } from '../../shared/components/ErrorState';
import { MediaCard } from '../../shared/components/MediaCard';
import { Screen } from '../../shared/components/Screen';

type DetailRoute = RouteProp<
  { MediaDetail: { mediaType: MediaType; id: number | string; title?: string } },
  'MediaDetail'
>;

type MediaDetailNav = NativeStackNavigationProp<HomeStackParamList, 'MediaDetail'>;

function normalizeParams(params: DetailRoute['params']) {
  const rawId = params.id;
  const id = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
  const mediaType: MediaType =
    String(params.mediaType).toLowerCase() === 'tv' ? 'tv' : 'movie';
  return { id, mediaType, title: params.title };
}

export function MediaDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<MediaDetailNav>();
  const route = useRoute<DetailRoute>();
  const { id, mediaType, title } = normalizeParams(route.params);
  const { isInWatchlist, toggle } = useWatchlist();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailTitle, setDetailTitle] = useState(title ?? '');
  const [overview, setOverview] = useState('');
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [backdropPath, setBackdropPath] = useState<string | null>(null);
  const [vote, setVote] = useState<number | null>(null);
  const [meta, setMeta] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [similarMovies, setSimilarMovies] = useState<MovieListItem[]>([]);
  const [similarTv, setSimilarTv] = useState<TvListItem[]>([]);
  const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mediaType === 'movie') {
        const [d, sim, vids] = await Promise.all([
          fetchMovieDetail(id),
          fetchSimilarMovies(id),
          fetchMovieVideos(id),
        ]);
        setDetailTitle(d.title);
        setOverview(d.overview);
        setPosterPath(d.poster_path);
        setBackdropPath(d.backdrop_path);
        setVote(d.vote_average);
        setGenres(d.genres.map((g) => g.name));
        const runtime = d.runtime ? `${d.runtime} min` : '';
        const year = d.release_date?.slice(0, 4) ?? '';
        setMeta([year, runtime].filter(Boolean).join(' · '));
        setSimilarMovies(sim.results);
        const trailer = vids.results.find(
          (x) => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'),
        );
        setYoutubeKey(trailer?.key ?? null);
      } else {
        const [d, sim, vids] = await Promise.all([
          fetchTvDetail(id),
          fetchSimilarTv(id),
          fetchTvVideos(id),
        ]);
        setDetailTitle(d.name);
        setOverview(d.overview);
        setPosterPath(d.poster_path);
        setBackdropPath(d.backdrop_path);
        setVote(d.vote_average);
        setGenres(d.genres.map((g) => g.name));
        const run =
          d.episode_run_time && d.episode_run_time.length > 0
            ? `${d.episode_run_time[0]} min/ep`
            : '';
        const year = d.first_air_date?.slice(0, 4) ?? '';
        setMeta([year, run].filter(Boolean).join(' · '));
        setSimilarTv(sim.results);
        const trailer = vids.results.find(
          (x) => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'),
        );
        setYoutubeKey(trailer?.key ?? null);
      }
    } catch (e) {
      setError(isAppError(e) ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    if (detailTitle) {
      navigation.setOptions({ title: detailTitle });
    }
  }, [detailTitle, navigation]);

  const inList = isInWatchlist(mediaType, id);

  const backdropUri = backdropUrl(backdropPath ?? undefined);
  const posterUri = posterUrl(posterPath ?? undefined);

  const similarData = useMemo(() => {
    if (mediaType === 'movie') {
      return similarMovies.map((m) => ({
        key: `sm-${m.id}`,
        title: m.title,
        posterPath: m.poster_path,
        subtitle: m.release_date?.slice(0, 4),
        mediaType: 'movie' as const,
        id: m.id,
      }));
    }
    return similarTv.map((m) => ({
      key: `st-${m.id}`,
      title: m.name,
      posterPath: m.poster_path,
      subtitle: m.first_air_date?.slice(0, 4),
      mediaType: 'tv' as const,
      id: m.id,
    }));
  }, [mediaType, similarMovies, similarTv]);

  if (loading && !detailTitle && !overview) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel="Loading details" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backdropWrap}>
          {backdropUri ? (
            <Image source={{ uri: backdropUri }} style={styles.backdrop} contentFit="cover" />
          ) : posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.backdrop} contentFit="cover" />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: colors.border }]} />
          )}
          <View style={styles.backdropScrim} />
        </View>

        <View style={styles.row}>
          {posterUri ? (
            <Image source={{ uri: posterUri }} style={styles.poster} contentFit="cover" />
          ) : null}
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>{detailTitle}</Text>
            {meta ? (
              <Text style={[styles.meta, { color: colors.text, opacity: 0.75 }]}>{meta}</Text>
            ) : null}
            {vote != null ? (
              <Text style={[styles.meta, { color: colors.text, opacity: 0.75 }]}>
                Rating: {vote.toFixed(1)} / 10
              </Text>
            ) : null}
          </View>
        </View>

        {genres.length > 0 ? (
          <Text
            style={[styles.genres, { color: colors.text, opacity: 0.8 }]}
            accessibilityLabel={`Genres: ${genres.join(', ')}`}
          >
            {genres.join(' · ')}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() =>
              toggle({
                mediaType,
                id,
                title: detailTitle,
                posterPath,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={inList ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Text style={styles.primaryBtnText}>{inList ? 'In watchlist' : 'Add to watchlist'}</Text>
          </Pressable>
          {youtubeKey ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => setTrailerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Play trailer in app"
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Trailer (in app)</Text>
            </Pressable>
          ) : null}
          {youtubeKey ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() =>
                void Linking.openURL(`https://www.youtube.com/watch?v=${youtubeKey}`)
              }
              accessibilityRole="button"
              accessibilityLabel="Open trailer in YouTube"
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Open in YouTube</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.overview, { color: colors.text }]}>{overview}</Text>

        {similarData.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Similar</Text>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              {similarData.map((item) => (
                <MediaCard
                  key={item.key}
                  title={item.title}
                  posterPath={item.posterPath}
                  subtitle={item.subtitle}
                  onPress={() =>
                    navigation.push('MediaDetail', {
                      mediaType: item.mediaType,
                      id: item.id,
                      title: item.title,
                    })
                  }
                />
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>

      <Modal visible={trailerOpen} animationType="slide" onRequestClose={() => setTrailerOpen(false)}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => setTrailerOpen(false)}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close trailer"
          >
            <Text style={[styles.closeBtnText, { color: colors.text }]}>Close</Text>
          </Pressable>
          {youtubeKey ? (
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${youtubeKey}` }}
              style={{ flex: 1 }}
              allowsFullscreenVideo
            />
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 32,
  },
  backdropWrap: {
    height: 220,
    marginBottom: 12,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
  },
  headerText: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    marginTop: 4,
    fontSize: 14,
  },
  genres: {
    marginTop: 12,
    paddingHorizontal: 16,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryBtnText: {
    fontWeight: '600',
  },
  overview: {
    paddingHorizontal: 16,
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  modal: {
    flex: 1,
    paddingTop: 48,
  },
  closeBtn: {
    padding: 16,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
