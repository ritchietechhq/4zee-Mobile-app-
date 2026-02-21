import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { ActivityLog } from '@/types/admin';

const ACTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  CREATE: 'add-circle-outline',
  UPDATE: 'create-outline',
  DELETE: 'trash-outline',
  VIEW: 'eye-outline',
  LOGIN: 'log-in-outline',
  LOGOUT: 'log-out-outline',
  APPROVE: 'checkmark-circle-outline',
  REJECT: 'close-circle-outline',
  PAYMENT: 'cash-outline',
  DOWNLOAD: 'download-outline',
  SIGN: 'pencil-outline',
  EXPORT: 'share-outline',
};

export default function ActivityLogsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getActivityLogs({ limit: 100 });
      setLogs(data);
    } catch (e) {
      console.error('Activity logs fetch error:', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const actionBadge = (a: string) => {
    if (['APPROVE', 'CREATE', 'PAYMENT', 'LOGIN'].includes(a)) return 'success';
    if (['DELETE', 'REJECT', 'LOGOUT'].includes(a)) return 'error';
    if (['UPDATE', 'SIGN'].includes(a)) return 'warning';
    return 'info';
  };

  const renderItem = ({ item }: { item: ActivityLog }) => (
    <View style={styles.logItem}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name={ACTION_ICONS[item.action] ?? 'ellipsis-horizontal'}
          size={16}
          color={colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.logDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.logMeta}>
          <Badge label={item.action} variant={actionBadge(item.action)} size="sm" />
          <Text style={styles.entityText}>{item.entityType}</Text>
          {item.user?.email && (
            <Text style={styles.userText}>{item.user.email.split('@')[0]}</Text>
          )}
        </View>
      </View>
      <Text style={styles.timeText}>
        {new Date(item.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
        {'\n'}
        <Text style={{ fontSize: 10 }}>
          {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </Text>
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Activity Logs</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} width="100%" height={60} style={{ marginBottom: 8 }} />)}
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState icon="time-outline" title="No Activity" description="No activity logs found." />
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
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    logItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    logDesc: { ...Typography.body, color: colors.textPrimary },
    logMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    entityText: { ...Typography.small, color: colors.textMuted },
    userText: { ...Typography.small, color: colors.textSecondary },
    timeText: { ...Typography.small, color: colors.textMuted, textAlign: 'right' },
  });
