import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/hooks/useRole';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { UserRole } from '@/types';

export default function RoleSelectScreen() {
  const { selectRole } = useRole();

  const roles: { value: UserRole; title: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    {
      value: 'CLIENT',
      title: "I'm a Client",
      description: 'Browse properties, apply for purchases, and make payments',
      icon: 'person-outline',
    },
    {
      value: 'REALTOR',
      title: "I'm a Realtor",
      description: 'Manage sales, earn commissions, and track referrals',
      icon: 'business-outline',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Brand */}
        <View style={styles.branding}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={40} color={Colors.white} />
          </View>
          <Text style={styles.brandName}>4Zee Properties</Text>
          <Text style={styles.tagline}>Your gateway to smart property investment</Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <Text style={styles.sectionTitle}>How would you like to use the app?</Text>

          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={styles.roleCard}
              onPress={() => selectRole(role.value)}
              activeOpacity={0.7}
            >
              <View style={styles.roleIcon}>
                <Ionicons name={role.icon} size={28} color={Colors.primary} />
              </View>
              <View style={styles.roleText}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: 'center',
  },
  branding: {
    alignItems: 'center',
    marginBottom: Spacing.section,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  brandName: {
    ...Typography.h1,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  roleSection: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  roleText: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
  },
  roleDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
