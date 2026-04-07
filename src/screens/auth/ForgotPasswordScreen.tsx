import React, { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "../../theme/theme";
import { supabase } from "../../services/supabase";
import { AuthStackParamList } from "../../navigation/AuthStack";
import * as Haptics from "expo-haptics";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert("Erro", "Por favor introduza o seu email");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: "kugava://reset-password",
        }
      );

      if (error) throw error;

      setIsSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Nao foi possivel enviar o email. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.colors.status.successBg }]}
          >
            <Ionicons
              name="mail-unread"
              size={48}
              color={theme.colors.status.success}
            />
          </View>
          <Text style={styles.successTitle}>Email Enviado!</Text>
          <Text style={styles.successText}>
            Verifique a sua caixa de entrada em {"\n"}
            <Text style={styles.emailHighlight}>{email}</Text>
            {"\n\n"}Se nao receber o email em alguns minutos, verifique a pasta de spam.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary.mid }]}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.buttonText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3A2D" />
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.delay(100)}>
          <Text style={styles.title}>Recuperar Palavra-Passe</Text>
          <Text style={styles.subtitle}>
            Introduza o seu email e enviaremos um link para recuperar a sua conta.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#8B988B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#8B988B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary.mid },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleSendReset}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "A enviar..." : "Enviar Link"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F5F3",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#2D3A2D",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#8B988B",
    lineHeight: 24,
  },
  form: {
    marginTop: 40,
    gap: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#E8E4E0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2D3A2D",
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D3A2D",
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    color: "#8B988B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emailHighlight: {
    fontWeight: "600",
    color: "#5A6B5A",
  },
});
