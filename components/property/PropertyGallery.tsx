import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface PropertyGalleryProps {
  images: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GALLERY_HEIGHT = 280;

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== activeIndex) setActiveIndex(index);
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Ionicons name="image-outline" size={48} color={colors.textMuted} />
        <Text style={styles.placeholderText}>No images available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={styles.image}
            contentFit="cover"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            transition={250}
          />
        )}
      />
      {images.length > 1 && (
        <>
          <View style={styles.counter}>
            <Ionicons name="images-outline" size={14} color={colors.white} />
            <Text style={styles.counterText}>{activeIndex + 1}/{images.length}</Text>
          </View>
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { position: 'relative', height: GALLERY_HEIGHT, backgroundColor: colors.surface },
  image: { width: SCREEN_WIDTH, height: GALLERY_HEIGHT },
  placeholder: { height: GALLERY_HEIGHT, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  placeholderText: { ...Typography.bodyMedium, color: colors.textMuted },
  counter: { position: 'absolute', top: Spacing.md, right: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full },
  counterText: { ...Typography.caption, color: colors.white, fontWeight: '600' },
  dots: { position: 'absolute', bottom: Spacing.md, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: colors.white, width: 20 },
});
