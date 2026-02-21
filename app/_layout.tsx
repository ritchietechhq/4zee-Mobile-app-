import React, { useEffect, useState, useCallback } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useTheme } from '@/hooks/useTheme';
import { Colors } from '@/constants/theme';
import AnimatedSplash from '@/components/splash/AnimatedSplash';
import { warmUpBackend } from '@/services/warmup.service';
import { pushService } from '@/services/push.service';

const ONBOARDING_KEY = '4zee_onboarding_seen';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, role, loadSession } = useAuthStore();
  const { isDarkMode } = useTheme();
  const loadSavedTheme = useThemeStore((s) => s.loadSavedTheme);
  const segments = useSegments();

  /** true once session + onboarding flag have been read */
  const [isReady, setIsReady] = useState(false);
  /** true once the splash animation has finished its minimum run */
  const [splashDone, setSplashDone] = useState(false);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  // ─── Parallel init: session load + backend warm-up + theme load ───
  useEffect(() => {
    const init = async () => {
      // Fire the backend warm-up in parallel with session load.
      // warmUpBackend never throws, so Promise.all is safe.
      const [, onboardingSeen] = await Promise.all([
        loadSession(),
        AsyncStorage.getItem(ONBOARDING_KEY),
        warmUpBackend(), // ← wake up the server / DB during splash
        loadSavedTheme(), // ← load theme preference
      ]);
      await useAuthStore.getState().loadRole();
      setHasSeenOnboarding(onboardingSeen === 'true');
      setIsReady(true);
    };
    init();
  }, []);

  // ─── Push notifications: register when authenticated, teardown when not ──
  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated) {
      pushService.init();
    } else {
      pushService.teardown();
    }
  }, [isAuthenticated, isReady]);

  // Re-read the onboarding flag whenever segments change so it stays fresh
  // (e.g. after the user completes onboarding and navigates to role-select)
  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      setHasSeenOnboarding(v === 'true');
    });
  }, [segments, isReady]);

  useEffect(() => {
    if (!isReady || !splashDone || isLoading || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inClientGroup = segments[0] === '(client)';
    const inRealtorGroup = segments[0] === '(realtor)';

    if (!isAuthenticated) {
      // User is NOT logged in — make sure they're in the auth group
      if (!inAuthGroup) {
        if (!hasSeenOnboarding) {
          router.replace('/onboarding');
        } else if (!role) {
          router.replace('/role-select');
        } else {
          router.replace('/login');
        }
      }
      // If already in auth group, let them stay (don't redirect on failed login)
    } else {
      // User IS logged in — make sure they're NOT in the auth group or root index
      if (inAuthGroup || (!inClientGroup && !inRealtorGroup)) {
        if (role === 'REALTOR') {
          router.replace('/(realtor)/dashboard' as any);
        } else {
          router.replace('/(client)/dashboard' as any);
        }
      }
      // If authenticated but in wrong role group, redirect to correct one
      else if (role === 'REALTOR' && inClientGroup) {
        router.replace('/(realtor)/dashboard' as any);
      } else if (role !== 'REALTOR' && inRealtorGroup) {
        router.replace('/(client)/dashboard' as any);
      }
    }
  }, [isAuthenticated, segments, isReady, splashDone, isLoading, role, hasSeenOnboarding]);

  // Called by AnimatedSplash once its animation sequence finishes
  const handleSplashReady = useCallback(() => {
    setSplashDone(true);
  }, []);

  // ─── Show the animated splash while initialising ───
  if (!isReady || !splashDone || isLoading) {
    return <AnimatedSplash onReady={handleSplashReady} />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const { isDarkMode, colors } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <AuthGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="(realtor)" />
            <Stack.Screen
              name="notifications"
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack>
        </AuthGuard>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}


