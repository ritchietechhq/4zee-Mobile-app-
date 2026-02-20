import { Stack } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function EditListingLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
