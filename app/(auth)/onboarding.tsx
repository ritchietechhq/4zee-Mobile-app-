import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '4zee_onboarding_seen';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconColor: string;
  iconBg: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: 'home-outline',
    title: 'Discover Premium\nProperties',
    description:
      'Browse curated property listings across Nigeria.\nFind your dream home or next big investment.',
    iconColor: '#1E40AF',
    iconBg: '#DBEAFE',
  },
  {
    id: '2',
    icon: 'shield-checkmark-outline',
    title: 'Secure & Transparent\nPayments',
    description:
      'Make flexible installment payments with full\ntransparency. Track every naira you invest.',
    iconColor: '#059669',
    iconBg: '#D1FAE5',
  },
  {
    id: '3',
    icon: 'trending-up-outline',
    title: 'Grow Your Real\nEstate Portfolio',
    description:
      'Join as a realtor to earn commissions, manage\nclients, and scale your property business.',
    iconColor: '#7C3AED',
    iconBg: '#EDE9FE',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = useCallback(() => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  }, [activeIndex]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/role-select');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        {/* Decorative circles */}
        <View style={styles.decorContainer}>
          <View style={[styles.decorOuter, { backgroundColor: item.iconBg }]}>
            <View
              style={[styles.decorMiddle, { backgroundColor: item.iconColor + '18' }]}
            >
              <View
                style={[styles.decorInner, { backgroundColor: item.iconColor + '12' }]}
              >
                <Ionicons name={item.icon} size={56} color={item.iconColor} />
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const isLast = activeIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {!isLast && (
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
      />

      {/* Bottom area */}
      <View style={styles.bottomArea}>
        {/* Pagination dots */}
        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: Colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
          <Ionicons
            name={isLast ? 'arrow-forward' : 'chevron-forward'}
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logo: {
    width: 48,
    height: 48,
  },
  skipButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    ...Typography.bodySemiBold,
    color: Colors.textSecondary,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  decorContainer: {
    marginBottom: Spacing.xxxxl,
  },
  decorOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorMiddle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorInner: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  slideDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomArea: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xxl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  nextButtonText: {
    ...Typography.button,
    color: Colors.white,
    fontSize: 17,
  },
});
