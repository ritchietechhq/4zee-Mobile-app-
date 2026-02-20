// ============================================================
// Privacy Policy Screen — Client
// Legal privacy policy document
// ============================================================

import React, { useRef, useEffect, useMemo } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const LAST_UPDATED = 'February 1, 2026';

const PRIVACY_SECTIONS = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly to us, including:

• Personal Information: Name, email address, phone number, and profile picture when you create an account.

• Property Preferences: Your saved searches, favorited properties, and application history.

• Payment Information: When you make payments, our payment processor collects payment details. We do not store complete credit card numbers.

• Communication Data: Messages you send through our platform and support inquiries.

• Device Information: Device type, operating system, unique device identifiers, and mobile network information.

• Usage Data: How you interact with our app, including pages viewed, features used, and time spent.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process property applications and payments
• Send you notifications about properties and your applications
• Respond to your comments, questions, and support requests
• Send you marketing communications (with your consent)
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and abuse
• Personalize your experience and provide recommendations`,
  },
  {
    title: 'Information Sharing',
    content: `We may share your information in the following circumstances:

• With Realtors: When you apply for a property, we share relevant information with the assigned realtor to process your application.

• Service Providers: We share information with third-party vendors who assist us in providing our services (payment processors, cloud hosting, analytics).

• Legal Requirements: We may disclose information if required by law or in response to valid legal requests.

• Business Transfers: If we are involved in a merger, acquisition, or sale of assets, your information may be transferred.

• With Your Consent: We may share information with third parties when you give us explicit consent.`,
  },
  {
    title: 'Data Security',
    content: `We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. These measures include:

• Encryption of data in transit using TLS/SSL
• Encryption of sensitive data at rest
• Regular security assessments and penetration testing
• Access controls and authentication mechanisms
• Regular backups and disaster recovery procedures

However, no method of transmission over the Internet or electronic storage is 100% secure.`,
  },
  {
    title: 'Your Rights and Choices',
    content: `You have the following rights regarding your personal data:

• Access: Request access to the personal information we hold about you.

• Correction: Request correction of any inaccurate personal information.

• Deletion: Request deletion of your personal information, subject to certain exceptions.

• Data Portability: Request a copy of your data in a structured, machine-readable format.

• Opt-out: Opt out of marketing communications at any time.

• Withdraw Consent: Withdraw consent where we rely on consent to process your information.

To exercise these rights, contact us at privacy@4zeeproperties.com.`,
  },
  {
    title: 'Cookies and Tracking',
    content: `We use cookies and similar tracking technologies to:

• Remember your preferences and settings
• Analyze traffic and usage patterns
• Deliver personalized content
• Measure the effectiveness of marketing campaigns

You can control cookie preferences through your browser settings. Note that disabling cookies may affect the functionality of our services.`,
  },
  {
    title: 'Children\'s Privacy',
    content: `Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.`,
  },
  {
    title: 'International Data Transfers',
    content: `Your information may be transferred to and processed in countries other than Nigeria. When we transfer data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.`,
  },
  {
    title: 'Contact Us',
    content: `If you have any questions about this Privacy Policy, please contact us:

• Email: privacy@4zeeproperties.com
• Phone: +234 800 123 4567
• Address: 123 Victoria Island, Lagos, Nigeria

For data protection inquiries, contact our Data Protection Officer at dpo@4zeeproperties.com.`,
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
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
          <View style={dynamicStyles.heroSection}>
            <View style={dynamicStyles.heroIcon}>
              <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
            </View>
            <Text style={dynamicStyles.heroTitle}>Your Privacy Matters</Text>
            <Text style={dynamicStyles.heroSubtitle}>
              We are committed to protecting your personal information and being transparent about how we use it.
            </Text>
            <View style={dynamicStyles.updateBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
              <Text style={dynamicStyles.updateText}>Last updated: {LAST_UPDATED}</Text>
            </View>
          </View>

          {/* Content */}
          {PRIVACY_SECTIONS.map((section, idx) => (
            <Card key={idx} style={dynamicStyles.sectionCard}>
              <View style={dynamicStyles.sectionHeader}>
                <View style={dynamicStyles.sectionNumber}>
                  <Text style={dynamicStyles.sectionNumberText}>{idx + 1}</Text>
                </View>
                <Text style={dynamicStyles.sectionTitle}>{section.title}</Text>
              </View>
              <Text style={dynamicStyles.sectionContent}>{section.content}</Text>
            </Card>
          ))}

          <View style={{ height: Spacing.xxxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: Spacing.xxxxl },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { ...Typography.h4, color: colors.textPrimary },

    heroSection: {
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.xl,
    },
    heroIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    heroTitle: {
      ...Typography.h3,
      color: colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    heroSubtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    updateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.lg,
      gap: Spacing.xs,
    },
    updateText: {
      ...Typography.caption,
      color: colors.textSecondary,
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
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionNumberText: {
      ...Typography.captionMedium,
      color: colors.white,
      fontWeight: '700',
    },
    sectionTitle: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      flex: 1,
    },
    sectionContent: {
      ...Typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
    },
  });
