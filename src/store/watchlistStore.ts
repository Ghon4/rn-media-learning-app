import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MediaType } from '../services/tmdb/types';

export const WATCHLIST_STORAGE_KEY = 'watchlist-v1';

export type WatchlistItem = {
  mediaType: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
};

function sortItems(items: WatchlistItem[]) {
  return [...items].sort((a, b) => b.addedAt - a.addedAt);
}

type WatchlistState = {
  items: WatchlistItem[];
  hydrated: boolean;
  isInWatchlist: (mediaType: MediaType, id: number) => boolean;
  toggle: (item: Omit<WatchlistItem, 'addedAt'> & { addedAt?: number }) => void;
  remove: (mediaType: MediaType, id: number) => void;
  clearAll: () => void;
  _setHydrated: (v: boolean) => void;
};

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      _setHydrated: (v) => set({ hydrated: v }),
      isInWatchlist: (mediaType, id) =>
        get().items.some((i) => i.mediaType === mediaType && i.id === id),
      toggle: (item) => {
        const items = get().items;
        const exists = items.some((i) => i.mediaType === item.mediaType && i.id === item.id);
        if (exists) {
          set({
            items: items.filter((i) => !(i.mediaType === item.mediaType && i.id === item.id)),
          });
        } else {
          const next: WatchlistItem = {
            ...item,
            addedAt: item.addedAt ?? Date.now(),
          };
          set({ items: sortItems([...items, next]) });
        }
      },
      remove: (mediaType, id) => {
        set({
          items: get().items.filter((i) => !(i.mediaType === mediaType && i.id === id)),
        });
      },
      clearAll: () => set({ items: [] }),
    }),
    {
      name: WATCHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Hook matching the former Context API for minimal call-site churn. */
export function useWatchlist() {
  const items = useWatchlistStore((s) => s.items);
  const hydrated = useWatchlistStore((s) => s.hydrated);
  const isInWatchlist = useWatchlistStore((s) => s.isInWatchlist);
  const toggle = useWatchlistStore((s) => s.toggle);
  const remove = useWatchlistStore((s) => s.remove);
  const clearAll = useWatchlistStore((s) => s.clearAll);
  return { items, hydrated, isInWatchlist, toggle, remove, clearAll };
}
