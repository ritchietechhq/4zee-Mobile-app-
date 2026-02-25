import { Stack } from 'expo-router';
import { useRealtorColors } from '@/hooks/useThemeColors';

export default function EditListingLayout() {
  const colors = useRealtorColors();
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
