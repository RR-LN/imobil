import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, Dimensions, ScrollView } from 'react-native';
import { useResponsiveLayout } from '../constants/layout';

interface WebContainerProps {
  children: ReactNode;
  maxWidth?: number;
  centered?: boolean;
  scrollable?: boolean;
}

export function WebContainer({
  children,
  maxWidth = 1440,
  centered = true,
  scrollable = false,
}: WebContainerProps) {
  const { isDesktop } = useResponsiveLayout();

  if (!isDesktop || Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const content = (
    <View style={[styles.inner, { maxWidth, marginHorizontal: centered ? 'auto' : 0 }]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    width: '100%',
    flex: 1,
  },
});
