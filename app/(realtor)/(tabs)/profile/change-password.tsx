// ============================================================
// Change Password Screen — Realtor
// Secure password update with validation
// ============================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useRealtorColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const colors = useRealtorColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const getPasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: colors.error };
    if (score <= 4) return { score: 2, label: 'Medium', color: colors.warning };
    return { score: 3, label: 'Strong', color: colors.success };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(form.newPassword)) {
      newErrors.newPassword = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(form.newPassword)) {
      newErrors.newPassword = 'Password must contain a lowercase letter';
    } else if (!/\d/.test(form.newPassword)) {
      newErrors.newPassword = 'Password must contain a number';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (form.currentPassword === form.newPassword && form.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      Alert.alert(
        'Success',
        'Your password has been changed successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      const message =
        error?.error?.message ||
        'Failed to change password. Please check your current password and try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.newPassword);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            }}
          >
            {/* Security Icon */}
            <View style={styles.iconSection}>
              <View style={styles.securityIcon}>
                <Ionicons name="lock-closed" size={26} color={colors.primary} />
              </View>
              <Text style={styles.securityTitle}>Update Your Password</Text>
              <Text style={styles.securityDesc}>
                Choose a strong password to keep your account secure
              </Text>
            </View>

            {/* Form */}
            <Card style={styles.formCard}>
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={form.currentPassword}
                onChangeText={(v) => updateField('currentPassword', v)}
                secureTextEntry
                error={errors.currentPassword}
                required
                leftIcon="key-outline"
              />

              <View style={styles.divider} />

              <Input
                label="New Password"
                placeholder="Enter new password"
                value={form.newPassword}
                onChangeText={(v) => updateField('newPassword', v)}
                secureTextEntry
                error={errors.newPassword}
                required
                leftIcon="lock-closed-outline"
              />

              {/* Password Strength Indicator */}
              {form.newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              level <= passwordStrength.score
                                ? passwordStrength.color
                                : colors.borderLight,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    {passwordStrength.label}
                  </Text>
                </View>
              )}

              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChangeText={(v) => updateField('confirmPassword', v)}
                secureTextEntry
                error={errors.confirmPassword}
                required
                leftIcon="shield-checkmark-outline"
              />
            </Card>

            {/* Password Requirements */}
            <Card style={styles.requirementsCard} variant="outlined">
              <Text style={styles.requirementsTitle}>Password Requirements</Text>
              <View style={styles.requirementsList}>
                <RequirementItem met={form.newPassword.length >= 8} text="At least 8 characters" />
                <RequirementItem met={/[A-Z]/.test(form.newPassword)} text="One uppercase letter" />
                <RequirementItem met={/[a-z]/.test(form.newPassword)} text="One lowercase letter" />
                <RequirementItem met={/\d/.test(form.newPassword)} text="One number" />
                <RequirementItem met={/[!@#$%^&*(),.?":{}|<>]/.test(form.newPassword)} text="One special character (optional)" />
              </View>
            </Card>

            {/* Submit Button */}
            <View style={styles.buttonSection}>
              <Button
                title="Update Password"
                onPress={handleChangePassword}
                loading={isLoading}
                variant="primary"
                size="lg"
                icon={<Ionicons name="checkmark-circle" size={20} color={colors.white} />}
              />
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotText}>Forgot your current password?</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  const colors = useRealtorColors();
  const reqStyles = useMemo(() => makeReqStyles(colors), [colors]);
  return (
    <View style={reqStyles.item}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={met ? colors.success : colors.textMuted}
      />
      <Text style={[reqStyles.text, met && reqStyles.textMet]}>{text}</Text>
    </View>
  );
}

const makeReqStyles = (colors: ThemeColors) => StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { ...Typography.caption, color: colors.textMuted },
  textMet: { color: colors.success },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.cardBackground,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },

  iconSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  securityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  securityTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  securityDesc: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  formCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: Spacing.lg,
  },

  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    ...Typography.captionMedium,
    minWidth: 50,
    textAlign: 'right',
  },

  requirementsCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  requirementsTitle: {
    ...Typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: Spacing.md,
  },
  requirementsList: {
    gap: Spacing.sm,
  },

  buttonSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },

  forgotLink: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  forgotText: {
    ...Typography.caption,
    color: colors.primary,
  },
});
