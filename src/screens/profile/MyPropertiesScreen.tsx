import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Swipeable } from 'react-native-gesture-handler';
import { useAuthStore } from '../../store/authStore';
import { Property } from '../../services/supabase';
import { getMyProperties, deleteProperty, formatPrice } from '../../services/propertiesService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { isWeb, getContainerMaxWidth, getCardWidthPercent } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<any>;

export const MyPropertiesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { user, isAuthenticated } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load properties
  const loadProperties = useCallback(async () => {
    if (!user?.id) return;

    const { properties: props, error: err } = await getMyProperties(user.id);

    if (err) {
      setError('Erro ao carregar imoveis');
      setIsLoading(false);
      return;
    }

    setProperties(props || []);
    setError(null);
    setIsLoading(false);
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    loadProperties();
  }, [isAuthenticated, loadProperties]);

  // Handle refresh
  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadProperties();
    setIsRefreshing(false);
  };

  // Handle delete property
  const handleDeleteProperty = async (property: Property) => {
    Alert.alert(
      'Remover imovel',
      `Tens a certeza que queres remover "${property.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await deleteProperty(property.id);
            if (deleteError) {
              Alert.alert('Erro', 'Nao foi possivel remover o imovel');
              return;
            }
            // Remove from local state
            setProperties((prev) => prev.filter((p) => p.id !== property.id));
          },
        },
      ]
    );
  };

// Navigate to create property
	const handleCreateProperty = () => {
		navigation.navigate('CreateProperty' as any);
	};

// Navigate to edit property
	const handleEditProperty = (property: Property) => {
		navigation.navigate('EditProperty' as any, { propertyId: property.id });
	};

  // Render delete action (swipe from right)
  const renderRightActions = (property: Property) => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => handleDeleteProperty(property)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteIcon}>🗑️</Text>
      <Text style={styles.deleteText}>Remover</Text>
    </TouchableOpacity>
  );

  // Render property card
  const renderProperty = useCallback(
    ({ item }: { item: Property }) => {
      const isActive = item.status === 'active';
      const hasImage = item.images && item.images.length > 0;
      const firstImage = hasImage ? item.images[0] : null;

      return (
        <Swipeable
          renderRightActions={() => renderRightActions(item)}
          overshootRight={false}
        >
          <TouchableOpacity
            style={styles.propertyCard}
            onPress={() => handleEditProperty(item)}
            activeOpacity={0.8}
          >
            {/* Image */}
            <View style={styles.propertyImageContainer}>
              {firstImage ? (
                <Image source={{ uri: firstImage }} style={styles.propertyImage} />
              ) : (
                <LinearGradient
                  colors={['#2D4A1E', '#3D6B20', '#8B3D16']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.propertyImage}
                />
              )}
              {/* Status badge */}
              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusActive : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusText}>
                  {isActive ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.propertyContent}>
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.propertyLocation} numberOfLines={1}>
                {item.location}, {item.city}
              </Text>
              <View style={styles.propertyFooter}>
                <Text style={styles.propertyPrice}>
                  {formatPrice(item.price, item.currency)}
                </Text>
                <Text style={styles.propertyType}>
                  {item.type === 'house' ? 'Casa' : item.type === 'apartment' ? 'Apartamento' : 'Terreno'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Swipeable>
      );
    },
    []
  );

  const keyExtractor = useCallback((item: Property) => item.id, []);

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.headerTitle}>Meus Imoveis</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏠</Text>
          <Text style={styles.emptyTitle}>Inicia sessao</Text>
          <Text style={styles.emptyText}>
            Entra na tua conta para gerir os teus imoveis
          </Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Text style={styles.headerTitle}>Meus Imoveis</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.terra} />
          <Text style={styles.loadingText}>A carregar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isWeb && styles.containerWeb]}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }, isWeb && styles.headerWeb]}>
        <Text style={styles.headerTitle}>Meus Imoveis</Text>
        {properties.length > 0 && (
          <Text style={styles.headerCount}>
            {properties.filter((p) => p.status === 'active').length} activos
          </Text>
        )}
      </View>

      {/* LIST */}
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          isWeb && styles.listContentWeb,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.terra]}
            tintColor={colors.terra}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>Sem imoveis</Text>
            <Text style={styles.emptyText}>
              Adiciona o teu primeiro imovel para comecar
            </Text>
          </View>
        }
      />

      {/* FLOATING ADD BUTTON */}
      <TouchableOpacity
        style={[styles.fabButton, { bottom: insets.bottom + spacing.xl }]}
        onPress={handleCreateProperty}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.terra, colors.ochre]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  // HEADER
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    color: colors.charcoal,
    lineHeight: 32,
  },
  headerCount: {
    fontSize: typography.sizes.sm,
    color: colors.lightMid,
    marginTop: spacing.xs,
  },

  // LIST
  listContent: {
    padding: spacing.lg,
  },

  // PROPERTY CARD
  propertyCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  propertyImageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: 100,
    height: 100,
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: colors.forest,
  },
  statusInactive: {
    backgroundColor: colors.mid,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.05,
  },
  propertyContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  propertyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  propertyLocation: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginBottom: spacing.sm,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyPrice: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.terra,
  },
  propertyType: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
  },

  // SWIPE ACTIONS
  deleteAction: {
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  deleteIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  deleteText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },

  // FAB BUTTON
  fabButton: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    ...shadows.lg,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
  },

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.mid,
    textAlign: 'center',
    lineHeight: 22,
  },

  // LOADING STATE
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: typography.fontBody,
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    marginTop: spacing.md,
  },

  // WEB RESPONSIVE STYLES
  containerWeb: {
    maxWidth: getContainerMaxWidth(),
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 0,
  },
  headerWeb: {
    paddingHorizontal: spacing.lg,
  },
  listContentWeb: {
    paddingHorizontal: spacing.lg,
  },
});

export default MyPropertiesScreen;
