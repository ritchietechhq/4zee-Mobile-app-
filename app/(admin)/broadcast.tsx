import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const TARGET_ROLES = [
  { label: 'All Users', value: 'ALL' },
  { label: 'Clients', value: 'CLIENT' },
  { label: 'Realtors', value: 'REALTOR' },
  { label: 'Admins', value: 'ADMIN' },
];

export default function BroadcastNotificationScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CLIENT' | 'REALTOR' | 'ADMIN'>('ALL');
  const [isSending, setIsSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ message: string; recipientCount: number } | null>(null);

  const canSend = title.trim().length >= 3 && body.trim().length >= 5;

  const handleSend = useCallback(async () => {
    if (!canSend) return;

    Alert.alert(
      'Confirm Broadcast',
      `Send notification to ${targetRole === 'ALL' ? 'all users' : `all ${targetRole.toLowerCase()}s`}?\n\nTitle: ${title}\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: async () => {
            setIsSending(true);
            try {
              const result = await adminService.broadcastNotification({
                title: title.trim(),
                body: body.trim(),
                targetRole: targetRole === 'ALL' ? 'ALL' : targetRole,
              });
              setSentResult(result);
              setTitle('');
              setBody('');
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to send broadcast notification');
            } finally {
              setIsSending(false);
            }
          },
        },
      ],
    );
  }, [title, body, targetRole, canSend]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Broadcast</Text>
                <Text style={styles.headerSubtitle}>Send notification to users</Text>
              </View>
            </View>

            {/* Success banner */}
            {sentResult && (
              <Card variant="elevated" padding="lg" style={styles.successCard}>
                <View style={styles.successRow}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.successTitle}>Notification Sent!</Text>
                    <Text style={styles.successDesc}>
                      Delivered to {sentResult.recipientCount} recipient{sentResult.recipientCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSentResult(null)}>
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* Target Audience */}
            <Text style={styles.sectionTitle}>Target Audience</Text>
            <View style={styles.filterRow}>
              {TARGET_ROLES.map((r) => (
                <FilterChip
                  key={r.value}
                  label={r.label}
                  selected={targetRole === r.value}
                  onPress={() => setTargetRole(r.value as any)}
                />
              ))}
            </View>

            {/* Title */}
            <Text style={styles.label}>Notification Title</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter notification title..."
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                autoCapitalize="sentences"
              />
            </View>
            <Text style={styles.charCount}>{title.length}/100</Text>

            {/* Body */}
            <Text style={styles.label}>Message Body</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter notification message..."
                placeholderTextColor={colors.textMuted}
                value={body}
                onChangeText={setBody}
                maxLength={500}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
            </View>
            <Text style={styles.charCount}>{body.length}/500</Text>

            {/* Preview */}
            {canSend && (
              <>
                <Text style={styles.sectionTitle}>Preview</Text>
                <Card variant="elevated" padding="lg">
                  <View style={styles.previewRow}>
                    <View style={styles.previewIcon}>
                      <Ionicons name="notifications" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewTitle}>{title}</Text>
                      <Text style={styles.previewBody} numberOfLines={3}>{body}</Text>
                      <Text style={styles.previewMeta}>
                        To: {targetRole === 'ALL' ? 'All Users' : `${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()}s`}
                      </Text>
                    </View>
                  </View>
                </Card>
              </>
            )}

            {/* Send Button */}
            <View style={styles.sendContainer}>
              <Button
                title={isSending ? 'Sending...' : 'Send Broadcast Notification'}
                variant="primary"
                onPress={handleSend}
                disabled={!canSend || isSending}
              />
            </View>

            {/* Info Card */}
            <Card variant="elevated" padding="lg" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.infoText}>
                    Broadcast notifications are sent to all devices registered by users in the selected audience. Push notifications require users to have the app installed and notifications enabled.
                  </Text>
                </View>
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 40 },
    header: {
      flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    successCard: { marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.success },
    successRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    successIcon: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.successLight,
      alignItems: 'center', justifyContent: 'center',
    },
    successTitle: { ...Typography.bodyMedium, color: colors.success },
    successDesc: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    sectionTitle: {
      ...Typography.h4, color: colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.md,
    },
    filterRow: {
      flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg,
    },
    label: {
      ...Typography.captionMedium, color: colors.textSecondary,
      marginBottom: Spacing.xs, marginTop: Spacing.md,
    },
    inputWrap: {
      backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
      borderWidth: 1.5, borderColor: colors.border, ...Shadows.sm,
    },
    input: {
      ...Typography.body, color: colors.textPrimary,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    textAreaWrap: { minHeight: 140 },
    textArea: { minHeight: 120 },
    charCount: {
      ...Typography.small, color: colors.textMuted, textAlign: 'right', marginTop: Spacing.xs,
    },
    previewRow: { flexDirection: 'row', gap: Spacing.md },
    previewIcon: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    previewTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    previewBody: { ...Typography.caption, color: colors.textSecondary, marginTop: 4 },
    previewMeta: { ...Typography.small, color: colors.textMuted, marginTop: Spacing.sm },
    sendContainer: { marginTop: Spacing.xxl },
    infoCard: { marginTop: Spacing.xl },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    infoText: { ...Typography.caption, color: colors.textMuted, lineHeight: 18 },
  });
