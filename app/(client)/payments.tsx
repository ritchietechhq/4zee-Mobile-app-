import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { usePayments } from '@/hooks/usePayments';
import { Colors, Spacing, Typography } from '@/constants/theme';

const PAYSTACK_CALLBACK_URL = 'https://standard.paystack.co/close';

export default function PaymentWebViewScreen() {
  const { url, applicationId } = useLocalSearchParams<{
    url: string;
    applicationId: string;
  }>();
  const { pollPaymentStatus, paymentStatus, isPolling, error, resetPayment } =
    usePayments();

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      // Paystack redirects to callback URL when done
      if (
        navState.url.includes(PAYSTACK_CALLBACK_URL) ||
        navState.url.includes('callback') ||
        navState.url.includes('verify')
      ) {
        // Payment flow completed in WebView — poll for status
        pollPaymentStatus();
      }
    },
    [pollPaymentStatus],
  );

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment?',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            resetPayment();
            router.back();
          },
        },
      ],
    );
  };

  // Navigate back when payment status is resolved
  useEffect(() => {
    if (paymentStatus) {
      if (paymentStatus.status === 'SUCCESS') {
        Alert.alert('Payment Successful!', 'Your payment has been confirmed.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else if (paymentStatus.status === 'FAILED') {
        Alert.alert(
          'Payment Failed',
          paymentStatus.failureReason || 'Payment could not be completed.',
          [{ text: 'OK', onPress: () => router.back() }],
        );
      }
    }
  }, [paymentStatus]);

  if (!url) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorText}>No payment URL provided</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isPolling) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pollingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.pollingText}>Verifying payment...</Text>
          <Text style={styles.pollingSubtext}>
            Please wait while we confirm your payment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* WebView */}
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoader}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading payment page...</Text>
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  pollingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  pollingText: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
  },
  pollingSubtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  goBackText: {
    ...Typography.bodySemiBold,
    color: Colors.primary,
  },
});
