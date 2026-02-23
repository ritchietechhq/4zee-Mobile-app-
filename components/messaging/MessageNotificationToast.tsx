// ============================================================
// Message Notification Toast
// In-app toast notification for new messages
// Shows when user receives a message while using the app
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { ThemeColors } from '@/constants/colors';

interface ToastMessage {
  id: string;
  conversationId: string;
  senderName: string;
  preview: string;
  propertyTitle?: string;
  timestamp: number;
}

interface MessageNotificationToastProps {
  onDismiss?: () => void;
}

// Global toast queue and show function
let _showToast: ((message: Omit<ToastMessage, 'id' | 'timestamp'>) => void) | null = null;

export function showMessageToast(message: Omit<ToastMessage, 'id' | 'timestamp'>) {
  if (_showToast) {
    _showToast(message);
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_DURATION = 4000;

export default function MessageNotificationToast({ onDismiss }: MessageNotificationToastProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [currentToast, setCurrentToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Register global show function
  useEffect(() => {
    _showToast = (message) => {
      const newToast: ToastMessage = {
        ...message,
        id: `toast_${Date.now()}`,
        timestamp: Date.now(),
      };
      setCurrentToast(newToast);
    };

    return () => {
      _showToast = null;
    };
  }, []);

  // Animate toast in/out
  useEffect(() => {
    if (currentToast) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after duration
      timeoutRef.current = setTimeout(() => {
        dismissToast();
      }, TOAST_DURATION);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentToast?.id]);

  const dismissToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentToast(null);
      onDismiss?.();
    });
  }, [onDismiss]);

  const handlePress = useCallback(() => {
    if (!currentToast) return;
    
    dismissToast();
    
    // Navigate to chat
    router.push({
      pathname: '/(client)/messages/[id]' as any,
      params: {
        id: currentToast.conversationId,
        name: currentToast.senderName,
        propertyTitle: currentToast.propertyTitle || '',
      },
    });
  }, [currentToast, router, dismissToast]);

  if (!currentToast) return null;

  const styles = makeStyles(colors, insets.top);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.toastBackground, { backgroundColor: colors.surface }]}>
          <ToastContent
            colors={colors}
            senderName={currentToast.senderName}
            preview={currentToast.preview}
            propertyTitle={currentToast.propertyTitle}
            onClose={dismissToast}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ToastContent({
  colors,
  senderName,
  preview,
  propertyTitle,
  onClose,
}: {
  colors: ThemeColors;
  senderName: string;
  preview: string;
  propertyTitle?: string;
  onClose: () => void;
}) {
  return (
    <View style={contentStyles.wrapper}>
      {/* Icon */}
      <View style={[contentStyles.iconWrap, { backgroundColor: colors.primary }]}>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.white} />
      </View>

      {/* Content */}
      <View style={contentStyles.content}>
        <View style={contentStyles.header}>
          <Text style={[contentStyles.sender, { color: colors.textPrimary }]} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={[contentStyles.badge, { color: colors.primary }]}>New</Text>
        </View>
        
        {propertyTitle && (
          <Text style={[contentStyles.property, { color: colors.primary }]} numberOfLines={1}>
            Re: {propertyTitle}
          </Text>
        )}
        
        <Text style={[contentStyles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
          {preview}
        </Text>
      </View>

      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={contentStyles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="close" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (colors: ThemeColors, topInset: number) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: topInset + 8,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
  },
  toast: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  toastBackground: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
});

const contentStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sender: {
    ...Typography.bodySemiBold,
    flex: 1,
  },
  badge: {
    ...Typography.small,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  property: {
    ...Typography.small,
    marginTop: 1,
  },
  preview: {
    ...Typography.caption,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
});
