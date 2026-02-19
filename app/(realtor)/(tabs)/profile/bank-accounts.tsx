// ============================================================
// Bank Accounts Screen — Realtor
// Manage bank accounts: list, add (verify flow), set default, delete
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { BankAccount, Bank } from '@/types';

type AddStep = 'select-bank' | 'enter-number' | 'confirm';

export default function BankAccountsScreen() {
  const insets = useSafeAreaInsets();

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
  const [verifiedName, setVerifiedName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [makeDefault, setMakeDefault] = useState(false);

  // ── Load accounts ──
  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  const loadAccounts = async () => {
    try {
      const data = await bankAccountService.list();
      setAccounts(data);
    } catch (e) {
      console.error('Failed to load bank accounts:', e);
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
    setVerifiedName('');
    setBankSearch('');
    setMakeDefault(false);
  };

  const handleSelectBank = (bank: Bank) => {
    setSelectedBank(bank);
    setAddStep('enter-number');
  };

  const handleVerifyAccount = async () => {
    if (!selectedBank || accountNumber.length !== 10) return;
    setIsVerifying(true);
    try {
      const result = await bankAccountService.verifyAccount({
        bankCode: selectedBank.code,
        accountNumber,
      });
      setVerifiedName(result.accountName);
      setAddStep('confirm');
    } catch (e: any) {
      Alert.alert('Verification Failed', e?.error?.message || 'Could not verify this account. Please check the details and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!selectedBank) return;
    setIsSaving(true);
    try {
      await bankAccountService.add({
        bankCode: selectedBank.code,
        accountNumber,
        isDefault: makeDefault || accounts.length === 0,
      });
      setShowAddModal(false);
      resetAddForm();
      await loadAccounts();
      Alert.alert('Success', 'Bank account added successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to add bank account.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBanks = bankSearch
    ? banks.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
    : banks;

  // ── Renderers ──
  const renderAccount = ({ item }: { item: BankAccount }) => (
    <Card variant="outlined" padding="lg" style={styles.accountCard}>
      <View style={styles.accountRow}>
        <View style={styles.bankIcon}>
          <Ionicons name="business" size={20} color={Colors.primary} />
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
            <Ionicons name="star-outline" size={16} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
          <Text style={[styles.actionBtnText, { color: Colors.error }]}>Remove</Text>
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
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.bankSearchInput}
                placeholder="Search banks..."
                placeholderTextColor={Colors.textMuted}
                value={bankSearch}
                onChangeText={setBankSearch}
                autoFocus
              />
            </View>
            {banksLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.primary} />
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
                      <Ionicons name="business-outline" size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.bankItemName}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
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
                <Ionicons name="business" size={18} color={Colors.primary} />
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
                placeholderTextColor={Colors.textMuted}
                value={accountNumber}
                onChangeText={(t) => setAccountNumber(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
              <Text style={styles.inputHint}>{accountNumber.length}/10 digits</Text>
            </View>
            <Button
              title={isVerifying ? 'Verifying...' : 'Verify Account'}
              onPress={handleVerifyAccount}
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
            <Text style={styles.modalStepTitle}>Confirm Account</Text>
            <Card variant="elevated" padding="xl" style={styles.confirmCard}>
              <View style={styles.confirmIcon}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
              </View>
              <Text style={styles.confirmName}>{verifiedName}</Text>
              <Text style={styles.confirmDetails}>{selectedBank?.name} · {accountNumber}</Text>
            </Card>
            <TouchableOpacity
              style={styles.defaultToggle}
              onPress={() => setMakeDefault(!makeDefault)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={makeDefault ? 'checkbox' : 'square-outline'}
                size={22}
                color={makeDefault ? Colors.primary : Colors.textMuted}
              />
              <Text style={styles.defaultToggleText}>Set as default payout account</Text>
            </TouchableOpacity>
            <Button
              title={isSaving ? 'Saving...' : 'Add Bank Account'}
              onPress={handleSaveAccount}
              loading={isSaving}
              variant="primary"
              size="lg"
              icon={<Ionicons name="add-circle" size={20} color={Colors.white} />}
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
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={openAddModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
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
            icon={<Ionicons name="add-circle" size={20} color={Colors.white} />}
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
              tintColor={Colors.primary}
            />
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addFooterBtn} onPress={openAddModal} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
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
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  addHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
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
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  bankName: { ...Typography.bodySemiBold, color: Colors.textPrimary, flex: 1 },
  defaultBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  defaultBadgeText: { ...Typography.small, color: Colors.success, fontWeight: '600' },
  accountName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  accountNum: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  accountActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionBtnText: { ...Typography.captionMedium, color: Colors.primary },

  addFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  addFooterText: { ...Typography.bodySemiBold, color: Colors.primary },

  // ── Skeleton ──
  skeletonWrap: { padding: Spacing.xl, gap: Spacing.md },
  skeletonCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
  },

  // ── Empty ──
  emptyContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  emptyAddBtn: { marginTop: Spacing.xl },

  // ── Modal ──
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: { ...Typography.h4, color: Colors.textPrimary },
  modalBody: { flex: 1, padding: Spacing.xl },
  modalStepTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.lg },

  // ── Step Indicator ──
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxxxl,
    backgroundColor: Colors.white,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotText: { ...Typography.captionMedium, color: Colors.textMuted },
  stepDotTextActive: { color: Colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.sm },
  stepLineActive: { backgroundColor: Colors.primary },

  // ── Bank Search ──
  bankSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bankSearchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankItemName: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  bankSep: { height: 1, backgroundColor: Colors.borderLight },
  emptyBanks: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyBanksText: { ...Typography.body, color: Colors.textMuted },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { ...Typography.body, color: Colors.textMuted },

  // ── Enter Number ──
  selectedBankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  selectedBankName: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  changeLink: { ...Typography.captionMedium, color: Colors.primary },
  inputWrap: { marginBottom: Spacing.xl },
  inputLabel: { ...Typography.captionMedium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  numInput: {
    ...Typography.h3,
    color: Colors.textPrimary,
    letterSpacing: 3,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
  inputHint: { ...Typography.small, color: Colors.textMuted, textAlign: 'right', marginTop: Spacing.xs },

  // ── Confirm ──
  confirmCard: { alignItems: 'center', marginBottom: Spacing.xl },
  confirmIcon: { marginBottom: Spacing.md },
  confirmName: { ...Typography.h4, color: Colors.textPrimary, textAlign: 'center' },
  confirmDetails: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.xs },
  defaultToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  defaultToggleText: { ...Typography.body, color: Colors.textPrimary },
});
