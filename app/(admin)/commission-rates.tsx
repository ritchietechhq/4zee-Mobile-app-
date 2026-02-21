import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { CommissionRates } from '@/types/admin';

export default function CommissionRatesScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [rates, setRates] = useState<CommissionRates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [directRate, setDirectRate] = useState('');
  const [referralRate, setReferralRate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getCommissionRates();
      setRates(data);
      setDirectRate((data.directRate * 100).toFixed(2));
      setReferralRate((data.referralRate * 100).toFixed(2));
    } catch (e) {
      console.error('Commission rates fetch error:', e);
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

  const handleSave = useCallback(async () => {
    const direct = parseFloat(directRate);
    const referral = parseFloat(referralRate);
    if (isNaN(direct) || isNaN(referral) || direct < 0 || referral < 0 || direct > 100 || referral > 100) {
      return Alert.alert('Invalid', 'Rates must be between 0 and 100.');
    }
    Alert.alert(
      'Update Commission Rates?',
      `Direct: ${direct}% • Referral: ${referral}%`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setIsSaving(true);
            try {
              await adminService.updateCommissionRates({
                directRate: direct / 100,
                referralRate: referral / 100,
              });
              Alert.alert('Success', 'Commission rates updated');
              fetchData();
            } catch (e: any) {
              Alert.alert('Error', e?.error?.message || 'Update failed');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  }, [directRate, referralRate, fetchData]);

  const hasChanges =
    rates &&
    (directRate !== (rates.directRate * 100).toFixed(2) ||
      referralRate !== (rates.referralRate * 100).toFixed(2));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Commission Rates</Text>
          <View style={{ width: 40 }} />
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={200} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Commission rates are applied automatically when a sale is recorded. Direct rate is for
                the realtor who closed the sale; referral rate is for the referring realtor.
              </Text>
            </View>

            {/* Direct Rate */}
            <Card style={styles.card}>
              <View style={styles.cardIconRow}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="arrow-forward-circle-outline" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Direct Commission Rate</Text>
                  <Text style={styles.cardHint}>Applied to the selling realtor</Text>
                </View>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={directRate}
                  onChangeText={setDirectRate}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 5.00"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.unitLabel}>%</Text>
              </View>
              {rates && (
                <Text style={styles.currentLabel}>
                  Current: {(rates.directRate * 100).toFixed(2)}%
                </Text>
              )}
            </Card>

            {/* Referral Rate */}
            <Card style={styles.card}>
              <View style={styles.cardIconRow}>
                <View style={[styles.iconCircle, { backgroundColor: colors.purpleLight }]}>
                  <Ionicons name="git-branch-outline" size={22} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>Referral Commission Rate</Text>
                  <Text style={styles.cardHint}>Applied to the referring realtor</Text>
                </View>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={referralRate}
                  onChangeText={setReferralRate}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 2.50"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.unitLabel}>%</Text>
              </View>
              {rates && (
                <Text style={styles.currentLabel}>
                  Current: {(rates.referralRate * 100).toFixed(2)}%
                </Text>
              )}
            </Card>

            {/* Save */}
            <Button
              title={isSaving ? 'Saving…' : 'Update Rates'}
              variant="primary"
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              style={{ marginTop: Spacing.xl }}
            />
          </ScrollView>
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
    content: { padding: Spacing.xl, paddingBottom: 40 },
    infoBox: {
      flexDirection: 'row',
      gap: Spacing.sm,
      backgroundColor: colors.primaryLight,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xl,
    },
    infoText: { ...Typography.caption, color: colors.primary, flex: 1, lineHeight: 18 },
    card: { marginBottom: Spacing.lg },
    cardIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLabel: { ...Typography.bodyMedium, color: colors.textPrimary },
    cardHint: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Typography.h4,
      color: colors.textPrimary,
    },
    unitLabel: { ...Typography.h3, color: colors.textSecondary },
    currentLabel: { ...Typography.small, color: colors.textMuted, marginTop: Spacing.sm },
  });
