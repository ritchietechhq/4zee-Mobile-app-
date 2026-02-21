import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { AdminKYCClientDetail, AdminKYCDocument } from '@/types/admin';

export default function KycDetailScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [client, setClient] = useState<AdminKYCClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await adminService.getClientKYC(id);
      setClient(data);
    } catch (e) {
      console.error('KYC detail error:', e);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [id]);

  const handleVerify = useCallback(
    (doc: AdminKYCDocument, approved: boolean) => {
      const action = approved ? 'Approve' : 'Reject';

      const execute = async (reason?: string) => {
        setProcessing(doc.id);
        try {
          await adminService.verifyKYCDocument(doc.id, {
            documentId: doc.id,
            approved,
            rejectionReason: reason || null,
          });
          Alert.alert('Done', `Document ${approved ? 'approved' : 'rejected'}`);
          fetchData();
        } catch (e: any) {
          Alert.alert('Error', e?.error?.message || 'Verification failed');
        } finally {
          setProcessing(null);
        }
      };

      if (!approved) {
        Alert.prompt?.(
          'Rejection Reason',
          'Why is this document being rejected?',
          (reason) => {
            if (reason?.trim()) execute(reason);
          },
          'plain-text',
        ) ??
          Alert.alert(action, 'Reject this document?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reject', style: 'destructive', onPress: () => execute('Rejected by admin') },
          ]);
      } else {
        Alert.alert(action, `${action} this document?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: action, onPress: () => execute() },
        ]);
      }
    },
    [fetchData],
  );

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PENDING': return 'warning';
      case 'APPROVED': case 'VERIFIED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>KYC Detail</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={160} style={{ marginBottom: 16 }} />
            <Skeleton width="100%" height={200} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>KYC Detail</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...Typography.body, color: colors.textSecondary }}>Client not found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KYC Detail</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={fetchData} tintColor={colors.primary} />
          }
        >
          {/* Client Info */}
          <Card style={styles.infoCard}>
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {(client.firstName?.[0] ?? '') + (client.lastName?.[0] ?? '')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameText}>
                  {client.firstName} {client.lastName}
                </Text>
                <Text style={styles.emailText}>{client.user?.email}</Text>
              </View>
              <Badge label={client.kycStatus} variant={statusBadge(client.kycStatus)} size="md" />
            </View>

            {/* Details */}
            {client.phone && (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>{client.phone}</Text>
              </View>
            )}
            {client.address && (
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>{client.address}</Text>
              </View>
            )}
            {client.dateOfBirth && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <Text style={styles.detailText}>
                  {new Date(client.dateOfBirth).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.detailText}>
                Joined {new Date(client.user?.createdAt ?? '').toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </Card>

          {/* KYC Documents */}
          <Text style={styles.sectionTitle}>KYC Documents</Text>
          {(client.kycDocuments ?? []).length === 0 ? (
            <Card style={{ alignItems: 'center', padding: Spacing.xxl }}>
              <Ionicons name="document-outline" size={40} color={colors.textMuted} />
              <Text style={{ ...Typography.body, color: colors.textSecondary, marginTop: Spacing.md }}>
                No documents submitted
              </Text>
            </Card>
          ) : (
            client.kycDocuments.map((doc) => (
              <Card
                key={doc.id}
                style={[
                  styles.docCard,
                  doc.status === 'PENDING' && { borderLeftWidth: 3, borderLeftColor: colors.warning },
                ]}
              >
                <View style={styles.docHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docType}>{doc.type.replace(/_/g, ' ')}</Text>
                    <Text style={styles.docId}>ID: {doc.idNumber}</Text>
                    {doc.fileName && (
                      <Text style={styles.docFile}>{doc.fileName}</Text>
                    )}
                  </View>
                  <Badge label={doc.status} variant={statusBadge(doc.status)} size="sm" />
                </View>

                {/* View Document Link */}
                {doc.fileUrl && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(doc.fileUrl)}
                    style={styles.viewLink}
                  >
                    <Ionicons name="open-outline" size={14} color={colors.primary} />
                    <Text style={[styles.viewLinkText, { color: colors.primary }]}>View Document</Text>
                  </TouchableOpacity>
                )}

                {/* Actions for pending */}
                {doc.status === 'PENDING' && (
                  <View style={styles.docActions}>
                    <Button
                      title={processing === doc.id ? 'Processing…' : 'Approve'}
                      variant="primary"
                      size="sm"
                      onPress={() => handleVerify(doc, true)}
                      disabled={processing !== null}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Reject"
                      variant="danger"
                      size="sm"
                      onPress={() => handleVerify(doc, false)}
                      disabled={processing !== null}
                      style={{ flex: 1 }}
                    />
                  </View>
                )}

                <Text style={styles.docDate}>
                  Submitted: {new Date(doc.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Card>
            ))
          )}

          {/* Applications */}
          {client.applications && client.applications.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Applications</Text>
              {client.applications.map((app) => (
                <Card key={app.id} style={styles.appCard}>
                  <View style={styles.appRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appProperty}>{app.property?.title ?? 'Property'}</Text>
                      <Text style={styles.appDate}>
                        {new Date(app.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <Badge
                      label={app.status}
                      variant={app.status === 'APPROVED' ? 'success' : app.status === 'PENDING' ? 'warning' : 'error'}
                      size="sm"
                    />
                  </View>
                </Card>
              ))}
            </>
          )}
        </ScrollView>
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
    content: { padding: Spacing.xl, paddingBottom: 40 },
    infoCard: { marginBottom: Spacing.xl },
    profileRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...Typography.bodyMedium, fontSize: 18 },
    nameText: { ...Typography.h4, color: colors.textPrimary },
    emailText: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    detailText: { ...Typography.body, color: colors.textPrimary },
    sectionTitle: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    docCard: { marginBottom: Spacing.md },
    docHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    docType: { ...Typography.bodyMedium, color: colors.textPrimary, textTransform: 'capitalize' },
    docId: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    docFile: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    viewLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.sm,
    },
    viewLinkText: { ...Typography.captionMedium },
    docActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    docDate: { ...Typography.small, color: colors.textMuted, marginTop: Spacing.sm },
    appCard: { marginBottom: Spacing.sm },
    appRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    appProperty: { ...Typography.bodyMedium, color: colors.textPrimary },
    appDate: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  });
