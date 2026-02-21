import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminPayout, PayoutStatistics } from '@/types/admin';

const STATUS_TABS = ['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'] as const;

export default function PayoutsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [stats, setStats] = useState<PayoutStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const [payoutsRes, statsRes] = await Promise.all([
        adminService.getPayouts(params),
        adminService.getPayoutStatistics(),
      ]);
      setPayouts(payoutsRes?.items ?? []);
      setStats(statsRes);
    } catch (e) {
      console.error('Payouts fetch error:', e);
    }
  }, [activeTab]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [activeTab]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return 'warning';
      case 'PROCESSING': return 'info';
      case 'COMPLETED': return 'success';
      case 'FAILED': return 'error';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const renderItem = ({ item }: { item: AdminPayout }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(admin)/payout-detail', params: { id: item.id } })}
      style={styles.card}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.realtor?.firstName?.[0] ?? '') + (item.realtor?.lastName?.[0] ?? '')}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>
            {item.realtor?.firstName} {item.realtor?.lastName}
          </Text>
          {item.bankAccount && (
            <Text style={styles.bankText}>
              {item.bankAccount.bankName} • ****{item.bankAccount.accountNumber.slice(-4)}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountText}>{formatCurrency(item.amount)}</Text>
          <Badge label={item.status} variant={statusBadge(item.status)} size="sm" style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        {item.processedAt && (
          <Text style={styles.dateText}>
            Processed: {new Date(item.processedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payouts</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{stats.totalPayouts}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {formatCurrency(stats.pendingAmount)}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(stats.totalAmount)}
              </Text>
              <Text style={styles.statLabel}>Paid Out</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.textSecondary }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={payouts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="cash-outline"
                title="No Payouts"
                description={`No ${activeTab.toLowerCase()} payouts found.`}
              />
            }
          />
        )}
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
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    statPill: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
    },
    statValue: { ...Typography.bodySemiBold, color: colors.textPrimary },
    statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    tabScroll: { maxHeight: 44, marginBottom: Spacing.md },
    tabRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    tab: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
    },
    tabText: { ...Typography.captionMedium },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.captionMedium },
    cardInfo: { flex: 1 },
    cardName: { ...Typography.bodyMedium, color: colors.textPrimary },
    bankText: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    amountText: { ...Typography.h4, color: colors.textPrimary },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    dateText: { ...Typography.small, color: colors.textMuted },
  });
