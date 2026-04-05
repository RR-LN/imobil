import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export interface AccessibilityConfig {
  reduceMotion: boolean;
  boldText: boolean;
  screenReaderEnabled: boolean;
  fontSize: number;
  isLargeFont: boolean;
}

export async function getAccessibilityConfig(): Promise<AccessibilityConfig> {
  const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
  const boldText = await (AccessibilityInfo.isBoldTextEnabled?.() ?? Promise.resolve(false)).catch(() => false);
  const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled().catch(() => false);
  const fontScale = await (AccessibilityInfo as any).getFontScale?.().catch(() => 1) ?? 1;
  const computedFontSize = Math.round(16 * fontScale);

  return {
    reduceMotion: !!reduceMotion,
    boldText: !!boldText,
    screenReaderEnabled: !!screenReaderEnabled,
    fontSize: computedFontSize,
    isLargeFont: fontScale > 1.2,
  };
}

export function useAccessibility(): AccessibilityConfig {
  const [config, setConfig] = useState<AccessibilityConfig>({
    reduceMotion: false,
    boldText: false,
    screenReaderEnabled: false,
    fontSize: 16,
    isLargeFont: false,
  });

  useEffect(() => {
    getAccessibilityConfig().then(setConfig);

    const motionSub = AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) => {
      setConfig((prev) => ({ ...prev, reduceMotion: !!reduceMotion }));
    });

    const boldSub = AccessibilityInfo.addEventListener?.('boldTextChanged', (boldText) => {
      setConfig((prev) => ({ ...prev, boldText: !!boldText }));
    });

    const screenReaderSub = AccessibilityInfo.addEventListener('screenReaderChanged', (screenReaderEnabled) => {
      setConfig((prev) => ({ ...prev, screenReaderEnabled: !!screenReaderEnabled }));
    });

    return () => {
      motionSub?.remove?.();
      boldSub?.remove?.();
      screenReaderSub?.remove?.();
    };
  }, []);

  return config;
}

export function clampFontSize(baseSize: number, config: AccessibilityConfig): number {
  const min = 12;
  const max = config.isLargeFont ? 28 : 22;
  return Math.max(min, Math.min(max, config.fontSize * (baseSize / 16)));
}

export function getAnimationDuration(baseDuration: number, config: AccessibilityConfig): number {
  if (config.reduceMotion) return 0;
  return baseDuration;
}
