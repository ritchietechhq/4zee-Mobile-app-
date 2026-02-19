import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, Share, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import { realtorService } from '@/services/realtor.service';
import { notificationService } from '@/services/notification.service';
import type { RealtorDashboardApplication, ListingStats, Notification } from '@/types';
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

const getNotifIcon = (type?: string): any => {
  switch (type) {
    case 'PAYMENT': return 'card-outline';
    case 'APPLICATION': return 'document-text-outline';
    case 'KYC': return 'shield-checkmark-outline';
    case 'LISTING': return 'business-outline';
    case 'REFERRAL': return 'people-outline';
    case 'PAYOUT': return 'cash-outline';
    default: return 'notifications-outline';
  }
};

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { realtorData, isLoading, fetchRealtorDashboard } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [listingStats, setListingStats] = useState<ListingStats | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadExtras = useCallback(async () => {
    try {
      const [stats, notifsRes, count] = await Promise.allSettled([
        realtorService.getListingStats(),
        notificationService.getNotifications(false, undefined, 3),
        notificationService.getUnreadCount(),
      ]);
      if (stats.status === 'fulfilled') setListingStats(stats.value);
      if (notifsRes.status === 'fulfilled') setRecentNotifications(notifsRes.value.notifications);
      if (count.status === 'fulfilled') setUnreadCount(count.value);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRealtorDashboard().catch(() => {});
    loadExtras();
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();
  }, [fetchRealtorDashboard, loadExtras]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.allSettled([fetchRealtorDashboard(), loadExtras()]);
    setIsRefreshing(false);
  };

  const profile = realtorData?.profile;
  const kycStatus = profile?.kycStatus ?? 'NOT_SUBMITTED';

  const handleShareReferral = async () => {
    const code = profile?.referralCode;
    if (!code) return;
    try {
      await Share.share({
        message: `Join 4Zee Properties with my referral code: ${code}\n\nhttps://4zee.com/ref/${code}`,
        title: 'My 4Zee Referral Link',
      });
    } catch {}
  };

  const handleCopyReferralCode = () => {
    const code = profile?.referralCode;
    if (!code) return;
    Clipboard.setString(code);
  };

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
        onPress={() => router.push('/(realtor)/profile/kyc' as any)}
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
          <TouchableOpacity onPress={() => router.push('/(realtor)/profile/notifications' as any)} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
            {(unreadCount || realtorData?.alerts?.unreadNotifications || 0) > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>
                  {(unreadCount || realtorData?.alerts?.unreadNotifications || 0) > 9 ? '9+' : (unreadCount || realtorData?.alerts?.unreadNotifications || 0)}
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

            {/* Listing Performance */}
            {listingStats && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Listing Performance</Text>
                  <TouchableOpacity onPress={() => router.push('/(realtor)/listings' as any)}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                <Card variant="outlined" padding="md" style={styles.performanceCard}>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: Colors.primaryLight }]}>
                        <Ionicons name="business-outline" size={18} color={Colors.primary} />
                      </View>
                      <Text style={styles.performanceValue}>{listingStats.total}</Text>
                      <Text style={styles.performanceLabel}>Total</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: Colors.successLight }]}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                      </View>
                      <Text style={styles.performanceValue}>{listingStats.available}</Text>
                      <Text style={styles.performanceLabel}>Available</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: Colors.warningLight }]}>
                        <Ionicons name="eye-outline" size={18} color={Colors.warning} />
                      </View>
                      <Text style={styles.performanceValue}>{listingStats.totalViews}</Text>
                      <Text style={styles.performanceLabel}>Views</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: Colors.errorLight }]}>
                        <Ionicons name="bookmark-outline" size={18} color={Colors.error} />
                      </View>
                      <Text style={styles.performanceValue}>{listingStats.sold}</Text>
                      <Text style={styles.performanceLabel}>Sold</Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* Referral Hub */}
            {profile?.referralCode && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Referral Hub</Text>
                <Card variant="outlined" padding="md" style={styles.referralHubCard}>
                  <View style={styles.referralCodeRow}>
                    <View style={styles.referralCodeBox}>
                      <Text style={styles.referralCodeLabel}>Your Code</Text>
                      <Text style={styles.referralCodeValue}>{profile.referralCode}</Text>
                    </View>
                    <View style={styles.referralActions}>
                      <TouchableOpacity style={styles.referralActionBtn} onPress={handleCopyReferralCode} activeOpacity={0.7}>
                        <Ionicons name="copy-outline" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.referralActionBtn, { backgroundColor: Colors.primary }]} onPress={handleShareReferral} activeOpacity={0.7}>
                        <Ionicons name="share-social-outline" size={18} color={Colors.white} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.referralStatsRow}>
                    <View style={styles.referralStatItem}>
                      <Text style={styles.referralStatValue}>{realtorData.referrals.activeLinks}</Text>
                      <Text style={styles.referralStatLabel}>Active Links</Text>
                    </View>
                    <View style={styles.referralStatDivider} />
                    <View style={styles.referralStatItem}>
                      <Text style={styles.referralStatValue}>{realtorData.referrals.totalClicks}</Text>
                      <Text style={styles.referralStatLabel}>Clicks</Text>
                    </View>
                    <View style={styles.referralStatDivider} />
                    <View style={styles.referralStatItem}>
                      <Text style={styles.referralStatValue}>{realtorData.referrals.totalConversions}</Text>
                      <Text style={styles.referralStatLabel}>Conversions</Text>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* Recent Notifications */}
            {recentNotifications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Notifications</Text>
                  <TouchableOpacity onPress={() => router.push('/(realtor)/profile/notifications' as any)}>
                    <View style={styles.seeAllRow}>
                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                      )}
                      <Text style={styles.seeAll}>View All</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <Card variant="outlined" padding="sm">
                  {recentNotifications.map((notif, idx) => (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifRow,
                        idx < recentNotifications.length - 1 && styles.notifRowBorder,
                        !notif.isRead && styles.notifUnread,
                      ]}
                      onPress={() => router.push('/(realtor)/profile/notifications' as any)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.notifIcon, !notif.isRead && { backgroundColor: Colors.primaryLight }]}>
                        <Ionicons
                          name={getNotifIcon(notif.type)}
                          size={16}
                          color={!notif.isRead ? Colors.primary : Colors.textMuted}
                        />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={[styles.notifTitle, !notif.isRead && { color: Colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notifBody} numberOfLines={1}>{notif.message}</Text>
                      </View>
                      {!notif.isRead && <View style={styles.notifUnreadDot} />}
                    </TouchableOpacity>
                  ))}
                </Card>
              </View>
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
                  { icon: 'add-circle', label: 'Add Property', color: Colors.primary, bg: Colors.primaryLight, route: '/(realtor)/add-listing' },
                  { icon: 'business', label: 'My Listings', color: Colors.accent, bg: '#EFF6FF', route: '/(realtor)/listings' },
                  { icon: 'pricetags', label: 'Pricing', color: '#0D9488', bg: '#CCFBF1', route: '/(realtor)/listings' },
                  { icon: 'people-circle', label: 'Leads', color: Colors.success, bg: Colors.successLight, route: '/(realtor)/leads' },
                  { icon: 'card', label: 'Earnings', color: Colors.warning, bg: Colors.warningLight, route: '/(realtor)/payments' },
                  { icon: 'shield-checkmark', label: 'KYC', color: '#8B5CF6', bg: '#EDE9FE', route: '/(realtor)/profile/kyc' },
                  { icon: 'chatbubbles', label: 'Messages', color: '#EC4899', bg: '#FCE7F3', route: '/(realtor)/profile/notifications' },
                  { icon: 'swap-horizontal', label: 'Negotiate', color: '#EA580C', bg: '#FFF7ED', route: '/(realtor)/leads' },
                  { icon: 'help-circle', label: 'Help', color: Colors.textSecondary, bg: Colors.surface, route: '/(realtor)/profile/help' },
                ].map((a) => (
                  <TouchableOpacity key={a.label} style={styles.actionCard} onPress={() => router.push(a.route as any)} activeOpacity={0.7}>
                    <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
                      <Ionicons name={a.icon as any} size={22} color={a.color} />
                    </View>
                    <Text style={styles.actionLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Feed Placeholder */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <Card variant="outlined" padding="lg">
                <View style={styles.activityEmpty}>
                  <View style={styles.activityEmptyIcon}>
                    <Ionicons name="pulse-outline" size={28} color={Colors.textMuted} />
                  </View>
                  <Text style={styles.activityEmptyTitle}>Activity feed coming soon</Text>
                  <Text style={styles.activityEmptyDesc}>
                    Track property views, lead interactions, and client enquiries in real time.
                  </Text>
                </View>
              </Card>
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

  // Listing Performance
  performanceCard: { },
  performanceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  performanceItem: { alignItems: 'center', flex: 1 },
  performanceIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  performanceValue: { ...Typography.h3, color: Colors.textPrimary },
  performanceLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  // Referral Hub
  referralHubCard: { },
  referralCodeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  referralCodeBox: { flex: 1 },
  referralCodeLabel: { ...Typography.small, color: Colors.textMuted },
  referralCodeValue: { ...Typography.h4, color: Colors.primary, letterSpacing: 1, marginTop: 2 },
  referralActions: { flexDirection: 'row', gap: Spacing.sm },
  referralActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  referralStatsRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md },
  referralStatItem: { flex: 1, alignItems: 'center' },
  referralStatValue: { ...Typography.h4, color: Colors.textPrimary },
  referralStatLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  referralStatDivider: { width: 1, height: 28, backgroundColor: Colors.borderLight },

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  notifRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  notifUnread: { backgroundColor: 'rgba(30, 64, 175, 0.03)' },
  notifIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { ...Typography.bodyMedium, color: Colors.textSecondary },
  notifBody: { ...Typography.small, color: Colors.textMuted, marginTop: 1 },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },

  // Applications
  appRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginRight: Spacing.md },
  appIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  appProperty: { ...Typography.bodyMedium, color: Colors.textPrimary },
  appClient: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  appBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  appBadgeText: { ...Typography.small, fontWeight: '600' as const },

  // Section
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  seeAll: { ...Typography.captionMedium, color: Colors.primary },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { ...Typography.small, color: Colors.white, fontWeight: '700' as const, fontSize: 10 },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: { width: '30%', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm, ...Shadows.sm },
  actionIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography.small, color: Colors.textPrimary, textAlign: 'center', fontWeight: '600' as const },

  // Activity Feed
  activityEmpty: { alignItems: 'center', paddingVertical: Spacing.xl },
  activityEmptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  activityEmptyTitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  activityEmptyDesc: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', maxWidth: 240 },
});
