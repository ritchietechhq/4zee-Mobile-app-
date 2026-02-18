import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import authService from '@/services/auth.service';
import { isValidPassword } from '@/utils/validators';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

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
        error instanceof Error
          ? error.message
          : 'Failed to reset password. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <Ionicons
                name="checkmark-circle"
                size={44}
                color={Colors.success}
              />
            </View>
          </View>
          <Text style={styles.successTitle}>Password Reset!</Text>
          <Text style={styles.successText}>
            Your password has been successfully updated. You can now sign in with
            your new password.
          </Text>
          <Button
            title="Continue to Sign In"
            onPress={() => router.replace('/login')}
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
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>
              Your new password must be different from your previously used
              password.
            </Text>
          </View>

          {/* Error */}
          {apiError && (
            <View style={styles.errorBanner}>
              <View style={styles.errorIconWrap}>
                <Ionicons name="alert-circle" size={18} color={Colors.error} />
              </View>
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Password strength hints */}
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Password requirements:</Text>
              <View style={styles.hintRow}>
                <Ionicons
                  name={
                    password.length >= 8
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={password.length >= 8 ? Colors.success : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.hintText,
                    password.length >= 8 && styles.hintTextMet,
                  ]}
                >
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons
                  name={
                    /[A-Z]/.test(password)
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={/[A-Z]/.test(password) ? Colors.success : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.hintText,
                    /[A-Z]/.test(password) && styles.hintTextMet,
                  ]}
                >
                  One uppercase letter
                </Text>
              </View>
              <View style={styles.hintRow}>
                <Ionicons
                  name={
                    /[0-9]/.test(password)
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={16}
                  color={/[0-9]/.test(password) ? Colors.success : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.hintText,
                    /[0-9]/.test(password) && styles.hintTextMet,
                  ]}
                >
                  One number
                </Text>
              </View>
            </View>

            <Input
              label="New Password"
              placeholder="Enter new password"
              leftIcon="lock-closed-outline"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
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
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
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
  errorIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    flex: 1,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  hintBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  hintTitle: {
    ...Typography.captionMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hintText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  hintTextMet: {
    color: Colors.success,
  },
  // Success state
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  successIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  successIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  successText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxxl,
    lineHeight: 22,
  },
});
