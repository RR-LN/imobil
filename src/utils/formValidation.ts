import { z } from 'zod';

const requiredString = (msg: string) =>
  z.string().min(1, msg);

export const loginSchema = z.object({
  email: requiredString('Email é obrigatório').email('Email inválido'),
  password: requiredString('Palavra-passe é obrigatória').min(6, 'Palavra-passe deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  fullName: requiredString('Nome completo é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: requiredString('Email é obrigatório').email('Email inválido'),
  password: requiredString('Palavra-passe é obrigatória')
    .min(8, 'Palavra-passe deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Palavra-passe deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Palavra-passe deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Palavra-passe deve conter pelo menos um número'),
  passwordConfirm: requiredString('Confirmação de palavra-passe é obrigatória'),
  phone: z.string().optional().refine(
    (val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val),
    { message: 'Número de telefone inválido' }
  ),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Palavra-passe não coincide',
  path: ['passwordConfirm'],
});

export const propertyFormSchema = z.object({
  title: requiredString('Título é obrigatório').min(5, 'Título deve ter pelo menos 5 caracteres').max(100, 'Título deve ter no máximo 100 caracteres'),
  description: requiredString('Descrição é obrigatória').min(20, 'Descrição deve ter pelo menos 20 caracteres').max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
  type: z.enum(['house', 'apartment', 'land']),
  transaction: z.enum(['sale', 'rent']),
  price: z.coerce.number().min(1, 'Preço deve ser maior que zero'),
  currency: z.string().default('MZN'),
  location: requiredString('Localização é obrigatória').min(3, 'Localização deve ter pelo menos 3 caracteres'),
  city: requiredString('Cidade é obrigatória').min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  area_m2: z.coerce.number().min(1, 'Área deve ser maior que zero'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  parking: z.number().int().min(0).optional(),
  images: z.array(z.string()).min(1, 'Pelo menos uma imagem é obrigatória'),
});

export const contactFormSchema = z.object({
  name: requiredString('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: requiredString('Email é obrigatório').email('Email inválido'),
  phone: z.string().optional().refine(
    (val) => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val),
    { message: 'Número de telefone inválido' }
  ),
  message: requiredString('Mensagem é obrigatória').min(10, 'Mensagem deve ter pelo menos 10 caracteres').max(1000, 'Mensagem deve ter no máximo 1000 caracteres'),
});

export const bookingFormSchema = z.object({
  visit_date: requiredString('Data da visita é obrigatória'),
  visit_time: requiredString('Hora da visita é obrigatória'),
  notes: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  email: requiredString('Email é obrigatório').email('Email inválido'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type PropertyFormData = z.infer<typeof propertyFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type BookingFormData = z.infer<typeof bookingFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export interface FormValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

export function validateForm<T extends z.ZodType>(
  data: unknown,
  schema: T
): FormValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (!errors[path]) {
        errors[path] = issue.message;
      }
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

export function validateField<T extends z.ZodType>(
  value: unknown,
  schema: T,
  fieldName: string
): string | null {
  const result = schema.safeParse({ [fieldName]: value });
  if (!result.success) {
    const issue = result.error.issues.find((i) => i.path[0] === fieldName);
    return issue?.message ?? null;
  }
  return null;
}
