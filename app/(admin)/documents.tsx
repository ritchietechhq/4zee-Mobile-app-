import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, RefreshControl, TouchableOpacity, Alert,
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
import type { DocumentTemplate, AdminDocument, DocumentStatistics } from '@/types/admin';

type Tab = 'templates' | 'documents';

export default function DocumentsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [stats, setStats] = useState<DocumentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [templatesRes, docsRes, statsRes] = await Promise.all([
        adminService.getDocumentTemplates(),
        adminService.getDocuments({ limit: 50 }),
        adminService.getDocumentStatistics(),
      ]);
      setTemplates(templatesRes);
      setDocuments(docsRes);
      setStats(statsRes);
    } catch (e) {
      console.error('Documents fetch error:', e);
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

  const handleDeleteTemplate = (id: string, name: string) => {
    Alert.alert('Delete Template', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteDocumentTemplate(id);
            Alert.alert('Deleted', 'Template removed');
            fetchData();
          } catch (e: any) {
            Alert.alert('Error', e?.error?.message || 'Delete failed');
          }
        },
      },
    ]);
  };

  const renderTemplate = ({ item }: { item: DocumentTemplate }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.type}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Badge label={item.isActive ? 'Active' : 'Inactive'} variant={item.isActive ? 'success' : 'default'} size="sm" />
          <TouchableOpacity onPress={() => handleDeleteTemplate(item.id, item.name)}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderDocument = ({ item }: { item: AdminDocument }) => (
    <Card style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
          <Ionicons name="document-outline" size={20} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.type}</Text>
          <Text style={styles.cardSubtitle}>
            {item.client?.firstName} {item.client?.lastName}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Badge label={item.status} variant={item.status === 'GENERATED' ? 'success' : item.status === 'SIGNED' ? 'info' : 'default'} size="sm" />
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
          <Text style={styles.headerTitle}>Documents</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {stats && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{stats.totalDocuments}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            {Object.entries(stats.byType).map(([type, count]) => (
              <View key={type} style={styles.statPill}>
                <Text style={styles.statValue}>{count}</Text>
                <Text style={styles.statLabel}>{type}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['templates', 'documents'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setActiveTab(t)}
              style={[styles.tab, activeTab === t && { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.tabText, { color: activeTab === t ? '#fff' : colors.textSecondary }]}>
                {t === 'templates' ? `Templates (${templates.length})` : `Documents (${documents.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={70} style={{ marginBottom: 12 }} />)}
          </View>
        ) : activeTab === 'templates' ? (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={renderTemplate}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={<EmptyState icon="document-text-outline" title="No Templates" description="No document templates found." />}
          />
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={renderDocument}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={<EmptyState icon="document-outline" title="No Documents" description="No generated documents found." />}
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
    tabRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
    },
    tabText: { ...Typography.captionMedium },
    listContent: { padding: Spacing.xl, paddingBottom: 30 },
    card: { marginBottom: Spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    cardSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    dateText: { ...Typography.small, color: colors.textMuted, marginTop: 4 },
  });
