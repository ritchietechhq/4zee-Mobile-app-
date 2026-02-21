import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminSupportTicket, AdminTicketMessage } from '@/types/admin';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function TicketDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminService.getTicketDetail(id);
      setTicket(data);
    } catch (e) {
      console.error('Ticket detail error:', e);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [id]);

  const handleReply = useCallback(async () => {
    if (!id || !reply.trim()) return;
    setIsSending(true);
    try {
      await adminService.replyToTicket(id, { content: reply.trim() });
      setReply('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Reply failed');
    } finally {
      setIsSending(false);
    }
  }, [id, reply, fetchData]);

  const handleStatusChange = useCallback(
    (status: string) => {
      if (!id) return;
      Alert.alert('Update Status', `Change status to ${status.replace('_', ' ')}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await adminService.updateTicketStatus(id, { status });
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Status update failed');
            }
          },
        },
      ]);
    },
    [id, fetchData],
  );

  const statusBadge = (s: string) => {
    switch (s) {
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={120} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={200} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!ticket) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ticket</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...Typography.body, color: colors.textSecondary }}>Ticket not found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Ticket</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Ticket Info */}
            <Card style={styles.infoCard}>
              <Text style={styles.subject}>{ticket.subject}</Text>
              <View style={styles.metaRow}>
                <Badge label={ticket.status.replace('_', ' ')} variant={statusBadge(ticket.status)} size="sm" />
                <Badge label={ticket.priority} variant={ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'error' : 'default'} size="sm" />
                {ticket.category && <Badge label={ticket.category} variant="info" size="sm" />}
              </View>
              <Text style={styles.fromText}>
                From: {ticket.user?.firstName ?? ''} {ticket.user?.lastName ?? ''} ({ticket.user?.email})
              </Text>
              <Text style={styles.dateText}>
                Created: {new Date(ticket.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </Card>

            {/* Status Change */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Change Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    disabled={ticket.status === s}
                    onPress={() => handleStatusChange(s)}
                    style={[
                      styles.statusChip,
                      ticket.status === s && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        { color: ticket.status === s ? '#fff' : colors.textSecondary },
                      ]}
                    >
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Messages */}
            <Text style={styles.sectionTitle}>Messages</Text>
            {(ticket.messages ?? []).map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.sender?.role === 'ADMIN' || msg.sender?.role === 'SUPER_ADMIN'
                    ? styles.adminBubble
                    : styles.userBubble,
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={styles.messageSender}>
                    {msg.sender?.email?.split('@')[0] ?? 'User'}
                  </Text>
                  <Text style={styles.messageTime}>
                    {new Date(msg.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.messageContent}>{msg.content}</Text>
                {msg.isInternal && (
                  <Text style={styles.internalTag}>Internal note</Text>
                )}
              </View>
            ))}

            {(ticket.messages ?? []).length === 0 && (
              <Text style={{ ...Typography.caption, color: colors.textMuted, textAlign: 'center', marginVertical: Spacing.xl }}>
                No messages yet
              </Text>
            )}
          </ScrollView>

          {/* Reply Box */}
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              value={reply}
              onChangeText={setReply}
              placeholder="Type a reply…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity
              onPress={handleReply}
              disabled={isSending || !reply.trim()}
              style={[styles.sendBtn, { opacity: !reply.trim() || isSending ? 0.4 : 1 }]}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { ...Typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    content: { padding: Spacing.xl, paddingBottom: 20 },
    infoCard: { marginBottom: Spacing.lg },
    subject: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.sm },
    metaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, flexWrap: 'wrap' },
    fromText: { ...Typography.caption, color: colors.textSecondary, marginTop: Spacing.xs },
    dateText: { ...Typography.small, color: colors.textMuted, marginTop: Spacing.xs },
    statusSection: { marginBottom: Spacing.lg },
    sectionTitle: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    statusChip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    statusChipText: { ...Typography.captionMedium },
    messageBubble: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      maxWidth: '85%',
    },
    adminBubble: {
      backgroundColor: colors.primaryLight,
      alignSelf: 'flex-end',
    },
    userBubble: {
      backgroundColor: colors.cardBackground,
      alignSelf: 'flex-start',
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    messageSender: { ...Typography.captionMedium, color: colors.primary },
    messageTime: { ...Typography.small, color: colors.textMuted },
    messageContent: { ...Typography.body, color: colors.textPrimary },
    internalTag: { ...Typography.small, color: colors.warning, marginTop: Spacing.xs, fontStyle: 'italic' },
    replyBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.background,
    },
    replyInput: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Typography.body,
      color: colors.textPrimary,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
