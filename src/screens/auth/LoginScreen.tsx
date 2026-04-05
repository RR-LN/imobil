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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius, textStyles, shadows, typography } from '../../constants/theme';
import { AuthStackParamList } from '../../navigation/AuthStack';



type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { signIn, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor preencha todos os campos');
      return;
    }

    const result = await signIn(email.trim().toLowerCase(), password);

    if (result.error) {
      Alert.alert('Erro ao entrar', result.error.message || 'Credenciais invalidas');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'web' ? undefined : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing['3xl'] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Decorative Background Elements */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.decorLine} />

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>Imobil</Text>
            <View style={styles.logoUnderline} />
          </View>
          <Text style={styles.tagline}>Encontra o teu espaço ideal</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.formHeader}>
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>
              Inicia sessão para continuar
            </Text>
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
                testID="login-email-input"
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
                testID="login-password-input"
                accessibilityLabel="Campo de palavra-passe"
                accessibilityHint="Insere a tua palavra-passe"
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                testID="toggle-password-visibility"
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

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
            <Text style={styles.forgotPasswordText}>Esqueceste-te da palavra-passe?</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            testID="login-button"
            accessibilityLabel="Botão de entrar"
            accessibilityHint="Inicia sessão com as credenciais inseridas"
            accessibilityRole="button"
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.terra, colors.terraDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButtonGradient}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <View style={styles.progressIndicator} />
                ) : (
                  <Text style={styles.loginButtonText}>Entrar</Text>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Ainda não tens conta? </Text>
            <TouchableOpacity
              testID="register-link"
              accessibilityLabel="Criar conta"
              accessibilityHint="Navega para o formulário de registo"
              accessibilityRole="link"
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Criar conta</Text>
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

  // Decorative Elements
  decorCircle1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.terraMuted,
    opacity: 0.5,
  },
  decorCircle2: {
    position: 'absolute',
    top: 60,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.ochre + '15',
    opacity: 0.4,
  },
  decorLine: {
    position: 'absolute',
    top: 180,
    right: spacing.lg,
    width: 60,
    height: 3,
    backgroundColor: colors.terra,
    borderRadius: 2,
    opacity: 0.3,
  },

  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    ...textStyles.display,
    fontSize: 42,
    letterSpacing: -1,
  },
  logoUnderline: {
    width: 40,
    height: 4,
    backgroundColor: colors.terra,
    borderRadius: 2,
    marginTop: spacing.xs,
  },
  tagline: {
    ...textStyles.bodySmall,
    marginTop: spacing.md,
    color: colors.mid,
    letterSpacing: 0.5,
  },

  // Form
  formSection: {
    flex: 1,
  },
  formHeader: {
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.lightMid,
  },

  // Inputs
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...textStyles.label,
    marginBottom: spacing.sm,
    color: colors.mid,
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

  // Forgot Password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotPasswordText: {
    ...textStyles.bodySmall,
    color: colors.terra,
    fontWeight: '500',
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
  loginButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  loginButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonContent: {
    minWidth: 120,
    alignItems: 'center',
  },
  loginButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  progressIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    borderTopColor: 'transparent',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...textStyles.caption,
    marginHorizontal: spacing.md,
    textTransform: 'lowercase',
  },

  // Register
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
  },
  registerText: {
    ...textStyles.bodySmall,
  },
  registerLink: {
    ...textStyles.bodySmall,
    color: colors.terra,
    fontWeight: '600',
  },
});

export default LoginScreen;
