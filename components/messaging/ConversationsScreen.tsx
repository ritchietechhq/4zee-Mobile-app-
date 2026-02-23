// ============================================================
// Conversations List — shared by client & realtor
// Shows all conversations with last message preview
// Polished UI with property info and online indicator
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import type { Conversation } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function ConversationsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isRealtor = user?.role?.toLowerCase() === 'realtor';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Set current user ID for proper participant detection
  useEffect(() => {
    if (user?.id) {
      messagingService.setCurrentUserId(user.id);
    }
  }, [user?.id]);

  const fetchConversations = useCallback(async () => {
    try {
      // Use role-specific endpoint
      const res = isRealtor
        ? await messagingService.getRealtorConversations()
        : await messagingService.getConversations();
      setConversations(res.conversations);
      setUnreadTotal(res.unreadTotal);
    } catch (e) {
      if (__DEV__) console.warn('[Messages] fetch error', e);
    }
  }, [isRealtor]);

  useEffect(() => {
    setIsLoading(true);
    fetchConversations().finally(() => setIsLoading(false));

    // Poll for new messages every 15 seconds
    const interval = setInterval(fetchConversations, 15_000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  }, [fetchConversations]);

  const openChat = (conversation: Conversation) => {
    const p = conversation.participant;
    const participantName =
      p?.name && p.name !== 'Unknown'
        ? p.name
        : `${p?.firstName ?? ''} ${p?.lastName ?? ''}`.trim() || 'Realtor';
    const route = isRealtor ? '/(realtor)/messages/[id]' : '/(client)/messages/[id]';
    
    router.push({
      pathname: route as any,
      params: {
        id: conversation.id,
        name: participantName,
        propertyTitle: conversation.propertyTitle || '',
        propertyId: conversation.propertyId || conversation.property?.id || '',
        propertyImage: conversation.property?.images?.[0] || '',
        propertyPrice: conversation.property?.price ? `${conversation.property.price}` : '',
        propertyLocation: conversation.property?.location || '',
      },
    });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const pName = item.participant?.name;
    const firstName = item.participant?.firstName ?? '';
    const lastName = item.participant?.lastName ?? '';
    const name =
      pName && pName !== 'Unknown'
        ? pName
        : `${firstName} ${lastName}`.trim() || item.propertyTitle?.replace('Inquiry: ', '') || 'Realtor';
    const initial = firstName?.charAt(0)?.toUpperCase() || name.charAt(0)?.toUpperCase() || '?';
    const hasUnread = item.unreadCount > 0;
    const lastMsg = item.lastMessage?.isVoiceNote
      ? '🎤 Voice message'
      : item.lastMessage?.content || 'No messages yet';
    const time = timeAgo(item.lastMessage?.createdAt || item.updatedAt || '');
    const propertyImage = item.property?.images?.[0];

    return (
      <TouchableOpacity
        style={[styles.conversationRow, hasUnread && styles.conversationUnread]}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        {/* Avatar or Property Image */}
        <View style={styles.avatarContainer}>
          {propertyImage ? (
            <Image source={{ uri: propertyImage }} style={styles.propertyThumb} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, hasUnread && { backgroundColor: colors.primary }]}>
              <Text style={[styles.avatarText, hasUnread && { color: colors.white }]}>{initial}</Text>
            </View>
          )}
          {/* Online indicator (mocked for now) */}
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.conversationBody}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.conversationNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.conversationTime, hasUnread && { color: colors.primary, fontWeight: '600' }]}>
              {time}
            </Text>
          </View>

          {/* Property title if available */}
          {item.propertyTitle && (
            <View style={styles.propertyRow}>
              <Ionicons name="home-outline" size={12} color={colors.primary} />
              <Text style={styles.conversationProperty} numberOfLines={1}>
                {item.propertyTitle}
              </Text>
            </View>
          )}

          {/* Last message preview */}
          <View style={styles.previewRow}>
            {item.lastMessage?.type === 'INQUIRY' && (
              <View style={styles.inquiryBadge}>
                <Text style={styles.inquiryBadgeText}>New</Text>
              </View>
            )}
            <Text 
              style={[styles.conversationPreview, hasUnread && styles.conversationPreviewBold]} 
              numberOfLines={1}
            >
              {lastMsg}
            </Text>
          </View>
        </View>

        {/* Unread badge */}
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    );
  };

  // ─── Loading State ───
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.content}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={52} height={52} style={{ borderRadius: 26 }} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Skeleton width="60%" height={16} style={{ borderRadius: 8, marginBottom: 8 }} />
                <Skeleton width="80%" height={12} style={{ borderRadius: 6 }} />
              </View>
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Messages</Text>
          {unreadTotal > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Conversations List ── */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No Messages Yet"
            description={
              isRealtor
                ? "You'll see inquiries from interested clients here."
                : "Contact a realtor from a property listing to start chatting."
            }
          />
        }
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  headerBadge: {
    backgroundColor: colors.error, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: 8,
  },
  headerBadgeText: { ...Typography.small, color: colors.white, fontWeight: '700', fontSize: 11 },
  
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  skeletonRow: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: Spacing.md, marginBottom: Spacing.sm 
  },
  
  listContent: { paddingBottom: Spacing.xxl },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },

  conversationRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  conversationUnread: { backgroundColor: colors.primaryLight + '15' },
  
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.bodySemiBold, color: colors.textSecondary, fontSize: 18 },
  propertyThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: colors.surface },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.success, borderWidth: 2, borderColor: colors.background,
  },

  conversationBody: { flex: 1, marginLeft: Spacing.md },
  conversationHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 2,
  },
  conversationName: { 
    ...Typography.body, color: colors.textPrimary, 
    flex: 1, marginRight: Spacing.sm,
  },
  conversationNameBold: { ...Typography.bodySemiBold },
  conversationTime: { ...Typography.small, color: colors.textMuted },
  
  propertyRow: { 
    flexDirection: 'row', alignItems: 'center', 
    marginBottom: 2, 
  },
  conversationProperty: { 
    ...Typography.small, color: colors.primary, 
    marginLeft: 4, flex: 1,
  },
  
  previewRow: { flexDirection: 'row', alignItems: 'center' },
  inquiryBadge: {
    backgroundColor: colors.warning + '30',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, marginRight: 6,
  },
  inquiryBadgeText: { 
    ...Typography.small, color: colors.warning, 
    fontWeight: '700', fontSize: 10, textTransform: 'uppercase',
  },
  conversationPreview: { ...Typography.caption, color: colors.textMuted, flex: 1 },
  conversationPreviewBold: { color: colors.textSecondary, fontWeight: '500' },

  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: Spacing.sm,
  },
  unreadText: { ...Typography.small, color: colors.white, fontWeight: '700', fontSize: 11 },

  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: 76 },
});
