import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminSale } from '@/types/admin';

export default function SalesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [sales, setSales] = useState<AdminSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getSales();
      setSales(data);
    } catch (e) {
      console.error('Sales fetch error:', e);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const renderItem = ({ item }: { item: AdminSale }) => (
    <Card variant="elevated" padding="lg" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: item.type === 'ONLINE' ? colors.primaryLight : colors.warningLight }]}>
          <Ionicons
            name={item.type === 'ONLINE' ? 'globe-outline' : 'storefront-outline'}
            size={20}
            color={item.type === 'ONLINE' ? colors.primary : colors.warning}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.property?.title}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(item.amount)}</Text>
        </View>
        <Badge label={item.type} variant={item.type === 'ONLINE' ? 'info' : 'warning'} size="sm" />
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Client</Text>
          <Text style={styles.detailValue}>{item.client?.firstName} {item.client?.lastName}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Realtor</Text>
          <Text style={styles.detailValue}>{item.realtor?.firstName} {item.realtor?.lastName}</Text>
        </View>
      </View>

      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
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
          <Text style={styles.headerTitle}>Sales</Text>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/record-sale' as any)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={120} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="cart-outline"
                title="No Sales"
                description="No sales have been recorded yet."
                actionLabel="Record Offline Sale"
                onAction={() => router.push('/(admin)/record-sale' as any)}
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
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: { marginBottom: Spacing.lg },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardInfo: { flex: 1 },
    cardTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    cardAmount: { ...Typography.h4, color: colors.success, marginTop: 2 },
    detailRow: {
      flexDirection: 'row',
      gap: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    detailItem: {},
    detailLabel: { ...Typography.small, color: colors.textMuted },
    detailValue: { ...Typography.captionMedium, color: colors.textPrimary },
    dateText: { ...Typography.small, color: colors.textMuted },
  });
