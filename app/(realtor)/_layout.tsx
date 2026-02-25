import React from 'react';
import { Stack } from 'expo-router';
import { useRealtorColors } from '@/hooks/useThemeColors';

export default function RealtorLayout() {
  // Light by default, auto dark at night, respects explicit user preference
  const colors = useRealtorColors();
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
