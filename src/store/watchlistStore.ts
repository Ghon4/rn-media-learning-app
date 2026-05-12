import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MediaType } from '../services/tmdb/types';

export const WATCHLIST_STORAGE_KEY = 'watchlist-v2';

export type WatchStatus = 'wishlist' | 'watched' | 'dropped';

export type WatchlistItem = {
  mediaType: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
  status: WatchStatus;
};

function sortItems(items: WatchlistItem[]) {
  return [...items].sort((a, b) => b.addedAt - a.addedAt);
}

function normalizeStatus(s: WatchStatus | undefined): WatchStatus {
  return s ?? 'wishlist';
}

type WatchlistState = {
  items: WatchlistItem[];
  hydrated: boolean;
  isInWatchlist: (mediaType: MediaType, id: number) => boolean;
  getItem: (mediaType: MediaType, id: number) => WatchlistItem | undefined;
  toggle: (item: Omit<WatchlistItem, 'addedAt' | 'status'> & { addedAt?: number; status?: WatchStatus }) => void;
  setStatus: (mediaType: MediaType, id: number, status: WatchStatus | null) => void;
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
      getItem: (mediaType, id) =>
        get().items.find((i) => i.mediaType === mediaType && i.id === id),
      toggle: (item) => {
        const items = get().items;
        const exists = items.some((i) => i.mediaType === item.mediaType && i.id === item.id);
        if (exists) {
          set({
            items: items.filter((i) => !(i.mediaType === item.mediaType && i.id === item.id)),
          });
        } else {
          const next: WatchlistItem = {
            mediaType: item.mediaType,
            id: item.id,
            title: item.title,
            posterPath: item.posterPath,
            addedAt: item.addedAt ?? Date.now(),
            status: normalizeStatus(item.status),
          };
          set({ items: sortItems([...items, next]) });
        }
      },
      setStatus: (mediaType, id, status) => {
        const items = get().items;
        const idx = items.findIndex((i) => i.mediaType === mediaType && i.id === id);
        if (status === null) {
          set({
            items: items.filter((i) => !(i.mediaType === mediaType && i.id === id)),
          });
          return;
        }
        if (idx === -1) {
          return;
        }
        const next = [...items];
        next[idx] = { ...next[idx], status };
        set({ items: sortItems(next) });
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
      merge: (persisted, current) => {
        const p = persisted as Partial<WatchlistState> | undefined;
        const raw = p?.items ?? [];
        const items: WatchlistItem[] = raw.map((i) => ({
          ...i,
          status: normalizeStatus(i.status),
        }));
        return { ...current, items };
      },
    },
  ),
);

export function useWatchlist() {
  const items = useWatchlistStore((s) => s.items);
  const hydrated = useWatchlistStore((s) => s.hydrated);
  const isInWatchlist = useWatchlistStore((s) => s.isInWatchlist);
  const getItem = useWatchlistStore((s) => s.getItem);
  const toggle = useWatchlistStore((s) => s.toggle);
  const setStatus = useWatchlistStore((s) => s.setStatus);
  const remove = useWatchlistStore((s) => s.remove);
  const clearAll = useWatchlistStore((s) => s.clearAll);
  return { items, hydrated, isInWatchlist, getItem, toggle, setStatus, remove, clearAll };
}
