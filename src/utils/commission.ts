/**
 * Imobil Commission System
 * 
 * Modelos de comissão:
 * - Modelo A (Agente): 2% do valor do imóvel
 * - Modelo B (Utilizador comum): 0.5% ou 500 MZN (o que for maior)
 * - Bónus de registo: 200 MZN
 * - Bónus de visita confirmada: 500 MZN
 */

export type CommissionType = 'agent' | 'user';
export type CommissionEvent = 'registration' | 'visit' | 'sale' | 'rent';

export interface CommissionCalculation {
  baseAmount: number;
  percentage: number;
  calculatedAmount: number;
  minimumAmount: number;
  finalAmount: number;
  bonusAmount: number;
  totalAmount: number;
  type: CommissionType;
  event: CommissionEvent;
  description: string;
}

/**
 * Calcular comissão para negócio fechado
 * 
 * @param propertyValue - Valor do imóvel em MZN
 * @param commissionType - Tipo de comissão: 'agent' (2%) ou 'user' (0.5%)
 * @returns Objeto com detalhes da comissão
 */
export const calculateCommission = (
  propertyValue: number,
  commissionType: CommissionType = 'user'
): CommissionCalculation => {
  const isAgent = commissionType === 'agent';
  
  // Definir percentagem baseada no tipo
  const percentage = isAgent ? 0.02 : 0.005; // 2% ou 0.5%
  
  // Calcular valor base
  const calculatedAmount = propertyValue * percentage;
  
  // Definir valor mínimo para utilizadores comuns
  const minimumAmount = isAgent ? 0 : 500; // 500 MZN para utilizadores
  
  // Aplicar valor mínimo se necessário
  const finalAmount = isAgent 
    ? calculatedAmount 
    : Math.max(calculatedAmount, minimumAmount);
  
  // Criar descrição
  const description = isAgent
    ? `Comissão de agente (2%) sobre ${propertyValue.toLocaleString('pt-PT')} MZN`
    : `Comissão de utilizador (0.5% ou 500 MZN mín.) sobre ${propertyValue.toLocaleString('pt-PT')} MZN`;

  return {
    baseAmount: propertyValue,
    percentage: percentage * 100,
    calculatedAmount,
    minimumAmount,
    finalAmount,
    bonusAmount: 0,
    totalAmount: finalAmount,
    type: commissionType,
    event: 'sale',
    description,
  };
};

/**
 * Calcular comissão para arrendamento
 * 
 * @param rentValue - Valor da renda em MZN
 * @param commissionType - Tipo de comissão
 * @returns Objeto com detalhes da comissão
 */
export const calculateRentCommission = (
  rentValue: number,
  commissionType: CommissionType = 'user'
): CommissionCalculation => {
  // Para arrendamento, usar mesma lógica mas com descrição diferente
  const commission = calculateCommission(rentValue, commissionType);
  
  return {
    ...commission,
    event: 'rent',
    description: commission.description.replace('sobre', 'sobre renda de'),
  };
};

/**
 * Calcular bónus de registo
 * 
 * @returns Bónus fixo de 200 MZN
 */
export const calculateRegistrationBonus = (): number => {
  return 200; // 200 MZN bónus fixo por registo via link
};

/**
 * Calcular bónus de visita confirmada
 * 
 * @returns Bónus fixo de 500 MZN
 */
export const calculateVisitBonus = (): number => {
  return 500; // 500 MZN bónus fixo por visita confirmada
};

/**
 * Calcular comissão total com bónus
 * 
 * @param propertyValue - Valor do imóvel
 * @param commissionType - Tipo de comissão
 * @param includeRegistrationBonus - Incluir bónus de registo?
 * @param includeVisitBonus - Incluir bónus de visita?
 * @returns Objeto com comissão total e detalhes
 */
