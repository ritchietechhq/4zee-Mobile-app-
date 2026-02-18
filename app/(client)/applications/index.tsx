import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApplications } from '@/hooks/useApplications';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Application } from '@/types';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ApplicationsScreen() {
  const {
    applications,
    isLoading,
    hasMore,
    error,
    fetchApplications,
    loadMore,
  } = useApplications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning' as const;
      case 'APPROVED':
        return 'success' as const;
      case 'REJECTED':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  const getPaymentVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success' as const;
      case 'UNPAID':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const renderApplication = ({ item }: { item: Application }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/(client)/applications/[id]',
          params: { id: item.id },
        })
      }
      activeOpacity={0.7}
    >
      <Card variant="elevated" padding="lg" style={styles.applicationCard}>
        <View style={styles.applicationHeader}>
          <View style={styles.applicationInfo}>
            <Text style={styles.applicationTitle} numberOfLines={1}>
              {item.property?.title || 'Property Application'}
            </Text>
            <Text style={styles.applicationDate}>
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
        </View>

        <View style={styles.applicationDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(item.property?.price || 0)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Badge
              label={item.paymentStatus}
              variant={getPaymentVariant(item.paymentStatus)}
              size="sm"
            />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading && applications.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Applications</Text>
        <Text style={styles.countText}>{applications.length} total</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              Browse properties and apply to get started.
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  screenTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  countText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  applicationCard: {
    marginBottom: Spacing.md,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  applicationInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  applicationTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  applicationDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  applicationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  footer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});
