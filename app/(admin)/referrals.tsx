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
import type { AdminReferral, AdminReferralStatistics } from '@/types/admin';

export default function ReferralsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [referrals, setReferrals] = useState<AdminReferral[]>([]);
  const [stats, setStats] = useState<AdminReferralStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [referralsRes, statsRes] = await Promise.all([
        adminService.getReferrals({ limit: 50 }),
        adminService.getReferralStatistics(),
      ]);
      setReferrals(referralsRes?.items ?? []);
      setStats(statsRes);
    } catch (e) {
      console.error('Referrals fetch error:', e);
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

  const renderItem = ({ item }: { item: AdminReferral }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="git-branch-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {item.referrer?.firstName} {item.referrer?.lastName}
          </Text>
          <Text style={styles.cardSubtitle}>
            → {item.referred?.firstName} {item.referred?.lastName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Badge label={item.status} variant={item.status === 'COMPLETED' ? 'success' : item.status === 'PENDING' ? 'warning' : 'default'} size="sm" />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>
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
          <Text style={styles.headerTitle}>Referrals</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{stats.totalLinks}</Text>
              <Text style={styles.statLabel}>Links</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{stats.totalVisits}</Text>
              <Text style={styles.statLabel}>Visits</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.totalConversions}</Text>
              <Text style={styles.statLabel}>Conversions</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {(stats.conversionRate * 100).toFixed(1)}%
              </Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </ScrollView>
        )}

        {/* Top Performers */}
        {stats && stats.topPerformers?.length > 0 && (
          <View style={styles.topSection}>
            <Text style={styles.sectionTitle}>Top Performers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm }}>
              {stats.topPerformers.map((p, i) => (
                <View key={p.realtorId} style={styles.topCard}>
                  <Text style={styles.topRank}>{i + 1}</Text>
                  <Text style={styles.topName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.topConversions}>{p.conversions} conv.</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={70} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={referrals}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState icon="git-network-outline" title="No Referrals" description="No referrals found." />
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
    statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    topSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    sectionTitle: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    topCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
      minWidth: 90,
    },
    topRank: { ...Typography.h4, color: colors.primary },
    topName: { ...Typography.caption, color: colors.textPrimary, marginTop: 2 },
    topConversions: { ...Typography.small, color: colors.success, marginTop: 2 },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: { marginBottom: Spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    cardSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    dateText: { ...Typography.small, color: colors.textMuted, marginTop: 4 },
  });
