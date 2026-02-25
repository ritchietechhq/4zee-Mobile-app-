import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import realtorService from '@/services/realtor.service';
import type { PropertyType, CreateListingRequest } from '@/types';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: string }[] = [
  { value: 'HOUSE', label: 'House', icon: 'home-outline' },
  { value: 'APARTMENT', label: 'Apartment', icon: 'business-outline' },
  { value: 'LAND', label: 'Land', icon: 'earth-outline' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: 'storefront-outline' },
  { value: 'INDUSTRIAL', label: 'Industrial', icon: 'construct-outline' },
];

const AMENITY_OPTIONS = [
  'Swimming Pool', 'Generator', 'Security', 'Parking',
  'Garden', 'Gym', 'CCTV', 'Borehole', 'Solar Panel',
  'Elevator', 'Balcony', 'Smart Home', 'Air Conditioning',
];

export default function AddListingScreen() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    type: '' as PropertyType | '',
    bedrooms: '',
    bathrooms: '',
    size: '',
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<{ uri: string; uploading?: boolean; url?: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
  };

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    });
    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        ...result.assets.map((a) => ({ uri: a.uri })),
      ]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.location.trim()) errs.location = 'Location is required.';
    if (!form.price.trim() || isNaN(Number(form.price))) errs.price = 'Valid price is required.';
    if (!form.type) errs.type = 'Select a property type.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const uploadAllImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.url) {
        urls.push(img.url);
        continue;
      }
      setImages((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, uploading: true } : item)),
      );
      try {
        const fd = new FormData();
        const filename = img.uri.split('/').pop() || `image_${i}.jpg`;
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        fd.append('file', { uri: img.uri, name: filename, type: mimeType } as any);
        fd.append('folder', 'properties');
        const url = await realtorService.uploadImage(fd);
        urls.push(url);
        setImages((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, uploading: false, url } : item)),
        );
      } catch (err) {
        setImages((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, uploading: false } : item)),
        );
        throw new Error(`Failed to upload image ${i + 1}`);
      }
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      // Upload images first
      let mediaUrls: string[] = [];
      if (images.length > 0) {
        mediaUrls = await uploadAllImages();
      }

      const payload: CreateListingRequest = {
        title: form.title.trim(),
        description: form.description.trim() || '',
        location: form.location.trim(),
        price: Math.round(Number(form.price)),
        type: form.type as PropertyType,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : [],
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        size: form.size ? Number(form.size) : undefined,
        amenities: amenities.length > 0 ? amenities : undefined,
      };

      if (__DEV__) console.log('[CreateListing] payload:', JSON.stringify(payload, null, 2));

      await realtorService.createListing(payload);

      Alert.alert('Success', 'Your listing has been created!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      if (__DEV__) console.error('[CreateListing] error:', JSON.stringify(err, null, 2));
      // Backend may return message as string OR string[] (NestJS ValidationPipe)
      const raw =
        err?.error?.message   // Standard API envelope
        ?? err?.message       // NestJS default / fallback
        ?? 'Failed to create listing.';
      const message = Array.isArray(raw) ? raw.join('\n') : String(raw);
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Listing</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Property Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSub}>Add up to 10 photos of your property</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((img, i) => (
                <View key={i} style={styles.imageThumb}>
                  <Image source={{ uri: img.uri }} style={styles.thumbImg} contentFit="cover" />
                  {img.uploading && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator size="small" color={colors.white} />
                    </View>
                  )}
                  {img.url && (
                    <View style={styles.uploadedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeImg} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 10 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <Card variant="outlined" padding="lg" style={styles.formCard}>
            <Text style={styles.cardTitle}>Basic Information</Text>

            <Input
              label="Title"
              placeholder="e.g. 3 Bedroom Duplex in Lekki"
              value={form.title}
              onChangeText={(v) => updateField('title', v)}
              error={errors.title}
              required
            />

            <Input
              label="Location"
              placeholder="e.g. Lekki Phase 1, Lagos"
              leftIcon="location-outline"
              value={form.location}
              onChangeText={(v) => updateField('location', v)}
              error={errors.location}
              required
            />

            <Input
              label="Price (₦)"
              placeholder="e.g. 75000000"
              leftIcon="cash-outline"
              keyboardType="numeric"
              value={form.price}
              onChangeText={(v) => updateField('price', v)}
              error={errors.price}
              required
            />

            <Input
              label="Description"
              placeholder="Describe the property..."
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              multiline
              numberOfLines={4}
            />
          </Card>

          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Type</Text>
            {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
            <View style={styles.typeGrid}>
              {PROPERTY_TYPES.map((pt) => (
                <TouchableOpacity
                  key={pt.value}
                  style={[styles.typeChip, form.type === pt.value && styles.typeChipActive]}
                  onPress={() => { updateField('type', pt.value); }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={pt.icon as any}
                    size={18}
                    color={form.type === pt.value ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.typeLabel, form.type === pt.value && styles.typeLabelActive]}>
                    {pt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Property Details */}
          <Card variant="outlined" padding="lg" style={styles.formCard}>
            <Text style={styles.cardTitle}>Property Details</Text>
            <View style={styles.row}>
              <Input
                label="Bedrooms"
                placeholder="0"
                keyboardType="numeric"
                value={form.bedrooms}
                onChangeText={(v) => updateField('bedrooms', v)}
                containerStyle={styles.thirdInput}
              />
              <Input
                label="Bathrooms"
                placeholder="0"
                keyboardType="numeric"
                value={form.bathrooms}
                onChangeText={(v) => updateField('bathrooms', v)}
                containerStyle={styles.thirdInput}
              />
              <Input
                label="Size (sqm)"
                placeholder="0"
                keyboardType="numeric"
                value={form.size}
                onChangeText={(v) => updateField('size', v)}
                containerStyle={styles.thirdInput}
              />
            </View>
          </Card>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {AMENITY_OPTIONS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.amenityChip, amenities.includes(a) && styles.amenityChipActive]}
                  onPress={() => toggleAmenity(a)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={amenities.includes(a) ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={amenities.includes(a) ? colors.white : colors.textSecondary}
                  />
                  <Text style={[styles.amenityLabel, amenities.includes(a) && styles.amenityLabelActive]}>
                    {a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit */}
          <Button
            title={isSubmitting ? 'Creating...' : 'Create Listing'}
            onPress={handleSubmit}
            loading={isSubmitting}
            fullWidth
            size="lg"
            style={{ marginBottom: Spacing.xxxxl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
    backgroundColor: colors.cardBackground,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  scroll: { padding: Spacing.xl, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.xs },
  sectionSub: { ...Typography.caption, color: colors.textMuted, marginBottom: Spacing.md },
  formCard: { marginBottom: Spacing.xl },
  cardTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.sm },
  thirdInput: { flex: 1 },
  // Images
  imageRow: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  imageThumb: { width: 80, height: 80, borderRadius: BorderRadius.md, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadedBadge: { position: 'absolute', bottom: 2, right: 2 },
  removeImg: { position: 'absolute', top: -4, right: -4 },
  addImageBtn: {
    width: 80, height: 80, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  addImageText: { ...Typography.small, color: colors.primary, fontWeight: '600' },
  // Property Type
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { ...Typography.captionMedium, color: colors.textSecondary },
  typeLabelActive: { color: colors.white },
  errorText: { ...Typography.caption, color: colors.error, marginBottom: Spacing.sm },
  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  amenityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  amenityLabel: { ...Typography.caption, color: colors.textSecondary },
  amenityLabelActive: { color: colors.white },
});
