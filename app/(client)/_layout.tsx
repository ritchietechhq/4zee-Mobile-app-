import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Shadows } from '@/constants/theme';

const TAB_CONFIG = [
  { name: 'dashboard', title: 'Home', icon: 'home' },
  { name: 'search', title: 'Explore', icon: 'search' },
  { name: 'saved', title: 'Saved', icon: 'heart' },
  { name: 'messages/index', title: 'Messages', icon: 'chatbubbles' },
  { name: 'profile', title: 'Profile', icon: 'person' },
] as const;

/* Routes that live under the (client) folder but must NOT appear as tab items */
const HIDDEN_ROUTES = [
  'properties',
  'edit-profile',
  'inquiries',
  'change-password',
  'notifications',
  'help',
  'support',
  'privacy',
  'terms',
  'payments',
  'map',
  'messages/[id]',
] as const;

export default function ClientLayout() {
  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: dynamicStyles.tabLabel,
        tabBarStyle: dynamicStyles.tabBar,
        tabBarItemStyle: dynamicStyles.tabItem,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color }) => (
              <View style={[dynamicStyles.iconWrap, focused && dynamicStyles.iconWrapActive]}>
                <Ionicons
                  name={focused ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
                  size={21}
                  color={color}
                />
              </View>
            ),
          }}
        />
      ))}

      {/* ── Every non-tab child MUST be declared with href: null ── */}
      {HIDDEN_ROUTES.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ href: null, tabBarStyle: { display: 'none' } }}
        />
      ))}
    </Tabs>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.tabBarBackground ?? colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.primaryLight,
    },
  });
