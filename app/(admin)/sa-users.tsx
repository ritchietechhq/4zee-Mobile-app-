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
import type { SuperAdminUser, SuperAdminUserRole } from '@/types/admin';

const ROLE_FILTERS: { label: string; value: SuperAdminUserRole | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Super Admin', value: 'SUPER_ADMIN' },
  { label: 'Realtor', value: 'REALTOR' },
  { label: 'Client', value: 'CLIENT' },
];

const STATUS_FILTERS: { label: string; value: boolean | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  SUPER_ADMIN: 'error',
  ADMIN: 'warning',
  REALTOR: 'info',
  CLIENT: 'default',
};

export default function SuperAdminUsersScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<SuperAdminUserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<boolean | 'ALL'>('ALL');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: 20 };
      if (roleFilter !== 'ALL') params.role = roleFilter;
      if (statusFilter !== 'ALL') params.isActive = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminService.getUsers(params as any);
      const newData = res.items ?? [];
      setUsers(append ? (prev) => [...prev, ...newData] : newData);
      setHasMore(newData.length >= 20);
    } catch (e) {
      console.error('Fetch users error:', e);
    }
  }, [roleFilter, statusFilter, search]);

  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    fetchUsers(1).finally(() => setIsLoading(false));
  }, [roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      setIsLoading(true);
      fetchUsers(1).finally(() => setIsLoading(false));
    }, 500);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchUsers(1);
    setIsRefreshing(false);
  }, [fetchUsers]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchUsers(next, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, page, fetchUsers]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const renderUser = ({ item }: { item: SuperAdminUser }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push({ pathname: '/(admin)/sa-user-detail', params: { userId: item.id } } as any)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userInitials}>
          {(item.firstName?.[0] || item.email[0]).toUpperCase()}
          {(item.lastName?.[0] || '').toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.firstName && item.lastName
            ? `${item.firstName} ${item.lastName}`
            : item.email}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        <View style={styles.userMeta}>
          <Badge
            label={item.role.replace('_', ' ')}
            variant={ROLE_BADGE_VARIANT[item.role] ?? 'default'}
            size="sm"
          />
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? colors.success : colors.error }]} />
          <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <View style={styles.userRight}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={{ padding: Spacing.xl }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} width="100%" height={80} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
      ))}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>All Users</Text>
            <Text style={styles.headerSubtitle}>Admin • Manage all accounts</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
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

        {/* Role Filters */}
        <View style={styles.filterRow}>
          {ROLE_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={f.label}
              selected={roleFilter === f.value}
              onPress={() => setRoleFilter(f.value)}
            />
          ))}
        </View>

        {/* Status Filters */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => (
            <FilterChip
              key={String(f.value)}
              label={f.label}
              selected={statusFilter === f.value}
              onPress={() => setStatusFilter(f.value)}
            />
          ))}
        </View>

        {/* Content */}
        {isLoading ? renderSkeleton() : users.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No users found"
            description="Try adjusting your search or filters"
          />
        ) : (
          <FlatList
            data={users}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator color={colors.primary} style={{ paddingVertical: Spacing.lg }} />
              ) : null
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
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center',
      ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    searchContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    searchInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
      ...Shadows.sm,
    },
    searchInput: {
      flex: 1,
      ...Typography.body,
      color: colors.textPrimary,
      paddingVertical: Spacing.xs,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    userAvatar: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    userInitials: {
      ...Typography.bodyMedium,
      color: colors.primary,
      fontWeight: '700',
    },
    userInfo: { flex: 1, marginLeft: Spacing.md },
    userName: { ...Typography.bodyMedium, color: colors.textPrimary },
    userEmail: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.sm,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { ...Typography.small, color: colors.textMuted },
    userRight: { alignItems: 'flex-end', gap: Spacing.xs },
    dateText: { ...Typography.small, color: colors.textMuted },
  });
