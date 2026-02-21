// ============================================================
// Edit Profile Screen — Realtor
// Update personal info, upload profile picture
// ============================================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import userService from '@/services/user.service';
import { appendFile } from '@/utils/formData';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import type { UpdateProfileRequest } from '@/types';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const updateUser = useAuthStore((s) => s.updateUser);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
    address: '',
    city: '',
    state: '',
    dateOfBirth: '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!form.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+?234|0)?[789][01]\d{8}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Enter a valid Nigerian phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload: UpdateProfileRequest = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
      };

      const addressParts = [
        form.address.trim(),
        form.city.trim(),
        form.state.trim(),
      ].filter(Boolean);
      if (addressParts.length > 0) payload.address = addressParts.join(', ');
      if (form.dateOfBirth.trim()) payload.dateOfBirth = form.dateOfBirth.trim();

      await userService.updateProfile(payload);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.error?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll access to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadProfilePicture(result.assets[0].uri);
    }
  };

  const uploadProfilePicture = async (uri: string) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      await appendFile(formData, 'file', uri, filename, type);
      formData.append('category', 'PROFILE_PHOTO');

      const url = await userService.uploadProfilePicture(formData);
      updateUser({ profilePicture: url });
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.error?.message || 'Failed to upload photo. Please try again.'
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const showPhotoOptions = () => {
    Alert.alert('Change Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getInitials = () => {
    const first = form.firstName?.charAt(0)?.toUpperCase() ?? '';
    const last = form.lastName?.charAt(0)?.toUpperCase() ?? '';
    return `${first}${last}` || 'U';
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
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
            {/* Profile Picture */}
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={showPhotoOptions}
                activeOpacity={0.8}
                disabled={isUploadingPhoto}
              >
                <View style={styles.avatar}>
                  {isUploadingPhoto ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                  ) : user?.profilePicture ? (
                    <Image
                      source={{ uri: user.profilePicture }}
                      style={styles.avatarImg}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{getInitials()}</Text>
                  )}
                </View>
                <View style={styles.cameraBtn}>
                  <Ionicons name="camera" size={16} color={colors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to change photo</Text>
            </View>

            {/* Form */}
            <Card style={styles.formCard}>
              <Text style={styles.sectionLabel}>Personal Information</Text>

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
                label="Phone Number"
                placeholder="+234 801 234 5678"
                value={form.phone}
                onChangeText={(v) => updateField('phone', v)}
                keyboardType="phone-pad"
                error={errors.phone}
                required
                leftIcon="call-outline"
              />

              <Input
                label="Email Address"
                value={user?.email ?? ''}
                editable={false}
                leftIcon="mail-outline"
                containerStyle={styles.disabledInput}
              />

              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Address (Optional)</Text>

              <Input
                label="Street Address"
                placeholder="123 Main Street"
                value={form.address}
                onChangeText={(v) => updateField('address', v)}
                leftIcon="home-outline"
              />

              <View style={styles.row}>
                <Input
                  label="City"
                  placeholder="Lagos"
                  value={form.city}
                  onChangeText={(v) => updateField('city', v)}
                  containerStyle={styles.halfInput}
                />
                <Input
                  label="State"
                  placeholder="Lagos"
                  value={form.state}
                  onChangeText={(v) => updateField('state', v)}
                  containerStyle={styles.halfInput}
                />
              </View>

              <Input
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={form.dateOfBirth}
                onChangeText={(v) => updateField('dateOfBirth', v)}
                leftIcon="calendar-outline"
              />
            </Card>

            {/* Save Button */}
            <View style={styles.buttonSection}>
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={isLoading}
                variant="primary"
                size="lg"
                icon={<Ionicons name="checkmark" size={20} color={colors.white} />}
              />
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="ghost"
                size="lg"
                style={styles.cancelBtn}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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

  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.cardBackground,
    overflow: 'hidden' as const,
    ...Shadows.lg,
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { ...Typography.h1, color: colors.primary, fontSize: 34 },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cardBackground,
  },
  photoHint: {
    ...Typography.caption,
    color: colors.textMuted,
    marginTop: Spacing.sm,
  },

  formCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: { flex: 1 },
  disabledInput: { opacity: 0.6 },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: Spacing.xl,
  },

  buttonSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  cancelBtn: {
    backgroundColor: 'transparent',
  },
});
