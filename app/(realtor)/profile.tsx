import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { referralService } from '@/services/referral.service';
import { kycService } from '@/services/kyc.service';
import type { ReferralInfo, KYC, KYCStatus } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const kycBadge: Record<KYCStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' }> = {
  NOT_SUBMITTED: { label: 'Not Verified', variant: 'warning' },
  PENDING: { label: 'Pending', variant: 'info' },
  APPROVED: { label: 'Verified', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'error' },
};

type MenuItem = { icon: string; label: string; onPress: () => void; badge?: string; danger?: boolean };

export default function RealtorProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [refRes, kycRes] = await Promise.all([
        referralService.getMyInfo().catch(() => null),
        kycService.getStatus().catch(() => null),
      ]);
      if (refRes) setReferralInfo(refRes);
      if (kycRes) setKyc(kycRes);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => { setIsLoading(true); await fetchAll(); setIsLoading(false); })();
  }, [fetchAll]);

  const onRefresh = async () => {
    setIsRefreshing(true); await fetchAll(); setIsRefreshing(false);
  };

  const handleShareReferral = async () => {
    if (!referralInfo?.referralCode) return;
    try {
      await Share.share({
        message: `Join 4Zee Properties using my referral code: ${referralInfo.referralCode}\n\nhttps://4zeeproperties.com/register?ref=${referralInfo.referralCode}`,
        title: 'Share Referral Code',
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const kycStatus: KYCStatus = kyc?.kycStatus || 'NOT_SUBMITTED';
  const kycInfo = kycBadge[kycStatus];

  const menuItems: MenuItem[] = [
    { icon: 'shield-checkmark-outline', label: 'KYC Verification', onPress: () => router.push('/(realtor)/kyc' as any), badge: kycInfo.label },
    { icon: 'card-outline', label: 'Bank Accounts', onPress: () => router.push('/(realtor)/bank-accounts' as any) },
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/(realtor)/edit-profile' as any) },
    { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => router.push('/(realtor)/change-password' as any) },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(realtor)/notifications' as any) },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/(realtor)/help' as any) },
  ];

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <Card variant="elevated" padding="xl" style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.kycDot}>
              <View style={[styles.kycDotInner, { backgroundColor: kycStatus === 'APPROVED' ? Colors.success : kycStatus === 'PENDING' ? Colors.primary : Colors.warning }]} />
            </View>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          <View style={styles.badges}>
            <View style={styles.roleBadge}>
              <Ionicons name="briefcase" size={11} color={Colors.primary} />
              <Text style={styles.roleText}>Realtor</Text>
            </View>
            <Badge label={kycInfo.label} variant={kycInfo.variant} size="sm" />
          </View>
        </Card>

        {/* Referral Card */}
        {isLoading ? (
          <View style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
            <Skeleton width="100%" height={180} />
          </View>
        ) : referralInfo ? (
          <Card variant="outlined" padding="xl" style={styles.referralCard}>
            <View style={styles.referralHeader}>
              <Ionicons name="link" size={18} color={Colors.primary} />
              <Text style={styles.referralTitle}>Your Referral Code</Text>
            </View>
            <TouchableOpacity style={styles.codeBox} onPress={handleShareReferral} activeOpacity={0.7}>
              <Text style={styles.codeText}>{referralInfo.referralCode}</Text>
              <Ionicons name="copy-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.refStats}>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatVal}>{referralInfo.totalReferrals}</Text>
                <Text style={styles.refStatLabel}>Referrals</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatVal}>{referralInfo.activeReferrals}</Text>
                <Text style={styles.refStatLabel}>Active</Text>
              </View>
              <View style={styles.refStatItem}>
                <Text style={styles.refStatVal}>{formatCurrency(referralInfo.totalReferralEarnings)}</Text>
                <Text style={styles.refStatLabel}>Earned</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={16} color={Colors.white} />
              <Text style={styles.shareBtnText}>Share Referral Code</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card variant="outlined" padding="xs" style={[styles.menuCard, { padding: 0 }]}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuText}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <Text style={styles.menuBadge}>{item.badge}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>4Zee Properties v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  profileCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h3, color: Colors.white, fontWeight: '700' },
  kycDot: {
    position: 'absolute', bottom: 2, right: 2, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  kycDotInner: { width: 12, height: 12, borderRadius: 6 },
  name: { ...Typography.h4, color: Colors.textPrimary },
  email: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  phone: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full,
  },
  roleText: { ...Typography.captionMedium, color: Colors.primary },
  referralCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  referralTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed', marginBottom: Spacing.lg,
  },
  codeText: { ...Typography.h4, color: Colors.primary, letterSpacing: 2 },
  refStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  refStatItem: { flex: 1, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md },
  refStatVal: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  refStatLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  shareBtnText: { ...Typography.bodySemiBold, color: Colors.white },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.captionMedium, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  menuCard: { overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuText: { ...Typography.body, color: Colors.textPrimary },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuBadge: { ...Typography.small, color: Colors.textMuted },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, backgroundColor: Colors.errorLight, borderRadius: BorderRadius.lg,
  },
  logoutText: { ...Typography.bodySemiBold, color: Colors.error },
  version: { ...Typography.small, color: Colors.textTertiary, textAlign: 'center', paddingBottom: Spacing.xxxl },
});
