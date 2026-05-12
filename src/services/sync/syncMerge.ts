import { useListsStore } from '../../store/listsStore';
import { useRecentStore } from '../../store/recentStore';
import { useWatchlistStore } from '../../store/watchlistStore';

import type { SyncPayload } from './syncService';

export function buildSyncPayload(): SyncPayload {
  return {
    watchlist: useWatchlistStore.getState().items,
    lists: useListsStore.getState().lists,
    recent: useRecentStore.getState().items,
  };
}

export function applyRemotePayload(remote: SyncPayload) {
  if (remote.watchlist != null && Array.isArray(remote.watchlist)) {
    useWatchlistStore.setState({ items: remote.watchlist as never[] });
  }
  if (remote.lists != null && Array.isArray(remote.lists)) {
    useListsStore.setState({ lists: remote.lists as never[] });
  }
  if (remote.recent != null && Array.isArray(remote.recent)) {
    useRecentStore.setState({ items: remote.recent as never[] });
  }
}
