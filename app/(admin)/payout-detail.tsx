import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminPayout } from '@/types/admin';

export default function PayoutDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [payout, setPayout] = useState<AdminPayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminService.getPayoutDetail(id);
      setPayout(data);
    } catch (e) {
      console.error('Payout detail error:', e);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [id]);

  const handleProcess = useCallback(
    (approved: boolean) => {
      if (!id) return;
      const action = approved ? 'Approve' : 'Reject';
      const promptForReason = (callback: (reason?: string) => void) => {
        if (approved) return callback();
        Alert.prompt?.(
          'Rejection Reason',
          'Provide a reason for rejection:',
          (reason) => callback(reason),
          'plain-text',
        ) ??
          Alert.alert(action, `${action} this payout?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: action, onPress: () => callback() },
          ]);
      };

      Alert.alert(`${action} Payout`, `${action} this payout of ${payout ? formatCurrency(payout.amount) : ''}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: approved ? 'default' : 'destructive',
          onPress: () => {
            promptForReason(async (reason) => {
              setIsProcessing(true);
              try {
                await adminService.processPayout(id, {
                  approved,
                  rejectionReason: reason || null,
                });
                Alert.alert('Done', `Payout ${approved ? 'approved' : 'rejected'}`);
                fetchData();
              } catch (e: any) {
                Alert.alert('Error', e?.error?.message || 'Process failed');
              } finally {
                setIsProcessing(false);
              }
            });
          },
        },
      ]);
    },
    [id, payout, fetchData],
  );

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED':
      case 'REJECTED': return 'error';
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
            <Text style={styles.headerTitle}>Payout Detail</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={200} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={160} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!payout) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payout Detail</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...Typography.body, color: colors.textSecondary }}>Payout not found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payout Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={fetchData} tintColor={colors.primary} />
          }
        >
          {/* Amount Header */}
          <Card style={styles.amountCard}>
            <Text style={styles.amountLabel}>Payout Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(payout.amount)}</Text>
            <Badge
              label={payout.status}
              variant={statusBadge(payout.status)}
              size="md"
              style={{ alignSelf: 'center', marginTop: Spacing.sm }}
            />
          </Card>

          {/* Realtor Info */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Realtor</Text>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(payout.realtor?.firstName?.[0] ?? '') + (payout.realtor?.lastName?.[0] ?? '')}
                </Text>
              </View>
              <View>
                <Text style={styles.nameText}>
                  {payout.realtor?.firstName} {payout.realtor?.lastName}
                </Text>
                <Text style={styles.idText}>ID: {payout.realtor?.id?.slice(0, 8)}…</Text>
              </View>
            </View>
          </Card>

          {/* Bank Details */}
          {payout.bankAccount && (
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Bank Details</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bank</Text>
                <Text style={styles.detailValue}>{payout.bankAccount.bankName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Number</Text>
                <Text style={styles.detailValue}>{payout.bankAccount.accountNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Account Name</Text>
                <Text style={styles.detailValue}>{payout.bankAccount.accountName}</Text>
              </View>
            </Card>
          )}

          {/* Dates */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {new Date(payout.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
            {payout.processedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processed</Text>
                <Text style={styles.detailValue}>
                  {new Date(payout.processedAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            )}
          </Card>

          {/* Actions */}
          {payout.status === 'PENDING' && (
            <View style={styles.actionsRow}>
              <Button
                title={isProcessing ? 'Processing…' : 'Approve'}
                variant="primary"
                onPress={() => handleProcess(true)}
                disabled={isProcessing}
                style={{ flex: 1 }}
              />
              <Button
                title="Reject"
                variant="danger"
                onPress={() => handleProcess(false)}
                disabled={isProcessing}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </ScrollView>
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
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    content: { padding: Spacing.xl, paddingBottom: 40 },
    amountCard: { alignItems: 'center', paddingVertical: Spacing.xxl, marginBottom: Spacing.lg },
    amountLabel: { ...Typography.caption, color: colors.textSecondary },
    amountValue: { ...Typography.h1, color: colors.textPrimary, marginTop: Spacing.xs },
    sectionCard: { marginBottom: Spacing.lg },
    sectionTitle: { ...Typography.captionMedium, color: colors.textSecondary, marginBottom: Spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.captionMedium },
    nameText: { ...Typography.bodyMedium, color: colors.textPrimary },
    idText: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    detailLabel: { ...Typography.caption, color: colors.textSecondary },
    detailValue: { ...Typography.bodyMedium, color: colors.textPrimary },
    actionsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
  });
