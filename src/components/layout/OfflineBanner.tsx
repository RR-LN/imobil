import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useTranslation } from 'react-i18next';

export function OfflineBanner() {
  const { isOnline, queue, isSyncing } = useOfflineQueue();
  const { t } = useTranslation();

  if (isOnline && queue.length === 0 && !isSyncing) return null;

  const message = !isOnline
    ? 'Sem conexão de internet'
    : isSyncing
      ? 'A sincronizar...'
      : `${queue.length} ação(ões) pendente(s)`;

  return (
    <View style={[styles.container, { backgroundColor: !isOnline ? '#EF4444' : '#D4AF37' }]}>
      <Ionicons name={!isOnline ? 'cloud-offline' : 'sync-outline'} size={14} color="#FFFFFF" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  text: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter_500Medium',
  },
});
