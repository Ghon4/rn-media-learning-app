import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useWatchlist } from '../../store/watchlistStore';
import type { LibraryStackParamList } from '../../navigation/types';
import { posterUrl } from '../../services/tmdb/constants';
import { Screen } from '../../shared/components/Screen';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'Library'>;

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { items, hydrated, remove } = useWatchlist();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  if (!hydrated) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={{ color: colors.text }}>Loading your list…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={items}
        keyExtractor={(i) => `${i.mediaType}-${i.id}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing saved yet</Text>
            <Text style={[styles.emptySub, { color: colors.text, opacity: 0.7 }]}>
              Add titles from details to see them here.
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
                accessibilityLabel={`Open ${item.title}`}
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
                    {item.mediaType === 'movie' ? 'Movie' : 'TV'}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove(item.mediaType, item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from watchlist`}
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
