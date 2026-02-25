// ============================================================
// Realtor Leads Screen — Property Inquiries
// Uses GET /realtor/leads API for property inquiry leads
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { leadsService, type Lead, type LeadStatus } from '@/services/leads.service';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { FLATLIST_PERF_PROPS } from '@/utils/performance';
import { useRealtorColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

export default function LeadsScreen() {
  const colors = useRealtorColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<LeadStatus>('all');

  const fetchLeads = useCallback(async (page = 1, append = false) => {
    try {
      const status = filter !== 'all' ? filter : undefined;
      const res = await leadsService.getLeads({ status, page, limit: 15 });
      
      if (append && page > 1) {
        setLeads((prev) => [...prev, ...res.leads]);
      } else {
        setLeads(res.leads);
      }
      setTotalLeads(res.total);
      setUnreadCount(res.unreadCount);
      setCurrentPage(page);
      setHasNext(res.pagination.hasNext);
    } catch (error) {
      if (__DEV__) console.warn('[Leads] fetch error', error);
    }
  }, [filter]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchLeads(1);
      setIsLoading(false);
    })();
  }, [fetchLeads]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchLeads(1);
    setIsRefreshing(false);
  };

  const loadMore = async () => {
    if (!hasNext || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchLeads(currentPage + 1, true);
    setIsLoadingMore(false);
  };

  const handleLeadPress = (lead: Lead) => {
    const propImages = lead.property.images ?? lead.property.mediaUrls ?? [];
    // Navigate to messages with this conversation
    router.push({
      pathname: '/(realtor)/messages/[id]' as any,
      params: {
        id: lead.id,
        name: lead.client.name || 'Client',
        propertyTitle: lead.property.title,
        propertyId: lead.property.id || '',
        propertyImage: propImages[0] || '',
        propertyPrice: lead.property.price ? `${lead.property.price}` : '',
        propertyLocation: lead.property.location || '',
      },
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string, propertyTitle: string) => {
    const subject = encodeURIComponent(`Re: ${propertyTitle}`);
    Linking.openURL(`mailto:${email}?subject=${subject}`);
  };

  // ── Summary Header ────────────────────────────────────────
  const SummaryHeader = () => (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, { borderLeftColor: colors.primary }]}>
        <Ionicons name="people" size={20} color={colors.primary} />
        <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalLeads}</Text>
        <Text style={styles.summaryLabel}>Total Leads</Text>
      </View>
      <View style={[styles.summaryCard, { borderLeftColor: colors.error }]}>
        <Ionicons name="mail-unread" size={20} color={colors.error} />
        <Text style={[styles.summaryValue, { color: colors.error }]}>{unreadCount}</Text>
        <Text style={styles.summaryLabel}>Unread</Text>
      </View>
      <View style={[styles.summaryCard, { borderLeftColor: colors.success }]}>
        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        <Text style={[styles.summaryValue, { color: colors.success }]}>{totalLeads - unreadCount}</Text>
        <Text style={styles.summaryLabel}>Responded</Text>
      </View>
    </View>
  );

  // ── Filter Chips ──────────────────────────────────────────
  const renderFilters = () => {
    const filters: Array<{ key: LeadStatus; label: string; count?: number }> = [
      { key: 'all', label: 'All', count: totalLeads },
      { key: 'unread', label: 'Unread', count: unreadCount },
      { key: 'read', label: 'Responded', count: totalLeads - unreadCount },
    ];
    return (
      <View>
        <SummaryHeader />
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}{f.count != null ? ` (${f.count})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // ── Lead Card ─────────────────────────────────────────────
  const renderLead = ({ item }: { item: Lead }) => {
    const isUnread = item.status === 'unread' || item.unreadCount > 0;
    const clientInitial = item.client.name?.charAt(0)?.toUpperCase() || '?';
    const propertyImage = item.property.images?.[0] || item.property.mediaUrls?.[0];
    const timeAgo = getTimeAgo(item.updatedAt || item.createdAt);

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleLeadPress(item)}>
        <Card variant="outlined" padding="lg" style={[styles.leadCard, isUnread && styles.leadCardUnread]}>
          <View style={styles.leadRow}>
            {/* Property thumbnail */}
            {propertyImage ? (
              <Image source={{ uri: propertyImage }} style={styles.propertyThumb} contentFit="cover" />
            ) : (
              <View style={[styles.propertyThumb, styles.propertyThumbPlaceholder]}>
                <Ionicons name="home" size={20} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.leadContent}>
              {/* Client name + unread badge */}
              <View style={styles.leadHeader}>
                <View style={[styles.clientAvatar, { backgroundColor: isUnread ? colors.primaryLight : colors.surface }]}>
                  <Text style={[styles.clientAvatarText, { color: isUnread ? colors.primary : colors.textSecondary }]}>
                    {clientInitial}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.clientName, isUnread && styles.clientNameUnread]} numberOfLines={1}>
                    {item.client.name}
                  </Text>
                  <Text style={styles.propertyName} numberOfLines={1}>{item.property.title}</Text>
                </View>
                {isUnread && item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
                  </View>
                )}
              </View>

              {/* Last message preview */}
              {item.lastMessage && (
                <Text style={[styles.lastMessage, isUnread && styles.lastMessageUnread]} numberOfLines={2}>
                  {item.lastMessage.content}
                </Text>
              )}

              {/* Meta info */}
              <View style={styles.leadMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>{item.property.location}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.metaText}>{formatCurrency(item.property.price)}</Text>
                </View>
                <Text style={styles.timeAgo}>{timeAgo}</Text>
              </View>
            </View>
          </View>

          {/* Contact actions */}
          <View style={styles.actionRow}>
            {item.client.phone && (
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleCall(item.client.phone!)}
              >
                <Ionicons name="call-outline" size={16} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>Call</Text>
              </TouchableOpacity>
            )}
            {item.client.email && (
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleEmail(item.client.email!, item.property.title)}
              >
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Email</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleLeadPress(item)}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.white} />
              <Text style={[styles.actionText, { color: colors.white }]}>Reply</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonWrap}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="31%" height={80} style={{ borderRadius: BorderRadius.lg }} />
        ))}
      </View>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} width="100%" height={180} style={{ marginBottom: Spacing.md, borderRadius: BorderRadius.lg }} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Leads</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} new inquiries` : 'Property inquiries from clients'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshBtn}
          onPress={onRefresh}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? renderSkeleton() : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLead}
          ListHeaderComponent={renderFilters}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No Leads Yet"
              description="When clients inquire about your properties, their messages will appear here."
            />
          }
          ListFooterComponent={isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          {...FLATLIST_PERF_PROPS}
        />
      )}
    </SafeAreaView>
  );
}

