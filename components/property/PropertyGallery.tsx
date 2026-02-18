import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';

interface PropertyGalleryProps {
  images: string[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PropertyGallery({ images, height = 300 }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  if (!images.length) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderText}>No images available</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={[styles.image, { height }]}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={200}
          />
        )}
      />
      {/* Pagination dots */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {activeIndex + 1}/{images.length}
            </Text>
          </View>
        </View>
      )}
      {/* Dot indicators */}
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
  },
  placeholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  pagination: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  counter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  counterText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
});

export default PropertyGallery;
