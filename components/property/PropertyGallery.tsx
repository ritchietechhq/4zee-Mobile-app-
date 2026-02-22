import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, FlatList,
  TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';
import { FullScreenGallery } from './FullScreenGallery';

interface PropertyGalleryProps {
  images: string[];
  /** Gallery preview height (default 300) */
  height?: number;
  /** Show thumbnail strip below main image */
  showThumbnails?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PropertyGallery({
  images,
  height = 300,
  showThumbnails = true,
}: PropertyGalleryProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors, height), [colors, height]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreenVisible, setFullscreenVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (index !== activeIndex) setActiveIndex(index);
    },
    [activeIndex],
  );

  const openFullscreen = useCallback((index: number) => {
    setActiveIndex(index);
    setFullscreenVisible(true);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setActiveIndex(index);
  }, []);

  if (!images || images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="image-outline" size={48} color={colors.textMuted} />
        <Text style={styles.placeholderText}>No images available</Text>
      </View>
    );
  }

  const thumbnails = images.slice(0, 6);
  const remaining = images.length - 6;

  return (
    <>
      <View style={styles.container}>
        {/* ── Main swipeable gallery ── */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(_, i) => i.toString()}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => openFullscreen(index)}
              style={styles.imageWrap}
            >
              <Image
                source={{ uri: item }}
                style={styles.image}
                contentFit="cover"
                placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
                transition={250}
                cachePolicy="memory-disk"
              />
            </TouchableOpacity>
          )}
          windowSize={3}
          removeClippedSubviews
        />

        {/* ── Counter badge ── */}
        <View style={styles.counter}>
          <Ionicons name="images-outline" size={14} color="#fff" />
          <Text style={styles.counterText}>
            {activeIndex + 1}/{images.length}
          </Text>
        </View>

        {/* ── Fullscreen hint ── */}
        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => openFullscreen(activeIndex)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="expand-outline" size={18} color="#fff" />
        </TouchableOpacity>

        {/* ── Dots ── */}
        {images.length > 1 && images.length <= 8 && (
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
        )}

        {/* ── Thin progress for many images ── */}
        {images.length > 8 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((activeIndex + 1) / images.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* ── Thumbnail strip ── */}
      {showThumbnails && images.length > 1 && (
        <View style={styles.thumbRow}>
          {thumbnails.map((img, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => scrollToIndex(i)}
              style={[
                styles.thumb,
                i === activeIndex && styles.thumbActive,
              ]}
            >
              <Image
                source={{ uri: img }}
                style={styles.thumbImg}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              {i === 5 && remaining > 0 && (
                <TouchableOpacity
                  style={styles.thumbMore}
                  onPress={() => openFullscreen(6)}
                >
                  <Text style={styles.thumbMoreText}>+{remaining}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Fullscreen gallery ── */}
      <FullScreenGallery
        visible={fullscreenVisible}
        images={images}
        initialIndex={activeIndex}
        onClose={() => setFullscreenVisible(false)}
      />
    </>
  );
}

const makeStyles = (colors: ThemeColors, galleryHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      height: galleryHeight,
      backgroundColor: colors.surface,
    },
    imageWrap: { width: SCREEN_WIDTH, height: galleryHeight },
    image: { width: '100%', height: '100%' },
    placeholder: {
      height: galleryHeight,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    },
    placeholderText: { ...Typography.bodyMedium, color: colors.textMuted },

    counter: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    counterText: { ...Typography.caption, color: '#fff', fontWeight: '600' },

    expandBtn: {
      position: 'absolute',
      bottom: Spacing.md,
      right: Spacing.md,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    dots: {
      position: 'absolute',
      bottom: Spacing.md,
      alignSelf: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.45)',
    },
    dotActive: { backgroundColor: '#fff', width: 20 },

    progressWrap: {
      position: 'absolute',
      bottom: Spacing.md,
      left: Spacing.xxl,
      right: Spacing.xxl,
    },
    progressTrack: {
      height: 3,
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 1.5,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: 1.5,
    },

    // Thumbnails
    thumbRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      gap: Spacing.xs,
      backgroundColor: colors.surface,
    },
    thumb: {
      flex: 1,
      height: 56,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbActive: {
      borderColor: colors.primary,
    },
    thumbImg: { width: '100%', height: '100%' },
    thumbMore: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbMoreText: { ...Typography.bodyMedium, color: '#fff', fontWeight: '700' },
  });
