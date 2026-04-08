import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '../../store/authStore';
import { SocialLoginButtons } from '../../components/auth/SocialLoginButtons';
import { signInWithGoogle, signInWithApple, completeSocialProfile, checkProfileStatus } from '../../services/socialAuthService';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreenNew: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor preencha todos os campos');
      return;
    }

    if (!isLogin && !fullName.trim()) {
      Alert.alert('Erro', 'Por favor introduza o seu nome completo');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      if (isLogin) {
        const result = await signIn(email.trim().toLowerCase(), password);
        if (result.error) {
          Alert.alert('Erro ao entrar', result.error.message);
        }
      } else {
        const result = await signUp(email.trim().toLowerCase(), password, fullName.trim());
        if (result.error) {
          Alert.alert('Erro ao registar', result.error.message);
        } else {
          Alert.alert(
            'Conta Criada!',
            'Verifique o seu email para confirmar a conta.'
          );
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      const { user, error } = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithApple();

      if (error) throw error;

      if (user) {
        // Check if profile needs completion
        const { needsCompletion } = await checkProfileStatus(user.id);
        
        if (needsCompletion && user.user_metadata?.full_name) {
          await completeSocialProfile(user.id, user.user_metadata.full_name);
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Erro',
        `Nao foi possivel entrar com ${provider === 'google' ? 'Google' : 'Apple'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown} style={styles.logoContainer}>
          <Text style={styles.logo}>Kugava</Text>
          <Text style={styles.tagline}>
            {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.form}>
          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#8B988B" />
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor="#8B988B"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#8B988B" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#8B988B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#8B988B" />
            <TextInput
              style={styles.input}
              placeholder="Palavra-passe"
              placeholderTextColor="#8B988B"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#8B988B"
              />
            </TouchableOpacity>
          </View>

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Esqueceu-se da palavra-passe?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleEmailAuth}
            disabled={isLoading}
          >
            <Text style={styles.submitBtnText}>
              {isLoading
                ? 'A processar...'
                : isLogin
                ? 'Entrar'
                : 'Criar Conta'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Social Login */}
        <SocialLoginButtons
          onGooglePress={() => handleSocialLogin('google')}
          onApplePress={() => handleSocialLogin('apple')}
          isLoading={isLoading}
        />

        {/* Toggle */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isLogin ? 'Ainda nao tem conta?' : 'Ja tem conta?'}{' '}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleLink}>
              {isLogin ? 'Registar' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F3',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2D3A2D',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#8B988B',
    marginTop: 8,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    height:
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3A2D',
    paddingVertical: 16,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 14,
    color: '#A67B5B',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#5A6B5A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  toggleText: {
    fontSize: 14,
    color: '#8B988B',
  },
  toggleLink: {
    fontSize: 14,
    color: '#5A6B5A',
    fontWeight: '600',
  },
});
