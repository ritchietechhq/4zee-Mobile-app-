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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import authService from '@/services/auth.service';
import { isValidPassword } from '@/utils/validators';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setApiError(null);
    const validation: Record<string, string> = {};
    if (!isValidPassword(password)) {
      validation.password =
        'Password must be at least 8 characters with 1 uppercase letter and 1 number.';
    }
    if (password !== confirmPassword) {
      validation.confirmPassword = 'Passwords do not match.';
    }
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    setIsLoading(true);
    try {
      await authService.resetPassword({
        token: token || '',
        newPassword: password,
      });
      setIsSuccess(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to reset password. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successText}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <Button
            title="Sign In"
            onPress={() => router.replace('/(auth)/login')}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your new password below.</Text>
          </View>

          {apiError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          <Input
            label="New Password"
            placeholder="Min 8 characters"
            leftIcon="lock-closed-outline"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            hint="At least 8 characters, 1 uppercase, 1 number"
            required
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-enter your password"
            leftIcon="lock-closed-outline"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            required
          />

          <Button
            title="Reset Password"
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="lg"
          />
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
    marginBottom: Spacing.xxxl,
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
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  successTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  successText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
  },
});
