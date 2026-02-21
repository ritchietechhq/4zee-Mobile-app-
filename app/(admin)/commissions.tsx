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
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminCommission } from '@/types/admin';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'PAID', 'CANCELLED'] as const;

export default function CommissionsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [commissions, setCommissions] = useState<AdminCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const res = await adminService.getCommissions(params);
      setCommissions(res?.items ?? []);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Commissions fetch error:', e);
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAction = useCallback(
    async (action: 'approve' | 'mark-paid' | 'cancel') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return Alert.alert('Select', 'Please select commissions first');
      const labels: Record<string, string> = { approve: 'Approve', 'mark-paid': 'Mark as Paid', cancel: 'Cancel' };
      Alert.alert(`${labels[action]} ${ids.length} commissions?`, undefined, [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              if (action === 'approve') await adminService.bulkApproveCommissions(ids);
              else if (action === 'mark-paid') await adminService.bulkMarkPaid(ids);
              else await adminService.bulkCancelCommissions(ids);
              Alert.alert('Done', `${labels[action]} successful`);
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Bulk action failed');
            }
          },
        },
      ]);
    },
    [selectedIds, fetchData],
  );

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'info';
      case 'PAID': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const renderItem = ({ item }: { item: AdminCommission }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.8}
        style={[styles.card, isSelected && { borderColor: colors.primary, borderWidth: 2 }]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: item.type === 'DIRECT' ? colors.primaryLight : colors.purpleLight }]}>
            <Ionicons
              name={item.type === 'DIRECT' ? 'arrow-forward-circle-outline' : 'git-branch-outline'}
              size={18}
              color={item.type === 'DIRECT' ? colors.primary : colors.purple}
            />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>
              {item.realtor?.firstName} {item.realtor?.lastName}
            </Text>
            <Text style={styles.cardType}>{item.type} Commission</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
            <Badge label={item.status} variant={statusBadge(item.status)} size="sm" style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>
            Rate: {(item.rate * 100).toFixed(1)}% • Sale: {formatCurrency(item.saleAmount)}
          </Text>
          <Text style={styles.metaText}>
            {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commissions</Text>
          <View style={{ width: 40 }} />
        </View>

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

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <View style={styles.bulkBar}>
            <Text style={styles.bulkText}>{selectedIds.size} selected</Text>
            <Button title="Approve" variant="primary" size="sm" onPress={() => handleBulkAction('approve')} />
            <Button title="Mark Paid" variant="secondary" size="sm" onPress={() => handleBulkAction('mark-paid')} />
            <Button title="Cancel" variant="danger" size="sm" onPress={() => handleBulkAction('cancel')} />
          </View>
        )}

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={commissions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="trophy-outline"
                title="No Commissions"
                description={`No ${activeTab.toLowerCase()} commissions found.`}
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
    tabScroll: { maxHeight: 44, marginBottom: Spacing.md },
    tabRow: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    tab: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
    },
    tabText: { ...Typography.captionMedium },
    bulkBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
    bulkText: { ...Typography.captionMedium, color: colors.textPrimary, flex: 1 },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    typeIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardName: { ...Typography.bodyMedium, color: colors.textPrimary },
    cardType: { ...Typography.caption, color: colors.textSecondary },
    cardAmount: { ...Typography.h4, color: colors.success },
    cardMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
    },
    metaText: { ...Typography.small, color: colors.textMuted },
  });
