import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MediaType } from '../services/tmdb/types';

export const LISTS_STORAGE_KEY = 'custom-lists-v1';

export type MediaRef = {
  mediaType: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
};

export type CustomList = {
  id: string;
  name: string;
  createdAt: number;
  items: MediaRef[];
};

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type ListsState = {
  lists: CustomList[];
  hydrated: boolean;
  createList: (name: string) => CustomList;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  addToList: (listId: string, item: Omit<MediaRef, 'addedAt'> & { addedAt?: number }) => void;
  removeFromList: (listId: string, mediaType: MediaType, id: number) => void;
  isInList: (listId: string, mediaType: MediaType, id: number) => boolean;
  clearAll: () => void;
  _setHydrated: (v: boolean) => void;
};

export const useListsStore = create<ListsState>()(
  persist(
    (set, get) => ({
      lists: [],
      hydrated: false,
      _setHydrated: (v: boolean) => set({ hydrated: v }),
      createList: (name) => {
        const list: CustomList = {
          id: genId(),
          name: name.trim() || 'List',
          createdAt: Date.now(),
          items: [],
        };
        set({ lists: [...get().lists, list] });
        return list;
      },
      renameList: (listId, name) => {
        set({
          lists: get().lists.map((l) =>
            l.id === listId ? { ...l, name: name.trim() || l.name } : l,
          ),
        });
      },
      deleteList: (listId) => {
        set({ lists: get().lists.filter((l) => l.id !== listId) });
      },
      addToList: (listId, item) => {
        const lists = get().lists;
        const idx = lists.findIndex((l) => l.id === listId);
        if (idx === -1) return;
        const list = lists[idx];
        const exists = list.items.some((i) => i.mediaType === item.mediaType && i.id === item.id);
        if (exists) return;
        const ref: MediaRef = {
          mediaType: item.mediaType,
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          addedAt: item.addedAt ?? Date.now(),
        };
        const nextList = { ...list, items: [ref, ...list.items] };
        const nextLists = [...lists];
        nextLists[idx] = nextList;
        set({ lists: nextLists });
      },
      removeFromList: (listId, mediaType, id) => {
        set({
          lists: get().lists.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  items: l.items.filter((i) => !(i.mediaType === mediaType && i.id === id)),
                }
              : l,
          ),
        });
      },
      isInList: (listId, mediaType, id) => {
        const list = get().lists.find((l) => l.id === listId);
        return list?.items.some((i) => i.mediaType === mediaType && i.id === id) ?? false;
      },
      clearAll: () => set({ lists: [] }),
    }),
    {
      name: LISTS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ lists: state.lists }),
    },
  ),
);

export function useLists() {
  const lists = useListsStore((s) => s.lists);
  const hydrated = useListsStore((s) => s.hydrated);
  const createList = useListsStore((s) => s.createList);
  const renameList = useListsStore((s) => s.renameList);
  const deleteList = useListsStore((s) => s.deleteList);
  const addToList = useListsStore((s) => s.addToList);
  const removeFromList = useListsStore((s) => s.removeFromList);
  const isInList = useListsStore((s) => s.isInList);
  const clearAll = useListsStore((s) => s.clearAll);
  return {
    lists,
    hydrated,
    createList,
    renameList,
    deleteList,
    addToList,
    removeFromList,
    isInList,
    clearAll,
  };
}
