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
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SuperAdminUser } from '@/types/admin';

export default function SuperAdminAdminsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [admins, setAdmins] = useState<SuperAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const fetchAdmins = useCallback(async (pageNum = 1, append = false) => {
    try {
      const params: Record<string, unknown> = { page: pageNum, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const res = await adminService.getAdminUsers(params as any);
      const newData = res.items ?? [];
      setAdmins(append ? (prev) => [...prev, ...newData] : newData);
      setHasMore(newData.length >= 20);
    } catch (e) {
      console.error('Fetch admins error:', e);
    }
  }, [search]);

  useEffect(() => {
    setPage(1);
    setIsLoading(true);
    fetchAdmins(1).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setPage(1);
      setIsLoading(true);
      fetchAdmins(1).finally(() => setIsLoading(false));
    }, 500);
    setSearchTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchAdmins(1);
    setIsRefreshing(false);
  }, [fetchAdmins]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchAdmins(next, true);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, page, fetchAdmins]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const renderAdmin = ({ item }: { item: SuperAdminUser }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/(admin)/sa-user-detail', params: { userId: item.id } } as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: item.role === 'SUPER_ADMIN' ? colors.errorLight : colors.warningLight }]}>
        <Ionicons
          name={item.role === 'SUPER_ADMIN' ? 'shield' : 'shield-half-outline'}
          size={22}
          color={item.role === 'SUPER_ADMIN' ? colors.error : colors.warning}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.email}
        </Text>
        <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
        <View style={styles.meta}>
          <Badge
            label={item.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
            variant={item.role === 'SUPER_ADMIN' ? 'error' : 'warning'}
            size="sm"
          />
          <Badge
            label={item.isActive ? 'Active' : 'Inactive'}
            variant={item.isActive ? 'success' : 'error'}
            size="sm"
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        {item.lastLoginAt && (
          <Text style={styles.lastLogin}>Last: {formatDate(item.lastLoginAt)}</Text>
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
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Admin Accounts</Text>
            <Text style={styles.headerSubtitle}>Admin • Manage admin team</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search admins..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} width="100%" height={80} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
            ))}
          </View>
        ) : admins.length === 0 ? (
          <EmptyState icon="shield-outline" title="No admins found" description="Try a different search" />
        ) : (
          <FlatList
            data={admins}
            renderItem={renderAdmin}
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
    searchContainer: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
      gap: Spacing.sm, ...Shadows.sm,
    },
    searchInput: {
      flex: 1, ...Typography.body, color: colors.textPrimary, paddingVertical: Spacing.xs,
    },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 30 },
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
    },
    avatar: {
      width: 46, height: 46, borderRadius: 23,
      alignItems: 'center', justifyContent: 'center',
    },
    info: { flex: 1, marginLeft: Spacing.md },
    name: { ...Typography.bodyMedium, color: colors.textPrimary },
    email: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    meta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    right: { alignItems: 'flex-end', gap: 2 },
    dateText: { ...Typography.small, color: colors.textMuted },
    lastLogin: { ...Typography.small, color: colors.textMuted, fontSize: 9 },
  });
