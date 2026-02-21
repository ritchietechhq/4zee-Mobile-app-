import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
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
import { formatNaira } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminApplication } from '@/types/admin';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

export default function ApplicationsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const res = await adminService.getApplications(params);
      setApplications(res?.items ?? []);
    } catch (e) {
      console.error('Applications fetch error:', e);
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

  const handleAction = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      const label = action === 'approve' ? 'Approve' : 'Reject';
      Alert.alert(`${label} Application`, `Are you sure you want to ${action} this application?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: label,
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setProcessing(id);
            try {
              if (action === 'approve') await adminService.approveApplication(id);
              else await adminService.rejectApplication(id);
              Alert.alert('Done', `Application ${action}d`);
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || `Failed to ${action}`);
            } finally {
              setProcessing(null);
            }
          },
        },
      ]);
    },
    [fetchData],
  );

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const renderItem = ({ item }: { item: AdminApplication }) => (
    <Card variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {(item.client?.firstName?.[0] ?? '').toUpperCase()}
              {(item.client?.lastName?.[0] ?? '').toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.clientName}>
              {item.client?.firstName} {item.client?.lastName}
            </Text>
            <Text style={styles.clientEmail}>{item.client?.user?.email}</Text>
          </View>
        </View>
        <Badge label={item.status} variant={statusBadge(item.status)} />
      </View>

      <View style={styles.propertyRow}>
        <Ionicons name="business-outline" size={16} color={colors.textMuted} />
        <Text style={styles.propertyTitle} numberOfLines={1}>{item.property?.title}</Text>
        <Text style={styles.propertyPrice}>{formatNaira(item.property?.price ?? 0)}</Text>
      </View>

      {item.realtor && (
        <View style={styles.realtorRow}>
          <Ionicons name="person-outline" size={14} color={colors.textMuted} />
          <Text style={styles.realtorText}>
            Realtor: {item.realtor.firstName} {item.realtor.lastName}
          </Text>
        </View>
      )}

      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Text>

      {item.status === 'PENDING' && (
        <View style={styles.actions}>
          <Button
            title="Approve"
            variant="primary"
            size="sm"
            loading={processing === item.id}
            onPress={() => handleAction(item.id, 'approve')}
            style={{ flex: 1 }}
            icon={<Ionicons name="checkmark" size={16} color="#fff" />}
          />
          <Button
            title="Reject"
            variant="danger"
            size="sm"
            loading={processing === item.id}
            onPress={() => handleAction(item.id, 'reject')}
            style={{ flex: 1 }}
            icon={<Ionicons name="close" size={16} color="#fff" />}
          />
        </View>
      )}
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Applications</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.textSecondary }]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={160} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="document-text-outline"
                title="No Applications"
                description={`No ${activeTab.toLowerCase()} applications at this time.`}
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
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    tabText: { ...Typography.captionMedium },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: { marginBottom: Spacing.lg },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.captionMedium, fontWeight: '700' },
    clientName: { ...Typography.bodyMedium, color: colors.textPrimary },
    clientEmail: { ...Typography.caption, color: colors.textSecondary },
    propertyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
    propertyTitle: { ...Typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    propertyPrice: { ...Typography.captionMedium, color: colors.primary, fontWeight: '600' },
    realtorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    realtorText: { ...Typography.caption, color: colors.textSecondary },
    dateText: { ...Typography.small, color: colors.textMuted },
    actions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
  });
