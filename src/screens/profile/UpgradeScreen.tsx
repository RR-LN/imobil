import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

const UPGRADE_OPTIONS = [
  {
    id: 'agent',
    title: 'Agente Imobiliário',
    icon: '🏘️',
    description: 'Intermedeia vendas e arrendamentos',
    benefits: [
      'Comissão de 2% em cada negócio',
      'Acesso a ferramentas de agente',
      'Dashboard profissional',
      'Suporte prioritário',
    ],
    color: colors.forest,
  },
  {
    id: 'affiliate',
    title: 'Afiliado',
    icon: '💰',
    description: 'Ganha por indicações',
    benefits: [
      '200 MZN por registo',
      '500 MZN por visita confirmada',
      'Comissões em vendas',
      'Link personalizado',
    ],
    color: colors.terra,
  },
];

export const UpgradeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { profile, updateProfile } = useAuthStore();
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedUpgrade) {
      Alert.alert('Seleciona uma opção', 'Escolhe entre Agente ou Afiliado para continuar.');
      return;
    }

    const option = UPGRADE_OPTIONS.find(o => o.id === selectedUpgrade);
    
    Alert.alert(
      `Confirmar Upgrade para ${option?.title}`,
      'Tens a certeza que queres fazer upgrade? Esta ação pode requerer verificação adicional.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsUpgrading(true);
            try {
              // Update role
              const roleValue = selectedUpgrade as 'agent' | 'affiliate';
              await updateProfile({ role: roleValue });
              
              Alert.alert(
                'Upgrade realizado! 🎉',
                `Agora és ${option?.title}. Explora as novas funcionalidades disponíveis.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível fazer o upgrade. Tenta novamente.');
            } finally {
              setIsUpgrading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Fazer Upgrade</Text>
          <Text style={styles.subtitle}>
            Desbloqueia mais funcionalidades e ganha comissões
          </Text>
        </View>

        {/* CURRENT STATUS */}
        <View style={styles.currentStatus}>
          <Text style={styles.currentLabel}>Conta atual:</Text>
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>
              {profile?.role === 'user' ? 'Utilizador' : 
               profile?.role === 'agent' ? 'Agente' : 'Afiliado'}
            </Text>
          </View>
        </View>

        {/* UPGRADE OPTIONS */}
        <View style={styles.optionsContainer}>
          {UPGRADE_OPTIONS.map((option) => {
            const isSelected = selectedUpgrade === option.id;
            const isCurrentRole = (option.id === 'affiliate' && profile?.is_affiliate) || (option.id === 'agent' && profile?.is_seller);
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isCurrentRole && styles.optionCardCurrent,
                ]}
                onPress={() => !isCurrentRole && setSelectedUpgrade(option.id)}
                disabled={isCurrentRole}
                activeOpacity={0.8}
              >
                <View style={styles.optionHeader}>
                  <Text style={styles.optionIcon}>{option.icon}</Text>
                  <View style={styles.optionTitleContainer}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {isCurrentRole ? (
                    <View style={styles.currentTag}>
                      <Text style={styles.currentTagText}>Atual</Text>
                    </View>
                  ) : (
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  )}
                </View>

                <View style={styles.benefitsContainer}>
                  {option.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Text style={styles.benefitIcon}>✓</Text>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* INFO */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Como funciona?</Text>
          <Text style={styles.infoText}>
            Como Agente, podes intermedear vendas e arrendamentos, ganhando uma comissão maior em cada negócio fechado.
          </Text>
          <Text style={styles.infoText}>
            Como Afiliado, ganhas por cada pessoa que se regista através do teu link, além de comissões em vendas.
          </Text>
        </View>

        {/* UPGRADE BUTTON */}
        {selectedUpgrade && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            disabled={isUpgrading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.terra, colors.terraDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>
                {isUpgrading ? 'A processar...' : 'Confirmar Upgrade'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: 'Georgia',
    fontSize: 28,
    fontWeight: '400',
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.mid,
    lineHeight: 22,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  currentLabel: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
    marginRight: spacing.sm,
  },
  currentBadge: {
    backgroundColor: colors.forest + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.forest,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.sm,
  },
  optionCardSelected: {
    borderColor: colors.terra,
    backgroundColor: colors.terra + '05',
  },
  optionCardCurrent: {
    borderColor: colors.forest,
    opacity: 0.7,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  optionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  optionTitleContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
  },
  currentTag: {
    backgroundColor: colors.forest,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  currentTagText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.white,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.terra,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.terra,
  },
  benefitsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: typography.sizes.sm,
    color: colors.forest,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  benefitText: {
    fontSize: typography.sizes.sm,
    color: colors.charcoal,
  },
  infoSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.cream,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '600',
    color: colors.charcoal,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.mid,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  upgradeButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    letterSpacing: 0.02,
  },
});

export default UpgradeScreen;
