import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import type { RealtorDashboardApplication } from '@/types';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const APP_STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning, label: 'Pending' },
  APPROVED: { bg: Colors.successLight, text: Colors.success, label: 'Approved' },
  REJECTED: { bg: Colors.errorLight, text: Colors.error, label: 'Rejected' },
  CANCELLED: { bg: Colors.surface, text: Colors.textMuted, label: 'Cancelled' },
};

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { realtorData, isLoading, fetchRealtorDashboard } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    fetchRealtorDashboard().catch(() => {});
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, [fetchRealtorDashboard]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRealtorDashboard().catch(() => {});
    setIsRefreshing(false);
  };

  const profile = realtorData?.profile;
  const kycStatus = profile?.kycStatus ?? 'NOT_SUBMITTED';

  const kycBanner = () => {
    if (!profile || kycStatus === 'APPROVED') return null;
    const config: Record<string, { bg: string; icon: string; title: string; sub: string; cta: string }> = {
      NOT_SUBMITTED: { bg: Colors.warningLight, icon: 'shield-outline', title: 'Complete Verification', sub: 'Verify your identity to unlock full access', cta: 'Start KYC' },
      PENDING: { bg: Colors.primaryLight, icon: 'time-outline', title: 'Verification Pending', sub: 'We are reviewing your documents', cta: 'View Status' },
      REJECTED: { bg: Colors.errorLight, icon: 'alert-circle-outline', title: 'Verification Rejected', sub: profile.kycRejectedReason || 'Please resubmit your documents', cta: 'Resubmit' },
    };
    const c = config[kycStatus] || config.NOT_SUBMITTED;
    return (
      <TouchableOpacity
        style={[styles.kycBanner, { backgroundColor: c.bg }]}
        onPress={() => router.push('/(realtor)/kyc')}
        activeOpacity={0.8}
      >
        <Ionicons name={c.icon as any} size={22} color={kycStatus === 'REJECTED' ? Colors.error : Colors.primary} />
        <View style={styles.kycBannerContent}>
          <Text style={styles.kycBannerTitle}>{c.title}</Text>
          <Text style={styles.kycBannerSub} numberOfLines={2}>{c.sub}</Text>
        </View>
        <View style={styles.kycBannerCta}>
          <Text style={styles.kycBannerCtaText}>{c.cta}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={16} style={{ marginTop: 6 }} />
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (<Skeleton key={i} width="47%" height={120} />))}
      </View>
      <Skeleton width="100%" height={140} style={{ marginTop: Spacing.lg }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.firstName ?? user?.firstName)?.charAt(0)}{(profile?.lastName ?? user?.lastName)?.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{profile?.firstName ?? user?.firstName ?? 'Realtor'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(realtor)/notifications' as any)} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
            {(realtorData?.alerts?.unreadNotifications ?? 0) > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>
                  {realtorData!.alerts.unreadNotifications > 9 ? '9+' : realtorData!.alerts.unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* KYC Banner */}
        {kycBanner()}

        {isLoading && !realtorData ? renderSkeleton() : realtorData && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <AnalyticsCard title="Total Sales" value={String(realtorData.sales.total)} icon="receipt-outline" style={styles.statHalf} />
              <AnalyticsCard title="Balance" value={formatCurrency(realtorData.earnings.availableBalance)} icon="wallet-outline" iconColor={Colors.success} iconBackground={Colors.successLight} style={styles.statHalf} />
              <AnalyticsCard title="Conversions" value={String(realtorData.referrals.totalConversions)} icon="people-outline" iconColor={Colors.accent} iconBackground={Colors.primaryLight} style={styles.statHalf} />
              <AnalyticsCard title="Commissions" value={String(realtorData.earnings.commissionCount)} icon="cash-outline" iconColor={Colors.warning} iconBackground={Colors.warningLight} style={styles.statHalf} />
            </View>

            {/* Earnings Card */}
            <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.revenueCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.revLabel}>Total Commissions Earned</Text>
              <Text style={styles.revValue}>{formatCurrency(realtorData.earnings.totalCommissions)}</Text>
              <View style={styles.revDivider} />
              <View style={styles.revRow}>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{formatCurrency(realtorData.earnings.availableBalance)}</Text>
                  <Text style={styles.revItemLabel}>Available</Text>
                </View>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{formatCurrency(realtorData.earnings.totalWithdrawn)}</Text>
                  <Text style={styles.revItemLabel}>Withdrawn</Text>
                </View>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{formatCurrency(realtorData.sales.totalValue)}</Text>
                  <Text style={styles.revItemLabel}>Sale Value</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Referral Snapshot */}
            {realtorData.referrals.activeLinks > 0 && (
              <Card variant="outlined" padding="lg" style={styles.referralCard}>
                <View style={styles.referralRow}>
                  <View style={styles.referralIcon}>
                    <Ionicons name="link-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralLabel}>Referral Links</Text>
                    <Text style={styles.referralValue}>{realtorData.referrals.totalClicks} clicks · {realtorData.referrals.totalConversions} conversions</Text>
                  </View>
                  <Text style={styles.referralCount}>{realtorData.referrals.activeLinks} active</Text>
                </View>
              </Card>
            )}

            {/* Recent Applications */}
            {realtorData.recentApplications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Applications</Text>
                <Card variant="outlined" padding="sm">
                  {realtorData.recentApplications.map((app) => {
                    const st = APP_STATUS_COLOR[app.status] || APP_STATUS_COLOR.PENDING;
                    return (
                      <View key={app.id} style={styles.appRow}>
                        <View style={styles.appLeft}>
                          <View style={styles.appIcon}>
                            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.appProperty} numberOfLines={1}>{app.property}</Text>
                            <Text style={styles.appClient} numberOfLines={1}>{app.client}</Text>
                          </View>
                        </View>
                        <View style={[styles.appBadge, { backgroundColor: st.bg }]}>
                          <Text style={[styles.appBadgeText, { color: st.text }]}>{st.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {[
                  { icon: 'list-outline', label: 'My Listings', color: Colors.primary, bg: Colors.primaryLight, route: '/(realtor)/listings' },
                  { icon: 'people-outline', label: 'Leads', color: Colors.success, bg: Colors.successLight, route: '/(realtor)/leads' },
                  { icon: 'wallet-outline', label: 'Earnings', color: Colors.warning, bg: Colors.warningLight, route: '/(realtor)/payments' },
                  { icon: 'shield-checkmark-outline', label: 'KYC', color: Colors.accent, bg: Colors.primaryLight, route: '/(realtor)/kyc' },
                ].map((a) => (
                  <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route as any)} activeOpacity={0.8}>
                    <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                      <Ionicons name={a.icon as any} size={20} color={a.color} />
                    </View>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.bodySemiBold, color: Colors.white, fontSize: 13 },
  greeting: { ...Typography.caption, color: Colors.textSecondary },
  name: { ...Typography.h4, color: Colors.textPrimary },
  notifBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight, position: 'relative' as const },
  notifDot: { position: 'absolute' as const, top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifDotText: { ...Typography.small, color: Colors.white, fontWeight: '700' as const, fontSize: 10 },
  kycBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.md },
  kycBannerContent: { flex: 1 },
  kycBannerTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  kycBannerSub: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  kycBannerCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kycBannerCtaText: { ...Typography.captionMedium, color: Colors.primary },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.lg },
  statHalf: { width: '47%' },
  revenueCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  revLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  revValue: { ...Typography.h1, color: Colors.white, marginTop: Spacing.xs },
  revDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.lg },
  revRow: { flexDirection: 'row', justifyContent: 'space-between' },
  revItem: { alignItems: 'center' },
  revItemVal: { ...Typography.bodySemiBold, color: Colors.white },
  revItemLabel: { ...Typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  referralCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  referralRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  referralIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  referralLabel: { ...Typography.caption, color: Colors.textSecondary },
  referralValue: { ...Typography.bodyMedium, color: Colors.textPrimary, marginTop: 2 },
  referralCount: { ...Typography.captionMedium, color: Colors.textSecondary },
  appRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginRight: Spacing.md },
  appIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  appProperty: { ...Typography.bodyMedium, color: Colors.textPrimary },
  appClient: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  appBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  appBadgeText: { ...Typography.small, fontWeight: '600' as const },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: { width: '47%', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm },
  actionIcon: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography.captionMedium, color: Colors.textPrimary, textAlign: 'center' },
});
