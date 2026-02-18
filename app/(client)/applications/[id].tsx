import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApplications } from '@/hooks/useApplications';
import { usePayments } from '@/hooks/usePayments';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    selectedApplication: application,
    isLoadingDetail,
    fetchApplicationById,
  } = useApplications();
  const {
    paymentUrl,
    paymentStatus,
    isLoading: isPaymentLoading,
    isPolling,
    initiatePayment,
    pollPaymentStatus,
    resetPayment,
    error: paymentError,
  } = usePayments();

  useEffect(() => {
    if (id) fetchApplicationById(id);
  }, [id, fetchApplicationById]);

  // When payment URL is set, navigate to Paystack WebView
  useEffect(() => {
    if (paymentUrl) {
      router.push({
        pathname: '/(client)/payments',
        params: { url: paymentUrl, applicationId: id },
      });
    }
  }, [paymentUrl]);

  const handlePayNow = async () => {
    if (!application) return;

    if (application.status !== 'APPROVED') {
      Alert.alert('Not Ready', 'This application has not been approved yet.');
      return;
    }

    if (application.paymentStatus === 'PAID') {
      Alert.alert('Already Paid', 'Payment for this application has been completed.');
      return;
    }

    try {
      await initiatePayment(application.id);
    } catch {
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning' as const;
      case 'APPROVED':
        return 'success' as const;
      case 'REJECTED':
        return 'error' as const;
      default:
        return 'default' as const;
    }
  };

  if (isLoadingDetail || !application) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Status Card */}
          <Card variant="elevated" padding="xl" style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Application Status</Text>
              <Badge
                label={application.status}
                variant={getStatusVariant(application.status)}
                size="md"
              />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Payment Status</Text>
              <Badge
                label={application.paymentStatus}
                variant={application.paymentStatus === 'PAID' ? 'success' : 'warning'}
                size="md"
              />
            </View>
            <Text style={styles.dateText}>
              Applied: {new Date(application.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </Card>

          {/* Property Info */}
          <Card variant="outlined" padding="lg">
            <Text style={styles.sectionTitle}>Property</Text>
            <Text style={styles.propertyTitle}>
              {application.property?.title || 'Property'}
            </Text>
            {application.property?.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.locationText}>{application.property.location}</Text>
              </View>
            )}
            <Text style={styles.propertyPrice}>
              {formatCurrency(application.property?.price || 0)}
            </Text>
          </Card>

          {/* Payment Info */}
          {application.payment && (
            <Card variant="outlined" padding="lg">
              <Text style={styles.sectionTitle}>Payment</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Reference</Text>
                <Text style={styles.paymentValue}>{application.payment.reference}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount</Text>
                <Text style={styles.paymentValue}>
                  {formatCurrency(application.payment.amount)}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Status</Text>
                <Badge
                  label={application.payment.status}
                  variant={application.payment.status === 'SUCCESS' ? 'success' : 'warning'}
                  size="sm"
                />
              </View>
              {application.payment.paidAt && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Paid At</Text>
                  <Text style={styles.paymentValue}>
                    {new Date(application.payment.paidAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </Card>
          )}

          {/* Payment CTA */}
          {application.status === 'APPROVED' && application.paymentStatus === 'UNPAID' && (
            <Card variant="elevated" padding="xl" style={styles.ctaCard}>
              <Text style={styles.ctaTitle}>Ready to Pay</Text>
              <Text style={styles.ctaSubtitle}>
                Your application has been approved. Complete the payment to proceed.
              </Text>
              <Button
                title="Pay Now"
                onPress={handlePayNow}
                loading={isPaymentLoading}
                fullWidth
                size="lg"
              />
            </Card>
          )}

          {/* Payment Status after poll */}
          {paymentStatus && (
            <Card variant="elevated" padding="xl" style={styles.paymentResultCard}>
              <Ionicons
                name={
                  paymentStatus.status === 'SUCCESS'
                    ? 'checkmark-circle'
                    : 'close-circle'
                }
                size={48}
                color={
                  paymentStatus.status === 'SUCCESS'
                    ? Colors.success
                    : Colors.error
                }
              />
              <Text style={styles.paymentResultTitle}>
                {paymentStatus.status === 'SUCCESS'
                  ? 'Payment Successful!'
                  : 'Payment Failed'}
              </Text>
              <Text style={styles.paymentResultRef}>
                Ref: {paymentStatus.reference}
              </Text>
              <Button
                title="Done"
                onPress={() => {
                  resetPayment();
                  fetchApplicationById(application.id);
                }}
                fullWidth
                size="lg"
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  statusCard: {
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  propertyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  propertyPrice: {
    ...Typography.h3,
    color: Colors.primary,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  paymentValue: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  ctaCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  ctaSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  paymentResultCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  paymentResultTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  paymentResultRef: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
