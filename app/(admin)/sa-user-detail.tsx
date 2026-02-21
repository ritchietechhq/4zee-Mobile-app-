import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { adminService } from '@/services/admin.service';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SuperAdminUserDetail, SuperAdminUserRole } from '@/types/admin';

const ROLE_OPTIONS: { label: string; value: 'ADMIN' | 'CLIENT' | 'REALTOR' }[] = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Realtor', value: 'REALTOR' },
  { label: 'Client', value: 'CLIENT' },
];

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  SUPER_ADMIN: 'error',
  ADMIN: 'warning',
  REALTOR: 'info',
  CLIENT: 'default',
};

const KYC_BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  NOT_SUBMITTED: 'default',
};

export default function SuperAdminUserDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const role = useAuthStore((s) => s.role);
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const [user, setUser] = useState<SuperAdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Role change modal
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'CLIENT' | 'REALTOR' | null>(null);

  // Reset password modal
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await adminService.getUserDetail(userId);
      setUser(data);
    } catch (e) {
      console.error('Fetch user detail error:', e);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, [fetchUser]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUser();
    setIsRefreshing(false);
  }, [fetchUser]);

  const handleToggleActive = useCallback(async () => {
    if (!user || !userId) return;
    const action = user.isActive ? 'deactivate' : 'reactivate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: action === 'deactivate' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              if (user.isActive) {
                await adminService.deactivateUser(userId);
              } else {
                await adminService.reactivateUser(userId);
              }
              await fetchUser();
              Alert.alert('Success', `User ${action}d successfully`);
            } catch (e: any) {
              Alert.alert('Error', e?.message || `Failed to ${action} user`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [user, userId, fetchUser]);

  const handleChangeRole = useCallback(async () => {
    if (!userId || !selectedRole) return;
    setActionLoading(true);
    try {
      await adminService.changeUserRole(userId, { role: selectedRole });
      setRoleModalVisible(false);
      setSelectedRole(null);
      await fetchUser();
      Alert.alert('Success', `Role changed to ${selectedRole}`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to change role');
    } finally {
      setActionLoading(false);
    }
  }, [userId, selectedRole, fetchUser]);

  const handleResetPassword = useCallback(async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      const result = await adminService.resetUserPassword(userId);
      setTempPassword(result.temporaryPassword ?? null);
      setResetModalVisible(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  const handleUnlockUser = useCallback(async () => {
    if (!userId) return;
    setActionLoading(true);
    try {
      await adminService.unlockUser(userId);
      Alert.alert('Success', 'User account unlocked');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to unlock user');
    } finally {
      setActionLoading(false);
    }
  }, [userId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={{ padding: Spacing.xl }}>
            <Skeleton width="100%" height={200} style={{ borderRadius: BorderRadius.lg }} />
            <Skeleton width="100%" height={150} style={{ borderRadius: BorderRadius.lg, marginTop: Spacing.lg }} />
            <Skeleton width="100%" height={150} style={{ borderRadius: BorderRadius.lg, marginTop: Spacing.lg }} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>User Not Found</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const profile = user.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : user.email;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>User Detail</Text>
              <Text style={styles.headerSubtitle}>Admin</Text>
            </View>
            {actionLoading && <ActivityIndicator color={colors.primary} />}
          </View>

          {/* Profile Card */}
          <Card variant="elevated" padding="lg" style={styles.profileCard}>
            <View style={styles.avatarRow}>
              {profile?.profilePictureUrl ? (
                <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(profile?.firstName?.[0] || user.email[0]).toUpperCase()}
                    {(profile?.lastName?.[0] || '').toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{fullName}</Text>
                <Text style={styles.profileEmail}>{user.email}</Text>
                <View style={styles.badgeRow}>
                  <Badge
                    label={user.role.replace('_', ' ')}
                    variant={ROLE_BADGE_VARIANT[user.role] ?? 'default'}
                    size="md"
                  />
                  <Badge
                    label={user.isActive ? 'Active' : 'Inactive'}
                    variant={user.isActive ? 'success' : 'error'}
                    size="md"
                  />
                  {user.twoFactorEnabled && (
                    <Badge label="2FA" variant="info" size="sm" />
                  )}
                </View>
              </View>
            </View>
          </Card>

          {/* Profile Details */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {[
              { label: 'Phone', value: profile?.phone ?? '—' },
              { label: 'Address', value: profile?.address ?? '—' },
              { label: 'Date of Birth', value: profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : '—' },
              { label: 'KYC Status', value: profile?.kycStatus ?? 'NOT_SUBMITTED', isBadge: true },
              { label: 'Joined', value: formatDate(user.createdAt) },
              { label: 'Last Login', value: formatDate(user.lastLoginAt) },
            ].map((item) => (
              <View key={item.label} style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                {item.isBadge ? (
                  <Badge
                    label={(item.value as string).replace('_', ' ')}
                    variant={KYC_BADGE_VARIANT[item.value as string] ?? 'default'}
                    size="sm"
                  />
                ) : (
                  <Text style={styles.infoValue}>{item.value}</Text>
                )}
              </View>
            ))}
          </Card>

          {/* KYC Documents */}
          {user.kycDocuments && user.kycDocuments.length > 0 && (
            <Card variant="elevated" padding="lg" style={styles.section}>
              <Text style={styles.sectionTitle}>KYC Documents</Text>
              {user.kycDocuments.map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <Ionicons name="document-outline" size={20} color={colors.primary} />
                  <View style={styles.docInfo}>
                    <Text style={styles.docType}>{doc.type.replace('_', ' ')}</Text>
                    <Text style={styles.docDate}>{formatDate(doc.createdAt)}</Text>
                  </View>
                  <Badge
                    label={doc.status}
                    variant={KYC_BADGE_VARIANT[doc.status] ?? 'default'}
                    size="sm"
                  />
                </View>
              ))}
            </Card>
          )}

          {/* Sessions */}
          {user.sessions && user.sessions.length > 0 && (
            <Card variant="elevated" padding="lg" style={styles.section}>
              <Text style={styles.sectionTitle}>Active Sessions</Text>
              {user.sessions.slice(0, 5).map((session) => (
                <View key={session.id} style={styles.sessionRow}>
                  <Ionicons name="phone-portrait-outline" size={18} color={colors.textMuted} />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionAgent} numberOfLines={1}>
                      {session.userAgent || 'Unknown Device'}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {session.ipAddress} • {formatDate(session.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          )}

          {/* Actions */}
          <Card variant="elevated" padding="lg" style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>

            {/* Change Role — only if not SUPER_ADMIN and viewer is SUPER_ADMIN */}
            {user.role !== 'SUPER_ADMIN' && isSuperAdmin && (
              <Button
                title="Change Role"
                variant="outline"
                onPress={() => {
                  setSelectedRole(null);
                  setRoleModalVisible(true);
                }}
                style={styles.actionBtn}
              />
            )}

            {/* Activate / Deactivate — Super Admin only */}
            {isSuperAdmin && (
              <Button
                title={user.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                variant={user.isActive ? 'danger' : 'primary'}
                onPress={handleToggleActive}
                style={styles.actionBtn}
              />
            )}

            {/* Reset Password */}
            <Button
              title="Reset Password"
              variant="secondary"
              onPress={() => {
                Alert.alert(
                  'Reset Password',
                  `This will generate a new temporary password for ${user.email}. Continue?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', onPress: handleResetPassword },
                  ],
                );
              }}
              style={styles.actionBtn}
            />

            {/* Unlock Account */}
            <Button
              title="Unlock Account"
              variant="ghost"
              onPress={() => {
                Alert.alert(
                  'Unlock Account',
                  `Unlock ${user.email}'s account?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Unlock', onPress: handleUnlockUser },
                  ],
                );
              }}
              style={styles.actionBtn}
            />
          </Card>
        </ScrollView>

        {/* ─── Role Change Modal ─── */}
        <Modal
          visible={roleModalVisible}
          title="Change User Role"
          onClose={() => { setRoleModalVisible(false); setSelectedRole(null); }}
        >
          <Text style={styles.modalDesc}>
            Current role: <Text style={{ fontWeight: '700' }}>{user.role}</Text>
          </Text>
          <Text style={styles.modalLabel}>Select new role:</Text>
          {ROLE_OPTIONS.filter((r) => r.value !== user.role).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.roleOption,
                selectedRole === opt.value && { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedRole(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.roleOptionText,
                selectedRole === opt.value && { color: colors.primary, fontWeight: '700' },
              ]}>
                {opt.label}
              </Text>
              {selectedRole === opt.value && (
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => { setRoleModalVisible(false); setSelectedRole(null); }}
              style={{ flex: 1 }}
            />
            <Button
              title={actionLoading ? 'Changing...' : 'Change Role'}
              variant="primary"
              onPress={handleChangeRole}
              disabled={!selectedRole || actionLoading}
              style={{ flex: 1 }}
            />
          </View>
        </Modal>

        {/* ─── Reset Password Result Modal ─── */}
        <Modal
          visible={resetModalVisible}
          title="Password Reset"
          onClose={() => { setResetModalVisible(false); setTempPassword(null); }}
        >
          <Text style={styles.modalDesc}>Password has been reset for {user.email}.</Text>
          {tempPassword && (
            <View style={styles.tempPwBox}>
              <Text style={styles.tempPwLabel}>Temporary Password:</Text>
              <Text style={styles.tempPwValue} selectable>{tempPassword}</Text>
            </View>
          )}
          <Text style={styles.modalNote}>The user will be required to change this on next login.</Text>
          <Button
            title="Done"
            variant="primary"
            onPress={() => { setResetModalVisible(false); setTempPassword(null); }}
            style={{ marginTop: Spacing.lg }}
          />
        </Modal>
      </SafeAreaView>
    </>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.cardBackground,
      alignItems: 'center', justifyContent: 'center',
      ...Shadows.sm,
    },
    headerTitle: { ...Typography.h3, color: colors.textPrimary },
    headerSubtitle: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    profileCard: { marginHorizontal: Spacing.xl },
    avatarRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.border,
    },
    avatarPlaceholder: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarText: {
      ...Typography.h3,
      color: colors.primary,
      fontWeight: '800',
    },
    profileInfo: { flex: 1, marginLeft: Spacing.lg },
    profileName: { ...Typography.h4, color: colors.textPrimary },
    profileEmail: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      gap: Spacing.sm,
      flexWrap: 'wrap',
    },
    section: { marginHorizontal: Spacing.xl, marginTop: Spacing.lg },
    sectionTitle: {
      ...Typography.h4,
      color: colors.textPrimary,
      marginBottom: Spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: { ...Typography.caption, color: colors.textSecondary },
    infoValue: { ...Typography.bodyMedium, color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      gap: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    docInfo: { flex: 1 },
    docType: { ...Typography.bodyMedium, color: colors.textPrimary },
    docDate: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      gap: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionInfo: { flex: 1 },
    sessionAgent: { ...Typography.caption, color: colors.textPrimary },
    sessionMeta: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    actionBtn: { marginBottom: Spacing.md },
    modalDesc: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.md,
    },
    modalLabel: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: Spacing.sm,
    },
    roleOptionText: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    modalNote: {
      ...Typography.caption,
      color: colors.textMuted,
      marginTop: Spacing.md,
      fontStyle: 'italic',
    },
    tempPwBox: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginVertical: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    tempPwLabel: { ...Typography.captionMedium, color: colors.textSecondary, marginBottom: Spacing.xs },
    tempPwValue: {
      ...Typography.h4,
      color: colors.primary,
      fontFamily: 'monospace',
      letterSpacing: 1,
    },
  });
