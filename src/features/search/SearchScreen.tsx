import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { i18n } from '../../i18n';
import type { SearchStackParamList } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { posterUrl } from '../../services/tmdb/constants';
import { searchMovie, searchMulti, searchTv } from '../../services/tmdb/tmdbApi';
import { ErrorState } from '../../shared/components/ErrorState';
import { Screen } from '../../shared/components/Screen';

import {
  mapMovieSearchResults,
  mapSearchMultiResults,
  mapTvSearchResults,
  type SearchRow,
} from './searchMappers';

type Nav = NativeStackNavigationProp<SearchStackParamList, 'Search'>;

type Scope = 'all' | 'movie' | 'tv';

export function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 400);
  const [scope, setScope] = useState<Scope>('all');

  const [rows, setRows] = useState<SearchRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    async (nextPage: number, mode: 'replace' | 'append') => {
      if (!debounced.trim()) {
        setRows([]);
        setPage(1);
        setTotalPages(1);
        return;
      }
      if (mode === 'replace') setLoading(true);
      if (mode === 'append') setLoadingMore(true);
      setError(null);
      try {
        let data;
        if (scope === 'movie') {
          data = await searchMovie(debounced, nextPage);
          const mapped = mapMovieSearchResults(data.results);
          setTotalPages(data.total_pages);
          setPage(nextPage);
          setRows((prev) => (mode === 'append' ? [...prev, ...mapped] : mapped));
        } else if (scope === 'tv') {
          data = await searchTv(debounced, nextPage);
          const mapped = mapTvSearchResults(data.results);
          setTotalPages(data.total_pages);
          setPage(nextPage);
          setRows((prev) => (mode === 'append' ? [...prev, ...mapped] : mapped));
        } else {
          data = await searchMulti(debounced, nextPage);
          const mapped = mapSearchMultiResults(data.results);
          setTotalPages(data.total_pages);
          setPage(nextPage);
          setRows((prev) => (mode === 'append' ? [...prev, ...mapped] : mapped));
        }
      } catch (e) {
        setError(isAppError(e) ? e.message : i18n.t('search.failed'));
        if (mode === 'replace') setRows([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [debounced, scope],
  );

  useEffect(() => {
    void runSearch(1, 'replace');
  }, [debounced, scope, runSearch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void runSearch(1, 'replace');
  }, [runSearch]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || page >= totalPages || !debounced.trim()) return;
    void runSearch(page + 1, 'append');
  }, [debounced, loading, loadingMore, page, runSearch, totalPages]);

  const scopes: { key: Scope; labelKey: string }[] = [
    { key: 'all', labelKey: 'search.scopeAll' },
    { key: 'movie', labelKey: 'search.scopeMovies' },
    { key: 'tv', labelKey: 'search.scopeTv' },
  ];

  return (
    <Screen>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={i18n.t('search.placeholder')}
          placeholderTextColor={`${colors.text}88`}
          style={[styles.input, { color: colors.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={i18n.t('search.placeholder')}
        />
      </View>

      <View style={styles.scopeRow}>
        {scopes.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setScope(s.key)}
            style={[
              styles.scopeChip,
              {
                borderColor: colors.border,
                backgroundColor: scope === s.key ? colors.primary : colors.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: scope === s.key }}
            accessibilityLabel={i18n.t(s.labelKey)}
          >
            <Text
              style={[
                styles.scopeChipText,
                { color: scope === s.key ? '#fff' : colors.text },
              ]}
            >
              {i18n.t(s.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {error && rows.length === 0 && !loading ? (
        <ErrorState message={error} onRetry={() => void runSearch(1, 'replace')} />
      ) : null}

      {!debounced.trim() ? (
        <View style={styles.hintWrap}>
          <Text style={[styles.hint, { color: colors.text, opacity: 0.7 }]}>
            {i18n.t('search.empty')}
          </Text>
        </View>
      ) : null}

      {loading && rows.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} accessibilityLabel={i18n.t('a11y.loading')} />
        </View>
      ) : null}

      <FlashList
        data={rows}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        style={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const uri = posterUrl(item.posterPath ?? undefined);
          return (
            <Pressable
              style={[styles.row, { borderBottomColor: colors.border }]}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: item.kind === 'movie' ? 'movie' : 'tv',
                  id: item.id,
                  title: item.title,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.kind === 'movie' ? i18n.t('library.typeMovie') : i18n.t('library.typeTv')}`}
            >
              <View style={[styles.thumb, { backgroundColor: colors.border }]}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
                ) : (
                  <Text style={[styles.thumbFallback, { color: colors.text }]} numberOfLines={3}>
                    {item.title}
                  </Text>
                )}
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={[styles.rowSub, { color: colors.text, opacity: 0.65 }]}>
                    {item.subtitle} ·{' '}
                    {item.kind === 'movie' ? i18n.t('library.typeMovie') : i18n.t('library.typeTv')}
                  </Text>
                ) : (
                  <Text style={[styles.rowSub, { color: colors.text, opacity: 0.65 }]}>
                    {item.kind === 'movie' ? i18n.t('library.typeMovie') : i18n.t('library.typeTv')}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  scopeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scopeChipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    paddingVertical: 10,
    fontSize: 16,
  },
  hintWrap: {
    padding: 24,
  },
  hint: {
    textAlign: 'center',
    fontSize: 15,
  },
  centered: {
    paddingTop: 24,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 48,
    height: 72,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    fontSize: 9,
    textAlign: 'center',
    padding: 4,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 13,
  },
  footer: {
    paddingVertical: 16,
  },
});
