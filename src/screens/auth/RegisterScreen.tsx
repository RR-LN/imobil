import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useReferralCode } from '../../hooks/useReferralCode';
import { colors, spacing, borderRadius, textStyles, shadows, typography } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signUp, isLoading, error } = useAuthStore();
  const { referralCode, hasReferral } = useReferralCode();

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erro', 'Por favor insere o teu nome completo');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor insere o teu email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A palavra-passe deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As palavras-passe não coincidem');
      return;
    }

    const result = await signUp(
      email.trim().toLowerCase(),
      password,
      fullName.trim(),
      undefined,
      referralCode || undefined
    );

    if (result.error) {
      Alert.alert('Erro ao criar conta', result.error.message || 'Tenta novamente');
    } else {
      Alert.alert(
        'Conta criada!',
        'Verifica o teu email para confirmar a conta.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Background */}
        <View style={styles.decorCircle} />
        <View style={styles.decorLine} />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.charcoal} />
          </TouchableOpacity>
          <Text style={styles.logo}>Imobil</Text>
        </View>

        {/* Referral Banner */}
        {hasReferral && (
          <View style={styles.referralBanner}>
            <View style={styles.referralIcon}>
              <MaterialIcons name="card-giftcard" size={20} color={colors.white} />
            </View>
            <View style={styles.referralTextContainer}>
              <Text style={styles.referralTitle}>Foste convidado por um amigo!</Text>
              <Text style={styles.referralSubtitle}>
                Ganha 200 MZN ao criar a tua conta
              </Text>
            </View>
          </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Junta-te a nós e encontra o espaço ideal.
          </Text>

          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nome completo</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'name' && styles.inputWrapperFocused
            ]}>
              <MaterialIcons name="person-outline" size={20} color={focusedField === 'name' ? colors.terra : colors.lightMid} style={styles.inputIcon} />
              <TextInput
                testID="register-name-input"
                accessibilityLabel="Campo de nome completo"
                accessibilityHint="Insere o teu nome completo"
                style={styles.input}
                placeholder="O teu nome"
                placeholderTextColor={colors.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused
            ]}>
              <MaterialIcons name="mail-outline" size={20} color={focusedField === 'email' ? colors.terra : colors.lightMid} style={styles.inputIcon} />
              <TextInput
                testID="register-email-input"
                accessibilityLabel="Campo de email"
                accessibilityHint="Insere o teu endereço de email"
                style={styles.input}
                placeholder="exemplo@email.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Palavra-passe</Text>
            <View style={[
              styles.passwordWrapper,
              focusedField === 'password' && styles.inputWrapperFocused
            ]}>
              <MaterialIcons name="lock-outline" size={20} color={focusedField === 'password' ? colors.terra : colors.lightMid} style={styles.inputIcon} />
              <TextInput
                testID="register-password-input"
                accessibilityLabel="Campo de palavra-passe"
                accessibilityHint="Insere a tua palavra-passe, mínimo 6 caracteres"
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                testID="toggle-password-visibility-register"
                accessibilityLabel={showPassword ? "Ocultar password" : "Mostrar password"}
                accessibilityHint={showPassword ? "Ocultar characters da password" : "Mostrar characters da password"}
                accessibilityRole="button"
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.lightMid}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar palavra-passe</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'confirm' && styles.inputWrapperFocused
            ]}>
              <MaterialIcons name="lock-outline" size={20} color={focusedField === 'confirm' ? colors.terra : colors.lightMid} style={styles.inputIcon} />
              <TextInput
                testID="register-confirm-password-input"
                accessibilityLabel="Confirmar palavra-passe"
                accessibilityHint="Repete a palavra-passe para confirmar"
                style={styles.input}
                placeholder="Repete a palavra-passe"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            testID="register-button"
            accessibilityLabel="Botão de registo"
            accessibilityHint="Cria uma nova conta com os dados inseridos"
            accessibilityRole="button"
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.forest, colors.forestMid]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.registerButtonGradient}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'A criar...' : 'Criar conta'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            Ao criar uma conta, concordas com os nossos{' '}
            <Text style={styles.termsLink}>Termos de Serviço</Text> e{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text>.
          </Text>

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Já tens uma conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  // Decorative
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.forest + '10',
  },
  decorLine: {
    position: 'absolute',
    top: 120,
    right: spacing.lg,
    width: 40,
    height: 3,
    backgroundColor: colors.forest + '20',
    borderRadius: 2,
  },

  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.xs,
    marginRight: spacing.md,
  },
  logo: {
    ...textStyles.h1,
    letterSpacing: -0.5,
  },

  // Referral Banner
  referralBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forestLight + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.forestLight + '30',
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  referralTextContainer: {
    flex: 1,
  },
  referralTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.forest,
  },
  referralSubtitle: {
    ...textStyles.caption,
    color: colors.forestMid,
  },

  // Form
  formSection: {
    flex: 1,
  },
  title: {
    ...textStyles.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    marginBottom: spacing.xl,
  },

  // Inputs
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...textStyles.label,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    ...shadows.xs,
  },
  inputWrapperFocused: {
    borderColor: colors.terra,
    backgroundColor: colors.paper,
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: textStyles.body.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    height: '100%',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    height: 52,
    ...shadows.xs,
  },
  passwordInput: {
    flex: 1,
    fontFamily: textStyles.body.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.charcoal,
    height: '100%',
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
    height: '100%',
    justifyContent: 'center',
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    ...textStyles.bodySmall,
    color: colors.error,
    flex: 1,
  },

  // Button
  registerButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  registerButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  registerButtonText: {
    ...textStyles.button,
    color: colors.white,
  },

  // Terms
  termsText: {
    ...textStyles.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  termsLink: {
    color: colors.terra,
    fontWeight: '500',
  },

  // Login Link
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  loginText: {
    ...textStyles.bodySmall,
  },
  loginLink: {
    ...textStyles.bodySmall,
    color: colors.terra,
    fontWeight: '600',
  },
});

export default RegisterScreen;
