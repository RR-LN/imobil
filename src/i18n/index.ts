import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import pt from './pt.json';
import es from './es.json';

const STORAGE_KEY = 'kugava-language';

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  es: { translation: es },
};

const getDeviceLanguage = (): string => {
  const locales = Localization.getLocales?.() || [];
  const locale = locales[0];
  if (!locale) return 'pt';
  const tag = locale.languageTag || locale.languageCode || '';
  if (tag.startsWith('pt')) return 'pt';
  if (tag.startsWith('es')) return 'es';
  return 'en';
};

export const initI18n = async () => {
  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore
  }

  const language = savedLanguage || getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore
  }
};

export const getSavedLanguage = async (): Promise<string> => {
  try {
    const lang = await AsyncStorage.getItem(STORAGE_KEY);
    return lang || getDeviceLanguage();
  } catch {
    return getDeviceLanguage();
  }
};

export default i18n;
