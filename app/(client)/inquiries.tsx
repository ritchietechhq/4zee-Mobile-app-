// ============================================================
// My Property Inquiries Screen — Client
// Track and manage property applications
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import applicationService from '@/services/application.service';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Application, ApplicationStatus } from '@/types';

const STATUS_TABS: { label: string; value: ApplicationStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function InquiriesScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadApplications(true);
    }, [])
  );

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const loadApplications = async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setCursor(undefined);
    }

    try {
      const result = await applicationService.getMyApplications(
        reset ? undefined : cursor,
        20
      );
      
      if (reset) {
        setApplications(result.items);
      } else {
        setApplications((prev) => [...prev, ...result.items]);
      }

      setCursor(result.pagination?.nextCursor ?? undefined);
      setHasMore(result.pagination?.hasNext ?? false);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadApplications(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadApplications(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'ALL') return true;
    return app.status === activeTab;
  });

  const getStatusVariant = (status: ApplicationStatus): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderApplication = ({ item, index }: { item: Application; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20 * (index + 1), 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(client)/properties/${item.propertyId}` as any)}
      >
        <Card style={styles.applicationCard}>
          <View style={styles.cardHeader}>
            <View style={styles.propertyImageWrap}>
              {item.property?.images?.[0] ? (
                <Image
                  source={{ uri: item.property.images[0] }}
                  style={styles.propertyImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="home-outline" size={24} color={Colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.propertyInfo}>
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {item.property?.title ?? 'Property'}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.property?.location ?? 'Location not available'}
                </Text>
              </View>
              <Text style={styles.propertyPrice}>
                {formatCurrency(item.property?.price ?? 0)}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Badge
                label={item.status}
                variant={getStatusVariant(item.status)}
                size="sm"
              />
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
              </View>
            </View>

            <View style={styles.footerRight}>
              {item.status === 'APPROVED' && item.paymentStatus === 'UNPAID' && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => router.push(`/(client)/properties/${item.propertyId}` as any)}
                >
                  <Ionicons name="card-outline" size={16} color={Colors.white} />
                  <Text style={styles.payButtonText}>Pay Now</Text>
                </TouchableOpacity>
              )}
              {item.paymentStatus === 'PAID' && (
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.paidText}>Paid</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => router.push(`/(client)/properties/${item.propertyId}` as any)}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Realtor info */}
          {item.realtor && (
            <>
              <View style={styles.cardDivider} />
              <View style={styles.realtorRow}>
                <View style={styles.realtorAvatar}>
                  <Ionicons name="person" size={14} color={Colors.primary} />
                </View>
                <View style={styles.realtorInfo}>
                  <Text style={styles.realtorLabel}>Assigned Realtor</Text>
                  <Text style={styles.realtorName}>
                    {item.realtor.user.firstName} {item.realtor.user.lastName}
                  </Text>
                </View>
                <TouchableOpacity style={styles.contactRealtorBtn}>
                  <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3].map((i) => (
        <Card key={i} style={styles.applicationCard}>
          <View style={styles.cardHeader}>
            <Skeleton width={80} height={80} borderRadius={BorderRadius.lg} />
            <View style={styles.propertyInfo}>
              <Skeleton width="80%" height={16} />
              <Skeleton width="60%" height={12} style={{ marginTop: 8 }} />
              <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Property Inquiries</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Status Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.value && styles.tabActive]}
              onPress={() => setActiveTab(item.value)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.value && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
              {item.value !== 'ALL' && (
                <View
                  style={[
                    styles.tabCount,
                    activeTab === item.value && styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      activeTab === item.value && styles.tabCountTextActive,
                    ]}
                  >
                    {applications.filter((a) =>
                      item.value === 'ALL' ? true : a.status === item.value
                    ).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : filteredApplications.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No Inquiries Yet"
          description={
            activeTab === 'ALL'
              ? "You haven't applied for any properties yet. Start exploring and find your dream home!"
              : `No ${activeTab.toLowerCase()} applications found.`
          }
          actionLabel="Browse Properties"
          onAction={() => router.push('/(client)/search')}
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={filteredApplications}
          renderItem={renderApplication}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore && !isLoading ? (
              <ActivityIndicator
                color={Colors.primary}
                style={styles.loadingMore}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },

  tabsContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabsList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.white,
  },
  tabCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabCountText: {
    ...Typography.small,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabCountTextActive: {
    color: Colors.white,
  },

  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  applicationCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  propertyImageWrap: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  propertyTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
  propertyPrice: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
    marginTop: 4,
  },

  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  payButtonText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
    ...Typography.captionMedium,
    color: Colors.success,
  },
  viewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  realtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  realtorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  realtorInfo: {
    flex: 1,
  },
  realtorLabel: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  realtorName: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  contactRealtorBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  skeletonList: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  loadingMore: {
    paddingVertical: Spacing.xl,
  },
});
