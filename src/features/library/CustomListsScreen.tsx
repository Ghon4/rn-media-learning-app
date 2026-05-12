import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { i18n } from '../../i18n';
import type { LibraryStackParamList } from '../../navigation/types';
import { posterUrl } from '../../services/tmdb/constants';
import type { CustomList } from '../../store/listsStore';
import { useLists } from '../../store/listsStore';
import { Screen } from '../../shared/components/Screen';

type Nav = NativeStackNavigationProp<LibraryStackParamList, 'CustomLists'>;

export function CustomListsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { lists, hydrated, createList, deleteList, removeFromList } = useLists();
  const [name, setName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const onCreate = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createList(trimmed);
    setName('');
  }, [createList, name]);

  const confirmDeleteList = (list: CustomList) => {
    Alert.alert(i18n.t('lists.deleteConfirmTitle'), i18n.t('lists.deleteConfirmMsg'), [
      { text: i18n.t('settings.clearCancel'), style: 'cancel' },
      {
        text: i18n.t('settings.clearOk'),
        style: 'destructive',
        onPress: () => deleteList(list.id),
      },
    ]);
  };

  if (!hydrated) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>{i18n.t('a11y.loading')}</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={[styles.createRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={i18n.t('lists.createPlaceholder')}
          placeholderTextColor={`${colors.text}88`}
          style={[styles.input, { color: colors.text }]}
          accessibilityLabel={i18n.t('lists.createPlaceholder')}
        />
        <Pressable
          onPress={onCreate}
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
        >
          <Text style={styles.createBtnText}>{i18n.t('lists.create')}</Text>
        </Pressable>
      </View>

      <FlatList
        data={lists}
        keyExtractor={(l) => l.id}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.text }]}>{i18n.t('lists.empty')}</Text>
        }
        renderItem={({ item }) => {
          const open = expandedId === item.id;
          return (
            <View style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Pressable
                style={styles.listHeader}
                onPress={() => setExpandedId(open ? null : item.id)}
                accessibilityRole="button"
              >
                <Text style={[styles.listName, { color: colors.text }]}>{item.name}</Text>
                <Text style={{ color: colors.text, opacity: 0.7 }}>
                  {item.items.length}
                </Text>
                <Pressable
                  onPress={() => confirmDeleteList(item)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Delete list"
                >
                  <Ionicons name="trash-outline" size={22} color={colors.notification} />
                </Pressable>
              </Pressable>
              {open ? (
                <FlatList
                  data={item.items}
                  scrollEnabled={false}
                  keyExtractor={(it) => `${it.mediaType}-${it.id}`}
                  renderItem={({ item: ref }) => {
                    const uri = posterUrl(ref.posterPath ?? undefined);
                    return (
                      <Pressable
                        style={styles.itemRow}
                        onPress={() =>
                          navigation.navigate('MediaDetail', {
                            mediaType: ref.mediaType,
                            id: ref.id,
                            title: ref.title,
                          })
                        }
                      >
                        <View style={[styles.miniThumb, { backgroundColor: colors.border }]}>
                          {uri ? (
                            <Image source={{ uri }} style={styles.miniThumbImg} contentFit="cover" />
                          ) : (
                            <Text style={{ fontSize: 10, color: colors.text }} numberOfLines={2}>
                              {ref.title}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
                          {ref.title}
                        </Text>
                        <Pressable
                          onPress={() => removeFromList(item.id, ref.mediaType, ref.id)}
                          hitSlop={8}
                        >
                          <Ionicons name="close" size={22} color={colors.text} />
                        </Pressable>
                      </Pressable>
                    );
                  }}
                />
              ) : null}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  createBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    padding: 24,
  },
  listCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    gap: 8,
  },
  listName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  miniThumb: {
    width: 36,
    height: 54,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  miniThumbImg: {
    width: '100%',
    height: '100%',
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
