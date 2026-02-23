// ============================================================
// Chat Screen — Full backend alignment
// ✓ Uses isMine flag from backend (no guessing senderId)
// ✓ Uses sender.name for display
// ✓ Real voice upload → POST /uploads/direct → send VOICE_NOTE
// ✓ Voice playback via expo-av Sound
// ✓ Property context card from conversation.property
// ✓ Smart optimistic sends with pending tracking
// ✓ otherParticipant name, email, phone for header
// ============================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated, Vibration, Alert,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { messagingService } from '@/services/messaging.service';
import { useAuthStore } from '@/store/auth.store';
import type { Message, Conversation } from '@/types';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import { formatCurrency } from '@/utils/formatCurrency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Robust name resolution: nav param → otherParticipant → subject → fallback
 */
function getParticipantDisplayName(
  nameParam: string | undefined,
  conversation: Conversation | null,
): string {
  if (nameParam && nameParam !== 'Unknown' && nameParam.trim() !== '') {
    return nameParam.trim();
  }
  const p = conversation?.participant;
  if (p) {
    // Prefer the `name` field from otherParticipant
    if (p.name && p.name !== 'Unknown') return p.name;
    const full = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
    if (full && full !== 'Unknown') return full;
  }
  if (conversation?.subject) {
    return conversation.subject.replace('Inquiry: ', '').substring(0, 30);
  }
  return 'Realtor';
}

// ─── Component ───────────────────────────────────────────────

