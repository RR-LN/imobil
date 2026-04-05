import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Property } from '../../services/supabase';
import { useTheme } from '../../theme/theme';
import { fontConfig } from '../../constants/fonts';

interface PropertyDetailProps {
  property: Property;
  onBack: () => void;
  onContact: () => void;
  onScheduleVisit: () => void;
}

const { width } = Dimensions.get('window');

export function PropertyDetail({
  property,
  onBack,
  onContact,
  onScheduleVisit,
}: PropertyDetailProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [images, setImages] = useState<string[]>(property.images || []);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Permission to access media library is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('pt-MZ')} ${currency}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <View style={styles.gallery}>
            {images.length > 0 ? (
              <Image
                source={{ uri: images[activeImageIndex] }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.mainImage, styles.imagePlaceholder]}>
                <Ionicons name="image-outline" size={64} color="#CBD5E1" />
              </View>
            )}
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dot,
                      i === activeImageIndex && styles.dotActive,
                    ]}
                    onPress={() => setActiveImageIndex(i)}
                  />
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadImage}>
              <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnails}
              contentContainerStyle={styles.thumbnailsContent}
            >
              {images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.thumbnail,
                    i === activeImageIndex && styles.thumbnailActive,
                  ]}
                  onPress={() => setActiveImageIndex(i)}
                >
                  <Image source={{ uri: img }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.header}>
            <View>
              <Text style={styles.price}>{formatPrice(property.price, property.currency)}</Text>
              <Text style={styles.title}>{property.title}</Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>
                {property.type === 'house'
                  ? t('filters.house')
                  : property.type === 'apartment'
                    ? t('filters.apartment')
                    : t('filters.land')}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.locationText}>
              {property.location}, {property.city}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresGrid}>
            {property.bedrooms != null && (
              <FeatureCard
                icon="bed-outline"
                value={property.bedrooms.toString()}
                label={t('property.bedrooms')}
              />
            )}
            {property.bathrooms != null && (
              <FeatureCard
                icon="water-outline"
                value={property.bathrooms.toString()}
                label={t('property.bathrooms')}
              />
            )}
            {property.parking != null && (
              <FeatureCard
                icon="car-outline"
                value={property.parking.toString()}
                label={t('property.parking')}
              />
            )}
            <FeatureCard
              icon="square-outline"
              value={`${property.area_m2}m²`}
              label={t('property.area')}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('property.description')}</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.contactBtn} onPress={onContact}>
          <Ionicons name="chatbubble-outline" size={20} color="#D4AF37" />
          <Text style={styles.contactText}>{t('property.contact')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scheduleBtn} onPress={onScheduleVisit}>
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.scheduleText}>{t('property.scheduleVisit')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.featureCard}>
      <Ionicons name={icon} size={20} color="#D4AF37" />
      <Text style={styles.featureValue}>{value}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  galleryContainer: {
    backgroundColor: '#FFFFFF',
  },
  gallery: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  thumbnails: {
    maxHeight: 80,
  },
  thumbnailsContent: {
    padding: 12,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#D4AF37',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  details: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  price: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 22,
    color: '#D4AF37',
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    color: '#0F172A',
    marginTop: 4,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 16,
    color: '#0F172A',
  },
  featureLabel: {
    fontSize: 11,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    gap: 8,
  },
  contactText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#D4AF37',
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    gap: 8,
  },
  scheduleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
