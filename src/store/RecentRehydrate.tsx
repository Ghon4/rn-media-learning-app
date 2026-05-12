import { useEffect } from 'react';

import { useRecentStore } from './recentStore';

export function RecentRehydrate() {
  useEffect(() => {
    const unsub = useRecentStore.persist.onFinishHydration(() => {
      useRecentStore.getState()._setHydrated(true);
    });
    if (useRecentStore.persist.hasHydrated()) {
      useRecentStore.getState()._setHydrated(true);
    }
    return unsub;
  }, []);
  return null;
}
