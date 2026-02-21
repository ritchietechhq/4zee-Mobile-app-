import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminSupportTicket, AdminTicketStatistics } from '@/types/admin';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;

export default function SupportTicketsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [stats, setStats] = useState<AdminTicketStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50 };
      if (activeTab !== 'ALL') params.status = activeTab;
      const [ticketsRes, statsRes] = await Promise.all([
        adminService.getTickets(params),
        adminService.getTicketStatistics(),
      ]);
      setTickets(ticketsRes?.items ?? []);
      setStats(statsRes);
    } catch (e) {
      console.error('Tickets fetch error:', e);
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
      case 'OPEN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'RESOLVED': return 'success';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case 'URGENT': return colors.error;
      case 'HIGH': return colors.warning;
      case 'MEDIUM': return colors.primary;
      case 'LOW': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const renderItem = ({ item }: { item: AdminSupportTicket }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push({ pathname: '/(admin)/ticket-detail', params: { id: item.id } })}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <View style={[styles.priorityDot, { backgroundColor: priorityColor(item.priority) }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
          <Text style={styles.userText}>
            {item.user?.firstName ?? item.user?.email?.split('@')[0] ?? 'User'} • {item.priority}
          </Text>
        </View>
        <Badge label={item.status.replace('_', ' ')} variant={statusBadge(item.status)} size="sm" />
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        {item.assignee && (
          <Text style={styles.assigneeText}>
            Assigned: {item.assignee.email?.split('@')[0]}
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
          <Text style={styles.headerTitle}>Support Tickets</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            {Object.entries(stats.byStatus).map(([key, val]) => (
              <View key={key} style={styles.statPill}>
                <Text style={styles.statValue}>{val}</Text>
                <Text style={styles.statLabel}>{key.replace('_', ' ')}</Text>
              </View>
            ))}
          </ScrollView>
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
                {tab.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={80} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={tickets}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState icon="chatbubbles-outline" title="No Tickets" description={`No ${activeTab.toLowerCase().replace('_', ' ')} tickets found.`} />
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
    statsRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md },
    statPill: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      minWidth: 80,
    },
    statValue: { ...Typography.bodySemiBold, color: colors.textPrimary },
    statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
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
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    subject: { ...Typography.bodyMedium, color: colors.textPrimary },
    userText: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    cardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    dateText: { ...Typography.small, color: colors.textMuted },
    assigneeText: { ...Typography.small, color: colors.textSecondary },
  });
