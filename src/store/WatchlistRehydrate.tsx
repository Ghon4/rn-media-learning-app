import { useEffect } from 'react';

import { useWatchlistStore } from './watchlistStore';

/** Marks the persisted watchlist as ready after zustand-persist finishes (or if already done). */
export function WatchlistRehydrate() {
  useEffect(() => {
    const unsub = useWatchlistStore.persist.onFinishHydration(() => {
      useWatchlistStore.getState()._setHydrated(true);
    });
    if (useWatchlistStore.persist.hasHydrated()) {
      useWatchlistStore.getState()._setHydrated(true);
    }
    return unsub;
  }, []);
  return null;
}
