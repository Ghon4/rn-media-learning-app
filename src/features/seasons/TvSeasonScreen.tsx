import { useQuery } from '@tanstack/react-query';
import { RouteProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { i18n } from '../../i18n';
import type { MediaFlowParamList, TvSeasonParams } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { fetchTvSeasonDetail } from '../../services/tmdb/tmdbApi';
import type { TvEpisode } from '../../services/tmdb/types';
import { ErrorState } from '../../shared/components/ErrorState';
import { Screen } from '../../shared/components/Screen';

type Route = RouteProp<{ TvSeason: TvSeasonParams }, 'TvSeason'>;
type Nav = NativeStackNavigationProp<MediaFlowParamList, 'TvSeason'>;

function normalizeParams(p: TvSeasonParams) {
  const tvId = typeof p.tvId === 'string' ? parseInt(p.tvId, 10) : p.tvId;
  const seasonNumber =
    typeof p.seasonNumber === 'string' ? parseInt(p.seasonNumber, 10) : p.seasonNumber;
  return { tvId, seasonNumber, showTitle: p.showTitle };
}

export function TvSeasonScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { tvId, seasonNumber, showTitle } = normalizeParams(route.params);

  const query = useQuery({
    queryKey: ['tmdb', 'tv', tvId, 'season', seasonNumber],
    queryFn: () => fetchTvSeasonDetail(tvId, seasonNumber),
    enabled: Number.isFinite(tvId) && Number.isFinite(seasonNumber),
  });

  const title = useMemo(
    () =>
      query.data?.name
        ? `${showTitle ? `${showTitle} · ` : ''}${query.data.name}`
        : showTitle ?? i18n.t('seasons.title', { n: seasonNumber }),
    [query.data?.name, seasonNumber, showTitle],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: title.slice(0, 80) });
  }, [navigation, title]);

  const error =
    !Number.isFinite(tvId) || !Number.isFinite(seasonNumber)
      ? i18n.t('errors.loadFailed')
      : query.isError && !query.data
        ? isAppError(query.error)
          ? query.error.message
          : i18n.t('errors.loadFailed')
        : null;

  const loading = query.isLoading && !query.data;

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const episodes = query.data?.episodes ?? [];

  const renderEpisode = ({ item }: { item: TvEpisode }) => {
    const dateStr = item.air_date?.slice(0, 10) ?? i18n.t('seasons.airDateUnknown');
    const meta = i18n.t('seasons.episodeMeta', { ep: item.episode_number, date: dateStr });
    return (
      <View style={[styles.episodeRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.epMeta, { color: colors.text, opacity: 0.75 }]}>{meta}</Text>
        <Text style={[styles.epTitle, { color: colors.text }]}>{item.name}</Text>
        {item.overview ? (
          <Text style={[styles.epOverview, { color: colors.text, opacity: 0.85 }]} numberOfLines={4}>
            {item.overview}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <Screen>
      <FlatList
        data={episodes}
        keyExtractor={(e) => `ep-${e.id}`}
        renderItem={renderEpisode}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          query.data?.overview ? (
            <Text style={[styles.overview, { color: colors.text }]}>{query.data.overview}</Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <Text style={{ color: colors.text }}>{i18n.t('a11y.loading')}</Text>
          ) : (
            <Text style={{ color: colors.text }}>{i18n.t('discover.noResults')}</Text>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  overview: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  episodeRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  epMeta: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  epTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  epOverview: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});
