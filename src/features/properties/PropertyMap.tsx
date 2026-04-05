import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { Property } from '../../services/supabase';

interface PropertyMapProps {
  properties: Property[];
  onMarkerPress?: (property: Property) => void;
}

export function PropertyMap({ properties, onMarkerPress }: PropertyMapProps) {
  if (Platform.OS === 'web') {
    return <WebMapView properties={properties} onMarkerPress={onMarkerPress} />;
  }

  return <NativeMapView properties={properties} onMarkerPress={onMarkerPress} />;
}

function WebMapView({ properties, onMarkerPress }: PropertyMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Map View (Web)</Text>
        <Text style={styles.placeholderSubtext}>
          {properties.length} properties
        </Text>
      </View>
    </View>
  );
}

function NativeMapView({ properties, onMarkerPress }: PropertyMapProps) {
  try {
    const MapView = require('react-native-maps').default;
    const Marker = require('react-native-maps').Marker;

    const defaultCenter = {
      latitude: -25.9692,
      longitude: 32.5732,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };

    return (
      <MapView
        style={styles.container}
        initialRegion={defaultCenter}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            coordinate={{
              latitude: -25.9692 + Math.random() * 0.1,
              longitude: 32.5732 + Math.random() * 0.1,
            }}
            onPress={() => onMarkerPress?.(property)}
            title={property.title}
            description={`${property.price.toLocaleString()} ${property.currency}`}
          />
        ))}
      </MapView>
    );
  } catch {
    return <WebMapView properties={properties} onMarkerPress={onMarkerPress} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  placeholderText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#475569',
  },
  placeholderSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
