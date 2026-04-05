import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStack } from './HomeStack';
import { ConversationsScreen } from '../screens/home/ConversationsScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import { ProfileStack } from './ProfileStack';
import { colors, spacing, borderRadius, shadows, typography } from '../constants/theme';

export type MainTabsParamList = {
  HomeTab: undefined;
  MessagesTab: undefined;
  AppointmentsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

interface TabIconProps {
  focused: boolean;
  color: string;
  icon: string;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, icon, label }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Ionicons
      name={focused ? (icon + '') as any : (icon + '-outline') as any}
      size={20}
      color={focused ? colors.terra : colors.lightMid}
    />
    {focused && (
      <View style={styles.activeIndicator}>
        <View style={styles.activeDot} />
      </View>
    )}
    <Text style={[styles.label, focused && styles.labelActive]}>
      {label}
    </Text>
  </View>
);

export const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.terra,
        tabBarInactiveTintColor: colors.lightMid,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              color={focused ? colors.terra : colors.lightMid}
              icon="home"
              label="Início"
            />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={ConversationsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              color={focused ? colors.terra : colors.lightMid}
              icon="chatbubbles"
              label="Mensagens"
            />
          ),
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              color={focused ? colors.terra : colors.lightMid}
              icon="calendar"
              label="Visitas"
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              color={focused ? colors.terra : colors.lightMid}
              icon="person"
              label="Perfil"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.paper,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 4,
    paddingTop: 4,
    ...shadows.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconContainerActive: {
    backgroundColor: colors.terraMuted,
    borderRadius: borderRadius.md,
  },
  label: {
    fontSize: 9,
    fontFamily: typography.fontBody,
    color: colors.lightMid,
    marginTop: 2,
  },
  labelActive: {
    color: colors.terra,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.terra,
  },
});

export default MainTabs;
