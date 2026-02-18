import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function KYCLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="submit" />
    </Stack>
  );
}
