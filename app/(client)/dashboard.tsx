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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { usePropertyStore } from '@/store/property.store';
import { useDashboard } from '@/hooks/useDashboard';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { PropertyType, Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const QUICK_FILTERS: { label: string; value: PropertyType | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: undefined, icon: 'apps-outline' },
  { label: 'House', value: 'House' as PropertyType, icon: 'home-outline' },
  { label: 'Apartment', value: 'Apartment' as PropertyType, icon: 'business-outline' },
  { label: 'Land', value: 'Land' as PropertyType, icon: 'layers-outline' },
  { label: 'Commercial', value: 'Commercial' as PropertyType, icon: 'storefront-outline' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
  const { clientData, isLoading: isDashLoading, fetchClientDashboard } = useDashboard();
  const { unreadCount, fetchUnreadCount } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PropertyType | undefined>(undefined);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    fetchFeatured();
    searchProperties();
    fetchClientDashboard();
    fetchUnreadCount();
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeatured(), searchProperties(), fetchClientDashboard(), fetchUnreadCount()]);
    setRefreshing(false);
  }, []);

  const handleFilterPress = (type: PropertyType | undefined) => {
    setActiveFilter(type);
    if (type) { setFilters({ type }); searchProperties({ ...filters, type }); }
    else { searchProperties({}); }
  };

  const firstName = user?.firstName ?? 'there';

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* ── Subtle background texture layer ── */}
      <View style={dynamicStyles.bgAccent} pointerEvents="none" />

      {/* ── Header ── */}
      <Animated.View style={[dynamicStyles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      }]}>
        <TouchableOpacity style={dynamicStyles.headerLeft} onPress={() => router.push('/profile' as never)} activeOpacity={0.75}>
          <View style={dynamicStyles.avatarWrapper}>
            <LinearGradient
              colors={[colors.primary + 'CC', colors.primary]}
              style={dynamicStyles.avatarGradientRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={dynamicStyles.avatarCircle}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={dynamicStyles.avatarImage} contentFit="cover" transition={200} />
                ) : (
                  <Text style={dynamicStyles.avatarText}>{user?.firstName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
                )}
              </View>
            </LinearGradient>
            <View style={dynamicStyles.onlineIndicator} />
          </View>
          <View style={dynamicStyles.greeting}>
            <Text style={dynamicStyles.greetingSub}>{getGreeting()} 👋</Text>
            <Text style={dynamicStyles.greetingName}>{firstName}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={dynamicStyles.notificationBtn}
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.75}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={dynamicStyles.notifBadge}>
              <Text style={dynamicStyles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
        }}>

          {/* ── Search Bar ── */}
          <TouchableOpacity style={dynamicStyles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primary + 'CC']}
              style={dynamicStyles.searchIconWrap}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="search" size={17} color="#FFFFFF" />
            </LinearGradient>
            <Text style={dynamicStyles.searchPlaceholder}>Search properties, locations...</Text>
            <View style={dynamicStyles.searchDivider} />
            <View style={dynamicStyles.searchFilterBtn}>
              <Ionicons name="options-outline" size={17} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* ── Quick Stats ── */}
          {clientData && (
            <View style={dynamicStyles.statsRow}>
              <StatCard icon="document-text-outline" label="Applications" value={clientData.applicationsSummary?.total ?? 0} color="#6366F1" bgColor="#EEF2FF" gradientColors={['#EEF2FF', '#E0E7FF'] as const} />
              <StatCard icon="checkmark-circle-outline" label="Approved" value={clientData.applicationsSummary?.APPROVED ?? 0} color="#16A34A" bgColor="#DCFCE7" gradientColors={['#DCFCE7', '#BBF7D0'] as const} />
              <StatCard icon="hourglass-outline" label="Pending" value={clientData.applicationsSummary?.PENDING ?? 0} color="#D97706" bgColor="#FEF3C7" gradientColors={['#FEF3C7', '#FDE68A'] as const} />
            </View>
          )}

          {/* ── Quick Filters ── */}
          <View style={dynamicStyles.filtersRow}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={QUICK_FILTERS}
              keyExtractor={(item) => item.label}
              contentContainerStyle={dynamicStyles.filtersList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[dynamicStyles.filterPill, activeFilter === item.value && dynamicStyles.filterPillActive]}
                  onPress={() => handleFilterPress(item.value)}
                  activeOpacity={0.75}
                >
                  {activeFilter === item.value ? (
                    <LinearGradient
                      colors={[colors.primary, colors.primary + 'DD']}
                      style={dynamicStyles.filterPillGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={item.icon} size={14} color="#FFFFFF" />
                      <Text style={[dynamicStyles.filterPillText, dynamicStyles.filterPillTextActive]}>{item.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={dynamicStyles.filterPillInner}>
                      <Ionicons name={item.icon} size={14} color={colors.textSecondary} />
                      <Text style={dynamicStyles.filterPillText}>{item.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>

          {/* ── Featured Properties ── */}
          <View style={dynamicStyles.sectionHeaderWrap}>
            <SectionHeader title="Featured Properties" actionLabel="See All" onAction={() => router.push('/search')} style={dynamicStyles.sectionHeader} />
          </View>
          {isLoadingFeatured ? (
            <FeaturedSkeleton colors={colors} />
          ) : featured.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featured}
              keyExtractor={(item) => item.id}
              contentContainerStyle={dynamicStyles.featuredList}
              snapToInterval={FEATURED_CARD_WIDTH + Spacing.md}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.88} onPress={() => router.push(`/properties/${item.id}`)} style={dynamicStyles.featuredCardWrapper}>
                  <FeaturedCard property={item} colors={colors} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <EmptyState icon="home-outline" title="No featured properties" description="Featured listings will appear here." style={dynamicStyles.emptyInline} />
          )}

          {/* ── Recommended ── */}
          <View style={[dynamicStyles.sectionHeaderWrap, { marginTop: Spacing.lg }]}>
            <SectionHeader title="Recommended for You" actionLabel="View All" onAction={() => router.push('/search')} style={dynamicStyles.sectionHeader} />
          </View>
          {isLoadingProperties ? (
            <View style={dynamicStyles.recSkeletonWrap}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={dynamicStyles.recSkeleton}>
                  <Skeleton width={116} height={96} borderRadius={BorderRadius.lg} />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
                    <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width="40%" height={14} />
                  </View>
                </View>
              ))}
            </View>
          ) : properties.length > 0 ? (
            properties.slice(0, 6).map((p) => (
              <View key={p.id} style={dynamicStyles.recItem}><PropertyCard property={p} variant="horizontal" /></View>
            ))
          ) : (
            <EmptyState icon="search-outline" title="No properties yet" description="Pull down to refresh or try a different filter." style={dynamicStyles.emptyInline} />
          )}

          <View style={{ height: Spacing.xxxxl + 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ────────── Sub-components ────────── */

function StatCard({ icon, label, value, color, bgColor, gradientColors }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string; bgColor: string; gradientColors: readonly [string, string, ...string[]];
}) {
  const { colors } = useTheme();
  const statStyles = useMemo(() => {
    return StyleSheet.create({
      statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        ...Shadows.sm,
      },
      statIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm + 2,
        overflow: 'hidden',
      },
      statValue: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.textPrimary,
        letterSpacing: -0.5,
      },
      statLabel: {
        ...Typography.small,
        color: colors.textMuted,
        marginTop: 3,
        fontWeight: '500',
      },
    });
  }, [colors]);

  return (
    <View style={statStyles.statCard}>
      <View style={statStyles.statIconWrap}>
        <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={statStyles.statValue}>{value}</Text>
      <Text style={statStyles.statLabel}>{label}</Text>
    </View>
  );
}

