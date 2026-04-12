import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { MediaType } from '../services/tmdb/types';

export const WATCHLIST_STORAGE_KEY = 'watchlist-v1';

export type WatchlistItem = {
  mediaType: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
};

type WatchlistContextValue = {
  items: WatchlistItem[];
  isInWatchlist: (mediaType: MediaType, id: number) => boolean;
  toggle: (item: Omit<WatchlistItem, 'addedAt'> & { addedAt?: number }) => void;
  remove: (mediaType: MediaType, id: number) => void;
  clearAll: () => void;
  hydrated: boolean;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function sortItems(items: WatchlistItem[]) {
  return [...items].sort((a, b) => b.addedAt - a.addedAt);
}

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed = JSON.parse(raw) as WatchlistItem[];
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: WatchlistItem[]) => {
    setItems(next);
    try {
      await AsyncStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const isInWatchlist = useCallback(
    (mediaType: MediaType, id: number) =>
      items.some((i) => i.mediaType === mediaType && i.id === id),
    [items],
  );

  const toggle = useCallback(
    (item: Omit<WatchlistItem, 'addedAt'> & { addedAt?: number }) => {
      const exists = items.some((i) => i.mediaType === item.mediaType && i.id === item.id);
      if (exists) {
        void persist(items.filter((i) => !(i.mediaType === item.mediaType && i.id === item.id)));
        return;
      }
      const next: WatchlistItem = {
        ...item,
        addedAt: item.addedAt ?? Date.now(),
      };
      void persist(sortItems([...items, next]));
    },
    [items, persist],
  );

  const remove = useCallback(
    (mediaType: MediaType, id: number) => {
      void persist(items.filter((i) => !(i.mediaType === mediaType && i.id === id)));
    },
    [items, persist],
  );

  const clearAll = useCallback(() => {
    void persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({
      items,
      isInWatchlist,
      toggle,
      remove,
      clearAll,
      hydrated,
    }),
    [items, isInWatchlist, toggle, remove, clearAll, hydrated],
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return ctx;
}
