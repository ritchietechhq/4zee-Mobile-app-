// ============================================================
// Help & FAQ Screen — Client
// Frequently asked questions with search
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

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
    question: 'How do I create an account?',
    answer: 'To create an account, tap on "Sign Up" on the welcome screen. You\'ll need to provide your email address, create a password, and fill in your personal details. Verify your email address to complete the registration.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'How do I search for properties?',
    answer: 'Use the search bar on the dashboard or go to the Search tab. You can filter properties by location, price range, property type (house, apartment, land, commercial), number of bedrooms, and more.',
    category: 'Getting Started',
  },
  {
    id: '3',
    question: 'How do I save properties I like?',
    answer: 'Tap the heart icon on any property card to save it to your favorites. You can access all saved properties from the "Saved" tab in the bottom navigation.',
    category: 'Getting Started',
  },
  // Applications
  {
    id: '4',
    question: 'How do I apply for a property?',
    answer: 'Navigate to the property details page and tap "Contact Realtor" or "Apply Now". Fill in the required information and submit your application. You\'ll receive updates on your application status via notifications.',
    category: 'Applications',
  },
  {
    id: '5',
    question: 'How long does application approval take?',
    answer: 'Application processing typically takes 1-3 business days. You\'ll receive a notification when your application status changes. You can track your applications in the "My Property Inquiries" section.',
    category: 'Applications',
  },
  {
    id: '6',
    question: 'Can I withdraw my application?',
    answer: 'Yes, you can withdraw a pending application by going to "My Property Inquiries", selecting the application, and tapping "Withdraw Application". Note that once approved, withdrawals may have conditions.',
    category: 'Applications',
  },
  // Payments
  {
    id: '7',
    question: 'What payment methods are accepted?',
    answer: '4Zee Properties accepts bank transfers, debit/credit cards (Visa, Mastercard), and mobile payment options through our secure payment gateway powered by Paystack.',
    category: 'Payments',
  },
  {
    id: '8',
    question: 'Is installment payment available?',
    answer: 'Yes! Many properties support installment payment plans. When viewing a property, check for the "Installment Available" badge. The payment schedule will be shown after your application is approved.',
    category: 'Payments',
  },
  {
    id: '9',
    question: 'How do I view my payment history?',
    answer: 'Go to Profile > Payment History to see all your past transactions, including receipts and payment confirmations. You can also download payment receipts from there.',
    category: 'Payments',
  },
  // Account & Security
  {
    id: '10',
    question: 'How do I change my password?',
    answer: 'Go to Profile > Change Password. Enter your current password, then create and confirm your new password. For security, use a strong password with at least 8 characters, including uppercase, lowercase, and numbers.',
    category: 'Account & Security',
  },
  {
    id: '11',
    question: 'How do I update my profile information?',
    answer: 'Tap on "Edit Profile" from your Profile screen. You can update your name, phone number, address, and profile picture. Some information like email may require additional verification.',
    category: 'Account & Security',
  },
  {
    id: '12',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties without your consent. Read our Privacy Policy for more details.',
    category: 'Account & Security',
  },
  // Support
  {
    id: '13',
    question: 'How do I contact support?',
    answer: 'Go to Profile > Contact Support to submit a support ticket. You can also email us at support@4zeeproperties.com or call our helpline at +234 800 123 4567 (Mon-Fri, 9AM-6PM).',
    category: 'Support',
  },
  {
    id: '14',
    question: 'What should I do if I find a bug?',
    answer: 'Please report any bugs or issues through Contact Support. Include details about what happened, the steps to reproduce the issue, and your device information. Screenshots are helpful!',
    category: 'Support',
  },
];

const CATEGORIES = ['All', 'Getting Started', 'Applications', 'Payments', 'Account & Security', 'Support'];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
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
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
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
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
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
              <Ionicons name="help-circle" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>How can we help you?</Text>
            <Text style={styles.heroSubtitle}>
              Search our FAQs or browse by category
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search FAQs..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
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
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
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
              <Ionicons name="chatbubbles" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactDesc}>
              Our support team is ready to assist you
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => router.push('/(client)/support')}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.white} />
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
            size={18}
            color={isExpanded ? Colors.white : Colors.primary}
          />
        </View>
      </View>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
  },

  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
  },
  categoryTabText: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  categoryTabTextActive: {
    color: Colors.white,
  },

  categorySection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  categorySectionTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
    flex: 1,
  },
  faqToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqToggleActive: {
    backgroundColor: Colors.primary,
  },
  faqAnswer: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  faqDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyDesc: {
    ...Typography.body,
    color: Colors.textMuted,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  contactTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  contactDesc: {
    ...Typography.body,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  contactButtonText: {
    ...Typography.bodySemiBold,
    color: Colors.white,
  },
});