export const calculateTotalCommission = (
  propertyValue: number,
  commissionType: CommissionType = 'user',
  includeRegistrationBonus: boolean = false,
  includeVisitBonus: boolean = false
): CommissionCalculation & { totalWithBonuses: number } => {
  const commission = calculateCommission(propertyValue, commissionType);
  
  let totalBonus = 0;
  const bonuses: string[] = [];
  
  if (includeRegistrationBonus) {
    totalBonus += calculateRegistrationBonus();
    bonuses.push('Bónus de registo: 200 MZN');
  }
  
  if (includeVisitBonus) {
    totalBonus += calculateVisitBonus();
    bonuses.push('Bónus de visita: 500 MZN');
  }
  
  return {
    ...commission,
    bonusAmount: totalBonus,
    totalAmount: commission.finalAmount + totalBonus,
    totalWithBonuses: commission.finalAmount + totalBonus,
    description: `${commission.description}${bonuses.length ? ' + ' + bonuses.join(' + ') : ''}`,
  };
};

/**
 * Determinar tipo de comissão baseado no perfil do utilizador
 * 
 * @param userRole - Papel do utilizador: 'agent', 'buyer', 'seller', 'affiliate'
 * @returns 'agent' se for agente, 'user' caso contrário
 */
export const getCommissionTypeByRole = (userRole: string): CommissionType => {
  return userRole === 'agent' ? 'agent' : 'user';
};

/**
 * Formatar valor de comissão para exibição
 * 
 * @param amount - Valor em MZN
 * @param showDecimals - Mostrar casas decimais?
 * @returns String formatada (ex: "12 400 MZN")
 */
export const formatCommission = (amount: number, showDecimals: boolean = false): string => {
  const formatted = amount.toLocaleString('pt-PT', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  
  return `${formatted} MZN`;
};

/**
 * Calcular comissão estimada para um intervalo de preços
 * 
 * @param minValue - Valor mínimo do imóvel
 * @param maxValue - Valor máximo do imóvel
 * @param commissionType - Tipo de comissão
 * @returns Objeto com intervalo de comissão
 */
export const calculateCommissionRange = (
  minValue: number,
  maxValue: number,
  commissionType: CommissionType = 'user'
): { min: number; max: number; minFormatted: string; maxFormatted: string } => {
  const minCommission = calculateCommission(minValue, commissionType);
  const maxCommission = calculateCommission(maxValue, commissionType);
  
  return {
    min: minCommission.finalAmount,
    max: maxCommission.finalAmount,
    minFormatted: formatCommission(minCommission.finalAmount),
    maxFormatted: formatCommission(maxCommission.finalAmount),
  };
};

/**
 * Validar se valor de comissão está correto
 * 
 * @param expected - Valor esperado
 * @param actual - Valor atual
 * @param tolerance - Tolerância em percentagem (default: 1%)
 * @returns true se estiver dentro da tolerância
 */
export const validateCommission = (
  expected: number,
  actual: number,
  tolerance: number = 0.01
): boolean => {
  const diff = Math.abs(expected - actual);
  const allowedDiff = expected * tolerance;
  
  return diff <= allowedDiff;
};

/**
 * Histórico de eventos de comissão
 */
export interface CommissionHistoryItem {
  id: string;
  date: string;
  event: CommissionEvent;
  amount: number;
  propertyValue: number;
  type: CommissionType;
  status: 'pending' | 'completed' | 'cancelled';
  description: string;
}

/**
 * Calcular comissão total do histórico
 * 
 * @param history - Histórico de comissões
 * @returns Comissão total acumulada
 */
export const calculateTotalFromHistory = (
  history: CommissionHistoryItem[]
): number => {
  return history
    .filter(item => item.status === 'completed')
    .reduce((total, item) => total + item.amount, 0);
};

/**
 * Obter resumo de comissões
 * 
 * @param history - Histórico de comissões
 * @returns Objeto com resumo (total, pending, completed count, etc.)
 */
export const getCommissionSummary = (
  history: CommissionHistoryItem[]
): {
  total: number;
  pending: number;
  completed: number;
  cancelled: number;
  totalCount: number;
  pendingCount: number;
  completedCount: number;
} => {
  const summary = {
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalCount: history.length,
    pendingCount: 0,
    completedCount: 0,
  };
  
  history.forEach(item => {
    if (item.status === 'completed') {
      summary.total += item.amount;
      summary.completed += item.amount;
      summary.completedCount++;
    } else if (item.status === 'pending') {
      summary.pending += item.amount;
      summary.pendingCount++;
    } else if (item.status === 'cancelled') {
      summary.cancelled += item.amount;
    }
  });
  
  return summary;
};
