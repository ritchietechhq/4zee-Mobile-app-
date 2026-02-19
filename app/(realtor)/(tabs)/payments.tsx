import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { commissionService } from '@/services/commission.service';
import { payoutService } from '@/services/payout.service';
import type {
  Commission, CommissionSummary, CommissionStatus,
  Payout, PayoutBalance, PayoutStatus,
} from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

type ActiveTab = 'commissions' | 'payouts';

const commissionStatusColors: Record<CommissionStatus, { bg: string; text: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning },
  APPROVED: { bg: Colors.primaryLight, text: Colors.primary },
  PAID: { bg: Colors.successLight, text: Colors.success },
  CANCELLED: { bg: Colors.errorLight, text: Colors.error },
};

const payoutStatusColors: Record<PayoutStatus, { bg: string; text: string }> = {
  PENDING: { bg: Colors.warningLight, text: Colors.warning },
  PROCESSING: { bg: Colors.primaryLight, text: Colors.primary },
  COMPLETED: { bg: Colors.successLight, text: Colors.success },
  FAILED: { bg: Colors.errorLight, text: Colors.error },
  CANCELLED: { bg: Colors.surface, text: Colors.textMuted },
};

export default function PaymentsScreen() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('commissions');
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [balance, setBalance] = useState<PayoutBalance | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commCursor, setCommCursor] = useState<string | undefined>();
  const [commHasNext, setCommHasNext] = useState(false);
  const [payoutCursor, setPayoutCursor] = useState<string | undefined>();
  const [payoutHasNext, setPayoutHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  const emptyPage = { items: [], pagination: { hasNext: false, nextCursor: undefined } };

  const fetchAll = useCallback(async () => {
    try {
      const [summaryRes, balanceRes, commRes, payoutRes] = await Promise.all([
        commissionService.getMySummary().catch(() => null),
        payoutService.getBalance().catch(() => null),
        commissionService.getMyCommissions(undefined, undefined, 15).catch(() => emptyPage),
        payoutService.getMyPayouts(undefined, 15).catch(() => emptyPage),
      ]);
      if (summaryRes) setSummary(summaryRes);
      if (balanceRes) setBalance(balanceRes);
      setCommissions(commRes.items || []);
      setCommCursor(commRes.pagination?.nextCursor);
      setCommHasNext(commRes.pagination?.hasNext || false);
      setPayouts(payoutRes.items || []);
      setPayoutCursor(payoutRes.pagination?.nextCursor);
      setPayoutHasNext(payoutRes.pagination?.hasNext || false);
    } catch (e) {
      // Silently handle — individual calls already caught
    }
  }, []);

  useEffect(() => {
    (async () => { setIsLoading(true); await fetchAll(); setIsLoading(false); })();
  }, [fetchAll]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAll();
    setIsRefreshing(false);
  };

  const loadMoreCommissions = async () => {
    if (!commHasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await commissionService.getMyCommissions(undefined, commCursor, 15);
      setCommissions((prev) => [...prev, ...(res.items || [])]);
      setCommCursor(res.pagination?.nextCursor);
      setCommHasNext(res.pagination?.hasNext || false);
    } catch {} finally { setIsLoadingMore(false); }
  };

  const loadMorePayouts = async () => {
    if (!payoutHasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await payoutService.getMyPayouts(payoutCursor, 15);
      setPayouts((prev) => [...prev, ...(res.items || [])]);
      setPayoutCursor(res.pagination?.nextCursor);
      setPayoutHasNext(res.pagination?.hasNext || false);
    } catch {} finally { setIsLoadingMore(false); }
  };

  const handleRequestPayout = async () => {
    if (!balance || balance.availableBalance <= 0) {
      Alert.alert('No Funds', 'You don\'t have available balance to withdraw.');
      return;
    }
    Alert.alert(
      'Request Payout',
      `Withdraw ${formatCurrency(balance.availableBalance)} to your default bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsRequestingPayout(true);
            try {
              await payoutService.request({ amount: balance.availableBalance });
              Alert.alert('Success', 'Payout request submitted successfully.');
              await fetchAll();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Failed to request payout.');
            } finally { setIsRequestingPayout(false); }
          },
        },
      ],
    );
  };

  const renderBalanceCard = () => {
    if (!balance && !summary) return null;
    return (
      <LinearGradient
        colors={[Colors.primary, Colors.accent]}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceValue}>
          {balance ? formatCurrency(balance.availableBalance) : '—'}
        </Text>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemVal}>
              {summary ? formatCurrency(summary.total?.amount ?? 0) : '—'}
            </Text>
            <Text style={styles.balanceItemLabel}>Total Earned</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemVal}>
              {balance ? formatCurrency(balance.totalWithdrawn) : '—'}
            </Text>
            <Text style={styles.balanceItemLabel}>Withdrawn</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceItemVal}>
              {balance ? formatCurrency(balance.pendingWithdrawals?.amount ?? 0) : '—'}
            </Text>
            <Text style={styles.balanceItemLabel}>Pending</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.payoutBtn}
          onPress={handleRequestPayout}
          disabled={isRequestingPayout}
          activeOpacity={0.8}
        >
          {isRequestingPayout ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="arrow-up-outline" size={16} color={Colors.primary} />
              <Text style={styles.payoutBtnText}>Request Payout</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {(['commissions', 'payouts'] as ActiveTab[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'commissions' ? 'Commissions' : 'Payouts'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCommission = ({ item }: { item: Commission }) => {
    const c = commissionStatusColors[item.status] || commissionStatusColors.PENDING;
    return (
      <Card variant="outlined" padding="md" style={styles.itemCard}>
        <View style={styles.itemRow}>
          <View style={[styles.typeIcon, { backgroundColor: item.type === 'DIRECT' ? Colors.primaryLight : Colors.successLight }]}>
            <Ionicons name={item.type === 'DIRECT' ? 'storefront-outline' : 'people-outline'} size={18} color={item.type === 'DIRECT' ? Colors.primary : Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.sale?.property?.title || 'Commission'}</Text>
            <Text style={styles.itemSub}>{item.type === 'DIRECT' ? 'Direct Sale' : 'Referral'} · {(item.rate * 100).toFixed(1)}%</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>{item.status}</Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderPayout = ({ item }: { item: Payout }) => {
    const c = payoutStatusColors[item.status] || payoutStatusColors.PENDING;
    const canCancel = item.status === 'PENDING';

    const handleCancel = () => {
      Alert.alert('Cancel Payout', 'Are you sure you want to cancel this payout request?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await payoutService.cancel(item.id);
              Alert.alert('Cancelled', 'Payout request has been cancelled.');
              await fetchAll();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Failed to cancel payout.');
            }
          },
        },
      ]);
    };

    return (
      <Card variant="outlined" padding="md" style={styles.itemCard}>
        <View style={styles.itemRow}>
          <View style={[styles.typeIcon, { backgroundColor: Colors.successLight }]}>
            <Ionicons name="arrow-up-outline" size={18} color={Colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.bankAccount?.bankName || 'Bank Transfer'}</Text>
            <Text style={styles.itemSub}>****{item.bankAccount?.accountNumber?.slice(-4) || '****'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
              <Text style={[styles.statusText, { color: c.text }]}>{item.status}</Text>
            </View>
          </View>
        </View>
        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  };

  const data = activeTab === 'commissions' ? commissions : payouts;
  const onEndReached = activeTab === 'commissions' ? loadMoreCommissions : loadMorePayouts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={180} />
          <Skeleton width="100%" height={50} style={{ marginTop: Spacing.lg }} />
          {[1, 2, 3].map((i) => (<Skeleton key={i} width="100%" height={80} style={{ marginTop: Spacing.md }} />))}
        </View>
      ) : (
        <FlatList
          data={data as any[]}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'commissions' ? renderCommission as any : renderPayout as any}
          ListHeaderComponent={
            <>
              {renderBalanceCard()}
              {renderTabs()}
            </>
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'commissions' ? 'cash-outline' : 'arrow-up-outline'}
              title={activeTab === 'commissions' ? 'No Commissions' : 'No Payouts'}
              description={activeTab === 'commissions' ? 'Your commissions from sales will appear here.' : 'Your payout history will appear here.'}
            />
          }
          ListFooterComponent={isLoadingMore ? <View style={styles.footer}><ActivityIndicator size="small" color={Colors.primary} /></View> : null}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle: { ...Typography.h3, color: Colors.textPrimary },
  balanceCard: { borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.lg },
  balanceLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.7)' },
  balanceValue: { ...Typography.h1, color: Colors.white, marginTop: Spacing.xs },
  balanceDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: Spacing.lg },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  balanceItem: { alignItems: 'center' },
  balanceItemVal: { ...Typography.captionMedium, color: Colors.white },
  balanceItemLabel: { ...Typography.small, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md },
  payoutBtnText: { ...Typography.bodySemiBold, color: Colors.primary },
  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { ...Typography.bodySemiBold, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  itemCard: { marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  typeIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  itemSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  itemAmount: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 4 },
  statusText: { ...Typography.small, fontWeight: '600' },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, marginTop: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  cancelBtnText: { ...Typography.captionMedium, color: Colors.error },
});
