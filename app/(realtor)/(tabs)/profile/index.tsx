import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, RefreshControl, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
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
  const { isDarkMode, setThemeMode, colors } = useTheme();
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const dynamicStyles = useMemo(() => createRealtorStyles(colors), [colors]);

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

  const handleToggleDarkMode = async (value: boolean) => {
    try {
      await setThemeMode(value ? 'dark' : 'light');
    } catch {
      Alert.alert('Error', 'Failed to update theme setting');
    }
  };

  const kycStatus: KYCStatus = kyc?.kycStatus || 'NOT_SUBMITTED';
  const kycInfo = kycBadge[kycStatus];

  const menuItems: MenuItem[] = [
    { icon: 'shield-checkmark-outline', label: 'KYC Verification', onPress: () => router.push('/(realtor)/profile/kyc' as any), badge: kycInfo.label },
    { icon: 'card-outline', label: 'Bank Accounts', onPress: () => router.push('/(realtor)/profile/bank-accounts' as any) },
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/(realtor)/profile/edit-profile' as any) },
    { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => router.push('/(realtor)/profile/change-password' as any) },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(realtor)/profile/notifications' as any) },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/(realtor)/profile/help' as any) },
  ];

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;

  return (
    <SafeAreaView style={[dynamicStyles.container]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <Card variant="elevated" padding="xl" style={dynamicStyles.profileCard}>
          <View style={dynamicStyles.avatarWrap}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={dynamicStyles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={[colors.primary, colors.accent]} style={dynamicStyles.avatar}>
                <Text style={dynamicStyles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={dynamicStyles.kycDot}>
              <View style={[dynamicStyles.kycDotInner, { backgroundColor: kycStatus === 'APPROVED' ? colors.success : kycStatus === 'PENDING' ? colors.primary : colors.warning }]} />
            </View>
          </View>
          <Text style={dynamicStyles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={dynamicStyles.email}>{user?.email}</Text>
          {user?.phone && <Text style={dynamicStyles.phone}>{user.phone}</Text>}
          <View style={dynamicStyles.badges}>
            <View style={[dynamicStyles.roleBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="briefcase" size={11} color={colors.primary} />
              <Text style={[dynamicStyles.roleText, { color: colors.primary }]}>Realtor</Text>
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
          <Card variant="outlined" padding="xl" style={dynamicStyles.referralCard}>
            <View style={dynamicStyles.referralHeader}>
              <Ionicons name="link" size={18} color={colors.primary} />
              <Text style={dynamicStyles.referralTitle}>Your Referral Code</Text>
            </View>
            <TouchableOpacity style={[dynamicStyles.codeBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]} onPress={handleShareReferral} activeOpacity={0.7}>
              <Text style={[dynamicStyles.codeText, { color: colors.primary }]}>{referralInfo.referralCode}</Text>
              <Ionicons name="copy-outline" size={16} color={colors.primary} />
            </TouchableOpacity>
            <View style={dynamicStyles.refStats}>
              <View style={[dynamicStyles.refStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[dynamicStyles.refStatVal, { color: colors.textPrimary }]}>{referralInfo.totalReferrals}</Text>
                <Text style={[dynamicStyles.refStatLabel, { color: colors.textMuted }]}>Referrals</Text>
              </View>
              <View style={[dynamicStyles.refStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[dynamicStyles.refStatVal, { color: colors.textPrimary }]}>{referralInfo.activeReferrals}</Text>
                <Text style={[dynamicStyles.refStatLabel, { color: colors.textMuted }]}>Active</Text>
              </View>
              <View style={[dynamicStyles.refStatItem, { backgroundColor: colors.surface }]}>
                <Text style={[dynamicStyles.refStatVal, { color: colors.textPrimary }]}>{formatCurrency(referralInfo.totalReferralEarnings)}</Text>
                <Text style={[dynamicStyles.refStatLabel, { color: colors.textMuted }]}>Earned</Text>
              </View>
            </View>
            <TouchableOpacity style={[dynamicStyles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShareReferral} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={16} color={colors.white} />
              <Text style={dynamicStyles.shareBtnText}>Share Referral Code</Text>
            </TouchableOpacity>
          </Card>
        ) : null}

        {/* Menu Items */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Settings</Text>
          <Card variant="outlined" padding="xs" style={[dynamicStyles.menuCard, { padding: 0 }]}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[dynamicStyles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={dynamicStyles.menuLeft}>
                  <View style={[dynamicStyles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={[dynamicStyles.menuText, { color: colors.textPrimary }]}>{item.label}</Text>
                </View>
                <View style={dynamicStyles.menuRight}>
                  {item.badge && (
                    <Text style={[dynamicStyles.menuBadge, { color: colors.textMuted }]}>{item.badge}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Dark Mode Toggle */}
            <View style={[dynamicStyles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={dynamicStyles.menuLeft}>
                <View style={[dynamicStyles.menuIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={isDarkMode ? 'moon' : 'sunny-outline'} size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[dynamicStyles.menuText, { color: colors.textPrimary }]}>Dark Mode</Text>
                  <Text style={[dynamicStyles.menuSubtitle, { color: colors.textMuted }]}>{isDarkMode ? 'Enabled' : 'Disabled'}</Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={isDarkMode ? colors.primary : colors.textMuted}
              />
            </View>
          </Card>
        </View>

        {/* Logout */}
        <View style={dynamicStyles.section}>
          <TouchableOpacity style={[dynamicStyles.logoutBtn, { backgroundColor: colors.errorLight }]} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[dynamicStyles.logoutText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={dynamicStyles.version}>4Zee Properties v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createRealtorStyles = (colors: any) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: colors.textPrimary },
  profileCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h3, color: colors.white, fontWeight: '700' },
  kycDot: {
    position: 'absolute', bottom: 2, right: 2, width: 18, height: 18,
    borderRadius: 9, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  kycDotInner: { width: 12, height: 12, borderRadius: 6 },
  name: { ...Typography.h4, color: colors.textPrimary },
  email: { ...Typography.body, color: colors.textSecondary, marginTop: 2 },
  phone: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: { ...Typography.captionMedium },
  referralCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  referralTitle: { ...Typography.bodySemiBold, color: colors.textPrimary },
  codeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: BorderRadius.lg, padding: Spacing.lg,
    borderWidth: 1, borderStyle: 'dashed', marginBottom: Spacing.lg,
  },
  codeText: { ...Typography.h4, letterSpacing: 2 },
  refStats: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  refStatItem: { flex: 1, alignItems: 'center', borderRadius: BorderRadius.lg, padding: Spacing.md },
  refStatVal: { ...Typography.bodySemiBold },
  refStatLabel: { ...Typography.small, marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  shareBtnText: { ...Typography.bodySemiBold, color: colors.white },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  menuCard: { overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  menuIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { ...Typography.body },
  menuSubtitle: { ...Typography.small, marginTop: 2 },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuBadge: { ...Typography.small },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg,
  },
  logoutText: { ...Typography.bodySemiBold },
  version: { ...Typography.small, color: colors.textMuted, textAlign: 'center', paddingBottom: Spacing.xxxl },
});

const styles = createRealtorStyles(Colors);
