import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SplashScreenProps {
  onReady: () => void;
}

/**
 * Custom animated splash screen.
 *
 * While this screen is visible the parent component should be:
 *  1. Loading the user session from AsyncStorage  (frontend)
 *  2. Hitting the backend health / warm-up endpoint (frontend → backend)
 *
 * ──────────────────────────────────────────────────────────
 *  🔧  BACKEND TODO — Expose a lightweight warm-up endpoint
 * ──────────────────────────────────────────────────────────
 *  The frontend calls  GET /api/v1/health  (or /ping) on app
 *  start so the server is awake by the time the user interacts.
 *
 *  Suggested contract:
 *    GET  /api/v1/health
 *    Response 200:
 *    {
 *      "status": "ok",
 *      "timestamp": "2026-02-18T12:00:00.000Z",
 *      "dbConnected": true,
 *      "version": "1.0.0"
 *    }
 *
 *  This endpoint should:
 *    • Run a trivial DB query (SELECT 1) to open the pool.
 *    • Be publicly accessible (no auth required).
 *    • Respond in < 500 ms when the server is warm.
 *    • Return dbConnected: false (not 500) if the DB is down.
 * ──────────────────────────────────────────────────────────
 */
export default function AnimatedSplash({ onReady }: SplashScreenProps) {
  /* ---- Animated values ---- */
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerPos = useRef(new Animated.Value(-1)).current;
  const bgGlowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* ---- Phase 1: Logo entrance (0 → 600ms) ---- */
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(bgGlowOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    /* ---- Phase 2: App name (600ms) ---- */
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 500);

    /* ---- Phase 3: Tagline (900ms) ---- */
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(taglineTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 850);

    /* ---- Phase 4: Loader bar + pulse (1100ms) ---- */
    setTimeout(() => {
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Gentle logo pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Progress bar shimmer
      Animated.loop(
        Animated.timing(shimmerPos, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ).start();
    }, 1000);

    /* ---- Signal parent that the minimum visual time is done ---- */
    const timeout = setTimeout(() => {
      onReady();
    }, 2800);

    return () => clearTimeout(timeout);
  }, []);

  const shimmerTranslateX = shimmerPos.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH * 0.6, SCREEN_WIDTH * 0.6],
  });

  return (
    <View style={styles.container}>
      {/* Background glow circle */}
      <Animated.View style={[styles.bgGlow, { opacity: bgGlowOpacity }]} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.logoCircle}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View
        style={{
          opacity: textOpacity,
          transform: [{ translateY: textTranslateY }],
        }}
      >
        <Text style={styles.appName}>4Zee Properties</Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.View
        style={{
          opacity: taglineOpacity,
          transform: [{ translateY: taglineTranslateY }],
        }}
      >
        <Text style={styles.tagline}>Your gateway to smart property investment</Text>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View style={[styles.loaderWrap, { opacity: loaderOpacity }]}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderShimmer,
              { transform: [{ translateX: shimmerTranslateX }] },
            ]}
          />
        </View>
        <Text style={styles.loaderText}>Connecting…</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
    borderRadius: SCREEN_WIDTH * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  logoWrap: {
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    // Double ring
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logo: {
    width: 72,
    height: 72,
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: Spacing.sm,
    letterSpacing: 0.3,
  },
  loaderWrap: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    width: '100%',
  },
  loaderTrack: {
    width: SCREEN_WIDTH * 0.45,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  loaderShimmer: {
    width: '40%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: Spacing.sm,
    letterSpacing: 0.3,
  },
});
