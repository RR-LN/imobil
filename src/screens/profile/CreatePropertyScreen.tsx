import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  NativeModules,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { createProperty, uploadPropertyImage, formatPrice } from '../../services/propertiesService';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getContainerMaxWidth } from '../../utils/responsive';

// Detect if running on web
const isWeb = Platform.OS === 'web' || (NativeModules as any)?.ExpoImagePickerModule != null;

type NavigationProp = NativeStackNavigationProp<any>;

// Types
type PropertyType = 'house' | 'apartment' | 'land';
type TransactionType = 'sale' | 'rent';
type City = 'Maputo' | 'Matola' | 'Beira' | 'Nampula';

interface FormData {
  // Step 1
  type: PropertyType;
  transaction: TransactionType;
  title: string;
  description: string;
  price: string;
  // Step 2
  location: string;
  city: City;
  area: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  // Step 3
  images: ImagePicker.ImagePickerAsset[];
}

const INITIAL_FORM_DATA: FormData = {
  type: 'house',
  transaction: 'sale',
  title: '',
  description: '',
  price: '',
  location: '',
  city: 'Maputo',
  area: '',
  bedrooms: 0,
  bathrooms: 0,
  parking: 0,
  images: [],
};

const PROPERTY_TYPES: { id: PropertyType; label: string }[] = [
  { id: 'house', label: 'Casa' },
  { id: 'apartment', label: 'Apartamento' },
  { id: 'land', label: 'Terreno' },
];

const TRANSACTION_TYPES: { id: TransactionType; label: string }[] = [
  { id: 'sale', label: 'Venda' },
  { id: 'rent', label: 'Arrendamento' },
];

const CITIES: City[] = ['Maputo', 'Matola', 'Beira', 'Nampula'];

const MAX_IMAGES = 6;

