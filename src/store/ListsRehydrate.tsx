import { useEffect } from 'react';

import { useListsStore } from './listsStore';

export function ListsRehydrate() {
  useEffect(() => {
    const unsub = useListsStore.persist.onFinishHydration(() => {
      useListsStore.getState()._setHydrated(true);
    });
    if (useListsStore.persist.hasHydrated()) {
      useListsStore.getState()._setHydrated(true);
    }
    return unsub;
  }, []);
  return null;
}
