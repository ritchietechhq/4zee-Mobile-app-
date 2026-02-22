// ============================================================
// Conversations List — shared by client & realtor
// Shows all conversations with last message preview
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import type { Conversation } from '@/types';
import { Card } from '@/components/ui/Card';
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

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await messagingService.getConversations();
      setConversations(res);
    } catch (e) {
      if (__DEV__) console.warn('[Messages] fetch error', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchConversations().finally(() => setIsLoading(false));
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  }, [fetchConversations]);

  const openChat = (conversation: Conversation) => {
    const role = user?.role?.toLowerCase() === 'realtor' ? 'realtor' : 'client';
    if (role === 'realtor') {
      router.push({ pathname: '/(realtor)/messages/[id]' as any, params: { id: conversation.id, name: `${conversation.participant.firstName} ${conversation.participant.lastName}` } });
    } else {
      router.push({ pathname: '/(client)/messages/[id]' as any, params: { id: conversation.id, name: `${conversation.participant.firstName} ${conversation.participant.lastName}` } });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const name = `${item.participant.firstName} ${item.participant.lastName}`.trim() || 'Unknown';
    const initial = item.participant.firstName?.charAt(0)?.toUpperCase() || '?';
    const hasUnread = item.unreadCount > 0;
    const lastMsg = item.lastMessage?.content || 'No messages yet';
    const time = timeAgo(item.lastMessage?.createdAt || '');

    return (
      <TouchableOpacity
        style={[styles.conversationRow, hasUnread && styles.conversationUnread]}
        onPress={() => openChat(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, hasUnread && { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, hasUnread && { color: colors.white }]}>{initial}</Text>
        </View>
        <View style={styles.conversationBody}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, hasUnread && styles.conversationNameBold]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.conversationTime, hasUnread && { color: colors.primary }]}>{time}</Text>
          </View>
          {item.propertyTitle && (
            <Text style={styles.conversationProperty} numberOfLines={1}>
              Re: {item.propertyTitle}
            </Text>
          )}
          <Text style={[styles.conversationPreview, hasUnread && styles.conversationPreviewBold]} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>
        {hasUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
            <Skeleton key={i} width="100%" height={72} style={{ marginBottom: Spacing.sm, borderRadius: BorderRadius.lg }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="No Messages"
            description="Your conversations will appear here. Contact a realtor from a property listing to start chatting."
          />
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  listContent: { paddingBottom: Spacing.xxl },

  conversationRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  conversationUnread: { backgroundColor: colors.primaryLight + '30' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.bodySemiBold, color: colors.textSecondary },
  conversationBody: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conversationName: { ...Typography.body, color: colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  conversationNameBold: { ...Typography.bodySemiBold, color: colors.textPrimary },
  conversationTime: { ...Typography.small, color: colors.textMuted },
  conversationProperty: { ...Typography.small, color: colors.primary, marginTop: 1 },
  conversationPreview: { ...Typography.caption, color: colors.textMuted, marginTop: 2 },
  conversationPreviewBold: { color: colors.textSecondary, fontWeight: '600' },

  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginLeft: Spacing.sm,
  },
  unreadText: { ...Typography.small, color: colors.white, fontWeight: '700', fontSize: 11 },

  separator: { height: 1, backgroundColor: colors.borderLight, marginLeft: 76 },
});