function FeaturedCard({ property, colors }: { property: Property; colors: any }) {
  const featureStyles = useMemo(() => {
    return StyleSheet.create({
      featuredCard: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.xl + 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
        ...Shadows.md,
      },
      featuredImageWrap: { position: 'relative' as const },
      featuredImage: { width: '100%', height: 195 },
      featuredGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 },
      featuredTopRow: {
        position: 'absolute',
        top: Spacing.md,
        left: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(0,0,0,0.52)',
        paddingHorizontal: Spacing.sm + 4,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      },
      featuredBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
      },
      featuredBadgeText: { ...Typography.small, color: '#FFFFFF', fontWeight: '600', letterSpacing: 0.3 },
      featuredSaveBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
      },
      featuredPriceOnImage: { position: 'absolute', bottom: Spacing.md, left: Spacing.md },
      featuredPriceText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
      },
      featuredPriceLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
        letterSpacing: 0.2,
      },
      featuredInfo: { padding: Spacing.md + 2 },
      featuredTitle: {
        ...Typography.bodyMedium,
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.1,
      },
      featuredLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 4,
      },
      featuredLocationText: {
        ...Typography.caption,
        color: colors.textSecondary,
        flex: 1,
      },
      featuredDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: Spacing.sm + 2,
      },
      featuredMeta: {
        flexDirection: 'row',
        gap: Spacing.md + 4,
      },
    });
  }, [colors]);

  return (
    <View style={featureStyles.featuredCard}>
      <View style={featureStyles.featuredImageWrap}>
        <Image
          source={{ uri: property.images?.[0] }}
          style={featureStyles.featuredImage}
          contentFit="cover"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={featureStyles.featuredGradient}
        />
        {/* Top row: badge + save */}
        <View style={featureStyles.featuredTopRow}>
          <View style={featureStyles.featuredBadge}>
            <View style={featureStyles.featuredBadgeDot} />
            <Text style={featureStyles.featuredBadgeText}>{property.type}</Text>
          </View>
          <TouchableOpacity style={featureStyles.featuredSaveBtn} activeOpacity={0.75}>
            <Ionicons name="heart-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {/* Price overlay */}
        <View style={featureStyles.featuredPriceOnImage}>
          <Text style={featureStyles.featuredPriceLabel}>LISTING PRICE</Text>
          <Text style={featureStyles.featuredPriceText}>{formatCurrency(property.price)}</Text>
        </View>
      </View>
      <View style={featureStyles.featuredInfo}>
        <Text style={featureStyles.featuredTitle} numberOfLines={1}>{property.title}</Text>
        <View style={featureStyles.featuredLocation}>
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text style={featureStyles.featuredLocationText} numberOfLines={1}>{property.city}, {property.state}</Text>
        </View>
        <View style={featureStyles.featuredDivider} />
        <View style={featureStyles.featuredMeta}>
          {property.bedrooms != null && <MetaChip icon="bed-outline" text={`${property.bedrooms} Bed`} colors={colors} />}
          {property.bathrooms != null && <MetaChip icon="water-outline" text={`${property.bathrooms} Bath`} colors={colors} />}
          {property.area != null && <MetaChip icon="resize-outline" text={`${property.area} sqm`} colors={colors} />}
        </View>
      </View>
    </View>
  );
}

