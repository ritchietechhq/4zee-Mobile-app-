import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { kycService } from '@/services/kyc.service';
import type { KYC, KYCStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

type StepInfo = { icon: string; title: string; desc: string };

const STEPS: StepInfo[] = [
  { icon: 'person-outline', title: 'Personal Info', desc: 'ID type and number' },
  { icon: 'document-outline', title: 'ID Document', desc: 'Upload a clear photo of your ID' },
  { icon: 'camera-outline', title: 'Selfie', desc: 'Take a selfie for verification' },
  { icon: 'home-outline', title: 'Proof of Address', desc: 'Utility bill or bank statement' },
];

const statusConfig: Record<KYCStatus, { icon: string; color: string; bg: string; title: string; desc: string }> = {
  NOT_SUBMITTED: {
    icon: 'shield-outline', color: Colors.warning, bg: Colors.warningLight,
    title: 'Verification Required',
    desc: 'Complete your KYC verification to start earning commissions and manage property listings.',
  },
  PENDING: {
    icon: 'hourglass-outline', color: Colors.primary, bg: Colors.primaryLight,
    title: 'Under Review',
    desc: 'Your documents have been submitted and are being reviewed. This usually takes 1-2 business days.',
  },
  APPROVED: {
    icon: 'checkmark-circle', color: Colors.success, bg: Colors.successLight,
    title: 'Approved',
    desc: 'Your identity has been verified. You have full access to all realtor features.',
  },
  REJECTED: {
    icon: 'close-circle', color: Colors.error, bg: Colors.errorLight,
    title: 'Verification Rejected',
    desc: 'Your submission was rejected. Please review the feedback and resubmit your documents.',
  },
};

export default function KYCStatusScreen() {
  const router = useRouter();
  const [kyc, setKyc] = useState<KYC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKYC = useCallback(async () => {
    try {
      const res = await kycService.getStatus();
      setKyc(res);
    } catch (e: any) {
      // If the backend returns an error (e.g. network), fall back gracefully
      const code = e?.error?.code;
      if (code === 'AUTH_FORBIDDEN') {
        // Shouldn't happen now, but fallback just in case
        setKyc({ kycStatus: 'NOT_SUBMITTED', documents: [] } as KYC);
      }
      // Otherwise leave kyc as null — loading skeleton will clear and show default state
    }
  }, []);

  useEffect(() => {
    (async () => { setIsLoading(true); await fetchKYC(); setIsLoading(false); })();
  }, [fetchKYC]);

  const onRefresh = async () => {
    setIsRefreshing(true); await fetchKYC(); setIsRefreshing(false);
  };

  const status: KYCStatus = kyc?.kycStatus || 'NOT_SUBMITTED';
  const cfg = statusConfig[status];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.skeletonWrap}>
          <Skeleton width="100%" height={200} />
          <Skeleton width="100%" height={80} style={{ marginTop: Spacing.lg }} />
          <Skeleton width="100%" height={80} style={{ marginTop: Spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KYC Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Status Hero */}
        <View style={[styles.statusHero, { backgroundColor: cfg.bg }]}>
          <View style={[styles.statusIcon, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
            <Ionicons name={cfg.icon as any} size={40} color={cfg.color} />
          </View>
          <Text style={[styles.statusTitle, { color: cfg.color }]}>{cfg.title}</Text>
          <Text style={styles.statusDesc}>{cfg.desc}</Text>
        </View>

        {/* Rejection Reason */}
        {status === 'REJECTED' && (
          <Card variant="outlined" padding="md" style={styles.rejectionCard}>
            <View style={styles.rejectionRow}>
              <Ionicons name="information-circle" size={20} color={Colors.error} />
              <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
            </View>
            <Text style={styles.rejectionText}>Your documents did not meet the verification requirements. Please review and resubmit.</Text>
          </Card>
        )}

        {/* Steps Overview */}
        {(status === 'NOT_SUBMITTED' || status === 'REJECTED') && (
          <>
            <Text style={styles.sectionTitle}>What You'll Need</Text>
            {STEPS.map((step, i) => (
              <Card key={i} variant="outlined" padding="md" style={styles.stepCard}>
                <View style={styles.stepRow}>
                  <View style={styles.stepIcon}>
                    <Ionicons name={step.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                </View>
              </Card>
            ))}
            <Button
              title={status === 'REJECTED' ? 'Resubmit Documents' : 'Start Verification'}
              onPress={() => router.push('/(realtor)/profile/kyc/submit' as any)}
              fullWidth
              style={{ marginTop: Spacing.xl }}
            />
          </>
        )}

        {/* Approved details */}
        {status === 'APPROVED' && (
          <Card variant="elevated" padding="lg" style={styles.verifiedCard}>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Text style={styles.verifiedTitle}>Identity Verified</Text>
                <Text style={styles.verifiedSub}>Your identity is confirmed</Text>
              </View>
            </View>
            {kyc?.documents && kyc.documents.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Documents</Text>
                <Text style={styles.detailValue}>{kyc.documents.length} submitted</Text>
              </View>
            )}
          </Card>
        )}

        {/* Pending timeline */}
        {status === 'PENDING' && (
          <Card variant="elevated" padding="lg" style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Review Timeline</Text>
            {[
              { label: 'Documents Submitted', done: true, icon: 'checkmark-circle' },
              { label: 'Identity Verification', done: false, icon: 'hourglass-outline' },
              { label: 'Approval', done: false, icon: 'shield-checkmark-outline' },
            ].map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <Ionicons
                  name={step.done ? (step.icon as any) : (step.icon as any)}
                  size={20}
                  color={step.done ? Colors.success : Colors.textMuted}
                />
                <Text style={[styles.timelineText, step.done && { color: Colors.success, fontWeight: '600' }]}>{step.label}</Text>
              </View>
            ))}
            <Text style={styles.pendingSub}>Processing your documents...</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg, backgroundColor: Colors.surface },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },
  statusHero: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', marginBottom: Spacing.xl },
  statusIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  statusTitle: { ...Typography.h3, marginBottom: Spacing.sm, textAlign: 'center' },
  statusDesc: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  rejectionCard: { marginBottom: Spacing.lg, borderColor: Colors.errorLight },
  rejectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  rejectionTitle: { ...Typography.bodySemiBold, color: Colors.error },
  rejectionText: { ...Typography.body, color: Colors.textSecondary, lineHeight: 20 },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  stepCard: { marginBottom: Spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  stepDesc: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  stepNumber: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  stepNumberText: { ...Typography.small, color: Colors.textMuted, fontWeight: '600' },
  verifiedCard: { marginTop: Spacing.sm },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  verifiedTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  verifiedSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  detailLabel: { ...Typography.caption, color: Colors.textMuted },
  detailValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  pendingCard: { marginTop: Spacing.sm },
  pendingTitle: { ...Typography.bodySemiBold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  timelineText: { ...Typography.body, color: Colors.textMuted },
  pendingSub: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' },
  skeletonWrap: { paddingHorizontal: Spacing.xl },
});
