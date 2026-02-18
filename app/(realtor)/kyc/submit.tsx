import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { kycService } from '@/services/kyc.service';
import type { KYCIdType, SubmitKYCRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

const ID_TYPES: { value: KYCIdType; label: string }[] = [
  { value: 'NIN', label: 'National ID (NIN)' },
  { value: 'BVN', label: 'Bank Verification Number' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'VOTERS_CARD', label: "Voter's Card" },
  { value: 'INTERNATIONAL_PASSPORT', label: 'International Passport' },
];

const STEPS = ['Personal Info', 'ID Document', 'Selfie', 'Review'];

export default function KYCSubmitScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [idType, setIdType] = useState<KYCIdType | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [idDocUri, setIdDocUri] = useState('');
  const [idDocUrl, setIdDocUrl] = useState('');
  const [selfieUri, setSelfieUri] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');
  const [proofUri, setProofUri] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const pickImage = async (setter: (uri: string) => void, urlSetter: (url: string) => void, source: 'library' | 'camera' = 'library') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission', 'Camera access is required for selfie.'); return; }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permission', 'Photo library access is required.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
      }
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setter(asset.uri);
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || `kyc_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const uploadRes = await kycService.uploadDocument(formData);
      urlSetter(uploadRes.url);
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.error?.message || 'Failed to upload image. Please try again.');
      setter('');
    } finally {
      setIsUploading(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!idType && idNumber.trim().length >= 5;
      case 1: return !!idDocUrl;
      case 2: return !!selfieUrl;
      case 3: return !!idType && !!idNumber && !!idDocUrl && !!selfieUrl;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!idType || !idDocUrl || !selfieUrl) return;
    setIsSubmitting(true);
    try {
      const payload: SubmitKYCRequest = {
        idType,
        idNumber: idNumber.trim(),
        idDocumentUrl: idDocUrl,
        selfieUrl: selfieUrl,
        ...(proofUrl ? { proofOfAddressUrl: proofUrl } : {}),
      };
      await kycService.submit(payload);
      Alert.alert('Submitted!', 'Your KYC documents have been submitted for review.', [
        { text: 'OK', onPress: () => router.replace('/(realtor)/kyc') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => { if (step < 3) setStep(step + 1); else handleSubmit(); };
  const back = () => { if (step > 0) setStep(step - 1); else router.back(); };

  // ─── Step renderers ─────────────────────────
  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            {i < step ? (
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            ) : (
              <Text style={[styles.stepDotNum, i <= step && styles.stepDotNumActive]}>{i + 1}</Text>
            )}
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderPersonalInfo = () => (
    <View>
      <Text style={styles.sectionTitle}>Select ID Type</Text>
      {ID_TYPES.map((t) => (
        <TouchableOpacity
          key={t.value}
          style={[styles.radioCard, idType === t.value && styles.radioCardActive]}
          onPress={() => setIdType(t.value)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, idType === t.value && styles.radioActive]}>
            {idType === t.value && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.radioLabel, idType === t.value && styles.radioLabelActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>ID Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your ID number"
        placeholderTextColor={Colors.textMuted}
        value={idNumber}
        onChangeText={setIdNumber}
        autoCapitalize="characters"
      />
    </View>
  );

  const renderDocUpload = () => (
    <View>
      <Text style={styles.sectionTitle}>Upload ID Document</Text>
      <Text style={styles.hint}>Take a clear photo of your {idType?.replace(/_/g, ' ').toLowerCase() || 'ID document'}</Text>
      {idDocUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: idDocUri }} style={styles.preview} contentFit="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setIdDocUri(''); setIdDocUrl(''); }}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={Colors.white} size="large" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdDocUri, setIdDocUrl)} disabled={isUploading}>
          <Ionicons name="cloud-upload-outline" size={40} color={Colors.primary} />
          <Text style={styles.uploadLabel}>Tap to upload</Text>
          <Text style={styles.uploadHint}>JPEG, PNG (max 5MB)</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Proof of Address (Optional)</Text>
      <Text style={styles.hint}>Utility bill or bank statement (last 3 months)</Text>
      {proofUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: proofUri }} style={styles.preview} contentFit="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setProofUri(''); setProofUrl(''); }}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setProofUri, setProofUrl)} disabled={isUploading}>
          <Ionicons name="document-outline" size={36} color={Colors.textMuted} />
          <Text style={[styles.uploadLabel, { color: Colors.textMuted }]}>Tap to upload (optional)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSelfie = () => (
    <View>
      <Text style={styles.sectionTitle}>Take a Selfie</Text>
      <Text style={styles.hint}>Ensure your face is clearly visible, well-lit, and matches your ID document.</Text>
      {selfieUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: selfieUri }} style={[styles.preview, { borderRadius: BorderRadius.xl }]} contentFit="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setSelfieUri(''); setSelfieUrl(''); }}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
          {isUploading && (
            <View style={[styles.uploadOverlay, { borderRadius: BorderRadius.xl }]}>
              <ActivityIndicator color={Colors.white} size="large" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={[styles.uploadBox, { paddingVertical: Spacing.xxxl }]} onPress={() => pickImage(setSelfieUri, setSelfieUrl, 'camera')} disabled={isUploading}>
          <View style={styles.selfieCircle}>
            <Ionicons name="camera" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.uploadLabel}>Open Camera</Text>
          <Text style={styles.uploadHint}>A clear selfie is required</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderReview = () => (
    <View>
      <Text style={styles.sectionTitle}>Review Your Submission</Text>
      <Text style={styles.hint}>Please verify all information before submitting.</Text>

      <Card variant="outlined" padding="md" style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>ID Type</Text>
          <Text style={styles.reviewValue}>{ID_TYPES.find((t) => t.value === idType)?.label || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>ID Number</Text>
          <Text style={styles.reviewValue}>{idNumber || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>ID Document</Text>
          <View style={styles.reviewCheck}>
            <Ionicons name={idDocUrl ? 'checkmark-circle' : 'close-circle'} size={20} color={idDocUrl ? Colors.success : Colors.error} />
            <Text style={styles.reviewValue}>{idDocUrl ? 'Uploaded' : 'Missing'}</Text>
          </View>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Selfie</Text>
          <View style={styles.reviewCheck}>
            <Ionicons name={selfieUrl ? 'checkmark-circle' : 'close-circle'} size={20} color={selfieUrl ? Colors.success : Colors.error} />
            <Text style={styles.reviewValue}>{selfieUrl ? 'Uploaded' : 'Missing'}</Text>
          </View>
        </View>
        <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.reviewLabel}>Proof of Address</Text>
          <View style={styles.reviewCheck}>
            <Ionicons name={proofUrl ? 'checkmark-circle' : 'remove-circle-outline'} size={20} color={proofUrl ? Colors.success : Colors.textMuted} />
            <Text style={styles.reviewValue}>{proofUrl ? 'Uploaded' : 'Skipped'}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const stepContent = [renderPersonalInfo, renderDocUpload, renderSelfie, renderReview];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEPS[step]}</Text>
        <Text style={styles.stepCount}>{step + 1}/{STEPS.length}</Text>
      </View>

      {renderStepIndicator()}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {stepContent[step]()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          title={step === 3 ? (isSubmitting ? 'Submitting...' : 'Submit for Review') : 'Continue'}
          onPress={next}
          disabled={!canProceed() || isUploading || isSubmitting}
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg, backgroundColor: Colors.surface },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  stepCount: { ...Typography.caption, color: Colors.textMuted, backgroundColor: Colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  stepDotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  stepDotNum: { ...Typography.small, color: Colors.textMuted, fontWeight: '600' },
  stepDotNumActive: { color: Colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.xs },
  stepLineActive: { backgroundColor: Colors.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  hint: { ...Typography.body, color: Colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  radioCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.sm, backgroundColor: Colors.white },
  radioCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },
  radioLabel: { ...Typography.body, color: Colors.textPrimary },
  radioLabelActive: { ...Typography.bodySemiBold, color: Colors.primary },
  input: { ...Typography.body, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.lg, padding: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.white },
  uploadBox: { borderWidth: 2, borderColor: Colors.borderLight, borderStyle: 'dashed', borderRadius: BorderRadius.xl, paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white },
  uploadLabel: { ...Typography.bodySemiBold, color: Colors.primary },
  uploadHint: { ...Typography.caption, color: Colors.textMuted },
  previewWrap: { borderRadius: BorderRadius.xl, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 220, borderRadius: BorderRadius.xl },
  removeBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  uploadText: { ...Typography.bodySemiBold, color: Colors.white },
  selfieCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  reviewCard: { marginTop: Spacing.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  reviewLabel: { ...Typography.caption, color: Colors.textMuted },
  reviewValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  reviewCheck: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  footer: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.white },
});
