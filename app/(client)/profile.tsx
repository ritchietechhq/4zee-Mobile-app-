// ============================================================
// Client Profile Screen — Full Featured
// Edit profile, inquiries, change password, notifications,
// help, support, privacy, terms, rate app, sign out
// ============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import notificationService from '@/services/notification.service';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { NotificationPreferences } from '@/types';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  badge?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDarkMode, setThemeMode, colors } = useTheme();
  
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch notification preferences on mount
  useFocusEffect(
    useCallback(() => {
      fetchNotificationPrefs();
    }, [])
  );

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const fetchNotificationPrefs = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPushEnabled(prefs.saleNotifications);
      setEmailEnabled(prefs.emailNotifications);
    } catch {
      // Use defaults if fetch fails
    }
  };

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    setIsSavingPrefs(true);
    try {
      await notificationService.updatePreferences({ saleNotifications: value });
    } catch {
      setPushEnabled(!value); // Revert on error
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleToggleEmail = async (value: boolean) => {
    setEmailEnabled(value);
    setIsSavingPrefs(true);
    try {
      await notificationService.updatePreferences({ emailNotifications: value });
    } catch {
      setEmailEnabled(!value); // Revert on error
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const handleToggleDarkMode = async (value: boolean) => {
    try {
      await setThemeMode(value ? 'dark' : 'light');
    } catch {
      Alert.alert('Error', 'Failed to update theme setting');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch {
            /* noop */
          }
        },
      },
    ]);
  };

  const handleRateApp = () => {
    const storeUrl = Platform.select({
      ios: 'https://apps.apple.com/app/4zee-properties/id123456789',
      android: 'https://play.google.com/store/apps/details?id=com.fourzee.properties',
      default: 'https://4zeeproperties.com',
    });
    Linking.openURL(storeUrl).catch(() => {
      Alert.alert('Error', 'Unable to open app store');
    });
  };

  // Get initials for avatar
  const getInitials = () => {
    const first = user?.firstName?.charAt(0)?.toUpperCase() ?? '';
    const last = user?.lastName?.charAt(0)?.toUpperCase() ?? '';
    return `${first}${last}` || 'U';
  };

  const accountItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => router.push('/(client)/edit-profile'),
      showChevron: true,
    },
    {
      icon: 'home-outline',
      label: 'My Property Inquiries',
      subtitle: 'Track your property applications',
      onPress: () => router.push('/(client)/inquiries'),
      showChevron: true,
      badge: 'New',
    },
    {
      icon: 'card-outline',
      label: 'Payment History',
      subtitle: 'View past transactions',
      onPress: () => router.push('/(client)/payments'),
      showChevron: true,
    },
    {
      icon: 'key-outline',
      label: 'Change Password',
      subtitle: 'Update your password',
      onPress: () => router.push('/(client)/change-password'),
      showChevron: true,
    },
  ];

  const supportItems: MenuItem[] = [
    {
      icon: 'help-circle-outline',
      label: 'Help & FAQ',
      onPress: () => router.push('/(client)/help'),
      showChevron: true,
    },
    {
      icon: 'chatbubble-outline',
      label: 'Contact Support',
      onPress: () => router.push('/(client)/support'),
      showChevron: true,
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy Policy',
      onPress: () => router.push('/(client)/privacy'),
      showChevron: true,
    },
    {
      icon: 'document-text-outline',
      label: 'Terms of Service',
      onPress: () => router.push('/(client)/terms'),
      showChevron: true,
    },
    {
      icon: 'star-outline',
      label: 'Rate the App',
      onPress: handleRateApp,
      showChevron: true,
    },
  ];

  const dynamicStyles = useMemo(() => createStyles(colors, isDarkMode), [colors, isDarkMode]);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          {/* ── Profile Header ── */}
          <View style={dynamicStyles.profileHeader}>
            <LinearGradient
              colors={isDarkMode ? [colors.primary, '#7C3AED'] : [colors.primary, colors.accent]}
              style={dynamicStyles.profileBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            {/* Greeting */}
            <Text style={dynamicStyles.greeting}>
              Hi {user?.firstName ?? 'there'} 👋
            </Text>

            <View style={dynamicStyles.avatarContainer}>
              <View style={dynamicStyles.avatar}>
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={dynamicStyles.avatarImg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text style={dynamicStyles.avatarText}>{getInitials()}</Text>
                )}
              </View>
              <TouchableOpacity
                style={dynamicStyles.cameraBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/(client)/edit-profile')}
              >
                <Ionicons name="camera" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <Text style={dynamicStyles.userName}>
              {user?.firstName ?? ''} {user?.lastName ?? ''}
            </Text>
            <Text style={dynamicStyles.userEmail}>{user?.email ?? ''}</Text>
            
            <TouchableOpacity
              style={dynamicStyles.editButton}
              onPress={() => router.push('/(client)/edit-profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color={colors.primary} />
              <Text style={dynamicStyles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Account ── */}
          <Text style={dynamicStyles.sectionTitle}>Account</Text>
          <Card style={dynamicStyles.menuCard} padding="xs">
            {accountItems.map((item, idx) => (
              <React.Fragment key={item.label}>
                <MenuRow item={item} />
                {idx < accountItems.length - 1 && <View style={[dynamicStyles.separator, { backgroundColor: colors.borderLight }]} />}
              </React.Fragment>
            ))}
          </Card>

          {/* ── Notifications ── */}
          <Text style={dynamicStyles.sectionTitle}>Notifications</Text>
          <Card style={dynamicStyles.menuCard} padding="xs">
            <View style={dynamicStyles.switchRow}>
              <View style={dynamicStyles.switchLeft}>
                <View style={dynamicStyles.menuIcon}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View>
                  <Text style={dynamicStyles.menuLabel}>Push Notifications</Text>
                  <Text style={dynamicStyles.switchDesc}>Receive property alerts & updates</Text>
                </View>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={pushEnabled ? colors.primary : colors.textMuted}
                disabled={isSavingPrefs}
              />
            </View>
            <View style={[dynamicStyles.separator, { backgroundColor: colors.borderLight }]} />
            <View style={dynamicStyles.switchRow}>
              <View style={dynamicStyles.switchLeft}>
                <View style={dynamicStyles.menuIcon}>
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={dynamicStyles.menuLabel}>Email Notifications</Text>
                  <Text style={dynamicStyles.switchDesc}>Weekly digest & promotional offers</Text>
                </View>
              </View>
              <Switch
                value={emailEnabled}
                onValueChange={handleToggleEmail}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={emailEnabled ? colors.primary : colors.textMuted}
                disabled={isSavingPrefs}
              />
            </View>
            <View style={[dynamicStyles.separator, { backgroundColor: colors.borderLight }]} />
            <View style={dynamicStyles.switchRow}>
              <View style={dynamicStyles.switchLeft}>
                <View style={dynamicStyles.menuIcon}>
                  <Ionicons name={isDarkMode ? 'moon' : 'sunny-outline'} size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={dynamicStyles.menuLabel}>Dark Mode</Text>
                  <Text style={dynamicStyles.switchDesc}>{isDarkMode ? 'Enabled' : 'Disabled'}</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isDarkMode ? colors.primary : colors.textMuted}
              />
            </View>
            {isSavingPrefs && (
              <View style={dynamicStyles.savingOverlay}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </Card>

          {/* ── Support ── */}
          <Text style={dynamicStyles.sectionTitle}>Support</Text>
          <Card style={dynamicStyles.menuCard} padding="xs">
            {supportItems.map((item, idx) => (
              <React.Fragment key={item.label}>
                <MenuRow item={item} />
                {idx < supportItems.length - 1 && <View style={[dynamicStyles.separator, { backgroundColor: colors.borderLight }]} />}
              </React.Fragment>
            ))}
          </Card>

          {/* ── Sign Out ── */}
          <TouchableOpacity
            style={dynamicStyles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={dynamicStyles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={dynamicStyles.version}>4Zee Properties v1.0.0</Text>
          <View style={{ height: Spacing.xxxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const { colors, isDarkMode } = useTheme();
  
  const rowStyles = useMemo(() => {
    return StyleSheet.create({
      menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        minHeight: 60,
      },
      menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: isDarkMode ? colors.primaryLight + '40' : colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
      },
      menuIconDanger: { backgroundColor: isDarkMode ? colors.errorLight + '40' : colors.errorLight },
      menuContent: { flex: 1 },
      menuLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
      menuLabel: { ...Typography.bodyMedium, color: colors.textPrimary },
      menuLabelDanger: { color: colors.error },
      menuSubtitle: { ...Typography.small, color: isDarkMode ? colors.textSecondary : colors.textMuted, marginTop: 2 },
      menuBadge: {
        backgroundColor: colors.error,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
      },
      menuBadgeText: {
        ...Typography.small,
        color: colors.white,
        fontWeight: '600',
        fontSize: 10,
      },
    });
  }, [colors, isDarkMode]);

  return (
    <TouchableOpacity
      style={rowStyles.menuRow}
      onPress={item.onPress}
      activeOpacity={0.6}
    >
      <View style={[rowStyles.menuIcon, item.danger && rowStyles.menuIconDanger]}>
        <Ionicons
          name={item.icon}
          size={20}
          color={item.danger ? colors.error : colors.primary}
        />
      </View>
      <View style={rowStyles.menuContent}>
        <View style={rowStyles.menuLabelRow}>
          <Text style={[rowStyles.menuLabel, item.danger && rowStyles.menuLabelDanger]}>
            {item.label}
          </Text>
          {item.badge && (
            <View style={rowStyles.menuBadge}>
              <Text style={rowStyles.menuBadgeText}>{item.badge}</Text>
            </View>
          )}
        </View>
        {item.subtitle && <Text style={rowStyles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.showChevron && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any, isDarkMode: boolean) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: Spacing.xxxxl },

  profileHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  profileBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  greeting: {
    ...Typography.h3,
    color: colors.white,
    marginBottom: Spacing.lg,
    textShadowColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: isDarkMode ? 4 : 3,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : colors.white,
    overflow: 'hidden' as const,
    ...Shadows.lg,
  },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarText: { ...Typography.h1, color: colors.primary, fontSize: 36 },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: isDarkMode ? 'rgba(255,255,255,0.3)' : colors.white,
  },
  userName: { ...Typography.h3, color: colors.textPrimary },
  userEmail: { ...Typography.caption, color: colors.textSecondary, marginTop: Spacing.xs },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: isDarkMode ? colors.primary + '20' : colors.primaryLight,
    gap: Spacing.xs,
  },
  editButtonText: { ...Typography.captionMedium, color: colors.primary },

  sectionTitle: {
    ...Typography.captionMedium,
    color: isDarkMode ? colors.textSecondary : colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.sm,
  },
  menuCard: { 
    marginHorizontal: Spacing.xl,
    backgroundColor: isDarkMode ? colors.surface : colors.white,
  },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    minHeight: 60,
    backgroundColor: isDarkMode ? colors.surface : colors.white,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuIconDanger: { backgroundColor: colors.errorLight },
  menuContent: { flex: 1 },
  menuLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuLabel: { ...Typography.bodyMedium, color: colors.textPrimary },
  menuLabelDanger: { color: colors.error },
  menuSubtitle: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
  menuBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  menuBadgeText: {
    ...Typography.small,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  separator: { 
    height: 1, 
    backgroundColor: isDarkMode ? colors.border : colors.borderLight, 
    marginHorizontal: Spacing.lg 
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 60,
    backgroundColor: isDarkMode ? colors.surface : colors.white,
  },
  switchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  switchDesc: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Use semi-transparent white for light mode, semi-transparent dark for dark mode
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxxl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: isDarkMode ? colors.error + '60' : colors.error + '40',
    backgroundColor: isDarkMode ? colors.errorLight + '50' : colors.errorLight + '30',
    gap: Spacing.sm,
  },
  logoutText: { ...Typography.bodySemiBold, color: colors.error },
  version: {
    ...Typography.small,
    color: isDarkMode ? colors.textSecondary : colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
