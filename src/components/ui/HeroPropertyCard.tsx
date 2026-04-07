import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '../../theme/theme';
import { Property } from '../../services/supabase';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

interface HeroPropertyCardProps {
  property: Property;
  onPress: (property: Property) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeroPropertyCard({
  property,
  onPress,
  onToggleFavorite,
  isFavorite = false,
  index = 0,
}: HeroPropertyCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleFavorite?.(property.id);
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('pt-MZ')} ${currency}`;
  };

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onPress(property)}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <Image
            source={{ uri: property.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="home-outline" size={48} color="#C4B5A5" />
          </View>
        )}

        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay} />

        {/* Transaction Badge */}
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  property.transaction === 'sale'
                    ? theme.colors.primary.mid
                    : theme.colors.accent.gold,
              },
            ]}
          >
            <Text style={styles.badgeText}>
              {property.transaction === 'sale' ? t('filters.sale') : t('filters.rent')}
            </Text>
          </View>
        </View>

        {/* Favorite Button */}
        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.8}
          >
            <View style={styles.favoriteButtonBg}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#B85C5C' : '#FFFFFF'}
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Content Overlay */}
        <View style={styles.contentOverlay}>
          {/* Price */}
          <Text style={styles.price} numberOfLines={1}>
            {formatPrice(property.price, property.currency)}
          </Text>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {property.title}
          </Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={14} color="#E8E0D5" />
            <Text style={styles.location} numberOfLines={1}>
              {property.city}{property.neighborhood ? `, ${property.neighborhood}` : ''}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <View style={[styles.featureItem, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="bed" size={14} color="#FFFFFF" />
                <Text style={styles.featureText}>{property.bedrooms} {t('property.beds')}</Text>
              </View>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <View style={[styles.featureItem, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="water" size={14} color="#FFFFFF" />
                <Text style={styles.featureText}>
                  {property.bathrooms} {t('property.baths')}
                </Text>
              </View>
            )}
            <View style={[styles.featureItem, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="square" size={14} color="#FFFFFF" />
              <Text style={styles.featureText}>{property.area_m2}m²</Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: 8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2D3A2D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  favoriteButtonBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 13,
    color: '#E8E0D5',
    marginLeft: 4,
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});