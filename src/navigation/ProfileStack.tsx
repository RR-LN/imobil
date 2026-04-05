import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { MyPropertiesScreen } from '../screens/profile/MyPropertiesScreen';
import { CreatePropertyScreen } from '../screens/profile/CreatePropertyScreen';
import { AffiliateScreen } from '../screens/profile/AffiliateScreen';
import { UpgradeScreen } from '../screens/profile/UpgradeScreen';
import { colors, textStyles } from '../constants/theme';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  MyProperties: undefined;
  CreateProperty: undefined;
  EditProperty: { propertyId: string };
  Affiliate: undefined;
  Upgrade: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white,
        },
        headerTintColor: colors.charcoal,
        headerTitleStyle: {
          ...textStyles.body,
          fontWeight: '600' as const,
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MyProperties"
        component={MyPropertiesScreen}
        options={{ title: 'Meus Imoveis' }}
      />
      <Stack.Screen
        name="CreateProperty"
        component={CreatePropertyScreen}
        options={{ title: 'Novo Imovel' }}
      />
      <Stack.Screen
        name="Affiliate"
        component={AffiliateScreen}
        options={{ title: 'Painel Afiliado' }}
      />
      <Stack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{ title: 'Fazer Upgrade' }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
