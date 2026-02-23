// ============================================================
// Chat Screen — shows messages in a conversation
// Polished UI with mark-as-read, typing indicator placeholder,
// and proper API integration per MOBILE_MESSAGING_API.md
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Vibration,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import type { Message, Conversation } from '@/types';
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
  const { id: conversationId, name: participantName, propertyTitle } = useLocalSearchParams<{ 
    id: string; 
    name?: string;
    propertyTitle?: string;
  }>();
  const user = useAuthStore((s) => s.user);
  const isRealtor = user?.role?.toLowerCase() === 'realtor';

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Animation for new message
  const sendAnim = useRef(new Animated.Value(0)).current;

  // Set current user ID for proper participant detection
  useEffect(() => {
    if (user?.id) {
      messagingService.setCurrentUserId(user.id);
    }
  }, [user?.id]);

  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!conversationId) return;
    try {
      if (!loadMore) {
        // Get full conversation with messages on first load
        const data = isRealtor
          ? await messagingService.getRealtorConversation(conversationId)
          : await messagingService.getConversation(conversationId);
        
        setConversation(data.conversation);
        setMessages(data.messages.reverse()); // Reverse for inverted FlatList
        
        // Mark conversation as read
        messagingService.markAsRead(conversationId).catch(() => {});
      } else {
        // Paginated load more
        const res = await messagingService.getMessages(conversationId, cursor, 30);
        setMessages((prev) => [...prev, ...res.items]);
        setCursor(res.pagination?.nextCursor ?? undefined);
        setHasMore(res.pagination?.hasNext ?? false);
      }
    } catch (e) {
      if (__DEV__) console.warn('[Chat] fetch error', e);
    }
  }, [conversationId, cursor, isRealtor]);

  useEffect(() => {
    setIsLoading(true);
    fetchMessages(false).finally(() => setIsLoading(false));

    // Poll for new messages every 8 seconds
    const interval = setInterval(() => fetchMessages(false), 8_000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !conversationId) return;

    setIsSending(true);
    setInputText('');

    // Haptic feedback
    Vibration.vibrate(10);

    // Optimistic local insert
    const optimistic: Message = {
      id: `_opt_${Date.now()}`,
      content: text,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
      type: 'RESPONSE',
      isRead: false,
    };
    setMessages((prev) => [optimistic, ...prev]);

    // Animate send
    Animated.sequence([
      Animated.timing(sendAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(sendAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      // Use role-specific endpoint for realtor
      const sent = isRealtor
        ? await messagingService.realtorReply(conversationId, { content: text, type: 'RESPONSE' })
        : await messagingService.sendMessage(conversationId, { content: text, type: 'RESPONSE' });
      
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

    // Show read indicator for last message sent by me
    const showRead = isMe && index === 0 && item.isRead;

    return (
      <>
        {showDateLabel && (
          <View style={styles.dateLabelWrap}>
            <Text style={styles.dateLabel}>{formatDateLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {/* Message type indicator for inquiries */}
          {item.type === 'INQUIRY' && !isMe && (
            <View style={styles.inquiryTag}>
              <Ionicons name="mail-outline" size={10} color={colors.primary} />
              <Text style={styles.inquiryTagText}>Initial Inquiry</Text>
            </View>
          )}
          
          {!isMe && item.senderName && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {item.content}
          </Text>
          
          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMe && (
              <Ionicons 
                name={showRead ? 'checkmark-done' : 'checkmark'} 
                size={14} 
                color={showRead ? colors.success : 'rgba(255,255,255,0.5)'} 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </>
    );
  };

  // Get display info
  const displayName = participantName || conversation?.participant?.firstName || 'Chat';
  const displayProperty = propertyTitle || conversation?.propertyTitle;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{displayName}</Text>
            {displayProperty && (
              <Text style={styles.headerProperty} numberOfLines={1}>
                <Ionicons name="home-outline" size={10} color={colors.primary} /> {displayProperty}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
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
            <Text style={styles.loadingText}>Loading messages...</Text>
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
                <View style={styles.emptyChatIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.primary} />
                </View>
                <Text style={styles.emptyChatTitle}>Start the Conversation</Text>
                <Text style={styles.emptyChatText}>
                  {isRealtor 
                    ? "Respond to the client's inquiry below."
                    : "Send a message to get started!"}
                </Text>
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
          <TouchableOpacity style={styles.attachBtn}>
            <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
          </TouchableOpacity>
          
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
            />
          </View>
          
          <Animated.View style={{ transform: [{ scale: sendAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) }] }}>
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
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  headerCenter: { 
    flex: 1, flexDirection: 'row', alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { ...Typography.bodySemiBold, color: colors.primary },
  headerInfo: { marginLeft: Spacing.sm, flex: 1 },
  headerName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  headerProperty: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  moreBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...Typography.body, color: colors.textMuted, marginTop: Spacing.md },

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
  inquiryTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
    alignSelf: 'flex-start', marginBottom: 6,
  },
  inquiryTagText: { ...Typography.small, color: colors.primary, fontWeight: '600', marginLeft: 4, fontSize: 10 },
  senderName: { ...Typography.small, color: colors.primary, fontWeight: '600', marginBottom: 2 },
  bubbleText: { ...Typography.body, lineHeight: 22 },
  bubbleTextMe: { color: colors.white },
  bubbleTextThem: { color: colors.textPrimary },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  bubbleTime: { ...Typography.small },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  bubbleTimeThem: { color: colors.textMuted },

  emptyChat: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxxl,
    transform: [{ scaleY: -1 }], // inverted list
  },
  emptyChatIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyChatTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.xs },
  emptyChatText: { ...Typography.body, color: colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xxl },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  attachBtn: {
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  inputWrap: { flex: 1 },
  textInput: {
    ...Typography.body, color: colors.textPrimary,
    backgroundColor: colors.surface, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm,
    maxHeight: 120, borderWidth: 1, borderColor: colors.borderLight,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  sendBtnDisabled: { backgroundColor: colors.primary + '60' },
});
