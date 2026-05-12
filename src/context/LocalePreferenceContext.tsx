import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { i18n } from '../i18n';

export const LOCALE_STORAGE_KEY = 'locale-preference-v1';

export type LocalePreference = 'system' | 'en' | 'es';

type Ctx = {
  preference: LocalePreference;
  setPreference: (p: LocalePreference) => void;
};

const LocalePreferenceContext = createContext<Ctx | null>(null);

function applyI18nLocale(p: LocalePreference) {
  if (p === 'system') {
    const code = Localization.getLocales()[0]?.languageCode ?? 'en';
    i18n.locale = code === 'es' ? 'es' : 'en';
  } else {
    i18n.locale = p;
  }
}

export function LocalePreferenceProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>(() => {
    applyI18nLocale('system');
    return 'system';
  });

  useEffect(() => {
    void AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((raw) => {
      if (raw === 'en' || raw === 'es' || raw === 'system') {
        setPreferenceState(raw);
        applyI18nLocale(raw);
      }
    });
  }, []);

  const setPreference = useCallback((p: LocalePreference) => {
    setPreferenceState(p);
    applyI18nLocale(p);
    void AsyncStorage.setItem(LOCALE_STORAGE_KEY, p);
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);

  return (
    <LocalePreferenceContext.Provider value={value}>{children}</LocalePreferenceContext.Provider>
  );
}

export function useLocalePreference() {
  const ctx = useContext(LocalePreferenceContext);
  if (!ctx) {
    throw new Error('useLocalePreference must be used within LocalePreferenceProvider');
  }
  return ctx;
}
