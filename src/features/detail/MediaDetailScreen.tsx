import DateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { useTrailerPreference } from '../../context/TrailerPreferenceContext';
import { i18n } from '../../i18n';
import type { MediaFlowParamList } from '../../navigation/types';
import type { OpenLibraryBook } from '../../services/openLibrary/openLibraryApi';
import { searchBooksByTitle } from '../../services/openLibrary/openLibraryApi';
import { isAppError } from '../../services/api/errors';
import { backdropUrl, posterUrl } from '../../services/tmdb/constants';
import {
  fetchMovieCredits,
  fetchMovieDetail,
  fetchMovieRecommendations,
  fetchMovieVideos,
  fetchSimilarMovies,
  fetchSimilarTv,
  fetchTvCredits,
  fetchTvDetail,
  fetchTvRecommendations,
  fetchTvVideos,
} from '../../services/tmdb/tmdbApi';
import type { CreditCastMember, MediaType, MovieListItem, TvListItem } from '../../services/tmdb/types';
import { useListsStore } from '../../store/listsStore';
import { useRecentStore } from '../../store/recentStore';
import type { WatchStatus } from '../../store/watchlistStore';
import { useWatchlist } from '../../store/watchlistStore';
import { tmdbWebUrl } from '../../utils/tmdbUrls';
import { ErrorState } from '../../shared/components/ErrorState';
import { MediaCard } from '../../shared/components/MediaCard';
import { Screen } from '../../shared/components/Screen';

type DetailRoute = RouteProp<
  { MediaDetail: { mediaType: MediaType; id: number | string; title?: string } },
  'MediaDetail'
>;

