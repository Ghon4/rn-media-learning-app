import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  THEME_PREFERENCE_STORAGE_KEY,
  type ThemePreference,
  useThemePreference,
} from '../../context/ThemePreferenceContext';
import {
  TRAILER_EXTERNAL_PREF_KEY,
  useTrailerPreference,
} from '../../context/TrailerPreferenceContext';
import type { SettingsStackParamList } from '../../navigation/types';
import { useWatchlist, WATCHLIST_STORAGE_KEY } from '../../store/watchlistStore';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Settings'>;

function ThemeChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: colors.border,
          backgroundColor: selected ? colors.primary : colors.card,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { clearAll } = useWatchlist();
  const { preferExternalTrailer, setPreferExternalTrailer } = useTrailerPreference();

  const clearLocalData = () => {
    Alert.alert(
      'Clear local data?',
      'This removes your watchlist and theme preference on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await AsyncStorage.multiRemove([
                WATCHLIST_STORAGE_KEY,
                THEME_PREFERENCE_STORAGE_KEY,
                TRAILER_EXTERNAL_PREF_KEY,
              ]);
              clearAll();
              setPreference('system');
              setPreferExternalTrailer(false);
            })();
          },
        },
      ],
    );
  };

  const setPref = (p: ThemePreference) => {
    setPreference(p);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.section, { color: colors.text }]}>Appearance</Text>
      <View style={styles.row}>
        <ThemeChip label="System" selected={preference === 'system'} onPress={() => setPref('system')} />
        <ThemeChip label="Light" selected={preference === 'light'} onPress={() => setPref('light')} />
        <ThemeChip label="Dark" selected={preference === 'dark'} onPress={() => setPref('dark')} />
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>Trailers</Text>
      <Text style={[styles.hint, { color: colors.text, opacity: 0.65, marginBottom: 10 }]}>
        Choose how trailer buttons open on title details.
      </Text>
      <View style={styles.row}>
        <ThemeChip
          label="In app"
          selected={!preferExternalTrailer}
          onPress={() => setPreferExternalTrailer(false)}
        />
        <ThemeChip
          label="YouTube"
          selected={preferExternalTrailer}
          onPress={() => setPreferExternalTrailer(true)}
        />
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>Information</Text>
      <Pressable
        style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('About')}
        accessibilityRole="button"
        accessibilityLabel="About and attribution"
      >
        <Text style={[styles.linkText, { color: colors.text }]}>About & TMDB attribution</Text>
        <Text style={{ color: colors.text, opacity: 0.5 }}>›</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>Data</Text>
      <Pressable
        style={[styles.dangerRow, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={clearLocalData}
        accessibilityRole="button"
        accessibilityLabel="Clear local app data"
      >
        <Text style={[styles.dangerText, { color: colors.notification }]}>Clear local data</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 16,
  },
  section: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontWeight: '600',
    fontSize: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dangerRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});
