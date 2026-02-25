// ============================================================
// Bank Accounts Screen — Realtor
// Manage bank accounts: list, add (verify flow), set default, delete
// ============================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { bankAccountService } from '@/services/bank-account.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useRealtorColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { BankAccount, Bank, VerifyAndSaveResponse } from '@/types';

type AddStep = 'select-bank' | 'enter-number' | 'confirm';

export default function BankAccountsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useRealtorColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ── List state ──
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Add modal state ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<AddStep>('select-bank');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [savedResult, setSavedResult] = useState<VerifyAndSaveResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // ── Load accounts ──
  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  const loadAccounts = async () => {
    try {
      const data = await bankAccountService.list();
      if (Array.isArray(data)) {
        setAccounts(data);
      } else if (data && typeof data === 'object' && 'accounts' in (data as any)) {
        setAccounts((data as any).accounts);
      }
    } catch (e) {
      console.error('Failed to load bank accounts:', e);
      // Don't clear existing accounts on refresh error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAccounts();
  };

  // ── Set Default ──
  const handleSetDefault = (account: BankAccount) => {
    if (account.isDefault) return;
    Alert.alert('Set Default', `Make ${account.bankName} (****${account.accountNumber.slice(-4)}) your default payout account?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await bankAccountService.setDefault(account.id);
            setAccounts((prev) =>
              prev.map((a) => ({ ...a, isDefault: a.id === account.id }))
            );
          } catch (e: any) {
            Alert.alert('Error', e?.error?.message || 'Failed to set default account.');
          }
        },
      },
    ]);
  };

  // ── Delete ──
  const handleDelete = (account: BankAccount) => {
    if (account.isDefault) {
      Alert.alert('Cannot Delete', 'You cannot delete your default bank account. Set another account as default first.');
      return;
    }
    Alert.alert('Delete Account', `Remove ${account.bankName} (****${account.accountNumber.slice(-4)})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await bankAccountService.remove(account.id);
            setAccounts((prev) => prev.filter((a) => a.id !== account.id));
          } catch (e: any) {
            Alert.alert('Error', e?.error?.message || 'Failed to delete account.');
          }
        },
      },
    ]);
  };

  // ── Add Flow ──
  const openAddModal = async () => {
    resetAddForm();
    setShowAddModal(true);
    if (banks.length === 0) {
      setBanksLoading(true);
      try {
        const data = await bankAccountService.getBanks();
        setBanks(data);
      } catch (e: any) {
        Alert.alert('Error', 'Failed to load banks. Please try again.');
        setShowAddModal(false);
      } finally {
        setBanksLoading(false);
      }
    }
  };

  const resetAddForm = () => {
    setAddStep('select-bank');
    setSelectedBank(null);
    setAccountNumber('');
    setSavedResult(null);
    setBankSearch('');
  };

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setAddStep('enter-number');
  };

  const handleVerifyAndSave = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;
    setIsVerifying(true);
    try {
      const result = await bankAccountService.verifyAndSave({
        accountNumber,
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
      });
      setSavedResult(result);

      // Add the saved account to local state immediately
      if (result.id) {
        setAccounts((prev) => {
          // If this is now default, unset previous default
          const updated = result.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : [...prev];
          // Don't add if it already exists (alreadyExists case)
          if (result.alreadyExists || prev.some((a) => a.id === result.id)) {
            return updated.map((a) =>
              a.id === result.id ? { ...a, ...result, createdAt: a.createdAt } : a
            );
          }
          return [...updated, {
            id: result.id,
            accountName: result.accountName,
            accountNumber: result.accountNumber,
            bankCode: result.bankCode,
            bankName: result.bankName,
            isDefault: result.isDefault,
            isVerified: result.isVerified,
            createdAt: new Date().toISOString(),
          }];
        });
      }

      setAddStep('confirm');
    } catch (e: any) {
      Alert.alert(
        'Verification Failed',
        e?.error?.message || 'Could not verify this account. Please check the details and try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDone = () => {
    setShowAddModal(false);
    resetAddForm();
    // Refresh from server in background for full sync
    loadAccounts().catch(() => {});
  };

  const filteredBanks = bankSearch
    ? banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

  // ── Renderers ──
  const renderAccount = ({ item }: { item: BankAccount }) => (
    <Card variant="outlined" padding="lg" style={styles.accountCard}>
      <View style={styles.accountRow}>
        <View style={styles.bankIcon}>
          <Ionicons name="business" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.accountNameRow}>
            <Text style={styles.bankName} numberOfLines={1}>{item.bankName}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>Default</Text>
              </View>
            )}
          </View>
          <Text style={styles.accountName}>{item.accountName}</Text>
          <Text style={styles.accountNum}>****{item.accountNumber.slice(-4)}</Text>
        </View>
      </View>
      <View style={styles.accountActions}>
        {!item.isDefault && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item)} activeOpacity={0.7}>
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={styles.actionBtnText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
          <Text style={[styles.actionBtnText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderAddStepContent = () => {
    switch (addStep) {
      case 'select-bank':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalStepTitle}>Select Your Bank</Text>
            <View style={styles.bankSearchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.bankSearchInput}
                placeholder="Search banks..."
                placeholderTextColor={colors.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
            </View>
            {banksLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading banks...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(b) => b.code}
                style={styles.bankList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => handleSelectBank(item)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.bankItemIcon}>
                      <Ionicons name="business-outline" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.bankItemName}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.bankSep} />}
                ListEmptyComponent={
                  <View style={styles.emptyBanks}>
                    <Text style={styles.emptyBanksText}>No banks found</Text>
                  </View>
                }
              />
            )}
          </View>
        );

      case 'enter-number':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalStepTitle}>Enter Account Number</Text>
            <Card variant="outlined" padding="lg" style={styles.selectedBankCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Ionicons name="business" size={18} color={colors.primary} />
                <Text style={styles.selectedBankName}>{selectedBank?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setAddStep('select-bank')}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </Card>
            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.numInput}
                placeholder="0123456789"
                placeholderTextColor={colors.textMuted}
                value={accountNumber}
                onChangeText={(t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
              <Text style={styles.inputHint}>{accountNumber.length}/10 digits</Text>
            </View>
            <Button
              title={isVerifying ? 'Verifying & Saving...' : 'Verify & Add Account'}
              onPress={handleVerifyAndSave}
              loading={isVerifying}
              disabled={accountNumber.length !== 10 || isVerifying}
              variant="primary"
              size="lg"
            />
          </View>
        );

      case 'confirm':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.modalStepTitle}>Account Added!</Text>
            <Card variant="elevated" padding="xl" style={styles.confirmCard}>
              <View style={styles.confirmIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              </View>
              <Text style={styles.confirmName}>{savedResult?.accountName}</Text>
              <Text style={styles.confirmDetails}>{savedResult?.bankName} · {savedResult?.accountNumber}</Text>
              {savedResult?.isDefault && (
                <View style={styles.confirmDefaultBadge}>
                  <Ionicons name="star" size={12} color={colors.success} />
                  <Text style={styles.confirmDefaultText}>Default payout account</Text>
                </View>
              )}
              {savedResult?.alreadyExists && (
                <Text style={styles.confirmAlreadyExists}>This account was already on file.</Text>
              )}
            </Card>
            <Button
              title="Done"
              onPress={handleDone}
              variant="primary"
              size="lg"
              icon={<Ionicons name="checkmark" size={20} color={colors.white} />}
            />
          </View>
        );
    }
  };

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
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={openAddModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.skeletonWrap}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={44} height={44} borderRadius={12} />
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
                <Skeleton width="30%" height={10} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </View>
      ) : accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="card-outline"
            title="No Bank Accounts"
            description="Add a bank account to receive your commission payouts."
          />
          <Button
            title="Add Bank Account"
            onPress={openAddModal}
            variant="primary"
            size="lg"
            style={styles.emptyAddBtn}
            icon={<Ionicons name="add-circle" size={20} color={colors.white} />}
          />
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccount}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addFooterBtn} onPress={openAddModal} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addFooterText}>Add Another Account</Text>
            </TouchableOpacity>
          }
        />
      )}

      {/* Add Account Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.sm }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Bank Account</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {(['select-bank', 'enter-number', 'confirm'] as AddStep[]).map((step, i) => (
              <React.Fragment key={step}>
                <View
                  style={[
                    styles.stepDot,
                    (addStep === step || ['select-bank', 'enter-number', 'confirm'].indexOf(addStep) >= i) && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      ['select-bank', 'enter-number', 'confirm'].indexOf(addStep) >= i && styles.stepDotTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
                {i < 2 && (
                  <View
                    style={[
                      styles.stepLine,
                      ['select-bank', 'enter-number', 'confirm'].indexOf(addStep) > i && styles.stepLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          {renderAddStepContent()}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // ── Header ──
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
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── List ──
  listContent: { padding: Spacing.xl, gap: Spacing.md },

  accountCard: { gap: Spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  bankIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bankName: { ...Typography.bodySemiBold, color: colors.textPrimary, flex: 1 },
  defaultBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultBadgeText: { ...Typography.small, color: colors.success, fontWeight: '600' },
  accountName: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
  accountNum: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
  accountActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: Spacing.md,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionBtnText: { ...Typography.captionMedium, color: colors.primary },

  addFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  addFooterText: { ...Typography.bodySemiBold, color: colors.primary },

  // ── Skeleton ──
  skeletonWrap: { padding: Spacing.xl, gap: Spacing.md },
  skeletonCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
  },

  // ── Empty ──
  emptyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyAddBtn: { marginTop: Spacing.xl },

  // ── Modal ──
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: { ...Typography.h4, color: colors.textPrimary },
  modalBody: { flex: 1, padding: Spacing.xl },
  modalStepTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.lg },

  // ── Step Indicator ──
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxxl,
    backgroundColor: colors.cardBackground,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotText: { ...Typography.captionMedium, color: colors.textMuted },
  stepDotTextActive: { color: colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.borderLight, marginHorizontal: Spacing.sm },
  stepLineActive: { backgroundColor: colors.primary },

  // ── Bank Search ──
  bankSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bankSearchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.textPrimary,
    padding: 0,
  },
  bankList: { flex: 1 },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  bankItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankItemName: { ...Typography.body, color: colors.textPrimary, flex: 1 },
  bankSep: { height: 1, backgroundColor: colors.borderLight },
  emptyBanks: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyBanksText: { ...Typography.body, color: colors.textMuted },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.body, color: colors.textMuted },

  // ── Enter Number ──
  selectedBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  selectedBankName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  changeLink: { ...Typography.captionMedium, color: colors.primary },
  inputWrap: { marginBottom: Spacing.xl },
  inputLabel: { ...Typography.captionMedium, color: colors.textSecondary, marginBottom: Spacing.sm },
  numInput: {
    ...Typography.h3,
    color: colors.textPrimary,
    letterSpacing: 3,
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
  inputHint: { ...Typography.small, color: colors.textMuted, textAlign: 'right', marginTop: Spacing.xs },

  // ── Confirm / Success ──
  confirmCard: { alignItems: 'center', marginBottom: Spacing.xl },
  confirmIcon: { marginBottom: Spacing.md },
  confirmName: { ...Typography.h3, color: colors.textPrimary, textAlign: 'center' },
  confirmDetails: { ...Typography.body, color: colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
  confirmDefaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: colors.successLight,
    borderRadius: BorderRadius.full,
  },
  confirmDefaultText: { ...Typography.captionMedium, color: colors.success },
  confirmAlreadyExists: { ...Typography.caption, color: colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' as const },
});
