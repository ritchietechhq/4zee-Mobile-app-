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
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { Card } from '@/components/ui/Card';
import { dashboardService } from '@/services/notification.service';
import { DashboardStats } from '@/types';
import { formatCurrency, formatCompactNumber } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function RealtorDashboard() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await dashboardService.getRealtorDashboard();
      setStats(data);
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboard();
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
        {stats && (
          <View style={styles.statsGrid}>
            <AnalyticsCard
              title="Total Listings"
              value={String(stats.totalListings || 0)}
              icon="home-outline"
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="Active Listings"
              value={String(stats.activeListings || 0)}
              icon="checkmark-circle-outline"
              iconColor={Colors.success}
              iconBackground={Colors.successLight}
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="Total Leads"
              value={String(stats.totalLeads || 0)}
              icon="people-outline"
              iconColor={Colors.accent}
              iconBackground={Colors.primaryLight}
              style={styles.statCardHalf}
            />
            <AnalyticsCard
              title="Total Views"
              value={formatCompactNumber(stats.totalViews || 0)}
              icon="eye-outline"
              iconColor={Colors.warning}
              iconBackground={Colors.warningLight}
              style={styles.statCardHalf}
            />
          </View>
        )}

        {/* Revenue Card */}
        {stats?.revenue !== undefined && (
          <Card variant="elevated" padding="xl" style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Total Revenue</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(stats.revenue)}
            </Text>
            {stats.conversionRate !== undefined && (
              <View style={styles.conversionRow}>
                <Text style={styles.conversionLabel}>Conversion Rate</Text>
                <Text style={styles.conversionValue}>{stats.conversionRate}%</Text>
              </View>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push('/(realtor)/listings/create' as any)
              }
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Add Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(realtor)/leads')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.warningLight }]}>
                <Ionicons name="people-outline" size={24} color={Colors.warning} />
              </View>
              <Text style={styles.actionLabel}>View Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(realtor)/listings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
                <Ionicons name="list-outline" size={24} color={Colors.success} />
              </View>
              <Text style={styles.actionLabel}>My Listings</Text>
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
  conversionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  conversionLabel: {
    ...Typography.captionMedium,
    color: 'rgba(255,255,255,0.7)',
  },
  conversionValue: {
    ...Typography.bodySemiBold,
    color: Colors.white,
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
