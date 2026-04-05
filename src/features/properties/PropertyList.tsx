import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../../services/supabase';
import { useTheme } from '../../theme/theme';
import { fontConfig } from '../../constants/fonts';

interface PropertyListProps {
  properties: Property[];
  onSelect: (property: Property) => void;
  onToggleFavorite?: (id: string) => void;
  favorites?: string[];
  numColumns?: number;
  isLoading?: boolean;
}

const { width } = Dimensions.get('window');

export function PropertyList({
  properties,
  onSelect,
  onToggleFavorite,
  favorites = [],
  numColumns = 2,
  isLoading = false,
}: PropertyListProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const columnWidth = (width - theme.spacing.xl * (numColumns + 1)) / numColumns;

  const renderItem = ({ item }: { item: Property }) => {
    const isFavorite = favorites.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, { width: columnWidth }]}
        onPress={() => onSelect(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="home-outline" size={32} color="#94A3B8" />
            </View>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.transaction === 'sale' ? t('filters.sale') : t('filters.rent')}
            </Text>
          </View>
          {onToggleFavorite && (
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={20}
                color={isFavorite ? '#EF4444' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.price} numberOfLines={1}>
            {item.price.toLocaleString('pt-MZ')} {item.currency}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.location} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#94A3B8" /> {item.city}
          </Text>
          <View style={styles.features}>
            {item.bedrooms != null && (
              <Text style={styles.feature}>
                <Ionicons name="bed-outline" size={12} color="#94A3B8" /> {item.bedrooms}
              </Text>
            )}
            {item.bathrooms != null && (
              <Text style={styles.feature}>
                <Ionicons name="water-outline" size={12} color="#94A3B8" /> {item.bathrooms}
              </Text>
            )}
            <Text style={styles.feature}>
              <Ionicons name="square-outline" size={12} color="#94A3B8" /> {item.area_m2}m²
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('home.loading')}</Text>
      </View>
    );
  }

  if (properties.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color="#CBD5E1" />
        <Text style={styles.emptyText}>{t('home.noResults')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={properties}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
  },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 12,
  },
  price: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 14,
    color: '#D4AF37',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 8,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
  },
  feature: {
    fontSize: 11,
    color: '#64748B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