export const CreatePropertyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const scrollRef = useRef<ScrollView>(null);

  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form field
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Titulo e obrigatorio';
      if (!formData.description.trim()) newErrors.description = 'Descricao e obrigatoria';
      if (!formData.price.trim() || isNaN(Number(formData.price))) {
        newErrors.price = 'Preco valido e obrigatorio';
      }
    }

    if (step === 2) {
      if (!formData.location.trim()) newErrors.location = 'Localizacao e obrigatoria';
      if (!formData.area.trim() || isNaN(Number(formData.area))) {
        newErrors.area = 'Area valida e obrigatoria';
      }
      // Bedrooms/bathrooms only required for house/apartment
      if (formData.type !== 'land') {
        if (formData.bedrooms < 1) newErrors.bedrooms = 'Pelo menos 1 quarto';
        if (formData.bathrooms < 1) newErrors.bathrooms = 'Pelo menos 1 WC';
      }
    }

    if (step === 3) {
      if (formData.images.length === 0) {
        newErrors.images = 'Adiciona pelo menos 1 foto';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      navigation.goBack();
    }
  };

  // Pick image (mobile via ImagePicker, web via HTML input)
  const pickImage = async () => {
    if (formData.images.length >= MAX_IMAGES) {
      Alert.alert('Limite atingido', `Maximo de ${MAX_IMAGES} fotos`);
      return;
    }

    if (isWeb) {
      // Web: use HTML file input
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async (event: any) => {
          const files = event.target.files;
          if (!files || files.length === 0) return;

          const remaining = MAX_IMAGES - formData.images.length;
          const filesToProcess = Math.min(files.length, remaining);

          const newImages: any[] = [];

          for (let i = 0; i < filesToProcess; i++) {
            const file = files[i];
            const base64 = await fileToBase64(file);
            newImages.push({
              uri: base64,
              type: file.type,
              name: file.name,
              width: 0,
              height: 0,
            });
          }

          const updatedImages = [...formData.images, ...newImages].slice(0, MAX_IMAGES);
          updateField('images', updatedImages);
        };
        input.click();
      } catch (error) {
        console.error('Web image picker error:', error);
        Alert.alert('Erro', 'Nao foi possivel selecionar imagens');
      }
      return;
    }

    // Mobile: use Expo ImagePicker
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissao negada', 'Precisa permitir acesso as fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - formData.images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...formData.images, ...result.assets].slice(0, MAX_IMAGES);
      updateField('images', newImages);
    }
  };

  // Helper to convert file to base64 for web
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Take photo (mobile only - not available on web)
  const takePhoto = async () => {
    if (isWeb) {
      Alert.alert('Nao disponivel', 'A camera nao esta disponivel na versao web. Use a galeria instead.');
      return;
    }

    if (formData.images.length >= MAX_IMAGES) {
      Alert.alert('Limite atingido', `Maximo de ${MAX_IMAGES} fotos`);
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissao negada', 'Precisa permitir acesso a camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = [...formData.images, ...result.assets].slice(0, MAX_IMAGES);
      updateField('images', newImages);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  // Move image to first position (set as main)
  const setMainImage = (index: number) => {
    const newImages = [...formData.images];
    const [image] = newImages.splice(index, 1);
    newImages.unshift(image);
    updateField('images', newImages);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    if (!user?.id) {
      Alert.alert('Erro', 'Precisa estar autenticado');
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate a temporary ID for image uploads
      const tempId = `${Date.now()}`;

      // Upload all images
      const imageUrls: string[] = [];
      for (let i = 0; i < formData.images.length; i++) {
        const image = formData.images[i];
        const { url, error: uploadError } = await uploadPropertyImage(image, tempId, i);
        if (uploadError || !url) {
          console.error('Upload error:', uploadError);
          // Continue with other images
        } else {
          imageUrls.push(url);
        }
      }

      // Create property
      const propertyData = {
        owner_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        transaction: formData.transaction,
        price: Number(formData.price),
        currency: 'MZN',
        location: formData.location.trim(),
        city: formData.city,
        area_m2: Number(formData.area),
        bedrooms: formData.type !== 'land' ? formData.bedrooms : null,
        bathrooms: formData.type !== 'land' ? formData.bathrooms : null,
        parking: formData.parking > 0 ? formData.parking : null,
        images: imageUrls,
        status: 'active' as const,
      is_featured: false,
      };

      const { property, error } = await createProperty(user.id, propertyData);

      if (error || !property) {
        Alert.alert('Erro', 'Nao foi possivel publicar o imovel');
        setIsSubmitting(false);
        return;
      }

      Alert.alert('Sucesso', 'Imovel publicado com sucesso!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Erro', 'Ocorreu um erro ao publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render stepper header
  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep > step && styles.stepCircleCompleted,
            ]}
          >
            {currentStep > step ? (
              <Text style={styles.stepCheck}>✓</Text>
            ) : (
              <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </View>
          <Text style={[styles.stepLabel, currentStep >= step && styles.stepLabelActive]}>
            Passo {step}
          </Text>
          {step < 3 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  // Render Step 1: Basic Info
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informacoes Basicas</Text>

      {/* Property Type */}
      <Text style={styles.label}>Tipo de Imovel</Text>
      <View style={styles.pillsContainer}>
        {PROPERTY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[styles.pill, formData.type === type.id && styles.pillActive]}
            onPress={() => updateField('type', type.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, formData.type === type.id && styles.pillTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction Type */}
      <Text style={styles.label}>Transacao</Text>
      <View style={styles.toggleContainer}>
        {TRANSACTION_TYPES.map((t, index) => (
          <TouchableOpacity
            key={t.id}
            style={[
              styles.toggleButton,
              formData.transaction === t.id && styles.toggleButtonActive,
              index === 0 && styles.toggleButtonLeft,
              index === 1 && styles.toggleButtonRight,
            ]}
            onPress={() => updateField('transaction', t.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, formData.transaction === t.id && styles.toggleTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Title */}
      <Text style={styles.label}>Titulo do Anuncio</Text>
      <TextInput
        style={[styles.input, errors.title && styles.inputError]}
        placeholder="ex: Casa T3 com jardim em Sommerschield"
        placeholderTextColor={colors.lightMid}
        value={formData.title}
        onChangeText={(text) => updateField('title', text)}
        maxLength={100}
      />
      {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

      {/* Description */}
      <Text style={styles.label}>Descricao</Text>
      <TextInput
        style={[styles.textArea, errors.description && styles.inputError]}
        placeholder="Descreve o imovel em detalhe..."
        placeholderTextColor={colors.lightMid}
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        multiline
        numberOfLines={4}
        maxLength={1000}
        textAlignVertical="top"
      />
      {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}

      {/* Price */}
      <Text style={styles.label}>Preco (MZN)</Text>
      <View style={styles.priceRow}>
        <TextInput
          style={[styles.priceInput, errors.price && styles.inputError]}
          placeholder="0"
          placeholderTextColor={colors.lightMid}
          value={formData.price}
          onChangeText={(text) => updateField('price', text.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
        />
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyText}>MZN</Text>
        </View>
      </View>
      {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
      {formData.price && (
        <Text style={styles.pricePreview}>
          Preco: {formatPrice(Number(formData.price), 'MZN')}
        </Text>
      )}
    </View>
  );

  // Render Step 2: Details
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Detalhes</Text>

      {/* Location */}
      <Text style={styles.label}>Localizacao / Bairro</Text>
      <TextInput
        style={[styles.input, errors.location && styles.inputError]}
        placeholder="ex: Sommerschield, Polana Cimento"
        placeholderTextColor={colors.lightMid}
        value={formData.location}
        onChangeText={(text) => updateField('location', text)}
        maxLength={100}
      />
      {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}

      {/* City */}
      <Text style={styles.label}>Cidade</Text>
      <View style={styles.pillsContainer}>
        {CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            style={[styles.cityPill, formData.city === city && styles.cityPillActive]}
            onPress={() => updateField('city', city)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cityPillText, formData.city === city && styles.cityPillTextActive]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Area */}
      <Text style={styles.label}>Area (m2)</Text>
      <TextInput
        style={[styles.input, errors.area && styles.inputError]}
        placeholder="ex: 150"
        placeholderTextColor={colors.lightMid}
        value={formData.area}
        onChangeText={(text) => updateField('area', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        maxLength={10}
      />
      {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}

      {/* Bedrooms, Bathrooms, Parking - only for house/apartment */}
      {formData.type !== 'land' && (
        <>
          <Text style={styles.label}>Quartos</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('bedrooms', Math.max(0, formData.bedrooms - 1))}
              activeOpacity={0.8}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formData.bedrooms}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('bedrooms', Math.min(20, formData.bedrooms + 1))}
              activeOpacity={0.8}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.bedrooms && <Text style={styles.errorText}>{errors.bedrooms}</Text>}

          <Text style={styles.label}>Casas de Banho</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('bathrooms', Math.max(0, formData.bathrooms - 1))}
              activeOpacity={0.8}
            >
              <Text style={styles.stepperButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{formData.bathrooms}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updateField('bathrooms', Math.min(10, formData.bathrooms + 1))}
              activeOpacity={0.8}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {errors.bathrooms && <Text style={styles.errorText}>{errors.bathrooms}</Text>}
        </>
      )}

      <Text style={styles.label}>Garagem</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => updateField('parking', Math.max(0, formData.parking - 1))}
          activeOpacity={0.8}
        >
          <Text style={styles.stepperButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{formData.parking}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => updateField('parking', Math.min(10, formData.parking + 1))}
          activeOpacity={0.8}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render Step 3: Photos
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Fotos</Text>
      <Text style={styles.stepSubtitle}>
        Adiciona ate {MAX_IMAGES} fotos. A primeira foto sera a principal.
      </Text>

      {/* Image Grid */}
      <View style={styles.imageGrid}>
        {formData.images.map((image, index) => (
          <TouchableOpacity
            key={image.uri}
            style={styles.imageCard}
            onPress={() => setMainImage(index)}
            onLongPress={() => removeImage(index)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: image.uri }} style={styles.imageThumb} />
            {index === 0 && (
              <View style={styles.mainBadge}>
                <Text style={styles.mainBadgeText}>Principal</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
              activeOpacity={0.8}
            >
              <Text style={styles.removeButtonText}>x</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Add photo button */}
        {formData.images.length < MAX_IMAGES && (
          <TouchableOpacity style={styles.addPhotoCard} onPress={pickImage} activeOpacity={0.8}>
            <Text style={styles.addPhotoIcon}>+</Text>
            <Text style={styles.addPhotoText}>Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}

      {/* Action buttons */}
      <View style={styles.photoActions}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage} activeOpacity={0.8}>
          <Text style={styles.photoButtonIcon}>📷</Text>
          <Text style={styles.photoButtonText}>Galeria</Text>
        </TouchableOpacity>

        {/* Camera button only on mobile */}
        {!isWeb && (
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto} activeOpacity={0.8}>
            <Text style={styles.photoButtonIcon}>📸</Text>
            <Text style={styles.photoButtonText}>Camera</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.photoHint}>
        Toca numa foto para definir como principal. Pressiona longamente para remover.
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, isWeb && styles.containerWeb]}
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }, isWeb && styles.headerWeb]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Imovel</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* STEPPER */}
      {renderStepper()}

      {/* CONTENT */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
          isWeb && styles.scrollContentWeb,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* BOTTOM ACTIONS */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + spacing.md }]}>
        {currentStep < 3 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.9}>
            <Text style={styles.nextButtonText}>Continuar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Publicar Anuncio</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: colors.charcoal,
  },
  headerTitle: {
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '400',
    color: colors.charcoal,
  },

  // STEPPER
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
  },
  stepItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    borderColor: colors.terra,
    backgroundColor: 'rgba(196, 98, 45, 0.1)',
  },
  stepCircleCompleted: {
    backgroundColor: colors.terra,
    borderColor: colors.terra,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.lightMid,
  },
  stepNumberActive: {
    color: colors.terra,
  },
  stepCheck: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: 10,
    color: colors.lightMid,
    marginTop: 4,
  },
  stepLabelActive: {
    color: colors.charcoal,
    fontWeight: '500',
  },
  stepLine: {
    position: 'absolute',
    top: 16,
    left: '60%',
    width: 60,
    height: 2,
    backgroundColor: colors.border,
  },
  stepLineActive: {
    backgroundColor: colors.terra,
  },

  // SCROLL
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },

  // STEP CONTENT
  stepContent: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.lg,
  },
  stepSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
    marginBottom: spacing.lg,
  },

  // FORM
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  inputError: {
    borderColor: '#DC3545',
  },
  errorText: {
    fontSize: typography.sizes.xs,
    color: '#DC3545',
    marginBottom: spacing.sm,
  },
  textArea: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    minHeight: 100,
    marginBottom: spacing.sm,
  },

  // PILLS
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.terra,
    borderColor: colors.terra,
  },
  pillText: {
    fontSize: typography.sizes.sm,
    color: colors.charcoal,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.white,
  },

  // TOGGLE
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleButtonLeft: {
    borderTopLeftRadius: borderRadius.md,
    borderBottomLeftRadius: borderRadius.md,
  },
  toggleButtonRight: {
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.terra,
    borderColor: colors.terra,
  },
  toggleText: {
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: colors.white,
  },

  // PRICE
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
  },
  currencyBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.forest,
    borderRadius: borderRadius.sm,
  },
  currencyText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.white,
  },
  pricePreview: {
    fontSize: typography.sizes.sm,
    color: colors.terra,
    marginTop: spacing.xs,
  },

  // CITY PILLS
  cityPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityPillActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  cityPillText: {
    fontSize: typography.sizes.sm,
    color: colors.charcoal,
    fontWeight: '500',
  },
  cityPillTextActive: {
    color: colors.white,
  },

  // STEPPER (form field)
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 20,
    color: colors.charcoal,
    fontWeight: '300',
  },
  stepperValue: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.charcoal,
    marginHorizontal: spacing.lg,
    minWidth: 40,
    textAlign: 'center',
  },

  // IMAGES
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  imageCard: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.terra,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.white,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '600',
  },
  addPhotoCard: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  addPhotoIcon: {
    fontSize: 28,
    color: colors.lightMid,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
  },

  // PHOTO ACTIONS
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoButtonIcon: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  photoButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.charcoal,
    fontWeight: '500',
  },
  photoHint: {
    fontSize: typography.sizes.xs,
    color: colors.lightMid,
    textAlign: 'center',
  },

  // BOTTOM ACTIONS
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    backgroundColor: colors.charcoal,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  submitButton: {
    backgroundColor: colors.terra,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.white,
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
  scrollContentWeb: {
    paddingHorizontal: spacing.lg,
  },
});

export default CreatePropertyScreen;
