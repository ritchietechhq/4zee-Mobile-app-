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

export default function RealtorLayout() {
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
                  size={22}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}
      <Tabs.Screen name="kyc" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: Spacing.xs,
    ...Shadows.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryLight,
  },
});
