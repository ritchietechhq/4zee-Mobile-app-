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
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const PROPERTY_TYPES = ['LAND', 'HOUSE', 'APARTMENT', 'COMMERCIAL', 'MIXED_USE'];

export default function CreatePropertyScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    type: 'LAND',
    bedrooms: '',
    bathrooms: '',
    area: '',
    address: '',
    city: '',
    state: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.price || !form.location.trim()) {
      Alert.alert('Validation', 'Title, description, price and location are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: parseInt(form.price, 10),
        location: form.location.trim(),
        type: form.type,
      };
      if (form.bedrooms) payload.bedrooms = parseInt(form.bedrooms, 10);
      if (form.bathrooms) payload.bathrooms = parseInt(form.bathrooms, 10);
      if (form.area) payload.area = parseFloat(form.area);
      if (form.address) payload.address = form.address.trim();
      if (form.city) payload.city = form.city.trim();
      if (form.state) payload.state = form.state.trim();

      await adminService.createProperty(payload);
      Alert.alert('Success', 'Property created successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      if (__DEV__) console.error('[CreateProperty] error:', JSON.stringify(e, null, 2));
      const raw = e?.error?.message ?? e?.message ?? 'Failed to create property';
      const message = Array.isArray(raw) ? raw.join('\n') : String(raw);
      Alert.alert('Error', message);
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
          <Text style={styles.headerTitle}>Create Property</Text>
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
            <Input
              label="Title"
              placeholder="e.g. Lekki Phase 1 - Plot 12"
              value={form.title}
              onChangeText={(v) => updateField('title', v)}
              required
            />
            <Input
              label="Description"
              placeholder="Describe the property..."
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={4}
              required
            />
            <Input
              label="Price (₦ Naira)"
              placeholder="e.g. 45000000"
              value={form.price}
              onChangeText={(v) => updateField('price', v)}
              keyboardType="numeric"
              required
            />
            <Input
              label="Location"
              placeholder="e.g. Lekki Phase 1, Lagos"
              value={form.location}
              onChangeText={(v) => updateField('location', v)}
              required
            />

            {/* Property Type Selector */}
            <Text style={styles.fieldLabel}>Property Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
              {PROPERTY_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: form.type === t ? colors.primary : colors.surface,
                      borderColor: form.type === t ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => updateField('type', t)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: form.type === t ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {t.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Bedrooms"
                  placeholder="0"
                  value={form.bedrooms}
                  onChangeText={(v) => updateField('bedrooms', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Bathrooms"
                  placeholder="0"
                  value={form.bathrooms}
                  onChangeText={(v) => updateField('bathrooms', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Area (sqm)"
                  placeholder="0"
                  value={form.area}
                  onChangeText={(v) => updateField('area', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label="Address"
              placeholder="Full address"
              value={form.address}
              onChangeText={(v) => updateField('address', v)}
            />
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="City"
                  placeholder="Lagos"
                  value={form.city}
                  onChangeText={(v) => updateField('city', v)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="State"
                  placeholder="Lagos"
                  value={form.state}
                  onChangeText={(v) => updateField('state', v)}
                />
              </View>
            </View>

            <Button
              title="Create Property"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              onPress={handleSubmit}
              style={{ marginTop: Spacing.lg }}
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
    fieldLabel: {
      ...Typography.captionMedium,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    typeRow: {
      marginBottom: Spacing.lg,
    },
    typeChip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      marginRight: Spacing.sm,
    },
    typeChipText: { ...Typography.captionMedium },
    fieldRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
  });
