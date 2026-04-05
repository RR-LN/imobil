import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { usePropertiesStore, PropertyFilter } from '../../store/propertiesStore';
import { Property } from '../../services/supabase';
import { formatPrice } from '../../services/propertiesService';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, textStyles, shadows, typography } from '../../constants/theme';
import { HomeStackParamList } from '../../navigation/HomeStack';
import { isWeb, getContainerMaxWidth, getCardWidthPercent, scaleSpacing, scaleFont } from '../../utils/responsive';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

const FILTERS: { id: PropertyFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'houses', label: 'Casas' },
  { id: 'land', label: 'Terrenos' },
  { id: 'apartments', label: 'Apartamentos' },
  { id: 'rent', label: 'Arrendar' },
  { id: 'sale', label: 'Comprar' },
];

export const HomeFeedScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { profile, isAuthenticated } = useAuthStore();
  const {
    properties,
    featuredProperties,
    isLoading,
    isSearching,
    activeFilter,
    fetchProperties,
    fetchFeatured,
    setFilter,
    searchPropertiesAction,
  } = usePropertiesStore();

  // Fetch data on mount
  useEffect(() => {
    fetchProperties(true);
    fetchFeatured();
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProperties(true), fetchFeatured()]);
    setRefreshing(false);
  };

  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPropertiesAction(searchQuery.trim());
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!isAuthenticated || !profile?.full_name) return 'Visitante';
    return profile.full_name.split(' ')[0];
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!isAuthenticated || !profile?.full_name) return '?';
    const names = profile.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Navigate to property detail
  const handlePropertyPress = (property: Property) => {
    navigation.navigate('PropertyDetail', {
      propertyId: property.id,
      title: property.title,
      price: formatPrice(property.price, property.currency),
      location: `${property.location}, ${property.city}`,
      type: property.type,
    });
  };

  // Render property card (featured) - Premium Design
  const renderFeaturedCard = (property: Property) => {
    const hasImage = property.images && property.images.length > 0;
    const firstImage = hasImage ? property.images[0] : null;

    return (
      <TouchableOpacity
        key={property.id}
        testID={`featured-card-${property.id}`}
        style={styles.featCard}
        onPress={() => handlePropertyPress(property)}
        activeOpacity={0.92}
      >
        <View style={styles.featCardImageContainer}>
          {firstImage ? (
            <Image source={{ uri: firstImage }} style={styles.featCardImage} />
          ) : (
            <LinearGradient
              colors={[colors.forest, colors.forestMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.featCardGradient}
            />
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(26, 21, 18, 0.7)', 'rgba(26, 21, 18, 0.95)']}
            style={styles.featCardOverlay}
          />

          {/* Premium Badge */}
          <View style={styles.featBadge}>
            <MaterialIcons name="star" size={10} color={colors.white} />
            <Text style={styles.featBadgeText}>Destaque</Text>
          </View>
        </View>

        {/* Location tag */}
        <View style={styles.featCardGeo}>
          <MaterialIcons name="location-on" size={12} color={colors.terra} />
          <Text style={styles.featCardGeoText}>
            {property.city}
          </Text>
        </View>

        {/* Info at bottom */}
        <View style={styles.featCardInfo}>
          <View style={styles.featCardHeader}>
            <Text style={styles.featCardName} numberOfLines={1}>
              {property.title}
            </Text>
          </View>
          <Text style={styles.featCardPrice}>
            {formatPrice(property.price, property.currency)}
          </Text>
          <View style={styles.featCardMeta}>
            <Text style={styles.featCardType}>{property.type}</Text>
            <View style={styles.dot} />
            <Text style={styles.featCardArea}>{property.size} m²</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render mini property card
  const renderMiniCard = (property: Property, index: number) => {
    const hasImage = property.images && property.images.length > 0;
    const firstImage = hasImage ? property.images[0] : null;
    const gradientColors = index % 2 === 0 
      ? ['#3D5C1E', '#6B8C35'] as const 
      : ['#8B4513', '#C4622D'] as const;

    return (
      <TouchableOpacity
        key={property.id}
        testID={`mini-card-${property.id}`}
        style={styles.miniCard}
        onPress={() => handlePropertyPress(property)}
        activeOpacity={0.85}
      >
        {firstImage ? (
          <Image source={{ uri: firstImage }} style={styles.miniCardImg} />
        ) : (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.miniCardImg}
          />
        )}
        <View style={styles.miniCardBody}>
          <Text style={styles.miniCardPrice}>
            {formatPrice(property.price, property.currency)}
          </Text>
          <Text style={styles.miniCardLoc} numberOfLines={1}>
            {property.city}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="home" size={48} color={colors.lightMid} style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>Nenhum imovel encontrado</Text>
      <Text style={styles.emptyText}>
        Tenta ajustar os filtros ou fazer uma nova pesquisa
      </Text>
    </View>
  );

  // Show loading state
  const showLoading = isLoading && properties.length === 0;
  const showSearching = isSearching;

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.terra]}
            tintColor={colors.terra}
          />
        }
      >
        {/* HEADER */}
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          {/* Decorative circle */}
          <View style={styles.headerCircle} />

          {/* Top row: Greeting + Avatar */}
          <View style={styles.topRow}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>
                {getGreeting()}, {getUserDisplayName()}
              </Text>
            <TouchableOpacity style={styles.locationRow} activeOpacity={0.8}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.city}>Maputo, Mocambique</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
          </View>

          {/* Logo */}
          <Text style={styles.logo}>
            Imobil
          </Text>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              testID="home-search-input"
              accessibilityLabel="Pesquisar imóveis"
              accessibilityHint="Introduz o texto para procurar imóveis"
              style={styles.searchInput}
              placeholder="Pesquisar imoveis..."
              placeholderTextColor={colors.lightMid}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {showSearching && (
              <ActivityIndicator size="small" color={colors.terra} />
            )}
          </View>
        </View>

        {/* FILTER PILLS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={[
            styles.filtersContent,
            isWeb && styles.filtersContentWeb,
          ]}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              testID={`filter-${filter.id}`}
              accessibilityLabel={`Filtro ${filter.label}`}
              accessibilityHint={activeFilter === filter.id ? "Filtro ativo" : "Ativar este filtro"}
              accessibilityRole="button"
              style={[
                styles.pill,
                activeFilter === filter.id && styles.pillActive,
                isWeb && styles.pillWeb,
              ]}
              onPress={() => setFilter(filter.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  activeFilter === filter.id && styles.pillTextActive,
                  isWeb && styles.pillTextWeb,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading indicator */}
        {showLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.terra} />
            <Text style={styles.loadingText}>A carregar imoveis...</Text>
          </View>
        )}

        {/* EM DESTAQUE SECTION */}
        {!showLoading && featuredProperties.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Em Destaque</Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.sectionLink}>Ver todos →</Text>
              </TouchableOpacity>
            </View>

            {/* Featured Cards - Responsive Grid */}
            <View style={isWeb ? styles.featuredGridWeb : styles.featuredRow}>
              {featuredProperties.slice(0, isWeb ? 3 : 1).map(renderFeaturedCard)}
            </View>
          </>
        )}

        {/* RECENTES SECTION */}
        {!showLoading && properties.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Resultados' : 'Recentes'}
              </Text>
              <TouchableOpacity activeOpacity={0.8}>
                <Text style={styles.sectionLink}>Ver todos →</Text>
              </TouchableOpacity>
            </View>

            {/* Mini cards grid */}
            <View style={isWeb ? styles.miniGridWeb : styles.miniRow}>
              {properties.map((property, index) => (
                <View
                  key={property.id}
                  style={[
                    styles.miniCardContainer,
                    isWeb && {
                      width: getCardWidthPercent() as any,
                      maxWidth: 320,
                    },
                  ]}
                >
                  {renderMiniCard(property, index)}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty state */}
        {!showLoading && properties.length === 0 && renderEmptyState()}

  {/* Bottom spacing */}
  <View style={styles.bottomSpacer} />
  </ScrollView>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  scrollView: {
    flex: 1,
  },

  // HEADER
  header: {
    backgroundColor: colors.charcoal,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['3xl'] + spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.terra,
    opacity: 0.18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    ...textStyles.caption,
    color: 'rgba(250, 246, 239, 0.5)',
    fontSize: 10,
    marginBottom: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  city: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '500',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.terra,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  logo: {
    fontFamily: typography.fontDisplay,
    fontSize: 32,
    color: colors.cream,
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  logoAccent: {
    color: colors.terra,
    fontWeight: '600',
  },

  // SEARCH
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.md,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.lightMid,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.charcoal,
    paddingVertical: 2,
  },

  // FILTERS
  filtersScroll: {
    marginTop: spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.terra,
    borderColor: colors.terra,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.mid,
    letterSpacing: 0.02,
  },
  pillTextActive: {
    color: colors.white,
  },

  // SECTIONS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.charcoal,
    letterSpacing: 0.02,
  },
  sectionLink: {
    fontSize: 11,
    color: colors.terra,
    fontWeight: '500',
  },

  // LOADING
  loadingContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.caption,
    marginTop: spacing.md,
  },
  loadMoreContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  // EMPTY STATE
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...textStyles.heading,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...textStyles.caption,
    textAlign: 'center',
  },

  // FEATURED CARD - Premium Design
  featCard: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.paper,
    ...shadows.lg,
  },
  featCardImageContainer: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  featCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featCardGradient: {
    width: '100%',
    height: '100%',
  },
  featCardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  featBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.terra,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  featBadgeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.white,
  },
  featCardGeo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(26, 21, 18, 0.6)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  featCardGeoText: {
    fontFamily: typography.fontBody,
    fontSize: 10,
    color: colors.white,
  },
  featCardInfo: {
    padding: spacing.md,
    backgroundColor: colors.paper,
  },
  featCardHeader: {
    marginBottom: spacing.xs,
  },
  featCardName: {
    fontFamily: typography.fontDisplay,
    fontSize: 16,
    color: colors.charcoal,
    letterSpacing: -0.3,
  },
  featCardPrice: {
    fontFamily: typography.fontDisplaySemiBold,
    fontSize: 20,
    color: colors.terra,
    marginBottom: spacing.xs,
  },
  featCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  featCardType: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.mid,
    textTransform: 'capitalize',
  },
  featCardArea: {
    fontFamily: typography.fontBody,
    fontSize: 12,
    color: colors.mid,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  // MINI CARDS
  miniRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  featuredRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  miniCardContainer: {
    flex: 1,
    minWidth: 150,
  },
  miniCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#E8E0D5',
  },
  miniCardImg: {
    height: 70,
    width: '100%',
  },
  miniCardBody: {
    padding: spacing.sm,
  },
  miniCardPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.charcoal,
  },
  miniCardLoc: {
    fontSize: 9,
    color: colors.mid,
    marginTop: 2,
  },

  // WEB RESPONSIVE STYLES
  containerWeb: {
    maxWidth: getContainerMaxWidth(),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  filtersContentWeb: {
    paddingHorizontal: spacing.lg,
    maxWidth: '100%',
  },
  pillWeb: {
    paddingHorizontal: 16,
    paddingVertical: spacing.sm + 2,
  },
  pillTextWeb: {
    fontSize: 13,
  },
  featuredGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  miniGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});

export default HomeFeedScreen;
