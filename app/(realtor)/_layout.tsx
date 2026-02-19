import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function RealtorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="bank-accounts" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
      <Stack.Screen name="add-listing" />
      <Stack.Screen name="edit-listing" />
    </Stack>
  );
}
