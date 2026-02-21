import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { FilterChip } from '@/components/ui/FilterChip';
import { formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AnalyticsPeriod, TopRealtorRanked } from '@/types/admin';

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: '7d', label: '7 Days' },
  { key: '28d', label: '28 Days' },
  { key: '3m', label: '3 Months' },
  { key: '1y', label: '1 Year' },
  { key: 'all', label: 'All Time' },
];

export default function TopRealtorsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [period, setPeriod] = useState<AnalyticsPeriod>('28d');
  const [realtors, setRealtors] = useState<TopRealtorRanked[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (p: AnalyticsPeriod) => {
    try {
      const data = await adminService.getTopRealtorsRanked(p);
      setRealtors(data);
    } catch (e) {
      console.error('Top realtors fetch error:', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData(period).finally(() => setIsLoading(false));
  }, []);

  const onPeriodChange = useCallback(async (p: AnalyticsPeriod) => {
    setPeriod(p);
    setIsRefreshing(true);
    await fetchData(p);
    setIsRefreshing(false);
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData(period);
    setIsRefreshing(false);
  }, [fetchData, period]);

  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [colors.warning, colors.slate, '#CD7F32'];

  const renderPodium = () => {
    if (realtors.length < 3) return null;
    const top3 = realtors.slice(0, 3);
    // Re-order for podium: 2nd, 1st, 3rd
    const ordered = [top3[1], top3[0], top3[2]];
    const heights = [90, 120, 70];

    return (
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.podiumGradient}
      >
        <Text style={styles.podiumTitle}>🏆 Leaderboard</Text>
        <View style={styles.podiumRow}>
          {ordered.map((r, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <View key={r.id} style={styles.podiumCol}>
                <View style={[styles.podiumAvatar, { borderColor: podiumColors[actualRank - 1] }]}>
                  <Text style={styles.podiumAvatarText}>
                    {(r.firstName?.[0] ?? '') + (r.lastName?.[0] ?? '')}
                  </Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {r.firstName}
                </Text>
                <Text style={styles.podiumAmount}>
                  {formatCompactNumber(r.totalSalesValue)}
                </Text>
                <View style={[styles.podiumBar, { height: heights[i] }]}>
                  <Text style={styles.podiumRank}>{medals[actualRank - 1]}</Text>
                  <Text style={styles.podiumSales}>{r.salesCount} sales</Text>
                </View>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    );
  };

  const renderItem = ({ item, index }: { item: TopRealtorRanked; index: number }) => (
    <Card variant="elevated" padding="md" style={styles.realtorCard}>
      <View style={styles.realtorRow}>
        <View style={[
          styles.rankBadge,
          {
            backgroundColor: index < 3
              ? `${podiumColors[index]}20`
              : colors.surface,
          },
        ]}>
          <Text style={[
            styles.rankText,
            { color: index < 3 ? podiumColors[index] : colors.textSecondary },
          ]}>
            {index < 3 ? medals[index] : `#${item.rank || index + 1}`}
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.firstName?.[0] ?? '') + (item.lastName?.[0] ?? '')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.realtorName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.realtorMeta}>
            {item.salesCount} sales
          </Text>
        </View>
        <View style={styles.realtorAmounts}>
          <Text style={styles.realtorSalesVal}>
            {formatCompactNumber(item.totalSalesValue)}
          </Text>
          <Text style={styles.realtorCommVal}>
            {formatCompactNumber(item.totalCommission)} comm.
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderHeader = () => (
    <>
      {/* Period selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.periodRow}
      >
        {PERIODS.map((p) => (
          <FilterChip
            key={p.key}
            label={p.label}
            selected={period === p.key}
            onPress={() => onPeriodChange(p.key)}
          />
        ))}
      </ScrollView>

      {/* Podium */}
      {renderPodium()}

      {/* List header */}
      <Text style={styles.sectionTitle}>Full Rankings</Text>
    </>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Realtors</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={200} style={{ marginBottom: 16 }} />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={72} style={{ marginBottom: 10 }} />
            ))}
          </View>
        ) : (
          <FlatList
            data={realtors}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={
              <Card variant="elevated" padding="lg" style={{ alignItems: 'center', marginHorizontal: Spacing.xl }}>
                <Ionicons name="podium-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No realtor data for this period</Text>
              </Card>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}

// Need this imported for the horizontal ScrollView in renderHeader
import { ScrollView } from 'react-native';

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
    listContent: { padding: Spacing.xl, paddingBottom: 40 },

    // Period
    periodRow: { gap: Spacing.sm, marginBottom: Spacing.xl },

    // Podium
    podiumGradient: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    podiumTitle: { ...Typography.h3, color: '#fff', textAlign: 'center', marginBottom: Spacing.lg },
    podiumRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: Spacing.md,
    },
    podiumCol: { alignItems: 'center', flex: 1 },
    podiumAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      marginBottom: 4,
    },
    podiumAvatarText: { ...Typography.captionMedium, color: '#fff' },
    podiumName: { ...Typography.captionMedium, color: '#fff', marginBottom: 2 },
    podiumAmount: { ...Typography.small, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
    podiumBar: {
      width: '90%',
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderTopLeftRadius: BorderRadius.md,
      borderTopRightRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
    },
    podiumRank: { fontSize: 20 },
    podiumSales: { ...Typography.small, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

    // Section
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginBottom: Spacing.md,
    },

    // List items
    realtorCard: { marginBottom: Spacing.sm },
    realtorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    rankBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rankText: { ...Typography.captionMedium },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.captionMedium },
    realtorName: { ...Typography.bodyMedium, color: colors.textPrimary },
    realtorMeta: { ...Typography.caption, color: colors.textSecondary },
    realtorAmounts: { alignItems: 'flex-end' },
    realtorSalesVal: { ...Typography.bodySemiBold, color: colors.success },
    realtorCommVal: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    emptyText: {
      ...Typography.body,
      color: colors.textMuted,
      marginTop: Spacing.md,
    },
  });
