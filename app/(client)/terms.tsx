// ============================================================
// Terms of Service Screen — Client
// Legal terms and conditions document
// ============================================================

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const LAST_UPDATED = 'February 1, 2026';

const TERMS_SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using the 4Zee Properties mobile application ("App") and related services ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.

These Terms constitute a legally binding agreement between you and 4Zee Properties Limited ("4Zee", "we", "us", or "our"). We may modify these Terms at any time, and your continued use of the Services after such modifications constitutes acceptance of the updated Terms.`,
  },
  {
    title: 'Eligibility',
    content: `To use our Services, you must:

• Be at least 18 years of age
• Have the legal capacity to enter into binding contracts
• Not be prohibited from using the Services under applicable law
• Provide accurate, current, and complete information during registration

By using the Services, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    title: 'Account Registration',
    content: `To access certain features of our Services, you must create an account. When creating an account, you agree to:

• Provide accurate and complete registration information
• Maintain the security of your account credentials
• Promptly update any changes to your information
• Accept responsibility for all activities under your account
• Not share your account with others or allow unauthorized access

We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: 'Property Listings',
    content: `Property listings on our platform are provided by registered realtors and property owners. While we strive to ensure accuracy:

• We do not guarantee the accuracy, completeness, or availability of listings
• Listings are for informational purposes and do not constitute an offer to sell
• Property prices, availability, and features may change without notice
• Images and descriptions are representations and may differ from actual properties

Users should verify all property information independently before making decisions.`,
  },
  {
    title: 'Applications and Payments',
    content: `When submitting property applications:

• Application submission does not guarantee approval
• Approval decisions are made by realtors and property owners
• Application fees, if any, may be non-refundable
• You must provide accurate financial and personal information

For payments:

• All payments are processed through secure third-party payment processors
• You authorize us to charge your selected payment method
• Payment obligations are final and non-refundable unless otherwise stated
• Installment payment plans are subject to specific terms and approval`,
  },
  {
    title: 'User Conduct',
    content: `You agree not to:

• Use the Services for any illegal purpose
• Submit false, misleading, or fraudulent information
• Interfere with or disrupt the Services or servers
• Attempt to gain unauthorized access to any part of the Services
• Use automated scripts or bots to access the Services
• Harass, abuse, or harm other users or realtors
• Post or transmit harmful, offensive, or objectionable content
• Infringe on intellectual property rights of others
• Circumvent any security measures or access restrictions`,
  },
  {
    title: 'Intellectual Property',
    content: `All content, features, and functionality of the Services, including but not limited to:

• Text, graphics, logos, icons, and images
• Software, code, and underlying technology
• User interface design and layout
• Trademarks, service marks, and trade names

are owned by 4Zee or its licensors and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written consent.`,
  },
  {
    title: 'Privacy',
    content: `Your use of the Services is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Services, you consent to our collection and use of information as described in the Privacy Policy.`,
  },
  {
    title: 'Disclaimers',
    content: `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:

• MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE
• ACCURACY OR RELIABILITY OF PROPERTY INFORMATION
• UNINTERRUPTED OR ERROR-FREE OPERATION
• SECURITY OF DATA OR COMMUNICATIONS

We do not guarantee that properties will meet your requirements or expectations. Users should conduct their own due diligence.`,
  },
  {
    title: 'Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• 4Zee shall not be liable for any indirect, incidental, special, consequential, or punitive damages
• Our total liability shall not exceed the amount paid by you to us in the preceding 12 months
• We are not liable for any disputes between users, realtors, or property owners
• We are not responsible for the actions or omissions of third parties

Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.`,
  },
  {
    title: 'Indemnification',
    content: `You agree to indemnify, defend, and hold harmless 4Zee, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of:

• Your use of the Services
• Your violation of these Terms
• Your violation of any third-party rights
• Any content you submit to the Services`,
  },
  {
    title: 'Termination',
    content: `We may terminate or suspend your account and access to the Services at any time, with or without cause, with or without notice, including if:

• You breach these Terms
• We are required to do so by law
• We discontinue the Services

Upon termination, your right to use the Services ceases immediately. Provisions that by their nature should survive termination shall survive.`,
  },
  {
    title: 'Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to its conflict of law provisions.

Any disputes arising from these Terms or the Services shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.`,
  },
  {
    title: 'Contact Information',
    content: `For questions about these Terms of Service, please contact us:

• Email: legal@4zeeproperties.com
• Phone: +234 800 123 4567
• Address: 123 Victoria Island, Lagos, Nigeria

For general support inquiries, contact support@4zeeproperties.com.`,
  },
];

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

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
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="document-text" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Terms of Service</Text>
            <Text style={styles.heroSubtitle}>
              Please read these terms carefully before using our services.
            </Text>
            <View style={styles.updateBadge}>
              <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.updateText}>Last updated: {LAST_UPDATED}</Text>
            </View>
          </View>

          {/* Content */}
          {TERMS_SECTIONS.map((section, idx) => (
            <Card key={idx} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </Card>
          ))}

          {/* Agreement Footer */}
          <View style={styles.agreementFooter}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
            <Text style={styles.agreementText}>
              By using 4Zee Properties, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </Text>
          </View>

          <View style={{ height: Spacing.xxxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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

  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  updateText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  sectionCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    ...Typography.captionMedium,
    color: Colors.white,
    fontWeight: '700',
  },
  sectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionContent: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  agreementFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.successLight + '50',
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  agreementText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
