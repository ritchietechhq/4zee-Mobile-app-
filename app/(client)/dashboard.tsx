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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const QUICK_FILTERS: { label: string; value: PropertyType | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: undefined, icon: 'apps-outline' },
  { label: 'House', value: 'House' as PropertyType, icon: 'home-outline' },
  { label: 'Apartment', value: 'Apartment' as PropertyType, icon: 'business-outline' },
  { label: 'Land', value: 'Land' as PropertyType, icon: 'layers-outline' },
  { label: 'Commercial', value: 'Commercial' as PropertyType, icon: 'storefront-outline' },
];

// ── Market insight tiles (static/decorative — swap with real data if available)
const MARKET_INSIGHTS = [
  { label: 'Avg. Price', value: '₦45M', change: '+3.2%', up: true, icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap },
  { label: 'New Listings', value: '128', change: '+12 today', up: true, icon: 'home-outline' as keyof typeof Ionicons.glyphMap },
  { label: 'Avg. Days Listed', value: '21d', change: '-2 days', up: false, icon: 'time-outline' as keyof typeof Ionicons.glyphMap },
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
  const [unreadMessages, setUnreadMessages] = useState(0);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;

  const dynamicStyles = useMemo(() => createStyles(colors), [colors]);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const count = await messagingService.getUnreadCount();
      setUnreadMessages(count);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
    searchProperties();
    fetchClientDashboard();
    fetchUnreadCount();
    fetchUnreadMessages();
    Animated.stagger(80, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.spring(heroAnim,   { toValue: 1, useNativeDriver: true, tension: 55, friction: 13 }),
      Animated.spring(contentAnim,{ toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }),
    ]).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeatured(), searchProperties(), fetchClientDashboard(), fetchUnreadCount(), fetchUnreadMessages()]);
    setRefreshing(false);
  }, [fetchUnreadMessages]);

  const handleFilterPress = (type: PropertyType | undefined) => {
    setActiveFilter(type);
    if (type) { setFilters({ type }); searchProperties({ ...filters, type }); }
    else { searchProperties({}); }
  };

  const firstName = user?.firstName ?? 'there';
  const isDark = colors.background === '#16161E' || colors.background < '#888888';

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      {/* ── Decorative background blobs ── */}
      <View style={dynamicStyles.bgBlob1} pointerEvents="none" />
      <View style={dynamicStyles.bgBlob2} pointerEvents="none" />

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
        <View style={dynamicStyles.headerRight}>
          <TouchableOpacity
            style={dynamicStyles.headerIconBtn}
            onPress={() => router.push('/(client)/messages' as never)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.textPrimary} />
            {unreadMessages > 0 && (
              <View style={dynamicStyles.notifBadge}>
                <Text style={dynamicStyles.notifBadgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.headerIconBtn}
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
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {/* ── Hero Search Banner ── */}
        <Animated.View style={[dynamicStyles.heroBannerWrap, {
          opacity: heroAnim,
          transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}>
          <LinearGradient
            colors={[colors.primary, colors.primary + 'AA', colors.primary + '66']}
            style={dynamicStyles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Decorative circle inside banner */}
            <View style={dynamicStyles.heroBannerCircle} />
            <View style={dynamicStyles.heroBannerCircle2} />
            <View style={dynamicStyles.heroBannerContent}>
              <Text style={dynamicStyles.heroBannerLabel}>FIND YOUR DREAM HOME</Text>
              <Text style={dynamicStyles.heroBannerTitle}>Discover{'\n'}Properties Near You</Text>
              {/* <TouchableOpacity style={dynamicStyles.heroBannerBtn} onPress={() => router.push('/search')} activeOpacity={0.85}>
                <Ionicons name="search" size={15} color={colors.primary} />
                <Text style={[dynamicStyles.heroBannerBtnText, { color: colors.primary }]}>Start Searching</Text>
              </TouchableOpacity> */}
            </View>
            <View style={dynamicStyles.heroBannerIllustration}>
              <Ionicons name="business" size={80} color="rgba(255,255,255,0.12)" />
            </View>
          </LinearGradient>
        </Animated.View>

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

          {/* ── Quick Actions Row ── */}
          <View style={dynamicStyles.quickActionsWrap}>
            <Text style={[dynamicStyles.quickActionsTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
            <View style={dynamicStyles.quickActionsRow}>
              <QuickActionBtn icon="search-outline" label="Search" color="#6366F1" onPress={() => router.push('/search')} colors={colors} />
              <QuickActionBtn icon="chatbubble-ellipses-outline" label="Messages" color="#D97706" onPress={() => router.push('/(client)/messages' as never)} colors={colors} badge={unreadMessages} />
              <QuickActionBtn icon="heart-outline" label="Saved" color="#E11D48" onPress={() => router.push('/saved' as never)} colors={colors} />
            </View>
          </View>

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

          {/* ── Recommended ── */}
          <View style={dynamicStyles.sectionHeaderWrap}>
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

          {/* ── Featured Properties ── */}
          <View style={[dynamicStyles.sectionHeaderWrap, { marginTop: Spacing.lg }]}>
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

          {/* ── Recently Viewed / Browse CTA ── */}
          <View style={dynamicStyles.browseCTAWrap}>
            <LinearGradient
              colors={[colors.primary + '18', colors.primary + '06']}
              style={dynamicStyles.browseCTA}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[dynamicStyles.browseCTAIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="compass-outline" size={26} color={colors.primary} />
              </View>
              <View style={dynamicStyles.browseCTAText}>
                <Text style={[dynamicStyles.browseCTATitle, { color: colors.textPrimary }]}>Explore All Properties</Text>
                <Text style={[dynamicStyles.browseCTASub, { color: colors.textMuted }]}>Browse hundreds of listings across Nigeria</Text>
              </View>
              <TouchableOpacity
                style={[dynamicStyles.browseCTABtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/search')}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={{ height: Spacing.xxxxl + 20 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ────────── Sub-components ────────── */

function QuickActionBtn({
  icon, label, color, onPress, colors, badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  colors: any;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.qaBtn} onPress={onPress} activeOpacity={0.78}>
      <View style={[styles.qaIconWrap, { backgroundColor: color + '18', borderColor: color + '30' }]}>
        <Ionicons name={icon} size={22} color={color} />
        {!!badge && badge > 0 && (
          <View style={[styles.qaBadge, { backgroundColor: color }]}>
            <Text style={styles.qaBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.qaLabel, { color: colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

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
        <View style={featureStyles.featuredTopRow}>
          <View style={featureStyles.featuredBadge}>
            <View style={featureStyles.featuredBadgeDot} />
            <Text style={featureStyles.featuredBadgeText}>{property.type}</Text>
          </View>
          <TouchableOpacity style={featureStyles.featuredSaveBtn} activeOpacity={0.75}>
            <Ionicons name="heart-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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

/* ────────── Static styles (for new components) ────────── */
const styles = StyleSheet.create({
  qaBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  qaIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  qaBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  qaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  qaLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});

/* ────────── Dynamic Styles ────────── */
const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // ── Background decorative blobs
    bgBlob1: {
      position: 'absolute',
      top: -100,
      right: -80,
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: colors.primary + '0A',
      zIndex: 0,
    },
    bgBlob2: {
      position: 'absolute',
      top: 200,
      left: -100,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.primary + '06',
      zIndex: 0,
    },
    // ── Header
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
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
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
    // ── Hero Banner
    heroBannerWrap: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.lg,
    },
    heroBanner: {
      borderRadius: BorderRadius.xxl,
      padding: Spacing.xl,
      minHeight: 150,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      ...Shadows.md,
    },
    heroBannerCircle: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.07)',
      right: -40,
      top: -50,
    },
    heroBannerCircle2: {
      position: 'absolute',
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255,255,255,0.05)',
      right: 60,
      bottom: -30,
    },
    heroBannerContent: {
      flex: 1,
      zIndex: 1,
    },
    heroBannerIllustration: {
      position: 'absolute',
      right: Spacing.lg,
      bottom: 0,
      zIndex: 0,
    },
    heroBannerLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: 1.5,
      marginBottom: Spacing.xs,
    },
    heroBannerTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.5,
      lineHeight: 28,
      marginBottom: Spacing.lg,
    },
    heroBannerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: Spacing.md + 4,
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.full,
      alignSelf: 'flex-start',
    },
    heroBannerBtnText: {
      fontSize: 13,
      fontWeight: '700',
    },
    // ── Search Bar
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
    // ── Stats
    statsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm + 2,
      marginBottom: Spacing.xl,
    },
    // ── Market Pulse
    marketPulseWrap: {
      marginBottom: Spacing.xl,
    },
    marketPulseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
    },
    marketPulseDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    marketPulseTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    marketPulseList: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    marketPulseCard: {
      width: 120,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      ...Shadows.sm,
    },
    marketPulseIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    marketPulseValue: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    marketPulseLabel: {
      fontSize: 11,
      fontWeight: '500',
      marginTop: 2,
      marginBottom: Spacing.sm,
    },
    marketPulseChangePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    marketPulseChange: {
      fontSize: 10,
      fontWeight: '700',
    },
    // ── Quick Actions
    quickActionsWrap: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    quickActionsTitle: {
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginBottom: Spacing.md,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    // ── Filters
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
    // ── Section headers
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
    // ── Browse CTA
    browseCTAWrap: {
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.lg,
    },
    browseCTA: {
      borderRadius: BorderRadius.xxl,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    browseCTAIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    browseCTAText: {
      flex: 1,
    },
    browseCTATitle: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    browseCTASub: {
      fontSize: 12,
      marginTop: 2,
      lineHeight: 16,
    },
    browseCTABtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.sm,
    },
  });