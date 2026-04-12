import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

export function PosterSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.poster, { backgroundColor: colors.border }]}
      accessibilityLabel="Loading"
      accessibilityState={{ busy: true }}
    />
  );
}

const styles = StyleSheet.create({
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 12,
  },
});
