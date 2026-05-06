import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const TRAILER_EXTERNAL_PREF_KEY = 'trailer-prefer-external';

type TrailerPreferenceContextValue = {
  preferExternalTrailer: boolean;
  setPreferExternalTrailer: (value: boolean) => void;
};

const TrailerPreferenceContext = createContext<TrailerPreferenceContextValue | null>(null);

export function TrailerPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [preferExternalTrailer, setPreferExternalTrailerState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TRAILER_EXTERNAL_PREF_KEY);
        if (!cancelled && raw === '1') {
          setPreferExternalTrailerState(true);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreferExternalTrailer = useCallback((value: boolean) => {
    setPreferExternalTrailerState(value);
    void AsyncStorage.setItem(TRAILER_EXTERNAL_PREF_KEY, value ? '1' : '0');
  }, []);

  const value = useMemo(
    () => ({ preferExternalTrailer, setPreferExternalTrailer }),
    [preferExternalTrailer, setPreferExternalTrailer],
  );

  return (
    <TrailerPreferenceContext.Provider value={value}>{children}</TrailerPreferenceContext.Provider>
  );
}

export function useTrailerPreference() {
  const ctx = useContext(TrailerPreferenceContext);
  if (!ctx) {
    throw new Error('useTrailerPreference must be used within TrailerPreferenceProvider');
  }
  return ctx;
}
