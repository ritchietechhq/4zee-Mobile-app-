import React, { useMemo } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Shadows, Typography } from '@/constants/theme';

const TAB_CONFIG = [
  { name: 'dashboard', title: 'Home', icon: 'home' },
  { name: 'search', title: 'Search', icon: 'search' },
  { name: 'saved', title: 'Saved', icon: 'heart' },
  { name: 'map', title: 'Map', icon: 'map' },
  { name: 'profile', title: 'Profile', icon: 'person' },
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
            tabBarIcon: ({ focused, color, size }) => (
              <View style={[dynamicStyles.iconWrap, focused && dynamicStyles.iconWrapActive]}>
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
      {/* Hidden screens - accessible via navigation but not shown in tab bar */}
      <Tabs.Screen name="properties" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="inquiries" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="payments" options={{ href: null }} />
    </Tabs>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    tabBar: {
      backgroundColor: colors.tabBarBackground,
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
