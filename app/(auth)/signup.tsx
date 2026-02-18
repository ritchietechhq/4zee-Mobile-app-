import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateSignupForm } from '@/utils/validators';
import type { RegisterRequest } from '@/types';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export default function SignupScreen() {
  const { register, isLoading, error, clearError } = useAuth();
  const role = useAuthStore((state) => state.role);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleSignup = async () => {
    clearError();
    const validation = validateSignupForm(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});

    const payload: RegisterRequest = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      role: role === 'REALTOR' ? 'REALTOR' : 'CLIENT',
      referralCode: form.referralCode.trim() || undefined,
    };

    await register(payload);
  };

  const displayRole = role === 'REALTOR' ? 'Realtor' : 'Client';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join 4Zee Properties as a{' '}
              <Text style={styles.roleHighlight}>{displayRole}</Text>
            </Text>
          </View>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <Input
                label="First Name"
                placeholder="John"
                value={form.firstName}
                onChangeText={(v) => updateField('firstName', v)}
                error={errors.firstName}
                containerStyle={styles.halfInput}
                required
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={form.lastName}
                onChangeText={(v) => updateField('lastName', v)}
                error={errors.lastName}
                containerStyle={styles.halfInput}
                required
              />
            </View>

            <Input
              label="Email Address"
              placeholder="you@example.com"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              error={errors.email}
              required
            />

            <Input
              label="Phone Number"
              placeholder="+234 800 000 0000"
              leftIcon="call-outline"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(v) => updateField('phone', v)}
              error={errors.phone}
              required
            />

            <Input
              label="Password"
              placeholder="Min 8 characters"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              error={errors.password}
              hint="At least 8 characters, 1 uppercase, 1 number"
              required
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(v) => updateField('confirmPassword', v)}
              error={errors.confirmPassword}
              required
            />

            {role === 'CLIENT' && (
              <Input
                label="Referral Code"
                placeholder="Optional"
                leftIcon="gift-outline"
                value={form.referralCode}
                onChangeText={(v) => updateField('referralCode', v)}
              />
            )}

            <Button
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  roleHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xxl,
  },
  footerText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  footerLink: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
  },
});
