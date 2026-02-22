import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ProfileLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="bank-accounts" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="help" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="referrals" />
    </Stack>
  );
}
