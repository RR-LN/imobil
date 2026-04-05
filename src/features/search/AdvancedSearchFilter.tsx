import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters, DEFAULT_FILTERS, getFilterCount } from '../../utils/searchFilters';

interface AdvancedSearchFilterProps {
  visible: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  onClose: () => void;
  cities?: string[];
}

export function AdvancedSearchFilter({
  visible,
  filters,
  onApply,
  onClose,
  cities = [],
}: AdvancedSearchFilterProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleOpen = useCallback(() => {
    setLocalFilters({ ...DEFAULT_FILTERS, ...filters });
  }, [filters]);

  React.useEffect(() => {
    if (visible) handleOpen();
  }, [visible, handleOpen]);

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({ ...DEFAULT_FILTERS });
  };

  const filterCount = getFilterCount(localFilters);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('filters.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'basic' && styles.tabActive]}
              onPress={() => setActiveTab('basic')}
            >
              <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>
                {t('filters.basic')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'advanced' && styles.tabActive]}
              onPress={() => setActiveTab('advanced')}
            >
              <Text style={[styles.tabText, activeTab === 'advanced' && styles.tabTextActive]}>
                {t('filters.advanced')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'basic' ? (
              <BasicFilterTab
                filters={localFilters}
                updateFilter={updateFilter}
                t={t}
              />
            ) : (
              <AdvancedFilterTab
                filters={localFilters}
                updateFilter={updateFilter}
                cities={cities}
                t={t}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>{t('filters.clear')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {t('filters.apply')} {filterCount > 0 ? `(${filterCount})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BasicFilterTab({
  filters,
  updateFilter,
  t,
}: {
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  t: (key: string) => string;
}) {
  const propertyTypes: Array<{ key: 'house' | 'apartment' | 'land'; label: string }> = [
    { key: 'house', label: t('filters.house') },
    { key: 'apartment', label: t('filters.apartment') },
    { key: 'land', label: t('filters.land') },
  ];

  const transactions: Array<{ key: 'sale' | 'rent'; label: string }> = [
    { key: 'sale', label: t('filters.sale') },
    { key: 'rent', label: t('filters.rent') },
  ];

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{t('filters.propertyType')}</Text>
      <View style={styles.chipRow}>
        <Chip
          label={t('filters.any')}
          selected={!filters.type}
          onPress={() => updateFilter('type', undefined)}
        />
        {propertyTypes.map((type) => (
          <Chip
            key={type.key}
            label={type.label}
            selected={filters.type === type.key}
            onPress={() => updateFilter('type', type.key)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('filters.transaction')}</Text>
      <View style={styles.chipRow}>
        <Chip
          label={t('filters.any')}
          selected={!filters.transaction}
          onPress={() => updateFilter('transaction', undefined)}
        />
        {transactions.map((tx) => (
          <Chip
            key={tx.key}
            label={tx.label}
            selected={filters.transaction === tx.key}
            onPress={() => updateFilter('transaction', tx.key)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('filters.priceRange')}</Text>
      <View style={styles.rangeRow}>
        <RangeInput
          label={t('filters.min')}
          value={filters.minPrice}
          onChange={(v) => updateFilter('minPrice', v)}
          placeholder="0"
        />
        <RangeInput
          label={t('filters.max')}
          value={filters.maxPrice}
          onChange={(v) => updateFilter('maxPrice', v)}
          placeholder="∞"
        />
      </View>

      <Text style={styles.sectionTitle}>{t('filters.sortBy')}</Text>
      <View style={styles.chipRow}>
        {[
          { key: 'newest' as const, label: t('filters.newest') },
          { key: 'oldest' as const, label: t('filters.oldest') },
          { key: 'priceLow' as const, label: t('filters.priceLow') },
          { key: 'priceHigh' as const, label: t('filters.priceHigh') },
        ].map((sort) => (
          <Chip
            key={sort.key}
            label={sort.label}
            selected={filters.sortBy === sort.key}
            onPress={() => updateFilter('sortBy', sort.key)}
          />
        ))}
      </View>
    </View>
  );
}

function AdvancedFilterTab({
  filters,
  updateFilter,
  cities,
  t,
}: {
  filters: SearchFilters;
  updateFilter: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void;
  cities: string[];
  t: (key: string) => string;
}) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{t('filters.bedrooms')}</Text>
      <View style={styles.counterRow}>
        <CounterButton
          value={filters.minBedrooms ?? 0}
          onChange={(v) => updateFilter('minBedrooms', v)}
          label={t('filters.min')}
        />
        <CounterButton
          value={filters.maxBedrooms ?? 0}
          onChange={(v) => updateFilter('maxBedrooms', v)}
          label={t('filters.max')}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('filters.bathrooms')}</Text>
      <View style={styles.counterRow}>
        <CounterButton
          value={filters.minBathrooms ?? 0}
          onChange={(v) => updateFilter('minBathrooms', v)}
          label={t('filters.min')}
        />
        <CounterButton
          value={filters.maxBathrooms ?? 0}
          onChange={(v) => updateFilter('maxBathrooms', v)}
          label={t('filters.max')}
        />
      </View>

      <Text style={styles.sectionTitle}>{t('filters.area')}</Text>
      <View style={styles.rangeRow}>
        <RangeInput
          label={t('filters.min')}
          value={filters.minArea}
          onChange={(v) => updateFilter('minArea', v)}
          placeholder="0"
        />
        <RangeInput
          label={t('filters.max')}
          value={filters.maxArea}
          onChange={(v) => updateFilter('maxArea', v)}
          placeholder="∞"
        />
      </View>

      {cities.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('filters.city')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('filters.any')}
              selected={!filters.city}
              onPress={() => updateFilter('city', undefined)}
            />
            {cities.map((city) => (
              <Chip
                key={city}
                label={city}
                selected={filters.city === city}
                onPress={() => updateFilter('city', city)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function RangeInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.rangeInput}>
      <Text style={styles.rangeLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.rangeValue}
        onPress={() => onChange(value === undefined ? 0 : undefined)}
      >
        <Text style={styles.rangeValueText}>
          {value !== undefined ? value.toLocaleString() : placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CounterButton({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterControls}>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => onChange(Math.max(0, value - 1))}
        >
          <Ionicons name="remove" size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value || '0'}</Text>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => onChange(value + 1)}
        >
          <Ionicons name="add" size={18} color="#0F172A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 22,
    color: '#0F172A',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
  },
  tabContent: {
    gap: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipSelected: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    fontSize: 13,
    color: '#64748B',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  rangeValue: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rangeValueText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'JetBrainsMono_400Regular',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  counter: {
    flex: 1,
  },
  counterLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  counterBtn: {
    padding: 8,
  },
  counterValue: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono_700Bold',
    color: '#0F172A',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#64748B',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
});
