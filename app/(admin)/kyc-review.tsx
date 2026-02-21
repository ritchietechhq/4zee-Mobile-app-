import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity,
  Alert, TextInput, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminKYCRequest, AdminKYCDocument, AdminKYCSummary } from '@/types/admin';

const STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const;

const DOC_TYPE_ICON: Record<string, string> = {
  NIN: 'card-outline',
  BVN: 'finger-print-outline',
  PASSPORT: 'globe-outline',
  DRIVERS_LICENSE: 'car-outline',
  UTILITY_BILL: 'flash-outline',
  CAC: 'business-outline',
  ID_CARD: 'id-card-outline',
};

export default function KYCReviewScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [requests, setRequests] = useState<AdminKYCRequest[]>([]);
  const [summary, setSummary] = useState<AdminKYCSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getPendingKYC(activeTab === 'ALL' ? undefined : activeTab);
      // Handle both new and legacy response shapes
      if (data.requests) {
        setRequests(data.requests);
        setSummary(data.summary ?? null);
      } else {
        // Legacy shape fallback: { clients: [...], realtors: [...] }
        const legacy = data as any;
        const mapped: AdminKYCRequest[] = [];
        for (const c of (legacy.clients ?? [])) {
          mapped.push({
            entityId: c.id,
            entityType: 'client',
            email: c.user?.email ?? '',
            firstName: c.firstName ?? '',
            lastName: c.lastName ?? '',
            kycStatus: c.kycStatus ?? 'PENDING',
            documents: (c.kycDocuments ?? []).map((d: any) => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl ?? '',
              status: d.status ?? 'PENDING',
              canApprove: d.status === 'PENDING',
              canReject: d.status === 'PENDING',
              verifyEndpoint: `POST /admin/kyc/documents/${d.id}/verify`,
              idNumber: d.idNumber,
              fileName: d.fileName,
              createdAt: d.createdAt,
            })),
            totalDocuments: (c.kycDocuments ?? []).length,
            pendingDocuments: (c.kycDocuments ?? []).filter((d: any) => d.status === 'PENDING').length,
            approvedDocuments: (c.kycDocuments ?? []).filter((d: any) => d.status === 'APPROVED').length,
            rejectedDocuments: (c.kycDocuments ?? []).filter((d: any) => d.status === 'REJECTED').length,
          });
        }
        for (const r of (legacy.realtors ?? [])) {
          mapped.push({
            entityId: r.id,
            entityType: 'realtor',
            email: r.user?.email ?? '',
            firstName: r.firstName ?? '',
            lastName: r.lastName ?? '',
            kycStatus: r.kycStatus ?? 'PENDING',
            documents: (r.kycDocuments ?? []).map((d: any) => ({
              id: d.id,
              type: d.type,
              fileUrl: d.fileUrl ?? '',
              status: d.status ?? 'PENDING',
              canApprove: d.status === 'PENDING',
              canReject: d.status === 'PENDING',
              verifyEndpoint: `POST /admin/kyc/documents/${d.id}/verify`,
              idNumber: d.idNumber,
              fileName: d.fileName,
              createdAt: d.createdAt,
            })),
            totalDocuments: (r.kycDocuments ?? []).length,
            pendingDocuments: (r.kycDocuments ?? []).filter((d: any) => d.status === 'PENDING').length,
            approvedDocuments: (r.kycDocuments ?? []).filter((d: any) => d.status === 'APPROVED').length,
            rejectedDocuments: (r.kycDocuments ?? []).filter((d: any) => d.status === 'REJECTED').length,
          });
        }
        setRequests(mapped);
        setSummary(null);
      }
    } catch (e) {
      console.error('KYC fetch error:', e);
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

  // ─── Approve Document ─────────────────────────────────────
  const handleApprove = useCallback(
    async (doc: AdminKYCDocument) => {
      Alert.alert(
        'Approve Document',
        `Are you sure you want to approve this ${doc.type} document?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Approve',
            style: 'default',
            onPress: async () => {
              setProcessing(doc.id);
              try {
                await adminService.verifyKYCDocument(doc.id, { approved: true });
                Alert.alert('Success', 'Document approved successfully');
                fetchData();
              } catch (e: any) {
                Alert.alert('Error', e?.message || 'Failed to approve document');
              } finally {
                setProcessing(null);
              }
            },
          },
        ],
      );
    },
    [fetchData],
  );

  // ─── Reject Document (opens modal) ────────────────────────
  const openRejectModal = useCallback((docId: string) => {
    setRejectDocId(docId);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  const handleReject = useCallback(async () => {
    if (!rejectDocId) return;
    if (!rejectReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    setProcessing(rejectDocId);
    setRejectModalVisible(false);
    try {
      await adminService.verifyKYCDocument(rejectDocId, {
        approved: false,
        rejectionReason: rejectReason.trim(),
      });
      Alert.alert('Done', 'Document rejected');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject document');
    } finally {
      setProcessing(null);
      setRejectDocId(null);
      setRejectReason('');
    }
  }, [rejectDocId, rejectReason, fetchData]);

  // ─── Badge helpers ─────────────────────────────────────────
  const badgeVariant = (status: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const entityBadge = (type: string): 'info' | 'default' =>
    type === 'realtor' ? 'info' : 'default';

  // ─── Render ────────────────────────────────────────────────
  const renderSummaryBar = () => {
    if (!summary) return null;
    return (
      <View style={styles.summaryRow}>
        {[
          { label: 'Total', value: summary.totalDocuments, color: colors.primary },
          { label: 'Pending', value: summary.pending, color: colors.warning },
          { label: 'Approved', value: summary.approved, color: colors.success },
          { label: 'Rejected', value: summary.rejected, color: colors.error },
        ].map((s) => (
          <View key={s.label} style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDocCard = (doc: AdminKYCDocument, person: AdminKYCRequest) => {
    const icon = DOC_TYPE_ICON[doc.type] ?? 'document-outline';
    const isPending = doc.status === 'PENDING';
    const isProcessingThis = processing === doc.id;

    return (
      <View key={doc.id} style={styles.docRow}>
        <View style={styles.docInfo}>
          <View style={[styles.docIconWrap, { backgroundColor: colors.surface }]}>
            <Ionicons name={icon as any} size={18} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docType}>{doc.type.replace(/_/g, ' ')}</Text>
            {doc.idNumber && <Text style={styles.docId}>ID: {doc.idNumber}</Text>}
            {doc.createdAt && (
              <Text style={styles.docDate}>
                {new Date(doc.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            )}
          </View>
          <Badge label={doc.status} variant={badgeVariant(doc.status)} size="sm" />
        </View>

        {/* Document preview */}
        {doc.fileUrl ? (
          <TouchableOpacity
            style={styles.previewRow}
            onPress={() => setPreviewUrl(doc.fileUrl)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: doc.fileUrl }}
              style={styles.docThumb}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.viewDocText}>View Document</Text>
              <Text style={styles.docFileName} numberOfLines={1}>
                {doc.fileName ?? doc.type}
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Action buttons — only for documents that can be approved/rejected */}
        {(doc.canApprove || doc.canReject) && isPending && (
          <View style={styles.docActions}>
            {doc.canApprove && (
              <Button
                title="Approve"
                variant="primary"
                size="sm"
                loading={isProcessingThis}
                disabled={isProcessingThis}
                onPress={() => handleApprove(doc)}
                style={{ flex: 1 }}
                icon={<Ionicons name="checkmark-circle" size={16} color="#fff" />}
              />
            )}
            {doc.canReject && (
              <Button
                title="Reject"
                variant="danger"
                size="sm"
                loading={isProcessingThis}
                disabled={isProcessingThis}
                onPress={() => openRejectModal(doc.id)}
                style={{ flex: 1 }}
                icon={<Ionicons name="close-circle" size={16} color="#fff" />}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  const renderRequestCard = (req: AdminKYCRequest) => (
    <Card key={req.entityId} variant="elevated" padding="lg" style={styles.personCard}>
      {/* Person header */}
      <View style={styles.personHeader}>
        <View style={[
          styles.avatar,
          { backgroundColor: req.entityType === 'realtor' ? colors.tealLight : colors.primaryLight },
        ]}>
          <Text style={[
            styles.avatarText,
            { color: req.entityType === 'realtor' ? colors.teal : colors.primary },
          ]}>
            {(req.firstName?.[0] ?? '').toUpperCase()}
            {(req.lastName?.[0] ?? '').toUpperCase()}
          </Text>
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{req.firstName} {req.lastName}</Text>
          <Text style={styles.personEmail}>{req.email}</Text>
        </View>
        <Badge
          label={req.entityType.charAt(0).toUpperCase() + req.entityType.slice(1)}
          variant={entityBadge(req.entityType)}
          size="sm"
        />
      </View>

      {/* KYC Status + doc counters */}
      <View style={styles.kycStatusRow}>
        <Badge label={req.kycStatus} variant={badgeVariant(req.kycStatus)} size="sm" />
        <View style={styles.docCounters}>
          {req.pendingDocuments > 0 && (
            <View style={styles.counterChip}>
              <View style={[styles.counterDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.counterText}>{req.pendingDocuments} pending</Text>
            </View>
          )}
          {req.approvedDocuments > 0 && (
            <View style={styles.counterChip}>
              <View style={[styles.counterDot, { backgroundColor: colors.success }]} />
              <Text style={styles.counterText}>{req.approvedDocuments} approved</Text>
            </View>
          )}
          {req.rejectedDocuments > 0 && (
            <View style={styles.counterChip}>
              <View style={[styles.counterDot, { backgroundColor: colors.error }]} />
              <Text style={styles.counterText}>{req.rejectedDocuments} rejected</Text>
            </View>
          )}
        </View>
      </View>

      {/* Documents */}
      {req.documents.map((doc) => renderDocCard(doc, req))}
    </Card>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary bar */}
        {renderSummaryBar()}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab ? '#fff' : colors.textSecondary },
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} width="100%" height={180} style={{ marginBottom: 12, borderRadius: BorderRadius.lg }} />
            ))
          ) : requests.length === 0 ? (
            <EmptyState
              icon="shield-checkmark-outline"
              title={activeTab === 'ALL' ? 'No KYC Requests' : `No ${activeTab.toLowerCase()} KYC`}
              description={
                activeTab === 'ALL'
                  ? 'There are no KYC submissions at this time.'
                  : `There are no ${activeTab.toLowerCase()} KYC submissions.`
              }
            />
          ) : (
            requests.map((req) => renderRequestCard(req))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* ─── Reject Reason Modal ─── */}
        <Modal
          visible={rejectModalVisible}
          title="Reject Document"
          onClose={() => { setRejectModalVisible(false); setRejectDocId(null); setRejectReason(''); }}
        >
          <Text style={styles.modalDesc}>
            Please provide a reason for rejecting this document. The user will see this message.
          </Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="e.g. Document is blurry, ID has expired..."
            placeholderTextColor={colors.textMuted}
            value={rejectReason}
            onChangeText={setRejectReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => { setRejectModalVisible(false); setRejectDocId(null); setRejectReason(''); }}
              style={{ flex: 1 }}
            />
            <Button
              title="Reject Document"
              variant="danger"
              onPress={handleReject}
              loading={!!processing}
              disabled={!rejectReason.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>

        {/* ─── Document Preview Modal ─── */}
        <Modal
          visible={!!previewUrl}
          title="Document Preview"
          onClose={() => setPreviewUrl(null)}
        >
          {previewUrl && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: previewUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <Button
                title="Open in Browser"
                variant="outline"
                onPress={() => {
                  Linking.openURL(previewUrl);
                  setPreviewUrl(null);
                }}
                style={{ marginTop: Spacing.lg }}
                icon={<Ionicons name="open-outline" size={16} color={colors.primary} />}
              />
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 30 },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },

    // Summary bar
    summaryRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryValue: { ...Typography.h4, fontWeight: '700' },
    summaryLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

    // Tabs
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      borderRadius: BorderRadius.sm,
    },
    tabText: { ...Typography.captionMedium },

    // Person card
    personCard: { marginBottom: Spacing.lg },
    personHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.bodyMedium, fontWeight: '700' },
    personInfo: { flex: 1, marginLeft: Spacing.md },
    personName: { ...Typography.bodyMedium, color: colors.textPrimary },
    personEmail: { ...Typography.caption, color: colors.textSecondary },

    // KYC status row
    kycStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      paddingBottom: Spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderLight,
    },
    docCounters: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    counterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    counterDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    counterText: { ...Typography.small, color: colors.textMuted },

    // Document row
    docRow: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginTop: Spacing.sm,
    },
    docInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    docIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docType: { ...Typography.bodyMedium, color: colors.textPrimary },
    docId: { ...Typography.caption, color: colors.textSecondary, marginTop: 1 },
    docDate: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
    docActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },

    // Document preview row
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderLight,
    },
    docThumb: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.surface,
    },
    viewDocText: { ...Typography.captionMedium, color: colors.primary },
    docFileName: { ...Typography.small, color: colors.textMuted, marginTop: 1 },

    // Rejection modal
    modalDesc: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    reasonInput: {
      ...Typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: Spacing.lg,
      minHeight: 100,
      marginBottom: Spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.md,
    },

    // Document preview modal
    previewContainer: {
      alignItems: 'center',
    },
    previewImage: {
      width: '100%',
      height: 300,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
    },
  });
