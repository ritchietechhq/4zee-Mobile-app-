import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { FilterChip } from '@/components/ui/FilterChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SuperAdminUser } from '@/types/admin';

const KYC_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Not Submitted', value: 'NOT_SUBMITTED' },
];

const KYC_BADGE: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  NOT_SUBMITTED: 'default',
};

export default function SuperAdminClientsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [clients, setClients] = useState<SuperAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('ALL');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: 20 };
      if (search.trim()) params.search = search.trim();
      if (kycFilter !== 'ALL') params.kycStatus = kycFilter;
      const res = await adminService.getClientUsers(params as any);
      const newData = res.items ?? [];
      setClients(append ? (prev) => [...prev, ...newData] : newData);
      setHasMore(newData.length >= 20);
    } catch (e) {
      console.error('Fetch clients error:', e);
    }
  }, [search, kycFilter]);

  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    fetchClients(1).finally(() => setIsLoading(false));
  }, [kycFilter]);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      setIsLoading(true);
      fetchClients(1).finally(() => setIsLoading(false));
    }, 500);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchClients(1);
    setIsRefreshing(false);
  }, [fetchClients]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchClients(next, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, page, fetchClients]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  const renderClient = ({ item }: { item: SuperAdminUser }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/(admin)/sa-user-detail', params: { userId: item.id } } as any)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.initials}>
          {(item.firstName?.[0] || item.email[0]).toUpperCase()}
          {(item.lastName?.[0] || '').toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.email}
        </Text>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <View style={styles.metaRow}>
          {item.profile?.kycStatus && (
            <Badge
              label={item.profile.kycStatus.replace('_', ' ')}
              variant={KYC_BADGE[item.profile.kycStatus] ?? 'default'}
              size="sm"
            />
          )}
          <View style={[styles.dot, { backgroundColor: item.isActive ? colors.success : colors.error }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
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
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>All Clients</Text>
            <Text style={styles.headerSubtitle}>Admin • Client management</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filterRow}>
          {KYC_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              selected={kycFilter === f.value}
              onPress={() => setKycFilter(f.value)}
            />
          ))}
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={80} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
            ))}
          </View>
        ) : clients.length === 0 ? (
          <EmptyState icon="person-outline" title="No clients found" description="Try adjusting your search or filters" />
        ) : (
          <FlatList
            data={clients}
            renderItem={renderClient}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: Spacing.lg }} /> : null
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
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    searchContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      gap: Spacing.sm, ...Shadows.sm,
    },
    searchInput: { flex: 1, ...Typography.body, color: colors.textPrimary, paddingVertical: Spacing.xs },
    filterRow: {
      flexDirection: 'row', paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md, gap: Spacing.sm, flexWrap: 'wrap',
    },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
      padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
    },
    avatar: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: colors.indigoLight,
      alignItems: 'center', justifyContent: 'center',
    },
    initials: { ...Typography.bodyMedium, color: colors.indigo, fontWeight: '700' },
    info: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.bodyMedium, color: colors.textPrimary },
    email: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, gap: Spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { ...Typography.small, color: colors.textMuted },
    right: { alignItems: 'flex-end', gap: Spacing.xs },
    dateText: { ...Typography.small, color: colors.textMuted },
  });
