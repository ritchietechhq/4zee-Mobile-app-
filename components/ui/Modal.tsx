import React, { useMemo } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ModalProps as RNModalProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/constants/colors';

interface ModalProps extends Omit<RNModalProps, 'children'> {
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  title,
  onClose,
  children,
  showCloseButton = true,
  size = 'md',
  visible,
  ...rest
}: ModalProps) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      {...rest}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={[styles.content, styles[`size_${size}`]]}>
                {(title || showCloseButton) && (
                  <View style={styles.header}>
                    <Text style={styles.title}>{title || ''}</Text>
                    {showCloseButton && (
                      <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="close" size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {children}
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  size_sm: {
    width: '80%',
    maxWidth: 300,
  },
  size_md: {
    width: '90%',
    maxWidth: 400,
  },
  size_lg: {
    width: '95%',
    maxWidth: 500,
  },
  size_full: {
    width: '100%',
    maxHeight: '90%',
  },
});

export default Modal;
