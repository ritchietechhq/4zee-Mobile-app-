import React, { useState, useMemo } from 'react';
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
import { appendFile } from '@/utils/formData';
import type { KYCDocumentType, SubmitKYCDocumentRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useRealtorColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

// ── Document type options matching backend KycDocumentType enum ──
const DOC_TYPES: { value: KYCDocumentType; label: string }[] = [
  { value: 'NATIONAL_ID', label: 'National ID Card' },
  { value: 'NIN', label: 'NIN Slip' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'VOTERS_CARD', label: "Voter's Card" },
  { value: 'PASSPORT', label: 'Passport' },
];

const STEPS = ['ID Details', 'Upload Documents', 'Review'];

/** Upload result with both URL and filename (needed by POST /kyc/documents) */
type UploadResult = { url: string; fileName: string };

export default function KYCSubmitScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Step 0 — ID details
  const [docType, setDocType] = useState<KYCDocumentType | null>(null);
  const [idNumber, setIdNumber] = useState('');

  // Step 1 — ID document upload
  const [idDocUri, setIdDocUri] = useState('');
  const [idDocUpload, setIdDocUpload] = useState<UploadResult | null>(null);

  // Step 1 — Proof of address upload (optional, shown on same step)
  const [proofUri, setProofUri] = useState('');
  const [proofUpload, setProofUpload] = useState<UploadResult | null>(null);

  const colors = useRealtorColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // ── Upload helper ──────────────────────────────────────────
  const pickImage = async (
    setUri: (uri: string) => void,
    setUpload: (r: UploadResult | null) => void,
    source: 'library' | 'camera' = 'library',
  ) => {
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
      const originalName = asset.fileName || `kyc_${Date.now()}.jpg`;

      setUri(asset.uri);
      setIsUploading(true);

      const formData = new FormData();
      await appendFile(formData, 'file', asset.uri, originalName, asset.mimeType || 'image/jpeg');
      formData.append('category', 'KYC_DOCUMENT');

      // Upload returns both url and fileName
      const uploaded = await kycService.uploadDocument(formData);
      setUpload(uploaded);
    } catch (e: any) {
      Alert.alert('Upload Failed', e?.error?.message || 'Failed to upload image. Please try again.');
      setUri('');
      setUpload(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ── Validation ─────────────────────────────────────────────
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return !!docType && idNumber.trim().length >= 5;
      case 1: return !!idDocUpload;
      case 2: return !!docType && !!idNumber && !!idDocUpload;
      default: return false;
    }
  };

  /** Sanitise ID number — backend allows letters, numbers, hyphens only */
  const sanitiseIdNumber = (raw: string) => raw.replace(/[^A-Za-z0-9-]/g, '');

  // ── Submit — sends each document individually via POST /kyc/documents ──
  const handleSubmit = async () => {
    if (!docType || !idDocUpload) return;

    const cleanId = sanitiseIdNumber(idNumber.trim());
    if (!cleanId) {
      Alert.alert('Invalid ID', 'ID number must contain only letters, numbers, or hyphens.');
      return;
    }

    setIsSubmitting(true);
    try {
      const documents: SubmitKYCDocumentRequest[] = [
        // 1. Primary ID Document (the main document + selfie URL in fileName hint)
        {
          type: docType,
          idNumber: cleanId,
          fileUrl: idDocUpload.url,
          fileName: idDocUpload.fileName,
        },
      ];

      // 2. Proof of address (optional — submitted as UTILITY_BILL or BANK_STATEMENT)
      if (proofUpload) {
        documents.push({
          type: 'UTILITY_BILL',
          idNumber: cleanId,
          fileUrl: proofUpload.url,
          fileName: proofUpload.fileName,
        });
      }

      // Submit each document individually via POST /kyc/documents
      await kycService.submitDocuments(documents);

      Alert.alert('Submitted!', 'Your KYC documents have been submitted for review.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.error?.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => { if (step < 2) setStep(step + 1); else handleSubmit(); };
  const back = () => { if (step > 0) setStep(step - 1); else router.back(); };

  // ─── Step renderers ─────────────────────────
  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <View style={[styles.stepDot, i <= step && styles.stepDotActive]}>
            {i < step ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : (
              <Text style={[styles.stepDotNum, i <= step && styles.stepDotNumActive]}>{i + 1}</Text>
            )}
          </View>
          {i < STEPS.length - 1 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  const renderIDDetails = () => (
    <View>
      <Text style={styles.sectionTitle}>Select Document Type</Text>
      {DOC_TYPES.map((t) => (
        <TouchableOpacity
          key={t.value}
          style={[styles.radioCard, docType === t.value && styles.radioCardActive]}
          onPress={() => setDocType(t.value)}
          activeOpacity={0.7}
        >
          <View style={[styles.radio, docType === t.value && styles.radioActive]}>
            {docType === t.value && <View style={styles.radioDot} />}
          </View>
          <Text style={[styles.radioLabel, docType === t.value && styles.radioLabelActive]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>ID Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your ID number"
        placeholderTextColor={colors.textMuted}
        value={idNumber}
        onChangeText={(text) => setIdNumber(text.replace(/[^A-Za-z0-9-]/g, ''))}
        autoCapitalize="characters"
      />
      <Text style={[styles.hint, { marginTop: Spacing.xs, marginBottom: 0 }]}>Letters, numbers, and hyphens only</Text>
    </View>
  );

  const renderDocUpload = () => (
    <View>
      <Text style={styles.sectionTitle}>Upload ID Document</Text>
      <Text style={styles.hint}>
        Take a clear photo of your {docType?.replace(/_/g, ' ').toLowerCase() || 'ID document'}
      </Text>
      {idDocUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: idDocUri }} style={styles.preview} contentFit="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setIdDocUri(''); setIdDocUpload(null); }}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={colors.white} size="large" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setIdDocUri, setIdDocUpload)} disabled={isUploading}>
          <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
          <Text style={styles.uploadLabel}>Tap to upload</Text>
          <Text style={styles.uploadHint}>JPEG, PNG (max 5MB)</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>Proof of Address (Optional)</Text>
      <Text style={styles.hint}>Utility bill or bank statement (last 3 months)</Text>
      {proofUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: proofUri }} style={styles.preview} contentFit="cover" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => { setProofUri(''); setProofUpload(null); }}>
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
          {isUploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={colors.white} size="large" />
              <Text style={styles.uploadText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBox} onPress={() => pickImage(setProofUri, setProofUpload)} disabled={isUploading}>
          <Ionicons name="document-outline" size={28} color={colors.textMuted} />
          <Text style={[styles.uploadLabel, { color: colors.textMuted }]}>Tap to upload (optional)</Text>
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
          <Text style={styles.reviewLabel}>Document Type</Text>
          <Text style={styles.reviewValue}>{DOC_TYPES.find((t) => t.value === docType)?.label || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>ID Number</Text>
          <Text style={styles.reviewValue}>{idNumber || '—'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>ID Document</Text>
          <View style={styles.reviewCheck}>
            <Ionicons name={idDocUpload ? 'checkmark-circle' : 'close-circle'} size={20} color={idDocUpload ? colors.success : colors.error} />
            <Text style={styles.reviewValue}>{idDocUpload ? 'Uploaded' : 'Missing'}</Text>
          </View>
        </View>
        <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.reviewLabel}>Proof of Address</Text>
          <View style={styles.reviewCheck}>
            <Ionicons name={proofUpload ? 'checkmark-circle' : 'remove-circle-outline'} size={20} color={proofUpload ? colors.success : colors.textMuted} />
            <Text style={styles.reviewValue}>{proofUpload ? 'Uploaded' : 'Skipped'}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const stepContent = [renderIDDetails, renderDocUpload, renderReview];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
          title={step === 2 ? (isSubmitting ? 'Submitting...' : 'Submit for Review') : 'Continue'}
          onPress={next}
          disabled={!canProceed() || isUploading || isSubmitting}
          loading={isSubmitting}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.lg, backgroundColor: colors.surface },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  stepCount: { ...Typography.caption, color: colors.textMuted, backgroundColor: colors.surface, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.md },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stepDotNum: { ...Typography.small, color: colors.textMuted, fontWeight: '600' },
  stepDotNumActive: { color: colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.borderLight, marginHorizontal: Spacing.xs },
  stepLineActive: { backgroundColor: colors.primary },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, paddingTop: Spacing.lg },
  sectionTitle: { ...Typography.h4, color: colors.textPrimary, marginBottom: Spacing.md },
  hint: { ...Typography.body, color: colors.textMuted, marginBottom: Spacing.lg, lineHeight: 20 },
  radioCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, marginBottom: Spacing.sm, backgroundColor: colors.cardBackground },
  radioCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  radioLabel: { ...Typography.body, color: colors.textPrimary },
  radioLabelActive: { ...Typography.bodySemiBold, color: colors.primary },
  input: { ...Typography.body, borderWidth: 1, borderColor: colors.borderLight, borderRadius: BorderRadius.lg, padding: Spacing.md, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  uploadBox: { borderWidth: 2, borderColor: colors.borderLight, borderStyle: 'dashed', borderRadius: BorderRadius.xl, paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.sm, backgroundColor: colors.cardBackground },
  uploadLabel: { ...Typography.bodySemiBold, color: colors.primary },
  uploadHint: { ...Typography.caption, color: colors.textMuted },
  previewWrap: { borderRadius: BorderRadius.xl, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 190, borderRadius: BorderRadius.xl },
  removeBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  uploadText: { ...Typography.bodySemiBold, color: colors.white },
  reviewCard: { marginTop: Spacing.sm },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  reviewLabel: { ...Typography.caption, color: colors.textMuted },
  reviewValue: { ...Typography.bodyMedium, color: colors.textPrimary },
  reviewCheck: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  footer: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.cardBackground },
});
