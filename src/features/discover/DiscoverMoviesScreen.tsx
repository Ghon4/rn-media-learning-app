import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { i18n } from '../../i18n';
import type { HomeStackParamList } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { posterUrl } from '../../services/tmdb/constants';
import { discoverMovies, fetchMovieGenres } from '../../services/tmdb/tmdbApi';
import type { DiscoverMovieSort, MovieListItem } from '../../services/tmdb/types';
import { ErrorState } from '../../shared/components/ErrorState';
import { Screen } from '../../shared/components/Screen';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'DiscoverMovies'>;

const SORT_OPTIONS: { key: DiscoverMovieSort; labelKey: string }[] = [
  { key: 'popularity.desc', labelKey: 'discover.sortPopularity' },
  { key: 'vote_average.desc', labelKey: 'discover.sortRating' },
  { key: 'primary_release_date.desc', labelKey: 'discover.sortNew' },
];

export function DiscoverMoviesScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const [genreId, setGenreId] = useState<number | undefined>(undefined);
  const [yearText, setYearText] = useState('');
  const [sortBy, setSortBy] = useState<DiscoverMovieSort>('popularity.desc');

  const yearNum = useMemo(() => {
    const y = parseInt(yearText.trim(), 10);
    return Number.isFinite(y) && y >= 1900 && y <= 2100 ? y : undefined;
  }, [yearText]);

  const genresQuery = useQuery({
    queryKey: ['tmdb', 'genres', 'movie'],
    queryFn: fetchMovieGenres,
  });

  const discoverQuery = useInfiniteQuery({
    queryKey: ['tmdb', 'discover', 'movie', genreId, yearNum, sortBy],
    queryFn: ({ pageParam }) =>
      discoverMovies({
        page: pageParam,
        with_genres: genreId != null ? String(genreId) : undefined,
        primary_release_year: yearNum,
        sort_by: sortBy,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.total_pages ? last.page + 1 : undefined),
  });

  const movies = useMemo(
    () => discoverQuery.data?.pages.flatMap((p) => p.results) ?? [],
    [discoverQuery.data?.pages],
  );

  const onRefresh = useCallback(() => void discoverQuery.refetch(), [discoverQuery]);

  const loadMore = useCallback(() => {
    if (discoverQuery.hasNextPage && !discoverQuery.isFetchingNextPage) {
      void discoverQuery.fetchNextPage();
    }
  }, [discoverQuery]);

  const renderItem = useCallback(
    ({ item }: { item: MovieListItem }) => {
      const uri = posterUrl(item.poster_path ?? undefined);
      return (
        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() =>
            navigation.navigate('MediaDetail', {
              mediaType: 'movie',
              id: item.id,
              title: item.title,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={item.title}
          accessibilityHint={i18n.t('a11y.opensDetails')}
        >
          <View style={[styles.thumb, { backgroundColor: colors.border }]}>
            {uri ? (
              <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
            ) : (
              <Text style={[styles.fallback, { color: colors.text }]} numberOfLines={3}>
                {item.title}
              </Text>
            )}
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
        </Pressable>
      );
    },
    [colors, navigation],
  );

  if (genresQuery.isError) {
    const e = genresQuery.error;
    return (
      <Screen>
        <ErrorState
          message={isAppError(e) ? e.message : i18n.t('errors.genresFailed')}
          onRetry={() => void genresQuery.refetch()}
        />
      </Screen>
    );
  }

  if (discoverQuery.isError && movies.length === 0) {
    const e = discoverQuery.error;
    return (
      <Screen>
        <ErrorState
          message={isAppError(e) ? e.message : i18n.t('errors.loadFailed')}
          onRetry={() => void discoverQuery.refetch()}
        />
      </Screen>
    );
  }

  const filtersHeader = (
    <View style={styles.filters}>
      <Text style={[styles.filterLabel, { color: colors.text }]}>{i18n.t('discover.genres')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        <Pressable
          onPress={() => setGenreId(undefined)}
          style={[
            styles.chip,
            {
              borderColor: colors.border,
              backgroundColor: genreId === undefined ? colors.primary : colors.card,
            },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: genreId === undefined }}
          accessibilityLabel={i18n.t('discover.allGenres')}
        >
          <Text
            style={[styles.chipText, { color: genreId === undefined ? '#fff' : colors.text }]}
          >
            {i18n.t('discover.allGenres')}
          </Text>
        </Pressable>
        {(genresQuery.data?.genres ?? []).map((g) => (
          <Pressable
            key={g.id}
            onPress={() => setGenreId(g.id)}
            style={[
              styles.chip,
              {
                borderColor: colors.border,
                backgroundColor: genreId === g.id ? colors.primary : colors.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: genreId === g.id }}
            accessibilityLabel={g.name}
          >
            <Text style={[styles.chipText, { color: genreId === g.id ? '#fff' : colors.text }]}>
              {g.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={[styles.filterLabel, { color: colors.text, marginTop: 12 }]}>
        {i18n.t('discover.year')}
      </Text>
      <TextInput
        value={yearText}
        onChangeText={setYearText}
        placeholder={i18n.t('discover.yearPlaceholder')}
        placeholderTextColor={`${colors.text}88`}
        keyboardType="number-pad"
        maxLength={4}
        style={[
          styles.yearInput,
          { color: colors.text, borderColor: colors.border, backgroundColor: colors.card },
        ]}
        accessibilityLabel={i18n.t('discover.year')}
      />

      <Text style={[styles.filterLabel, { color: colors.text, marginTop: 12 }]}>
        {i18n.t('discover.sort')}
      </Text>
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setSortBy(opt.key)}
            style={[
              styles.sortChip,
              {
                borderColor: colors.border,
                backgroundColor: sortBy === opt.key ? colors.primary : colors.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: sortBy === opt.key }}
            accessibilityLabel={i18n.t(opt.labelKey)}
          >
            <Text
              style={[styles.chipText, { color: sortBy === opt.key ? '#fff' : colors.text }]}
            >
              {i18n.t(opt.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <Screen>
      <FlatList
        data={movies}
        keyExtractor={(item) => `d-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        ListHeaderComponent={filtersHeader}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={discoverQuery.isRefetching} onRefresh={() => void onRefresh()} />
        }
        onEndReachedThreshold={0.35}
        onEndReached={() => loadMore()}
        ListEmptyComponent={
          discoverQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} accessibilityLabel={i18n.t('a11y.loading')} />
            </View>
          ) : (
            <Text style={[styles.empty, { color: colors.text }]}>{i18n.t('discover.noResults')}</Text>
          )
        }
        ListFooterComponent={
          discoverQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    paddingBottom: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    opacity: 0.85,
  },
  chipRow: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 8,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  yearInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  columnWrap: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingBottom: 8,
  },
  thumb: {
    aspectRatio: 2 / 3,
    width: '100%',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    padding: 8,
    fontSize: 12,
  },
  cardTitle: {
    paddingHorizontal: 8,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 24,
  },
  footer: {
    paddingVertical: 16,
  },
});
