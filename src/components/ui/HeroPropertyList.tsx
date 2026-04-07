import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated as RNAnimated,
  ViewToken,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../../services/supabase';
import { HeroPropertyCard } from './HeroPropertyCard';
import { useTheme } from '../../theme/theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const SPACING = 16;

interface HeroPropertyListProps {
  properties: Property[];
  onSelect: (property: Property) => void;
  onToggleFavorite?: (id: string) => void;
  favorites?: string[];
  title?: string;
  subtitle?: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  isLoading?: boolean;
}

export function HeroPropertyList({
  properties,
  onSelect,
  onToggleFavorite,
  favorites = [],
  title,
  subtitle,
  showSeeAll = true,
  onSeeAll,
  isLoading = false,
}: HeroPropertyListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new RNAnimated.Value(0)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
      viewOffset: (SCREEN_WIDTH - CARD_WIDTH) / 2 - SPACING,
    });
  };

  const handleScroll = RNAnimated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.skeletonCard} />
      </View>
    );
  }

  if (properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color="#C4B5A5" />
        <Text style={styles.emptyText}>{t('home.noResults')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {(title || showSeeAll) && (
        <View style={styles.header}>
          <View>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {showSeeAll && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSeeAll?.();
              }}
            >
              <Text style={[styles.seeAllText, { color: theme.colors.accent.gold }]}>
                {t('common.seeAll')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.accent.gold} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Horizontal List */}
      <FlatList
        ref={flatListRef}
        data={properties}
        renderItem={({ item, index }) => (
          <HeroPropertyCard
            property={item}
            onPress={onSelect}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(item.id)}
            index={index}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + SPACING,
          offset: (CARD_WIDTH + SPACING) * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      {properties.length > 1 && (
        <View style={styles.pagination}>
          {properties.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                scrollToIndex(index);
              }}
              style={[
                styles.paginationDot,
                {
                  width: index === activeIndex ? 24 : 8,
                  backgroundColor:
                    index === activeIndex
                      ? theme.colors.primary.mid
                      : '#E8E0D5',
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3A2D',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B988B',
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: -8,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.35,
    backgroundColor: '#E8E0D5',
    borderRadius: 24,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8B988B',
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
});
