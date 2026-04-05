import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { changeLanguage } from '../i18n';

const languages = [
  { code: 'pt', label: 'Português', flag: '🇲🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const handleSelect = async (code: string) => {
    if (code === i18n.language) {
      onClose();
      return;
    }
    setIsChanging(true);
    await changeLanguage(code);
    setIsChanging(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modal} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Idioma</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langRow,
                i18n.language === lang.code && styles.langRowActive,
              ]}
              onPress={() => handleSelect(lang.code)}
              disabled={isChanging}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.langLabel,
                  i18n.language === lang.code && styles.langLabelActive,
                ]}
              >
                {lang.label}
              </Text>
              {i18n.language === lang.code && (
                <Ionicons name="checkmark" size={20} color="#D4AF37" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  langRowActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  flag: {
    fontSize: 24,
  },
  langLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#475569',
  },
  langLabelActive: {
    color: '#0F172A',
    fontFamily: 'Inter_600SemiBold',
  },
});
