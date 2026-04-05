import { validateForm, loginSchema, registerSchema, propertyFormSchema, contactFormSchema, bookingFormSchema } from '../src/utils/formValidation';

describe('formValidation', () => {
  describe('loginSchema', () => {
    it('should pass with valid email and password', () => {
      const result = validateForm(
        { email: 'test@example.com', password: 'password123' },
        loginSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail with empty email', () => {
      const result = validateForm(
        { email: '', password: 'password123' },
        loginSchema
      );
      expect(result.success).toBe(false);
      expect(result.errors?.email).toBeDefined();
    });

    it('should fail with invalid email', () => {
      const result = validateForm(
        { email: 'not-an-email', password: 'password123' },
        loginSchema
      );
      expect(result.success).toBe(false);
      expect(result.errors?.email).toBe('Email inválido');
    });

    it('should fail with short password', () => {
      const result = validateForm(
        { email: 'test@example.com', password: '123' },
        loginSchema
      );
      expect(result.success).toBe(false);
    });

    it('should fail with missing fields', () => {
      const result = validateForm({}, loginSchema);
      expect(result.success).toBe(false);
      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.password).toBeDefined();
    });
  });

  describe('registerSchema', () => {
    it('should pass with valid data', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password1',
          passwordConfirm: 'Password1',
        },
        registerSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail when passwords do not match', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password1',
          passwordConfirm: 'Different1',
        },
        registerSchema
      );
      expect(result.success).toBe(false);
      expect(result.errors?.passwordConfirm).toBe('Palavra-passe não coincide');
    });

    it('should fail with weak password (no uppercase)', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password1',
          passwordConfirm: 'password1',
        },
        registerSchema
      );
      expect(result.success).toBe(false);
    });

    it('should fail with weak password (no number)', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password',
          passwordConfirm: 'Password',
        },
        registerSchema
      );
      expect(result.success).toBe(false);
    });

    it('should pass with optional phone', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password1',
          passwordConfirm: 'Password1',
          phone: '+258 84 123 4567',
        },
        registerSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail with invalid phone', () => {
      const result = validateForm(
        {
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'Password1',
          passwordConfirm: 'Password1',
          phone: 'abc',
        },
        registerSchema
      );
      expect(result.success).toBe(false);
    });
  });

  describe('propertyFormSchema', () => {
    it('should pass with valid property data', () => {
      const result = validateForm(
        {
          title: 'Beautiful Villa',
          description: 'A stunning property with ocean views and modern amenities throughout',
          type: 'house',
          transaction: 'sale',
          price: 5000000,
          location: 'Costa do Sol',
          city: 'Maputo',
          area_m2: 250,
          images: ['https://example.com/img1.jpg'],
        },
        propertyFormSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail with short title', () => {
      const result = validateForm(
        {
          title: 'Hi',
          description: 'A stunning property with ocean views and modern amenities throughout',
          type: 'house',
          transaction: 'sale',
          price: 5000000,
          location: 'Costa do Sol',
          city: 'Maputo',
          area_m2: 250,
          images: ['https://example.com/img1.jpg'],
        },
        propertyFormSchema
      );
      expect(result.success).toBe(false);
    });

    it('should fail with zero price', () => {
      const result = validateForm(
        {
          title: 'Beautiful Villa',
          description: 'A stunning property with ocean views and modern amenities throughout',
          type: 'house',
          transaction: 'sale',
          price: 0,
          location: 'Costa do Sol',
          city: 'Maputo',
          area_m2: 250,
          images: ['https://example.com/img1.jpg'],
        },
        propertyFormSchema
      );
      expect(result.success).toBe(false);
    });

    it('should fail with no images', () => {
      const result = validateForm(
        {
          title: 'Beautiful Villa',
          description: 'A stunning property with ocean views and modern amenities throughout',
          type: 'house',
          transaction: 'sale',
          price: 5000000,
          location: 'Costa do Sol',
          city: 'Maputo',
          area_m2: 250,
          images: [],
        },
        propertyFormSchema
      );
      expect(result.success).toBe(false);
    });
  });

  describe('contactFormSchema', () => {
    it('should pass with valid contact data', () => {
      const result = validateForm(
        {
          name: 'Maria Silva',
          email: 'maria@example.com',
          message: 'I am interested in this property, please contact me.',
        },
        contactFormSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail with short message', () => {
      const result = validateForm(
        {
          name: 'Maria Silva',
          email: 'maria@example.com',
          message: 'Hi',
        },
        contactFormSchema
      );
      expect(result.success).toBe(false);
    });
  });

  describe('bookingFormSchema', () => {
    it('should pass with valid booking data', () => {
      const result = validateForm(
        {
          visit_date: '2024-03-15',
          visit_time: '14:00',
        },
        bookingFormSchema
      );
      expect(result.success).toBe(true);
    });

    it('should fail with missing date', () => {
      const result = validateForm(
        { visit_time: '14:00' },
        bookingFormSchema
      );
      expect(result.success).toBe(false);
    });
  });
});
