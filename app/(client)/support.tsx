// ============================================================
// Contact Support Screen — Client
// Submit and track support tickets
// ============================================================

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  FlatList,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import supportService from '@/services/support.service';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { SupportTicket, TicketCategory, TicketPriority, CreateTicketRequest } from '@/types';

type ViewMode = 'new' | 'history';

const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'GENERAL', label: 'General Inquiry', icon: 'help-circle-outline' },
  { value: 'PAYMENT', label: 'Payment Issue', icon: 'card-outline' },
  { value: 'PROPERTY', label: 'Property Question', icon: 'home-outline' },
  { value: 'ACCOUNT', label: 'Account Help', icon: 'person-outline' },
  { value: 'TECHNICAL', label: 'Technical Problem', icon: 'bug-outline' },
];

const CONTACT_OPTIONS = [
  {
    icon: 'mail-outline' as const,
    label: 'Email Us',
    value: 'support@4zeeproperties.com',
    action: () => Linking.openURL('mailto:support@4zeeproperties.com'),
  },
  {
    icon: 'call-outline' as const,
    label: 'Call Us',
    value: '+234 800 123 4567',
    action: () => Linking.openURL('tel:+2348001234567'),
  },
  {
    icon: 'logo-whatsapp' as const,
    label: 'WhatsApp',
    value: '+234 801 234 5678',
    action: () => Linking.openURL('https://wa.me/2348012345678'),
  },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [viewMode, setViewMode] = useState<ViewMode>('new');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'history') {
        loadTickets();
      }
    }, [viewMode])
  );

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 12,
    }).start();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await supportService.getMyTickets();
      setTickets(result.items ?? []);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedCategory) {
      newErrors.category = 'Please select a category';
    }
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.trim().length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 20) {
      newErrors.message = 'Message must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateTicketRequest = {
        subject: subject.trim(),
        message: message.trim(),
        category: selectedCategory!,
        priority: 'MEDIUM',
      };

      await supportService.create(payload);
      
      Alert.alert(
        'Ticket Submitted',
        'Your support ticket has been submitted successfully. We\'ll get back to you within 24-48 hours.',
        [
          {
            text: 'View Tickets',
            onPress: () => {
              setViewMode('history');
              loadTickets();
            },
          },
          { text: 'OK' },
        ]
      );

      // Reset form
      setSelectedCategory(null);
      setSubject('');
      setMessage('');
      setErrors({});
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.error?.message || 'Failed to submit ticket. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'OPEN':
        return 'warning';
      case 'IN_PROGRESS':
        return 'default';
      case 'RESOLVED':
        return 'success';
      case 'CLOSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTicket = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => Alert.alert('Ticket', `Ticket #${item.ticketNumber}\n\n${item.subject}`)}
    >
      <Card style={dynamicStyles.ticketCard}>
        <View style={dynamicStyles.ticketHeader}>
          <Text style={dynamicStyles.ticketNumber}>#{item.ticketNumber}</Text>
          <Badge
            label={item.status.replace('_', ' ')}
            variant={getStatusVariant(item.status)}
            size="sm"
          />
        </View>
        <Text style={dynamicStyles.ticketSubject} numberOfLines={1}>
          {item.subject}
        </Text>
        <View style={dynamicStyles.ticketMeta}>
          <View style={dynamicStyles.ticketMetaItem}>
            <Ionicons name="folder-outline" size={14} color={colors.textMuted} />
            <Text style={dynamicStyles.ticketMetaText}>{item.category}</Text>
          </View>
          <View style={styles.ticketMetaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={dynamicStyles.ticketMetaText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

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
        <Text style={dynamicStyles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* View Mode Tabs */}
      <View style={dynamicStyles.tabContainer}>
        <TouchableOpacity
          style={[dynamicStyles.tab, viewMode === 'new' && dynamicStyles.tabActive]}
          onPress={() => setViewMode('new')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={viewMode === 'new' ? colors.primary : colors.textMuted}
          />
          <Text style={[dynamicStyles.tabText, viewMode === 'new' && dynamicStyles.tabTextActive]}>
            New Ticket
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[dynamicStyles.tab, viewMode === 'history' && dynamicStyles.tabActive]}
          onPress={() => setViewMode('history')}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={viewMode === 'history' ? colors.primary : colors.textMuted}
          />
          <Text style={[dynamicStyles.tabText, viewMode === 'history' && dynamicStyles.tabTextActive]}>
            My Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'new' ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={dynamicStyles.flex}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={dynamicStyles.scrollContent}
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
              {/* Quick Contact Options */}
              <View style={dynamicStyles.contactOptions}>
                {CONTACT_OPTIONS.map((option, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={dynamicStyles.contactOption}
                    onPress={option.action}
                    activeOpacity={0.7}
                  >
                    <View style={dynamicStyles.contactOptionIcon}>
                      <Ionicons name={option.icon} size={20} color={colors.primary} />
                    </View>
                    <Text style={styles.contactOptionLabel}>{option.label}</Text>
                    <Text style={styles.contactOptionValue} numberOfLines={1}>
                      {option.value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or submit a ticket</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Category Selection */}
              <Text style={styles.sectionLabel}>Select Category</Text>
              <View style={styles.categoryGrid}>
                {TICKET_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      selectedCategory === cat.value && styles.categoryCardActive,
                    ]}
                    onPress={() => {
                      setSelectedCategory(cat.value);
                      if (errors.category) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.category;
                          return next;
                        });
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.categoryIcon,
                        selectedCategory === cat.value && styles.categoryIconActive,
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={20}
                        color={selectedCategory === cat.value ? colors.white : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        selectedCategory === cat.value && styles.categoryLabelActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

              {/* Ticket Form */}
              <Card style={styles.formCard}>
                <Input
                  label="Subject"
                  placeholder="Brief summary of your issue"
                  value={subject}
                  onChangeText={(v) => {
                    setSubject(v);
                    if (errors.subject) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.subject;
                        return next;
                      });
                    }
                  }}
                  error={errors.subject}
                  required
                />

                <View style={styles.textAreaContainer}>
                  <Text style={styles.inputLabel}>
                    Message <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textArea, errors.message && styles.textAreaError]}
                    placeholder="Describe your issue in detail..."
                    placeholderTextColor={colors.textMuted}
                    value={message}
                    onChangeText={(v) => {
                      setMessage(v);
                      if (errors.message) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.message;
                          return next;
                        });
                      }
                    }}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  {errors.message && <Text style={styles.errorText}>{errors.message}</Text>}
                  <Text style={styles.charCount}>{message.length}/500</Text>
                </View>

                <Button
                  title="Submit Ticket"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  variant="primary"
                  size="lg"
                  icon={<Ionicons name="send" size={18} color={colors.white} />}
                />
              </Card>

              <Text style={styles.responseNote}>
                We typically respond within 24-48 hours
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* Ticket History */
        isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((i) => (
              <Card key={i} style={styles.ticketCard}>
                <Skeleton width="30%" height={12} />
                <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
                <Skeleton width="60%" height={12} style={{ marginTop: 8 }} />
              </Card>
            ))}
          </View>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No Support Tickets"
            description="You haven't submitted any support tickets yet. Need help? Create a new ticket."
            actionLabel="Create Ticket"
            onAction={() => setViewMode('new')}
            style={styles.emptyState}
          />
        ) : (
          <FlatList
            data={tickets}
            renderItem={renderTicket}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ticketList}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    ...Typography.captionMedium,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },

  contactOptions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  contactOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  contactOptionLabel: {
    ...Typography.captionMedium,
    color: colors.textPrimary,
  },
  contactOptionValue: {
    ...Typography.small,
    color: colors.textMuted,
    marginTop: 2,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    ...Typography.caption,
    color: colors.textMuted,
  },

  sectionLabel: {
    ...Typography.bodyMedium,
    color: colors.textPrimary,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  categoryCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '30',
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  categoryIconActive: {
    backgroundColor: colors.primary,
  },
  categoryLabel: {
    ...Typography.captionMedium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: colors.primary,
  },

  errorText: {
    ...Typography.small,
    color: colors.error,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },

  formCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.xl,
  },

  textAreaContainer: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  required: {
    color: colors.error,
  },
  textArea: {
    ...Typography.body,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: Spacing.md,
    minHeight: 120,
    color: colors.textPrimary,
  },
  textAreaError: {
    borderColor: colors.error,
  },
  charCount: {
    ...Typography.small,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  responseNote: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },

  ticketList: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  ticketCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  ticketNumber: {
    ...Typography.captionMedium,
    color: colors.textMuted,
  },
  ticketSubject: {
    ...Typography.bodyMedium,
    color: colors.textPrimary,
  },
  ticketMeta: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  ticketMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketMetaText: {
    ...Typography.small,
    color: colors.textMuted,
  },

  skeletonList: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  emptyState: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
});
