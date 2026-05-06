import { useTheme } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function AppErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const { colors } = useTheme();
  const message = error instanceof Error ? error.message : String(error);
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
      <Text style={[styles.body, { color: colors.text, opacity: 0.75 }]}>{message}</Text>
      <Pressable
        onPress={resetErrorBoundary}
        style={[styles.btn, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.btnText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    marginBottom: 24,
  },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
