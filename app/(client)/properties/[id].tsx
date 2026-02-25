// ============================================================
// Property Detail Screen — Client (Enhanced + Dark Mode)
// Full gallery, installment plan, contact realtor, apply/pay
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { usePropertyStore } from '@/store/property.store';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';         // ← NEW
import { applicationService } from '@/services/application.service';
import { paymentService } from '@/services/payment.service';
import { messagingService } from '@/services/messaging.service';
import { paymentPlanService, type PaymentPlanTemplate } from '@/services/paymentPlan.service';
import favoritesService from '@/services/favorites.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FullScreenGallery } from '@/components/property/FullScreenGallery';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Property, Application } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Dark/Light token maps ────────────────────────────────────────────────────
const darkTokens = {
  background:       '#16161E',   // lifted from near-black → soft dark navy
  surface:          '#1E1E2A',   // card/section backgrounds
  surfaceElevated:  '#26263A',   // modals, raised cards
  white:            '#1E1E2A',   // bottom bar / sheet background in dark
  textPrimary:      '#EEEEF5',   // main readable text
  textSecondary:    '#A8A8C0',   // supporting text
  textMuted:        '#6A6A88',   // labels, hints
  borderLight:      '#2E2E42',   // dividers, card borders
  primaryLight:     '#1E2E52',   // icon backgrounds, tinted surfaces
  warningLight:     '#2E2416',   // warning badge bg
  successLight:     '#162A1E',   // success badge bg
  errorLight:       '#2A1418',   // error badge bg
  overlayDark:      'rgba(0,0,0,0.65)',
};

