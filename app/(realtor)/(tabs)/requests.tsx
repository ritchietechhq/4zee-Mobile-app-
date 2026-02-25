// ============================================================
// Realtor Installment Requests Screen
// View and manage client payment plan requests
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { realtorService } from '@/services/realtor.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, BorderRadius, Shadows, Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { ThemeColors } from '@/constants/colors';
import type { InstallmentRequest, InstallmentRequestStatus } from '@/types';

type FilterStatus = 'ALL' | InstallmentRequestStatus;

export default function InstallmentRequestsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [requests, setRequests] = useState<InstallmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  
  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InstallmentRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const statusFilter = filter === 'ALL' ? undefined : filter;
      const response = await realtorService.getInstallmentRequests(statusFilter);
      setRequests(response.items ?? []);
    } catch (error) {
      if (__DEV__) console.error('Failed to fetch installment requests:', error);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [fetchRequests]);

  const handleApprove = useCallback(async (request: InstallmentRequest) => {
    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve this installment plan request for ${request.client.firstName} ${request.client.lastName}?\n\nThis will automatically generate a payment agreement.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const updated = await realtorService.approveInstallmentRequest(request.id);
              setRequests(prev => prev.map(r => r.id === request.id ? updated : r));
              Alert.alert('Success', 'Request approved! Agreement has been generated and sent to the client.');
            } catch (error) {
              Alert.alert('Error', 'Failed to approve request. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  }, []);

  const openRejectModal = useCallback((request: InstallmentRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectModalVisible(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection.');
      return;
    }
    setIsProcessing(true);
    try {
      const updated = await realtorService.rejectInstallmentRequest(selectedRequest.id, rejectionReason.trim());
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updated : r));
      setRejectModalVisible(false);
      setSelectedRequest(null);
      Alert.alert('Success', 'Request has been rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedRequest, rejectionReason]);

  const handleViewAgreement = useCallback(async (request: InstallmentRequest) => {
    if (request.agreement?.documentUrl) {
      await Linking.openURL(request.agreement.documentUrl);
    } else {
      Alert.alert('Agreement', 'Agreement document is being generated. Please check back later.');
    }
  }, []);

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    if (filter === 'ALL') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  const pendingCount = useMemo(() => (requests ?? []).filter(r => r.status === 'PENDING').length, [requests]);

  const renderFilterPill = (status: FilterStatus, label: string) => (
    <TouchableOpacity
      key={status}
      style={[styles.filterPill, filter === status && styles.filterPillActive]}
      onPress={() => setFilter(status)}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterPillText, filter === status && styles.filterPillTextActive]}>
        {label}
        {status === 'PENDING' && pendingCount > 0 && ` (${pendingCount})`}
      </Text>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: InstallmentRequest }) => {
    const statusVariant = 
      item.status === 'APPROVED' ? 'success' :
      item.status === 'REJECTED' ? 'error' : 'warning';

    return (
      <View style={styles.requestCard}>
        {/* Property Preview */}
        <View style={styles.propertyRow}>
          <Image
            source={{ uri: item.property.images?.[0] }}
            style={styles.propertyImage}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle} numberOfLines={1}>{item.property.title}</Text>
            <Text style={styles.propertyPrice}>{formatCurrency(item.property.price)}</Text>
            <Badge label={item.status} variant={statusVariant} size="sm" />
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientRow}>
          <View style={styles.clientAvatar}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.client.firstName} {item.client.lastName}</Text>
            {item.client.email && <Text style={styles.clientEmail}>{item.client.email}</Text>}
          </View>
        </View>

        {/* Plan Details */}
        <View style={styles.planDetails}>
          <Text style={styles.planName}>{item.paymentPlan.name}</Text>
          <View style={styles.planStats}>
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Down Payment</Text>
              <Text style={styles.planStatValue}>{formatCurrency(item.downPayment)}</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Monthly</Text>
              <Text style={styles.planStatValue}>{formatCurrency(item.monthlyAmount)}</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatLabel}>Duration</Text>
              <Text style={styles.planStatValue}>{item.paymentPlan.durationMonths} months</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
        </View>

        {/* Requested Date */}
        <Text style={styles.requestedAt}>
          Requested: {new Date(item.requestedAt).toLocaleDateString('en-NG', { 
            day: 'numeric', month: 'short', year: 'numeric' 
          })}
        </Text>

        {/* Actions */}
        {item.status === 'PENDING' && (
          <View style={styles.actions}>
            <Button
              title="Reject"
              variant="outline"
              size="sm"
              style={styles.actionBtn}
              onPress={() => openRejectModal(item)}
              disabled={isProcessing}
            />
            <Button
              title="Approve"
              variant="primary"
              size="sm"
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={() => handleApprove(item)}
              disabled={isProcessing}
              icon={<Ionicons name="checkmark" size={16} color={Colors.white} />}
            />
          </View>
        )}

        {item.status === 'APPROVED' && item.agreement && (
          <View style={styles.actions}>
            <Button
              title="View Agreement"
              variant="primary"
              size="sm"
              style={styles.actionBtn}
              onPress={() => handleViewAgreement(item)}
              icon={<Ionicons name="document-text-outline" size={16} color={Colors.white} />}
            />
          </View>
        )}

        {item.status === 'REJECTED' && item.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Ionicons name="close-circle" size={16} color={colors.error} />
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.propertyRow}>
        <Skeleton width={80} height={80} borderRadius={BorderRadius.lg} />
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width={60} height={22} borderRadius={BorderRadius.sm} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Installment Requests</Text>
        <Text style={styles.subtitle}>
          {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'No pending requests'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {renderFilterPill('ALL', 'All')}
        {renderFilterPill('PENDING', 'Pending')}
        {renderFilterPill('APPROVED', 'Approved')}
        {renderFilterPill('REJECTED', 'Rejected')}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map(i => <View key={i}>{renderSkeleton()}</View>)}
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title="No requests"
              description={filter === 'ALL' 
                ? "You don't have any installment requests yet. They'll appear here when clients request payment plans for your properties."
                : `No ${filter.toLowerCase()} requests found.`
              }
            />
          }
          ListFooterComponent={<View style={{ height: Spacing.xxxxl }} />}
        />
      )}

      {/* Rejection Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Request</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} disabled={isProcessing}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Please provide a reason for rejecting this installment plan request.
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor={colors.textMuted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isProcessing}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                style={{ flex: 1, marginRight: Spacing.sm }}
                onPress={() => setRejectModalVisible(false)}
                disabled={isProcessing}
              />
              <Button
                title={isProcessing ? 'Rejecting...' : 'Reject'}
                variant="danger"
                size="md"
                style={{ flex: 1 }}
                onPress={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Processing Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...Typography.h3, color: colors.textPrimary },
  subtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  
  filters: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.sm },
  filterPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { ...Typography.caption, color: colors.textSecondary, fontWeight: '600' },
  filterPillTextActive: { color: Colors.white },
  
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  
  requestCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...Shadows.sm },
  
  propertyRow: { flexDirection: 'row', marginBottom: Spacing.md },
  propertyImage: { width: 80, height: 80, borderRadius: BorderRadius.lg },
  propertyInfo: { flex: 1, marginLeft: Spacing.md, justifyContent: 'center' },
  propertyTitle: { ...Typography.bodyMedium, color: colors.textPrimary, marginBottom: 4 },
  propertyPrice: { ...Typography.bodySemiBold, color: colors.primary, marginBottom: 6 },
  
  clientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, marginBottom: Spacing.sm },
  clientAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  clientInfo: { flex: 1, marginLeft: Spacing.sm },
  clientName: { ...Typography.bodyMedium, color: colors.textPrimary },
  clientEmail: { ...Typography.caption, color: colors.textMuted },
  
  planDetails: { backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.sm },
  planName: { ...Typography.bodySemiBold, color: colors.textPrimary, marginBottom: Spacing.sm },
  planStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  planStat: { alignItems: 'center' },
  planStatLabel: { ...Typography.caption, color: colors.textMuted, marginBottom: 2 },
  planStatValue: { ...Typography.bodyMedium, color: colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  totalLabel: { ...Typography.bodyMedium, color: colors.textSecondary },
  totalValue: { ...Typography.h4, color: colors.primary },
  
  requestedAt: { ...Typography.caption, color: colors.textMuted, marginBottom: Spacing.md },
  
  actions: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1 },
  approveBtn: { backgroundColor: Colors.success },
  
  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.errorLight, borderRadius: BorderRadius.md, padding: Spacing.sm, gap: Spacing.xs },
  rejectionText: { ...Typography.caption, color: colors.error, flex: 1 },
  
  skeletonWrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, gap: Spacing.md },
  skeletonCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: colors.borderLight },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, padding: Spacing.xl, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { ...Typography.h4, color: colors.textPrimary },
  modalDescription: { ...Typography.body, color: colors.textSecondary, marginBottom: Spacing.md },
  reasonInput: { ...Typography.body, color: colors.textPrimary, backgroundColor: colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.border, padding: Spacing.md, minHeight: 100, marginBottom: Spacing.lg },
  modalActions: { flexDirection: 'row' },
  
  processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
});
