import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { i18n } from '../../i18n';
import type { LibraryStackParamList } from '../../navigation/types';
import { posterUrl } from '../../services/tmdb/constants';
import type { WatchStatus } from '../../store/watchlistStore';
import { useWatchlist } from '../../store/watchlistStore';
import { Screen } from '../../shared/components/Screen';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

type FilterKey = 'all' | WatchStatus;

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { items, hydrated, remove } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('CustomLists')}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('library.manageLists')}
        >
          <Ionicons name="list-outline" size={26} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [colors.primary, navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  const filters: { key: FilterKey; labelKey: string }[] = [
    { key: 'all', labelKey: 'library.filterAll' },
    { key: 'wishlist', labelKey: 'library.filterWishlist' },
    { key: 'watched', labelKey: 'library.filterWatched' },
    { key: 'dropped', labelKey: 'library.filterDropped' },
  ];

  if (!hydrated) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>{i18n.t('library.loading')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.filterBar}>
        {filters.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              {
                borderColor: colors.border,
                backgroundColor: filter === f.key ? colors.primary : colors.card,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
            accessibilityLabel={i18n.t(f.labelKey)}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filter === f.key ? '#fff' : colors.text },
              ]}
            >
              {i18n.t(f.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => `${i.mediaType}-${i.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={
          filtered.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {i18n.t('library.emptyTitle')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.text, opacity: 0.7 }]}>
              {i18n.t('library.emptySub')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const uri = posterUrl(item.posterPath ?? undefined);
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable
                style={styles.cardMain}
                onPress={() =>
                  navigation.navigate('MediaDetail', {
                    mediaType: item.mediaType,
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
                    <Text style={[styles.thumbFallback, { color: colors.text }]} numberOfLines={2}>
                      {item.title}
                    </Text>
                  )}
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.meta, { color: colors.text, opacity: 0.65 }]}>
                    {item.mediaType === 'movie' ? i18n.t('library.typeMovie') : i18n.t('library.typeTv')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove(item.mediaType, item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${i18n.t('detail.removeWatchlist')} ${item.title}`}
                hitSlop={12}
                style={styles.removeBtn}
              >
                <Ionicons name="trash-outline" size={22} color={colors.notification} />
              </Pressable>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  empty: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
  },
  thumb: {
    width: 56,
    height: 84,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    fontSize: 10,
    textAlign: 'center',
    padding: 4,
  },
  cardText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
  },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
