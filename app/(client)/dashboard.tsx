// ============================================================
// Client Dashboard — Polished UI
// Featured properties via GET /properties/featured
// Recommended via property search
// Quick stats from GET /dashboard/client
// Messages & notifications from header icons
// ============================================================

import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { usePropertyStore } from '@/store/property.store';
import { useDashboard } from '@/hooks/useDashboard';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { messagingService } from '@/services/messaging.service';
import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { PropertyType, Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.76;

const QUICK_FILTERS: {
  label: string;
  value: PropertyType | undefined;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { label: 'All', value: undefined, icon: 'apps-outline' },
  { label: 'House', value: 'House' as PropertyType, icon: 'home-outline' },
  { label: 'Apartment', value: 'Apartment' as PropertyType, icon: 'business-outline' },
  { label: 'Land', value: 'Land' as PropertyType, icon: 'layers-outline' },
  { label: 'Commercial', value: 'Commercial' as PropertyType, icon: 'storefront-outline' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Main Screen ─────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const {
    featured,
    isLoadingFeatured,
    fetchFeatured,
    properties,
    isLoading: isLoadingProperties,
    searchProperties,
    filters,
    setFilters,
  } = usePropertyStore();
  const { clientData, fetchClientDashboard } = useDashboard();
  const { unreadCount, fetchUnreadCount } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PropertyType | undefined>(undefined);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const s = useMemo(() => makeStyles(colors), [colors]);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const count = await messagingService.getUnreadCount();
      setUnreadMessages(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchFeatured();
    searchProperties();
    fetchClientDashboard();
    fetchUnreadCount();
    fetchUnreadMessages();
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }),
      Animated.spring(contentAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 12,
      }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFeatured(),
      searchProperties(),
      fetchClientDashboard(),
      fetchUnreadCount(),
      fetchUnreadMessages(),
    ]);
    setRefreshing(false);
  }, [fetchUnreadMessages]);

  const handleFilterPress = (type: PropertyType | undefined) => {
    setActiveFilter(type);
    if (type) {
      setFilters({ type });
      searchProperties({ ...filters, type });
    } else {
      searchProperties({});
    }
  };

  const firstName = user?.firstName ?? 'there';

  // ─── Render ──

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Subtle accent blob */}
      <View style={s.bgAccent} pointerEvents="none" />

      {/* ── Header ── */}
      <Animated.View
        style={[
          s.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={s.headerLeft}
          onPress={() => router.push('/profile' as never)}
          activeOpacity={0.75}
        >
          <View style={s.avatarWrapper}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'BB']}
              style={s.avatarRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={s.avatarCircle}>
                {user?.profilePicture ? (
                  <Image
                    source={{ uri: user.profilePicture }}
                    style={s.avatarImage}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <Text style={s.avatarText}>
                    {user?.firstName?.charAt(0)?.toUpperCase() ?? 'U'}
                  </Text>
                )}
              </View>
            </LinearGradient>
            <View style={s.onlineIndicator} />
          </View>
          <View style={s.greeting}>
            <Text style={s.greetingSub}>{getGreeting()} 👋</Text>
            <Text style={s.greetingName}>{firstName}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerRight}>
          {/* Messages */}
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => router.push('/(client)/messages' as never)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={20}
              color={colors.textPrimary}
            />
            {unreadMessages > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={s.headerIconBtn}
            onPress={() => router.push('/notifications')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.textPrimary}
            />
            {unreadCount > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={s.scrollContent}
      >
        <Animated.View
          style={{
            opacity: contentAnim,
            transform: [
              {
                translateY: contentAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          }}
        >
          {/* ── Search Bar ── */}
          <TouchableOpacity
            style={s.searchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC']}
              style={s.searchIconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={s.searchPlaceholder}>
              Search properties, locations...
            </Text>
            <View style={s.searchDivider} />
            <View style={s.searchFilterBtn}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* ── Quick Stats ── */}
          {clientData && (
            <View style={s.statsRow}>
              <StatCard
                icon="document-text-outline"
                label="Applications"
                value={clientData.applicationsSummary?.total ?? 0}
                color="#6366F1"
                gradientColors={['#EEF2FF', '#E0E7FF']}
                colors={colors}
              />
              <StatCard
                icon="checkmark-circle-outline"
                label="Approved"
                value={clientData.applicationsSummary?.APPROVED ?? 0}
                color="#16A34A"
                gradientColors={['#DCFCE7', '#BBF7D0']}
                colors={colors}
              />
              <StatCard
                icon="hourglass-outline"
                label="Pending"
                value={clientData.applicationsSummary?.PENDING ?? 0}
                color="#D97706"
                gradientColors={['#FEF3C7', '#FDE68A']}
                colors={colors}
              />
            </View>
          )}

          {/* ── Quick Filters ── */}
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_FILTERS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={s.filtersList}
            style={s.filtersRow}
            renderItem={({ item }) => {
              const active = activeFilter === item.value;
              return (
                <TouchableOpacity
                  style={[s.filterPill, active && s.filterPillActive]}
                  onPress={() => handleFilterPress(item.value)}
                  activeOpacity={0.75}
                >
                  {active ? (
                    <LinearGradient
                      colors={[colors.primary, colors.primary + 'DD']}
                      style={s.filterPillInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={item.icon} size={13} color="#FFF" />
                      <Text style={[s.filterPillText, s.filterPillTextActive]}>
                        {item.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={s.filterPillInner}>
                      <Ionicons
                        name={item.icon}
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text style={s.filterPillText}>{item.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {/* ── Featured Properties ── */}
          <View style={s.sectionWrap}>
            <SectionHeader
              title="Featured Properties"
              actionLabel="See All"
              onAction={() => router.push('/search')}
            />
          </View>
          {isLoadingFeatured ? (
            <FeaturedSkeleton colors={colors} />
          ) : featured.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featured}
              keyExtractor={(p) => p.id}
              contentContainerStyle={s.featuredList}
              snapToInterval={FEATURED_CARD_WIDTH + Spacing.md}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push(`/properties/${item.id}`)}
                  style={s.featuredCardWrapper}
                >
                  <FeaturedCard property={item} colors={colors} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <EmptyState
              icon="home-outline"
              title="No featured properties"
              description="Featured listings will appear here."
              style={s.emptyInline}
            />
          )}

          {/* ── Recommended ── */}
          <View style={[s.sectionWrap, { marginTop: Spacing.xl }]}>
            <SectionHeader
              title="Recommended for You"
              actionLabel="View All"
              onAction={() => router.push('/search')}
            />
          </View>
          {isLoadingProperties ? (
            <View style={s.recSkeletonWrap}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={s.recSkeleton}>
                  <Skeleton
                    width={110}
                    height={90}
                    borderRadius={BorderRadius.lg}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Skeleton
                      width="70%"
                      height={14}
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton
                      width="50%"
                      height={12}
                      style={{ marginBottom: 8 }}
                    />
                    <Skeleton width="40%" height={14} />
                  </View>
                </View>
              ))}
            </View>
          ) : properties.length > 0 ? (
            properties.slice(0, 6).map((p) => (
              <View key={p.id} style={s.recItem}>
                <PropertyCard property={p} variant="horizontal" />
              </View>
            ))
          ) : (
            <EmptyState
              icon="search-outline"
              title="No properties yet"
              description="Pull down to refresh or try a different filter."
              style={s.emptyInline}
            />
          )}

          {/* Bottom spacer for tab bar */}
          <View style={{ height: Spacing.xxxxl + 30 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  gradientColors,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  gradientColors: readonly [string, string, ...string[]];
  colors: any;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadows.sm,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: Spacing.sm,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={gradientColors}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: colors.textPrimary,
          letterSpacing: -0.5,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          ...Typography.small,
          color: colors.textMuted,
          marginTop: 2,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function FeaturedCard({
  property,
  colors,
}: {
  property: Property;
  colors: any;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.xl + 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadows.md,
      }}
    >
      {/* Image */}
      <View style={{ position: 'relative' }}>
        <Image
          source={{ uri: property.images?.[0] }}
          style={{ width: '100%', height: 190 }}
          contentFit="cover"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
          }}
        />

        {/* Badge: property type */}
        <View
          style={{
            position: 'absolute',
            top: Spacing.md,
            left: Spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: Spacing.sm + 4,
            paddingVertical: 5,
            borderRadius: BorderRadius.full,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#F59E0B',
            }}
          />
          <Text
            style={{
              ...Typography.small,
              color: '#FFF',
              fontWeight: '600',
              letterSpacing: 0.3,
            }}
          >
            {property.type}
          </Text>
        </View>

        {/* Featured star badge */}
        <View
          style={{
            position: 'absolute',
            top: Spacing.md,
            right: Spacing.md,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(0,0,0,0.35)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
          }}
        >
          <Ionicons name="star" size={16} color="#F59E0B" />
        </View>

        {/* Price overlay */}
        <View
          style={{
            position: 'absolute',
            bottom: Spacing.md,
            left: Spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500',
              letterSpacing: 0.3,
            }}
          >
            LISTING PRICE
          </Text>
          <Text
            style={{
              fontSize: 19,
              fontWeight: '700',
              color: '#FFF',
              letterSpacing: -0.5,
              textShadowColor: 'rgba(0,0,0,0.4)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {formatCurrency(property.price)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ padding: Spacing.md }}>
        <Text
          style={{
            ...Typography.bodyMedium,
            color: colors.textPrimary,
            fontSize: 15,
            fontWeight: '600',
            letterSpacing: -0.1,
          }}
          numberOfLines={1}
        >
          {property.title}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            gap: 4,
          }}
        >
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text
            style={{
              ...Typography.caption,
              color: colors.textSecondary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {property.city}, {property.state}
          </Text>
        </View>
        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginVertical: Spacing.sm,
          }}
        />
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          {property.bedrooms != null && (
            <MetaChip
              icon="bed-outline"
              text={`${property.bedrooms} Bed`}
              colors={colors}
            />
          )}
          {property.bathrooms != null && (
            <MetaChip
              icon="water-outline"
              text={`${property.bathrooms} Bath`}
              colors={colors}
            />
          )}
          {property.area != null && (
            <MetaChip
              icon="resize-outline"
              text={`${property.area} sqm`}
              colors={colors}
            />
          )}
        </View>
      </View>
    </View>
  );
}

function MetaChip({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  colors: any;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <Text
        style={{
          ...Typography.small,
          color: colors.textSecondary,
          fontWeight: '500',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function FeaturedSkeleton({ colors }: { colors: any }) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[1, 2]}
      keyExtractor={(i) => String(i)}
      contentContainerStyle={{ paddingHorizontal: Spacing.xl, gap: Spacing.md }}
      renderItem={() => (
        <View style={{ width: FEATURED_CARD_WIDTH }}>
          <Skeleton
            width={FEATURED_CARD_WIDTH}
            height={190}
            borderRadius={BorderRadius.xl + 2}
          />
          <View style={{ padding: Spacing.md }}>
            <Skeleton
              width={130}
              height={14}
              style={{ marginBottom: 8 }}
            />
            <Skeleton
              width={FEATURED_CARD_WIDTH - 60}
              height={12}
              style={{ marginBottom: 8 }}
            />
            <Skeleton width={110} height={10} />
          </View>
        </View>
      )}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bgAccent: {
      position: 'absolute',
      top: -80,
      right: -60,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor: colors.primary + '08',
      zIndex: 0,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarWrapper: { position: 'relative' },
    avatarRing: {
      width: 50,
      height: 50,
      borderRadius: 25,
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden' as const,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarImage: { width: 44, height: 44, borderRadius: 22 },
    avatarText: {
      ...Typography.bodySemiBold,
      color: colors.primary,
      fontSize: 18,
      fontWeight: '700',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.success,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    greeting: { marginLeft: Spacing.md },
    greetingSub: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    greetingName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 1,
      letterSpacing: -0.3,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerIconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
    },
    badge: {
      position: 'absolute',
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Scroll
    scrollContent: { paddingBottom: Spacing.xxxxl },

    // Search Bar
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xs,
      marginBottom: Spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
    },
    searchIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchPlaceholder: {
      ...Typography.body,
      color: colors.textMuted,
      flex: 1,
      marginLeft: Spacing.md,
      fontSize: 14,
    },
    searchDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
    },
    searchFilterBtn: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Stats
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },

    // Filters
    filtersRow: { marginBottom: Spacing.lg },
    filtersList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    filterPill: {
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    filterPillActive: { borderColor: colors.primary },
    filterPillInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
    },
    filterPillText: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterPillTextActive: { color: '#FFFFFF', fontWeight: '600' },

    // Section
    sectionWrap: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },

    // Featured
    featuredList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    featuredCardWrapper: { width: FEATURED_CARD_WIDTH },
    emptyInline: { paddingVertical: Spacing.xxl },

    // Recommended
    recItem: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
    recSkeletonWrap: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    recSkeleton: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
    },
  });
