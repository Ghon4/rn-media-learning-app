import { Image } from 'expo-image';
import { useTheme } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { posterUrl } from '../../services/tmdb/constants';

type Props = {
  title: string;
  posterPath: string | null;
  subtitle?: string;
  onPress: () => void;
};

export function MediaCard({ title, posterPath, subtitle, onPress }: Props) {
  const { colors } = useTheme();
  const uri = posterUrl(posterPath);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.9 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.imageWrap, { backgroundColor: colors.border }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
            <Text style={[styles.placeholderText, { color: colors.text }]} numberOfLines={3}>
              {title}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.sub, { color: colors.text }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    marginRight: 12,
  },
  imageWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 2 / 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    padding: 6,
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    textAlign: 'center',
  },
  title: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  sub: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.7,
  },
});
