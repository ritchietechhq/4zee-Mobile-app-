import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useLightColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const TAB_CONFIG = [
  { name: 'dashboard', title: 'Dashboard', iconFocused: 'grid', iconDefault: 'grid-outline' },
  { name: 'manage', title: 'Manage', iconFocused: 'layers', iconDefault: 'layers-outline' },
  { name: 'finance', title: 'Finance', iconFocused: 'wallet', iconDefault: 'wallet-outline' },
  { name: 'users', title: 'Users', iconFocused: 'people', iconDefault: 'people-outline' },
  { name: 'more', title: 'More', iconFocused: 'ellipsis-horizontal-circle', iconDefault: 'ellipsis-horizontal-circle-outline' },
] as const;

export default function AdminTabsLayout() {
  // Force light mode for admin (can enable dark later by changing to useThemeColors)
  const colors = useLightColors();
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
