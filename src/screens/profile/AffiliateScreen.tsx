import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAffiliateStore } from '../../store/affiliateStore';
import { getReferralLink as getReferralLinkURL, getLevelColor, getLevelName } from '../../services/affiliateService';

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ 
  value, 
  duration = 1200 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    
    const animation = Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: true,
    });

    animation.start();

    const listener = animatedValue.addListener(({ value: animatedVal }) => {
      setDisplayValue(Math.round(animatedVal));
    });

    return () => {
      animatedValue.removeListener(listener);
      animation.stop();
    };
  }, [value, duration]);

  return (
    <Animated.Text style={styles.earningsMain}>
      {displayValue.toLocaleString('pt-PT')}
    </Animated.Text>
  );
};

export const AffiliateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [copied, setCopied] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Usar a store do Zustand
  const {
    stats,
    referrals,
    fetchStats,
    fetchReferrals,
    generateReferralCode,
    copyReferralLink,
    isLoading,
    isInitialized,
    initialize,
    error,
  } = useAffiliateStore();

  // Initialize on first mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Carregar dados quando o ecrã for focado
  useFocusEffect(
    useCallback(() => {
      if (isInitialized) {
        fetchStats();
        fetchReferrals();
      }
    }, [fetchStats, fetchReferrals, isInitialized])
  );

  // Gerar código de referral se não existir
  useEffect(() => {
    if (!stats?.referralCode && !isLoading && isInitialized) {
      generateReferralCode();
    }
  }, [stats?.referralCode, isLoading, isInitialized, generateReferralCode]);

  // Reset first load after initial data
  useEffect(() => {
    if (stats && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [stats, isFirstLoad]);

  const handleCopyLink = useCallback(async () => {
    try {
      await copyReferralLink();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
    }
  }, [copyReferralLink]);

  const handleShare = useCallback(async () => {
    if (!stats?.referralCode) return;

    const link = getReferralLinkURL(stats.referralCode);
    
    try {
      await Share.share({
        message: `Descobre imóveis em Moçambique com o Imobil! Usa o meu link: ${link} 🏡`,
        title: 'Imobil - Partilha o teu link',
      });
    } catch (err) {
      console.error('Erro ao partilhar:', err);
    }
  }, [stats?.referralCode]);

  const referralLink = stats?.referralCode
    ? getReferralLinkURL(stats.referralCode)
    : 'imobil.mz/ref/...';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-PT') + ' MT';
  };

  const levelColor = getLevelColor(stats?.level || 'bronze');

  // Renderizar item de atividade
  const renderActivityItem = (referral: any) => {
    const isCompleted = referral.status === 'completed';
    const isPending = referral.status === 'pending';
    const dotColor = isCompleted ? colors.forestLight : isPending ? '#D4943A' : '#666';
    const value = referral.commission_amount
      ? formatCurrency(referral.commission_amount)
      : null;

    const referredName = referral.referred_user?.full_name || 'Utilizador';
    const propertyName = referral.property?.title || 'Imóvel';

    return (
      <View key={referral.id} style={styles.activityItem}>
        <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
        <View style={styles.activityContent}>
          <Text style={styles.activityText}>
            {isCompleted 
              ? `Comissão: ${propertyName}`
              : isPending
                ? `Novo registo: ${referredName}`
                : 'Cancelado'
            }
          </Text>
          <Text style={styles.activityDate}>
            {new Date(referral.created_at).toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {value && (
          <Text style={styles.activityValue}>{value}</Text>
        )}
      </View>
    );
  };

  // Estado de loading inicial
  if (isLoading && !stats && !isInitialized) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.terra} />
        <Text style={styles.loadingText}>A carregar dados do afiliado...</Text>
      </SafeAreaView>
    );
  }

  // Estado de erro
  if (error && !stats && !isInitialized) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} style={styles.errorIcon} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => initialize()}
        >
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitleLine1}>Painel</Text>
          <Text style={styles.headerTitleLine2}>Afiliado</Text>
          <View style={[styles.levelBadge, { borderColor: levelColor }]}>
            <Text style={[styles.levelBadgeText, { color: levelColor }]}>
              Nível {getLevelName(stats?.level || 'bronze')}
            </Text>
          </View>
        </View>

        {/* MAIN METRIC CARD */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>GANHOS ESTE MÊS</Text>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsValue}>
              {stats ? (
                <>
                  <AnimatedCounter value={stats.monthlyEarnings} />
                  <Text style={styles.earningsSuffix}> MT</Text>
                </>
              ) : (
                <Text style={styles.earningsMain}>0 MT</Text>
              )}
            </Text>
          </View>
          <View style={styles.trendRow}>
            <Text style={styles.trendIcon}>↑</Text>
            <Text style={styles.trendText}>
              {stats ? `${stats.conversionRate.toFixed(1)}%` : '0%'} taxa de conversão
            </Text>
          </View>
        </View>

        {/* METRICS GRID */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Indicações</Text>
            <Text style={styles.metricValue}>
              {stats?.totalReferrals || 0}
            </Text>
            <Text style={styles.metricSubLabel}>total</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Conversões</Text>
            <Text style={styles.metricValue}>
              {stats?.completedReferrals || 0}
            </Text>
            <Text style={styles.metricSubLabel}>concluídas</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Pendentes</Text>
            <Text style={styles.metricValue}>
              {stats?.pendingReferrals || 0}
            </Text>
            <Text style={styles.metricSubLabel}>em progresso</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total acumulado</Text>
            <Text style={styles.metricValueSmall}>
              {stats ? formatCurrency(stats.totalEarnings) : '0 MT'}
            </Text>
            <Text style={styles.metricSubLabel}>ganhos</Text>
          </View>
        </View>

        {/* REFERRAL LINK */}
        <View style={styles.referralSection}>
          <Text style={styles.referralLabel}>O teu link de indicação</Text>
          <View style={styles.referralBox}>
            <Text style={styles.referralText} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity
              style={[
                styles.copyButton,
                copied && styles.copyButtonCopied,
              ]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Text style={styles.copyButtonText}>
                {copied ? 'Copiado ✓' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* SHARE BUTTON */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareIcon}>↗</Text>
            <Text style={styles.shareButtonText}>Partilhar link</Text>
          </TouchableOpacity>

          <Text style={styles.referralHelp}>
            Partilha este link e ganha 200 MZN por cada registo + comissões nas vendas
          </Text>
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.activitySection}>
          <Text style={styles.activityTitle}>Atividade Recente</Text>
          <View style={styles.activityList}>
            {referrals.length > 0 ? (
              referrals.slice(0, 10).map(renderActivityItem)
            ) : (
              <View style={styles.noActivity}>
                <Text style={styles.noActivityText}>
                  Ainda não há atividade recente
                </Text>
                <Text style={styles.noActivitySubtext}>
                  Partilha o teu link para começar a ganhar!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* LEVEL PROGRESS INFO */}
        <View style={styles.levelInfoSection}>
          <Text style={styles.levelInfoTitle}>Progresso de Nível</Text>
          <View style={styles.levelProgressContainer}>
            <LevelProgressItem 
              level="Bronze" 
              color="#CD7F32" 
              current={stats?.level || 'bronze'}
              range="0-5"
            />
            <LevelProgressItem 
              level="Prata" 
              color="#A8A9AD" 
              current={stats?.level || 'bronze'}
              range="6-15"
            />
            <LevelProgressItem 
              level="Ouro" 
              color="#D4AF37" 
              current={stats?.level || 'bronze'}
              range="16-30"
            />
            <LevelProgressItem 
              level="Platina" 
              color="#E5E4E2" 
              current={stats?.level || 'bronze'}
              range="31+"
            />
          </View>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Level Progress Item Component
const LevelProgressItem: React.FC<{
  level: string;
  color: string;
  current: string;
  range: string;
}> = ({ level, color, current, range }) => {
  const isActive = current.toLowerCase() === level.toLowerCase();
  const levelOrder = ['bronze', 'prata', 'ouro', 'platina'];
  const currentIndex = levelOrder.indexOf(current.toLowerCase());
  const itemIndex = levelOrder.indexOf(level.toLowerCase());
  const isPast = currentIndex > itemIndex;

  return (
    <View style={[styles.levelItem, (isActive || isPast) && styles.levelItemActive]}>
      <View style={[styles.levelDot, { backgroundColor: color }, (isActive || isPast) && styles.levelDotActive]} />
      <Text style={[styles.levelName, (isActive || isPast) && styles.levelNameActive]}>
        {level}
      </Text>
      <Text style={styles.levelRange}>{range}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.charcoal,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(250, 246, 239, 0.6)',
    marginTop: spacing.lg,
    fontSize: typography.sizes.md,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorText: {
    color: 'rgba(250, 246, 239, 0.8)',
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.terra,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  // HEADER
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  headerTitleLine1: {
    fontFamily: typography.fontDisplay,
    fontSize: 28,
    fontWeight: typography.weights.light,
    color: 'rgba(250, 246, 239, 0.9)',
    letterSpacing: -0.5,
  },
  headerTitleLine2: {
    fontFamily: typography.fontDisplay,
    fontSize: 28,
    fontWeight: typography.weights.light,
    color: 'rgba(232, 131, 90, 0.9)',
    letterSpacing: -0.5,
    marginLeft: spacing.sm,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    backgroundColor: 'rgba(196, 98, 45, 0.2)',
    borderRadius: borderRadius.sm,
    marginLeft: spacing.lg,
  },
  levelBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.05,
    textTransform: 'uppercase' as const,
  },

  // MAIN METRIC CARD
  mainCard: {
    backgroundColor: 'rgba(250, 246, 239, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(250, 246, 239, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  mainLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: 'rgba(250, 246, 239, 0.4)',
    letterSpacing: 0.08,
    marginBottom: spacing.sm,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  earningsValue: {
    fontFamily: typography.fontDisplay,
    fontSize: 34,
    fontWeight: typography.weights.light,
    color: 'rgba(250, 246, 239, 0.95)',
    letterSpacing: -1,
  },
  earningsMain: {
    fontWeight: typography.weights.bold,
    color: 'rgba(196, 98, 45, 1)',
  },
  earningsSuffix: {
    fontWeight: typography.weights.light,
    color: 'rgba(250, 246, 239, 0.7)',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: typography.sizes.sm,
    color: colors.forestLight,
    marginRight: 4,
  },
  trendText: {
    fontSize: typography.sizes.sm,
    color: colors.forestLight,
    fontWeight: typography.weights.medium,
  },

  // METRICS GRID
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(250, 246, 239, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(250, 246, 239, 0.06)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: 'rgba(250, 246, 239, 0.4)',
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: typography.weights.semibold,
    color: 'rgba(250, 246, 239, 0.95)',
    marginBottom: 2,
  },
  metricValueSmall: {
    fontSize: 16,
    fontWeight: typography.weights.semibold,
    color: 'rgba(250, 246, 239, 0.95)',
    marginBottom: 2,
  },
  metricSubLabel: {
    fontSize: typography.sizes.xxs,
    color: 'rgba(250, 246, 239, 0.3)',
  },

  // REFERRAL LINK
  referralSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  referralLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: 'rgba(250, 246, 239, 0.5)',
    marginBottom: spacing.sm,
  },
  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250, 246, 239, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(250, 246, 239, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  referralText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: 'rgba(250, 246, 239, 0.7)',
    marginRight: spacing.sm,
  },
  copyButton: {
    backgroundColor: colors.terra,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  copyButtonCopied: {
    backgroundColor: colors.forest,
  },
  copyButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 246, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(250, 246, 239, 0.15)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  shareIcon: {
    fontSize: 18,
    color: colors.terra,
    marginRight: spacing.sm,
  },
  shareButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.terra,
  },
  referralHelp: {
    fontSize: typography.sizes.xs,
    color: 'rgba(250, 246, 239, 0.4)',
    marginTop: spacing.sm,
    lineHeight: 18,
  },

  // ACTIVITY SECTION
  activitySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  activityTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: 'rgba(250, 246, 239, 0.6)',
    marginBottom: spacing.md,
  },
  activityList: {
    backgroundColor: 'rgba(250, 246, 239, 0.03)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(250, 246, 239, 0.8)',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: typography.sizes.xxs,
    color: 'rgba(250, 246, 239, 0.4)',
  },
  activityValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.forestLight,
  },
  noActivity: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  noActivityText: {
    fontSize: typography.sizes.md,
    color: 'rgba(250, 246, 239, 0.6)',
    marginBottom: spacing.xs,
  },
  noActivitySubtext: {
    fontSize: typography.sizes.sm,
    color: 'rgba(250, 246, 239, 0.4)',
  },

  // LEVEL PROGRESS
  levelInfoSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  levelInfoTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: 'rgba(250, 246, 239, 0.5)',
    marginBottom: spacing.md,
  },
  levelProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelItem: {
    alignItems: 'center',
    opacity: 0.5,
  },
  levelItemActive: {
    opacity: 1,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: spacing.xs,
  },
  levelDotActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  levelName: {
    fontSize: typography.sizes.xxs,
    color: 'rgba(250, 246, 239, 0.5)',
    marginBottom: 2,
  },
  levelNameActive: {
    color: 'rgba(250, 246, 239, 0.9)',
    fontWeight: typography.weights.semibold,
  },
  levelRange: {
    fontSize: 10,
    color: 'rgba(250, 246, 239, 0.3)',
  },
});

export default AffiliateScreen;
