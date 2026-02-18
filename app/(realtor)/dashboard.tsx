import React, { useEffect, useState, useCallback } from 'react';
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
import { kycService } from '@/services/kyc.service';
import type { KYC } from '@/types';
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

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { realtorData, isLoading, fetchRealtorDashboard } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    fetchRealtorDashboard();
    kycService.getStatus().then(setKyc).catch(() => {});
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, [fetchRealtorDashboard]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchRealtorDashboard(),
      kycService.getStatus().then(setKyc).catch(() => {}),
    ]);
    setIsRefreshing(false);
  };

  const kycBanner = () => {
    if (!kyc || kyc.status === 'VERIFIED') return null;
    const config: Record<string, { bg: string; icon: string; title: string; sub: string; cta: string }> = {
      NOT_SUBMITTED: { bg: Colors.warningLight, icon: 'shield-outline', title: 'Complete Verification', sub: 'Verify your identity to unlock full access', cta: 'Start KYC' },
      PENDING: { bg: Colors.primaryLight, icon: 'time-outline', title: 'Verification Pending', sub: 'We are reviewing your documents', cta: 'View Status' },
      REJECTED: { bg: Colors.errorLight, icon: 'alert-circle-outline', title: 'Verification Rejected', sub: kyc.rejectionReason || 'Please resubmit your documents', cta: 'Resubmit' },
    };
    const c = config[kyc.status] || config.NOT_SUBMITTED;
    return (
      <TouchableOpacity
        style={[styles.kycBanner, { backgroundColor: c.bg }]}
        onPress={() => router.push('/(realtor)/kyc')}
        activeOpacity={0.8}
      >
        <Ionicons name={c.icon as any} size={28} color={kyc.status === 'REJECTED' ? Colors.error : Colors.primary} />
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
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{user?.firstName || 'Realtor'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* KYC Banner */}
        {kycBanner()}

        {isLoading && !realtorData ? renderSkeleton() : realtorData && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <AnalyticsCard title="Total Sales" value={String(realtorData.sales.total)} icon="receipt-outline" style={styles.statHalf} />
              <AnalyticsCard title="This Month" value={String(realtorData.sales.thisMonth)} icon="trending-up-outline" iconColor={Colors.success} iconBackground={Colors.successLight} style={styles.statHalf} />
              <AnalyticsCard title="Referrals" value={String(realtorData.referrals.total)} icon="people-outline" iconColor={Colors.accent} iconBackground={Colors.primaryLight} style={styles.statHalf} />
              <AnalyticsCard title="Commissions" value={String(realtorData.commissions.total)} icon="cash-outline" iconColor={Colors.warning} iconBackground={Colors.warningLight} style={styles.statHalf} />
            </View>

            {/* Revenue Card */}
            <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.revenueCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.revLabel}>Total Sales Revenue</Text>
              <Text style={styles.revValue}>{formatCurrency(realtorData.sales.totalAmount)}</Text>
              <View style={styles.revDivider} />
              <View style={styles.revRow}>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{realtorData.commissions.pending}</Text>
                  <Text style={styles.revItemLabel}>Pending</Text>
                </View>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{realtorData.commissions.approved}</Text>
                  <Text style={styles.revItemLabel}>Approved</Text>
                </View>
                <View style={styles.revItem}>
                  <Text style={styles.revItemVal}>{realtorData.commissions.paid}</Text>
                  <Text style={styles.revItemLabel}>Paid</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Performance Chart */}
            {realtorData.performanceChart?.labels?.length > 0 && (
              <Card variant="elevated" padding="lg" style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Performance</Text>
                <View style={styles.chartBars}>
                  {realtorData.performanceChart.labels.map((label, i) => {
                    const max = Math.max(...realtorData.performanceChart.data, 1);
                    const pct = (realtorData.performanceChart.data[i] || 0) / max;
                    return (
                      <View key={i} style={styles.chartBarWrap}>
                        <View style={styles.chartBarTrack}>
                          <View style={[styles.chartBarFill, { height: `${Math.max(pct * 100, 4)}%` }]} />
                        </View>
                        <Text style={styles.chartLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}

            {/* Referral Earnings */}
            {realtorData.referrals.earnings > 0 && (
              <Card variant="outlined" padding="lg" style={styles.referralCard}>
                <View style={styles.referralRow}>
                  <View style={styles.referralIcon}>
                    <Ionicons name="gift-outline" size={22} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.referralLabel}>Referral Earnings</Text>
                    <Text style={styles.referralValue}>{formatCurrency(realtorData.referrals.earnings)}</Text>
                  </View>
                  <Text style={styles.referralCount}>{realtorData.referrals.active} active</Text>
                </View>
              </Card>
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
                      <Ionicons name={a.icon as any} size={22} color={a.color} />
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...Typography.bodySemiBold, color: Colors.white, fontSize: 15 },
  greeting: { ...Typography.caption, color: Colors.textSecondary },
  name: { ...Typography.h4, color: Colors.textPrimary },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
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
  chartCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  chartBars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, marginTop: Spacing.md },
  chartBarWrap: { flex: 1, alignItems: 'center' },
  chartBarTrack: { width: 20, height: 100, backgroundColor: Colors.borderLight, borderRadius: 10, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 10 },
  chartLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 6 },
  referralCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  referralRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  referralIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  referralLabel: { ...Typography.caption, color: Colors.textSecondary },
  referralValue: { ...Typography.h4, color: Colors.primary },
  referralCount: { ...Typography.captionMedium, color: Colors.textSecondary },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: { width: '47%', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm },
  actionIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography.captionMedium, color: Colors.textPrimary, textAlign: 'center' },
});
