// ============================================================
// Help & FAQ Screen — Realtor
// Frequently asked questions with search
// ============================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: '1',
    question: 'How do I get started as a realtor?',
    answer: 'Complete your KYC verification from the Profile screen. Once approved, you can start sharing property listings, earning commissions, and receiving payouts.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'What is KYC and why is it required?',
    answer: 'KYC (Know Your Customer) verification confirms your identity. It requires your ID document and a selfie. This is mandatory before you can receive commissions or payouts.',
    category: 'Getting Started',
  },
  {
    id: '3',
    question: 'How do I share property listings?',
    answer: 'Go to the Listings tab, find a property you want to share, and tap the share button. You can share via WhatsApp, social media, or copy your unique referral link.',
    category: 'Getting Started',
  },
  // Commissions
  {
    id: '4',
    question: 'How are commissions calculated?',
    answer: 'Commissions are a percentage of the property sale value. The rate varies by property type and is set by 4Zee Properties. You can see the commission amount on each listing.',
    category: 'Commissions',
  },
  {
    id: '5',
    question: 'When do I receive my commission?',
    answer: 'Commissions move through stages: PENDING (sale made) → APPROVED (verified by admin) → PAID (transferred to your bank account). Processing typically takes 3-7 business days after approval.',
    category: 'Commissions',
  },
  {
    id: '6',
    question: 'Why is my commission still pending?',
    answer: 'Commissions remain pending until the client\'s payment is confirmed and the sale is verified by our team. If it\'s been more than 7 days, please contact support.',
    category: 'Commissions',
  },
  // Payouts
  {
    id: '7',
    question: 'How do I request a payout?',
    answer: 'Go to the Earnings tab, tap "Request Payout", enter the amount, select your bank account, and submit. Make sure you have added and verified a bank account first.',
    category: 'Payouts',
  },
  {
    id: '8',
    question: 'What is the minimum payout amount?',
    answer: 'The minimum payout amount is ₦5,000. Make sure your available balance meets this threshold before requesting a payout.',
    category: 'Payouts',
  },
  {
    id: '9',
    question: 'How do I add a bank account?',
    answer: 'Go to Profile > Bank Accounts > Add Account. Select your bank, enter your 10-digit account number, verify the account name, and save. You can add multiple accounts and set a default.',
    category: 'Payouts',
  },
  {
    id: '10',
    question: 'Can I cancel a payout request?',
    answer: 'Yes, you can cancel a payout while it\'s still in PENDING status. Go to Earnings tab, find the payout in the Payouts section, and tap "Cancel Request". Once processing begins, it cannot be cancelled.',
    category: 'Payouts',
  },
  // Referrals
  {
    id: '11',
    question: 'How does the referral program work?',
    answer: 'Share your unique referral code with potential clients. When they register using your code and make a purchase, you earn a referral commission. Track your referrals from the dashboard.',
    category: 'Referrals',
  },
  {
    id: '12',
    question: 'Where do I find my referral code?',
    answer: 'Your referral code is displayed on the Profile screen under the Referral section. You can tap it to copy or use the Share button to send it via messaging apps.',
    category: 'Referrals',
  },
  // Account & Security
  {
    id: '13',
    question: 'How do I change my password?',
    answer: 'Go to Profile > Change Password. Enter your current password, then create and confirm your new password. Use a strong password with at least 8 characters.',
    category: 'Account & Security',
  },
  {
    id: '14',
    question: 'How do I contact support?',
    answer: 'Email us at support@4zeeproperties.com or call our helpline at +234 800 123 4567 (Mon-Fri, 9AM-6PM). You can also use the Contact Support button below.',
    category: 'Support',
  },
];

const CATEGORIES = ['All', 'Getting Started', 'Commissions', 'Payouts', 'Referrals', 'Account & Security', 'Support'];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const filteredFAQs = FAQ_DATA.filter((faq) => {
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === 'All' || faq.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQItem[]>);

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
        <Text style={styles.headerTitle}>Help & FAQ</Text>
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
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIcon}>
              <Ionicons name="help-circle" size={36} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSubtitle}>
              Search our FAQs or browse by category
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search FAQs..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  activeCategory === category && styles.categoryTabActive,
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === category && styles.categoryTabTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ List */}
          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptyDesc}>
                Try different keywords or browse all categories
              </Text>
            </View>
          ) : activeCategory === 'All' ? (
            Object.entries(groupedFAQs).map(([category, faqs]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={styles.categorySectionTitle}>{category}</Text>
                <Card style={styles.faqCard}>
                  {faqs.map((faq, idx) => (
                    <React.Fragment key={faq.id}>
                      <FAQItemComponent
                        faq={faq}
                        isExpanded={expandedItems.includes(faq.id)}
                        onToggle={() => toggleExpand(faq.id)}
                      />
                      {idx < faqs.length - 1 && <View style={styles.faqDivider} />}
                    </React.Fragment>
                  ))}
                </Card>
              </View>
            ))
          ) : (
            <Card style={styles.faqCard}>
              {filteredFAQs.map((faq, idx) => (
                <React.Fragment key={faq.id}>
                  <FAQItemComponent
                    faq={faq}
                    isExpanded={expandedItems.includes(faq.id)}
                    onToggle={() => toggleExpand(faq.id)}
                  />
                  {idx < filteredFAQs.length - 1 && <View style={styles.faqDivider} />}
                </React.Fragment>
              ))}
            </Card>
          )}

          {/* Still Need Help? */}
          <Card style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <Ionicons name="chatbubbles" size={22} color={colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactDesc}>
              Our support team is ready to assist you
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:support@4zeeproperties.com')}
            >
              <Ionicons name="mail-outline" size={18} color={colors.white} />
              <Text style={styles.contactButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </Card>

          <View style={{ height: Spacing.xxxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function FAQItemComponent({
  faq,
  isExpanded,
  onToggle,
}: {
  faq: FAQItem;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <View style={[styles.faqToggle, isExpanded && styles.faqToggleActive]}>
          <Ionicons
            name={isExpanded ? 'remove' : 'add'}
            size={14}
            color={isExpanded ? colors.white : colors.primary}
          />
        </View>
      </View>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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

  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    color: colors.textMuted,
    textAlign: 'center',
  },

  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: colors.textPrimary,
    padding: 0,
  },

  categoriesContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surface,
    marginRight: Spacing.sm,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    ...Typography.captionMedium,
    color: colors.textSecondary,
  },
  categoryTabTextActive: {
    color: colors.white,
  },

  categorySection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  categorySectionTitle: {
    ...Typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },

  faqCard: {
    marginHorizontal: Spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  faqItem: {
    padding: Spacing.lg,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  faqQuestion: {
    ...Typography.bodyMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  faqToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqToggleActive: {
    backgroundColor: colors.primary,
  },
  faqAnswer: {
    ...Typography.body,
    color: colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  faqDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: Spacing.lg,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    ...Typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  contactCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  contactTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
  },
  contactDesc: {
    ...Typography.body,
    color: colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  contactButtonText: {
    ...Typography.bodySemiBold,
    color: colors.white,
  },
});
