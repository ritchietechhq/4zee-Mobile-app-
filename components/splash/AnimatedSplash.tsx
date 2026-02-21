import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Easing,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Brand colors (theme-independent — splash always looks the same) ───
const BRAND = {
  primary: '#1E40AF',
  accent: '#3B82F6',
} as const;

interface SplashScreenProps {
  onReady: () => void;
}

/**
 * Splash screen — 4Zee Properties
 *
 * ✦  Theme-independent: always shows brand colors regardless of
 *    light/dark mode so the first impression is always consistent.
 *
 * ✦  Clean, confident timeline (~2.5 s):
 *    Phase 1  (0–600 ms)   – Logo fades in with subtle scale
 *    Phase 2  (400 ms)     – App name fades in
 *    Phase 3  (700 ms)     – Tagline fades in
 *    Phase 4  (1000 ms)    – Bottom branding fades in
 *    Ready    (2500 ms)    – onReady fires
 */
export default function AnimatedSplash({ onReady }: SplashScreenProps) {
  // ─── Animated values ─────────────────────────────────────────
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const nameOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // ── Phase 1: Logo — smooth scale-up + fade in ──────────────
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // ── Phase 2: App name (400ms) ──────────────────────────────
    const t1 = setTimeout(() => {
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 400);

    // ── Phase 3: Tagline (700ms) ───────────────────────────────
    const t2 = setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 700);

    // ── Phase 4: Bottom branding (1000ms) ──────────────────────
    const t3 = setTimeout(() => {
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 1000);

    // ── Signal ready ───────────────────────────────────────────
    const ready = setTimeout(() => onReady(), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(ready);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Subtle background glow (static) ── */}
      <View style={styles.bgGlow} />

      {/* ── Logo ── */}
      <Animated.View
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={styles.logoRing}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      </Animated.View>

      {/* ── App name ── */}
      <Animated.View style={[styles.nameWrap, { opacity: nameOpacity }]}>
        <Text style={styles.appNameLight}>4Zee</Text>
        <Text style={styles.appNameBold}> Properties</Text>
      </Animated.View>

      {/* ── Tagline ── */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <Text style={styles.tagline}>Your gateway to smart property investment</Text>
      </Animated.View>

      {/* ── Bottom branding ── */}
      <Animated.View style={[styles.bottomWrap, { opacity: bottomOpacity }]}>
        <View style={styles.bottomDivider} />
        <Text style={styles.bottomText}>Powered by Ritchietech</Text>
      </Animated.View>
    </View>
  );
}

// ─── Static styles (hardcoded brand colors — never changes with theme) ──
const LOGO_SIZE = 140;
const LOGO_IMG = 96;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Subtle static background glow */
  bgGlow: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_WIDTH * 1.4,
    borderRadius: SCREEN_WIDTH * 0.7,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },

  /* Logo */
  logoWrap: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: LOGO_SIZE + 16,
    height: LOGO_SIZE + 16,
    borderRadius: (LOGO_SIZE + 16) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: LOGO_IMG,
    height: LOGO_IMG,
  },

  /* App name */
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  appNameLight: {
    fontSize: 32,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appNameBold: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  /* Tagline */
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 48,
  },

  /* Bottom branding */
  bottomWrap: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  bottomDivider: {
    width: 32,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  bottomText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
