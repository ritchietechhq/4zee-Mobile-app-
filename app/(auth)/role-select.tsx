import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRole } from '@/hooks/useRole';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { UserRole } from '@/types';

interface RoleOption {
  value: UserRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  iconBg: string;
}

const roles: RoleOption[] = [
  {
    value: 'CLIENT',
    title: 'I\'m a Client',
    description: 'Browse properties, apply for purchases,\nand make installment payments',
    icon: 'person-outline',
    gradient: ['#1E40AF', '#3B82F6'],
    iconBg: '#DBEAFE',
  },
  {
    value: 'REALTOR',
    title: 'I\'m a Realtor',
    description: 'List & manage properties, earn\ncommissions, and grow your network',
    icon: 'briefcase-outline',
    gradient: ['#059669', '#34D399'],
    iconBg: '#D1FAE5',
  },
];

export default function RoleSelectScreen() {
  const { selectRole } = useRole();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Branding */}
        <View style={styles.branding}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>4Zee Properties</Text>
          <Text style={styles.tagline}>
            Your gateway to smart property investment
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Choose your role</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.value}
              style={styles.roleCard}
              onPress={() => selectRole(role.value)}
              activeOpacity={0.85}
            >
              <View style={styles.cardInner}>
                <View style={[styles.roleIconWrap, { backgroundColor: role.iconBg }]}>
                  <Ionicons
                    name={role.icon}
                    size={28}
                    color={role.gradient[0]}
                  />
                </View>
                <View style={styles.roleTextWrap}>
                  <Text style={styles.roleTitle}>{role.title}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </View>
                <View style={[styles.arrowCircle, { backgroundColor: role.gradient[0] + '12' }]}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={role.gradient[0]}
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          You can always switch roles later in settings
        </Text>
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
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 88,
    height: 88,
    marginBottom: Spacing.lg,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.captionMedium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  cardsContainer: {
    gap: Spacing.lg,
  },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  roleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextWrap: {
    flex: 1,
  },
  roleTitle: {
    ...Typography.bodySemiBold,
    color: Colors.textPrimary,
    fontSize: 17,
    marginBottom: 4,
  },
  roleDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
