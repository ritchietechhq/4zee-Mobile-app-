// ============================================================
// FavouriteToast — animated pop-up when a property is saved
// Shows a heart animation + short message on first save.
// Usage:  showFavouriteToast()  (imperative, from anywhere)
// ============================================================

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_DURATION = 3500;

interface ToastData {
  title: string;
  action: 'added' | 'removed';
}

// ── Imperative API ──────────────────────────────────────────
let _show: ((data: ToastData) => void) | null = null;

export function showFavouriteToast(data: ToastData) {
  _show?.(data);
}

// ── Component ───────────────────────────────────────────────
export default function FavouriteToast() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<ToastData | null>(null);

  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    _show = (d) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setData(d);
      setVisible(true);

      // Reset animations
      slideAnim.setValue(120);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      heartScale.setValue(0);

      // Entrance
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start(() => {
        // Heart pop
        Animated.sequence([
          Animated.spring(heartScale, {
            toValue: 1.3,
            useNativeDriver: true,
            tension: 150,
            friction: 5,
          }),
          Animated.spring(heartScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      });

      // Auto-dismiss
      timerRef.current = setTimeout(() => dismiss(), TOAST_DURATION);
    };

    return () => {
      _show = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  if (!visible || !data) return null;

  const isAdded = data.action === 'added';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 80 },
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={dismiss}
        style={styles.container}
      >
        {/* Heart icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            isAdded ? styles.iconWrapAdded : styles.iconWrapRemoved,
            { transform: [{ scale: heartScale }] },
          ]}
        >
          <Ionicons
            name={isAdded ? 'heart' : 'heart-dislike'}
            size={22}
            color={isAdded ? colors.error : colors.textMuted}
          />
        </Animated.View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {isAdded ? 'Saved to Favourites ❤️' : 'Removed from Favourites'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isAdded
              ? 'Find it anytime in your Favourites tab'
              : `"${data.title}" removed`}
          </Text>
        </View>

        {/* Dismiss chevron */}
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: Spacing.lg,
      right: Spacing.lg,
      zIndex: 9999,
      alignItems: 'center',
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      ...Shadows.lg,
      width: '100%',
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapAdded: {
      backgroundColor: colors.errorLight,
    },
    iconWrapRemoved: {
      backgroundColor: colors.surface,
    },
    textWrap: {
      flex: 1,
    },
    title: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      fontSize: 14,
    },
    subtitle: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: 2,
      fontSize: 12,
    },
  });
