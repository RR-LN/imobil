import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Property } from '../../services/supabase';

interface MapPropertyCardProps {
  property: Property | null;
  onClose: () => void;
  onViewDetails: (property: Property) => void;
  onGetDirections: (property: Property) => void;
}

export const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  property,
  onClose,
  onViewDetails,
  onGetDirections,
}) => {
  if (!property) return null;

  const handleViewDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewDetails(property);
  };

  const handleGetDirections = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGetDirections(property);
  };

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={SlideOutDown}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.handle} />
        
        <View style={styles.content}>
          <Image
            source={
              property.images?.[0]
                ? { uri: property.images[0] }
                : require('../../../assets/placeholder.png')
            }
            style={styles.image}
          />
          
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {property.title}
            </Text>
            <Text style={styles.price}>
              {property.price.toLocaleString('pt-MZ')} {property.currency}
            </Text>
            <Text style={styles.location}>
              <Ionicons name="location" size={12} color="#A67B5B" />
              {' '}{property.city}
            </Text>
            
            <View style={styles.features}>
              {property.bedrooms && (
                <View style={styles.feature}>
                  <Ionicons name="bed" size={14} color="#5A6B5A" />
                  <Text style={styles.featureText}>{property.bedrooms}</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.feature}>
                  <Ionicons name="water" size={14} color="#5A6B5A" />
                  <Text style={styles.featureText}>{property.bathrooms}</Text>
                </View>
              )}
              <View style={styles.feature}>
                <Ionicons name="square" size={14} color="#5A6B5A" />
                <Text style={styles.featureText}>{property.area_m2}m²</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={handleGetDirections}
          >
            <Ionicons name="navigate" size={18} color="#5A6B5A" />
            <Text style={styles.directionsText}>Como Chegar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={handleViewDetails}
          >
            <Text style={styles.detailsText}>Ver Detalhes</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={20} color="#8B988B" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E8E4E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#E8E4E0',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3A2D',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A6B5A',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#8B988B',
    marginBottom: 8,
  },
  features: {
    flexDirection: 'row',
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#5A6B5A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F7F5F3',
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A6B5A',
  },
  detailsBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#5A6B5A',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F7F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
