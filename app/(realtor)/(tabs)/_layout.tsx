import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const TAB_CONFIG = [
  { name: 'dashboard', title: 'Dashboard', iconFocused: 'grid', iconDefault: 'grid-outline' },
  { name: 'listings', title: 'Listings', iconFocused: 'business', iconDefault: 'business-outline' },
  { name: 'leads', title: 'Leads', iconFocused: 'people-circle', iconDefault: 'people-circle-outline' },
  { name: 'payments', title: 'Earnings', iconFocused: 'card', iconDefault: 'card-outline' },
  { name: 'profile', title: 'Profile', iconFocused: 'person-circle', iconDefault: 'person-circle-outline' },
] as const;

export default function RealtorTabsLayout() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        // Reset nested stacks (e.g. profile → kyc) when switching tabs
        // so tapping Profile always lands on the profile index, not a
        // sub-screen the user navigated to earlier.
        popToTopOnBlur: true,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={(focused ? tab.iconFocused : tab.iconDefault) as any}
                  size={22}
                  color={focused ? colors.primary : colors.textMuted}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBarBackground,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 84 : 62,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    ...Shadows.md,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
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
    borderRadius: BorderRadius.lg,
  },
  iconWrapActive: {
    backgroundColor: colors.primaryLight,
  },
});
