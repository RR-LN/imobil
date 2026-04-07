import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { MyPropertiesScreen } from "../screens/profile/MyPropertiesScreen";
import { CreatePropertyScreen } from "../screens/profile/CreatePropertyScreen";
import { AffiliateScreen } from "../screens/profile/AffiliateScreen";
import { UpgradeScreen } from "../screens/profile/UpgradeScreen";
import { MyAppointmentsScreen } from "../screens/appointments/MyAppointmentsScreen";

export type ProfileStackParamList = {
  ProfileMain: undefined;
  MyProperties: undefined;
  CreateProperty: undefined;
  EditProperty: { propertyId: string };
  Affiliate: undefined;
  Upgrade: undefined;
  MyAppointments: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="MyProperties" component={MyPropertiesScreen} />
      <Stack.Screen name="CreateProperty" component={CreatePropertyScreen} />
      <Stack.Screen name="MyAppointments" component={MyAppointmentsScreen} />
      <Stack.Screen name="Affiliate" component={AffiliateScreen} />
      <Stack.Screen name="Upgrade" component={UpgradeScreen} />
    </Stack.Navigator>
  );
};

export default ProfileStack;
