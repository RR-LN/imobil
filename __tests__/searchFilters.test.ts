import { applyFilters, getFilterCount, DEFAULT_FILTERS } from '../src/utils/searchFilters';
import { Property } from '../src/services/supabase';

const mockProperties: Property[] = [
  {
    id: '1',
    owner_id: 'owner1',
    title: 'Villa Costa do Sol',
    description: 'Beautiful luxury villa',
    type: 'house',
    transaction: 'sale',
    price: 15000000,
    currency: 'MZN',
    location: 'Costa do Sol',
    city: 'Maputo',
    area_m2: 350,
    bedrooms: 4,
    bathrooms: 3,
    parking: 2,
    images: ['img1.jpg'],
    status: 'active',
    is_featured: true,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    owner_id: 'owner2',
    title: 'Apto Polana',
    description: 'Modern apartment in Polana',
    type: 'apartment',
    transaction: 'rent',
    price: 45000,
    currency: 'MZN',
    location: 'Polana',
    city: 'Maputo',
    area_m2: 120,
    bedrooms: 2,
    bathrooms: 1,
    parking: 1,
    images: ['img2.jpg'],
    status: 'active',
    is_featured: false,
    created_at: '2024-02-10T10:00:00Z',
  },
  {
    id: '3',
    owner_id: 'owner3',
    title: 'Terreno Matola',
    description: 'Large plot of land',
    type: 'land',
    transaction: 'sale',
    price: 3000000,
    currency: 'MZN',
    location: 'Matola',
    city: 'Matola',
    area_m2: 1000,
    bedrooms: null,
    bathrooms: null,
    parking: null,
    images: ['img3.jpg'],
    status: 'active',
    is_featured: false,
    created_at: '2024-03-05T10:00:00Z',
  },
  {
    id: '4',
    owner_id: 'owner4',
    title: 'Casa Sommerschield',
    description: 'Premium house in exclusive area',
    type: 'house',
    transaction: 'sale',
    price: 25000000,
    currency: 'MZN',
    location: 'Sommerschield',
    city: 'Maputo',
    area_m2: 500,
    bedrooms: 5,
    bathrooms: 4,
    parking: 3,
    images: ['img4.jpg'],
    status: 'active',
    is_featured: true,
    created_at: '2024-01-20T10:00:00Z',
  },
];

describe('searchFilters', () => {
  describe('applyFilters', () => {
    it('should return all properties with no filters', () => {
      const result = applyFilters(mockProperties, {});
      expect(result).toHaveLength(4);
    });

    it('should filter by type', () => {
      const result = applyFilters(mockProperties, { type: 'house' });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.type === 'house')).toBe(true);
    });

    it('should filter by transaction', () => {
      const result = applyFilters(mockProperties, { transaction: 'rent' });
      expect(result).toHaveLength(1);
      expect(result[0].transaction).toBe('rent');
    });

    it('should filter by city', () => {
      const result = applyFilters(mockProperties, { city: 'matola' });
      expect(result).toHaveLength(1);
      expect(result[0].city).toBe('Matola');
    });

    it('should filter by min price', () => {
      const result = applyFilters(mockProperties, { minPrice: 10000000 });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.price >= 10000000)).toBe(true);
    });

    it('should filter by max price', () => {
      const result = applyFilters(mockProperties, { maxPrice: 5000000 });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p.price <= 5000000)).toBe(true);
    });

    it('should filter by price range', () => {
      const result = applyFilters(mockProperties, { minPrice: 1000000, maxPrice: 20000000 });
      expect(result).toHaveLength(2);
    });

    it('should filter by min bedrooms', () => {
      const result = applyFilters(mockProperties, { minBedrooms: 4 });
      expect(result).toHaveLength(2);
    });

    it('should filter by min bathrooms', () => {
      const result = applyFilters(mockProperties, { minBathrooms: 3 });
      expect(result).toHaveLength(2);
    });

    it('should filter by area range', () => {
      const result = applyFilters(mockProperties, { minArea: 200, maxArea: 600 });
      expect(result).toHaveLength(2);
    });

    it('should combine multiple filters', () => {
      const result = applyFilters(mockProperties, {
        type: 'house',
        transaction: 'sale',
        city: 'Maputo',
        minBedrooms: 4,
      });
      expect(result).toHaveLength(2);
    });

    it('should sort by newest', () => {
      const result = applyFilters(mockProperties, { sortBy: 'newest' });
      expect(result[0].id).toBe('3');
      expect(result[result.length - 1].id).toBe('1');
    });

    it('should sort by oldest', () => {
      const result = applyFilters(mockProperties, { sortBy: 'oldest' });
      expect(result[0].id).toBe('1');
      expect(result[result.length - 1].id).toBe('3');
    });

    it('should sort by price low to high', () => {
      const result = applyFilters(mockProperties, { sortBy: 'priceLow' });
      expect(result[0].price).toBe(45000);
      expect(result[result.length - 1].price).toBe(25000000);
    });

    it('should sort by price high to low', () => {
      const result = applyFilters(mockProperties, { sortBy: 'priceHigh' });
      expect(result[0].price).toBe(25000000);
      expect(result[result.length - 1].price).toBe(45000);
    });

    it('should return empty array when no matches', () => {
      const result = applyFilters(mockProperties, { type: 'house', city: 'Matola' });
      expect(result).toHaveLength(0);
    });
  });

  describe('getFilterCount', () => {
    it('should return 0 for empty filters', () => {
      expect(getFilterCount({})).toBe(0);
    });

    it('should return 0 for default filters', () => {
      expect(getFilterCount(DEFAULT_FILTERS)).toBe(0);
    });

    it('should count active filters', () => {
      expect(getFilterCount({ type: 'house', minPrice: 1000000 })).toBe(2);
    });

    it('should count all filter types', () => {
      const filters = {
        type: 'house' as const,
        transaction: 'sale' as const,
        city: 'Maputo',
        minPrice: 1000000,
        maxPrice: 20000000,
        minBedrooms: 2,
        maxBedrooms: 5,
        minBathrooms: 1,
        maxBathrooms: 3,
        minArea: 100,
        maxArea: 500,
      };
      expect(getFilterCount(filters)).toBe(11);
    });
  });

  describe('DEFAULT_FILTERS', () => {
    it('should have sortBy set to newest', () => {
      expect(DEFAULT_FILTERS.sortBy).toBe('newest');
    });
  });
});
