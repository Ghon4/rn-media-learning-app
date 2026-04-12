import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MediaDetailScreen } from '../features/detail/MediaDetailScreen';
import { SearchScreen } from '../features/search/SearchScreen';

import type { SearchStackParamList } from './types';

const Stack = createNativeStackNavigator<SearchStackParamList>();

export function SearchStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
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
