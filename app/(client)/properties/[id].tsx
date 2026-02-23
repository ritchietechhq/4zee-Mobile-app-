// ============================================================
// Property Detail Screen — Client (Enhanced)
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
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { usePropertyStore } from '@/store/property.store';
import { useAuthStore } from '@/store/auth.store';
import { applicationService } from '@/services/application.service';
import { paymentService } from '@/services/payment.service';
import { messagingService } from '@/services/messaging.service';
import { paymentPlanService, type PaymentPlanTemplate } from '@/services/paymentPlan.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { FullScreenGallery } from '@/components/property/FullScreenGallery';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Property, Application } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { selectedProperty: property, isLoadingDetail, fetchPropertyById, clearSelectedProperty } = usePropertyStore();
  const { user } = useAuthStore();
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

  useEffect(() => {
    if (id) {
      fetchPropertyById(id);
      checkExistingApplication();
    }
    return () => clearSelectedProperty();
  }, [id]);

  useEffect(() => {
    if (property) {
      Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
    }
  }, [property]);

  /** Check if user already applied for this property */
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

  /** Apply for property */
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

  /** Initiate payment for approved application */
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

  /** Handle WebView navigation - detect payment completion */
  const handleWebViewNavigationChange = async (navState: { url: string }) => {
    const url = navState.url;
    // Paystack callback URLs typically contain 'callback' or 'reference'
    if (url.includes('callback') || url.includes('trxref') || url.includes('reference')) {
      setPaymentUrl(null);
      if (paymentReference) {
        setIsPollingPayment(true);
        try {
          const status = await paymentService.pollStatus(paymentReference);
          if (status.status === 'SUCCESS') {
            Alert.alert('Payment Successful! 🎉', 'Your payment has been processed. Thank you!');
            // Refresh application status
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

  /** Share property */
  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({ 
        message: `Check out "${property.title}" on 4Zee Properties — ${formatCurrency(property.price)}\n\nLocation: ${property.address}, ${property.city}`,
        title: property.title,
      });
    } catch { /* noop */ }
  };

  /** Open gallery at specific index */
  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setGalleryVisible(true);
  };

  /** Contact realtor via phone */
  const handleCall = () => {
    // Use realtorContact (new API) first, then fallback to legacy nested structure
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

  /** Contact realtor via WhatsApp */
  const handleWhatsApp = () => {
    // Prefer whatsapp field, then phone from realtorContact, then legacy
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

  /** Start in-app chat with realtor */
  const handleStartChat = async () => {
    if (!property) return;
    
    setIsStartingChat(true);

    // Gather property context for the chat screen
    const propertyImage = property.images?.[0] || '';
    const propertyPrice = property.price ? `${property.price}` : '';
    const propertyLocation = property.location || '';

    try {
      // First check if we already have a conversation for this property
      const existing = await messagingService.checkPropertyConversation(property.id);
      
      if (existing.exists && existing.conversationId) {
        setContactSheetVisible(false);
        const realtorName = property.realtorContact?.name 
          || (property.realtor?.user 
            ? `${property.realtor.user.firstName} ${property.realtor.user.lastName}`.trim()
            : 'Realtor');
        router.push({
          pathname: '/(client)/messages/[id]' as any,
          params: {
            id: existing.conversationId,
            name: realtorName,
            propertyTitle: property.title,
            propertyId: property.id,
            propertyImage,
            propertyPrice,
            propertyLocation,
          },
        });
        return;
      }

      // Create new inquiry
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
        params: {
          id: result.conversation.id,
          name: chatName,
          propertyTitle: property.title,
          propertyId: property.id,
          propertyImage,
          propertyPrice,
          propertyLocation,
        },
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
      <View style={[styles.loaderWrap, { paddingTop: insets.top }]}>
        <View style={styles.loaderContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading property...</Text>
        </View>
      </View>
    );
  }

  const availabilityVariant =
    property.availability === 'AVAILABLE' ? 'success'
    : property.availability === 'RESERVED' ? 'warning' : 'error';

  // Determine CTA button based on application status
  const renderCTAButton = () => {
    if (isLoadingApplication) {
      return <Button title="Loading..." variant="primary" size="lg" style={styles.ctaButton} disabled />;
    }

    if (!myApplication) {
      // No application yet — show Apply button
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

    // Has application
    switch (myApplication.status) {
      case 'PENDING':
        return (
          <Button
            title="Application Pending"
            variant="secondary"
            size="lg"
            style={styles.ctaButton}
            disabled
            icon={<Ionicons name="time-outline" size={18} color={Colors.textMuted} />}
          />
        );
      
      case 'APPROVED':
        if (myApplication.paymentStatus === 'PAID') {
          return (
            <Button
              title="Paid ✓"
              variant="primary"
              size="lg"
              style={[styles.ctaButton, { backgroundColor: Colors.success }]}
              disabled
              icon={<Ionicons name="checkmark-circle" size={18} color={Colors.white} />}
            />
          );
        }
        return (
          <Button
            title={isInitiatingPayment ? 'Processing...' : 'Make Payment'}
            onPress={handlePayment}
            variant="primary"
            size="lg"
            style={styles.ctaButton}
            disabled={isInitiatingPayment}
            icon={<Ionicons name="card-outline" size={18} color={Colors.white} />}
          />
        );
      
      case 'REJECTED':
        return (
          <Button
            title="Application Rejected"
            variant="danger"
            size="lg"
            style={styles.ctaButton}
            disabled
            icon={<Ionicons name="close-circle" size={18} color={Colors.white} />}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Floating header ── */}
      <View style={[styles.floatingHeader, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.floatingRight}>
          <TouchableOpacity style={styles.floatingBtn} onPress={() => { /* TODO: toggle save */ }}>
            <Ionicons name="heart-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* ── Gallery ── */}
        <ImageGalleryPreview images={property.images} onImagePress={openGallery} />

        <Animated.View style={[styles.content, {
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          {/* ── Price + Badge ── */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatCurrency(property.price)}</Text>
              <Text style={styles.priceLabel}>Total price</Text>
            </View>
            <Badge label={property.availability} variant={availabilityVariant} size="md" />
          </View>

          {/* ── Application Status Badge ── */}
          {myApplication && (
            <View style={styles.applicationStatusRow}>
              <View style={[
                styles.applicationBadge,
                myApplication.status === 'APPROVED' && styles.applicationBadgeApproved,
                myApplication.status === 'REJECTED' && styles.applicationBadgeRejected,
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
          <Text style={styles.title}>{property.title}</Text>
          <TouchableOpacity style={styles.locationRow} activeOpacity={0.7}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.locationText}>{property.address}, {property.city}, {property.state}</Text>
          </TouchableOpacity>

          {/* ── Features Grid ── */}
          <View style={styles.featuresGrid}>
            {property.bedrooms != null && <FeatureItem icon="bed-outline" label="Bedrooms" value={String(property.bedrooms)} />}
            {property.bathrooms != null && <FeatureItem icon="water-outline" label="Bathrooms" value={String(property.bathrooms)} />}
            {property.toilets != null && <FeatureItem icon="flask-outline" label="Toilets" value={String(property.toilets)} />}
            {property.area != null && <FeatureItem icon="resize-outline" label="Area" value={`${property.area} sqm`} />}
            <FeatureItem icon="pricetag-outline" label="Type" value={property.type} />
            <FeatureItem icon="eye-outline" label="Views" value={String(property.viewCount)} />
          </View>

          {/* ── Description ── */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>

          {/* ── Amenities ── */}
          {property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesWrap}>
                {property.amenities.map((amenity, idx) => (
                  <View key={idx} style={styles.amenityChip}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
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
          />

          {/* ── Realtor Info (from realtorContact, property.realtor, or application) ── */}
          {(property.realtorContact || property.realtor || myApplication?.realtor) && (() => {
            // Prefer new realtorContact, fallback to legacy realtor
            const realtorContact = property.realtorContact;
            const legacyRealtor = property.realtor || myApplication?.realtor;
            
            const displayName = realtorContact?.name 
              || (legacyRealtor?.user ? `${legacyRealtor.user.firstName} ${legacyRealtor.user.lastName}`.trim() : 'Realtor');
            const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'R';
            const agency = realtorContact?.agency;
            
            return (
              <Card style={styles.realtorCard}>
                <Text style={styles.sectionTitle}>Listed By</Text>
                <View style={styles.realtorInfo}>
                  <View style={styles.realtorAvatar}>
                    <Text style={styles.realtorInitials}>{initials}</Text>
                  </View>
                  <View style={styles.realtorDetails}>
                    <Text style={styles.realtorName}>{displayName}</Text>
                    <Text style={styles.realtorLabel}>{agency || 'Licensed Realtor'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.realtorChatBtn}
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
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity 
          style={styles.callBtn} 
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
      />

      {/* ── Payment WebView Modal ── */}
      <Modal visible={!!paymentUrl} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.webViewContainer, { paddingTop: insets.top }]}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity 
              onPress={() => {
                setPaymentUrl(null);
                setPaymentReference(null);
              }}
              style={styles.webViewClose}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Complete Payment</Text>
            <View style={{ width: 40 }} />
          </View>
          {paymentUrl && (
            <WebView
              source={{ uri: paymentUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
              style={styles.webView}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webViewLoading}>
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
          <View style={styles.pollingContent}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.pollingText}>Verifying payment...</Text>
            <Text style={styles.pollingSubtext}>Please wait</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** Gallery Preview — Hero image + thumbnail strip with expand button */
function ImageGalleryPreview({ 
  images, 
  onImagePress 
}: { 
  images: string[]; 
  onImagePress: (index: number) => void;
}) {
  if (!images || images.length === 0) {
    return (
      <View style={styles.galleryPlaceholder}>
        <Ionicons name="image-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.galleryPlaceholderText}>No images available</Text>
      </View>
    );
  }

  const mainImage = images[0];
  const thumbnails = images.slice(1, 5);
  const remainingCount = images.length - 5;

  return (
    <View style={styles.galleryPreview}>
      {/* ── Hero image ── */}
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={() => onImagePress(0)}
        style={styles.galleryMain}
      >
        <Image
          source={{ uri: mainImage }}
          style={styles.galleryMainImage}
          contentFit="cover"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          transition={250}
          cachePolicy="memory-disk"
        />
        {/* Photo count badge */}
        <View style={styles.galleryCounter}>
          <Ionicons name="images-outline" size={14} color="#fff" />
          <Text style={styles.galleryCounterText}>{images.length} Photos</Text>
        </View>
        {/* Expand button */}
        <TouchableOpacity
          style={styles.galleryExpandBtn}
          onPress={() => onImagePress(0)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </TouchableOpacity>
        {/* Gradient overlay at bottom */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.15)']}
          style={styles.galleryGradient}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* ── Thumbnail strip ── */}
      {thumbnails.length > 0 && (
        <View style={styles.galleryThumbnails}>
          {thumbnails.map((img, idx) => (
            <TouchableOpacity 
              key={idx}
              activeOpacity={0.9}
              onPress={() => onImagePress(idx + 1)}
              style={styles.galleryThumbnail}
            >
              <Image
                source={{ uri: img }}
                style={styles.galleryThumbnailImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
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
  visible,
  onClose,
  onCall,
  onWhatsApp,
  onChat,
  isStartingChat,
  realtorName,
}: {
  visible: boolean;
  onClose: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onChat: () => void;
  isStartingChat: boolean;
  realtorName: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity 
        style={styles.contactSheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.contactSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.contactSheetHandle} />
          <Text style={styles.contactSheetTitle}>Contact {realtorName}</Text>
          <Text style={styles.contactSheetSubtitle}>Choose how you'd like to get in touch</Text>
          
          <View style={styles.contactOptions}>
            <TouchableOpacity style={styles.contactOption} onPress={onCall}>
              <View style={[styles.contactOptionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Ionicons name="call" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.contactOptionLabel}>Phone Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactOption} onPress={onWhatsApp}>
              <View style={[styles.contactOptionIcon, { backgroundColor: '#dcf8c6' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.contactOptionLabel}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactOption} 
              onPress={onChat}
              disabled={isStartingChat}
            >
              <View style={[styles.contactOptionIcon, { backgroundColor: Colors.primaryLight }]}>
                {isStartingChat ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="chatbubbles" size={24} color={Colors.primary} />
                )}
              </View>
              <Text style={styles.contactOptionLabel}>In-App Chat</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.contactSheetCancel} onPress={onClose}>
            <Text style={styles.contactSheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/** Feature Item */
function FeatureItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}><Ionicons name={icon} size={20} color={Colors.primary} /></View>
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

/** Installment Plan Card — fetches real templates from API */
function InstallmentPlanCard({ 
  property, 
  application,
  onApply,
  isApplying,
}: { 
  property: Property;
  application: Application | null;
  onApply: () => void;
  isApplying: boolean;
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

  // Compute breakdown from the selected template or fallback
  const downPct = template?.downPaymentPct ?? 30;
  const durationMonths = template?.durationMonths ?? 12;
  const interestRate = template?.interestRate ?? 0;
  const downPayment = Math.round(totalPrice * (downPct / 100));
  const financed = totalPrice - downPayment;
  const totalWithInterest = financed * (1 + interestRate / 100);
  const monthlyPayment = Math.round(totalWithInterest / durationMonths);

  // Calculate payment progress if application exists and is paid
  const paidAmount = application?.paymentStatus === 'PAID' ? totalPrice : 0;
  const progress = paidAmount / totalPrice;

  return (
    <Card style={styles.installmentCard} variant="outlined">
      <LinearGradient 
        colors={[Colors.primaryLight + '60', Colors.primaryLight + '20']} 
        style={styles.installmentGradient} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
      />
      
      <View style={styles.installmentHeader}>
        <View style={styles.installmentBadge}>
          <Ionicons name="card-outline" size={16} color={Colors.primary} />
          <Text style={styles.installmentBadgeText}>Flexible Payment Options</Text>
        </View>
      </View>

      <Text style={styles.installmentDesc}>
        This property supports multiple payment options including full payment and installment plans.
      </Text>

      {/* Plan selector chips (when multiple templates) */}
      {templates.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md, marginHorizontal: -Spacing.xs }}>
          {templates.map((tp, idx) => (
            <TouchableOpacity
              key={tp.id}
              onPress={() => setSelectedIdx(idx)}
              style={{
                paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
                borderRadius: BorderRadius.full, marginRight: Spacing.sm,
                backgroundColor: idx === selectedIdx ? Colors.primary : Colors.surface,
                borderWidth: 1, borderColor: idx === selectedIdx ? Colors.primary : Colors.borderLight,
              }}
            >
              <Text style={{
                ...Typography.caption, fontWeight: '600',
                color: idx === selectedIdx ? Colors.white : Colors.textSecondary,
              }}>
                {tp.name || `${tp.durationMonths}mo plan`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Payment Breakdown */}
      <View style={styles.installmentBreakdown}>
        <View style={styles.installmentRow}>
          <Text style={styles.installmentLabel}>Total Price</Text>
          <Text style={styles.installmentValue}>{formatCurrency(totalPrice)}</Text>
        </View>
        <View style={styles.installmentDivider} />
        <View style={styles.installmentRow}>
          <Text style={styles.installmentLabel}>Down Payment ({downPct}%)</Text>
          <Text style={styles.installmentValue}>{formatCurrency(downPayment)}</Text>
        </View>
        <View style={styles.installmentRow}>
          <Text style={styles.installmentLabel}>Monthly ({durationMonths} months{interestRate > 0 ? ` @ ${interestRate}%` : ''})</Text>
          <Text style={styles.installmentValue}>{formatCurrency(monthlyPayment)}</Text>
        </View>
        {loadingTemplates && (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: Spacing.sm }} />
        )}
      </View>

      {/* Progress Bar */}
      {application && (
        <>
          <ProgressBar 
            progress={progress * 100} 
            label="Payment Progress" 
            showPercentage 
            style={styles.progressBar} 
          />
          {application.paymentStatus === 'PAID' && (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.paidBadgeText}>Fully Paid</Text>
            </View>
          )}
        </>
      )}

      {/* CTA */}
      {!application && (
        <Button 
          title={isApplying ? 'Applying...' : 'Apply to View Full Plan'}
          variant="outline" 
          size="md" 
          onPress={onApply}
          disabled={isApplying || property.availability !== 'AVAILABLE'}
          style={styles.installmentButton} 
          icon={<Ionicons name="arrow-forward" size={16} color={Colors.primary} />} 
          iconPosition="right" 
        />
      )}
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loaderContent: { alignItems: 'center', gap: Spacing.md },
  loaderText: { ...Typography.caption, color: Colors.textMuted },

  floatingHeader: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  floatingBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center', ...Shadows.md, borderWidth: 1, borderColor: Colors.borderLight },
  floatingRight: { flexDirection: 'row', gap: Spacing.sm },

  // Gallery Preview
  galleryPreview: { backgroundColor: Colors.surface },
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
  galleryPlaceholder: { height: 280, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  galleryPlaceholderText: { ...Typography.bodyMedium, color: Colors.textMuted },

  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, marginTop: -20, backgroundColor: Colors.background },

  priceRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  price: { ...Typography.h2, color: Colors.primary },
  priceLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  applicationStatusRow: { marginBottom: Spacing.lg },
  applicationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, gap: Spacing.xs },
  applicationBadgeApproved: { backgroundColor: Colors.successLight },
  applicationBadgeRejected: { backgroundColor: Colors.errorLight },
  applicationBadgeText: { ...Typography.captionMedium, color: Colors.warning },

  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xxl, gap: Spacing.sm },
  locationIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  locationText: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },

  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xxl },
  featureItem: { width: '31%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  featureValue: { ...Typography.bodySemiBold, color: Colors.textPrimary },
  featureLabel: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },

  descriptionSection: { marginBottom: Spacing.xxl },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  description: { ...Typography.body, color: Colors.textSecondary, lineHeight: 24 },

  amenitiesSection: { marginBottom: Spacing.xxl },
  amenitiesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, gap: Spacing.xs },
  amenityText: { ...Typography.caption, color: Colors.success, fontWeight: '500' },

  // Installment Card
  installmentCard: { marginBottom: Spacing.xxl, position: 'relative', overflow: 'hidden' },
  installmentGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: BorderRadius.lg },
  installmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  installmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, gap: Spacing.xs },
  installmentBadgeText: { ...Typography.captionMedium, color: Colors.primary },
  installmentDesc: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  installmentBreakdown: { backgroundColor: Colors.white + '80', borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  installmentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  installmentLabel: { ...Typography.caption, color: Colors.textMuted },
  installmentValue: { ...Typography.captionMedium, color: Colors.textPrimary },
  installmentDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.sm },
  progressBar: { marginBottom: Spacing.md },
  installmentButton: {},
  paidBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, backgroundColor: Colors.successLight, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg },
  paidBadgeText: { ...Typography.captionMedium, color: Colors.success },

  // Realtor Card
  realtorCard: { marginBottom: Spacing.xxl },
  realtorInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  realtorAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  realtorInitials: { ...Typography.bodyMedium, color: Colors.white, fontWeight: '700' },
  realtorDetails: { flex: 1 },
  realtorName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  realtorLabel: { ...Typography.small, color: Colors.textMuted },
  realtorChatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },

  // Bottom CTA
  bottomCTA: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, flexDirection: 'row', gap: Spacing.md, alignItems: 'center', ...Shadows.lg, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  callBtn: { width: 52, height: 52, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight },
  ctaButton: { flex: 1 },

  // Contact Sheet
  contactSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  contactSheet: { backgroundColor: Colors.white, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  contactSheetHandle: { width: 40, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  contactSheetTitle: { ...Typography.h4, color: Colors.textPrimary, textAlign: 'center' },
  contactSheetSubtitle: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.xl },
  contactOptions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  contactOption: { alignItems: 'center', gap: Spacing.sm },
  contactOptionIcon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  contactOptionLabel: { ...Typography.caption, color: Colors.textSecondary },
  contactSheetCancel: { backgroundColor: Colors.surface, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, alignItems: 'center' },
  contactSheetCancelText: { ...Typography.bodyMedium, color: Colors.textMuted },

  // WebView
  webViewContainer: { flex: 1, backgroundColor: Colors.white },
  webViewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  webViewClose: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  webViewTitle: { ...Typography.bodyMedium, color: Colors.textPrimary },
  webView: { flex: 1 },
  webViewLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },

  // Polling Overlay
  pollingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  pollingContent: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, padding: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  pollingText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  pollingSubtext: { ...Typography.caption, color: Colors.textMuted },
});

