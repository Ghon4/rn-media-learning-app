import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { PersonDetailScreen } from '../features/person/PersonDetailScreen';

import type { LibraryStackParamList } from './types';

const Stack = createNativeStackNavigator<LibraryStackParamList>();

export function LibraryStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'My list' }} />
      <Stack.Screen
        name="MediaDetail"
        component={MediaDetailScreen}
        options={({ route }) => ({
          title: route.params.title ?? 'Details',
        })}
      />
      <Stack.Screen
        name="PersonDetail"
        component={PersonDetailScreen}
        options={({ route }) => ({
          title: route.params.name ?? 'Person',
        })}
      />
    </Stack.Navigator>
  );
}
