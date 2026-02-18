import React, { useEffect, useCallback, useState } from 'react';
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
import { PropertyCard } from '@/components/property/PropertyCard';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function ClientDashboard() {
  const user = useAuthStore((s) => s.user);
  const { clientData, isLoading, fetchClientDashboard } = useDashboard();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchClientDashboard();
  }, [fetchClientDashboard]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchClientDashboard();
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
              Hello, {user?.firstName || 'there'} 👋
            </Text>
            <Text style={styles.greetingSubtitle}>Find your dream property</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Quick Search */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(client)/properties')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search properties, cities...</Text>
        </TouchableOpacity>

        {/* Stats Cards */}
        {clientData && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsRow}
          >
            <AnalyticsCard
              title="Applications"
              value={String(clientData.applications.total)}
              icon="document-text-outline"
              style={styles.statCard}
            />
            <AnalyticsCard
              title="Approved"
              value={String(clientData.applications.approved)}
              icon="checkmark-circle-outline"
              iconColor={Colors.success}
              iconBackground={Colors.successLight}
              style={styles.statCard}
            />
            <AnalyticsCard
              title="Purchases"
              value={formatCurrency(clientData.purchases.totalAmount)}
              icon="wallet-outline"
              iconColor={Colors.warning}
              iconBackground={Colors.warningLight}
              style={styles.statCard}
            />
          </ScrollView>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: 'grid-outline' as const, label: 'Browse', route: '/(client)/properties' },
              { icon: 'map-outline' as const, label: 'Map View', route: '/map' },
              { icon: 'document-text-outline' as const, label: 'Applications', route: '/(client)/applications' },
              { icon: 'card-outline' as const, label: 'Payments', route: '/(client)/payments' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color={Colors.primary} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Applications */}
        {clientData && clientData.recentApplications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Applications</Text>
              <TouchableOpacity onPress={() => router.push('/(client)/applications')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {clientData.recentApplications.slice(0, 3).map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.recentCard}
                onPress={() =>
                  router.push({
                    pathname: '/(client)/applications/[id]',
                    params: { id: app.id },
                  })
                }
              >
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>
                    {app.property.title}
                  </Text>
                  <Text style={styles.recentPrice}>
                    {formatCurrency(app.property.price)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.recentBadge,
                    {
                      backgroundColor:
                        app.status === 'APPROVED'
                          ? Colors.successLight
                          : app.status === 'REJECTED'
                            ? Colors.errorLight
                            : Colors.warningLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.recentBadgeText,
                      {
                        color:
                          app.status === 'APPROVED'
                            ? Colors.success
                            : app.status === 'REJECTED'
                              ? Colors.error
                              : Colors.warning,
                      },
                    ]}
                  >
                    {app.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Featured Properties */}
        {clientData && clientData.featuredProperties.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Properties</Text>
              <TouchableOpacity onPress={() => router.push('/(client)/properties')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {clientData.featuredProperties.slice(0, 3).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </View>
        )}

        {/* Empty state when no data */}
        {clientData &&
          clientData.recentApplications.length === 0 &&
          clientData.featuredProperties.length === 0 && (
            <Card variant="filled" padding="xxl" style={styles.emptyCard}>
              <View style={styles.emptyState}>
                <Ionicons name="home-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>
                  Start exploring properties and apply today!
                </Text>
              </View>
            </Card>
          )}
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
    paddingBottom: Spacing.md,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  statsRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  statCard: {
    width: 160,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  seeAll: {
    ...Typography.captionMedium,
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  recentTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  recentPrice: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  recentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentBadgeText: {
    ...Typography.small,
    fontWeight: '600',
  },
  emptyCard: {
    marginHorizontal: Spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
