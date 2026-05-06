import { useQuery } from '@tanstack/react-query';
import { RouteProp, useNavigation, useRoute, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { MediaFlowParamList, PersonDetailParams } from '../../navigation/types';
import { isAppError } from '../../services/api/errors';
import { posterUrl } from '../../services/tmdb/constants';
import { fetchPersonCombinedCredits, fetchPersonProfile } from '../../services/tmdb/tmdbApi';
import type { PersonCastCredit } from '../../services/tmdb/types';
import { ErrorState } from '../../shared/components/ErrorState';
import { Screen } from '../../shared/components/Screen';
import { tmdbPersonWebUrl } from '../../utils/tmdbUrls';

type PersonRoute = RouteProp<{ PersonDetail: PersonDetailParams }, 'PersonDetail'>;
type Nav = NativeStackNavigationProp<MediaFlowParamList, 'PersonDetail'>;

export function PersonDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PersonRoute>();
  const rawId = route.params.id;
  const id = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
  const initialName = route.params.name ?? '';

  const profileQuery = useQuery({
    queryKey: ['tmdb', 'person', id],
    queryFn: () => fetchPersonProfile(id),
    enabled: Number.isFinite(id),
  });

  const creditsQuery = useQuery({
    queryKey: ['tmdb', 'person', id, 'combinedCredits'],
    queryFn: () => fetchPersonCombinedCredits(id),
    enabled: Number.isFinite(id),
  });

  const name = profileQuery.data?.name ?? initialName;
  const invalidId = !Number.isFinite(id);
  const loading = !invalidId && profileQuery.isLoading && !profileQuery.data;
  const error = invalidId
    ? 'Invalid person id'
    : profileQuery.isError && !profileQuery.data
      ? isAppError(profileQuery.error)
        ? profileQuery.error.message
        : 'Failed to load'
      : null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: name || 'Person' });
  }, [name, navigation]);

  const creditRows = useMemo(() => {
    const cast = creditsQuery.data?.cast ?? [];
    const seen = new Set<string>();
    const unique: PersonCastCredit[] = [];
    for (const c of cast) {
      const key = `${c.media_type}-${c.id}`;
      if (seen.has(key)) continue;
      if (!c.poster_path || !(c.title ?? c.name)) continue;
      seen.add(key);
      unique.push(c);
    }
    return unique
      .sort((a, b) => {
        const da = a.release_date ?? a.first_air_date ?? '';
        const db = b.release_date ?? b.first_air_date ?? '';
        return db.localeCompare(da);
      })
      .slice(0, 40);
  }, [creditsQuery.data?.cast]);

  const onRefresh = useCallback(() => {
    void profileQuery.refetch();
    void creditsQuery.refetch();
  }, [profileQuery, creditsQuery]);

  const onShare = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = tmdbPersonWebUrl(id);
    void Share.share({ message: `${name}\n${url}`, url });
  }, [id, name]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} accessibilityLabel="Loading person" />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void onRefresh()} />
      </Screen>
    );
  }

  const p = profileQuery.data;
  const profileUri = posterUrl(p?.profile_path ?? undefined);
  const meta = [p?.birthday, p?.place_of_birth].filter(Boolean).join(' · ');

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={creditRows}
        keyExtractor={(item) => `${item.media_type}-${item.id}`}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching || creditsQuery.isRefetching}
            onRefresh={() => void onRefresh()}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              {profileUri ? (
                <Image source={{ uri: profileUri }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.border }]} />
              )}
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
                {meta ? (
                  <Text style={[styles.meta, { color: colors.text, opacity: 0.75 }]}>{meta}</Text>
                ) : null}
                <Pressable
                  onPress={() => void onShare()}
                  style={({ pressed }) => [
                    styles.shareBtn,
                    { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Share person link"
                >
                  <Text style={[styles.shareBtnText, { color: colors.text }]}>Share</Text>
                </Pressable>
              </View>
            </View>
            {p?.biography ? (
              <Text style={[styles.bio, { color: colors.text }]}>{p.biography}</Text>
            ) : null}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Known for</Text>
          </View>
        }
        renderItem={({ item }) => {
          const title = item.title ?? item.name ?? '';
          const uri = posterUrl(item.poster_path ?? undefined);
          const subtitle = (item.release_date ?? item.first_air_date)?.slice(0, 4);
          return (
            <Pressable
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                navigation.navigate('MediaDetail', {
                  mediaType: item.media_type,
                  id: item.id,
                  title,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={title}
            >
              <View style={[styles.thumb, { backgroundColor: colors.border }]}>
                {uri ? (
                  <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
                ) : (
                  <Text style={{ color: colors.text, padding: 8 }} numberOfLines={3}>
                    {title}
                  </Text>
                )}
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={[styles.sub, { color: colors.text, opacity: 0.65 }]}>{subtitle}</Text>
              ) : null}
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  meta: {
    marginTop: 6,
    fontSize: 14,
  },
  shareBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  bio: {
    marginTop: 16,
    paddingHorizontal: 16,
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
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
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
  cardTitle: {
    paddingHorizontal: 8,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  sub: {
    paddingHorizontal: 8,
    fontSize: 12,
  },
});
