import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const ONBOARDING_SEEN_KEY = 'kugava-onboarding-seen';

interface Slide {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descKey: string;
  color: string;
}

const slides: Slide[] = [
  {
    icon: 'home-outline',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
    color: '#D4AF37',
  },
  {
    icon: 'calendar-outline',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
    color: '#3B82F6',
  },
  {
    icon: 'trending-up-outline',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
    color: '#22C55E',
  },
  {
    icon: 'shield-checkmark-outline',
    titleKey: 'onboarding.slide4Title',
    descKey: 'onboarding.slide4Desc',
    color: '#8B5CF6',
  },
];

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } catch {
      // ignore
    }
    onComplete();
  }, [onComplete]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipContainer}>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        contentContainerStyle={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <SlideItem
            key={index}
            slide={slide}
            index={index}
            scrollX={scrollX}
            t={t}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
          </Text>
          <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SlideItem({
  slide,
  index,
  scrollX,
  t,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  t: (key: string) => string;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [40, 0, 40],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.slideContent, animatedStyle]}>
        <View style={[styles.iconContainer, { backgroundColor: `${slide.color}15` }]}>
          <Ionicons name={slide.icon} size={64} color={slide.color} />
        </View>
        <Text style={styles.title}>{t(slide.titleKey)}</Text>
        <Text style={styles.description}>{t(slide.descKey)}</Text>
      </Animated.View>
    </View>
  );
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    return seen === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#94A3B8',
  },
  scrollView: {
    flexGrow: 1,
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 28,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    paddingTop: 20,
    gap: 20,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#0F172A',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
