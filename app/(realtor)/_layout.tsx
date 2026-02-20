import React from 'react';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function RealtorLayout() {
  const colors = useThemeColors();
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
    </Stack>
  );
}