const lightTokens = {
  background:       Colors.background,
  surface:          Colors.surface,
  surfaceElevated:  Colors.white,
  white:            Colors.white,
  textPrimary:      Colors.textPrimary,
  textSecondary:    Colors.textSecondary,
  textMuted:        Colors.textMuted,
  borderLight:      Colors.borderLight,
  primaryLight:     Colors.primaryLight,
  warningLight:     Colors.warningLight,
  successLight:     Colors.successLight,
  errorLight:       Colors.errorLight,
  overlayDark:      'rgba(0,0,0,0.5)',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { selectedProperty: property, isLoadingDetail, fetchPropertyById, clearSelectedProperty } = usePropertyStore();
  const { user } = useAuthStore();
  const { isDark } = useThemeStore();                        // ← NEW
  const T = isDark ? darkTokens : lightTokens;              // ← theme tokens shorthand
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Gallery modal
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  // Application state
  const [myApplication, setMyApplication] = useState<Application | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoadingApplication, setIsLoadingApplication] = useState(false);
  
  // Payment WebView
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  
  // Contact sheet
  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  
  // Save/favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  // Installment enrollment state
  const [isRequestingInstallment, setIsRequestingInstallment] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyById(id);
      checkExistingApplication();
      checkFavoriteStatus();
    }
    return () => clearSelectedProperty();
  }, [id]);

  const checkFavoriteStatus = async () => {
    if (!id) return;
    try {
      const status = await favoritesService.check(id);
      setIsFavorite(status);
    } catch {
      // Silently fail — not logged in or API error
    }
  };

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite || !id) return;
    setIsTogglingFavorite(true);
    const optimistic = !isFavorite;
    setIsFavorite(optimistic); // Optimistic update
    try {
      const result = await favoritesService.toggle(id);
      setIsFavorite(result.isFavorite); // Sync with server truth
    } catch {
      setIsFavorite(!optimistic); // Revert on error
      Alert.alert('Error', 'Failed to update favourite');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleRequestInstallment = async (templateId: string) => {
    if (!myApplication || myApplication.status !== 'APPROVED') {
      Alert.alert('Error', 'You need an approved application to request an installment plan.');
      return;
    }
    setIsRequestingInstallment(true);
    try {
      await paymentPlanService.enroll({
        applicationId: myApplication.id,
        templateId,
      });
      setHasEnrollment(true);
      Alert.alert(
        'Request Submitted!',
        'Your installment plan request has been sent to the realtor for approval. You will be notified once it is reviewed.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit installment request. Please try again.');
    } finally {
      setIsRequestingInstallment(false);
    }
  };

  useEffect(() => {
    if (property) {
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
    }
  }, [property]);

  const checkExistingApplication = async () => {
    if (!id) return;
    setIsLoadingApplication(true);
    try {
      const result = await applicationService.getMyApplications();
      const existing = result.items.find((app) => app.propertyId === id);
      if (existing) setMyApplication(existing);
    } catch {
      // Ignore — user just hasn't applied
    } finally {
      setIsLoadingApplication(false);
    }
  };

  const handleApply = async () => {
    if (!property) return;
    Alert.alert(
      'Apply for Property',
      `Would you like to submit an application for "${property.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            setIsApplying(true);
            try {
              const application = await applicationService.create({ propertyId: property.id });
              setMyApplication(application);
              Alert.alert('Success', 'Your application has been submitted! The realtor will review it shortly.');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to submit application. Please try again.');
            } finally {
              setIsApplying(false);
            }
          },
        },
      ]
    );
  };

  const handlePayment = async () => {
    if (!myApplication) return;
    setIsInitiatingPayment(true);
    try {
      const response = await paymentService.initiate(myApplication.id);
      setPaymentReference(response.reference);
      setPaymentUrl(response.authorizationUrl);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  const handleWebViewNavigationChange = async (navState: { url: string }) => {
    const url = navState.url;
    if (url.includes('callback') || url.includes('trxref') || url.includes('reference')) {
      setPaymentUrl(null);
      if (paymentReference) {
        setIsPollingPayment(true);
        try {
          const status = await paymentService.pollStatus(paymentReference);
          if (status.status === 'SUCCESS') {
            Alert.alert('Payment Successful! 🎉', 'Your payment has been processed. Thank you!');
            checkExistingApplication();
          } else {
            Alert.alert('Payment Failed', status.failureReason || 'Payment was not completed. Please try again.');
          }
        } catch {
          Alert.alert('Error', 'Could not verify payment status. Please contact support.');
        } finally {
          setIsPollingPayment(false);
          setPaymentReference(null);
        }
      }
    }
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({ 
        message: `Check out "${property.title}" on 4Zee Properties — ${formatCurrency(property.price)}\n\nLocation: ${property.address}, ${property.city}`,
        title: property.title,
      });
    } catch { /* noop */ }
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  const handleCall = () => {
    const phone =
      property?.realtorContact?.phone ||
      property?.realtor?.user?.phone ||
      myApplication?.realtor?.user?.phone;
    if (!phone) {
      Alert.alert('Phone Unavailable', "The realtor's phone number is not available. Try sending a message instead.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
    setContactSheetVisible(false);
  };

  const handleWhatsApp = () => {
    const whatsappNum =
      property?.realtorContact?.whatsapp ||
      property?.realtorContact?.phone ||
      property?.realtor?.user?.phone ||
      myApplication?.realtor?.user?.phone;
    if (!whatsappNum) {
      Alert.alert('Phone Unavailable', "The realtor's phone number is not available. Try sending a message instead.");
      return;
    }
    const cleanPhone = whatsappNum.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Hi, I'm interested in the property: ${property?.title}`);
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${message}`);
    setContactSheetVisible(false);
  };

  const handleStartChat = async () => {
    if (!property) return;
    setIsStartingChat(true);
    const propertyImage = property.images?.[0] || '';
    const propertyPrice = property.price ? `${property.price}` : '';
    const propertyLocation = property.location || '';
    try {
      const existing = await messagingService.checkPropertyConversation(property.id);
      if (existing.exists && existing.conversationId) {
        setContactSheetVisible(false);
        const realtorName = property.realtorContact?.name 
          || (property.realtor?.user 
            ? `${property.realtor.user.firstName} ${property.realtor.user.lastName}`.trim()
            : 'Realtor');
        router.push({
          pathname: '/(client)/messages/[id]' as any,
          params: { id: existing.conversationId, name: realtorName, propertyTitle: property.title, propertyId: property.id, propertyImage, propertyPrice, propertyLocation },
        });
        return;
      }
      const result = await messagingService.createPropertyInquiry(
        property.id,
        `Hi, I'm interested in "${property.title}". Is it still available?`,
      );
      setContactSheetVisible(false);
      const participantFirst = result.conversation.participant?.firstName ?? '';
      const participantLast = result.conversation.participant?.lastName ?? '';
      const chatName = `${participantFirst} ${participantLast}`.trim() || 'Realtor';
      router.push({
        pathname: '/(client)/messages/[id]' as any,
        params: { id: result.conversation.id, name: chatName, propertyTitle: property.title, propertyId: property.id, propertyImage, propertyPrice, propertyLocation },
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not start conversation. Please try again.');
    } finally {
      setIsStartingChat(false);
    }
  };

  // ─── Loading State ───
  if (isLoadingDetail || !property) {
    return (
      <View style={[styles.loaderWrap, { paddingTop: insets.top, backgroundColor: T.background }]}>
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loaderText, { color: T.textMuted }]}>Loading property...</Text>
        </View>
      </View>
    );
  }

  const availabilityVariant =
    property.availability === 'AVAILABLE' ? 'success'
    : property.availability === 'RESERVED' ? 'warning' : 'error';

  const renderCTAButton = () => {
    if (isLoadingApplication) {
      return <Button title="Loading..." variant="primary" size="lg" style={styles.ctaButton} disabled />;
    }
    if (!myApplication) {
      return (
        <Button
          title={isApplying ? 'Submitting...' : 'Apply Now'}
          onPress={handleApply}
          variant="primary"
          size="lg"
          style={styles.ctaButton}
          disabled={isApplying || property.availability !== 'AVAILABLE'}
          icon={<Ionicons name="document-text-outline" size={18} color={Colors.white} />}
        />
      );
    }
    switch (myApplication.status) {
      case 'PENDING':
        return (
          <Button title="Application Pending" variant="secondary" size="lg" style={styles.ctaButton} disabled
            icon={<Ionicons name="time-outline" size={18} color={Colors.textMuted} />} />
        );
      case 'APPROVED':
        if (myApplication.paymentStatus === 'PAID') {
          return (
            <Button title="Paid ✓" variant="primary" size="lg" style={[styles.ctaButton, { backgroundColor: Colors.success }]} disabled
              icon={<Ionicons name="checkmark-circle" size={18} color={Colors.white} />} />
          );
        }
        return (
          <Button title={isInitiatingPayment ? 'Processing...' : 'Make Payment'} onPress={handlePayment}
            variant="primary" size="lg" style={styles.ctaButton} disabled={isInitiatingPayment}
            icon={<Ionicons name="card-outline" size={18} color={Colors.white} />} />
        );
      case 'REJECTED':
        return (
          <Button title="Application Rejected" variant="danger" size="lg" style={styles.ctaButton} disabled
            icon={<Ionicons name="close-circle" size={18} color={Colors.white} />} />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.background }]}>
      {/* ── Floating header ── */}
      <View style={[styles.floatingHeader, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          style={[styles.floatingBtn, { backgroundColor: isDark ? 'rgba(38,38,58,0.95)' : 'rgba(255,255,255,0.95)', borderColor: T.borderLight }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={T.textPrimary} />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity
            style={[
              styles.floatingBtn, 
              { backgroundColor: isDark ? 'rgba(38,38,58,0.95)' : 'rgba(255,255,255,0.95)', borderColor: T.borderLight },
              isFavorite && { backgroundColor: Colors.errorLight }
            ]}
            onPress={handleToggleFavorite}
            disabled={isTogglingFavorite}
          >
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingBtn, { backgroundColor: isDark ? 'rgba(38,38,58,0.95)' : 'rgba(255,255,255,0.95)', borderColor: T.borderLight }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={22} color={T.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Gallery ── */}
        <ImageGalleryPreview images={property.images} onImagePress={openGallery} isDark={isDark} />

        <Animated.View style={[
          styles.content,
          {
            backgroundColor: T.background,
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          },
        ]}>
          {/* ── Price + Badge ── */}
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.price, { color: Colors.primary }]}>{formatCurrency(property.price)}</Text>
              <Text style={[styles.priceLabel, { color: T.textMuted }]}>Total price</Text>
            </View>
            <Badge label={property.availability} variant={availabilityVariant} size="md" />
          </View>

          {/* ── Application Status Badge ── */}
          {myApplication && (
            <View style={styles.applicationStatusRow}>
              <View style={[
                styles.applicationBadge,
                { backgroundColor: T.warningLight },
                myApplication.status === 'APPROVED' && { backgroundColor: T.successLight },
                myApplication.status === 'REJECTED' && { backgroundColor: T.errorLight },
              ]}>
                <Ionicons 
                  name={
                    myApplication.status === 'APPROVED' ? 'checkmark-circle' :
                    myApplication.status === 'REJECTED' ? 'close-circle' : 'time'
                  } 
                  size={16} 
                  color={
                    myApplication.status === 'APPROVED' ? Colors.success :
                    myApplication.status === 'REJECTED' ? Colors.error : Colors.warning
                  } 
                />
                <Text style={[
                  styles.applicationBadgeText,
                  { color: Colors.warning },
                  myApplication.status === 'APPROVED' && { color: Colors.success },
                  myApplication.status === 'REJECTED' && { color: Colors.error },
                ]}>
                  {myApplication.status === 'APPROVED' ? 'Your application was approved!' :
                   myApplication.status === 'REJECTED' ? 'Application rejected' :
                   'Application under review'}
                </Text>
              </View>
            </View>
          )}

          {/* ── Title & Location ── */}
          <Text style={[styles.title, { color: T.textPrimary }]}>{property.title}</Text>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
            <View style={[styles.locationIcon, { backgroundColor: T.primaryLight }]}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <Text style={[styles.locationText, { color: T.textSecondary }]}>{property.address}, {property.city}, {property.state}</Text>
          </TouchableOpacity>

          {/* ── Features Grid ── */}
          <View style={styles.featuresGrid}>
            {property.bedrooms != null && <FeatureItem icon="bed-outline" label="Bedrooms" value={String(property.bedrooms)} isDark={isDark} T={T} />}
            {property.bathrooms != null && <FeatureItem icon="water-outline" label="Bathrooms" value={String(property.bathrooms)} isDark={isDark} T={T} />}
            {property.toilets != null && <FeatureItem icon="flask-outline" label="Toilets" value={String(property.toilets)} isDark={isDark} T={T} />}
            {property.area != null && <FeatureItem icon="resize-outline" label="Area" value={`${property.area} sqm`} isDark={isDark} T={T} />}
            <FeatureItem icon="pricetag-outline" label="Type" value={property.type} isDark={isDark} T={T} />
            <FeatureItem icon="eye-outline" label="Views" value={String(property.viewCount)} isDark={isDark} T={T} />
          </View>

          {/* ── Description ── */}
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: T.textSecondary }]}>{property.description}</Text>
          </View>

          {/* ── Amenities ── */}
          {property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={[styles.amenityChip, { backgroundColor: T.successLight }]}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={[styles.amenityText, { color: Colors.success }]}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Installment Plan ── */}
          <InstallmentPlanCard 
            property={property} 
            application={myApplication}
            onApply={handleApply}
            isApplying={isApplying}
            onRequestInstallment={handleRequestInstallment}
            isRequestingInstallment={isRequestingInstallment}
            hasEnrollment={hasEnrollment}
            isDark={isDark}
            T={T}
          />

          {/* ── Realtor Info ── */}
          {(property.realtorContact || property.realtor || myApplication?.realtor) && (() => {
            const realtorContact = property.realtorContact;
            const legacyRealtor = property.realtor || myApplication?.realtor;
            const displayName = realtorContact?.name 
              || (legacyRealtor?.user ? `${legacyRealtor.user.firstName} ${legacyRealtor.user.lastName}`.trim() : 'Realtor');
            const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'R';
            const agency = realtorContact?.agency;
            return (
              <Card style={[styles.realtorCard, { backgroundColor: T.surfaceElevated, borderColor: T.borderLight }]}>
                <Text style={[styles.sectionTitle, { color: T.textPrimary }]}>Listed By</Text>
                <View style={styles.realtorInfo}>
                  <View style={[styles.realtorAvatar, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.realtorInitials}>{initials}</Text>
                  </View>
                  <View style={styles.realtorDetails}>
                    <Text style={[styles.realtorName, { color: T.textPrimary }]}>{displayName}</Text>
                    <Text style={[styles.realtorLabel, { color: T.textMuted }]}>{agency || 'Licensed Realtor'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.realtorChatBtn, { backgroundColor: T.primaryLight }]}
                    onPress={() => setContactSheetVisible(true)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })()}

          <View style={{ height: Spacing.xxxxl + 100 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[
        styles.bottomCTA,
        { 
          paddingBottom: insets.bottom + Spacing.md,
          backgroundColor: T.white,
          borderTopColor: T.borderLight,
        },
      ]}>
        <TouchableOpacity 
          style={[styles.callBtn, { borderColor: Colors.primary, backgroundColor: T.primaryLight }]} 
          activeOpacity={0.7}
          onPress={() => setContactSheetVisible(true)}
        >
          <Ionicons name="call-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
        {renderCTAButton()}
      </View>

      {/* ── Full Screen Gallery Modal ── */}
      <FullScreenGallery
        visible={galleryVisible}
        images={property.images}
        initialIndex={galleryIndex}
        onClose={() => setGalleryVisible(false)}
      />

      {/* ── Contact Sheet Modal ── */}
      <ContactSheetModal
        visible={contactSheetVisible}
        onClose={() => setContactSheetVisible(false)}
        onCall={handleCall}
        onWhatsApp={handleWhatsApp}
        onChat={handleStartChat}
        isStartingChat={isStartingChat}
        realtorName={property?.realtorContact?.name || property?.realtor?.user?.firstName || myApplication?.realtor?.user?.firstName || 'Realtor'}
        isDark={isDark}
        T={T}
      />

      {/* ── Payment WebView Modal ── */}
      <Modal visible={!!paymentUrl} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.webViewContainer, { paddingTop: insets.top, backgroundColor: T.white }]}>
          <View style={[styles.webViewHeader, { borderBottomColor: T.borderLight }]}>
            <TouchableOpacity 
              onPress={() => { setPaymentUrl(null); setPaymentReference(null); }}
              style={styles.webViewClose}
            >
              <Ionicons name="close" size={24} color={T.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.webViewTitle, { color: T.textPrimary }]}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
              style={styles.webView}
              startInLoadingState
              renderLoading={() => (
                <View style={[styles.webViewLoading, { backgroundColor: T.white }]}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ── Payment Polling Overlay ── */}
      {isPollingPayment && (
        <View style={styles.pollingOverlay}>
          <View style={[styles.pollingContent, { backgroundColor: T.surfaceElevated }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.pollingText, { color: T.textPrimary }]}>Verifying payment...</Text>
            <Text style={[styles.pollingSubtext, { color: T.textMuted }]}>Please wait</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** Gallery Preview */
function ImageGalleryPreview({ 
  images, 
  onImagePress,
  isDark,
}: { 
  images: string[]; 
  onImagePress: (index: number) => void;
  isDark: boolean;
}) {
  const T = isDark ? darkTokens : lightTokens;

  if (!images || images.length === 0) {
    return (
      <View style={[styles.galleryPlaceholder, { backgroundColor: T.surface }]}>
        <Ionicons name="image-outline" size={48} color={T.textMuted} />
        <Text style={[styles.galleryPlaceholderText, { color: T.textMuted }]}>No images available</Text>
      </View>
    );
  }

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);
  const remainingCount = images.length - 5;

  return (
    <View style={[styles.galleryPreview, { backgroundColor: T.surface }]}>
      <TouchableOpacity activeOpacity={0.95} onPress={() => onImagePress(0)} style={styles.galleryMain}>
        <Image
          source={{ uri: mainImage }}
          style={styles.galleryMainImage}
          contentFit="cover"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          transition={250}
          cachePolicy="memory-disk"
        />
        <View style={styles.galleryCounter}>
          <Ionicons name="images-outline" size={14} color="#fff" />
          <Text style={styles.galleryCounterText}>{images.length} Photos</Text>
        </View>
        <TouchableOpacity style={styles.galleryExpandBtn} onPress={() => onImagePress(0)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </TouchableOpacity>
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.15)']} style={styles.galleryGradient} pointerEvents="none" />
      </TouchableOpacity>

      {thumbnails.length > 0 && (
        <View style={[styles.galleryThumbnails, { backgroundColor: T.surface }]}>
          {thumbnails.map((img, idx) => (
            <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => onImagePress(idx + 1)} style={styles.galleryThumbnail}>
              <Image source={{ uri: img }} style={styles.galleryThumbnailImage} contentFit="cover" transition={200} cachePolicy="memory-disk" />
              {idx === thumbnails.length - 1 && remainingCount > 0 && (
                <View style={styles.galleryMoreOverlay}>
                  <Text style={styles.galleryMoreText}>+{remainingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/** Contact Sheet Modal */
function ContactSheetModal({
  visible, onClose, onCall, onWhatsApp, onChat, isStartingChat, realtorName, isDark, T,
}: {
  visible: boolean;
  onClose: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onChat: () => void;
  isStartingChat: boolean;
  realtorName: string;
  isDark: boolean;
  T: typeof darkTokens;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity style={[styles.contactSheetOverlay, { backgroundColor: T.overlayDark }]} activeOpacity={1} onPress={onClose}>
        <View style={[styles.contactSheet, { paddingBottom: insets.bottom + Spacing.lg, backgroundColor: T.white }]}>
          <View style={[styles.contactSheetHandle, { backgroundColor: T.borderLight }]} />
          <Text style={[styles.contactSheetTitle, { color: T.textPrimary }]}>Contact {realtorName}</Text>
          <Text style={[styles.contactSheetSubtitle, { color: T.textMuted }]}>Choose how you'd like to get in touch</Text>
          
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption} onPress={onCall}>
              <View style={[styles.contactOptionIcon, { backgroundColor: T.primaryLight }]}>
                <Ionicons name="call" size={24} color={Colors.primary} />
              </View>
              <Text style={[styles.contactOptionLabel, { color: T.textSecondary }]}>Phone Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption} onPress={onWhatsApp}>
              <View style={[styles.contactOptionIcon, { backgroundColor: isDark ? '#1A2E1A' : '#dcf8c6' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={[styles.contactOptionLabel, { color: T.textSecondary }]}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactOption} onPress={onChat} disabled={isStartingChat}>
              <View style={[styles.contactOptionIcon, { backgroundColor: T.primaryLight }]}>
                {isStartingChat ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
                )}
              </View>
              <Text style={[styles.contactOptionLabel, { color: T.textSecondary }]}>In-App Chat</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.contactSheetCancel, { backgroundColor: T.surface }]} onPress={onClose}>
            <Text style={[styles.contactSheetCancelText, { color: T.textMuted }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/** Feature Item */
function FeatureItem({ 
  icon, label, value, isDark, T 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  isDark: boolean;
  T: typeof darkTokens;
}) {
  return (
    <View style={[styles.featureItem, { backgroundColor: T.surface, borderColor: T.borderLight }]}>
      <View style={[styles.featureIcon, { backgroundColor: T.primaryLight }]}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={[styles.featureValue, { color: T.textPrimary }]}>{value}</Text>
      <Text style={[styles.featureLabel, { color: T.textMuted }]}>{label}</Text>
    </View>
  );
}

/** Installment Plan Card */
function InstallmentPlanCard({ 
  property, application, onApply, isApplying, onRequestInstallment, isRequestingInstallment, hasEnrollment, isDark, T,
}: { 
  property: Property;
  application: Application | null;
  onApply: () => void;
  isApplying: boolean;
  onRequestInstallment: (templateId: string) => void;
  isRequestingInstallment: boolean;
  hasEnrollment: boolean;
  isDark: boolean;
  T: typeof darkTokens;
}) {
  const [templates, setTemplates] = useState<PaymentPlanTemplate[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    let mounted = true;
    paymentPlanService.getTemplates().then((t) => {
      if (mounted) {
        const active = t.filter((tp) => tp.isActive);
        setTemplates(active.length ? active : t);
      }
    }).catch(() => {}).finally(() => { if (mounted) setLoadingTemplates(false); });
    return () => { mounted = false; };
  }, []);

  const totalPrice = property.price;
  const template = templates[selectedIdx];
  const downPct = template?.downPaymentPct ?? 30;
  const durationMonths = template?.durationMonths ?? 12;
  const interestRate = template?.interestRate ?? 0;
  const downPayment = Math.round(totalPrice * (downPct / 100));
  const financed = totalPrice - downPayment;
  const totalWithInterest = financed * (1 + interestRate / 100);
  const monthlyPayment = Math.round(totalWithInterest / durationMonths);
  const paidAmount = application?.paymentStatus === 'PAID' ? totalPrice : 0;
  const progress = paidAmount / totalPrice;

  return (
    <Card style={[styles.installmentCard, { borderColor: T.borderLight }]} variant="outlined">
      <LinearGradient 
        colors={isDark ? ['rgba(30,46,82,0.5)', 'rgba(30,46,82,0.15)'] : [Colors.primaryLight + '60', Colors.primaryLight + '20']} 
        style={styles.installmentGradient} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
      />
      
      <View style={styles.installmentHeader}>
        <View style={[styles.installmentBadge, { backgroundColor: T.primaryLight }]}>
          <Ionicons name="card-outline" size={16} color={Colors.primary} />
          <Text style={[styles.installmentBadgeText, { color: Colors.primary }]}>Flexible Payment Options</Text>
        </View>
      </View>

      <Text style={[styles.installmentDesc, { color: T.textSecondary }]}>
        This property supports multiple payment options including full payment and installment plans.
      </Text>

      {/* Plan selector chips */}
      {templates.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md, marginHorizontal: -Spacing.xs }}>
          {templates.map((tp, idx) => (
            <TouchableOpacity
              key={tp.id}
              onPress={() => setSelectedIdx(idx)}
              style={{
                paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
                borderRadius: BorderRadius.full, marginRight: Spacing.sm,
                backgroundColor: idx === selectedIdx ? Colors.primary : T.surface,
                borderWidth: 1, borderColor: idx === selectedIdx ? Colors.primary : T.borderLight,
              }}
            >
              <Text style={{
                ...Typography.caption, fontWeight: '600',
                color: idx === selectedIdx ? Colors.white : T.textSecondary,
              }}>
                {tp.name || `${tp.durationMonths}mo plan`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Payment Breakdown */}
      <View style={[styles.installmentBreakdown, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.80)' }]}>
        <View style={styles.installmentRow}>
          <Text style={[styles.installmentLabel, { color: T.textMuted }]}>Total Price</Text>
          <Text style={[styles.installmentValue, { color: T.textPrimary }]}>{formatCurrency(totalPrice)}</Text>
        </View>
        <View style={[styles.installmentDivider, { backgroundColor: T.borderLight }]} />
        <View style={styles.installmentRow}>
          <Text style={[styles.installmentLabel, { color: T.textMuted }]}>Down Payment ({downPct}%)</Text>
          <Text style={[styles.installmentValue, { color: T.textPrimary }]}>{formatCurrency(downPayment)}</Text>
        </View>
        <View style={styles.installmentRow}>
          <Text style={[styles.installmentLabel, { color: T.textMuted }]}>Monthly ({durationMonths} months{interestRate > 0 ? ` @ ${interestRate}%` : ''})</Text>
          <Text style={[styles.installmentValue, { color: T.textPrimary }]}>{formatCurrency(monthlyPayment)}</Text>
        </View>
        {loadingTemplates && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />}
      </View>

      {/* Progress Bar */}
      {application && (
        <>
          <ProgressBar progress={progress * 100} label="Payment Progress" showPercentage style={styles.progressBar} />
          {application.paymentStatus === 'PAID' && (
            <View style={[styles.paidBadge, { backgroundColor: T.successLight }]}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={[styles.paidBadgeText, { color: Colors.success }]}>Fully Paid</Text>
            </View>
          )}
        </>
      )}

      {/* CTA - Show different buttons based on application state */}
      {!application && (
        <Button 
          title={isApplying ? 'Applying...' : 'Apply to View Full Plan'}
          variant="outline" size="md" onPress={onApply}
          disabled={isApplying || property.availability !== 'AVAILABLE'}
          style={styles.installmentButton} 
          icon={<Ionicons name="arrow-forward" size={16} color={Colors.primary} />} 
          iconPosition="right" 
        />
      )}

      {/* Show Request Installment button when application is approved but unpaid */}
      {application && application.status === 'APPROVED' && application.paymentStatus !== 'PAID' && !hasEnrollment && template && (
        <Button 
          title={isRequestingInstallment ? 'Requesting...' : 'Request Installment Plan'}
          variant="primary" size="md" 
          onPress={() => onRequestInstallment(template.id)}
          disabled={isRequestingInstallment || loadingTemplates}
          style={styles.installmentButton} 
          icon={<Ionicons name="calendar-outline" size={16} color={Colors.white} />} 
        />
      )}

      {/* Show pending message if enrollment was requested */}
      {hasEnrollment && (
        <View style={[styles.enrollmentPending, { backgroundColor: T.warningLight }]}>
          <Ionicons name="time-outline" size={18} color={Colors.warning} />
          <Text style={[styles.enrollmentPendingText, { color: Colors.warning }]}>
            Installment request pending realtor approval
          </Text>
        </View>
      )}
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────
   STYLES  (static/layout only — colours applied inline above)
───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderContent: { alignItems: 'center', gap: Spacing.md },
  loaderText: { ...Typography.caption },

  floatingHeader: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', ...Shadows.md, borderWidth: 1 },
  floatingRight: { flexDirection: 'row', gap: Spacing.sm },

  // Gallery
  galleryPreview: {},
  galleryMain: { height: 280, position: 'relative' },
  galleryMainImage: { width: '100%', height: '100%' },
  galleryCounter: { position: 'absolute', top: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  galleryCounterText: { ...Typography.caption, color: '#fff', fontWeight: '600' },
  galleryExpandBtn: { position: 'absolute', bottom: Spacing.md, right: Spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  galleryGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 60 },
  galleryThumbnails: { flexDirection: 'row', height: 64, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs, gap: Spacing.xs },
  galleryThumbnail: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  galleryThumbnailImage: { width: '100%', height: '100%' },
  galleryMoreOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  galleryMoreText: { ...Typography.h4, color: '#fff' },
  galleryPlaceholder: { height: 280, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  galleryPlaceholderText: { ...Typography.bodyMedium },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, marginTop: -20 },

  priceRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  price: { ...Typography.h2 },
  priceLabel: { ...Typography.small, marginTop: 2 },

  applicationStatusRow: { marginBottom: Spacing.lg },
  applicationBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: Spacing.xs },
  applicationBadgeText: { ...Typography.captionMedium },

  title: { ...Typography.h3, marginBottom: Spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl, gap: Spacing.sm },
  locationIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  locationText: { ...Typography.caption, flex: 1 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xxl },
  featureItem: { width: '31%', borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  featureValue: { ...Typography.bodySemiBold },
  featureLabel: { ...Typography.small, marginTop: 2 },

  descriptionSection: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.md },
  description: { ...Typography.body, lineHeight: 24 },

  amenitiesSection: { marginBottom: Spacing.xxl },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, gap: Spacing.xs },
  amenityText: { ...Typography.caption, fontWeight: '500' },

  // Installment Card
  installmentCard: { marginBottom: Spacing.xxl, position: 'relative', overflow: 'hidden' },
  installmentGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BorderRadius.lg },
  installmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  installmentBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, gap: Spacing.xs },
  installmentBadgeText: { ...Typography.captionMedium },
  installmentDesc: { ...Typography.caption, marginBottom: Spacing.lg, lineHeight: 20 },
  installmentBreakdown: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  installmentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  installmentLabel: { ...Typography.caption },
  installmentValue: { ...Typography.captionMedium },
  installmentDivider: { height: 1, marginVertical: Spacing.sm },
  progressBar: { marginBottom: Spacing.md },
  installmentButton: {},
  paidBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  paidBadgeText: { ...Typography.captionMedium },

  // Realtor Card
  realtorCard: { marginBottom: Spacing.xxl },
  realtorInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  realtorAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  realtorInitials: { ...Typography.bodyMedium, color: Colors.white, fontWeight: '700' },
  realtorDetails: { flex: 1 },
  realtorName: { ...Typography.bodyMedium },
  realtorLabel: { ...Typography.small },
  realtorChatBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  // Bottom CTA
  bottomCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'center', ...Shadows.lg, borderTopWidth: 1 },
  callBtn: { width: 52, height: 52, borderRadius: BorderRadius.xl, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ctaButton: { flex: 1 },

  // Contact Sheet
  contactSheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  contactSheet: { borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  contactSheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  contactSheetTitle: { ...Typography.h4, textAlign: 'center' },
  contactSheetSubtitle: { ...Typography.caption, textAlign: 'center', marginBottom: Spacing.xl },
  contactOptions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  contactOption: { alignItems: 'center', gap: Spacing.sm },
  contactOptionIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  contactOptionLabel: { ...Typography.caption },
  contactSheetCancel: { paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  contactSheetCancelText: { ...Typography.bodyMedium },

  // WebView
  webViewContainer: { flex: 1 },
  webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  webViewClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  webViewTitle: { ...Typography.bodyMedium },
  webView: { flex: 1 },
  webViewLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },

  // Polling Overlay
  pollingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  pollingContent: { borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  pollingText: { ...Typography.bodyMedium },
  pollingSubtext: { ...Typography.caption },

  // Enrollment pending
  enrollmentPending: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
  enrollmentPendingText: { ...Typography.caption, fontWeight: '600', flex: 1 },
});