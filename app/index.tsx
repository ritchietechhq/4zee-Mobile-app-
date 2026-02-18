import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * Root index screen — shows an empty branded background while
 * AuthGuard in _layout.tsx (which renders the AnimatedSplash)
 * determines where to navigate the user.
 *
 * This file only exists to satisfy Expo Router's requirement
 * for a root `/` route.  The actual splash UI lives in
 * AuthGuard → AnimatedSplash.
 */
export default function Index() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
