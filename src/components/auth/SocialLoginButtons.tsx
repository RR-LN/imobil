import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  isLoading?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGooglePress,
  onApplePress,
  isLoading = false,
}) => {
  const handleGoogle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGooglePress();
  };

  const handleApple = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onApplePress();
  };

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>ou</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.buttons}>
        <Animated.View entering={FadeInUp.delay(100)}>
          <TouchableOpacity
            style={[styles.button, styles.googleButton]}
            onPress={handleGoogle}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={20} color="#5A6B5A" />
            <Text style={styles.buttonText}>Continuar com Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {Platform.OS !== "web" && (
          <Animated.View entering={FadeInUp.delay(200)}>
            <TouchableOpacity
              style={[styles.button, styles.appleButton]}
              onPress={handleApple}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
              <Text style={[styles.buttonText, styles.appleButtonText]}>
                Continuar com Apple
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E4E0",
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#8B988B",
  },
  buttons: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E4E0",
  },
  appleButton: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#5A6B5A",
  },
  appleButtonText: {
    color: "#FFFFFF",
  },
});
