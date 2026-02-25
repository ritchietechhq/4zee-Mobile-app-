import React from 'react';
import { Stack } from 'expo-router';
import { useLightColors } from '@/hooks/useThemeColors';

export default function AdminLayout() {
  // Force light mode for admin (can enable dark later by changing to useLightColors)
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
      {/* Sub-screens — accessible from any tab */}
      <Stack.Screen name="kyc-review" />
      <Stack.Screen name="kyc-detail" />
      <Stack.Screen name="properties" />
      <Stack.Screen name="create-property" />
      <Stack.Screen name="applications" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="record-sale" />
      <Stack.Screen name="payment-plans" />
      <Stack.Screen name="commissions" />
      <Stack.Screen name="commission-rates" />
      <Stack.Screen name="payouts" />
      <Stack.Screen name="payout-detail" />
      <Stack.Screen name="create-user" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="support-tickets" />
      <Stack.Screen name="ticket-detail" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="analytics-charts" />
      <Stack.Screen name="top-realtors" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="activity-logs" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="documents" />
      {/* Super Admin screens */}
      <Stack.Screen name="sa-users" />
      <Stack.Screen name="sa-user-detail" />
      <Stack.Screen name="sa-admins" />
      <Stack.Screen name="sa-stats" />
      <Stack.Screen name="sa-realtors" />
      <Stack.Screen name="sa-clients" />
      {/* Additional admin screens */}
      <Stack.Screen name="payments" />
      <Stack.Screen name="broadcast" />
    </Stack>
  );
}
