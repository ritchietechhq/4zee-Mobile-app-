import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface MoreItem {
  title: string;
  icon: string;
  color: string;
  bg: string;
  route: string;
}

export default function MoreHub() {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { logout } = useAuthStore();

  const sections: { title: string; items: MoreItem[] }[] = [
    {
      title: 'Analytics & Reports',
      items: [
        { title: 'Analytics Dashboard', icon: 'bar-chart-outline', color: colors.primary, bg: colors.primaryLight, route: '/(admin)/analytics' },
        { title: 'Charts & Analytics', icon: 'analytics-outline', color: colors.sky, bg: colors.skyLight, route: '/(admin)/analytics-charts' },
        { title: 'Top Realtors', icon: 'podium-outline', color: colors.warning, bg: colors.warningLight, route: '/(admin)/top-realtors' },
        { title: 'Reports & Exports', icon: 'document-attach-outline', color: colors.teal, bg: colors.tealLight, route: '/(admin)/reports' },
      ],
    },
    {
      title: 'Support & Communication',
      items: [
        { title: 'Support Tickets', icon: 'chatbubbles-outline', color: colors.warning, bg: colors.warningLight, route: '/(admin)/support-tickets' },
        { title: 'Referrals', icon: 'link-outline', color: colors.indigo, bg: colors.indigoLight, route: '/(admin)/referrals' },
      ],
    },
    {
      title: 'Payments & Notifications',
      items: [
        { title: 'Payments', icon: 'card-outline', color: colors.success, bg: colors.successLight, route: '/(admin)/payments' },
        { title: 'Broadcast Notification', icon: 'megaphone-outline', color: colors.error, bg: colors.errorLight, route: '/(admin)/broadcast' },
      ],
    },
    {
      title: 'System',
      items: [
        { title: 'Settings', icon: 'settings-outline', color: colors.slate, bg: colors.slateLight, route: '/(admin)/settings' },
        { title: 'Activity Logs', icon: 'list-outline', color: colors.purple, bg: colors.purpleLight, route: '/(admin)/activity-logs' },
        { title: 'Documents', icon: 'folder-open-outline', color: colors.orange, bg: colors.orangeLight, route: '/(admin)/documents' },
      ],
    },
    {
      title: 'User Management',
      items: [
        { title: 'All Users', icon: 'people-outline', color: colors.error, bg: colors.errorLight, route: '/(admin)/sa-users' },
        { title: 'Admin Accounts', icon: 'shield-outline', color: colors.warning, bg: colors.warningLight, route: '/(admin)/sa-admins' },
        { title: 'System Statistics', icon: 'stats-chart-outline', color: colors.primary, bg: colors.primaryLight, route: '/(admin)/sa-stats' },
        { title: 'All Realtors', icon: 'briefcase-outline', color: colors.teal, bg: colors.tealLight, route: '/(admin)/sa-realtors' },
        { title: 'All Clients', icon: 'person-outline', color: colors.indigo, bg: colors.indigoLight, route: '/(admin)/sa-clients' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headerTitle}>More</Text>
        <Text style={styles.headerSubtitle}>Settings, reports & system tools</Text>

        {sections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={styles.navRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.navIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.navTitle}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => logout()}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: { padding: Spacing.xl, paddingBottom: 40 },
    headerTitle: { ...Typography.h2, color: colors.textPrimary },
    headerSubtitle: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: 4,
    },
    sectionTitle: {
      ...Typography.captionMedium,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginTop: Spacing.xxl,
      marginBottom: Spacing.md,
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.sm,
      ...Shadows.sm,
    },
    navIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      ...Typography.bodyMedium,
      color: colors.textPrimary,
      flex: 1,
      marginLeft: Spacing.lg,
    },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.xxxxl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.error,
    },
    logoutText: {
      ...Typography.bodyMedium,
    },
  });
