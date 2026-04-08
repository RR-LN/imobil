import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Property } from '../../services/supabase';

interface PropertyMarkerProps {
  property: Property;
  isSelected: boolean;
  onPress: (property: Property) => void;
}

export const PropertyMarker: React.FC<PropertyMarkerProps> = ({
  property,
  isSelected,
  onPress,
}) => {
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M`;
    }
    if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}k`;
    }
    return price.toString();
  };

  // Parse location coordinates (assuming stored as "lat,lng" or from geocoding)
  const getCoordinates = () => {
    // If property has explicit coordinates
    if (property.location?.includes(',')) {
      const [lat, lng] = property.location.split(',').map(Number);
      return { latitude: lat, longitude: lng };
    }
    // Fallback to city center (Maputo default)
    return { latitude: -25.9692, longitude: 32.5732 };
  };

  const coordinate = getCoordinates();

  return (
    <Marker
      coordinate={coordinate}
      onPress={() => onPress(property)}
    >
      <View style={[styles.container, isSelected && styles.containerSelected]}>
        <Text style={[styles.price, isSelected && styles.priceSelected]}>
          {formatPrice(property.price)}
        </Text>
      </View>
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{property.title}</Text>
          <Text style={styles.calloutPrice}>
            {property.price.toLocaleString('pt-MZ')} {property.currency}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5A6B5A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  containerSelected: {
    backgroundColor: '#A67B5B',
    transform: [{ scale: 1.1 }],
  },
  price: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  priceSelected: {
    fontSize: 14,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3A2D',
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6B5A',
  },
});
