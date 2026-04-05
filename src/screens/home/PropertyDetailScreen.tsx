import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../services/supabase';
import { getPropertyById, formatPrice } from '../../services/propertiesService';
import { getOrCreateConversation } from '../../services/chatService';
import { getProfile } from '../../services/authService';
import { colors, spacing, borderRadius, shadows, typography } from '../../constants/theme';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { supabase } from '../../services/supabase';
import { isWeb, getContainerMaxWidth } from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'PropertyDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

// Get image width for responsive hero
const getImageWidth = () => {
  if (!isWeb) return SCREEN_WIDTH;
  // On web, match container max width minus padding
  return Math.min(SCREEN_WIDTH - 64, 1200); // 1200px max, with 32px padding each side
};

// Skeleton loader component
const Skeleton = ({ style }: { style: any }) => (
  <View style={[style, { backgroundColor: '#E8E0D5', borderRadius: borderRadius.md }]} />
);

// Property type labels
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  land: 'Terreno',
};

const TRANSACTION_LABELS: Record<string, string> = {
  sale: 'Venda',
  rent: 'Arrendamento',
};

export const PropertyDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { propertyId } = route.params || {};

  const { user, isAuthenticated } = useAuthStore();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Fetch property data
  const fetchProperty = useCallback(async () => {
    if (!propertyId) {
      setError('ID do imovel nao fornecido');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const { property: propertyData, error: fetchError } = await getPropertyById(propertyId);

    if (fetchError || !propertyData) {
      setError('Erro ao carregar imovel');
      setIsLoading(false);
      return;
    }

    setProperty(propertyData);

    // Fetch seller profile
    if (propertyData.owner_id) {
      const { profile } = await getProfile(propertyData.owner_id);
      setSellerProfile(profile);
    }

    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchProperty();
  }, [fetchProperty]);

  // Get image URL from Supabase storage
  const getImageUrl = (imagePath: string): string => {
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Otherwise, construct URL from Supabase storage
    const { data } = supabase.storage
      .from('property-images')
      .getPublicUrl(imagePath);

    return data.publicUrl;
  };

  // Get property images
  const getPropertyImages = (): string[] => {
    if (!property?.images || property.images.length === 0) {
      return [];
    }
    return property.images.map(getImageUrl);
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Handle schedule visit
  const handleScheduleVisit = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login necessario',
        'Precisa de fazer login para agendar uma visita.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    if (!property) return;

    navigation.navigate('Booking', {
      propertyId: property.id,
    });
  };

  // Handle chat
  const handleChat = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert(
        'Login necessario',
        'Precisa de fazer login para iniciar uma conversa.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Entrar', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    if (!property || !property.owner_id) return;

    // Prevent chatting with yourself
    if (property.owner_id === user.id) {
      Alert.alert('Info', 'Este e o teu proprio imovel.');
      return;
    }

    setIsLoadingChat(true);

    try {
      const { conversation, error: chatError } = await getOrCreateConversation(
        property.id,
        property.owner_id,
        user.id
      );

      if (chatError || !conversation) {
        Alert.alert('Erro', 'Nao foi possivel iniciar a conversa.');
        setIsLoadingChat(false);
        return;
      }

      navigation.navigate('Chat', {
        conversationId: conversation.id,
        propertyId: property.id,
      });
    } catch (err) {
      console.error('Chat error:', err);
      Alert.alert('Erro', 'Ocorreu um erro ao iniciar a conversa.');
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Render skeleton loader
  const renderSkeleton = () => (
    <View style={styles.container}>
      <Skeleton style={[styles.hero, { height: IMAGE_HEIGHT }]} />

      {/* Back and favorite buttons skeleton */}
      <View style={[styles.iconButton, styles.backButton, { top: insets.top + spacing.md }]}>
        <ActivityIndicator size="small" color={colors.terra} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Skeleton style={{ width: 100, height: 20, marginBottom: spacing.sm }} />
        <Skeleton style={{ width: '80%', height: 28, marginBottom: spacing.sm }} />
        <Skeleton style={{ width: '60%', height: 16, marginBottom: spacing.lg }} />
        <Skeleton style={{ width: '40%', height: 32, marginBottom: spacing.xl }} />
        <Skeleton style={{ width: '100%', height: 80, marginBottom: spacing.lg }} />
        <Skeleton style={{ width: '100%', height: 60, marginBottom: spacing.lg }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Skeleton style={{ flex: 1, height: 50 }} />
          <Skeleton style={{ flex: 1, height: 50 }} />
        </View>
      </ScrollView>
    </View>
  );

  // Render error state
  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>😕</Text>
      <Text style={styles.errorTitle}>Imovel nao encontrado</Text>
      <Text style={styles.errorText}>{error || 'Nao foi possivel carregar os detalhes do imovel.'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchProperty}>
        <Text style={styles.retryButtonText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state for no images
  const renderEmptyImage = () => (
    <LinearGradient
      colors={['#2D4A1E', '#3D6B20', '#8B3D16', '#C4622D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroGradient}
    />
  );

  // Loading state
  if (isLoading) {
    return renderSkeleton();
  }

  // Error state
  if (error || !property) {
    return renderError();
  }

  const images = getPropertyImages();

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      {/* HERO SECTION - Image Gallery */}
      <View style={[styles.hero, { height: isWeb ? 400 : IMAGE_HEIGHT, paddingTop: insets.top + spacing.md }]}>
        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (isWeb ? getImageWidth() : SCREEN_WIDTH));
              setActiveImageIndex(index);
            }}
          >
            {images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={{
                  width: isWeb ? getImageWidth() : SCREEN_WIDTH,
                  height: isWeb ? 400 : IMAGE_HEIGHT,
                }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          renderEmptyImage()
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.backButton]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Text style={styles.iconButtonText}>←</Text>
        </TouchableOpacity>

        {/* Favorite Button */}
        <TouchableOpacity
          style={[styles.iconButton, styles.favoriteButton]}
          onPress={toggleFavorite}
          activeOpacity={0.8}
        >
          <Text style={[styles.iconButtonText, isFavorite && styles.favoriteActive]}>
            {isFavorite ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>

        {/* Gallery Dots */}
        {images.length > 1 && (
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, activeImageIndex === index && styles.dotActive]}
              />
            ))}
          </View>
        )}
      </View>

      {/* BODY - ScrollView */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge Type */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {PROPERTY_TYPE_LABELS[property.type] || property.type} · {TRANSACTION_LABELS[property.transaction] || property.transaction}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>{property.title}</Text>

        {/* Location */}
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>
            {property.location}, {property.city}
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.currency)}
          </Text>
          {property.transaction === 'sale' && (
            <View style={styles.negotiableBadge}>
              <Text style={styles.negotiableText}>Negociavel</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        {(property.bedrooms || property.bathrooms || property.area_m2 || property.parking) && (
          <View style={styles.statsContainer}>
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🛏️</Text>
                  <Text style={styles.statValue}>{property.bedrooms}</Text>
                  <Text style={styles.statLabel}>Quartos</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🚿</Text>
                  <Text style={styles.statValue}>{property.bathrooms}</Text>
                  <Text style={styles.statLabel}>WC</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            {property.area_m2 !== null && property.area_m2 !== undefined && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📐</Text>
                  <Text style={styles.statValue}>{property.area_m2}</Text>
                  <Text style={styles.statLabel}>m²</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            {property.parking !== null && property.parking !== undefined && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🚗</Text>
                <Text style={styles.statValue}>{property.parking}</Text>
                <Text style={styles.statLabel}>Garagem</Text>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        {property.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Descricao</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>
        )}

        {/* Agent Card */}
        <View style={styles.agentCard}>
          <View style={styles.agentInfo}>
            {/* Avatar */}
            {sellerProfile?.avatar_url ? (
              <Image source={{ uri: sellerProfile.avatar_url }} style={styles.agentAvatar} />
            ) : (
              <LinearGradient
                colors={[colors.forest, colors.forestLight]}
                style={styles.agentAvatar}
              >
                <Text style={styles.agentInitials}>
                  {sellerProfile?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                </Text>
              </LinearGradient>
            )}

            {/* Name & Info */}
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>
                {sellerProfile?.full_name || 'Vendedor'}
              </Text>
              <View style={styles.agentMeta}>
                <Text style={styles.agentMetaText}>Proprietario</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            testID="schedule-visit-button"
            accessibilityLabel="Agendar visita"
            accessibilityHint={`Agendar visita para ${property?.title || 'este imóvel'}`}
            accessibilityRole="button"
            style={styles.primaryButton}
            onPress={handleScheduleVisit}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Agendar Visita</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="chat-agent-button"
            accessibilityLabel="Conversar com agente"
            accessibilityHint="Abrir chat com o agente imobiliário"
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={handleChat}
            activeOpacity={0.8}
            disabled={isLoadingChat}
          >
            {isLoadingChat ? (
              <ActivityIndicator size="small" color={colors.charcoal} />
            ) : (
              <>
                <Text style={styles.secondaryButtonIcon}>💬</Text>
                <Text style={styles.secondaryButtonText}>Chat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Spacer for bottom breathing room */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  // HERO
  hero: {
    position: 'relative',
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconButton: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  iconButtonText: {
    fontSize: 18,
    color: colors.white,
    lineHeight: 22,
  },
  backButton: {
    left: spacing.lg,
  },
  favoriteButton: {
    right: spacing.lg,
  },
  favoriteActive: {
    color: colors.terra,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    width: 12,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },

  // BODY
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
  },

  // BADGE
  badgeContainer: {
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(196, 98, 45, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.terra,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },

  // TITLE
  title: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: colors.charcoal,
    lineHeight: 26,
    marginBottom: spacing.xs,
  },

  // LOCATION
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  locationText: {
    fontSize: 11,
    color: colors.mid,
    letterSpacing: 0.01,
  },

  // PRICE
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  price: {
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '600',
    color: colors.terra,
    lineHeight: 30,
  },
  negotiableBadge: {
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  negotiableText: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.lightMid,
    letterSpacing: 0.02,
  },

  // STATS GRID
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 8,
    color: colors.lightMid,
    letterSpacing: 0.02,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(107, 94, 82, 0.15)',
    marginVertical: 4,
  },

  // DESCRIPTION
  descriptionContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  descriptionText: {
    fontSize: 13,
    color: colors.mid,
    lineHeight: 20,
  },

  // AGENT CARD
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  agentInitials: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  agentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentMetaText: {
    fontSize: 9,
    color: colors.lightMid,
  },

  // ACTION BUTTONS
  buttonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.terra,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.04,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  secondaryButtonIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.charcoal,
    letterSpacing: 0.04,
  },

  // ERROR & EMPTY STATES
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.mid,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.terra,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },

  // WEB RESPONSIVE STYLES
  containerWeb: {
    maxWidth: getContainerMaxWidth(),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  heroWeb: {
    // Optional adjustments for web hero
  },
  bodyContentWeb: {
    paddingHorizontal: spacing.lg,
  },
  buttonsRowWeb: {
    // On web, buttons might stack differently
    maxWidth: 500,
    alignSelf: 'center',
  },
});

export default PropertyDetailScreen;
