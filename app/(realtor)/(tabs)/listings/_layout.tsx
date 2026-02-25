import { Stack } from 'expo-router';
import { useRealtorColors } from '@/hooks/useThemeColors';

export default function ListingsLayout() {
  const colors = useRealtorColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
