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
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.75;

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
      {/* ── Header ── */}
      <Animated.View style={[dynamicStyles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}>
        <TouchableOpacity style={dynamicStyles.headerLeft} onPress={() => router.push('/profile' as never)} activeOpacity={0.7}>
          <View style={dynamicStyles.avatarCircle}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={dynamicStyles.avatarImage} contentFit="cover" transition={200} />
            ) : (
              <Text style={dynamicStyles.avatarText}>{user?.firstName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
            )}
            <View style={dynamicStyles.onlineIndicator} />
          </View>
          <View style={dynamicStyles.greeting}>
            <Text style={dynamicStyles.greetingSub}>{getGreeting()},</Text>
            <Text style={dynamicStyles.greetingName}>{firstName} 👋</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={dynamicStyles.notificationBtn} onPress={() => router.push('/notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
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
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}>
          {/* ── Search Bar ── */}
          <TouchableOpacity style={dynamicStyles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.8}>
            <View style={dynamicStyles.searchIconWrap}>
              <Ionicons name="search" size={18} color={colors.white} />
            </View>
            <Text style={dynamicStyles.searchPlaceholder}>Search properties, locations...</Text>
            <View style={dynamicStyles.searchFilterBtn}>
              <Ionicons name="options-outline" size={18} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* ── Quick Stats ── */}
          {clientData && (
            <View style={dynamicStyles.statsRow}>
              <StatCard icon="document-text-outline" label="Applications" value={clientData.applicationsSummary?.total ?? 0} color="#6366F1" bgColor="#EEF2FF" />
              <StatCard icon="checkmark-circle-outline" label="Approved" value={clientData.applicationsSummary?.APPROVED ?? 0} color="#16A34A" bgColor="#DCFCE7" />
              <StatCard icon="hourglass-outline" label="Pending" value={clientData.applicationsSummary?.PENDING ?? 0} color="#F59E0B" bgColor="#FEF3C7" />
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
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={16} color={activeFilter === item.value ? colors.white : colors.textSecondary} />
                  <Text style={[dynamicStyles.filterPillText, activeFilter === item.value && dynamicStyles.filterPillTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* ── Featured Properties ── */}
          <SectionHeader title="Featured Properties" actionLabel="See All" onAction={() => router.push('/search')} style={dynamicStyles.sectionHeader} />
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
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/properties/${item.id}`)} style={dynamicStyles.featuredCardWrapper}>
                  <FeaturedCard property={item} colors={colors} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <EmptyState icon="home-outline" title="No featured properties" description="Featured listings will appear here." style={dynamicStyles.emptyInline} />
          )}

          {/* ── Recommended ── */}
          <SectionHeader title="Recommended for You" actionLabel="View All" onAction={() => router.push('/search')} style={dynamicStyles.sectionHeader} />
          {isLoadingProperties ? (
            <View style={dynamicStyles.recSkeletonWrap}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={dynamicStyles.recSkeleton}>
                  <Skeleton width={120} height={100} borderRadius={BorderRadius.lg} />
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

function StatCard({ icon, label, value, color, bgColor }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: number; color: string; bgColor: string;
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
        ...Shadows.sm,
      },
      statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
      statValue: { ...Typography.h3, color: colors.textPrimary },
      statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },
    });
  }, [colors]);

  return (
    <View style={statStyles.statCard}>
      <View style={[statStyles.statIcon, { backgroundColor: bgColor }]}>
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
      featuredCard: { backgroundColor: colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...Shadows.md },
      featuredImageWrap: { position: 'relative' as const },
      featuredImage: { width: '100%', height: 180 },
      featuredGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
      featuredBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: Spacing.sm + 2, paddingVertical: 4, borderRadius: BorderRadius.full },
      featuredBadgeText: { ...Typography.small, color: colors.white, fontWeight: '600' },
      featuredSaveBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
      featuredPriceOnImage: { position: 'absolute', bottom: Spacing.sm, left: Spacing.sm },
      featuredPriceText: { ...Typography.bodySemiBold, color: colors.white, fontSize: 17 },
      featuredInfo: { padding: Spacing.md },
      featuredTitle: { ...Typography.bodyMedium, color: colors.textPrimary },
      featuredLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
      featuredLocationText: { ...Typography.caption, color: colors.textSecondary, flex: 1 },
      featuredMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    });
  }, [colors]);

  return (
    <View style={featureStyles.featuredCard}>
      <View style={featureStyles.featuredImageWrap}>
        <Image source={{ uri: property.images?.[0] }} style={featureStyles.featuredImage} contentFit="cover" placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4" transition={300} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={featureStyles.featuredGradient} />
        <View style={featureStyles.featuredBadge}>
          <Ionicons name="flash" size={10} color="#F59E0B" />
          <Text style={featureStyles.featuredBadgeText}>{property.type}</Text>
        </View>
        <TouchableOpacity style={featureStyles.featuredSaveBtn} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={18} color={colors.white} />
        </TouchableOpacity>
        <View style={featureStyles.featuredPriceOnImage}>
          <Text style={featureStyles.featuredPriceText}>{formatCurrency(property.price)}</Text>
        </View>
      </View>
      <View style={featureStyles.featuredInfo}>
        <Text style={featureStyles.featuredTitle} numberOfLines={1}>{property.title}</Text>
        <View style={featureStyles.featuredLocation}>
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text style={featureStyles.featuredLocationText} numberOfLines={1}>{property.city}, {property.state}</Text>
        </View>
        <View style={featureStyles.featuredMeta}>
          {property.bedrooms != null && <MetaChip icon="bed-outline" text={String(property.bedrooms)} colors={colors} />}
          {property.bathrooms != null && <MetaChip icon="water-outline" text={String(property.bathrooms)} colors={colors} />}
          {property.area != null && <MetaChip icon="resize-outline" text={`${property.area} sqm`} colors={colors} />}
        </View>
      </View>
    </View>
  );
}

function MetaChip({ icon, text, colors }: { icon: keyof typeof Ionicons.glyphMap; text: string; colors: any }) {
  const metaStyles = useMemo(() => {
    return StyleSheet.create({
      metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
      metaChipText: { ...Typography.small, color: colors.textMuted },
    });
  }, [colors]);

  return (
    <View style={metaStyles.metaChip}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
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
          <Skeleton width={FEATURED_CARD_WIDTH} height={180} borderRadius={BorderRadius.xl} />
          <View style={{ padding: Spacing.md }}>
            <Skeleton width={120} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={FEATURED_CARD_WIDTH - 60} height={12} style={{ marginBottom: 6 }} />
            <Skeleton width={100} height={10} />
          </View>
        </View>
      )}
    />
  );
}

/* ────────── Styles ────────── */

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary + '20', overflow: 'hidden' as const },
    avatarImage: { width: 48, height: 48, borderRadius: 24 },
    avatarText: { ...Typography.bodySemiBold, color: colors.primary, fontSize: 18 },
    onlineIndicator: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.white },
    greeting: { marginLeft: Spacing.md },
    greetingSub: { ...Typography.caption, color: colors.textSecondary },
    greetingName: { ...Typography.h4, color: colors.textPrimary, marginTop: 1 },
    notificationBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    notifBadge: { position: 'absolute', top: 4, right: 4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: colors.white },
    notifBadgeText: { fontSize: 10, fontWeight: '700', color: colors.white },
    scrollContent: { paddingBottom: Spacing.xxxxl },
    searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.sm, marginBottom: Spacing.xl, backgroundColor: colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: colors.border, ...Shadows.sm },
    searchIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    searchPlaceholder: { ...Typography.body, color: colors.textMuted, flex: 1, marginLeft: Spacing.md },
    searchFilterBtn: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl },
    filtersRow: { marginBottom: Spacing.xl },
    filtersList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
    filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
    filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterPillText: { ...Typography.captionMedium, color: colors.textSecondary },
    filterPillTextActive: { color: colors.white },
    sectionHeader: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    featuredList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    featuredCardWrapper: { width: FEATURED_CARD_WIDTH },
    emptyInline: { paddingVertical: Spacing.xxl },
    recItem: { paddingHorizontal: Spacing.xl },
    recSkeletonWrap: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    recSkeleton: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: colors.border, ...Shadows.sm },
  });

