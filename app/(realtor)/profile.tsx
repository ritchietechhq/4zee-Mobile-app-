import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, RefreshControl, Clipboard,
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
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const kycStatusConfig: Record<KYCStatus, { icon: string; color: string; bg: string; label: string }> = {
  NOT_SUBMITTED: { icon: 'alert-circle', color: Colors.warning, bg: Colors.warningLight, label: 'Not Verified' },
  PENDING: { icon: 'hourglass', color: Colors.primary, bg: Colors.primaryLight, label: 'Under Review' },
  VERIFIED: { icon: 'checkmark-circle', color: Colors.success, bg: Colors.successLight, label: 'Verified' },
  REJECTED: { icon: 'close-circle', color: Colors.error, bg: Colors.errorLight, label: 'Rejected' },
};

type MenuItem = { icon: string; label: string; desc?: string; onPress: () => void; badge?: string; badgeColor?: string };

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

  const onRefresh = async () => { setIsRefreshing(true); await fetchAll(); setIsRefreshing(false); };

  const handleShareReferral = async () => {
    if (!referralInfo?.referralCode) return;
    try {
      await Share.share({
        message: `Join 4Zee Properties using my referral code: ${referralInfo.referralCode}\n\nSign up at https://4zeeproperties.com/register?ref=${referralInfo.referralCode}`,
        title: 'Share Referral Code',
      });
    } catch {}
  };

  const handleCopyCode = () => {
    if (!referralInfo?.referralCode) return;
    Clipboard.setString(referralInfo.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const kycStatus: KYCStatus = kyc?.status || 'NOT_SUBMITTED';
  const kycCfg = kycStatusConfig[kycStatus];

  const menuItems: MenuItem[] = [
    { icon: 'shield-checkmark-outline', label: 'KYC Verification', desc: kycCfg.label, onPress: () => router.push('/(realtor)/kyc'), badge: kycCfg.label, badgeColor: kycCfg.color },
    { icon: 'card-outline', label: 'Bank Accounts', desc: 'Manage payout accounts', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', desc: 'Manage preferences', onPress: () => {} },
    { icon: 'lock-closed-outline', label: 'Security', desc: 'Password & 2FA', onPress: () => {} },
    { icon: 'help-circle-outline', label: 'Help & Support', desc: 'FAQs and contact', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {isLoading ? (
          <View style={styles.pad}>
            <Skeleton width="100%" height={160} />
            <Skeleton width="100%" height={140} style={{ marginTop: Spacing.lg }} />
            <Skeleton width="100%" height={200} style={{ marginTop: Spacing.lg }} />
          </View>
        ) : (
          <>
            {/* Profile Card */}
            <Card variant="elevated" padding="xl" style={styles.profileCard}>
              <View style={styles.avatarRow}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </Text>
                  </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
                  <Text style={styles.email}>{user?.email}</Text>
                  {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
                </View>
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Ionicons name="briefcase" size={14} color={Colors.primary} />
                  <Text style={styles.roleText}>Realtor</Text>
                </View>
                <View style={[styles.kycBadge, { backgroundColor: kycCfg.bg }]}>
                  <Ionicons name={kycCfg.icon as any} size={14} color={kycCfg.color} />
                  <Text style={[styles.kycBadgeText, { color: kycCfg.color }]}>{kycCfg.label}</Text>
                </View>
              </View>
            </Card>

            {/* Referral Section */}
            {referralInfo && (
              <Card variant="outlined" padding="lg" style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Referral Program</Text>
                </View>
                <TouchableOpacity style={styles.codeBox} onPress={handleCopyCode} activeOpacity={0.7}>
                  <Text style={styles.codeLabel}>Your Referral Code</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{referralInfo.referralCode}</Text>
                    <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                  </View>
                </TouchableOpacity>
                <View style={styles.refStats}>
                  <View style={styles.refStat}>
                    <Text style={styles.refStatVal}>{referralInfo.totalReferrals}</Text>
                    <Text style={styles.refStatLabel}>Total</Text>
                  </View>
                  <View style={styles.refStatDivider} />
                  <View style={styles.refStat}>
                    <Text style={styles.refStatVal}>{referralInfo.activeReferrals}</Text>
                    <Text style={styles.refStatLabel}>Active</Text>
                  </View>
                  <View style={styles.refStatDivider} />
                  <View style={styles.refStat}>
                    <Text style={[styles.refStatVal, { color: Colors.success }]}>{formatCurrency(referralInfo.totalReferralEarnings)}</Text>
                    <Text style={styles.refStatLabel}>Earned</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShareReferral} activeOpacity={0.8}>
                  <Ionicons name="share-social-outline" size={18} color={Colors.white} />
                  <Text style={styles.shareBtnText}>Share Referral Code</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* Menu */}
            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Settings</Text>
              {menuItems.map((item, i) => (
                <TouchableOpacity key={i} style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                  <View style={styles.menuIcon}>
                    <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    {item.desc && <Text style={styles.menuDesc}>{item.desc}</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout */}
            <View style={styles.pad}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.version}>4Zee Properties v1.0.0</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  pad: { paddingHorizontal: Spacing.xl },
  profileCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginBottom: Spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.h3, color: Colors.white },
  name: { ...Typography.h4, color: Colors.textPrimary },
  email: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  phone: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full },
  roleText: { ...Typography.small, color: Colors.primary, fontWeight: '600' },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  kycBadgeText: { ...Typography.small, fontWeight: '600' },
  sectionCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  codeBox: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.borderLight, borderStyle: 'dashed', marginBottom: Spacing.lg },
  codeLabel: { ...Typography.small, color: Colors.textMuted, marginBottom: Spacing.xs },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { ...Typography.h3, color: Colors.primary, letterSpacing: 2 },
  refStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  refStat: { flex: 1, alignItems: 'center' },
  refStatDivider: { width: 1, height: 30, backgroundColor: Colors.borderLight },
  refStatVal: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  refStatLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md },
  shareBtnText: { ...Typography.bodySemiBold, color: Colors.white },
  menuSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  menuTitle: { ...Typography.captionMedium, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  menuDesc: { ...Typography.small, color: Colors.textMuted, marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, backgroundColor: Colors.errorLight, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  logoutText: { ...Typography.bodySemiBold, color: Colors.error },
  version: { ...Typography.small, color: Colors.textMuted, textAlign: 'center', paddingBottom: Spacing.xxxl },
});
