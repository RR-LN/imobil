import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { MapPressEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import debounce from 'lodash/debounce';

import { usePropertiesStore } from '../../store/propertiesStore';
import { Property } from '../../services/supabase';
import { MapSearchBar } from '../../components/map/MapSearchBar';
import { MapPropertyCard } from '../../components/map/MapPropertyCard';
import { PropertyMarker } from '../../components/map/PropertyMarker';
import { useTheme } from '../../theme/theme';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.05;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Default Maputo region
const DEFAULT_REGION: Region = {
  latitude: -25.9692,
  longitude: 32.5732,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

export const MapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  
  const { properties, isLoading, fetchProperties } = usePropertiesStore();
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [isSearchingArea, setIsSearchingArea] = useState(false);

  // Debounced search when map moves
  const searchInArea = useCallback(
    debounce((newRegion: Region) => {
      setIsSearchingArea(true);
      // Here you would fetch properties in the visible region
      // For now, we're using existing properties
      setTimeout(() => setIsSearchingArea(false), 500);
    }, 500),
    []
  );

  const onRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    searchInArea(newRegion);
  };

  const handleMarkerPress = (property: Property) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProperty(property);
  };

  const handleViewDetails = (property: Property) => {
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const handleGetDirections = (property: Property) => {
    // Open maps app with directions
    const lat = -25.9692; // Would come from property
    const lng = 32.5732;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    Alert.alert(
      'Abrir Mapas',
      'Deseja abrir o Google Maps para direcoes?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Abrir', 
          onPress: () => {
            // Linking.openURL(url);
          }
        },
      ]
    );
  };

  const handleSearch = (query: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Geocode and move map to location
    // Would integrate with Google Places API
  };

  const handleNearbySearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Get current location and search nearby
    // Would use expo-location
  };

  const handleRecenter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapRef.current?.animateToRegion(DEFAULT_REGION, 500);
  };

  const handleMapPress = () => {
    if (selectedProperty) {
      setSelectedProperty(null);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={onRegionChangeComplete}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsScale
      >
        {properties.map((property) => (
          <PropertyMarker
            key={property.id}
            property={property}
            isSelected={selectedProperty?.id === property.id}
            onPress={handleMarkerPress}
          />
        ))}
      </MapView>

      {/* Search Bar */}
      <MapSearchBar onSearch={handleSearch} onClear={() => {}} />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleNearbySearch}
        >
          <Ionicons name="locate" size={22} color="#5A6B5A" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleRecenter}
        >
          <Ionicons name="navigate" size={22} color="#5A6B5A" />
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isSearchingArea && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#5A6B5A" />
        </View>
      )}

      {/* Property Card */}
      <MapPropertyCard
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onViewDetails={handleViewDetails}
        onGetDirections={handleGetDirections}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F3',
  },
  map: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    right: 20,
    bottom: 320,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
