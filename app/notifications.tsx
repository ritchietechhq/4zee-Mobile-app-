import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { Notification } from '@/types';

const ICON_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  APPLICATION: { icon: 'document-text-outline', color: '#6366F1', bg: '#EEF2FF' },
  PAYMENT: { icon: 'card-outline', color: '#16A34A', bg: '#DCFCE7' },
  PROPERTY: { icon: 'home-outline', color: Colors.primary, bg: Colors.primaryLight },
  SYSTEM: { icon: 'information-circle-outline', color: '#F59E0B', bg: '#FEF3C7' },
  PROMOTION: { icon: 'megaphone-outline', color: '#EC4899', bg: '#FCE7F3' },
};

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handlePress = (notification: Notification) => {
    if (!notification.isRead) markAsRead(notification.id);
  };

  const renderItem = ({ item, index }: { item: Notification; index: number }) => {
    const config = ICON_MAP[item.type] || { icon: 'notifications-outline' as const, color: Colors.textMuted, bg: Colors.surface };
    return (
      <TouchableOpacity style={[styles.notifItem, !item.isRead && styles.notifUnread]} onPress={() => handlePress(item)} activeOpacity={0.6}>
        <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifTitleRow}>
            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notifTime}>{getTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{unreadCount}</Text></View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllAsRead} activeOpacity={0.7}>
            <Ionicons name="checkmark-done-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loaderWrap}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState icon="notifications-off-outline" title="No notifications" description="You're all caught up! Notifications will appear here when something happens." />
          }
          ListFooterComponent={<View style={{ height: Spacing.xxxxl }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  headerBadge: { backgroundColor: Colors.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, minWidth: 24, alignItems: 'center' },
  headerBadgeText: { ...Typography.small, color: Colors.white, fontWeight: '700', fontSize: 11 },
  markAllBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingTop: Spacing.xs },

  notifItem: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  notifUnread: { backgroundColor: Colors.primaryLight + '25' },
  notifIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  notifTitle: { ...Typography.bodyMedium, color: Colors.textPrimary, flex: 1 },
  notifTitleUnread: { fontWeight: '700' },
  notifMessage: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.xs },
  notifTime: { ...Typography.small, color: Colors.textMuted },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: Spacing.sm },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.xl + 48 + Spacing.md },
});