/** Helper to format relative time */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: Spacing.xl, 
    paddingTop: Spacing.lg, 
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.h3, color: colors.textPrimary },
  headerSub: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Summary
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryCard: {
    flex: 1, backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderLeftWidth: 3, alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  summaryValue: { ...Typography.h4, fontWeight: '700', marginTop: Spacing.xs },
  summaryLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

  // Filters
  filterRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  filterChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...Typography.captionMedium, color: colors.textSecondary },
  filterTextActive: { color: colors.white },
  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },

  // Lead Card
  leadCard: { marginBottom: Spacing.md, backgroundColor: colors.cardBackground },
  leadCardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  leadRow: { flexDirection: 'row', gap: Spacing.md },
  
  propertyThumb: { 
    width: 70, height: 70, borderRadius: BorderRadius.md,
    backgroundColor: colors.surface,
  },
  propertyThumbPlaceholder: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },

  leadContent: { flex: 1 },
  leadHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  
  clientAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.borderLight,
  },
  clientAvatarText: { ...Typography.captionMedium, fontWeight: '700' },
  clientName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  clientNameUnread: { fontWeight: '700' },
  propertyName: { ...Typography.small, color: colors.textMuted },
  
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { ...Typography.small, color: colors.white, fontWeight: '700', fontSize: 10 },

  lastMessage: { 
    ...Typography.caption, 
    color: colors.textSecondary, 
    marginVertical: Spacing.xs,
    lineHeight: 18,
  },
  lastMessageUnread: { color: colors.textPrimary, fontWeight: '500' },

  leadMeta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: '40%' },
  metaText: { ...Typography.small, color: colors.textMuted },
  timeAgo: { ...Typography.small, color: colors.textTertiary, marginLeft: 'auto' },

  actionRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginLeft: 'auto',
  },
  actionText: { ...Typography.captionMedium },

  skeletonWrap: { paddingHorizontal: Spacing.xl },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
