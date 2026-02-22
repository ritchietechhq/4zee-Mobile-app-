// ============================================================
// Chat Screen — shows messages in a conversation
// Shared between client & realtor via component
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import type { Message } from '@/types';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

function formatMessageTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ChatScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { id: conversationId, name: participantName } = useLocalSearchParams<{ id: string; name?: string }>();
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!conversationId) return;
    try {
      const res = await messagingService.getMessages(
        conversationId,
        loadMore ? cursor : undefined,
        30,
      );
      const newItems = res.items;

      if (loadMore) {
        setMessages((prev) => [...prev, ...newItems]);
      } else {
        setMessages(newItems);
      }

      // The messages come newest-first in an inverted FlatList
      setCursor(res.pagination?.nextCursor ?? undefined);
      setHasMore(res.pagination?.hasNext ?? false);
    } catch (e) {
      if (__DEV__) console.warn('[Chat] fetch error', e);
    }
  }, [conversationId, cursor]);

  useEffect(() => {
    setIsLoading(true);
    fetchMessages(false).finally(() => setIsLoading(false));
    // Poll for new messages every 10 seconds
    const interval = setInterval(() => fetchMessages(false), 10_000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    setIsSending(true);
    setInputText('');

    // Optimistic local insert
    const optimistic: Message = {
      id: `_opt_${Date.now()}`,
      content: text,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      const sent = await messagingService.sendMessage(conversationId, { content: text });
      // Replace optimistic message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m)),
      );
    } catch (e) {
      // Revert on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInputText(text); // restore text
      if (__DEV__) console.warn('[Chat] send error', e);
    } finally {
      setIsSending(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchMessages(true);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMsg = messages[index + 1]; // inverted
    const showDateLabel =
      !prevMsg ||
      new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

    return (
      <>
        {showDateLabel && (
          <View style={styles.dateLabelWrap}>
            <Text style={styles.dateLabel}>{formatDateLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{participantName || 'Chat'}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="chatbubble-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyChatText}>No messages yet. Say hello!</Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              hasMore ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: Spacing.md }} />
              ) : null
            }
          />
        )}

        {/* ── Input Bar ── */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },

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
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { ...Typography.bodySemiBold, color: colors.textPrimary },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  messagesContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },

  dateLabelWrap: { alignItems: 'center', marginVertical: Spacing.md },
  dateLabel: {
    ...Typography.small, color: colors.textMuted,
    backgroundColor: colors.surface, paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },

  bubble: {
    maxWidth: '78%', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.xs,
  },
  bubbleMe: {
    alignSelf: 'flex-end', backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: colors.surface,
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.borderLight,
  },
  senderName: { ...Typography.small, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  bubbleTextMe: { color: colors.white },
  bubbleTextThem: { color: colors.textPrimary },
  bubbleTime: { ...Typography.small, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeThem: { color: colors.textMuted },

  emptyChat: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxxl,
    // inverted list, so we flip this
    transform: [{ scaleY: -1 }],
  },
  emptyChatText: { ...Typography.body, color: colors.textMuted, marginTop: Spacing.md },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  textInput: {
    flex: 1, ...Typography.body, color: colors.textPrimary,
    backgroundColor: colors.surface, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm,
    maxHeight: 120, borderWidth: 1, borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