export default function ChatScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const {
    id: conversationId,
    name: participantName,
    propertyTitle,
    propertyImage,
    propertyPrice,
    propertyLocation,
    propertyId,
  } = useLocalSearchParams<{
    id: string;
    name?: string;
    propertyTitle?: string;
    propertyImage?: string;
    propertyPrice?: string;
    propertyLocation?: string;
    propertyId?: string;
  }>();

  const user = useAuthStore((s) => s.user);
  const isRealtor = user?.role?.toLowerCase() === 'realtor';

  // ── State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Optimistic tracking
  const pendingOptimisticIds = useRef<Set<string>>(new Set());
  const isSendingRef = useRef(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);

  // Voice playback
  const [playingMsgId, setPlayingMsgId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Animations
  const sendAnim = useRef(new Animated.Value(0)).current;
  const voicePulse = useRef(new Animated.Value(1)).current;
  const inputBarAnim = useRef(new Animated.Value(0)).current;

  // ── Init ──
  useEffect(() => {
    if (user?.id) messagingService.setCurrentUserId(user.id);
  }, [user?.id]);

  // ── Fetch Messages (smart merge) ──
  const fetchMessages = useCallback(
    async (loadMore = false) => {
      if (!conversationId) return;
      try {
        if (!loadMore) {
          const data = isRealtor
            ? await messagingService.getRealtorConversation(conversationId)
            : await messagingService.getConversation(conversationId);

          setConversation(data.conversation);
          const serverMessages = data.messages.reverse();

          setMessages((prev) => {
            if (pendingOptimisticIds.current.size === 0) return serverMessages;
            const serverIds = new Set(serverMessages.map((m) => m.id));
            const pending = prev.filter(
              (m) => pendingOptimisticIds.current.has(m.id) && !serverIds.has(m.id),
            );
            return [...pending, ...serverMessages];
          });

          messagingService.markAsRead(conversationId).catch(() => {});
        } else {
          const res = await messagingService.getMessages(conversationId, cursor, 30);
          setMessages((prev) => [...prev, ...res.items]);
          setCursor(res.pagination?.nextCursor ?? undefined);
          setHasMore(res.pagination?.hasNext ?? false);
        }
      } catch (e) {
        if (__DEV__) console.warn('[Chat] fetch error', e);
      }
    },
    [conversationId, cursor, isRealtor],
  );

  useEffect(() => {
    setIsLoading(true);
    fetchMessages(false).finally(() => setIsLoading(false));

    const interval = setInterval(() => {
      if (!isSendingRef.current) fetchMessages(false);
    }, 6_000);

    return () => clearInterval(interval);
  }, [conversationId]);

  // ── Send Text Message ──
  const sendMessage = async (content?: string) => {
    const text = (content || inputText).trim();
    if (!text || !conversationId) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setInputText('');
    Vibration.vibrate(10);

    const optimisticId = `_opt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const optimistic: Message = {
      id: optimisticId,
      content: text,
      senderId: user?.id || '',
      isMine: true,
      createdAt: new Date().toISOString(),
      type: 'RESPONSE',
      isRead: false,
    };

    pendingOptimisticIds.current.add(optimisticId);
    setMessages((prev) => [optimistic, ...prev]);

    Animated.sequence([
      Animated.timing(sendAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(sendAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      const sent = isRealtor
        ? await messagingService.realtorReply(conversationId, { content: text, type: 'RESPONSE' })
        : await messagingService.sendMessage(conversationId, { content: text, type: 'RESPONSE' });

      pendingOptimisticIds.current.delete(optimisticId);
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? sent : m)));
    } catch (e) {
      pendingOptimisticIds.current.delete(optimisticId);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInputText(text);
      Alert.alert('Send Failed', 'Message could not be sent. Please try again.');
      if (__DEV__) console.warn('[Chat] send error', e);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  // ── Send Voice Note (real upload) ──
  const sendVoiceNote = async (uri: string, duration: number) => {
    if (!conversationId || !uri) return;
    if (isSendingRef.current) return;

    isSendingRef.current = true;
    setIsSending(true);
    setIsUploadingVoice(true);
    Vibration.vibrate(10);

    const optimisticId = `_opt_voice_${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      content: '',
      senderId: user?.id || '',
      isMine: true,
      createdAt: new Date().toISOString(),
      type: 'VOICE_NOTE',
      isVoiceNote: true,
      voiceDuration: duration,
      isRead: false,
    };

    pendingOptimisticIds.current.add(optimisticId);
    setMessages((prev) => [optimistic, ...prev]);

    try {
      // 1. Upload voice file
      const voiceNoteUrl = await messagingService.uploadVoiceNote(uri);

      // 2. Send message with voice note fields
      const payload = {
        content: '',
        type: 'VOICE_NOTE' as const,
        voiceNoteUrl,
        isVoiceNote: true,
        voiceDuration: duration,
      };

      const sent = isRealtor
        ? await messagingService.realtorReply(conversationId, payload)
        : await messagingService.sendMessage(conversationId, payload);

      pendingOptimisticIds.current.delete(optimisticId);
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? sent : m)));
    } catch (e) {
      pendingOptimisticIds.current.delete(optimisticId);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      Alert.alert('Send Failed', 'Voice note could not be sent. Please try again.');
      if (__DEV__) console.warn('[Chat] voice send error', e);
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      setIsUploadingVoice(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) fetchMessages(true);
  };

  // ── Voice Recording ──
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to send voice messages.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setShowVoiceUI(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(voicePulse, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(voicePulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } catch (e) {
      if (__DEV__) console.warn('[Voice] start error', e);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {}
    clearRecordingState();
  };

  const finishRecording = async () => {
    if (!recordingRef.current) return;
    const duration = recordingDuration;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      clearRecordingState();

      if (uri && duration >= 1) {
        // Upload + send as real VOICE_NOTE
        await sendVoiceNote(uri, duration);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (e) {
      if (__DEV__) console.warn('[Voice] finish error', e);
      clearRecordingState();
    }
  };

  const clearRecordingState = () => {
    setIsRecording(false);
    setShowVoiceUI(false);
    setRecordingDuration(0);
    voicePulse.setValue(1);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  // ── Voice Playback ──
  const playVoice = async (msg: Message) => {
    const url = msg.voiceNoteUrl;
    if (!url) return;

    try {
      // Stop any currently playing sound
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      if (playingMsgId === msg.id) {
        setPlayingMsgId(null);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: url });
      soundRef.current = sound;
      setPlayingMsgId(msg.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMsgId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });

      await sound.playAsync();
    } catch (e) {
      if (__DEV__) console.warn('[Voice] play error', e);
      setPlayingMsgId(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(() => {});
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  // Animate input bar
  useEffect(() => {
    if (!isLoading) {
      Animated.spring(inputBarAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }).start();
    }
  }, [isLoading]);

  // ── Render Message ──
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => {
      // Use isMine from backend when available, fallback to senderId check
      const isMe = item.isMine ?? item.senderId === user?.id;
      const isOptimistic = item.id.startsWith('_opt_');
      const prevMsg = messages[index + 1];
      const showDateLabel =
        !prevMsg ||
        new Date(item.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

      const showRead = isMe && index === 0 && item.isRead;
      const isVoice = item.isVoiceNote || item.type === 'VOICE_NOTE';
      const isPlaying = playingMsgId === item.id;

      // Sender display: use sender.name from backend
      const senderDisplay = item.sender?.name ?? item.senderName;

      return (
        <>
          {showDateLabel && (
            <View style={styles.dateLabelWrap}>
              <Text style={styles.dateLabel}>{formatDateLabel(item.createdAt)}</Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isMe ? styles.bubbleMe : styles.bubbleThem,
              isOptimistic && styles.bubbleOptimistic,
            ]}
          >
            {/* Inquiry tag */}
            {item.type === 'INQUIRY' && !isMe && (
              <View style={styles.inquiryTag}>
                <Ionicons name="mail-outline" size={10} color={colors.primary} />
                <Text style={styles.inquiryTagText}>Initial Inquiry</Text>
              </View>
            )}

            {/* Sender name (from backend sender.name) */}
            {!isMe && senderDisplay && (
              <Text style={styles.senderName}>{senderDisplay}</Text>
            )}

            {/* Voice note UI */}
            {isVoice ? (
              <TouchableOpacity
                style={styles.voiceMessageRow}
                onPress={() => playVoice(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.voicePlayBtn, isMe && styles.voicePlayBtnMe]}>
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={18}
                    color={isMe ? colors.primary : colors.white}
                  />
                </View>
                <View style={styles.voiceWaveform}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: 4 + Math.sin(i * 0.8) * 12 + Math.random() * 4,
                          backgroundColor: isMe ? 'rgba(255,255,255,0.6)' : colors.primary + '70',
                          opacity: isPlaying ? 1 : 0.7,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text
                  style={[
                    styles.voiceDurationLabel,
                    isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem,
                  ]}
                >
                  {formatDuration(item.voiceDuration ?? 0)}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.content}
              </Text>
            )}

            <View style={styles.bubbleFooter}>
              <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]}>
                {formatMessageTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons
                  name={
                    isOptimistic
                      ? 'time-outline'
                      : showRead
                        ? 'checkmark-done'
                        : 'checkmark'
                  }
                  size={14}
                  color={
                    isOptimistic
                      ? 'rgba(255,255,255,0.4)'
                      : showRead
                        ? colors.success
                        : 'rgba(255,255,255,0.5)'
                  }
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </>
      );
    },
    [messages, user?.id, colors, styles, playingMsgId],
  );

  // ── Property Context Card ──
  const propertyData = conversation?.property;
  const propTitle = propertyTitle || conversation?.propertyTitle || propertyData?.title;
  const propImage = propertyImage || propertyData?.images?.[0];
  const propPrice = propertyPrice || (propertyData?.price ? `${propertyData.price}` : undefined);
  const propLocation = propertyLocation || propertyData?.location;
  const propId = propertyId || conversation?.propertyId || propertyData?.id;

  const renderPropertyCard = () => {
    if (!propTitle) return null;
    return (
      <TouchableOpacity
        style={styles.propertyCard}
        activeOpacity={0.8}
        onPress={() => {
          if (propId) {
            const route = isRealtor
              ? `/(realtor)/properties/${propId}`
              : `/(client)/properties/${propId}`;
            router.push(route as any);
          }
        }}
      >
        {propImage ? (
          <Image source={{ uri: propImage }} style={styles.propertyCardImage} contentFit="cover" />
        ) : (
          <View style={[styles.propertyCardImage, styles.propertyCardImagePlaceholder]}>
            <Ionicons name="home-outline" size={20} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.propertyCardBody}>
          <Text style={styles.propertyCardTitle} numberOfLines={1}>
            {propTitle}
          </Text>
          {propLocation && (
            <View style={styles.propertyCardRow}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.propertyCardLocation} numberOfLines={1}>
                {propLocation}
              </Text>
            </View>
          )}
          {propPrice && Number(propPrice) > 0 && (
            <Text style={styles.propertyCardPrice}>{formatCurrency(Number(propPrice))}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  // ── Display Info ──
  const displayName = getParticipantDisplayName(participantName, conversation);
  const participant = conversation?.participant;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7}>
          <View style={styles.headerAvatar}>
            {participant?.profilePicture ? (
              <Image
                source={{ uri: participant.profilePicture }}
                style={styles.headerAvatarImg}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.headerAvatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            )}
            <View style={styles.headerOnline} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.headerRole} numberOfLines={1}>
              {participant?.role === 'REALTOR'
                ? 'Realtor'
                : participant?.role === 'CLIENT'
                  ? 'Client'
                  : isRealtor
                    ? 'Client'
                    : 'Realtor'}
              {propTitle ? ` • ${propTitle}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {participant?.phone && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => {
                const phone = participant?.phone;
                if (phone) {
                  const url = `tel:${phone}`;
                  import('react-native').then(({ Linking }) => Linking.openURL(url));
                }
              }}
            >
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Property Context ── */}
      {renderPropertyCard()}

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
                    : 'Send a message to get started!'}
                </Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              hasMore ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ paddingVertical: Spacing.md }}
                />
              ) : null
            }
          />
        )}

        {/* ── Voice Recording Overlay ── */}
        {showVoiceUI && (
          <View style={styles.voiceOverlay}>
            <TouchableOpacity onPress={cancelRecording} style={styles.voiceCancelBtn}>
              <Ionicons name="close-circle" size={36} color={colors.error} />
              <Text style={styles.voiceCancelText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.voiceCenter}>
              <Animated.View
                style={[
                  styles.voiceRecordingCircle,
                  { transform: [{ scale: voicePulse }] },
                ]}
              >
                <Ionicons name="mic" size={32} color={colors.white} />
              </Animated.View>
              <Text style={styles.voiceDurationText}>{formatDuration(recordingDuration)}</Text>
              <Text style={styles.voiceRecordingLabel}>Recording...</Text>
            </View>

            <TouchableOpacity onPress={finishRecording} style={styles.voiceSendBtn}>
              {isUploadingVoice ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={22} color={colors.white} />
              )}
              <Text style={styles.voiceSendText}>Send</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input Bar ── */}
        {!showVoiceUI && (
          <Animated.View
            style={[
              styles.inputBar,
              {
                opacity: inputBarAnim,
                transform: [
                  {
                    translateY: inputBarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message…"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={2000}
                returnKeyType="default"
              />
            </View>

            {inputText.trim() ? (
              <Animated.View
                style={{
                  transform: [
                    {
                      scale: sendAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.9],
                      }),
                    },
                  ],
                }}
              >
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => sendMessage()}
                  disabled={isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <TouchableOpacity
                style={styles.voiceBtn}
                onPress={startRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="mic" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    kav: { flex: 1 },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.background,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Spacing.sm,
    },
    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    headerAvatarImg: { width: 42, height: 42, borderRadius: 21 },
    headerAvatarText: { ...Typography.bodySemiBold, color: colors.primary, fontSize: 16 },
    headerOnline: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.background,
    },
    headerInfo: { marginLeft: Spacing.sm, flex: 1 },
    headerName: { ...Typography.bodySemiBold, color: colors.textPrimary, fontSize: 15 },
    headerRole: { ...Typography.small, color: colors.textMuted, marginTop: 1, fontSize: 12 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    headerActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Property Context Card
    propertyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xs,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    propertyCardImage: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.borderLight,
    },
    propertyCardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
    propertyCardBody: { flex: 1, marginLeft: Spacing.sm },
    propertyCardTitle: { ...Typography.bodySemiBold, color: colors.textPrimary, fontSize: 13 },
    propertyCardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    propertyCardLocation: { ...Typography.small, color: colors.textMuted, marginLeft: 3, fontSize: 11 },
    propertyCardPrice: { ...Typography.bodySemiBold, color: colors.primary, fontSize: 13, marginTop: 2 },

    // Loading
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { ...Typography.body, color: colors.textMuted, marginTop: Spacing.md },

    // Messages
    messagesContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
    dateLabelWrap: { alignItems: 'center', marginVertical: Spacing.md },
    dateLabel: {
      ...Typography.small,
      color: colors.textMuted,
      backgroundColor: colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      fontSize: 11,
    },

    bubble: {
      maxWidth: '78%',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
    },
    bubbleMe: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    bubbleThem: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bubbleOptimistic: { opacity: 0.8 },
    inquiryTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginBottom: 6,
    },
    inquiryTagText: {
      ...Typography.small,
      color: colors.primary,
      fontWeight: '600',
      marginLeft: 4,
      fontSize: 10,
    },
    senderName: { ...Typography.small, color: colors.primary, fontWeight: '600', marginBottom: 2 },
    bubbleText: { ...Typography.body, lineHeight: 22 },
    bubbleTextMe: { color: colors.white },
    bubbleTextThem: { color: colors.textPrimary },
    bubbleFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    bubbleTime: { ...Typography.small, fontSize: 10 },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
    bubbleTimeThem: { color: colors.textMuted },

    // Voice Message Bubble
    voiceMessageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      minWidth: 180,
    },
    voicePlayBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    voicePlayBtnMe: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    voiceWaveform: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 8,
      height: 28,
      gap: 2,
    },
    waveBar: { width: 3, borderRadius: 2 },
    voiceDurationLabel: { ...Typography.small, fontSize: 12, fontWeight: '500', minWidth: 32 },

    // Empty
    emptyChat: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxxxl,
      transform: [{ scaleY: -1 }],
    },
    emptyChatIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    emptyChatTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.xs },
    emptyChatText: {
      ...Typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: Spacing.xxl,
    },

    // Input Bar
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.background,
    },
    inputWrap: { flex: 1 },
    textInput: {
      ...Typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 2 : Spacing.sm,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: colors.borderLight,
      fontSize: 15,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.xs,
    },
    voiceBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.xs,
    },

    // Voice Overlay
    voiceOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.background,
    },
    voiceCancelBtn: { alignItems: 'center', justifyContent: 'center' },
    voiceCancelText: { ...Typography.small, color: colors.error, marginTop: 4, fontWeight: '600' },
    voiceCenter: { alignItems: 'center', justifyContent: 'center' },
    voiceRecordingCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    voiceDurationText: { ...Typography.bodySemiBold, color: colors.textPrimary, fontSize: 18 },
    voiceRecordingLabel: { ...Typography.small, color: colors.error, marginTop: 2 },
    voiceSendBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
    },
    voiceSendText: {
      ...Typography.small,
      color: colors.white,
      marginTop: 2,
      fontWeight: '600',
      fontSize: 10,
    },
  });
