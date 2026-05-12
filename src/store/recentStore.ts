import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MediaType } from '../services/tmdb/types';

export const RECENT_STORAGE_KEY = 'recent-v1';

const MAX_RECENT = 40;

export type RecentItem = {
  mediaType: MediaType;
  id: number;
  title: string;
  posterPath: string | null;
  viewedAt: number;
};

type RecentState = {
  items: RecentItem[];
  hydrated: boolean;
  recordView: (item: Omit<RecentItem, 'viewedAt'> & { viewedAt?: number }) => void;
  clearAll: () => void;
  _setHydrated: (v: boolean) => void;
};

export const useRecentStore = create<RecentState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      _setHydrated: (v: boolean) => set({ hydrated: v }),
      recordView: (item) => {
        const viewedAt = item.viewedAt ?? Date.now();
        const key = `${item.mediaType}-${item.id}`;
        const rest = get().items.filter((i) => `${i.mediaType}-${i.id}` !== key);
        const next: RecentItem = {
          mediaType: item.mediaType,
          id: item.id,
          title: item.title,
          posterPath: item.posterPath,
          viewedAt,
        };
        const merged = [next, ...rest].slice(0, MAX_RECENT);
        set({ items: merged });
      },
      clearAll: () => set({ items: [] }),
    }),
    {
      name: RECENT_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
