import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { adminService } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNaira } from '@/utils/formatCurrency';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { Property } from '@/types';
import api from '@/services/api';

export default function PropertiesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get<any>('/properties/search', { limit: 50 });
      const items = res.data?.items ?? res.data ?? [];
      setProperties(Array.isArray(items) ? items : []);
    } catch (e) {
      console.error('Properties fetch error:', e);
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

  const handleDelete = useCallback(
    (id: string, title: string) => {
      Alert.alert('Delete Property', `Are you sure you want to delete "${title}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteProperty(id);
              setProperties((prev) => prev.filter((p) => p.id !== id));
              Alert.alert('Done', 'Property deleted');
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Failed to delete property');
            }
          },
        },
      ]);
    },
    [],
  );

  const availabilityBadge = (a: string) => {
    switch (a) {
      case 'AVAILABLE': return 'success';
      case 'RESERVED': return 'warning';
      case 'SOLD': return 'error';
      default: return 'default';
    }
  };

  const renderItem = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      {item.images?.[0] && (
        <Image source={{ uri: item.images[0] }} style={styles.cardImage} contentFit="cover" />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Badge label={item.availability} variant={availabilityBadge(item.availability)} size="sm" />
        </View>
        <Text style={styles.cardLocation} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color={colors.textMuted} /> {item.location}
        </Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardPrice}>{formatNaira(item.price)}</Text>
          <View style={styles.cardMeta}>
            {item.type && (
              <View style={[styles.typeBadge, { backgroundColor: colors.surface }]}>
                <Text style={styles.typeText}>{item.type}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.errorLight }]}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
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
          <Text style={styles.headerTitle}>Properties</Text>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/create-property' as any)}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={140} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="business-outline"
                title="No Properties"
                description="No properties found. Create your first listing."
                actionLabel="Create Property"
                onAction={() => router.push('/(admin)/create-property' as any)}
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
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
      ...Shadows.md,
    },
    cardImage: {
      width: '100%',
      height: 160,
    },
    cardBody: {
      padding: Spacing.lg,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: { ...Typography.bodyMedium, color: colors.textPrimary, flex: 1, marginRight: Spacing.sm },
    cardLocation: { ...Typography.caption, color: colors.textMuted, marginVertical: Spacing.xs },
    cardPrice: { ...Typography.h4, color: colors.primary },
    cardMeta: { flexDirection: 'row', gap: Spacing.sm },
    typeBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    typeText: { ...Typography.small, color: colors.textSecondary },
    cardActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    actionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
