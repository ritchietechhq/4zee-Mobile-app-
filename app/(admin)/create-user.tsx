import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const ROLES = ['ADMIN', 'REALTOR', 'CLIENT'] as const;

export default function CreateUserScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'REALTOR' | 'CLIENT'>('CLIENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim()) return Alert.alert('Required', 'Email is required');
    if (!email.includes('@')) return Alert.alert('Invalid', 'Please enter a valid email');

    setIsSubmitting(true);
    try {
      const res = await adminService.createUser({
        email: email.trim(),
        role,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      Alert.alert(
        'User Created',
        `${res.email} created as ${res.role}.\n\n${res.mustChangePassword ? 'User must change password on first login.' : ''}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, firstName, lastName, role]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create User</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Role Selector */}
          <Text style={styles.fieldLabel}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                style={[
                  styles.roleChip,
                  role === r && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Ionicons
                  name={r === 'ADMIN' ? 'shield-outline' : r === 'REALTOR' ? 'briefcase-outline' : 'person-outline'}
                  size={16}
                  color={role === r ? '#fff' : colors.textSecondary}
                />
                <Text style={[styles.roleText, { color: role === r ? '#fff' : colors.textSecondary }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <Text style={styles.fieldLabel}>Email *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Name */}
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>First Name</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="John"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Doe"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Info */}
          <Card style={styles.infoCard}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>Auto-generated password</Text>
                <Text style={styles.infoText}>
                  A temporary password will be generated and the user will be required to change it on
                  first login. The credentials will be included in the welcome email.
                </Text>
              </View>
            </View>
          </Card>

          {/* Submit */}
          <Button
            title={isSubmitting ? 'Creating…' : 'Create User'}
            variant="primary"
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{ marginTop: Spacing.lg }}
          />
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
    fieldLabel: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      marginTop: Spacing.lg,
    },
    input: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      ...Typography.body,
      color: colors.textPrimary,
    },
    roleRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    roleChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.cardBackground,
    },
    roleText: { ...Typography.captionMedium },
    nameRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    infoCard: {
      marginTop: Spacing.xl,
      backgroundColor: colors.primaryLight,
    },
    infoTitle: { ...Typography.captionMedium, color: colors.primary, marginBottom: 4 },
    infoText: { ...Typography.caption, color: colors.primary, lineHeight: 18 },
  });
