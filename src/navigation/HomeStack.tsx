import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeFeedScreen } from '../screens/home/HomeFeedScreen';
import { PropertyDetailScreen } from '../screens/home/PropertyDetailScreen';
import { ChatScreen } from '../screens/home/ChatScreen';
import { BookingScreen } from '../screens/home/BookingScreen';
import { colors, textStyles } from '../constants/theme';

export type HomeStackParamList = {
  HomeFeed: undefined;
  PropertyDetail: {
    propertyId?: string;
    title?: string;
    price?: string;
    location?: string;
    type?: string;
  };
  Chat: { conversationId?: string; propertyId?: string };
  Booking: { propertyId?: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
screenOptions={{
			headerStyle: {
				backgroundColor: colors.charcoal,
			},
			headerTintColor: colors.warmWhite,
			headerTitleStyle: {
				...textStyles.body,
				fontWeight: '600' as const,
			},
		}}
    >
      <Stack.Screen 
        name="HomeFeed" 
        component={HomeFeedScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen}
        options={{ title: 'Detalhes do Imóvel' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'Mensagens' }}
      />
      <Stack.Screen 
        name="Booking" 
        component={BookingScreen}
        options={{ title: 'Agendar Visita' }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
