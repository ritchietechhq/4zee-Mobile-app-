// ============================================================
// FullScreenGallery — Pinch-to-zoom, swipe, counter, share
// Uses react-native-gesture-handler + react-native-reanimated
// ============================================================

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;

/* ── Zoomable image wrapper ── */
function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const clampTranslation = useCallback(
    (tx: number, ty: number, s: number) => {
      'worklet';
      const maxX = ((s - 1) * SCREEN_W) / 2;
      const maxY = ((s - 1) * SCREEN_H * 0.7) / 2;
      return {
        x: Math.min(Math.max(tx, -maxX), maxX),
        y: Math.min(Math.max(ty, -maxY), maxY),
      };
    },
    [],
  );

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.min(Math.max(next, MIN_SCALE * 0.5), MAX_SCALE);
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else if (scale.value > MAX_SCALE) {
        scale.value = withSpring(MAX_SCALE, { damping: 15 });
        savedScale.value = MAX_SCALE;
      } else {
        savedScale.value = scale.value;
      }
      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = withSpring(clamped.x, { damping: 15 });
      translateY.value = withSpring(clamped.y, { damping: 15 });
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      const clamped = clampTranslation(
        translateX.value,
        translateY.value,
        scale.value,
      );
      translateX.value = withSpring(clamped.x, { damping: 15 });
      translateY.value = withSpring(clamped.y, { damping: 15 });
      savedTranslateX.value = clamped.x;
      savedTranslateY.value = clamped.y;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1, { damping: 15 });
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(DOUBLE_TAP_SCALE, { damping: 15 });
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <View style={zoomStyles.container}>
        <Animated.View style={[zoomStyles.imageWrap, animatedStyle]}>
          <Image
            source={{ uri }}
            style={zoomStyles.image}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const zoomStyles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageWrap: { width: SCREEN_W, height: SCREEN_H * 0.75 },
  image: { width: '100%', height: '100%' },
});

/* ── Fullscreen gallery modal ── */
export interface FullScreenGalleryProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function FullScreenGallery({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: FullScreenGalleryProps) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const handleScroll = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (idx !== currentIndex && idx >= 0 && idx < images.length) {
        setCurrentIndex(idx);
      }
    },
    [currentIndex, images.length],
  );

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        url: images[currentIndex],
        message: Platform.OS === 'android' ? images[currentIndex] : undefined,
      });
    } catch {}
  }, [currentIndex, images]);

  const handleLayout = useCallback(() => {
    if (flatListRef.current && initialIndex > 0) {
      flatListRef.current.scrollToIndex({ index: initialIndex, animated: false });
    }
  }, [initialIndex]);

  if (!images.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[galStyles.root, { paddingTop: insets.top }]}>
          {/* ── Header ── */}
          <View style={galStyles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={galStyles.headerBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={galStyles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
            <TouchableOpacity
              onPress={handleShare}
              style={galStyles.headerBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Zoomable swiper ── */}
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={handleLayout}
            keyExtractor={(_, i) => String(i)}
            getItemLayout={(_, index) => ({
              length: SCREEN_W,
              offset: SCREEN_W * index,
              index,
            })}
            renderItem={({ item }) => <ZoomableImage uri={item} />}
            initialScrollIndex={initialIndex}
            windowSize={3}
            maxToRenderPerBatch={2}
            removeClippedSubviews
          />

          {/* ── Dots / progress ── */}
          {images.length > 1 && images.length <= 10 && (
            <View style={[galStyles.dots, { paddingBottom: insets.bottom + Spacing.md }]}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    galStyles.dot,
                    i === currentIndex && galStyles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* For many images, show a thin progress bar instead of dots */}
          {images.length > 10 && (
            <View style={[galStyles.progressWrap, { paddingBottom: insets.bottom + Spacing.md }]}>
              <View style={galStyles.progressTrack}>
                <View
                  style={[
                    galStyles.progressFill,
                    {
                      width: `${((currentIndex + 1) / images.length) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const galStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    ...Typography.bodyMedium,
    color: '#fff',
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 24,
    borderRadius: 4,
  },
  progressWrap: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  progressTrack: {
    width: '60%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 1.5,
  },
});

export default FullScreenGallery;
