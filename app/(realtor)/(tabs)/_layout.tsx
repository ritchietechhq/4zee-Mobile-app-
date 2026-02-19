import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '@/constants/theme';

const TAB_CONFIG = [
  { name: 'dashboard', title: 'Dashboard', icon: 'stats-chart' },
  { name: 'listings', title: 'Listings', icon: 'home' },
  { name: 'leads', title: 'Leads', icon: 'people' },
  { name: 'payments', title: 'Earnings', icon: 'wallet' },
  { name: 'profile', title: 'Profile', icon: 'person' },
] as const;

export default function RealtorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
                  size={20}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 80 : 58,
    paddingTop: Spacing.xs,
    ...Shadows.sm,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  tabItem: {
    paddingTop: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 26,
    borderRadius: 13,
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },
});
