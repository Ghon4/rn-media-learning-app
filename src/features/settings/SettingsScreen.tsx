import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useTheme } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { LOCALE_STORAGE_KEY, useLocalePreference } from '../../context/LocalePreferenceContext';
import {
  THEME_PREFERENCE_STORAGE_KEY,
  type ThemePreference,
  useThemePreference,
} from '../../context/ThemePreferenceContext';
import {
  TRAILER_EXTERNAL_PREF_KEY,
  useTrailerPreference,
} from '../../context/TrailerPreferenceContext';
import { i18n } from '../../i18n';
import type { SettingsStackParamList } from '../../navigation/types';
import { applyRemotePayload, buildSyncPayload } from '../../services/sync/syncMerge';
import { isSyncConfigured, pullPayload, pushPayload, SYNC_DEVICE_STORAGE_KEY } from '../../services/sync/syncService';
import { LISTS_STORAGE_KEY, useListsStore } from '../../store/listsStore';
import { RECENT_STORAGE_KEY, useRecentStore } from '../../store/recentStore';
import { useWatchlist, WATCHLIST_STORAGE_KEY, useWatchlistStore } from '../../store/watchlistStore';

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

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { preference, setPreference } = useThemePreference();
  const { clearAll } = useWatchlist();
  const clearLists = useListsStore((s) => s.clearAll);
  const clearRecent = useRecentStore((s) => s.clearAll);
  const { preferExternalTrailer, setPreferExternalTrailer } = useTrailerPreference();
  const { preference: localePref, setPreference: setLocalePref } = useLocalePreference();

  const exportJson = async () => {
    const payload = buildSyncPayload();
    const json = JSON.stringify(payload, null, 2);
    try {
      if (Platform.OS === 'ios') {
        await Share.share({
          title: i18n.t('settings.export'),
          url: `data:application/json;charset=utf-8,${encodeURIComponent(json)}`,
        });
      } else {
        await Share.share({ title: i18n.t('settings.export'), message: json });
      }
    } catch {
      /* dismissed */
    }
  };

  const exportCsv = async () => {
    const items = useWatchlistStore.getState().items;
    const header = 'mediaType,id,title,status,addedAt';
    const lines = items.map(
      (i) =>
        `${i.mediaType},${i.id},${csvEscape(i.title)},${i.status ?? ''},${i.addedAt}`,
    );
    const csv = [header, ...lines].join('\n');
    try {
      await Share.share({
        message: csv,
        title: i18n.t('settings.exportCsv'),
      });
    } catch {
      /* dismissed */
    }
  };

  const runSync = async () => {
    if (!isSyncConfigured()) {
      Alert.alert(i18n.t('settings.sync'), i18n.t('settings.syncDisabled'));
      return;
    }
    try {
      const pulled = await pullPayload();
      if (pulled.ok && pulled.payload && Object.keys(pulled.payload).length > 0) {
        applyRemotePayload(pulled.payload);
      }
      const push = await pushPayload(buildSyncPayload());
      if (!push.ok) {
        Alert.alert(i18n.t('settings.sync'), push.error ?? i18n.t('errors.loadFailed'));
        return;
      }
      Alert.alert(i18n.t('settings.sync'), i18n.t('common.ok'));
    } catch (e) {
      Alert.alert(i18n.t('settings.sync'), e instanceof Error ? e.message : 'Error');
    }
  };

  const clearLocalData = () => {
    Alert.alert(i18n.t('settings.clearTitle'), i18n.t('settings.clearMsg'), [
      { text: i18n.t('settings.clearCancel'), style: 'cancel' },
      {
        text: i18n.t('settings.clearOk'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await AsyncStorage.multiRemove([
              WATCHLIST_STORAGE_KEY,
              LISTS_STORAGE_KEY,
              RECENT_STORAGE_KEY,
              THEME_PREFERENCE_STORAGE_KEY,
              TRAILER_EXTERNAL_PREF_KEY,
              LOCALE_STORAGE_KEY,
              SYNC_DEVICE_STORAGE_KEY,
            ]);
            clearAll();
            clearLists();
            clearRecent();
            setPreference('system');
            setPreferExternalTrailer(false);
            setLocalePref('system');
          })();
        },
      },
    ]);
  };

  const setThemePref = (p: ThemePreference) => {
    setPreference(p);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.section, { color: colors.text }]}>{i18n.t('settings.appearance')}</Text>
      <View style={styles.row}>
        <ThemeChip
          label={i18n.t('settings.themeSystem')}
          selected={preference === 'system'}
          onPress={() => setThemePref('system')}
        />
        <ThemeChip
          label={i18n.t('settings.themeLight')}
          selected={preference === 'light'}
          onPress={() => setThemePref('light')}
        />
        <ThemeChip
          label={i18n.t('settings.themeDark')}
          selected={preference === 'dark'}
          onPress={() => setThemePref('dark')}
        />
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.locale')}
      </Text>
      <View style={styles.row}>
        <ThemeChip
          label={i18n.t('settings.localeSystem')}
          selected={localePref === 'system'}
          onPress={() => setLocalePref('system')}
        />
        <ThemeChip
          label={i18n.t('settings.localeEn')}
          selected={localePref === 'en'}
          onPress={() => setLocalePref('en')}
        />
        <ThemeChip
          label={i18n.t('settings.localeEs')}
          selected={localePref === 'es'}
          onPress={() => setLocalePref('es')}
        />
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.trailers')}
      </Text>
      <Text style={[styles.hint, { color: colors.text, opacity: 0.65, marginBottom: 10 }]}>
        {i18n.t('settings.trailerHint')}
      </Text>
      <View style={styles.row}>
        <ThemeChip
          label={i18n.t('settings.trailerInApp')}
          selected={!preferExternalTrailer}
          onPress={() => setPreferExternalTrailer(false)}
        />
        <ThemeChip
          label={i18n.t('settings.trailerExternal')}
          selected={preferExternalTrailer}
          onPress={() => setPreferExternalTrailer(true)}
        />
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.export')}
      </Text>
      <Text style={[styles.hint, { color: colors.text, opacity: 0.65, marginBottom: 10 }]}>
        {i18n.t('settings.exportHint')}
      </Text>
      <View style={styles.row}>
        <Pressable
          style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => void exportJson()}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('a11y.exportAction')}
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            {i18n.t('settings.exportJson')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.linkRow, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => void exportCsv()}
          accessibilityRole="button"
        >
          <Text style={[styles.linkText, { color: colors.primary }]}>
            {i18n.t('settings.exportCsv')}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.sync')}
      </Text>
      <Text style={[styles.hint, { color: colors.text, opacity: 0.65, marginBottom: 10 }]}>
        {i18n.t('settings.syncHint')}
      </Text>
      <Pressable
        style={[styles.linkRowFull, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => void runSync()}
        accessibilityRole="button"
        accessibilityLabel={i18n.t('a11y.syncAction')}
      >
        <Text style={[styles.linkText, { color: colors.primary }]}>{i18n.t('settings.syncNow')}</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.information')}
      </Text>
      <Pressable
        style={[styles.linkRowFull, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('About')}
        accessibilityRole="button"
      >
        <Text style={[styles.linkText, { color: colors.text }]}>{i18n.t('settings.aboutLink')}</Text>
        <Text style={{ color: colors.text, opacity: 0.5 }}>›</Text>
      </Pressable>

      <Text style={[styles.section, { color: colors.text, marginTop: 24 }]}>
        {i18n.t('settings.dataSection')}
      </Text>
      <Pressable
        style={[styles.dangerRow, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={clearLocalData}
        accessibilityRole="button"
      >
        <Text style={[styles.dangerText, { color: colors.notification }]}>
          {i18n.t('settings.clearDataLabel')}
        </Text>
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
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
    flex: 1,
    minWidth: '42%',
  },
  linkRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
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
