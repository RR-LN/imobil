/**
 * KuGava - Edge Function: validate-property
 *
 * Valida dados de property ANTES de inserir/atualizar no banco
 * Previne: injection, preços negativos, dados corrompidos, spam
 *
 * Como usar:
 * 1. Deploy no Supabase Dashboard → Functions
 * 2. Chamar via API antes de INSERT/UPDATE de properties
 * 3. Passar no body: { data: { ...propertyFields } }
 *
 * Retorna:
 * - 200: { success: true, data: validatedProperty }
 * - 400: { success: false, errors: [{field, message}] }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod/mod.ts";

// Schema Zod — ajusta conforme teus campos reais
const PropertySchema = z.object({
  // Campos obrigatórios
  title: z.string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(100, "Título muito longo (máx. 100)")
    .regex(
      /^[\w\s\-.,!?àèìòùáéíóúãõç'"]+$/,
      "Título contém caracteres inválidos"
    ),

  description: z.string()
    .min(20, "Descrição muito curta (mín. 20 caracteres)")
    .max(2000, "Descrição muito longa (máx. 2000)"),

  price: z.number()
    .positive("Preço deve ser positivo")
    .max(1000000000, "Preço fora do limite suportado"),

  city: z.string()
    .min(2, "Cidade muito curta")
    .max(50, "Nome de cidade muito longo"),

  property_type: z.enum(['house', 'land', 'apartment', 'commercial']),
  transaction: z.enum(['sale', 'rent']),

  // Campos numéricos
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  area_m2: z.number().positive().max(100000).optional(),
  parking: z.number().int().min(0).max(20).optional(),

  // Campos opcionais
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z.string().max(200).optional(), // endereço completo

  // Booleans
  has_pool: z.boolean().optional(),
  has_garden: z.boolean().optional(),
  has_garage: z.boolean().optional(),

  // Imagens
  images: z.array(z.string().url()).max(20, "Máximo 20 imagens").optional(),

  // IMPORTANTE: owner_id DEVE ser igual ao utilizador autenticado
  // Não recebemos owner_id do cliente, definimos no server
  // owner_id: z.string().uuid() // REMOVIDO — server-side only
});

// Response helper
function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

// Error formatter
function formatErrors(errors: z.ZodIssue[]) {
  return errors.map(e => ({
    field: e.path[0]?.toString() || 'unknown',
    message: e.message,
    code: e.code
  }));
}

serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    // 1. Verificar método
    if (req.method !== "POST") {
      return jsonResponse(
        { success: false, error: "Método não permitido. Use POST." },
        405
      );
    }

    // 2. Obter token de autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(
        { success: false, error: "Token de autenticação necessário" },
        401
      );
    }

    // 3. Obter corpo
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return jsonResponse(
        { success: false, error: "Body inválido" },
        400
      );
    }

    const propertyData = body.data;

    if (!propertyData || typeof propertyData !== 'object') {
      return jsonResponse(
        { success: false, error: "Campo 'data' obrigatório" },
        400
      );
    }

    // 4. Validação com Zod
    const validated = PropertySchema.parse(propertyData);

    // 5. Security: 항상 owner_id = utilizador autenticado
    // Não permitimos que o cliente envie owner_id
    validated.owner_id = undefined; // remove se enviado

    // 6. Validações adicionais customizadas
    const errors: Array<{field: string, message: string}> = [];

    // Exemplo: preço mínimo depende do tipo?
    // if (validated.property_type === 'house' && validated.price < 1000000) {
    //   errors.push({ field: 'price', message: 'Casa deve custar mínimo 1M MZN' });
    // }

    // Se houver erros customizados
    if (errors.length > 0) {
      return jsonResponse(
        { success: false, errors },
        400
      );
    }

    // 7. Sucesso!
    const duration = Date.now() - startTime;
    console.log(`✅ validate-property: OK (${duration}ms)`);

    return jsonResponse({
      success: true,
      data: validated,
      meta: { duration }
    });

  } catch (e: any) {
    const duration = Date.now() - startTime;

    // Zod error?
    if (e.errors) {
      console.log(`⚠️ validate-property: validation failed (${duration}ms)`);
      return jsonResponse(
        {
          success: false,
          errors: formatErrors(e.errors)
        },
        400
      );
    }

    // Outro erro
    console.error(`❌ validate-property: ${e.message}`, e);
    return jsonResponse(
      { success: false, error: e.message || "Erro interno" },
      500
    );
  }
});
