import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { HomeScreen } from '../features/home/HomeScreen';

import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Discover' }} />
      <Stack.Screen
        name="MediaDetail"
        component={MediaDetailScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Details',
        })}
      />
    </Stack.Navigator>
  );
}
