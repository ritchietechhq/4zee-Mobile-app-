import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Share, RefreshControl, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { referralService } from '@/services/referral.service';
import type { ReferralInfo, Referral } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

// ── helpers ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── component ──────────────────────────────────────────────
export default function ReferralHubScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [infoRes, referralsRes] = await Promise.all([
        referralService.getMyInfo().catch(() => null),
        referralService.getMyReferrals().catch(() => []),
      ]);
      if (infoRes) setInfo(infoRes);
      setReferrals(referralsRes);
    } catch (e) {
      if (__DEV__) console.warn('[ReferralHub] fetch error', e);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleCopy = async () => {
    if (!info?.referralCode) return;
    await Clipboard.setStringAsync(info.referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const handleCopyLink = async () => {
    const link = info?.referralLink || `https://4zeeproperties.com/register?ref=${info?.referralCode}`;
    if (!link) return;
    await Clipboard.setStringAsync(link);
    Alert.alert('Copied!', 'Referral link copied to clipboard.');
  };

  const handleShare = async () => {
    if (!info?.referralCode) return;
    const link = info.referralLink || `https://4zeeproperties.com/register?ref=${info.referralCode}`;
    try {
      await Share.share({
        message: `Join 4Zee Properties using my referral code: ${info.referralCode}\n\n${link}`,
        title: 'My 4Zee Referral',
      });
    } catch {}
  };

  // ── loading skeleton ─────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Referral Hub</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton width="100%" height={160} style={{ borderRadius: BorderRadius.xl, marginBottom: Spacing.lg }} />
          <Skeleton width="100%" height={120} style={{ borderRadius: BorderRadius.xl, marginBottom: Spacing.lg }} />
          <Skeleton width="100%" height={200} style={{ borderRadius: BorderRadius.xl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── stat card ────────────────────────────────────────────
  const StatCard = ({ icon, label, value, iconColor }: { icon: string; label: string; value: string | number; iconColor: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  // ── referral row ─────────────────────────────────────────
  const ReferralRow = ({ item }: { item: Referral }) => {
    const initials = `${item.user.firstName?.charAt(0) || ''}${item.user.lastName?.charAt(0) || ''}`.toUpperCase();
    return (
      <View style={styles.referralRow}>
        <View style={[styles.referralAvatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.referralAvatarText, { color: colors.primary }]}>{initials || '?'}</Text>
        </View>
        <View style={styles.referralInfo}>
          <Text style={styles.referralName} numberOfLines={1}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.referralEmail} numberOfLines={1}>{item.user.email}</Text>
          <Text style={styles.referralDate}>Joined {timeAgo(item.joinedAt)}</Text>
        </View>
        <View style={styles.referralRight}>
          <Text style={styles.referralSales}>{item.totalSales} sale{item.totalSales !== 1 ? 's' : ''}</Text>
          <Text style={styles.referralEarnings}>{formatCurrency(item.yourEarnings)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral Hub</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="people-outline"
            label="Referrals"
            value={info?.totalReferrals ?? 0}
            iconColor={colors.primary}
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Active"
            value={info?.activeReferrals ?? 0}
            iconColor={colors.success}
          />
          <StatCard
            icon="wallet-outline"
            label="Earned"
            value={formatCurrency(info?.totalReferralEarnings ?? 0)}
            iconColor="#F59E0B"
          />
        </View>

        {/* Referral Code Card */}
        <Card variant="outlined" padding="lg" style={styles.codeCard}>
          <Text style={styles.codeSectionTitle}>Your Referral Code</Text>

          <View style={styles.codeBox}>
            <View style={[styles.codeValueBox, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="key-outline" size={16} color={colors.primary} style={{ marginRight: Spacing.xs }} />
              <Text style={styles.codeValue}>{info?.referralCode || '—'}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Referral Link */}
          <Text style={styles.linkLabel}>Your Referral Link</Text>
          <TouchableOpacity style={styles.linkBox} onPress={handleCopyLink} activeOpacity={0.7}>
            <Ionicons name="link-outline" size={14} color={colors.textMuted} />
            <Text style={styles.linkText} numberOfLines={1}>
              {info?.referralLink || `https://4zeeproperties.com/register?ref=${info?.referralCode || ''}`}
            </Text>
            <Ionicons name="copy-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={colors.white} />
            <Text style={styles.shareBtnText}>Share Referral Code</Text>
          </TouchableOpacity>
        </Card>

        {/* How It Works */}
        <Card variant="outlined" padding="lg" style={styles.howCard}>
          <Text style={styles.howTitle}>How It Works</Text>
          <View style={styles.howStep}>
            <View style={[styles.howBullet, { backgroundColor: colors.primary }]}>
              <Text style={styles.howBulletText}>1</Text>
            </View>
            <Text style={styles.howText}>Share your unique referral code or link with potential clients</Text>
          </View>
          <View style={styles.howStep}>
            <View style={[styles.howBullet, { backgroundColor: colors.primary }]}>
              <Text style={styles.howBulletText}>2</Text>
            </View>
            <Text style={styles.howText}>They register on 4Zee Properties using your code</Text>
          </View>
          <View style={styles.howStep}>
            <View style={[styles.howBullet, { backgroundColor: colors.primary }]}>
              <Text style={styles.howBulletText}>3</Text>
            </View>
            <Text style={styles.howText}>When they make a purchase, you earn a referral commission automatically</Text>
          </View>
        </Card>

        {/* My Referrals List */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>People You&apos;ve Referred</Text>
          {referrals.length === 0 ? (
            <Card variant="outlined" padding="xl" style={styles.emptyCard}>
              <EmptyState
                icon="people-outline"
                title="No Referrals Yet"
                description="Share your referral code with friends and colleagues to start earning commissions."
              />
            </Card>
          ) : (
            <Card variant="outlined" padding="sm" style={styles.listCard}>
              {referrals.map((item, idx) => (
                <React.Fragment key={item.id || idx}>
                  <ReferralRow item={item} />
                  {idx < referrals.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </Card>
          )}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── styles ─────────────────────────────────────────────────
const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface,
  },
  headerTitle: { ...Typography.h4, color: colors.textPrimary },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, alignItems: 'center', backgroundColor: colors.cardBackground,
    paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs,
  },
  statValue: { ...Typography.h4, color: colors.textPrimary },
  statLabel: { ...Typography.small, color: colors.textMuted, marginTop: 2 },

  // Code Card
  codeCard: { backgroundColor: colors.cardBackground, marginBottom: Spacing.lg },
  codeSectionTitle: { ...Typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: Spacing.md },
  codeBox: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  codeValueBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  codeValue: { ...Typography.h4, color: colors.primary, letterSpacing: 2, fontWeight: '700' },
  copyBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },

  linkLabel: { ...Typography.small, color: colors.textMuted, marginBottom: Spacing.xs },
  linkBox: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: colors.surface, borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  linkText: { ...Typography.small, color: colors.textSecondary, flex: 1 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, borderRadius: BorderRadius.lg,
  },
  shareBtnText: { ...Typography.bodySemiBold, color: colors.white },

  // How It Works
  howCard: { backgroundColor: colors.cardBackground, marginBottom: Spacing.lg },
  howTitle: { ...Typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: Spacing.md },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  howBullet: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  howBulletText: { ...Typography.captionMedium, color: colors.white, fontWeight: '700' },
  howText: { ...Typography.body, color: colors.textSecondary, flex: 1 },

  // List
  listSection: { marginBottom: Spacing.lg },
  listTitle: { ...Typography.captionMedium, color: colors.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: Spacing.md },
  listCard: { backgroundColor: colors.cardBackground },
  emptyCard: { backgroundColor: colors.cardBackground },

  referralRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
  },
  referralAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
  },
  referralAvatarText: { ...Typography.captionMedium, fontWeight: '700' },
  referralInfo: { flex: 1 },
  referralName: { ...Typography.bodySemiBold, color: colors.textPrimary },
  referralEmail: { ...Typography.small, color: colors.textMuted, marginTop: 1 },
  referralDate: { ...Typography.small, color: colors.textTertiary, marginTop: 2 },
  referralRight: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  referralSales: { ...Typography.captionMedium, color: colors.textSecondary },
  referralEarnings: { ...Typography.bodySemiBold, color: colors.success, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginHorizontal: Spacing.sm },
});
