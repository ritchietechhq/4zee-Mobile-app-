// ============================================================
// Edit Profile Screen — Client
// Update personal info, upload profile picture
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
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
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { UpdateProfileRequest } from '@/types';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
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

      // Build full address from address + city + state
      const addressParts = [
        form.address.trim(),
        form.city.trim(),
        form.state.trim(),
      ].filter(Boolean);
      if (addressParts.length > 0) payload.address = addressParts.join(', ');
      if (form.dateOfBirth.trim()) payload.dateOfBirth = form.dateOfBirth.trim();

      await userService.updateProfile(payload);
      await refreshUser(); // Refresh user data (no splash)
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

      formData.append('file', {
        uri,
        name: filename,
        type,
      } as any);
      formData.append('category', 'PROFILE_PHOTO');

      const url = await userService.uploadProfilePicture(formData);
      // Update auth store locally — instant UI feedback
      // NOTE: Do NOT call refreshUser() here — /auth/me doesn't return
      // profilePicture, so it would overwrite the URL we just set.
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
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
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
                    <ActivityIndicator size="large" color={Colors.primary} />
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
                  <Ionicons name="camera" size={16} color={Colors.white} />
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
                icon={<Ionicons name="checkmark" size={20} color={Colors.white} />}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxxl },

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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },

  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
    ...Shadows.lg,
  },
  avatarImg: { width: 120, height: 120, borderRadius: 60 },
  avatarText: { ...Typography.h1, color: Colors.primary, fontSize: 42 },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  photoHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },

  formCard: {
    marginHorizontal: Spacing.xl,
    padding: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.borderLight,
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
