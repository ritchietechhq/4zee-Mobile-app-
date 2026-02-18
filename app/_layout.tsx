import React, { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { Colors } from '@/constants/theme';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role, loadSession } = useAuthStore();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await loadSession();
      const storedRole = await useAuthStore.getState().loadRole();
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inClientGroup = segments[0] === '(client)';
    const inRealtorGroup = segments[0] === '(realtor)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated — redirect to role selection or login
      if (!role) {
        router.replace('/(auth)/role-select');
      } else {
        router.replace('/(auth)/login');
      }
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated but in auth group — redirect to appropriate dashboard
      if (role === 'REALTOR') {
        router.replace('/(realtor)/dashboard');
      } else {
        router.replace('/(client)/dashboard');
      }
    }
  }, [isAuthenticated, segments, isReady, isLoading, role]);

  if (!isReady || isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="(realtor)" />
            <Stack.Screen
              name="notifications"
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="map"
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
