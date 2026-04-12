import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
} from '@react-navigation/native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export const THEME_PREFERENCE_STORAGE_KEY = 'theme-preference';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolvedScheme: 'light' | 'dark';
  navigationTheme: Theme;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

const AppDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#4fc3f7',
    background: '#121212',
    card: '#1e1e1e',
    text: '#f5f5f5',
    border: '#333',
    notification: '#ff5252',
  },
};

const AppLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0a7ea4',
    background: '#f2f4f7',
    card: '#ffffff',
    text: '#11181C',
    border: '#dde1e7',
    notification: '#c62828',
  },
};

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
        if (!cancelled && (raw === 'light' || raw === 'dark' || raw === 'system')) {
          setPreferenceState(raw);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    void AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, p);
  }, []);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const navigationTheme = useMemo(
    () => (resolvedScheme === 'dark' ? AppDarkTheme : AppLightTheme),
    [resolvedScheme],
  );

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      resolvedScheme,
      navigationTheme,
    }),
    [preference, setPreference, resolvedScheme, navigationTheme],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreference() {
  const ctx = useContext(ThemePreferenceContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider');
  }
  return ctx;
}
