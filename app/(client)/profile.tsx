import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
  badge?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await logout(); } catch { /* noop */ } } },
    ]);
  };

  const accountItems: MenuItem[] = [
    { icon: 'person-outline', label: 'Edit Profile', subtitle: 'Update your personal info', onPress: () => {}, showChevron: true },
    { icon: 'document-text-outline', label: 'My Applications', subtitle: 'View property applications', onPress: () => {}, showChevron: true, badge: 'New' },
    { icon: 'card-outline', label: 'Payment History', subtitle: 'View past transactions', onPress: () => {}, showChevron: true },
    { icon: 'key-outline', label: 'Change Password', subtitle: 'Update your password', onPress: () => {}, showChevron: true },
  ];

  const supportItems: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help & FAQ', onPress: () => {}, showChevron: true },
    { icon: 'chatbubble-outline', label: 'Contact Support', onPress: () => {}, showChevron: true },
    { icon: 'shield-checkmark-outline', label: 'Privacy Policy', onPress: () => {}, showChevron: true },
    { icon: 'document-outline', label: 'Terms of Service', onPress: () => {}, showChevron: true },
    { icon: 'star-outline', label: 'Rate the App', onPress: () => {}, showChevron: true },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          {/* ── Profile Header ── */}
          <View style={styles.profileHeader}>
            <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.profileBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user?.profilePicture ? (
                  <Image source={{ uri: user.profilePicture }} style={styles.avatarImg} contentFit="cover" transition={200} />
                ) : (
                  <Text style={styles.avatarText}>{user?.firstName?.charAt(0)?.toUpperCase() ?? 'U'}{user?.lastName?.charAt(0)?.toUpperCase() ?? ''}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.7}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.firstName ?? 'User'} {user?.lastName ?? ''}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
            <TouchableOpacity style={styles.editButton} onPress={() => {}} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* ── Account ── */}
          <Text style={styles.sectionTitle}>Account</Text>
          <Card style={styles.menuCard} padding="xs">
            {accountItems.map((item, idx) => (
              <React.Fragment key={item.label}>
                <MenuRow item={item} />
                {idx < accountItems.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </Card>

          {/* ── Notifications ── */}
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card style={styles.menuCard} padding="xs">
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={styles.menuIcon}><Ionicons name="notifications-outline" size={20} color={Colors.primary} /></View>
                <View>
                  <Text style={styles.menuLabel}>Push Notifications</Text>
                  <Text style={styles.switchDesc}>Receive property alerts</Text>
                </View>
              </View>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={pushEnabled ? Colors.primary : Colors.textMuted} />
            </View>
            <View style={styles.separator} />
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <View style={styles.menuIcon}><Ionicons name="mail-outline" size={20} color={Colors.primary} /></View>
                <View>
                  <Text style={styles.menuLabel}>Email Notifications</Text>
                  <Text style={styles.switchDesc}>Weekly digest & updates</Text>
                </View>
              </View>
              <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: Colors.border, true: Colors.primaryLight }} thumbColor={emailEnabled ? Colors.primary : Colors.textMuted} />
            </View>
          </Card>

          {/* ── Support ── */}
          <Text style={styles.sectionTitle}>Support</Text>
          <Card style={styles.menuCard} padding="xs">
            {supportItems.map((item, idx) => (
              <React.Fragment key={item.label}>
                <MenuRow item={item} />
                {idx < supportItems.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            ))}
          </Card>

          {/* ── Sign Out ── */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>4Zee Properties v1.0.0</Text>
          <View style={{ height: Spacing.xxxxl }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={item.onPress} activeOpacity={0.6}>
      <View style={[styles.menuIcon, item.danger && styles.menuIconDanger]}>
        <Ionicons name={item.icon} size={20} color={item.danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <View style={styles.menuLabelRow}>
          <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
          {item.badge && (
            <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{item.badge}</Text></View>
          )}
        </View>
        {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.showChevron && <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxxl },

  profileHeader: { alignItems: 'center', paddingTop: Spacing.xxxxl, paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.xl, position: 'relative', overflow: 'hidden' },
  profileBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, borderBottomLeftRadius: BorderRadius.xxl, borderBottomRightRadius: BorderRadius.xxl },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Colors.white, ...Shadows.lg },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { ...Typography.h2, color: Colors.primary },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  userName: { ...Typography.h3, color: Colors.textPrimary },
  userEmail: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  editButton: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.full, backgroundColor: Colors.primaryLight, gap: Spacing.xs },
  editButtonText: { ...Typography.captionMedium, color: Colors.primary },

  sectionTitle: { ...Typography.captionMedium, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: Spacing.xl, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  menuCard: { marginHorizontal: Spacing.xl },

  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, minHeight: 60 },
  menuIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuIconDanger: { backgroundColor: Colors.errorLight },
  menuContent: { flex: 1 },
  menuLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  menuLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  menuLabelDanger: { color: Colors.error },
  menuSubtitle: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  menuBadge: { backgroundColor: Colors.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full },
  menuBadgeText: { ...Typography.small, color: Colors.white, fontWeight: '600', fontSize: 10 },
  separator: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.lg },

  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, minHeight: 60 },
  switchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  switchDesc: { ...Typography.small, color: Colors.textMuted, marginTop: 1 },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: Spacing.xl, marginTop: Spacing.xxxl, paddingVertical: Spacing.lg, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.error + '40', backgroundColor: Colors.errorLight + '30', gap: Spacing.sm },
  logoutText: { ...Typography.bodySemiBold, color: Colors.error },
  version: { ...Typography.small, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xxl },
});

