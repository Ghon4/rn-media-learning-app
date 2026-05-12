import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { i18n } from '../../i18n';
import { fetchSampleOpenLibraryTitle } from '../../services/openLibrary/openLibraryApi';

export function AboutScreen() {
  const { colors } = useTheme();
  const [openLibrarySample, setOpenLibrarySample] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const title = await fetchSampleOpenLibraryTitle();
      if (!cancelled) setOpenLibrarySample(title);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.p, { color: colors.text }]}>{i18n.t('aboutContent.disclaimer')}</Text>
      <Pressable
        onPress={() => void Linking.openURL('https://www.themoviedb.org/')}
        accessibilityRole="link"
        accessibilityLabel={i18n.t('aboutContent.visitTmdbA11y')}
        style={[styles.linkBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Text style={[styles.linkBtnText, { color: colors.primary }]}>
          {i18n.t('aboutContent.visitSite')}
        </Text>
      </Pressable>
      <Text style={[styles.p, { color: colors.text, opacity: 0.8 }]}>
        {i18n.t('aboutContent.registerPart1')}{' '}
        <Text
          style={{ color: colors.primary, fontWeight: '700' }}
          onPress={() => void Linking.openURL('https://developer.themoviedb.org/docs/getting-started')}
        >
          developer.themoviedb.org
        </Text>
        {i18n.t('aboutContent.registerPart2')}
      </Text>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.boxTitle, { color: colors.text }]}>
          {i18n.t('aboutContent.openLibraryTitle')}
        </Text>
        <Text style={[styles.boxBody, { color: colors.text, opacity: 0.85 }]}>
          {i18n.t('aboutContent.openLibraryBodyPrefix')}{' '}
          {openLibrarySample ? (
            <Text style={{ fontWeight: '700' }}>“{openLibrarySample}”</Text>
          ) : (
            <Text style={{ opacity: 0.6 }}>{i18n.t('aboutContent.loadingSample')}</Text>
          )}
        </Text>
      </View>
      <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.boxTitle, { color: colors.text }]}>
          {i18n.t('aboutContent.learningTitle')}
        </Text>
        <Text style={[styles.boxBody, { color: colors.text, opacity: 0.85 }]}>
          {i18n.t('aboutContent.learningBody')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
  },
  linkBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  linkBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  box: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  boxBody: {
    fontSize: 15,
    lineHeight: 22,
  },
});
