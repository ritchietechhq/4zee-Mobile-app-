import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatCompactNumber } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { realtorData, isLoading, fetchRealtorDashboard } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchRealtorDashboard();
  }, [fetchRealtorDashboard]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchRealtorDashboard();
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.firstName || 'Realtor'} 👋
            </Text>
            <Text style={styles.greetingSubtitle}>
              Here's your performance overview
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        {realtorData && (
          <View style={styles.statsGrid}>
            <AnalyticsCard
              title="Total Sales"
              value={String(realtorData.sales.total)}
              icon="receipt-outline"
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="This Month"
              value={String(realtorData.sales.thisMonth)}
              icon="trending-up-outline"
              iconColor={Colors.success}
              iconBackground={Colors.successLight}
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="Referrals"
              value={String(realtorData.referrals.total)}
              icon="people-outline"
              iconColor={Colors.accent}
              iconBackground={Colors.primaryLight}
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="Commissions"
              value={String(realtorData.commissions.total)}
              icon="cash-outline"
              iconColor={Colors.warning}
              iconBackground={Colors.warningLight}
              style={styles.statCardHalf}
            />
          </View>
        )}

        {/* Revenue Card */}
        {realtorData && (
          <Card variant="elevated" padding="xl" style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Sales Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(realtorData.sales.totalAmount)}
            </Text>
            <View style={styles.commissionRow}>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionLabel}>Pending</Text>
                <Text style={styles.commissionValue}>
                  {realtorData.commissions.pending}
                </Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionLabel}>Approved</Text>
                <Text style={styles.commissionValue}>
                  {realtorData.commissions.approved}
                </Text>
              </View>
              <View style={styles.commissionItem}>
                <Text style={styles.commissionLabel}>Paid</Text>
                <Text style={styles.commissionValue}>
                  {realtorData.commissions.paid}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Referral Earnings */}
        {realtorData && realtorData.referrals.earnings > 0 && (
          <Card variant="outlined" padding="lg" style={styles.referralCard}>
            <View style={styles.referralRow}>
              <Ionicons name="gift-outline" size={24} color={Colors.primary} />
              <View style={styles.referralInfo}>
                <Text style={styles.referralLabel}>Referral Earnings</Text>
                <Text style={styles.referralValue}>
                  {formatCurrency(realtorData.referrals.earnings)}
                </Text>
              </View>
              <Text style={styles.referralCount}>
                {realtorData.referrals.active} active
              </Text>
            </View>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(realtor)/listings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="list-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>My Listings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(realtor)/commissions')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="cash-outline" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionLabel}>Commissions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(realtor)/profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="link-outline" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionLabel}>Referrals</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  greeting: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  greetingSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCardHalf: {
    width: '47.5%',
  },
  revenueCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.primary,
  },
  revenueLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.xs,
  },
  revenueValue: {
    ...Typography.h1,
    color: Colors.white,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  commissionItem: {
    alignItems: 'center',
  },
  commissionLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.7)',
  },
  commissionValue: {
    ...Typography.bodySemiBold,
    color: Colors.white,
  },
  referralCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  referralInfo: {
    flex: 1,
  },
  referralLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  referralValue: {
    ...Typography.h4,
    color: Colors.primary,
  },
  referralCount: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
