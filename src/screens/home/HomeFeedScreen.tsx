import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../store/authStore';
import { usePropertiesStore, PropertyFilter } from '../../store/propertiesStore';
import { Property } from '../../services/supabase';
import { HeroPropertyList } from '../../components/ui/HeroPropertyList';
import { GlassCard } from '../../components/ui/GlassCard';
import { HomeStackParamList } from '../../navigation/HomeStack';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeFeed'>;

const FILTERS = [
  { id: 'all', label: 'Todos', icon: 'grid' as const },
  { id: 'houses', label: 'Casas', icon: 'home' as const },
  { id: 'land', label: 'Terrenos', icon: 'map' as const },
  { id: 'apartments', label: 'Apartamentos', icon: 'business' as const },
  { id: 'rent', label: 'Arrendar', icon: 'key' as const },
  { id: 'sale', label: 'Comprar', icon: 'cash' as const },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const HomeFeedScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { profile, isAuthenticated } = useAuthStore();
  const {
    properties,
    featuredProperties,
    isLoading,
    activeFilter,
    favorites,
    fetchProperties,
    fetchFeatured,
    setFilter,
    toggleFavorite,
  } = usePropertiesStore();

  useEffect(() => {
    fetchProperties(true);
    fetchFeatured();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProperties(true), fetchFeatured()]);
    setRefreshing(false);
  }, [fetchProperties, fetchFeatured]);

  const handlePropertyPress = (property: Property) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getUserName = () => {
    if (!isAuthenticated || !profile?.full_name) return 'Visitante';
    return profile.full_name.split(' ')[0];
  };

  const handleFilterPress = (filterId: PropertyFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(filterId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.userName}>{getUserName()}</Text>
              </View>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowSearch(!showSearch);
                }}
              >
                <Ionicons name="search" size={22} color="#2D3A2D" />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchContainer}>
                <GlassCard style={styles.searchCard}>
                  <Ionicons name="search" size={18} color="#8B988B" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Procurar imoveis..."
                    placeholderTextColor="#8B988B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#8B988B" />
                    </TouchableOpacity>
                  )}
                </GlassCard>
              </View>
            )}

            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={16} color="#A67B5B" />
              <Text style={styles.locationText}>Maputo, Mocambique</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100)} style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map((filter, index) => {
              const isActive = activeFilter === filter.id;
              return (
                <AnimatedTouchable
                  key={filter.id}
                  entering={FadeInUp.delay(index * 50)}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => handleFilterPress(filter.id as PropertyFilter)}
                >
                  <Ionicons
                    name={filter.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : '#5A6B5A'}
                    style={styles.filterIcon}
                  />
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </AnimatedTouchable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <HeroPropertyList
            properties={featuredProperties.slice(0, 5)}
            onSelect={handlePropertyPress}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            title="Em Destaque"
            subtitle="Imoveis selecionados para si"
            isLoading={isLoading}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)} style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recentes</Text>
              <Text style={styles.sectionSubtitle}>Adicionados recentemente</Text>
            </View>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>Ver todos</Text>
              <Ionicons name="arrow-forward" size={16} color="#A67B5B" />
            </TouchableOpacity>
          </View>

          <HeroPropertyList
            properties={properties.slice(0, 5)}
            onSelect={handlePropertyPress}
            onToggleFavorite={toggleFavorite}
            favorites={favorites}
            isLoading={isLoading}
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F3',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: '#8B988B',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D3A2D',
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2D3A2D',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#5A6B5A',
    fontWeight: '500',
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#5A6B5A',
  },
  filterIcon: {
    marginTop: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5A6B5A',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  recentSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3A2D',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B988B',
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A67B5B',
  },
});
