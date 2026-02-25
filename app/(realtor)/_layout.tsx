import React from 'react';
import { Stack } from 'expo-router';
import { useLightColors } from '@/hooks/useThemeColors';

export default function RealtorLayout() {
  // Force light mode for realtor (can enable dark later by changing to useThemeColors)
  const colors = useLightColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-listing" />
      <Stack.Screen name="edit-listing" />
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/[id]" />
    </Stack>
  );
}
