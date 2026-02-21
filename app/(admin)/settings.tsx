import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '@/services/admin.service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { SystemSetting } from '@/types/admin';

export default function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [categories, setCategories] = useState<string[]>([]);
  const [settingsByCategory, setSettingsByCategory] = useState<Record<string, SystemSetting[]>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await adminService.getSettings();
      if (data) {
        const cats = Object.keys(data);
        setCategories(cats);
        setSettingsByCategory(data);
      }
    } catch (e) {
      console.error('Settings fetch error:', e);
      // Try initializing if first time
      try {
        await adminService.initializeSettings();
        const data = await adminService.getSettings();
        if (data) {
          setCategories(Object.keys(data));
          setSettingsByCategory(data);
        }
      } catch (_) {}
    }
    setEditedValues({});
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

  const updateValue = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  const handleBulkSave = useCallback(async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const settings = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
      await adminService.bulkUpdateSettings({ settings });
      Alert.alert('Success', 'Settings updated');
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  }, [editedValues, hasChanges, fetchData]);

  const handleMaintenanceToggle = useCallback(
    async (enable: boolean) => {
      Alert.alert(
        enable ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode',
        enable
          ? 'Users will see a maintenance message. Are you sure?'
          : 'This will bring the system back online.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: enable ? 'Enable' : 'Disable',
            style: enable ? 'destructive' : 'default',
            onPress: async () => {
              try {
                if (enable) await adminService.enableMaintenance('System under maintenance');
                else await adminService.disableMaintenance();
                Alert.alert('Done', `Maintenance mode ${enable ? 'enabled' : 'disabled'}`);
                fetchData();
              } catch (e: any) {
                Alert.alert('Error', e?.error?.message || 'Toggle failed');
              }
            },
          },
        ],
      );
    },
    [fetchData],
  );

  const renderSetting = (setting: SystemSetting) => {
    const currentValue = editedValues[setting.key] ?? setting.value;
    const isEdited = editedValues[setting.key] !== undefined;

    if (setting.type === 'BOOLEAN') {
      return (
        <View key={setting.key} style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingKey}>{setting.key.replace(/_/g, ' ')}</Text>
            {setting.description && <Text style={styles.settingDesc}>{setting.description}</Text>}
          </View>
          <Switch
            value={currentValue === 'true'}
            onValueChange={(v) => updateValue(setting.key, v ? 'true' : 'false')}
            trackColor={{ false: colors.borderLight, true: colors.primaryLight }}
            thumbColor={currentValue === 'true' ? colors.primary : colors.textMuted}
          />
        </View>
      );
    }

    return (
      <View key={setting.key} style={styles.settingRow}>
        <View style={{ flex: 1, marginRight: Spacing.md }}>
          <Text style={styles.settingKey}>{setting.key.replace(/_/g, ' ')}</Text>
          {setting.description && <Text style={styles.settingDesc}>{setting.description}</Text>}
        </View>
        <TextInput
          style={[styles.settingInput, isEdited && { borderColor: colors.primary }]}
          value={currentValue}
          onChangeText={(v) => updateValue(setting.key, v)}
          keyboardType={setting.type === 'NUMBER' ? 'numeric' : 'default'}
          placeholderTextColor={colors.textMuted}
        />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          {hasChanges ? (
            <TouchableOpacity onPress={handleBulkSave} disabled={isSaving}>
              <Text style={[styles.saveBtn, isSaving && { opacity: 0.5 }]}>
                {isSaving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {isLoading ? (
          <View style={{ padding: Spacing.xl }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} style={{ marginBottom: 12 }} />)}
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
          >
            {/* Maintenance Mode */}
            <Card style={[styles.maintenanceCard, { borderColor: colors.warning }]}>
              <View style={styles.maintenanceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.maintenanceTitle}>
                    <Ionicons name="construct-outline" size={16} color={colors.warning} /> Maintenance Mode
                  </Text>
                  <Text style={styles.maintenanceDesc}>
                    When enabled, users will see a maintenance notice
                  </Text>
                </View>
                <View style={{ gap: Spacing.xs }}>
                  <TouchableOpacity
                    style={[styles.maintenanceBtn, { backgroundColor: colors.errorLight }]}
                    onPress={() => handleMaintenanceToggle(true)}
                  >
                    <Text style={[styles.maintenanceBtnText, { color: colors.error }]}>Enable</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.maintenanceBtn, { backgroundColor: colors.successLight }]}
                    onPress={() => handleMaintenanceToggle(false)}
                  >
                    <Text style={[styles.maintenanceBtnText, { color: colors.success }]}>Disable</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Settings by Category */}
            {categories.map((cat) => (
              <View key={cat} style={styles.categorySection}>
                <Text style={styles.categoryTitle}>{cat.replace(/_/g, ' ')}</Text>
                <Card style={styles.categoryCard}>
                  {(settingsByCategory[cat] ?? []).map(renderSetting)}
                </Card>
              </View>
            ))}

            {categories.length === 0 && (
              <Card style={{ alignItems: 'center', padding: Spacing.xxl }}>
                <Ionicons name="settings-outline" size={48} color={colors.textMuted} />
                <Text style={{ ...Typography.body, color: colors.textSecondary, marginTop: Spacing.md }}>
                  No settings configured yet
                </Text>
                <Button
                  title="Initialize Settings"
                  variant="primary"
                  size="sm"
                  onPress={async () => {
                    try {
                      await adminService.initializeSettings();
                      fetchData();
                    } catch (e: any) {
                      Alert.alert('Error', e?.error?.message || 'Init failed');
                    }
                  }}
                  style={{ marginTop: Spacing.lg }}
                />
              </Card>
            )}
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
    saveBtn: { ...Typography.bodyMedium, color: colors.primary },
    content: { padding: Spacing.xl, paddingBottom: 40 },
    maintenanceCard: {
      borderWidth: 1,
      marginBottom: Spacing.xl,
    },
    maintenanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    maintenanceTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
    maintenanceDesc: { ...Typography.caption, color: colors.textSecondary, marginTop: 2 },
    maintenanceBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
    },
    maintenanceBtnText: { ...Typography.captionMedium },
    categorySection: { marginBottom: Spacing.xl },
    categoryTitle: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    categoryCard: { padding: 0 },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    settingKey: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    settingDesc: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    settingInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      ...Typography.caption,
      color: colors.textPrimary,
      minWidth: 100,
      textAlign: 'right',
    },
  });
