import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { referralService } from '@/services/referral.service';
import { kycService } from '@/services/kyc.service';
import type { ReferralInfo, KYC, KYCStatus } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

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
  const colors = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  const handleCopyReferralCode = async () => {
    if (!referralInfo?.referralCode) return;
    await Clipboard.setStringAsync(referralInfo.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
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
    { icon: 'shield-checkmark-outline', label: 'KYC Verification', onPress: () => router.push('/(realtor)/profile/kyc' as any), badge: kycInfo.label },
    { icon: 'card-outline', label: 'Bank Accounts', onPress: () => router.push('/(realtor)/profile/bank-accounts' as any) },
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/(realtor)/profile/edit-profile' as any) },
    { icon: 'lock-closed-outline', label: 'Change Password', onPress: () => router.push('/(realtor)/profile/change-password' as any) },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(realtor)/profile/notifications' as any) },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => router.push('/(realtor)/profile/help' as any) },
  ];

  const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <Card variant="elevated" padding="xl" style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} contentFit="cover" accessibilityLabel="Profile picture" />
            ) : (
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.kycDot}>
              <View style={[styles.kycDotInner, { backgroundColor: kycStatus === 'APPROVED' ? colors.success : kycStatus === 'PENDING' ? colors.primary : colors.warning }]} />
            </View>
          </View>
          <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          <View style={styles.badges}>
            <View style={styles.roleBadge}>
              <Ionicons name="briefcase" size={11} color={colors.primary} />
              <Text style={styles.roleText}>Realtor</Text>
            </View>
            <Badge label={kycInfo.label} variant={kycInfo.variant} size="sm" />
          </View>
        </Card>

        {/* Referral Hub */}
        {isLoading ? (
          <View style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.xl }}>
            <Skeleton width="100%" height={180} />
          </View>
        ) : referralInfo ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Referral Hub</Text>
            <Card variant="outlined" padding="md" style={styles.referralHubCard}>
              <View style={styles.referralCodeRow}>
                <View style={styles.referralCodeBox}>
                  <Text style={styles.referralCodeLabel}>Your Code</Text>
                  <Text style={styles.referralCodeValue}>{referralInfo.referralCode}</Text>
                </View>
                <View style={styles.referralActions}>
                  <TouchableOpacity style={styles.referralActionBtn} onPress={handleCopyReferralCode} activeOpacity={0.7}>
                    <Ionicons name="copy-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.referralActionBtn, { backgroundColor: colors.primary }]} onPress={handleShareReferral} activeOpacity={0.7}>
                    <Ionicons name="share-social-outline" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.referralStatsRow}>
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>{referralInfo.totalReferrals}</Text>
                  <Text style={styles.referralStatLabel}>Referrals</Text>
                </View>
                <View style={styles.referralStatDivider} />
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>{referralInfo.activeReferrals}</Text>
                  <Text style={styles.referralStatLabel}>Active</Text>
                </View>
                <View style={styles.referralStatDivider} />
                <View style={styles.referralStatItem}>
                  <Text style={styles.referralStatValue}>{formatCurrency(referralInfo.totalReferralEarnings)}</Text>
                  <Text style={styles.referralStatLabel}>Earned</Text>
                </View>
              </View>
              {referralInfo.referralLink ? (
                <View style={styles.referralLinkRow}>
                  <Ionicons name="link-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.referralLinkText} numberOfLines={1}>{referralInfo.referralLink}</Text>
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card variant="outlined" padding="xs" style={[styles.menuCard, { padding: 0 }]}>
            {menuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.menuText}>{item.label}</Text>
                </View>
                <View style={styles.menuRight}>
                  {item.badge && (
                    <Text style={styles.menuBadge}>{item.badge}</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Card variant="outlined" padding="xs" style={[styles.menuCard, { padding: 0 }]}>
            <View style={styles.themeRow}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, isDark && { backgroundColor: colors.surface }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.primary : '#F59E0B'} />
                </View>
                <View>
                  <Text style={styles.menuText}>Theme</Text>
                  <Text style={styles.themeHint}>
                    {themeMode === 'system' ? 'Follows device' : themeMode === 'dark' ? 'Always dark' : 'Always light'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.themePicker}>
              {(['system', 'light', 'dark'] as const).map((opt) => {
                const active = themeMode === opt;
                const iconName = opt === 'system' ? 'phone-portrait-outline' : opt === 'dark' ? 'moon' : 'sunny';
                const label = opt === 'system' ? 'Auto' : opt === 'dark' ? 'Dark' : 'Light';
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                    onPress={() => setThemeMode(opt)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={iconName as any} size={18} color={active ? colors.primary : colors.textMuted} />
                    <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>4Zee Properties v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: colors.textPrimary },
  profileCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center', backgroundColor: colors.cardBackground },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as const },
  avatarText: { ...Typography.h3, color: colors.white, fontWeight: '700' },
  kycDot: {
    position: 'absolute', bottom: 2, right: 2, width: 18, height: 18,
    borderRadius: 9, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center',
  },
  kycDotInner: { width: 12, height: 12, borderRadius: 6 },
  name: { ...Typography.h4, color: colors.textPrimary },
  email: { ...Typography.body, color: colors.textSecondary, marginTop: 2 },
  phone: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: colors.primaryLight, borderRadius: BorderRadius.full,
  },
  roleText: { ...Typography.captionMedium, color: colors.primary },
  referralHubCard: { backgroundColor: colors.cardBackground },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  referralCodeBox: { flex: 1 },
  referralCodeLabel: { ...Typography.small, color: colors.textMuted },
  referralCodeValue: { ...Typography.h4, color: colors.primary, letterSpacing: 1, marginTop: 2 },
  referralActions: { flexDirection: 'row', gap: Spacing.sm },
  referralActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  referralStatsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: Spacing.md },
  referralStatItem: { flex: 1, alignItems: 'center' },
  referralStatValue: { ...Typography.h4, color: colors.textPrimary },
  referralStatLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
  referralStatDivider: { width: 1, height: 28, backgroundColor: colors.borderLight },
  referralLinkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  referralLinkText: { ...Typography.small, color: colors.textMuted, flex: 1 },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  menuCard: { overflow: 'hidden', backgroundColor: colors.cardBackground },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  menuIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  menuText: { ...Typography.body, color: colors.textPrimary },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuBadge: { ...Typography.small, color: colors.textMuted },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
  },
  themeHint: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  themePicker: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg,
  },
  themeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  themeOptionActive: {
    borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  themeOptionText: { ...Typography.captionMedium, color: colors.textMuted },
  themeOptionTextActive: { color: colors.primary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.lg, backgroundColor: colors.errorLight, borderRadius: BorderRadius.lg,
  },
  logoutText: { ...Typography.bodySemiBold, color: colors.error },
  version: { ...Typography.small, color: colors.textTertiary, textAlign: 'center', paddingBottom: Spacing.xxxl },
});
