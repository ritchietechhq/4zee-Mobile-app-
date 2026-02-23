import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Animated, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import { realtorService } from '@/services/realtor.service';
import { notificationService } from '@/services/notification.service';
import { messagingService } from '@/services/messaging.service';
import type {
  RealtorDashboardApplication, ListingStats, Notification,
  ActivityFeedItem, GoalsResponse, ScheduleItem,
  ListingAnalyticsSummary,
} from '@/types';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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

const formatTimeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
};

const formatScheduleTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { realtorData, isLoading, fetchRealtorDashboard } = useDashboard();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [listingStats, setListingStats] = useState<ListingStats | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [goals, setGoals] = useState<GoalsResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [scheduleSummary, setScheduleSummary] = useState({ pendingApplications: 0, unreadInquiries: 0 });
  const [analyticsSummary, setAnalyticsSummary] = useState<ListingAnalyticsSummary | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const APP_STATUS_COLOR = useMemo((): Record<string, { bg: string; text: string; label: string }> => ({
    PENDING: { bg: colors.warningLight, text: colors.warning, label: 'Pending' },
    APPROVED: { bg: colors.successLight, text: colors.success, label: 'Approved' },
    REJECTED: { bg: colors.errorLight, text: colors.error, label: 'Rejected' },
    CANCELLED: { bg: colors.surface, text: colors.textMuted, label: 'Cancelled' },
  }), [colors]);

  const ACTIVITY_ICON = useMemo((): Record<string, { icon: string; color: string; bg: string }> => ({
    VIEW: { icon: 'eye-outline', color: colors.accent, bg: colors.skyLight },
    FAVORITE: { icon: 'heart-outline', color: colors.error, bg: colors.errorLight },
    INQUIRY: { icon: 'chatbox-ellipses-outline', color: colors.success, bg: colors.successLight },
    SALE: { icon: 'checkmark-circle-outline', color: colors.teal, bg: colors.successLight },
    APPLICATION: { icon: 'document-text-outline', color: colors.primary, bg: colors.primaryLight },
    COMMISSION: { icon: 'cash-outline', color: colors.warning, bg: colors.warningLight },
  }), [colors]);

  const loadExtras = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        realtorService.getListingStats(),
        notificationService.getNotifications(false, undefined, 3),
        notificationService.getUnreadCount(),
        realtorService.getActivityFeed(5),
        realtorService.getGoals(),
        realtorService.getSchedule(),
        realtorService.getListingAnalytics(),
        messagingService.getUnreadCount(),
      ]);
      if (results[0].status === 'fulfilled') setListingStats(results[0].value);
      if (results[1].status === 'fulfilled') setRecentNotifications(results[1].value.notifications);
      if (results[2].status === 'fulfilled') setUnreadCount(results[2].value);
      if (results[3].status === 'fulfilled') setActivityFeed(results[3].value.items);
      if (results[4].status === 'fulfilled') setGoals(results[4].value);
      if (results[5].status === 'fulfilled') {
        const sched = results[5].value;
        setSchedule(sched.items.slice(0, 3));
        setScheduleSummary({ pendingApplications: sched.pendingApplications, unreadInquiries: sched.unreadInquiries });
      }
      if (results[6].status === 'fulfilled') setAnalyticsSummary(results[6].value.summary);
      if (results[7].status === 'fulfilled') setUnreadMessages(results[7].value);
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

  const handleCopyReferralCode = async () => {
    const code = profile?.referralCode;
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const kycBanner = () => {
    if (!profile || kycStatus === 'APPROVED') return null;
    const config: Record<string, { bg: string; icon: string; title: string; sub: string; cta: string }> = {
      NOT_SUBMITTED: { bg: colors.warningLight, icon: 'shield-outline', title: 'Complete Verification', sub: 'Verify your identity to unlock full access', cta: 'Start KYC' },
      PENDING: { bg: colors.primaryLight, icon: 'time-outline', title: 'Verification Pending', sub: 'We are reviewing your documents', cta: 'View Status' },
      REJECTED: { bg: colors.errorLight, icon: 'alert-circle-outline', title: 'Verification Rejected', sub: profile.kycRejectedReason || 'Please resubmit your documents', cta: 'Resubmit' },
    };
    const c = config[kycStatus] || config.NOT_SUBMITTED;
    return (
      <TouchableOpacity
        style={[styles.kycBanner, { backgroundColor: c.bg }]}
        onPress={() => router.push('/(realtor)/profile/kyc' as any)}
        activeOpacity={0.8}
      >
        <Ionicons name={c.icon as any} size={22} color={kycStatus === 'REJECTED' ? colors.error : colors.primary} />
        <View style={styles.kycBannerContent}>
          <Text style={styles.kycBannerTitle}>{c.title}</Text>
          <Text style={styles.kycBannerSub} numberOfLines={2}>{c.sub}</Text>
        </View>
        <View style={styles.kycBannerCta}>
          <Text style={styles.kycBannerCtaText}>{c.cta}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
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
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} contentFit="cover" />
            ) : (
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.firstName ?? user?.firstName)?.charAt(0)}{(profile?.lastName ?? user?.lastName)?.charAt(0)}
                </Text>
              </LinearGradient>
            )}
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{profile?.firstName ?? user?.firstName ?? 'Realtor'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Messages icon */}
            <TouchableOpacity
              onPress={() => router.push('/(realtor)/messages' as any)}
              style={styles.notifBtn}
              accessibilityLabel="Messages"
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.textPrimary} />
              {unreadMessages > 0 && (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Notifications icon */}
            <TouchableOpacity
              onPress={() => router.push('/(realtor)/(tabs)/profile/notifications' as any)}
              style={styles.notifBtn}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
              {(unreadCount || realtorData?.alerts?.unreadNotifications || 0) > 0 && (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>
                    {(unreadCount || realtorData?.alerts?.unreadNotifications || 0) > 9 ? '9+' : (unreadCount || realtorData?.alerts?.unreadNotifications || 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* KYC Banner */}
        {kycBanner()}

        {isLoading && !realtorData ? renderSkeleton() : realtorData && (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <AnalyticsCard title="Total Sales" value={String(realtorData.sales.total)} icon="receipt-outline" style={styles.statHalf} />
              <AnalyticsCard title="Balance" value={formatCurrency(realtorData.earnings.availableBalance)} icon="wallet-outline" iconColor={colors.success} iconBackground={colors.successLight} style={styles.statHalf} />
              <AnalyticsCard title="Conversions" value={String(realtorData.referrals.totalConversions)} icon="people-outline" iconColor={colors.accent} iconBackground={colors.primaryLight} style={styles.statHalf} />
              <AnalyticsCard title="Commissions" value={String(realtorData.earnings.commissionCount)} icon="cash-outline" iconColor={colors.warning} iconBackground={colors.warningLight} style={styles.statHalf} />
            </View>

            {/* Earnings Card */}
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.revenueCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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
            {(listingStats || analyticsSummary) && (
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
                      <View style={[styles.performanceIcon, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="business-outline" size={18} color={colors.primary} />
                      </View>
                      <Text style={styles.performanceValue}>{analyticsSummary?.totalListings ?? listingStats?.total ?? 0}</Text>
                      <Text style={styles.performanceLabel}>Listings</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: colors.warningLight }]}>
                        <Ionicons name="eye-outline" size={18} color={colors.warning} />
                      </View>
                      <Text style={styles.performanceValue}>{analyticsSummary?.totalViews ?? listingStats?.totalViews ?? 0}</Text>
                      <Text style={styles.performanceLabel}>Views</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: colors.errorLight }]}>
                        <Ionicons name="heart-outline" size={18} color={colors.error} />
                      </View>
                      <Text style={styles.performanceValue}>{analyticsSummary?.totalFavorites ?? 0}</Text>
                      <Text style={styles.performanceLabel}>Favorites</Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <View style={[styles.performanceIcon, { backgroundColor: colors.successLight }]}>
                        <Ionicons name="chatbox-ellipses-outline" size={18} color={colors.success} />
                      </View>
                      <Text style={styles.performanceValue}>{analyticsSummary?.totalEnquiries ?? 0}</Text>
                      <Text style={styles.performanceLabel}>Enquiries</Text>
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
                        <Ionicons name="copy-outline" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.referralActionBtn, { backgroundColor: colors.primary }]} onPress={handleShareReferral} activeOpacity={0.7}>
                        <Ionicons name="share-social-outline" size={18} color={colors.white} />
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

            {/* Goals Tracker */}
            {goals && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sales Goals</Text>
                <Card variant="outlined" padding="md">
                  {(['monthly', 'quarterly', 'yearly'] as const).map((period) => {
                    const g = goals[period];
                    const pct = Math.min(g.progress, 100);
                    const periodLabel = period === 'monthly'
                      ? goals.period.currentMonth
                      : period === 'quarterly'
                        ? goals.period.currentQuarter
                        : goals.period.currentYear;
                    return (
                      <View key={period} style={[styles.goalRow, period !== 'yearly' && styles.goalRowBorder]}>
                        <View style={styles.goalHeader}>
                          <Text style={styles.goalPeriod}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
                          <Text style={styles.goalPeriodSub}>{periodLabel}</Text>
                        </View>
                        <View style={styles.goalBarBg}>
                          <View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? colors.success : pct >= 50 ? colors.primary : colors.warning }]} />
                        </View>
                        <View style={styles.goalStats}>
                          <Text style={styles.goalAchieved}>{g.achieved}/{g.target} sales</Text>
                          <Text style={[styles.goalPct, { color: pct >= 100 ? colors.success : colors.primary }]}>{pct}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              </View>
            )}

            {/* Schedule / Upcoming */}
            {(schedule.length > 0 || scheduleSummary.pendingApplications > 0 || scheduleSummary.unreadInquiries > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Upcoming</Text>
                  {(scheduleSummary.pendingApplications + scheduleSummary.unreadInquiries) > 0 && (
                    <View style={styles.scheduleBadges}>
                      {scheduleSummary.pendingApplications > 0 && (
                        <View style={[styles.schedBadge, { backgroundColor: colors.warningLight }]}>
                          <Text style={[styles.schedBadgeText, { color: colors.warning }]}>{scheduleSummary.pendingApplications} pending</Text>
                        </View>
                      )}
                      {scheduleSummary.unreadInquiries > 0 && (
                        <View style={[styles.schedBadge, { backgroundColor: colors.primaryLight }]}>
                          <Text style={[styles.schedBadgeText, { color: colors.primary }]}>{scheduleSummary.unreadInquiries} inquiries</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {schedule.length > 0 ? (
                  <Card variant="outlined" padding="sm">
                    {schedule.map((item, idx) => {
                      const priorityColor = item.priority === 'HIGH' ? colors.error : item.priority === 'MEDIUM' ? colors.warning : colors.textMuted;
                      return (
                        <View key={item.id} style={[styles.schedRow, idx < schedule.length - 1 && styles.schedRowBorder]}>
                          <View style={[styles.schedDot, { backgroundColor: priorityColor }]} />
                          <View style={styles.schedContent}>
                            <Text style={styles.schedTitle} numberOfLines={1}>{item.title}</Text>
                            <Text style={styles.schedDesc} numberOfLines={1}>{item.description}</Text>
                            {item.client && <Text style={styles.schedMeta}>{item.client}{item.property ? ` · ${item.property}` : ''}</Text>}
                          </View>
                          <View style={styles.schedTime}>
                            <Text style={styles.schedTimeText}>{formatScheduleTime(item.scheduledAt)}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                ) : (
                  <Card variant="outlined" padding="lg">
                    <View style={styles.emptyMini}>
                      <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
                      <Text style={styles.emptyMiniText}>No upcoming items</Text>
                    </View>
                  </Card>
                )}
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
                      <View style={[styles.notifIcon, !notif.isRead && { backgroundColor: colors.primaryLight }]}>
                        <Ionicons
                          name={getNotifIcon(notif.type)}
                          size={16}
                          color={!notif.isRead ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <View style={styles.notifContent}>
                        <Text style={[styles.notifTitle, !notif.isRead && { color: colors.textPrimary, fontWeight: '600' }]} numberOfLines={1}>
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
                            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
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
                  { icon: 'add-circle', label: 'Add Property', color: colors.primary, bg: colors.primaryLight, route: '/(realtor)/add-listing' },
                  { icon: 'business', label: 'My Listings', color: colors.accent, bg: colors.skyLight, route: '/(realtor)/listings' },
                  { icon: 'pricetags', label: 'Pricing', color: colors.teal, bg: colors.tealLight, route: '/(realtor)/listings' },
                  { icon: 'people-circle', label: 'Leads', color: colors.success, bg: colors.successLight, route: '/(realtor)/leads' },
                  { icon: 'card', label: 'Earnings', color: colors.warning, bg: colors.warningLight, route: '/(realtor)/payments' },
                  { icon: 'shield-checkmark', label: 'KYC', color: colors.purple, bg: colors.purpleLight, route: '/(realtor)/profile/kyc' },
                  { icon: 'chatbubbles', label: 'Messages', color: colors.pink, bg: colors.pinkLight, route: '/(realtor)/messages' },
                  { icon: 'swap-horizontal', label: 'Negotiate', color: colors.orange, bg: colors.orangeLight, route: '/(realtor)/leads' },
                  { icon: 'help-circle', label: 'Help', color: colors.textSecondary, bg: colors.surface, route: '/(realtor)/profile/help' },
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

            {/* Activity Feed */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activity</Text>
              </View>
              {activityFeed.length > 0 ? (
                <Card variant="outlined" padding="sm">
                  {activityFeed.map((item, idx) => {
                    const cfg = ACTIVITY_ICON[item.type] || ACTIVITY_ICON.VIEW;
                    return (
                      <View key={item.id} style={[styles.feedRow, idx < activityFeed.length - 1 && styles.feedRowBorder]}>
                        <View style={[styles.feedIcon, { backgroundColor: cfg.bg }]}>
                          <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                        </View>
                        <View style={styles.feedContent}>
                          <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.feedDesc} numberOfLines={1}>{item.description}</Text>
                          {item.propertyTitle && (
                            <Text style={styles.feedProp} numberOfLines={1}>{item.propertyTitle}</Text>
                          )}
                        </View>
                        <View style={styles.feedRight}>
                          {item.amount != null && item.amount > 0 && (
                            <Text style={styles.feedAmount}>{formatCurrency(item.amount)}</Text>
                          )}
                          <Text style={styles.feedTime}>{formatTimeAgo(item.createdAt)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </Card>
              ) : (
                <Card variant="outlined" padding="lg">
                  <View style={styles.emptyMini}>
                    <Ionicons name="pulse-outline" size={22} color={colors.textMuted} />
                    <Text style={styles.emptyMiniText}>No recent activity yet</Text>
                  </View>
                </Card>
              )}
            </View>
          </>
        )}

        <View style={{ height: Spacing.xxl }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as const },
  avatarText: { ...Typography.bodySemiBold, color: colors.white, fontSize: 13 },
  greeting: { ...Typography.caption, color: colors.textSecondary },
  name: { ...Typography.h4, color: colors.textPrimary },
  notifBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight, position: 'relative' as const },
  notifDot: { position: 'absolute' as const, top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifDotText: { ...Typography.small, color: colors.white, fontWeight: '700' as const, fontSize: 10 },
  kycBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: Spacing.lg, borderRadius: BorderRadius.lg, gap: Spacing.md },
  kycBannerContent: { flex: 1 },
  kycBannerTitle: { ...Typography.bodySemiBold, color: colors.textPrimary },
  kycBannerSub: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  kycBannerCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  kycBannerCtaText: { ...Typography.captionMedium, color: colors.primary },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.lg },
  statHalf: { width: '47%' },
  revenueCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  revLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  revValue: { ...Typography.h1, color: colors.white, marginTop: Spacing.xs },
  revDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.lg },
  revRow: { flexDirection: 'row', justifyContent: 'space-between' },
  revItem: { alignItems: 'center' },
  revItemVal: { ...Typography.bodySemiBold, color: colors.white },
  revItemLabel: { ...Typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Listing Performance
  performanceCard: { },
  performanceGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  performanceItem: { alignItems: 'center', flex: 1 },
  performanceIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  performanceValue: { ...Typography.h3, color: colors.textPrimary },
  performanceLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

  // Referral Hub
  referralHubCard: { },
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

  // Notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  notifRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  notifUnread: { backgroundColor: 'rgba(30, 64, 175, 0.03)' },
  notifIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  notifContent: { flex: 1 },
  notifTitle: { ...Typography.bodyMedium, color: colors.textSecondary },
  notifBody: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  notifUnreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },

  // Applications
  appRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  appLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, marginRight: Spacing.md },
  appIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  appProperty: { ...Typography.bodyMedium, color: colors.textPrimary },
  appClient: { ...Typography.caption, color: colors.textMuted, marginTop: 1 },
  appBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.full },
  appBadgeText: { ...Typography.small, fontWeight: '600' as const },

  // Section
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.md },
  seeAll: { ...Typography.captionMedium, color: colors.primary },
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { ...Typography.small, color: colors.white, fontWeight: '700' as const, fontSize: 10 },

  // Quick Actions
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: { width: '30%', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.sm, borderWidth: 1, borderColor: colors.borderLight, gap: Spacing.sm, ...Shadows.sm },
  actionIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { ...Typography.small, color: colors.textPrimary, textAlign: 'center', fontWeight: '600' as const },

  // Goals Tracker
  goalRow: { paddingVertical: Spacing.md },
  goalRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: Spacing.xs },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  goalPeriod: { ...Typography.bodyMedium, color: colors.textPrimary },
  goalPeriodSub: { ...Typography.small, color: colors.textMuted },
  goalBarBg: { height: 6, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' as const, marginBottom: Spacing.xs },
  goalBarFill: { height: 6, borderRadius: 3 },
  goalStats: { flexDirection: 'row', justifyContent: 'space-between' },
  goalAchieved: { ...Typography.small, color: colors.textSecondary },
  goalPct: { ...Typography.captionMedium },

  // Schedule
  scheduleBadges: { flexDirection: 'row', gap: Spacing.xs },
  schedBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  schedBadgeText: { ...Typography.small, fontWeight: '600' as const },
  schedRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  schedRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  schedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  schedContent: { flex: 1 },
  schedTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
  schedDesc: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  schedMeta: { ...Typography.small, color: colors.textSecondary, marginTop: 2 },
  schedTime: { alignItems: 'flex-end' },
  schedTimeText: { ...Typography.small, color: colors.textMuted },

  // Activity Feed
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, gap: Spacing.md },
  feedRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  feedIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  feedContent: { flex: 1 },
  feedTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
  feedDesc: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  feedProp: { ...Typography.small, color: colors.accent, marginTop: 2 },
  feedRight: { alignItems: 'flex-end' },
  feedAmount: { ...Typography.captionMedium, color: colors.success },
  feedTime: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

  // Empty mini
  emptyMini: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  emptyMiniText: { ...Typography.body, color: colors.textMuted },
});
