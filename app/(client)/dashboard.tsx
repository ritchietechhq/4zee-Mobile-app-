import React, { useEffect, useCallback, useRef, useState } from 'react';
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
import { PropertyCard } from '@/components/property/PropertyCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { PropertyType, Property } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.75;

const QUICK_FILTERS: { label: string; value: PropertyType | undefined; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', value: undefined, icon: 'apps-outline' },
  { label: 'House', value: 'HOUSE', icon: 'home-outline' },
  { label: 'Apartment', value: 'APARTMENT', icon: 'business-outline' },
  { label: 'Land', value: 'LAND', icon: 'layers-outline' },
  { label: 'Commercial', value: 'COMMERCIAL', icon: 'storefront-outline' },
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
    <View style={[styles.container, { paddingTop: insets.top }]}>  
      {/* ── Header ── */}
      <Animated.View style={[styles.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/profile' as never)} activeOpacity={0.7}>
          <View style={styles.avatarCircle}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} contentFit="cover" transition={200} />
            ) : (
              <Text style={styles.avatarText}>{user?.firstName?.charAt(0)?.toUpperCase() ?? 'U'}</Text>
            )}
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.greeting}>
            <Text style={styles.greetingSub}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{firstName} 👋</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}>
          {/* ── Search Bar ── */}
          <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search')} activeOpacity={0.8}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={18} color={Colors.white} />
            </View>
            <Text style={styles.searchPlaceholder}>Search properties, locations...</Text>
            <View style={styles.searchFilterBtn}>
              <Ionicons name="options-outline" size={18} color={Colors.primary} />
            </View>
          </TouchableOpacity>

          {/* ── Quick Stats ── */}
          {clientData && (
            <View style={styles.statsRow}>
              <StatCard icon="document-text-outline" label="Applications" value={clientData.applicationsSummary?.total ?? 0} color="#6366F1" bgColor="#EEF2FF" />
              <StatCard icon="checkmark-circle-outline" label="Approved" value={clientData.applicationsSummary?.APPROVED ?? 0} color="#16A34A" bgColor="#DCFCE7" />
              <StatCard icon="wallet-outline" label="Spent" value={clientData.financials?.totalSpent ?? 0} color="#F59E0B" bgColor="#FEF3C7" />
            </View>
          )}

          {/* ── Quick Filters ── */}
          <View style={styles.filtersRow}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={QUICK_FILTERS}
              keyExtractor={(item) => item.label}
              contentContainerStyle={styles.filtersList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterPill, activeFilter === item.value && styles.filterPillActive]}
                  onPress={() => handleFilterPress(item.value)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={16} color={activeFilter === item.value ? Colors.white : Colors.textSecondary} />
                  <Text style={[styles.filterPillText, activeFilter === item.value && styles.filterPillTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* ── Featured Properties ── */}
          <SectionHeader title="Featured Properties" actionLabel="See All" onAction={() => router.push('/search')} style={styles.sectionHeader} />
          {isLoadingFeatured ? (
            <FeaturedSkeleton />
          ) : featured.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featured}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.featuredList}
              snapToInterval={FEATURED_CARD_WIDTH + Spacing.md}
              decelerationRate="fast"
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/properties/${item.id}`)} style={styles.featuredCardWrapper}>
                  <FeaturedCard property={item} />
                </TouchableOpacity>
              )}
            />
          ) : (
            <EmptyState icon="home-outline" title="No featured properties" description="Featured listings will appear here." style={styles.emptyInline} />
          )}

          {/* ── Recommended ── */}
          <SectionHeader title="Recommended for You" actionLabel="View All" onAction={() => router.push('/search')} style={styles.sectionHeader} />
          {isLoadingProperties ? (
            <View style={styles.recSkeletonWrap}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.recSkeleton}>
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
              <View key={p.id} style={styles.recItem}><PropertyCard property={p} variant="horizontal" /></View>
            ))
          ) : (
            <EmptyState icon="search-outline" title="No properties yet" description="Pull down to refresh or try a different filter." style={styles.emptyInline} />
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
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FeaturedCard({ property }: { property: Property }) {
  return (
    <View style={styles.featuredCard}>
      <View style={styles.featuredImageWrap}>
        <Image source={{ uri: property.images?.[0] }} style={styles.featuredImage} contentFit="cover" placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4" transition={300} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.featuredGradient} />
        <View style={styles.featuredBadge}>
          <Ionicons name="flash" size={10} color="#F59E0B" />
          <Text style={styles.featuredBadgeText}>{property.type}</Text>
        </View>
        <TouchableOpacity style={styles.featuredSaveBtn} activeOpacity={0.7}>
          <Ionicons name="heart-outline" size={18} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.featuredPriceOnImage}>
          <Text style={styles.featuredPriceText}>{formatCurrency(property.price)}</Text>
        </View>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{property.title}</Text>
        <View style={styles.featuredLocation}>
          <Ionicons name="location" size={13} color={Colors.primary} />
          <Text style={styles.featuredLocationText} numberOfLines={1}>{property.city}, {property.state}</Text>
        </View>
        <View style={styles.featuredMeta}>
          {property.bedrooms != null && <MetaChip icon="bed-outline" text={String(property.bedrooms)} />}
          {property.bathrooms != null && <MetaChip icon="water-outline" text={String(property.bathrooms)} />}
          {property.area != null && <MetaChip icon="resize-outline" text={`${property.area} sqm`} />}
        </View>
      </View>
    </View>
  );
}

function MetaChip({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.metaChipText}>{text}</Text>
    </View>
  );
}

function FeaturedSkeleton() {
  return (
    <FlatList
      horizontal showsHorizontalScrollIndicator={false}
      data={[1, 2]} keyExtractor={(i) => String(i)} contentContainerStyle={styles.featuredList}
      renderItem={() => (
        <View style={styles.featuredCardWrapper}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary + '20' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { ...Typography.bodySemiBold, color: Colors.primary, fontSize: 18 },
  onlineIndicator: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.success, borderWidth: 2, borderColor: Colors.white },
  greeting: { marginLeft: Spacing.md },
  greetingSub: { ...Typography.caption, color: Colors.textSecondary },
  greetingName: { ...Typography.h4, color: Colors.textPrimary, marginTop: 1 },
  notificationBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  notifBadge: { position: 'absolute', top: 4, right: 4, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: Colors.white },
  notifBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  scrollContent: { paddingBottom: Spacing.xxxxl },

  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.sm, marginBottom: Spacing.xl, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  searchIconWrap: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchPlaceholder: { ...Typography.body, color: Colors.textMuted, flex: 1, marginLeft: Spacing.md },
  searchFilterBtn: { width: 40, height: 40, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.sm },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { ...Typography.h3, color: Colors.textPrimary },
  statLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  filtersRow: { marginBottom: Spacing.xl },
  filtersList: { paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  filterPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.borderLight },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { ...Typography.captionMedium, color: Colors.textSecondary },
  filterPillTextActive: { color: Colors.white },

  sectionHeader: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  featuredList: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  featuredCardWrapper: { width: FEATURED_CARD_WIDTH },
  featuredCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.md },
  featuredImageWrap: { position: 'relative' },
  featuredImage: { width: '100%', height: 180 },
  featuredGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  featuredBadge: { position: 'absolute', top: Spacing.sm, left: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: Spacing.sm + 2, paddingVertical: 4, borderRadius: BorderRadius.full },
  featuredBadgeText: { ...Typography.small, color: Colors.white, fontWeight: '600' },
  featuredSaveBtn: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  featuredPriceOnImage: { position: 'absolute', bottom: Spacing.sm, left: Spacing.sm },
  featuredPriceText: { ...Typography.bodySemiBold, color: Colors.white, fontSize: 17 },
  featuredInfo: { padding: Spacing.md },
  featuredTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  featuredLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  featuredLocationText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  featuredMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaChipText: { ...Typography.small, color: Colors.textMuted },

  recItem: { paddingHorizontal: Spacing.xl },
  recSkeletonWrap: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  recSkeleton: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, ...Shadows.sm },
  emptyInline: { paddingVertical: Spacing.xxl },
});

