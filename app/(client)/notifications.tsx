// ============================================================
// Notifications Screen — Client
// View, manage, and interact with notifications
// ============================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import notificationService from '@/services/notification.service';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Notification } from '@/types';

type NotificationIcon = keyof typeof Ionicons.glyphMap;

const getNotificationIcon = (type: string): { icon: NotificationIcon; color: string; bgColor: string } => {
  const icons: Record<string, { icon: NotificationIcon; color: string; bgColor: string }> = {
    APPLICATION_APPROVED: { icon: 'checkmark-circle', color: '#16A34A', bgColor: '#DCFCE7' },
    APPLICATION_REJECTED: { icon: 'close-circle', color: '#DC2626', bgColor: '#FEE2E2' },
    APPLICATION_PENDING: { icon: 'time', color: '#F59E0B', bgColor: '#FEF3C7' },
    PAYMENT_SUCCESS: { icon: 'card', color: '#16A34A', bgColor: '#DCFCE7' },
    PAYMENT_FAILED: { icon: 'card', color: '#DC2626', bgColor: '#FEE2E2' },
    NEW_PROPERTY: { icon: 'home', color: '#6366F1', bgColor: '#EEF2FF' },
    PROPERTY_UPDATE: { icon: 'home', color: '#6366F1', bgColor: '#EEF2FF' },
    MESSAGE: { icon: 'chatbubble', color: '#0EA5E9', bgColor: '#E0F2FE' },
    PROMOTION: { icon: 'gift', color: '#EC4899', bgColor: '#FCE7F3' },
    SYSTEM: { icon: 'information-circle', color: '#64748B', bgColor: '#F1F5F9' },
  };
  return icons[type] || icons.SYSTEM;
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadNotifications(true);
      loadUnreadCount();
    }, [showUnreadOnly])
  );

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const loadNotifications = async (reset = false) => {
    if (reset) {
      setIsLoading(true);
      setCursor(undefined);
    }

    try {
      const result = await notificationService.getNotifications(
        showUnreadOnly,
        reset ? undefined : cursor,
        20
      );

      if (reset) {
        setNotifications(result.notifications);
      } else {
        setNotifications((prev) => [...prev, ...result.notifications]);
      }

      // Handle pagination - assuming nextCursor is in response
      setHasMore(result.notifications.length === 20);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(true);
    loadUnreadCount();
  };

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All',
          onPress: async () => {
            try {
              await notificationService.markAllAsRead();
              setNotifications((prev) =>
                prev.map((n) => ({ ...n, isRead: true }))
              );
              setUnreadCount(0);
            } catch (error) {
              Alert.alert('Error', 'Failed to mark all as read');
            }
          },
        },
      ]
    );
  };

  const handleDeleteNotification = async (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(notification.id);
              setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
              if (!notification.isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    handleMarkAsRead(notification);

    // Navigate based on notification type
    if (notification.data) {
      const data = notification.data as Record<string, string>;
      if (data.applicationId) {
        router.push(`/(client)/inquiries` as any);
      } else if (data.propertyId) {
        router.push(`/(client)/properties/${data.propertyId}` as any);
      } else if (data.paymentId) {
        router.push('/(client)/payments' as any);
      }
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item, index }: { item: Notification; index: number }) => {
    const iconConfig = getNotificationIcon(item.type);

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            {
              translateX: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(item)}
          onLongPress={() => handleDeleteNotification(item)}
        >
          <View style={[styles.notificationItem, !item.isRead && styles.notificationUnread]}>
            <View style={[styles.iconContainer, { backgroundColor: iconConfig.bgColor }]}>
              <Ionicons name={iconConfig.icon} size={20} color={iconConfig.color} />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
            </View>
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => handleDeleteNotification(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonList}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, marginLeft: Spacing.md }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="90%" height={12} style={{ marginTop: 8 }} />
            <Skeleton width="30%" height={10} style={{ marginTop: 8 }} />
          </View>
        </View>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <Ionicons
            name="checkmark-done"
            size={22}
            color={unreadCount > 0 ? Colors.primary : Colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, !showUnreadOnly && styles.filterTabActive]}
          onPress={() => setShowUnreadOnly(false)}
        >
          <Text style={[styles.filterTabText, !showUnreadOnly && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, showUnreadOnly && styles.filterTabActive]}
          onPress={() => setShowUnreadOnly(true)}
        >
          <Text style={[styles.filterTabText, showUnreadOnly && styles.filterTabTextActive]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.filterBadge, showUnreadOnly && styles.filterBadgeActive]}>
              <Text style={[styles.filterBadgeText, showUnreadOnly && styles.filterBadgeTextActive]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        renderSkeleton()
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-off-outline"
          title="No Notifications"
          description={
            showUnreadOnly
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet. We'll notify you about property updates and applications."
          }
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
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
          onEndReached={() => hasMore && !isLoading && loadNotifications(false)}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  headerBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: '700',
  },
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    ...Typography.small,
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 10,
  },
  filterBadgeTextActive: {
    color: Colors.white,
  },

  listContent: {
    paddingVertical: Spacing.md,
  },

  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  notificationUnread: {
    backgroundColor: Colors.primaryLight + '30',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  notificationTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 6,
  },
  moreBtn: {
    padding: Spacing.xs,
  },

  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 80,
  },

  skeletonList: {
    paddingVertical: Spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
});
