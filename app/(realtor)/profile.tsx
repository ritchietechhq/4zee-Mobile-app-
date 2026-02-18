import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userService } from '@/services/notification.service';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function RealtorProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { profile, fetchProfile } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    try {
      const data = await userService.getReferralCode();
      setReferralCode(data.code);
    } catch {
      // Referral code not available
    }
  };

  const handleShareReferral = async () => {
    if (!referralCode) return;
    try {
      await Share.share({
        message: `Join 4Zee Properties with my referral code: ${referralCode}\n\nDownload the app and start your property journey today!`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => Alert.alert('Coming Soon', 'Profile editing will be available soon.'),
    },
    {
      icon: 'lock-closed-outline',
      label: 'Change Password',
      onPress: () => Alert.alert('Coming Soon', 'Password change will be available soon.'),
    },
    {
      icon: 'notifications-outline',
      label: 'Notification Settings',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon.'),
    },
    {
      icon: 'shield-checkmark-outline',
      label: 'Privacy & Security',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings will be available soon.'),
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      onPress: () => Alert.alert('Coming Soon', 'Support will be available soon.'),
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Conditions',
      onPress: () => Alert.alert('Coming Soon', 'Terms will be available soon.'),
    },
  ];

  const displayUser = profile || user;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar & Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayUser?.firstName?.[0]?.toUpperCase() || ''}
              {displayUser?.lastName?.[0]?.toUpperCase() || ''}
            </Text>
          </View>
          <Text style={styles.name}>
            {displayUser?.firstName} {displayUser?.lastName}
          </Text>
          <Text style={styles.email}>{displayUser?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>Realtor</Text>
          </View>
        </View>

        {/* Referral Code Card */}
        {referralCode && (
          <Card variant="elevated" padding="xl" style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <View>
                <Text style={styles.referralLabel}>Your Referral Code</Text>
                <Text style={styles.referralCode}>{referralCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareReferral}
              >
                <Ionicons name="share-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.referralHint}>
              Share this code with clients to earn referral rewards
            </Text>
          </Card>
        )}

        {/* Stats Card */}
        <View style={styles.statsRow}>
          <Card variant="outlined" padding="lg" style={styles.statCard}>
            <Text style={styles.statValue}>
              {(profile as any)?.totalListings || '—'}
            </Text>
            <Text style={styles.statLabel}>Listings</Text>
          </Card>
          <Card variant="outlined" padding="lg" style={styles.statCard}>
            <Text style={styles.statValue}>
              {(profile as any)?.totalSales || '—'}
            </Text>
            <Text style={styles.statLabel}>Sales</Text>
          </Card>
          <Card variant="outlined" padding="lg" style={styles.statCard}>
            <Text style={styles.statValue}>
              {(profile as any)?.rating || '—'}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </Card>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && styles.menuItemBorder,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="Logout"
            variant="outline"
            icon="log-out-outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>

        {/* App Version */}
        <Text style={styles.version}>4Zee Properties v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  profileSection: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.white,
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
  },
  roleText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  referralCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  referralHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  referralLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  referralCode: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 2,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  menuSection: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  logoutSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  version: {
    ...Typography.small,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
});
