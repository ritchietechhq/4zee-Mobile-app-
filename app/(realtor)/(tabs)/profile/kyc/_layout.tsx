import { Stack } from 'expo-router';
import { useRealtorColors } from '@/hooks/useThemeColors';

export default function KYCLayout() {
  const colors = useRealtorColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="submit" />
    </Stack>
  );
}
