import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { referralService } from '@/services/referral.service';
import { ReferralInfo } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function RealtorProfile() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [isLoadingReferral, setIsLoadingReferral] = useState(true);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      setIsLoadingReferral(true);
      const data = await referralService.getMyInfo();
      setReferralInfo(data);
    } catch (error) {
      console.error('Failed to load referral info:', error);
    } finally {
      setIsLoadingReferral(false);
    }
  };

  const handleShareReferral = async () => {
    if (!referralInfo?.referralCode) return;
    try {
      await Share.share({
        message: `Join 4Zee Properties using my referral code: ${referralInfo.referralCode}\n\nSign up at https://4zeeproperties.com/register?ref=${referralInfo.referralCode}`,
        title: 'Share Referral Code',
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  const profilePicture = user?.profilePicture;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <Card variant="elevated" padding="xl" style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}
                  {user?.lastName?.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          <View style={styles.roleBadge}>
            <Ionicons name="briefcase-outline" size={14} color={Colors.primary} />
            <Text style={styles.roleText}>Realtor</Text>
          </View>
        </Card>

        {/* Referral Section */}
        <Card variant="outlined" padding="xl" style={styles.referralCard}>
          <View style={styles.referralHeader}>
            <Ionicons name="link-outline" size={24} color={Colors.primary} />
            <Text style={styles.referralTitle}>Your Referral Code</Text>
          </View>

          {isLoadingReferral ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginVertical: Spacing.lg }}
            />
          ) : referralInfo ? (
            <>
              <TouchableOpacity
                style={styles.codeContainer}
                onPress={handleShareReferral}
              >
                <Text style={styles.codeText}>
                  {referralInfo.referralCode}
                </Text>
                <Ionicons name="copy-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>

              <View style={styles.referralStats}>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>
                    {referralInfo.totalReferrals}
                  </Text>
                  <Text style={styles.referralStatLabel}>Total Referrals</Text>
                </View>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>
                    {referralInfo.activeReferrals}
                  </Text>
                  <Text style={styles.referralStatLabel}>Active</Text>
                </View>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>
                    {formatCurrency(referralInfo.totalReferralEarnings)}
                  </Text>
                  <Text style={styles.referralStatLabel}>Earned</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareReferral}
              >
                <Ionicons name="share-social-outline" size={20} color={Colors.white} />
                <Text style={styles.shareButtonText}>Share Referral Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noReferralText}>
              Unable to load referral info. Pull to refresh.
            </Text>
          )}
        </Card>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="card-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Bank Accounts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>KYC Verification</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  profileCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.white,
  },
  name: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phone: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
  referralCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  referralTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  codeText: {
    ...Typography.h3,
    color: Colors.primary,
    letterSpacing: 2,
  },
  referralStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  referralStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  referralStatValue: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  referralStatLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  shareButtonText: {
    ...Typography.bodySemiBold,
    color: Colors.white,
  },
  noReferralText: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
  logoutSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.lg,
  },
  logoutText: {
    ...Typography.bodySemiBold,
    color: Colors.error,
  },
  version: {
    ...Typography.small,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingBottom: Spacing.xxl,
  },
});