type MediaDetailNav = NativeStackNavigationProp<MediaFlowParamList, 'MediaDetail'>;

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
  const { isInWatchlist, getItem, toggle, setStatus, remove } = useWatchlist();
  const lists = useListsStore((s) => s.lists);
  const addToList = useListsStore((s) => s.addToList);
  const removeFromList = useListsStore((s) => s.removeFromList);
  const isInListFn = useListsStore((s) => s.isInList);
  const recordView = useRecentStore((s) => s.recordView);
  const { preferExternalTrailer } = useTrailerPreference();

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
  const [recoMovies, setRecoMovies] = useState<MovieListItem[]>([]);
  const [recoTv, setRecoTv] = useState<TvListItem[]>([]);
  const [youtubeKey, setYoutubeKey] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [cast, setCast] = useState<CreditCastMember[]>([]);
  const [tvSeasonCount, setTvSeasonCount] = useState(0);
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState(() => new Date(Date.now() + 3600_000));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (mediaType === 'movie') {
        const [d, sim, reco, vids, creds] = await Promise.all([
          fetchMovieDetail(id),
          fetchSimilarMovies(id),
          fetchMovieRecommendations(id),
          fetchMovieVideos(id),
          fetchMovieCredits(id),
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
        setRecoMovies(reco.results);
        setRecoTv([]);
        const trailer = vids.results.find(
          (x) => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'),
        );
        setYoutubeKey(trailer?.key ?? null);
        const sortedCast = [...creds.cast]
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .slice(0, 14);
        setCast(sortedCast);
        setTvSeasonCount(0);
        setBooksLoading(true);
        try {
          const b = await searchBooksByTitle(d.title, 8);
          setBooks(b);
        } finally {
          setBooksLoading(false);
        }
      } else {
        const [d, sim, reco, vids, creds] = await Promise.all([
          fetchTvDetail(id),
          fetchSimilarTv(id),
          fetchTvRecommendations(id),
          fetchTvVideos(id),
          fetchTvCredits(id),
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
        setRecoTv(reco.results);
        setRecoMovies([]);
        setBooks([]);
        const trailer = vids.results.find(
          (x) => x.site === 'YouTube' && (x.type === 'Trailer' || x.type === 'Teaser'),
        );
        setYoutubeKey(trailer?.key ?? null);
        const sortedCast = [...creds.cast]
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .slice(0, 14);
        setCast(sortedCast);
        setTvSeasonCount(d.number_of_seasons ?? 0);
      }
    } catch (e) {
      setError(isAppError(e) ? e.message : i18n.t('errors.failedLoadDetails'));
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (detailTitle && posterPath !== undefined) {
      recordView({
        mediaType,
        id,
        title: detailTitle,
        posterPath,
      });
    }
  }, [detailTitle, posterPath, id, mediaType, recordView]);

  useLayoutEffect(() => {
    if (detailTitle) {
      navigation.setOptions({ title: detailTitle });
    }
  }, [detailTitle, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => void Linking.openURL(tmdbWebUrl(mediaType, id))}
          style={styles.headerLink}
          accessibilityRole="link"
          accessibilityLabel={i18n.t('detail.viewOnTmdb')}
        >
          <Text style={[styles.headerLinkText, { color: colors.primary }]}>TMDB</Text>
        </Pressable>
      ),
    });
  }, [colors.primary, id, mediaType, navigation]);

  const inList = isInWatchlist(mediaType, id);
  const saved = getItem(mediaType, id);
  const currentStatus: WatchStatus | null = saved?.status ?? null;

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

  const recoData = useMemo(() => {
    if (mediaType === 'movie') {
      return recoMovies.map((m) => ({
        key: `rm-${m.id}`,
        title: m.title,
        posterPath: m.poster_path,
        subtitle: m.release_date?.slice(0, 4),
        mediaType: 'movie' as const,
        id: m.id,
      }));
    }
    return recoTv.map((m) => ({
      key: `rt-${m.id}`,
      title: m.name,
      posterPath: m.poster_path,
      subtitle: m.first_air_date?.slice(0, 4),
      mediaType: 'tv' as const,
      id: m.id,
    }));
  }, [mediaType, recoMovies, recoTv]);

  const onShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = tmdbWebUrl(mediaType, id);
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { url, title: detailTitle }
          : { message: `${detailTitle}\n${url}`, url },
      );
    } catch {
      /* dismissed */
    }
  }, [mediaType, id, detailTitle]);

  const setWatchStatus = (status: WatchStatus | null) => {
    void Haptics.selectionAsync();
    if (status === null) {
      remove(mediaType, id);
      return;
    }
    if (inList) {
      setStatus(mediaType, id, status);
    } else {
      toggle({
        mediaType,
        id,
        title: detailTitle,
        posterPath,
        status,
      });
    }
  };

  const scheduleReminder = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(i18n.t('detail.reminderTitle'), i18n.t('detail.reminderPermission'));
      return;
    }
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `reminder-${mediaType}-${id}`,
        content: {
          title: detailTitle,
          body: i18n.t('detail.reminderPrompt'),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });
      setReminderModalOpen(false);
      Alert.alert(i18n.t('detail.reminderTitle'), 'Scheduled.');
    } catch {
      Alert.alert(i18n.t('errors.loadFailed'), 'Could not schedule.');
    }
  };

  const cancelReminders = async () => {
    await Notifications.cancelScheduledNotificationAsync(`reminder-${mediaType}-${id}`);
    setReminderModalOpen(false);
  };

  if (loading && !detailTitle && !overview) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator accessibilityLabel={i18n.t('a11y.loading')} color={colors.primary} />
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
                {i18n.t('detail.rating', { v: vote.toFixed(1) })}
              </Text>
            ) : null}
          </View>
        </View>

        {genres.length > 0 ? (
          <Text
            style={[styles.genres, { color: colors.text, opacity: 0.8 }]}
            accessibilityLabel={`${i18n.t('detail.genresPrefix')}: ${genres.join(', ')}`}
          >
            {genres.join(' · ')}
          </Text>
        ) : null}

        <Text style={[styles.subheading, { color: colors.text }]}>{i18n.t('detail.statusLabel')}</Text>
        <View style={styles.statusRow}>
          {(['wishlist', 'watched', 'dropped'] as const).map((st) => (
            <Pressable
              key={st}
              onPress={() => setWatchStatus(st)}
              style={[
                styles.statusChip,
                {
                  borderColor: colors.border,
                  backgroundColor: currentStatus === st ? colors.primary : colors.card,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: currentStatus === st }}
              accessibilityLabel={i18n.t(
                st === 'wishlist'
                  ? 'detail.statusWishlist'
                  : st === 'watched'
                    ? 'detail.statusWatched'
                    : 'detail.statusDropped',
              )}
            >
              <Text
                style={[
                  styles.statusChipText,
                  { color: currentStatus === st ? '#fff' : colors.text },
                ]}
              >
                {i18n.t(
                  st === 'wishlist'
                    ? 'detail.statusWishlist'
                    : st === 'watched'
                      ? 'detail.statusWatched'
                      : 'detail.statusDropped',
                )}
              </Text>
            </Pressable>
          ))}
          {inList ? (
            <Pressable
              onPress={() => setWatchStatus(null)}
              style={[styles.statusChip, { borderColor: colors.border, backgroundColor: colors.card }]}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('detail.statusNone')}
            >
              <Text style={[styles.statusChipText, { color: colors.text }]}>
                {i18n.t('detail.removeWatchlist')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => setListModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('lists.addToList')}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              {i18n.t('lists.addToList')}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => void onShare()}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('a11y.shareTitle')}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              {i18n.t('detail.share')}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={() => setReminderModalOpen(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
              {i18n.t('detail.reminderSchedule')}
            </Text>
          </Pressable>
          {youtubeKey && preferExternalTrailer ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${youtubeKey}`)}
              accessibilityRole="button"
              accessibilityLabel={i18n.t('detail.watchTrailer')}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                {i18n.t('detail.watchTrailer')}
              </Text>
            </Pressable>
          ) : null}
          {youtubeKey && !preferExternalTrailer ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => setTrailerOpen(true)}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                {i18n.t('detail.trailerInApp')}
              </Text>
            </Pressable>
          ) : null}
          {youtubeKey && !preferExternalTrailer ? (
            <Pressable
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => void Linking.openURL(`https://www.youtube.com/watch?v=${youtubeKey}`)}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                {i18n.t('detail.trailerYoutube')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.overview, { color: colors.text }]}>{overview}</Text>

        {mediaType === 'tv' && tvSeasonCount > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('detail.seasons')}
            </Text>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              <View style={styles.seasonRow}>
                {Array.from({ length: tvSeasonCount }, (_, i) => i + 1).map((sn) => (
                  <Pressable
                    key={sn}
                    onPress={() =>
                      navigation.navigate('TvSeason', {
                        tvId: id,
                        seasonNumber: sn,
                        showTitle: detailTitle,
                      })
                    }
                    style={[
                      styles.seasonChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={i18n.t('detail.seasonNumber', { n: sn })}
                  >
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      {i18n.t('detail.seasonNumber', { n: sn })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        ) : null}

        {cast.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('detail.cast')}</Text>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              <View style={styles.castRow}>
                {cast.map((person) => {
                  const uri = posterUrl(person.profile_path ?? undefined);
                  return (
                    <Pressable
                      key={person.id}
                      style={styles.castItem}
                      onPress={() =>
                        navigation.navigate('PersonDetail', { id: person.id, name: person.name })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${person.name}${person.character ? ` as ${person.character}` : ''}`}
                    >
                      {uri ? (
                        <Image source={{ uri }} style={styles.castAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.castAvatar, { backgroundColor: colors.border }]}>
                          <Text style={[styles.castInitial, { color: colors.text }]} numberOfLines={1}>
                            {person.name.slice(0, 1)}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.castName, { color: colors.text }]} numberOfLines={2}>
                        {person.name}
                      </Text>
                      {person.character ? (
                        <Text
                          style={[styles.castCharacter, { color: colors.text }]}
                          numberOfLines={2}
                        >
                          {person.character}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </>
        ) : null}

        {recoData.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {i18n.t('detail.recommendations')}
            </Text>
            <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
              {recoData.map((item) => (
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

        {similarData.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('detail.similar')}</Text>
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

        {mediaType === 'movie' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{i18n.t('detail.books')}</Text>
            {booksLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginLeft: 16 }} />
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {books.map((b, idx) => (
                  <Text key={`${b.key ?? b.title}-${idx}`} style={[{ color: colors.text }, styles.bookLine]}>
                    {b.title}
                    {b.authorName ? ` — ${b.authorName}` : ''}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      <Modal visible={listModalOpen} transparent animationType="fade" onRequestClose={() => setListModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setListModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{i18n.t('lists.addToList')}</Text>
            <FlatList
              data={lists}
              keyExtractor={(l) => l.id}
              ListEmptyComponent={
                <Text style={{ color: colors.text }}>{i18n.t('lists.none')}</Text>
              }
              renderItem={({ item }) => {
                const on = isInListFn(item.id, mediaType, id);
                return (
                  <Pressable
                    style={styles.listRow}
                    onPress={() => {
                      if (on) removeFromList(item.id, mediaType, id);
                      else
                        addToList(item.id, {
                          mediaType,
                          id,
                          title: detailTitle,
                          posterPath,
                        });
                    }}
                    accessibilityRole="button"
                  >
                    <Text style={{ color: colors.text, flex: 1 }}>{item.name}</Text>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>
                      {on ? '−' : '+'}
                    </Text>
                  </Pressable>
                );
              }}
            />
            <Pressable onPress={() => setListModalOpen(false)} style={styles.modalClose}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{i18n.t('common.ok')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={reminderModalOpen} transparent animationType="slide" onRequestClose={() => setReminderModalOpen(false)}>
        <View style={styles.reminderModal}>
          <View style={[styles.reminderCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {i18n.t('detail.reminderTitle')}
            </Text>
            <DateTimePicker
              value={reminderDate}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, d) => {
                if (d) setReminderDate(d);
              }}
            />
            <View style={styles.reminderActions}>
              <Pressable onPress={() => void scheduleReminder()} style={styles.reminderBtn}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {i18n.t('detail.reminderSchedule')}
                </Text>
              </Pressable>
              <Pressable onPress={() => void cancelReminders()}>
                <Text style={{ color: colors.text }}>{i18n.t('detail.reminderCancel')}</Text>
              </Pressable>
              <Pressable onPress={() => setReminderModalOpen(false)}>
                <Text style={{ color: colors.text }}>{i18n.t('common.close')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  headerLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerLinkText: {
    fontSize: 15,
    fontWeight: '800',
  },
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
  subheading: {
    marginTop: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusChipText: {
    fontWeight: '600',
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
  seasonRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    paddingBottom: 4,
  },
  seasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookLine: {
    marginBottom: 8,
    fontSize: 14,
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
  castRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 12,
    paddingBottom: 4,
  },
  castItem: {
    width: 88,
  },
  castAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  castInitial: {
    fontSize: 28,
    fontWeight: '800',
  },
  castName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  castCharacter: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.7,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '70%',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  reminderModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  reminderCard: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  reminderActions: {
    gap: 12,
    marginTop: 12,
  },
  reminderBtn: {
    paddingVertical: 8,
  },
});