function MetaChip({ icon, text, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; colors: any }) {
  const metaStyles = useMemo(() => {
    return StyleSheet.create({
      metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
      },
      metaChipText: {
        ...Typography.small,
        color: colors.textSecondary,
        fontWeight: '500',
      },
    });
  }, [colors]);

  return (
    <View style={metaStyles.metaChip}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />
      <Text style={metaStyles.metaChipText}>{text}</Text>
    </View>
  );
}

function FeaturedSkeleton({ colors }: { colors: any }) {
  const skeletonStyles = useMemo(() => {
    return StyleSheet.create({
      featuredCardWrapper: { width: FEATURED_CARD_WIDTH },
      featuredList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    });
  }, [colors]);

  return (
    <FlatList
      horizontal showsHorizontalScrollIndicator={false}
      data={[1, 2]} keyExtractor={(i) => String(i)} contentContainerStyle={skeletonStyles.featuredList}
      renderItem={() => (
        <View style={skeletonStyles.featuredCardWrapper}>
          <Skeleton width={FEATURED_CARD_WIDTH} height={195} borderRadius={BorderRadius.xl + 4} />
          <View style={{ padding: Spacing.md }}>
            <Skeleton width={130} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={FEATURED_CARD_WIDTH - 60} height={12} style={{ marginBottom: 8 }} />
            <Skeleton width={110} height={10} />
          </View>
        </View>
      )}
    />
  );
}

/* ────────── Styles ────────── */

const createStyles = (colors: any) =>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md + 2,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatarWrapper: {
      position: 'relative',
    },
    avatarGradientRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      padding: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarCircle: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden' as const,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    avatarImage: {
      width: 46,
      height: 46,
      borderRadius: 23,
    },
    avatarText: {
      ...Typography.bodySemiBold,
      color: colors.primary,
      fontSize: 19,
      fontWeight: '700',
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 13,
      height: 13,
      borderRadius: 6.5,
      backgroundColor: colors.success,
      borderWidth: 2.5,
      borderColor: colors.surface,
    },
    greeting: {
      marginLeft: Spacing.md,
    },
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
    notificationBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
    },
    notifBadge: {
      position: 'absolute',
      top: 3,
      right: 3,
      minWidth: 19,
      height: 19,
      borderRadius: 9.5,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    notifBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    scrollContent: {
      paddingBottom: Spacing.xxxxl,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xs,
      marginBottom: Spacing.xl,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.sm,
    },
    searchIconWrap: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md + 2,
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
      height: 22,
      backgroundColor: colors.border,
      marginHorizontal: Spacing.xs,
    },
    searchFilterBtn: {
      width: 38,
      height: 38,
      borderRadius: BorderRadius.md + 2,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm + 2,
      marginBottom: Spacing.xl,
    },
    filtersRow: {
      marginBottom: Spacing.xl,
    },
    filtersList: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    filterPill: {
      borderRadius: BorderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    filterPillActive: {
      borderColor: colors.primary,
    },
    filterPillGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 1,
    },
    filterPillInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 1,
    },
    filterPillText: {
      ...Typography.captionMedium,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterPillTextActive: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    sectionHeaderWrap: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    sectionHeader: {},
    featuredList: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    featuredCardWrapper: {
      width: FEATURED_CARD_WIDTH,
    },
    emptyInline: {
      paddingVertical: Spacing.xxl,
    },
    recItem: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.sm,
    },
    recSkeletonWrap: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
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