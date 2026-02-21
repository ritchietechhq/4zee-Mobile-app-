import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

export default function RecordSaleScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [form, setForm] = useState({
    propertyId: '',
    clientId: '',
    realtorId: '',
    amount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.propertyId || !form.clientId || !form.realtorId || !form.amount) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await adminService.recordOfflineSale({
        propertyId: form.propertyId.trim(),
        clientId: form.clientId.trim(),
        realtorId: form.realtorId.trim(),
        amount: parseInt(form.amount, 10) * 100, // Convert Naira to kobo
      });
      Alert.alert('Success', 'Offline sale recorded successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Offline Sale</Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                Record a sale that happened outside the platform (cash, bank transfer, etc.)
              </Text>
            </View>

            <Input
              label="Property ID"
              placeholder="UUID of the property"
              value={form.propertyId}
              onChangeText={(v) => updateField('propertyId', v)}
              required
              leftIcon="business-outline"
            />
            <Input
              label="Client ID"
              placeholder="UUID of the buyer"
              value={form.clientId}
              onChangeText={(v) => updateField('clientId', v)}
              required
              leftIcon="person-outline"
            />
            <Input
              label="Realtor ID"
              placeholder="UUID of the referring realtor"
              value={form.realtorId}
              onChangeText={(v) => updateField('realtorId', v)}
              required
              leftIcon="briefcase-outline"
            />
            <Input
              label="Amount (₦ Naira)"
              placeholder="e.g. 45000000"
              value={form.amount}
              onChangeText={(v) => updateField('amount', v)}
              keyboardType="numeric"
              required
              leftIcon="cash-outline"
              hint="Enter in Naira — will be stored as kobo"
            />

            <Button
              title="Record Sale"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
              style={{ marginTop: Spacing.xl }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
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
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 40 },
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.sm,
      backgroundColor: colors.primaryLight,
      padding: Spacing.lg,
      borderRadius: 10,
      marginBottom: Spacing.xxl,
    },
    infoText: { ...Typography.caption, color: colors.primary, flex: 1, lineHeight: 18 },
  });
