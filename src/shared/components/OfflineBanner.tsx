import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OfflineBanner() {
  const { colors } = useTheme();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      const unreachable =
        state.isConnected === true && state.isInternetReachable === false;
      setOffline(state.isConnected === false || unreachable);
    });
  }, []);

  if (!offline) {
    return null;
  }

  return (
    <View
      style={[styles.banner, { backgroundColor: colors.notification }]}
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
    >
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
