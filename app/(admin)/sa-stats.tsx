import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCompactNumber } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SuperAdminStats as SuperAdminStatsType } from '@/types/admin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SuperAdminStatsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [stats, setStats] = useState<SuperAdminStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminService.getSystemStats();
      setStats(data);
    } catch (e) {
      console.error('Super admin stats error:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  }, [fetchStats]);

  const ROLE_COLORS: Record<string, { color: string; bg: string; icon: string }> = {
    CLIENT: { color: colors.primary, bg: colors.primaryLight, icon: 'person-outline' },
    REALTOR: { color: colors.teal, bg: colors.tealLight, icon: 'briefcase-outline' },
    ADMIN: { color: colors.warning, bg: colors.warningLight, icon: 'shield-outline' },
    SUPER_ADMIN: { color: colors.error, bg: colors.errorLight, icon: 'shield-checkmark-outline' },
  };

  const roleEntries = stats?.byRole ? Object.entries(stats.byRole) : [];
  const maxRoleCount = Math.max(...roleEntries.map(([, v]) => v), 1);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>System Statistics</Text>
              <Text style={styles.headerSubtitle}>Admin • User analytics overview</Text>
            </View>
          </View>

          {isLoading ? (
            <>
              <Skeleton width="100%" height={120} style={{ borderRadius: BorderRadius.lg, marginBottom: Spacing.lg }} />
              <Skeleton width="100%" height={200} style={{ borderRadius: BorderRadius.lg, marginBottom: Spacing.lg }} />
              <Skeleton width="100%" height={200} style={{ borderRadius: BorderRadius.lg }} />
            </>
          ) : stats ? (
            <>
              {/* ─── Hero Stats ─── */}
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroRow}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroValue}>{formatCompactNumber(stats.totalUsers)}</Text>
                    <Text style={styles.heroLabel}>Total Users</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroValue}>{formatCompactNumber(stats.activeUsers)}</Text>
                    <Text style={styles.heroLabel}>Active</Text>
                  </View>
                  <View style={styles.heroDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroValue}>{formatCompactNumber(stats.inactiveUsers)}</Text>
                    <Text style={styles.heroLabel}>Inactive</Text>
                  </View>
                </View>
                <View style={styles.heroFooter}>
                  <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.heroFooterText}>
                    {stats.recentRegistrations} new registrations recently
                  </Text>
                </View>
              </LinearGradient>

              {/* ─── Users by Role ─── */}
              <Text style={styles.sectionTitle}>Users by Role</Text>
              <Card variant="elevated" padding="lg">
                {roleEntries.map(([role, count]) => {
                  const rc = ROLE_COLORS[role] ?? { color: colors.textMuted, bg: colors.border, icon: 'person-outline' };
                  const pct = Math.round((count / (stats.totalUsers || 1)) * 100);
                  const barWidth = (count / maxRoleCount) * 100;
                  return (
                    <View key={role} style={styles.roleRow}>
                      <View style={[styles.roleIcon, { backgroundColor: rc.bg }]}>
                        <Ionicons name={rc.icon as any} size={18} color={rc.color} />
                      </View>
                      <View style={styles.roleInfo}>
                        <View style={styles.roleHeader}>
                          <Text style={styles.roleName}>{role.replace('_', ' ')}</Text>
                          <Text style={styles.roleCount}>{formatCompactNumber(count)} ({pct}%)</Text>
                        </View>
                        <View style={styles.barBg}>
                          <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: rc.color }]} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Card>

              {/* ─── Registration Trend ─── */}
              {stats.registrationsByMonth && stats.registrationsByMonth.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Registration Trend</Text>
                  <Card variant="elevated" padding="lg">
                    {stats.registrationsByMonth.slice(-6).map((item) => {
                      const maxMonthCount = Math.max(
                        ...stats.registrationsByMonth.slice(-6).map((m) => m.count), 1,
                      );
                      const barWidth = (item.count / maxMonthCount) * 100;
                      return (
                        <View key={item.month} style={styles.trendRow}>
                          <Text style={styles.trendMonth}>{item.month}</Text>
                          <View style={styles.trendBarBg}>
                            <View style={[styles.trendBarFill, { width: `${barWidth}%` }]} />
                          </View>
                          <Text style={styles.trendCount}>{item.count}</Text>
                        </View>
                      );
                    })}
                  </Card>
                </>
              )}

              {/* ─── Quick Actions ─── */}
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                {[
                  { title: 'All Users', icon: 'people-outline', color: colors.primary, bg: colors.primaryLight, route: '/(admin)/sa-users' },
                  { title: 'Admins', icon: 'shield-outline', color: colors.warning, bg: colors.warningLight, route: '/(admin)/sa-admins' },
                  { title: 'Realtors', icon: 'briefcase-outline', color: colors.teal, bg: colors.tealLight, route: '/(admin)/sa-realtors' },
                  { title: 'Clients', icon: 'person-outline', color: colors.indigo, bg: colors.indigoLight, route: '/(admin)/sa-clients' },
                ].map((action) => (
                  <TouchableOpacity
                    key={action.title}
                    style={styles.actionCard}
                    onPress={() => router.push(action.route as any)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIcon, { backgroundColor: action.bg }]}>
                      <Ionicons name={action.icon as any} size={22} color={action.color} />
                    </View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 40 },
    header: {
      flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    heroCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    heroStat: { alignItems: 'center', flex: 1 },
    heroValue: { ...Typography.h2, color: '#fff', fontWeight: '800' },
    heroLabel: { ...Typography.caption, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    heroDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
    heroFooter: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      marginTop: Spacing.lg, paddingTop: Spacing.md,
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)',
    },
    heroFooterText: { ...Typography.caption, color: 'rgba(255,255,255,0.8)' },
    sectionTitle: {
      ...Typography.h4, color: colors.textPrimary, marginTop: Spacing.xl, marginBottom: Spacing.md,
    },
    roleRow: {
      flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg, gap: Spacing.md,
    },
    roleIcon: {
      width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    },
    roleInfo: { flex: 1 },
    roleHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
    roleName: { ...Typography.captionMedium, color: colors.textPrimary, textTransform: 'capitalize' },
    roleCount: { ...Typography.captionMedium, color: colors.textSecondary },
    barBg: {
      height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
    trendRow: {
      flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.md,
    },
    trendMonth: { ...Typography.caption, color: colors.textSecondary, width: 50 },
    trendBarBg: {
      flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden',
    },
    trendBarFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
    trendCount: { ...Typography.captionMedium, color: colors.textPrimary, width: 36, textAlign: 'right' },
    actionsGrid: { gap: Spacing.md },
    actionCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
      padding: Spacing.lg, ...Shadows.sm,
    },
    actionIcon: {
      width: 40, height: 40, borderRadius: BorderRadius.md,
      alignItems: 'center', justifyContent: 'center',
    },
    actionTitle: {
      ...Typography.bodyMedium, color: colors.textPrimary, flex: 1, marginLeft: Spacing.lg,
    },
  });
