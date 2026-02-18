import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { InstallmentPlan } from '@/types';

interface InstallmentBreakdownProps {
  plan: InstallmentPlan;
  compact?: boolean;
}

export function InstallmentBreakdown({ plan, compact = false }: InstallmentBreakdownProps) {
  const progressPercent = (plan.paidInstallments / plan.totalInstallments) * 100;

  const statusVariant =
    plan.status === 'active'
      ? 'info'
      : plan.status === 'completed'
        ? 'success'
        : plan.status === 'overdue'
          ? 'error'
          : plan.status === 'due'
            ? 'warning'
            : 'default';

  if (compact) {
    return (
      <Card variant="outlined" padding="md">
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>Installment Plan</Text>
          <Badge label={plan.status} variant={statusVariant} />
        </View>
        <ProgressBar progress={progressPercent} label="Payment Progress" />
        <View style={styles.compactRow}>
          <Text style={styles.compactLabel}>Monthly</Text>
          <Text style={styles.compactValue}>
            {formatCurrency(plan.monthlyAmount, plan.currency)}
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="lg">
      <View style={styles.header}>
        <Text style={styles.title}>Installment Breakdown</Text>
        <Badge label={plan.status} variant={statusVariant} />
      </View>

      <ProgressBar
        progress={progressPercent}
        label={`${plan.paidInstallments} of ${plan.totalInstallments} payments`}
        style={styles.progressBar}
      />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Total Price</Text>
          <Text style={styles.value}>
            {formatCurrency(plan.totalPrice, plan.currency)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Deposit</Text>
          <Text style={styles.value}>
            {formatCurrency(plan.depositAmount, plan.currency)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Monthly Amount</Text>
          <Text style={styles.value}>
            {formatCurrency(plan.monthlyAmount, plan.currency)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{plan.durationMonths} months</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Total Paid</Text>
          <Text style={[styles.value, styles.successText]}>
            {formatCurrency(plan.totalPaid, plan.currency)}
          </Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Remaining</Text>
          <Text style={[styles.value, styles.warningText]}>
            {formatCurrency(plan.remainingBalance, plan.currency)}
          </Text>
        </View>
      </View>

      {plan.nextPaymentDate && plan.status !== 'completed' && (
        <View style={styles.nextPayment}>
          <Text style={styles.nextPaymentLabel}>Next Payment</Text>
          <Text style={styles.nextPaymentValue}>
            {formatCurrency(plan.nextPaymentAmount, plan.currency)} due{' '}
            {new Date(plan.nextPaymentDate).toLocaleDateString()}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  progressBar: {
    marginBottom: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
    marginBottom: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  value: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  successText: {
    color: Colors.success,
  },
  warningText: {
    color: Colors.warning,
  },
  nextPayment: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  nextPaymentLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  nextPaymentValue: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  compactTitle: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  compactLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  compactValue: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },
});

export default InstallmentBreakdown;
