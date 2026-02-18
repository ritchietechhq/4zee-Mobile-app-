import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { leadService } from '@/services/notification.service';
import { Lead, LeadStatus } from '@/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const STATUS_FILTERS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Qualified', value: 'qualified' },
  { label: 'Converted', value: 'converted' },
  { label: 'Lost', value: 'lost' },
];

export default function RealtorLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');

  const fetchLeads = useCallback(async () => {
    try {
      const data = await leadService.getLeads();
      setLeads(data);
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchLeads();
  };

  const handleUpdateStatus = async (lead: Lead, newStatus: LeadStatus) => {
    try {
      await leadService.updateLeadStatus(lead.id, newStatus);
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
      );
    } catch {
      Alert.alert('Error', 'Failed to update lead status.');
    }
  };

  const getStatusVariant = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'contacted':
        return 'warning';
      case 'qualified':
        return 'default';
      case 'converted':
        return 'success';
      case 'lost':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'sparkles';
      case 'contacted':
        return 'chatbubble-outline';
      case 'qualified':
        return 'checkmark-circle-outline';
      case 'converted':
        return 'trophy-outline';
      case 'lost':
        return 'close-circle-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const filteredLeads =
    filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  const renderLead = ({ item }: { item: Lead }) => (
    <Card variant="elevated" style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <View style={styles.leadAvatar}>
          <Text style={styles.leadAvatarText}>
            {item.clientName?.[0]?.toUpperCase() || 'C'}
          </Text>
        </View>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.clientName}</Text>
          <Text style={styles.leadEmail}>{item.clientEmail}</Text>
          {item.clientPhone && (
            <Text style={styles.leadPhone}>{item.clientPhone}</Text>
          )}
        </View>
        <Badge
          label={item.status}
          variant={getStatusVariant(item.status)}
          size="sm"
        />
      </View>

      {item.propertyTitle && (
        <View style={styles.propertyInfo}>
          <Ionicons name="home-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {item.propertyTitle}
          </Text>
        </View>
      )}

      {item.message && (
        <Text style={styles.leadMessage} numberOfLines={2}>
          {item.message}
        </Text>
      )}

      <View style={styles.leadDate}>
        <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
        <Text style={styles.leadDateText}>
          {new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Status Actions */}
      <View style={styles.statusActions}>
        {item.status === 'new' && (
          <Button
            title="Mark Contacted"
            variant="outline"
            size="sm"
            icon="chatbubble-outline"
            onPress={() => handleUpdateStatus(item, 'contacted')}
            style={styles.statusButton}
          />
        )}
        {item.status === 'contacted' && (
          <Button
            title="Mark Qualified"
            variant="outline"
            size="sm"
            icon="checkmark-circle-outline"
            onPress={() => handleUpdateStatus(item, 'qualified')}
            style={styles.statusButton}
          />
        )}
        {item.status === 'qualified' && (
          <>
            <Button
              title="Convert"
              size="sm"
              icon="trophy-outline"
              onPress={() => handleUpdateStatus(item, 'converted')}
              style={styles.statusButton}
            />
            <Button
              title="Lost"
              variant="outline"
              size="sm"
              icon="close-circle-outline"
              onPress={() => handleUpdateStatus(item, 'lost')}
              style={styles.statusButton}
            />
          </>
        )}
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={48} color={Colors.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No Leads Yet' : `No ${filter} leads`}
      </Text>
      <Text style={styles.emptySubtitle}>
        When clients inquire about your listings, they'll appear here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leads</Text>
        <Text style={styles.headerCount}>{leads.length} total</Text>
      </View>

      {/* Status Filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filter === item.value && styles.filterChipActive,
            ]}
            onPress={() => setFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Leads List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredLeads.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  headerCount: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadCard: {
    gap: Spacing.sm,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  leadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  leadEmail: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  leadPhone: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  propertyTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  leadMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  leadDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leadDateText: {
    ...Typography.small,
    color: Colors.textTertiary,
  },
  statusActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  statusButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
